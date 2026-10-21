/**
 * track() — dispatches an in-page CustomEvent and nothing else (ARCHITECTURE §7).
 * Zero network, zero storage, no provider. Errors are swallowed (analytics must never break a page).
 */
import { ANALYTICS_EVENT, sanitiseProps, type EventName } from './events.ts';

export function track(name: EventName, props: Readonly<Record<string, unknown>> = {}): void {
  try {
    if (name === 'cta_click') return; // N14: defined but inactive
    document.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: { name, props: sanitiseProps(props) } }));
  } catch {
    /* never break the page */
  }
}
