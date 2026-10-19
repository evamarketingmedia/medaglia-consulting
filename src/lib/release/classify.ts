/**
 * Release classification — pure logic for scripts/check-release.mjs (ARCHITECTURE §11.1, §11.5).
 *
 * No I/O here: the script loads the env, the registry and dist/ files and passes them in.
 * Executed both by Vitest and directly by Node's native type stripping, so it uses
 * erasable TypeScript syntax only.
 *
 * Rules (owner decision FRC, 2026-10-19):
 *   REQUIRED unresolved     -> FAIL in production (the only tier that can block)
 *   IMPORTANT unresolved    -> WARNING
 *   OPTIONAL unresolved     -> INFO
 *   UNCLASSIFIED unresolved -> WARNING "UNCLASSIFIED — OWNER REVIEW REQUIRED" (never a failure)
 * Never silently passes: an unloadable, empty, malformed or incomplete registry is a FAIL,
 * and the frozen §11.4.1 REQUIRED contract is enforced independently of `complete`.
 */
import { checkSlot, isTier, type Fallback, type Tier } from '../slots.ts';
import { resolveSiteEnv, type EnvSource } from '../env.ts';
import { validateProductionSiteUrl } from '../site-url.ts';
import { BUILD_RECORD_FILE, validateBuildRecord } from '../build-record.ts';
import { OUTPUT_MARKERS, findMarkers, type OutputMarker } from './markers.ts';

export { OUTPUT_MARKERS };

export const RELEASE_MODES = ['production', 'non-production'] as const;
export type ReleaseMode = (typeof RELEASE_MODES)[number];

export type Outcome = 'FAIL' | 'WARNING' | 'INFO';

export const UNCLASSIFIED_NOTICE = 'UNCLASSIFIED — OWNER REVIEW REQUIRED';
export const NON_PRODUCTION_NOTICE = 'NON-PRODUCTION MODE — NOT A LAUNCH-READINESS RESULT';

// ---- §11.4.1 REQUIRED contract (S2) ---------------------------------------------------

export type ContractEntry = { readonly tier: 'required'; readonly omitAllowed: boolean };

const req = (omitAllowed: boolean): ContractEntry => Object.freeze({ tier: 'required', omitAllowed });

/**
 * The 15 PRE-LAUNCH REQUIRED items of ARCHITECTURE §11.4.1, frozen. Only R7 (PEC/REA,
 * "se applicabile") and R12 (office address / publication) may be omitted with a reason.
 * The registry must contain every one of them with exactly this tier and omitAllowed;
 * `registry.complete` alone is never trusted.
 */
export const REQUIRED_CONTRACT: Readonly<Record<string, ContractEntry>> = Object.freeze({
  R1: req(false),
  R3: req(false),
  R4: req(false),
  R5: req(false),
  R6: req(false),
  R7: req(true),
  R8: req(false),
  R9: req(false),
  R10: req(false),
  R11: req(false),
  R12: req(true),
  R16: req(false),
  R17: req(false),
  R18: req(false),
  R19: req(false),
});

/** Contract violations for raw registry items (absent ID, different tier, different omitAllowed). */
export function checkRequiredContract(items: readonly unknown[]): string[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const raw of items) {
    if (raw === null || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const id = item['id'];
    if (typeof id === 'string' && !byId.has(id)) byId.set(id, item);
  }
  const violations: string[] = [];
  for (const [id, expected] of Object.entries(REQUIRED_CONTRACT)) {
    const item = byId.get(id);
    if (item === undefined) {
      violations.push(`${id}: absent from the registry (REQUIRED, §11.4.1)`);
      continue;
    }
    if (item['tier'] !== expected.tier) {
      violations.push(`${id}: tier is ${JSON.stringify(item['tier'])}, the contract requires "required" (§11.4.1)`);
    }
    if (item['omitAllowed'] !== expected.omitAllowed) {
      violations.push(
        `${id}: omitAllowed is ${JSON.stringify(item['omitAllowed'])}, the contract requires ${String(expected.omitAllowed)} (§11.4.1)`,
      );
    }
  }
  return violations;
}

