/**
 * Hidden `origine` field — ARCHITECTURE §5.6 (amendment 1).
 * Same-origin referrer path, only if it is an allow-listed route path; otherwise
 * "diretto" (no referrer) or "esterno". The returned value is always one of the fixed
 * constants below, never text taken from the referrer.
 */
export const ORIGIN_PATHS = [
  '/',
  '/affiancamento-commerciale/',
  '/consulenza-commerciale/',
  '/sviluppo-commerciale-operativo/',
  '/sviluppo-reti-commerciali/',
  '/formazione-commerciale/',
  '/chi-siamo/',
  '/contatti/',
] as const;

export type OriginValue = (typeof ORIGIN_PATHS)[number] | 'diretto' | 'esterno';

export function resolveOrigin(referrer: string, ownOrigin: string): OriginValue {
  if (referrer === '') return 'diretto';
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return 'esterno';
  }
  if (url.origin !== ownOrigin) return 'esterno';
  const match = ORIGIN_PATHS.find((p) => p === url.pathname);
  return match ?? 'esterno';
}
