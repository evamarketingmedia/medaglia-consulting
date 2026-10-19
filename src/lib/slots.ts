/**
 * Slot and registry model — ARCHITECTURE-PROPOSAL §11.1, §11.2.
 *
 * This module is executed in two ways:
 *  - by Astro/Vite/Vitest as normal TypeScript;
 *  - directly by Node's native type stripping (scripts/check-release.mjs).
 * It must therefore use erasable TypeScript syntax only (no enums, namespaces,
 * parameter properties) and `.ts` extensions on relative imports.
 *
 * Status of every slot changes only on documented client/owner confirmation;
 * never resolved by the build team (BP D26, §11.2).
 */
import { containsReleaseMarker, foldText } from './release/markers.ts';

/** Release tiers (§11.1). Only 'required' can block a production release. */
export const TIERS = ['required', 'important', 'optional', 'unclassified'] as const;
export type Tier = (typeof TIERS)[number];

/**
 * A content slot.
 * - value:   resolved, with a confirmed value (or a reference to a documented confirmation).
 * - missing: unresolved. `labels` holds the COPY-DRAFT marker text(s) VERBATIM,
 *            e.g. "[MISSING: numero di telefono]". Empty when COPY-DRAFT has no marker
 *            for this item — a marker is never invented.
 * - omitted: a documented owner/client decision not to publish; needs a reason and is
 *            only valid where the item allows omission (`omitAllowed`).
 */
export type Slot<T> =
  | { readonly state: 'value'; readonly value: T }
  | { readonly state: 'missing'; readonly labels: readonly string[] }
  | { readonly state: 'omitted'; readonly reason: string };

/**
 * Approved safe fallback for IMPORTANT / OPTIONAL items (§11.2).
 * `ref` cites the approved decision/wording (CD / BP / SP / owner decision).
 * A fallback is only ever approved wording or omission; never substitute copy.
 */
export type Fallback =
  | { readonly kind: 'omit'; readonly ref: string }
  | { readonly kind: 'approved'; readonly ref: string };

/** One pre-launch registry item (§11.2, §11.4). */
export type RegistryItem<T = unknown> = {
  /** Stable ID from ARCHITECTURE §11.4 (e.g. "R1", "I1", "U5"). Never renumbered. */
  readonly id: string;
  readonly name: string;
  /** Source citation (BP / CD / SP / decision). */
  readonly source: string;
  readonly tier: Tier;
  readonly omitAllowed: boolean;
  readonly slot: Slot<T>;
  /** Required for 'important' and 'optional'; forbidden for 'required'. */
  readonly fallback?: Fallback;
};

export type Registry = {
  /**
   * false while the registry holds only a subset of ARCHITECTURE §11.4.
   * A production release check FAILS on an incomplete registry, so a partial
   * registry can never produce a passing production result.
   */
  readonly complete: boolean;
  readonly items: readonly RegistryItem[];
};

/** Slot constructors — keep literal data terse and type-checked. */
export const slot = {
  value: <T>(value: T): Slot<T> => ({ state: 'value', value }),
  missing: <T = never>(...labels: string[]): Slot<T> => ({ state: 'missing', labels }),
  omitted: <T = never>(reason: string): Slot<T> => ({ state: 'omitted', reason }),
};

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value);
}

/** Result of validating one slot against its item's omission rule. */
export type SlotCheck =
  | { readonly ok: true; readonly resolved: boolean }
  | { readonly ok: false; readonly error: string };

/**
 * Placeholder-only values (S1, F2): the WHOLE normalised value (see placeholderCore) must
 * equal one of these. Never matched as a substring, so ordinary copy that contains such
 * words ("definire", "confermare", "todo", "lorem" in the middle of a sentence) still passes.
 * Bare "na" is deliberately NOT a token ("NA" can be real data); "n/a", "n.a." and "n.d." are.
 */