// ---- Registry items ---------------------------------------------------------------------

/** Tier -> outcome of an UNRESOLVED item (§11.5 table). */
export function outcomeForTier(tier: Tier): Outcome {
  switch (tier) {
    case 'required':
      return 'FAIL';
    case 'important':
      return 'WARNING';
    case 'optional':
      return 'INFO';
    case 'unclassified':
      return 'WARNING';
  }
}

export type Finding = {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier;
  readonly outcome: Outcome;
  /** Human-readable fallback in use (or why there is none). */
  readonly fallback: string;
  readonly source: string;
  readonly labels: readonly string[];
  readonly note?: string;
};

function describeFallback(tier: Tier, fallback: Fallback | undefined): string {
  if (tier === 'required') return 'none — REQUIRED (no safe launch fallback)';
  if (fallback === undefined) return 'none recorded';
  return fallback.kind === 'omit' ? `omit (render nothing) — ${fallback.ref}` : `approved — ${fallback.ref}`;
}

function readFallback(raw: unknown): Fallback | { error: string } | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== 'object') return { error: 'fallback is not an object' };
  const f = raw as Record<string, unknown>;
  const ref = f['ref'];
  if (f['kind'] !== 'omit' && f['kind'] !== 'approved') {
    return { error: `unknown fallback kind: ${JSON.stringify(f['kind'])}` };
  }
  if (typeof ref !== 'string' || ref.trim() === '') return { error: 'fallback needs a non-empty ref' };
  return { kind: f['kind'], ref };
}

type ItemEvaluation =
  | { readonly kind: 'error'; readonly error: string }
  | { readonly kind: 'resolved' }
  | { readonly kind: 'unresolved'; readonly finding: Finding };

/** Evaluate one raw registry item. Any malformed item is an error, never skipped. */
export function evaluateItem(raw: unknown, index: number): ItemEvaluation {
  const where = `registry item #${index}`;
  if (raw === null || typeof raw !== 'object') return { kind: 'error', error: `${where}: not an object` };
  const item = raw as Record<string, unknown>;
  const id = item['id'];
  const label = typeof id === 'string' && id.trim() !== '' ? `${where} (${id})` : where;

  if (typeof id !== 'string' || id.trim() === '') return { kind: 'error', error: `${where}: missing id` };
  const name = item['name'];
  if (typeof name !== 'string' || name.trim() === '') return { kind: 'error', error: `${label}: missing name` };
  const source = item['source'];
  if (typeof source !== 'string' || source.trim() === '') return { kind: 'error', error: `${label}: missing source` };
  const tier = item['tier'];
  // An unknown or absent tier is a data error (e.g. a typo on a REQUIRED item must
  // not silently downgrade it). A deliberately unclassified item uses 'unclassified'.
  if (!isTier(tier)) return { kind: 'error', error: `${label}: invalid tier ${JSON.stringify(tier)}` };
  const omitAllowed = item['omitAllowed'];
  if (typeof omitAllowed !== 'boolean') return { kind: 'error', error: `${label}: omitAllowed must be a boolean` };

  const fallback = readFallback(item['fallback']);
  if (fallback !== undefined && 'error' in fallback) return { kind: 'error', error: `${label}: ${fallback.error}` };
  if (tier === 'required' && fallback !== undefined) {
    return { kind: 'error', error: `${label}: a REQUIRED item must not have a fallback (§11.2)` };
  }
  if ((tier === 'important' || tier === 'optional') && fallback === undefined) {
    return { kind: 'error', error: `${label}: an ${tier.toUpperCase()} item needs an approved fallback (§11.2)` };
  }

  const slotCheck = checkSlot(item['slot'], omitAllowed);
  if (!slotCheck.ok) return { kind: 'error', error: `${label}: ${slotCheck.error}` };
  if (slotCheck.resolved) return { kind: 'resolved' };

  const rawSlot = item['slot'] as { labels: string[] };
  const finding: Finding = {
    id,
    name,
    tier,
    outcome: outcomeForTier(tier),
    fallback: describeFallback(tier, fallback),
    source,
    labels: [...rawSlot.labels],
    ...(tier === 'unclassified' ? { note: UNCLASSIFIED_NOTICE } : {}),
  };
  return { kind: 'unresolved', finding };
}

