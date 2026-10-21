/**
 * Phone formatting — ARCHITECTURE §4 (PhoneLink), SP F.9, SP E.1 (`telephone`).
 *
 * The phone is stored in facts.ts exactly as verified (display form, e.g. "0039 334 1201847").
 * The machine forms are DERIVED mechanically, never typed by hand:
 *   - remove spaces and common separators ( . - / ( ) );
 *   - a leading international prefix "00" becomes "+";
 *   - the result must be a plausible E.164 number (+, 7–15 digits, no leading 0 after +).
 * Anything else throws, so a malformed number fails the build instead of shipping a dead link.
 * Pure, erasable TypeScript.
 */
const SEPARATORS = /[\s.\-/()]/g;
const E164 = /^\+[1-9]\d{6,14}$/;

/** "0039 334 1201847" -> "+393341201847". Throws on anything that is not a clear E.164 number. */
export function toE164(display: string): string {
  const compact = display.replace(SEPARATORS, '');
  const candidate = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  if (!E164.test(candidate)) {
    throw new Error(`phone: ${JSON.stringify(display)} cannot be converted to E.164 (expected an international number such as "0039 …" or "+39 …")`);
  }
  return candidate;
}

/** "0039 334 1201847" -> "tel:+393341201847". */
export function toTelHref(display: string): string {
  return `tel:${toE164(display)}`;
}
