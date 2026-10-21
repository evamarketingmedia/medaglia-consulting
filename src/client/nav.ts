/**
 * Header navigation — disclosure pattern (not an ARIA menu). ARCHITECTURE §4, §9.
 *  - "Come collaboriamo": button toggles aria-expanded; Esc closes and returns focus;
 *    a click outside or focus leaving the group closes it.
 *  - "Menu" (< 1024 px): the no-JS link to #site-nav (opened via :target) is swapped for a disclosure
 *    button; Esc closes the open menu and returns focus to the button. No focus trap.
 */
const root = document.documentElement;
root.classList.add('js');

const header = document.querySelector<HTMLElement>('[data-header]');
const groupToggle = document.querySelector<HTMLButtonElement>('[data-nav-group-toggle]');
const group = document.querySelector<HTMLElement>('[data-nav-group]');
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menuNoJs = document.querySelector<HTMLElement>('[data-menu-nojs]');

function setGroup(open: boolean): void {
  groupToggle?.setAttribute('aria-expanded', String(open));
}
function groupOpen(): boolean {
  return groupToggle?.getAttribute('aria-expanded') === 'true';
}
function setMenu(open: boolean): void {
  if (!menuToggle || !header) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  header.classList.toggle('is-menu-open', open);
}
function menuOpen(): boolean {
  return menuToggle?.getAttribute('aria-expanded') === 'true';
}

if (menuToggle && menuNoJs) {
  menuNoJs.hidden = true;
  menuToggle.hidden = false;
  menuToggle.addEventListener('click', () => setMenu(!menuOpen()));
}

groupToggle?.addEventListener('click', () => setGroup(!groupOpen()));

group?.addEventListener('focusout', (ev) => {
  const next = ev.relatedTarget;
  if (next instanceof Node && group.contains(next)) return;
  if (window.matchMedia('(min-width: 1024px)').matches) setGroup(false);
});

document.addEventListener('click', (ev) => {
  const target = ev.target;
  if (!(target instanceof Node)) return;
  if (group && !group.contains(target) && window.matchMedia('(min-width: 1024px)').matches) setGroup(false);
});

document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (groupOpen()) {
    setGroup(false);
    groupToggle?.focus();
    return;
  }
  if (menuOpen()) {
    setMenu(false);
    menuToggle?.focus();
  }
});

// Leaving the narrow layout closes the mobile menu.
window.matchMedia('(min-width: 1024px)').addEventListener('change', (ev) => {
  if (ev.matches) setMenu(false);
});