// ---- Output layer: dist/ analysis (S5, S6) ---------------------------------------------

/**
 * (a) Binary IMAGE and FONT extensions (F6). A file with one of these extensions is excluded
 * from the text scan ONLY when its first bytes carry the format's magic number
 * (looksLikeBinaryMedia); otherwise it is scanned as text, so a text file renamed to .png
 * cannot hide a marker.
 */
export const BINARY_MEDIA_EXTENSIONS: ReadonlySet<string> = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
]);

/**
 * (b) UNSCANNABLE types (F6): archives, compressed files, documents, audio/video and
 * other opaque binaries whose text cannot be checked for markers. Any such file in dist/
 * makes production FAIL unless its exact dist/-relative path is in APPROVED_BINARY_ASSETS.
 */
export const UNSCANNABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  'pdf', 'gz', 'tgz', 'br', 'zst', 'zip', 'svgz', '7z', 'rar', 'tar', 'bz2', 'xz', 'lz', 'lzma', 'z',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'epub',
  'mp4', 'webm', 'mov', 'm4v', 'mp3', 'm4a', 'ogg', 'oga', 'wav', 'flac',
  'wasm', 'jar', 'exe', 'dmg', 'bin',
]);

/**
 * Downloadable / opaque assets approved for publication, by exact dist/-relative path
 * (e.g. "documenti/brochure.pdf"). EMPTY: no downloadable asset is currently approved.
 * Adding an entry requires explicit OWNER APPROVAL of that exact file (its content cannot
 * be checked by the marker scan).
 */
export const APPROVED_BINARY_ASSETS: ReadonlySet<string> = new Set<string>([]);

function extensionOf(path: string): string | undefined {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : undefined;
}

/** True for an image / font extension (any case). The bytes still decide (looksLikeBinaryMedia). */
export function isBinaryPath(path: string): boolean {
  const ext = extensionOf(path);
  return ext !== undefined && BINARY_MEDIA_EXTENSIONS.has(ext);
}

/** True for an archive / compressed / document / opaque extension (any case). */
export function isUnscannablePath(path: string): boolean {
  const ext = extensionOf(path);
  return ext !== undefined && UNSCANNABLE_EXTENSIONS.has(ext);
}

type Magic = readonly (number | null)[];
const ascii = (s: string): Magic => Array.from(s, (c) => c.charCodeAt(0));
const at = (offset: number, m: Magic): Magic => [...(new Array(offset).fill(null) as null[]), ...m];

const FONT_MAGIC: readonly Magic[] = [[0x00, 0x01, 0x00, 0x00], ascii('OTTO'), ascii('true'), ascii('ttcf')];
/** Small magic-number table: extension -> accepted signatures (null = any byte). */
const MEDIA_MAGIC: Readonly<Record<string, readonly Magic[]>> = {
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  gif: [ascii('GIF87a'), ascii('GIF89a')],
  webp: [[...ascii('RIFF'), null, null, null, null, ...ascii('WEBP')]],
  avif: [at(4, ascii('ftypavif')), at(4, ascii('ftypavis'))],
  ico: [[0x00, 0x00, 0x01, 0x00]],
  woff: [ascii('wOFF')],
  woff2: [ascii('wOF2')],
  ttf: FONT_MAGIC,
  otf: FONT_MAGIC,
  eot: [at(34, [0x4c, 0x50])],
};

