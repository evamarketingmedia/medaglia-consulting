/**
 * Contact-form validation — ARCHITECTURE §5.5 (usability only, N12). Messages verbatim CD §E.
 * Pure: takes plain values, returns the error message per field (in field order).
 */
export const MESSAGES = {
  summary: 'Controlla i campi evidenziati.',
  nome: 'Inserisci nome e cognome.',
  azienda: "Inserisci il nome dell'azienda.",
  ruolo: 'Indica il tuo ruolo in azienda.',
  telefonoEmpty: 'Inserisci un numero di telefono.',
  telefonoInvalid: 'Il numero non sembra corretto: controlla le cifre.',
  emailEmpty: 'Inserisci un indirizzo email.',
  emailInvalid: "L'indirizzo email non sembra corretto (es. nome@azienda.it).",
  privacy: "Per inviare la richiesta, conferma di aver letto l'informativa sulla privacy.",
} as const;

export type ContactValues = {
  readonly nome: string;
  readonly azienda: string;
  readonly ruolo: string;
  readonly telefono: string;
  readonly email: string;
  readonly privacy: boolean;
};

export const VALIDATED_FIELDS = ['nome', 'azienda', 'ruolo', 'telefono', 'email', 'privacy'] as const;
export type ValidatedField = (typeof VALIDATED_FIELDS)[number];
export type ValidationErrors = Partial<Record<ValidatedField, string>>;

/** Permissive phone check: separators removed, optional "+" or "00", then 6–15 digits. */
export function isPlausiblePhone(raw: string): boolean {
  const compact = raw.trim().replace(/[\s.\-()/]/g, '');
  const digits = compact.startsWith('+') ? compact.slice(1) : compact.startsWith('00') ? compact.slice(2) : compact;
  return /^\d{6,15}$/.test(digits);
}

/** Basic email shape only. */
export function isPlausibleEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function validateContact(v: ContactValues): ValidationErrors {
  const errors: ValidationErrors = {};
  if (v.nome.trim() === '') errors.nome = MESSAGES.nome;
  if (v.azienda.trim() === '') errors.azienda = MESSAGES.azienda;
  if (v.ruolo.trim() === '') errors.ruolo = MESSAGES.ruolo;
  if (v.telefono.trim() === '') errors.telefono = MESSAGES.telefonoEmpty;
  else if (!isPlausiblePhone(v.telefono)) errors.telefono = MESSAGES.telefonoInvalid;
  if (v.email.trim() === '') errors.email = MESSAGES.emailEmpty;
  else if (!isPlausibleEmail(v.email)) errors.email = MESSAGES.emailInvalid;
  if (!v.privacy) errors.privacy = MESSAGES.privacy;
  return errors;
}
