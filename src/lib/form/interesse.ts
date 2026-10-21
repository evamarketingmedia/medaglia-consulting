/**
 * `?interesse=` pre-selection — ARCHITECTURE §5.3; CD §E definitive Interesse mapping (option a).
 *
 * Only the four exact values are accepted. Anything else — missing, empty, duplicated,
 * different case, whitespace, unknown, prototype keys, long or unicode input — returns null:
 * safe fallback, no pre-selection, no error message. The parameter value is never written
 * into the page: callers look the radio up in this fixed table.
 */
export const INTERESSE = {
  affiancamento: { radioId: 'interesse-affiancamento', label: 'Affiancamento continuativo' },
  consulenza: { radioId: 'interesse-consulenza', label: 'Consulenza mirata' },
  operativo: { radioId: 'interesse-operativo', label: 'Sviluppo commerciale operativo' },
  formazione: { radioId: 'interesse-formazione', label: 'Formazione' },
} as const;

export type InteresseKey = keyof typeof INTERESSE;

export const INTERESSE_KEYS = Object.keys(INTERESSE) as readonly InteresseKey[];

export function isInteresseKey(value: unknown): value is InteresseKey {
  return typeof value === 'string' && (INTERESSE_KEYS as readonly string[]).includes(value);
}

/** Parse a location.search string ("?interesse=affiancamento"). */
export function parseInteresse(search: string): InteresseKey | null {
  let all: string[];
  try {
    all = new URLSearchParams(search).getAll('interesse');
  } catch {
    return null;
  }
  if (all.length !== 1) return null;
  const value = all[0];
  return isInteresseKey(value) ? value : null;
}

/** The /contatti/ URL for a CTA: clean, or with one of the four allowed values. */
export function contattiHref(interesse?: InteresseKey): string {
  if (interesse === undefined) return '/contatti/';
  if (!isInteresseKey(interesse)) throw new Error(`interesse: ${JSON.stringify(interesse)} is not an allowed value`);
  return `/contatti/?interesse=${interesse}`;
}
