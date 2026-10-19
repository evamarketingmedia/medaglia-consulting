/**
 * Client facts as slots — ARCHITECTURE §2, §11.2.
 *
 * FOUNDATION SUBSET (Phase 3B). Every slot here is UNRESOLVED, except `phone` (R1),
 * resolved with the value verified by the agency owner on 2026-10-19.
 * Do NOT fill any value without documented client/owner confirmation (BP D26, §18).
 * Marker labels are copied VERBATIM from COPY-DRAFT.md; none is invented.
 *
 * Not yet modelled (later phases): hours (R3), publishable email (R5), address (R12),
 * linkedin (O1), logo (U1).
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

/** Reference to a real, existing image asset (added only once delivered, D17). */
export type ImageRef = { readonly src: string; readonly alt: string };

export const facts = {
  /**
   * R1 — CD §B, §A. Verified by agency owner, 2026-10-19.
   * Stored exactly as provided (display/source form, not reformatted). The `tel:` machine
   * form (E.164) is derived from this value by PhoneLink (build step 2), not stored here.
   */
  phone: slot.value<string>('0039 334 1201847'),
  /** R6 — CD §B legal block. */
  legal: slot.missing<LegalData>(
    '[MISSING: ragione sociale]',
    '[MISSING: partita IVA]',
    '[MISSING: indirizzo sede legale]',
  ),
  /** R7 — CD §B ("se applicabile": may become omitted-with-reason once confirmed). */
  pecRea: slot.missing<PecRea>('[MISSING: PEC, se applicabile]', '[MISSING: numero REA, se applicabile]'),
  /** R14 — CD §C7. Never an image or placeholder while missing (§11.4.2, §13). */
  photo: slot.missing<ImageRef>('[MISSING: foto professionale di Alberto Medaglia]'),
  /** I1 — SP F.6, N7. No visible COPY-DRAFT marker exists; tag is omitted while missing. */
  ogImage: slot.missing<ImageRef>(),
} as const satisfies Record<string, Slot<unknown>>;