/**
 * True when a file with an image / font extension really starts with that format's magic
 * bytes. Anything else (wrong or missing signature, any other extension) is NOT treated as
 * binary media and must be scanned as text.
 */
export function looksLikeBinaryMedia(path: string, bytes: Uint8Array): boolean {
  const ext = extensionOf(path);
  const signatures = ext === undefined ? undefined : MEDIA_MAGIC[ext];
  if (signatures === undefined) return false;
  return signatures.some((sig) => sig.length <= bytes.length && sig.every((b, i) => b === null || bytes[i] === b));
}

/**
 * One entry found while walking dist/ (paths relative to dist/, "/"-separated).
 * `content` is the text of every file that must be scanned. The walker omits it only for
 * an unscannable type (archive / document …) or for an image / font whose bytes passed
 * looksLikeBinaryMedia.
 */
export type DistEntry =
  | { readonly path: string; readonly kind: 'file'; readonly content?: string }
  | { readonly path: string; readonly kind: 'symlink' | 'other' };

export type OutputFinding = {
  readonly file: string;
  readonly marker: OutputMarker;
  /** Found as a plain, case-sensitive substring. */
  readonly raw: boolean;
  /** Found after normalisation (entities / percent-decoding / tags / case / whitespace). */
  readonly normalised: boolean;
};

/** Scan text files for leaked markers (raw and normalised). Pure. */
export function scanOutput(files: readonly { readonly path: string; readonly content: string }[]): OutputFinding[] {
  const found: OutputFinding[] = [];
  for (const file of files) {
    const { raw, normalised } = findMarkers(file.content);
    for (const marker of OUTPUT_MARKERS) {
      const r = raw.includes(marker);
      const n = normalised.includes(marker);
      if (r || n) found.push({ file: file.path, marker, raw: r, normalised: n });
    }
  }
  return found;
}

export type PageRobots = { readonly file: string; readonly values: readonly string[] };

