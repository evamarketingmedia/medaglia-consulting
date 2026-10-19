/**
 * Pre-launch registry — ARCHITECTURE §11.4 (final classifications, 2026-10-19).
 *
 * FOUNDATION SUBSET (Phase 3B): a small representative set of REAL items, all left
 * UNRESOLVED exactly as they are today, except R1 (phone: verified by agency owner,
 * 2026-10-19; see facts.ts). IDs, tiers, sources and fallbacks are taken
 * from ARCHITECTURE §11.4; nothing here resolves an item or changes a tier (§18).
 *
 * `complete: false` — the remaining §11.4 items are added in build step 7.
 * While false, a production release check FAILS (it cannot certify a partial registry).
 *
 * UNCLASSIFIED: no real item exists today (§11.4.4). It is exercised with test
 * fixtures only — never add a fake item here.
 */
import { slot, type Registry, type RegistryItem } from '../lib/slots.ts';
import { facts } from './facts.ts';

const items = [
  {
    id: 'R1',
    name: 'Phone number',
    source: 'BP §13.1; CD §B, §A',
    tier: 'required',
    omitAllowed: false,
    // Resolved: verified by agency owner, 2026-10-19 (value in facts.ts).
    slot: facts.phone,
  },
  {
    id: 'R6',
    name: 'Ragione sociale, P.IVA, sede legale',
    source: 'BP §13.3; CD §B',
    tier: 'required',
    omitAllowed: false,
    slot: facts.legal,
  },
  {
    id: 'R7',
    name: 'PEC, REA ("se applicabile")',
    source: 'BP §13.3; CD §B',
    tier: 'required',
    omitAllowed: true,
    slot: facts.pecRea,
  },
  {
    id: 'R19',
    name: 'Real form provider selected, configured and tested',
    source: 'Amendment 5, N2, N12; BP §11',
    tier: 'required',
    omitAllowed: false,
    // No COPY-DRAFT marker exists for this item.
    slot: slot.missing<string>(),
  },
  {
    id: 'I1',
    name: 'og:image (real 1200×630 brand image)',
    source: 'SP F.6; N7',
    tier: 'important',
    omitAllowed: false,
    slot: facts.ogImage,
    fallback: { kind: 'omit', ref: 'N7 / SP F.6: og:image tag omitted, twitter:card=summary' },
  },
  {
    id: 'R14',
    name: "Alberto's professional photo",
    source: 'BP §13 (before visual design), §13.10; CD §C7, §G9',
    tier: 'important',
    omitAllowed: false,
    slot: facts.photo,
    fallback: {
      kind: 'omit',
      ref: '§11.4.2: no image element, no placeholder box, Person image pruned; no fake photography',
    },
  },
  {
    id: 'U5',
    name: 'Exact areas within Nord Italia',
    source: 'BP §13.11; SP G.3',
    tier: 'optional',
    omitAllowed: false,
    // No COPY-DRAFT marker exists for this item; copy stays "Nord Italia".
    slot: slot.missing<string>(),
    fallback: { kind: 'approved', ref: 'FRC 2026-10-19: approved wording "Nord Italia"; naming regions is a scope change (BP §12)' },
  },
] as const satisfies readonly RegistryItem[];

export const registry: Registry = {
  complete: false,
  items,
};
