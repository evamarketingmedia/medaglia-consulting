/**
 * Client facts as slots — ARCHITECTURE §2, §11.2.
 *
 * Every slot here is UNRESOLVED, except `phone` (R1), `photo` (R14) and `logo` (U1),
 * resolved with values provided/verified by the agency owner on 2026-10-19, and `email` (R5),
 * verified by the agency owner on 2026-10-20.
 * Do NOT fill any value without documented client/owner confirmation (BP D26, §18).
 * Marker labels are copied VERBATIM from COPY-DRAFT.md; none is invented. A slot with no
 * COPY-DRAFT marker has no label (it then renders nothing, also in preview).
 */
import { slot, type Slot } from '../lib/slots.ts';

export type LegalData = {
  readonly ragioneSociale: string;
  readonly partitaIva: string;
  readonly sedeLegale: string;
};

export type PecRea = {
  readonly pec?: string;
  readonly rea?: string;
};

/** Published office address (R12): text exactly as approved, plus the Google Maps link (no embed). */
export type Address = { readonly text: string; readonly mapsUrl: string };

/** Reference to a real, existing image asset (added only once delivered, D17). */
export type ImageRef = { readonly src: string; readonly alt: string; readonly width: number; readonly height: number };

export const facts = {
  /**
   * R1 — CD §B, §A. Verified by agency owner, 2026-10-19.
   * Stored exactly as provided (display form). The `tel:` / E.164 forms are derived
   * mechanically by src/lib/phone.ts, never stored here.
   */
  phone: slot.value<string>('0039 334 1201847'),
  /**
   * R3 — CD §B footer, §C8. Intentionally not published (D32): business decision by the
   * agency owner, 2026-10-20. Still tracked as REQUIRED; resolves as "omitted". Rendered nowhere.
   */
  hours: slot.omitted<string>('Scelta del cliente: orari non pubblicati (D32, 2026-10-20)'),
  /**
   * R5 — CD §B, §C8, §E. Rendered through EmailLink; footer and /contatti/ show the address
   * itself as link text (show="address"). Never a dead mailto:.
   * Verified by agency owner, 2026-10-20.
   */
  email: slot.value<string>('medagliaconsulenza@gmail.com'),
  /** R6 — CD §B legal block. */
  legal: slot.missing<LegalData>(
    '[MISSING: ragione sociale]',
    '[MISSING: partita IVA]',
    '[MISSING: indirizzo sede legale]',
  ),
  /** R7 — CD §B ("se applicabile": may become omitted-with-reason once confirmed). */
  pecRea: slot.missing<PecRea>('[MISSING: PEC, se applicabile]', '[MISSING: numero REA, se applicabile]'),
  /** R12 — CD §B ("solo se il cliente ne conferma la pubblicazione": may become omitted-with-reason). */
  address: slot.missing<Address>('[MISSING: indirizzo — solo se il cliente ne conferma la pubblicazione]'),
  /** R2 (+R15) — CD §C8 §2, §C9. IMPORTANT: production omits the line (no person, no response time). */
  callback: slot.missing<string>('[MISSING: chi richiama ed entro quando]'),
  /**
   * R14 — CD §C7. Provided/verified by agency owner, 2026-10-19: the approved file
   * public/images/alberto-medaglia.png (real size 1385x1136, never modified). The owner
   * approved its use as Person.image in structured data.
   */
  photo: slot.value<ImageRef>({ src: '/images/alberto-medaglia.png', alt: 'Alberto Medaglia', width: 1385, height: 1136 }),
  /** I2 — CD §C7 subline. Until confirmed: name only, no title, no jobTitle/founder. */
  albertoTitle: slot.missing<string>('[MISSING: ruolo di Alberto Medaglia in Medaglia Consulting]'),
  /** I1 — SP F.6, N7. No visible COPY-DRAFT marker exists; tag is omitted while missing. */
  ogImage: slot.missing<ImageRef>(),
  /**
   * U1 — logo. Provided/verified by agency owner, 2026-10-19: the APPROVED final asset
   * public/brand/medaglia-consulting.svg (viewBox 0 0 2048 682), used as-is.
   */
  logo: slot.value<ImageRef>({ src: '/brand/medaglia-consulting.svg', alt: 'Medaglia Consulting', width: 2048, height: 682 }),
  /** O1 — LinkedIn URL (CD §B: omit until provided). */
  linkedin: slot.missing<string>(),
} as const satisfies Record<string, Slot<unknown>>;