const PLACEHOLDER_TOKENS: readonly string[] = [
  'tbd',
  'tba',
  'todo',
  'n/a',
  'n.a.',
  'n.d.',
  'nd',
  'null',
  'undefined',
  'false',
  'true',
  'none',
  'placeholder',
  'lorem',
  'tbc',
  'da definire',
  'da confermare',
  'da verificare',
  'in attesa',
  'non disponibile',
];

/**
 * tbd / tba / tbc / todo count as a placeholder PREFIX only when followed (after optional
 * spaces) by ":" or a bracket ("TODO: numero", "[TBD] testo", "TBD: …"). Leading brackets /
 * punctuation are stripped before this test. "Todo Modo srl", "TBD Group S.p.A." pass;
 * so does "TODO numero" (no colon) — accepted consequence of the N2 narrowing.
 */
const PLACEHOLDER_PREFIX = /^(?:tbd|tba|tbc|todo)\s*[:\])]/;

/** Starts with the word "lorem" ("Lorem", "Lorem ipsum dolor …"). */
const LOREM_PREFIX = /^lorem\b/;

/** Runs of x ("x", "xxx") or of 0 ("0", "000") are placeholders. */
const FILLER_RUN = /^(?:x+|0+)$/;

/** A run of 3+ x not inside a word ("+39 XXX XXX XXXX", "XXX-XXX"); "Maxxi" is unaffected (N1). */
const X_RUN = /(?:^|[^\p{L}])x{3,}(?:[^\p{L}]|$)/iu;

/**
 * Masked number (N1): letters/digits only, up to 3 leading digits then only x or only 0.
 * The masked run must be 3+ long (same threshold as X_RUN) so real postal codes such as
 * "20100" / "00100" (3 digits + "00") are not rejected.
 */
const MASKED_NUMBER = /^\d{0,3}(?:x{3,}|0{3,})$/;
const NON_ALNUM = /[^\p{L}\p{N}]/gu;

/** Separators collapsed to one space in the token key ("DA_DEFINIRE", "da.definire", "TBD/TBA"). */
const KEY_SEPARATORS = /[_\-./\s]+/g;

/**
 * Obvious Cyrillic look-alikes of Latin letters (lower-cased forms), used ONLY for the
 * whole-value token comparison so that e.g. "ТВD" / "tоdо" with Cyrillic letters cannot
 * pass as data. Other scripts (Greek, Armenian, mathematical letters NFKC does not fold …)
 * are not mapped (recorded as an F7-type exotic case).
 */
const CYRILLIC_LOOKALIKES: Readonly<Record<string, string>> = {
  'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'п': 'n', 'р': 'p',
  'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ӏ': 'l',
  'һ': 'h', 'ԛ': 'q', 'ԝ': 'w',
};
const CYRILLIC_LOOKALIKE_RE = new RegExp(`[${Object.keys(CYRILLIC_LOOKALIKES).join('')}]`, 'gu');

/** Surrounding punctuation, symbols, brackets, quotes and whitespace (token comparison only). */
const SURROUNDING = /^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** NFKC, invisible characters removed, whitespace collapsed, trimmed, lower-cased. */
function normaliseText(s: string): string {
  return foldText(s).replace(/\s+/g, ' ').trim().toLowerCase();
}

/** The comparison key of a normalised text: surrounding punctuation trimmed, look-alikes mapped. */
function mapLookalikes(text: string): string {
  return text.replace(CYRILLIC_LOOKALIKE_RE, (c) => CYRILLIC_LOOKALIKES[c] ?? c);
}

/** Token comparison key: lower-cased, separators collapsed to one space, surrounding punctuation trimmed. */
function placeholderCore(text: string): string {
  return mapLookalikes(text.toLowerCase().replace(KEY_SEPARATORS, ' ').replace(SURROUNDING, ''));
}

const TOKEN_CORES: ReadonlySet<string> = new Set(PLACEHOLDER_TOKENS.map((t) => placeholderCore(t)));
const TOKEN_WORDS: readonly (readonly string[])[] = [...TOKEN_CORES].map((t) => t.split(' '));

