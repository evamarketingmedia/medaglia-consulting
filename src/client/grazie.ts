/**
 * /grazie/ — dispatch the internal `form_submit` event only after a submission from
 * /contatti/ (same-origin referrer). A direct visit dispatches nothing (ARCH §7).
 * No storage and no URL parameters are used (§7.1 deferred).
 */
import { track } from '../lib/analytics/track.ts';

try {
  const ref = document.referrer === '' ? null : new URL(document.referrer);
  if (ref !== null && ref.origin === window.location.origin && ref.pathname === '/contatti/') {
    track('form_submit', { page: 'grazie' });
  }
} catch {
  /* never break the page */
}
