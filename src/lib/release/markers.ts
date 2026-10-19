/**
 * Release markers — ARCHITECTURE §11.5 (output layer) and §11.2 (slot values).
 *
 * Shared by the slot validator (src/lib/slots.ts) and the output scan
 * (src/lib/release/classify.ts). Pure, erasable TypeScript only: it is also executed
 * by Node's native type stripping (scripts/check-release.mjs).
 */

/** The §11.5 marker list, verbatim. A raw (case-sensitive) match on any of these is a hit. */
export const OUTPUT_MARKERS = [
  '[MISSING',
  '[REVIEW WITH CLIENT]',
  '[COPY REVIEW]',
  '[PRE-LAUNCH]',
  '[DESIGN',
  '[CONDITIONAL',
  '[OPTIONAL',
  'Phase 3 design note',
  '{BASE}',
  '.invalid',
] as const;
export type OutputMarker = (typeof OUTPUT_MARKERS)[number];

/**
 * The same markers as patterns over NORMALISED text (see normaliseForScan: lower-cased,
 * whitespace collapsed). Optional whitespace is allowed after "[" / "{" and before "]" / "}".
 */
export const NORMALISED_MARKER_PATTERNS: readonly (readonly [OutputMarker, RegExp])[] = [
  ['[MISSING', /\[\s*missing/],
  ['[REVIEW WITH CLIENT]', /\[\s*review with client\s*\]/],
  ['[COPY REVIEW]', /\[\s*copy review\s*\]/],
  ['[PRE-LAUNCH]', /\[\s*pre-launch\s*\]/],
  ['[DESIGN', /\[\s*design/],
  ['[CONDITIONAL', /\[\s*conditional/],
  ['[OPTIONAL', /\[\s*optional/],
  ['Phase 3 design note', /phase 3 design note/],
  ['{BASE}', /\{\s*base\s*\}/],
  ['.invalid', /\.invalid(?=[\/\\:?#\s"'<>)\],;]|\.(?![a-z0-9])|$)/],
];

/**
 * `.invalid` is matched ONLY as the reserved top-level domain at the END of a host (F4):
 * followed by a URL/host delimiter (/ \ : ? # whitespace quotes < > ) ] , ;), by a
 * sentence-final "." that does not start another label, or by the end of the text.
 * A substring such as "www.invalidicivili.it" or "invalid.example.it" never matches.
 * The raw variant is case-sensitive (§11.5 raw match); the normalised one runs on
 * lower-cased text.
 */
const RAW_INVALID_TLD = /\.invalid(?=[\/\\:?#\s"'<>)\],;]|\.(?![A-Za-z0-9])|$)/;

/**
 * Invisible / default-ignorable characters removed before matching (F2): every format
 * character (\p{Cf}: zero-width space/joiners, LRM/RLM, U+2061, U+180E, BOM, soft hyphen …),
 * every Default_Ignorable_Code_Point (U+034F, U+115F, U+1160, U+3164, U+FFA0 …) and the
 * blank-looking U+2800 BRAILLE PATTERN BLANK (listed explicitly as well, for clarity).
 */
export const INVISIBLE_CHARS = /[\p{Cf}\p{Default_Ignorable_Code_Point}\u115F\u1160\u3164\uFFA0\u2800]/gu;

/** NFKC (fullwidth / compatibility forms -> plain), invisible characters removed. */
export function foldText(s: string): string {
  return s.normalize('NFKC').replace(INVISIBLE_CHARS, '');
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  lsqb: '[',
  lbrack: '[',
  rsqb: ']',
  rbrack: ']',
  amp: '&',
  nbsp: ' ',
};

function fromCodePoint(n: number, raw: string): string {
  return Number.isInteger(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : raw;
}

function decodeEntitiesOnce(s: string): string {
  return s
    .replace(/&#(\d{1,7});?/g, (raw, d: string) => fromCodePoint(Number.parseInt(d, 10), raw))
    .replace(/&#x([0-9a-f]{1,6});?/gi, (raw, h: string) => fromCodePoint(Number.parseInt(h, 16), raw))
    .replace(/&(lsqb|lbrack|rsqb|rbrack|amp|nbsp);/gi, (raw, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? raw);
}

/** Decode each run of %XX sequences on its own; a malformed run is kept raw (never throws). */
function decodePercentOnce(s: string): string {
  return s.replace(/(?:%[0-9a-f]{2})+/gi, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      return run;
    }
  });
}

/** Bounded: at most this many decode passes (handles e.g. "&amp;#91;" and "%2526"). */
const MAX_DECODE_PASSES = 3;

function decodeBounded(content: string): string {
  let s = content;
  for (let i = 0; i < MAX_DECODE_PASSES; i += 1) {
    const next = decodePercentOnce(decodeEntitiesOnce(s));
    if (next === s) break;
    s = next;
  }
  return s;
}

function tidy(s: string): string {
  return foldText(s).replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Normalise text before marker matching (§11.5, S6):
 * HTML entities (numeric, hex, &lsqb; &lbrack; &rsqb; &rbrack; &amp; &nbsp;) and
 * percent-encoding decoded (bounded passes), tags stripped, NFKC-normalised, invisible /
 * default-ignorable characters removed, whitespace collapsed, lower-cased.
 */
export function normaliseForScan(content: string): string {
  return tidy(decodeBounded(content).replace(/<[^<>]*>/g, ''));
}

/**
 * Markers present in `content`, split by how they were found. The normalised match runs
 * on the decoded text both WITHOUT tags (catches markers split by markup) and WITH tags
 * (catches encoded markers inside attribute values such as href or content).
 */
export function findMarkers(content: string): { raw: OutputMarker[]; normalised: OutputMarker[] } {
  const raw = OUTPUT_MARKERS.filter((m) => (m === '.invalid' ? RAW_INVALID_TLD.test(content) : content.includes(m)));
  const decoded = decodeBounded(content);
  const variants = [tidy(decoded.replace(/<[^<>]*>/g, '')), tidy(decoded)];
  const normalised = NORMALISED_MARKER_PATTERNS.filter(([, re]) => variants.some((v) => re.test(v))).map(([m]) => m);
  return { raw, normalised };
}

/** True when the text contains any release marker, in any encoding or case. */
export function containsReleaseMarker(content: string): boolean {
  const { raw, normalised } = findMarkers(content);
  return raw.length > 0 || normalised.length > 0;
}