/** True when the key is made ONLY of placeholder tokens joined by separators ("tbd tba"). */
function isTokenSequence(key: string): boolean {
  const words = key.split(' ');
  const ok: boolean[] = new Array<boolean>(words.length + 1).fill(false);
  ok[0] = true;
  for (let i = 0; i < words.length; i += 1) {
    if (!ok[i]) continue;
    for (const tw of TOKEN_WORDS) {
      if (tw.every((w, j) => words[i + j] === w)) ok[i + tw.length] = true;
    }
  }
  return ok[words.length] === true;
}

/** Why a STRING cannot count as data, or null (S1, F2, F4). */
function placeholderString(value: string): string | null {
  const text = normaliseText(value);
  if (text === '') return 'string is empty or whitespace / invisible characters only';
  if (containsReleaseMarker(value) || containsReleaseMarker(text)) return 'string contains a release marker';
  if (!HAS_LETTER_OR_DIGIT.test(text)) return `string has no letters or digits (${JSON.stringify(value)})`;
  const core = placeholderCore(text);
  const lead = mapLookalikes(text.replace(/^[\p{P}\p{S}\s]+/u, ''));
  const mapped = mapLookalikes(text);
  const alnum = mapped.replace(NON_ALNUM, '');
  if (
    TOKEN_CORES.has(core) ||
    isTokenSequence(core) ||
    FILLER_RUN.test(core) ||
    X_RUN.test(mapped) ||
    MASKED_NUMBER.test(alnum) ||
    LOREM_PREFIX.test(core) ||
    PLACEHOLDER_PREFIX.test(lead)
  ) {
    return `string is a placeholder (${JSON.stringify(value)})`;
  }
  return null;
}

/** Bounded recursion for nested values. */
const MAX_VALUE_DEPTH = 8;

