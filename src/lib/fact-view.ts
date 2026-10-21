/**
 * How a slot is rendered — ARCHITECTURE §4 (Fact), §11.1, §11.2.
 *
 *  - value                      -> the value;
 *  - omitted                    -> nothing;
 *  - missing, NON-production    -> the COPY-DRAFT marker label(s) as a preview marker
 *                                  (nothing when COPY-DRAFT has no marker for the item);
 *  - missing, PRODUCTION        -> nothing. Never a marker, never an invented value.
 *    REQUIRED items are failed by the release check; IMPORTANT/OPTIONAL items render
 *    their approved fallback, which for every item used here is omission.
 *
 * This is the single decision point for "[MISSING: …]" text in pages. Pure.
 */
import type { Slot } from './slots.ts';
import type { SiteEnv } from './env.ts';

export type FactView<T> =
  | { readonly kind: 'value'; readonly value: T }
  | { readonly kind: 'marker'; readonly labels: readonly string[] }
  | { readonly kind: 'none' };

export function viewFact<T>(slot: Slot<T>, env: SiteEnv): FactView<T> {
  switch (slot.state) {
    case 'value':
      return { kind: 'value', value: slot.value };
    case 'omitted':
      return { kind: 'none' };
    case 'missing':
      return env === 'non-production' && slot.labels.length > 0 ? { kind: 'marker', labels: slot.labels } : { kind: 'none' };
  }
}

/** True when the slot produces visible output (value or preview marker). */
export function isVisible<T>(slot: Slot<T>, env: SiteEnv): boolean {
  return viewFact(slot, env).kind !== 'none';
}