const META_TAG = /<meta\b[^>]*>/gi;
/** name=robots in any quote style or unquoted, any case; must be a whole attribute. */
const ROBOTS_NAME = /(?<=[\s"'/])name\s*=\s*(?:"\s*robots\s*"|'\s*robots\s*'|robots(?=[\s/>]|$))/i;
/** content="…" / '…' / unquoted. */
const CONTENT_ATTR = /(?<=[\s"'/])content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

/**
 * Every <meta name="robots"> of an HTML document, its content normalised to "a, b"
 * (tokens trimmed, lower-cased). Attribute order, quote style (double, single, none) and
 * the case of the name are all accepted. A robots meta without a content attribute yields "".
 */
export function extractRobots(html: string): string[] {
  const values: string[] = [];
  for (const tag of html.match(META_TAG) ?? []) {
    if (!ROBOTS_NAME.test(tag)) continue;
    const m = CONTENT_ATTR.exec(tag);
    const content = m === null ? '' : (m[1] ?? m[2] ?? m[3] ?? '');
    values.push(
      content
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t !== '')
        .join(', '),
    );
  }
  return values;
}

/**
 * Robots values a PRODUCTION page may carry (F9): the declared policies of
 * src/lib/seo/meta.ts except the preview value "noindex, nofollow" (reported separately).
 */
export const PRODUCTION_ROBOTS_VALUES: readonly string[] = ['index, follow', 'noindex, follow'];

/** Production problems of one page's robots metas: exactly one, with an approved value. */
export function robotsProblems(page: PageRobots): string[] {
  if (page.values.length === 0) return [`${page.file}: no <meta name="robots"> (every production page needs exactly one)`];
  if (page.values.length > 1) {
    return [`${page.file}: ${page.values.length} <meta name="robots"> tags (${page.values.map((v) => JSON.stringify(v)).join(', ')}); exactly one is allowed`];
  }
  const value = page.values[0] ?? '';
  if (isNoindexNofollow(value)) {
    return [`${page.file}: robots "${value}" is the preview/non-production value (production noindex pages use "noindex, follow")`];
  }
  if (!PRODUCTION_ROBOTS_VALUES.includes(value)) {
    return [`${page.file}: robots ${JSON.stringify(value)} is not an approved value (${PRODUCTION_ROBOTS_VALUES.join(' | ')})`];
  }
  return [];
}

/** The env-forced preview value (or its "none" equivalent) — never allowed in production output. */
export function isNoindexNofollow(value: string): boolean {
  const tokens = value.split(',').map((t) => t.trim());
  return tokens.includes('none') || (tokens.includes('noindex') && tokens.includes('nofollow'));
}

export type BuildRecordState =
  | { readonly present: false }
  | { readonly present: true; readonly parseError: string }
  | { readonly present: true; readonly parsed: unknown };

export type DistScan = {
  /** Regular files found (text + binary). */
  readonly fileCount: number;
  readonly scannedCount: number;
  readonly htmlFiles: readonly string[];
  readonly hasIndexHtml: boolean;
  readonly markers: readonly OutputFinding[];
  readonly robots: readonly PageRobots[];
  readonly buildRecord: BuildRecordState;
  /** Symlinks, special files, unreadable text, unapproved unscannable files — the output cannot be fully verified. */
  readonly problems: readonly string[];
};

/**
 * Turn the walked dist/ entries into a DistScan. Pure. `approvedBinaryAssets` defaults to
 * APPROVED_BINARY_ASSETS (empty); tests pass their own set to exercise the mechanism.
 */
export function analyseDist(entries: readonly DistEntry[], approvedBinaryAssets: ReadonlySet<string> = APPROVED_BINARY_ASSETS): DistScan {
  const problems: string[] = [];
  const texts: { path: string; content: string }[] = [];
  const htmlFiles: string[] = [];
  const robots: PageRobots[] = [];
  let fileCount = 0;
  let buildRecord: BuildRecordState = { present: false };

  for (const e of entries) {
    if (e.kind !== 'file') {
      problems.push(e.kind === 'symlink' ? `symlink in dist/ is not allowed: ${e.path}` : `non-regular file in dist/: ${e.path}`);
      continue;
    }
    fileCount += 1;
    if (isUnscannablePath(e.path)) {
      if (!approvedBinaryAssets.has(e.path)) {
        problems.push(`unscannable file in dist/ (archive / compressed / document type; not in APPROVED_BINARY_ASSETS): ${e.path}`);
      }
      continue;
    }
    // Image / font: the walker leaves content out only after the magic-byte check passed.
    if (isBinaryPath(e.path) && e.content === undefined) continue;
    if (e.content === undefined) {
      problems.push(`text file was not read: ${e.path}`);
      continue;
    }
    texts.push({ path: e.path, content: e.content });
    if (/\.html?$/i.test(e.path)) {
      htmlFiles.push(e.path);
      robots.push({ file: e.path, values: extractRobots(e.content) });
    }
    if (e.path === BUILD_RECORD_FILE) {
      try {
        buildRecord = { present: true, parsed: JSON.parse(e.content) as unknown };
      } catch (err) {
        buildRecord = { present: true, parseError: err instanceof Error ? err.message : String(err) };
      }
    }
  }
  return {
    fileCount,
    scannedCount: texts.length,
    htmlFiles,
    hasIndexHtml: htmlFiles.includes('index.html'),
    markers: scanOutput(texts),
    robots,
    buildRecord,
    problems,
  };
}

/** Production blockers from the build record (S3): present, valid, production, valid origin, env agreement. */
export function checkBuildRecord(state: BuildRecordState, siteUrlFromEnv: string | undefined): string[] {
  if (!state.present) return [`build record dist/${BUILD_RECORD_FILE} is missing (stale or foreign build output)`];
  if ('parseError' in state) return [`build record dist/${BUILD_RECORD_FILE} is not valid JSON: ${state.parseError}`];
  const v = validateBuildRecord(state.parsed);
  if (!v.ok) return v.errors.map((e) => `invalid ${e}`);
  const problems: string[] = [];
  if (v.record.siteEnv !== 'production') {
    problems.push(`build record siteEnv is ${JSON.stringify(v.record.siteEnv)}: dist/ is not a production build`);
  }
  const origin = validateProductionSiteUrl(v.record.siteOrigin);
  if (!origin.ok) problems.push(`build record siteOrigin: ${origin.error}`);
  if (siteUrlFromEnv !== undefined && siteUrlFromEnv !== '' && siteUrlFromEnv !== v.record.siteOrigin) {
    problems.push(
      `build record siteOrigin ${JSON.stringify(v.record.siteOrigin)} does not match SITE_URL ${JSON.stringify(siteUrlFromEnv)} in the current environment`,
    );
  }
  return problems;
}

/** Production blockers from the output layer (S5, S6, F6, F9). `null` = dist/ unavailable. */
export function outputBlockers(output: DistScan | null | undefined, unavailableReason: string | undefined, siteUrlFromEnv: string | undefined): string[] {
  if (output == null) {
    return [`build output (dist/) not available — ${unavailableReason ?? 'not scanned'}; output layer could not be verified`];
  }
  const blockers: string[] = [...output.problems];
  if (output.htmlFiles.length === 0) blockers.push('dist/ contains no HTML files');
  if (!output.hasIndexHtml) blockers.push('dist/index.html is missing');
  blockers.push(...checkBuildRecord(output.buildRecord, siteUrlFromEnv));
  for (const page of output.robots) blockers.push(...robotsProblems(page));
  for (const o of output.markers) {
    const how = o.raw && o.normalised ? 'raw+normalised' : o.raw ? 'raw' : 'normalised';
    blockers.push(`leaked marker ${JSON.stringify(o.marker)} (${how}) in ${o.file}`);
  }
  return blockers;
}

// ---- The check ---------------------------------------------------------------------------

export type ReleaseResult = {
  readonly mode: ReleaseMode;
  /** Structural problems: registry unloadable/empty/invalid, invalid mode. Fail in every mode. */
  readonly errors: readonly string[];
  /** Unresolved registry items, in registry order. */
  readonly findings: readonly Finding[];
  /** §11.4.1 contract violations (FAIL in production, reported in non-production). */
  readonly contractViolations: readonly string[];
  /** Output-layer scan (null when dist/ was not available). */
  readonly output: DistScan | null;
  /** Number of registry items checked (resolved + unresolved). */
  readonly checked: number;
  readonly registryComplete: boolean;
  /** Everything that blocks a production release (applied as failures only in production). */
  readonly productionBlockers: readonly string[];
  /** Reasons the run fails (exit non-zero). Empty means exit 0. */
  readonly failures: readonly string[];
  readonly exitCode: 0 | 1;
};

export type ReleaseInput = {
  readonly mode: ReleaseMode;
  /** The loaded registry module export, or undefined if loading failed. */
  readonly registry: unknown;
  /** Error raised while loading the registry, if any. */
  readonly loadError?: string;
  /** Output-layer analysis, or null when dist/ is missing / not a directory. */
  readonly output: DistScan | null;
  readonly outputUnavailableReason?: string;
  /** SITE_URL of the environment the check runs in (compared with the build record). */
  readonly siteUrl?: string;
};

/** Apply §11.1 / §11.5 to a registry and an output scan. Pure. */
export function runReleaseCheck(input: ReleaseInput): ReleaseResult {
  const errors: string[] = [];
  // Defence in depth (minimal D3 touch): an unknown mode is never treated as non-production.
  const modeValid = (RELEASE_MODES as readonly unknown[]).includes(input.mode);
  const mode: ReleaseMode = modeValid ? input.mode : 'production';
  if (!modeValid) errors.push(`invalid release mode ${JSON.stringify(input.mode)}`);

  const findings: Finding[] = [];
  let contractViolations: string[] = [];
  let checked = 0;
  let registryComplete = false;

  if (input.loadError !== undefined) {
    errors.push(`registry could not be loaded: ${input.loadError}`);
  } else if (input.registry === null || typeof input.registry !== 'object') {
    errors.push('registry is missing or not an object');
  } else {
    const reg = input.registry as Record<string, unknown>;
    const items = reg['items'];
    if (typeof reg['complete'] !== 'boolean') {
      errors.push('registry.complete must be a boolean');
    } else {
      registryComplete = reg['complete'];
    }
    if (!Array.isArray(items)) {
      errors.push('registry.items is not an array');
    } else if (items.length === 0) {
      errors.push('registry is empty — refusing to pass');
    } else {
      const seen = new Set<string>();
      items.forEach((raw, i) => {
        const ev = evaluateItem(raw, i);
        if (ev.kind === 'error') {
          errors.push(ev.error);
          return;
        }
        const id = (raw as { id: string }).id;
        if (seen.has(id)) {
          errors.push(`duplicate registry id: ${id}`);
          return;
        }
        seen.add(id);
        checked += 1;
        if (ev.kind === 'unresolved') findings.push(ev.finding);
      });
      contractViolations = checkRequiredContract(items);
    }
  }

  const productionBlockers: string[] = [];
  for (const f of findings) {
    if (f.outcome === 'FAIL') productionBlockers.push(`REQUIRED item unresolved: ${f.id} ${f.name}`);
  }
  for (const v of contractViolations) productionBlockers.push(`REQUIRED contract: ${v}`);
  if (errors.length === 0 && !registryComplete) {
    productionBlockers.push('registry is marked incomplete (subset of ARCHITECTURE §11.4) — cannot certify a production release');
  }
  productionBlockers.push(...outputBlockers(input.output, input.outputUnavailableReason, input.siteUrl));

  // Structural errors fail in EVERY mode: a check that cannot read its input must not pass.
  const failures = errors.map((e) => `ERROR: ${e}`);
  if (mode === 'production') failures.push(...productionBlockers);

  return {
    mode,
    errors,
    findings,
    contractViolations,
    output: input.output ?? null,
    checked,
    registryComplete,
    productionBlockers,
    failures,
    exitCode: failures.length > 0 ? 1 : 0,
  };
}

// ---- Mode -----------------------------------------------------------------------------------

/**
 * Parse CLI args + env into a mode. Unknown values are rejected (never guessed).
 * The env goes through the shared resolveSiteEnv (S8): an invalid PUBLIC_SITE_ENV or a
 * CONTEXT conflict is an error. Stricter wins: production if the flag OR the env says so.
 */
export function resolveMode(
  argv: readonly string[],
  env: EnvSource,
): { ok: true; mode: ReleaseMode; reason: string } | { ok: false; error: string } {
  let cliMode: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith('--mode=')) {
      if (cliMode !== undefined) return { ok: false, error: '--mode given more than once' };
      cliMode = arg.slice('--mode='.length);
    } else {
      return { ok: false, error: `unknown argument: ${arg}` };
    }
  }
  if (cliMode !== undefined && cliMode !== 'production' && cliMode !== 'non-production') {
    return { ok: false, error: `unknown --mode value: ${JSON.stringify(cliMode)} (use production or non-production)` };
  }
  const envResult = resolveSiteEnv(env);
  if (!envResult.ok) return { ok: false, error: envResult.error };
  if (cliMode === 'production') return { ok: true, mode: 'production', reason: '--mode=production' };
  if (envResult.siteEnv === 'production') return { ok: true, mode: 'production', reason: envResult.reason };
  return { ok: true, mode: 'non-production', reason: cliMode === undefined ? envResult.reason : '--mode=non-production' };
}