/** Plain data containers only: arrays, or objects whose prototype is Object.prototype or null. */
function isPlainContainer(value: object): boolean {
  if (Array.isArray(value)) return Object.getPrototypeOf(value) === Array.prototype;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Walk a structured value; counts meaningful string leaves in `acc`. */
function checkStructured(value: unknown, depth: number, acc: { strings: number }): string | null {
  if (depth > MAX_VALUE_DEPTH) return 'value is nested too deeply';
  if (value === null || value === undefined) return 'value is null or undefined';
  switch (typeof value) {
    case 'string': {
      const why = placeholderString(value);
      if (why === null) acc.strings += 1;
      return why;
    }
    case 'number':
      return Number.isFinite(value) ? null : 'number is not finite';
    case 'boolean':
      return null;
    case 'object': {
      if (!isPlainContainer(value)) {
        return 'only plain objects and arrays are allowed (no boxed primitives, Map, Set, Date or class instances)';
      }
      const isArray = Array.isArray(value);
      const keys = isArray ? [] : Object.keys(value);
      const entries: readonly unknown[] = isArray ? Array.from(value as unknown[]) : keys.map((k) => (value as Record<string, unknown>)[k]);
      if (entries.length === 0) return isArray ? 'array is empty' : 'object is empty';
      for (const [i, entry] of entries.entries()) {
        const why = checkStructured(entry, depth + 1, acc);
        if (why !== null) return `field ${isArray ? `[${i}]` : keys[i] ?? `#${i}`}: ${why}`;
      }
      return null;
    }
    default:
      return `a ${typeof value} is not a resolved value`;
  }
}

/**
 * Why a value cannot count as resolved, or null when it can (S1, F2, F3, F4).
 *
 * Strings (after NFKC, removal of invisible / default-ignorable characters, whitespace
 * collapse, lower-casing) are rejected when they:
 *  - are empty;
 *  - contain a release marker (any case or encoding, §11.5; `.invalid` only as a domain ending);
 *  - contain no letter or digit at all ("—", "–", "___", "?", "…");
 *  - with separators `_ - . /` and whitespace collapsed to one space, surrounding punctuation /
 *    brackets / quotes trimmed (and obvious Cyrillic look-alikes mapped), equal a placeholder
 *    token or a sequence of placeholder tokens ("[TBD]", "TBD.", "\"TBD\"", "N.D.",
 *    "DA_DEFINIRE", "da.verificare", "TBD/TBA" …), are a run of x or 0, or start with the
 *    word "lorem";
 *  - contain a run of 3+ x not inside a word ("+39 XXX XXX XXXX"), or are a masked number
 *    (letters/digits only: up to 3 digits then only x or only 0, e.g. "+39 000 000 0000");
 *  - start with tbd / tba / tbc / todo followed by ":" or a bracket ("TODO: numero", "[TBD] testo").
 * Bare numbers and booleans are not data.
 *
 * Structured values (F3) count as resolved only when they are plain arrays / plain objects
 * (prototype Object.prototype or null) all the way down, contain no empty container, no
 * null / undefined / non-finite number / function / symbol, no empty or placeholder
 * string leaf, AND at least one meaningful string leaf. Numbers and booleans are allowed
 * only alongside that string. Boxed primitives, Map, Set, Date and class instances are rejected.
 */
export function isPlaceholderValue(value: unknown): string | null {
  if (value === null || value === undefined) return 'value is null or undefined';
  switch (typeof value) {
    case 'string':
      return placeholderString(value);
    case 'number':
      return 'a bare number is not a resolved value';
    case 'boolean':
      return 'a bare boolean is not a resolved value';
    case 'object': {
      const acc = { strings: 0 };
      const why = checkStructured(value, 0, acc);
      if (why !== null) return why;
      return acc.strings > 0 ? null : 'structured value has no meaningful text (only numbers / booleans)';
    }
    default:
      return `a ${typeof value} is not a resolved value`;
  }
}

const SLOT_KEYS: Readonly<Record<string, readonly string[]>> = {
  value: ['state', 'value'],
  missing: ['state', 'labels'],
  omitted: ['state', 'reason'],
};

/**
 * Validate a slot at runtime (data may come from anywhere; types are erased).
 * - value:   resolved only when the value is real data (isPlaceholderValue === null).
 * - missing: unresolved; labels must be an array of non-empty strings.
 * - omitted: resolved ONLY if omission is allowed and the reason is real text
 *            (same placeholder rule); otherwise an error, never silently resolved.
 * Each state accepts only its own keys (e.g. `labels` on a value slot is an error).
 */
export function checkSlot(raw: unknown, omitAllowed: boolean): SlotCheck {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'slot is not an object' };
  }
  const s = raw as Record<string, unknown>;
  const state = s['state'];
  const allowed = typeof state === 'string' ? SLOT_KEYS[state] : undefined;
  if (allowed === undefined) return { ok: false, error: `unknown slot state: ${JSON.stringify(state)}` };
  const extra = Object.keys(s).filter((k) => !allowed.includes(k));
  if (extra.length > 0) {
    return { ok: false, error: `slot state '${String(state)}' has unexpected key(s): ${extra.join(', ')}` };
  }
  switch (state) {
    case 'value': {
      if (!('value' in s)) return { ok: false, error: "slot state 'value' has no value" };
      const why = isPlaceholderValue(s['value']);
      if (why !== null) return { ok: false, error: `slot state 'value' is not a real value: ${why}` };
      return { ok: true, resolved: true };
    }
    case 'missing': {
      const labels = s['labels'];
      if (!Array.isArray(labels) || !labels.every((l) => typeof l === 'string' && l.trim() !== '')) {
        return { ok: false, error: "slot state 'missing' needs a labels array of non-empty strings" };
      }
      return { ok: true, resolved: false };
    }
    default: {
      // 'omitted'
      if (!omitAllowed) {
        return { ok: false, error: "slot state 'omitted' is not allowed for this item (omitAllowed is false)" };
      }
      const reason = s['reason'];
      if (typeof reason !== 'string') return { ok: false, error: "slot state 'omitted' needs a non-empty reason" };
      const why = isPlaceholderValue(reason);
      if (why !== null) return { ok: false, error: `slot state 'omitted' needs a real reason: ${why}` };
      return { ok: true, resolved: true };
    }
  }
}
