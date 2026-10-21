/**
 * Analytics gate — ARCHITECTURE §7 (N4 deferred, U8). NO provider: nothing is loaded, sent
 * or stored. One delegated listener turns tel: / mailto: clicks into in-page CustomEvents
 * (tel_click / mailto_click) with allow-listed properties only.
 */
import { track } from '../lib/analytics/track.ts';

const page = document.documentElement.dataset['page'] ?? '';

document.addEventListener('click', (ev) => {
  const target = ev.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a[href^="tel:"], a[href^="mailto:"]');
  if (!link) return;
  const placement = link.dataset['placement'] ?? '';
  track(link.href.startsWith('tel:') ? 'tel_click' : 'mailto_click', { page, placement });
});
