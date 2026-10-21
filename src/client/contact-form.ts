/**
 * Contact form behaviour — ARCHITECTURE §5 (validation, ?interesse=, origine, submit states).
 * DOM updates use textContent / cloned <template> nodes only (no innerHTML, §10.3).
 * No network: submission goes through the adapter boundary (mock adapters only, N2).
 */
import { INTERESSE, parseInteresse } from '../lib/form/interesse.ts';
import { VALIDATED_FIELDS, validateContact, type ValidatedField } from '../lib/form/validation.ts';
import { resolveOrigin } from '../lib/form/origin.ts';
import { chooseAdapter } from '../lib/form/adapter.ts';
import { createAdapter } from '../lib/form/adapters/mock.ts';
import { currentSiteEnv } from '../lib/site-env.ts';

const SENDING = 'Invio in corso…';
const INLINE_SUCCESS = 'Richiesta inviata. Ti ricontatteremo per la telefonata conoscitiva.';
const TIMEOUT_MS = 15_000;

const FIELD_INPUT_ID: Record<ValidatedField, string> = {
  nome: 'f-nome',
  azienda: 'f-azienda',
  ruolo: 'f-ruolo',
  telefono: 'f-telefono',
  email: 'f-email',
  privacy: 'f-privacy',
};

function init(form: HTMLFormElement): void {
  form.noValidate = true;
  const summary = form.querySelector<HTMLElement>('[data-summary]');
  const summaryList = form.querySelector<HTMLUListElement>('[data-summary-list]');
  const status = form.querySelector<HTMLElement>('[data-status]');
  const alertBox = form.querySelector<HTMLElement>('[data-alert]');
  const failureTpl = form.querySelector<HTMLTemplateElement>('[data-failure-template]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const honeypot = form.querySelector<HTMLInputElement>('[data-honeypot]');
  const origine = form.querySelector<HTMLInputElement>('[data-origine]');
  const previewNotice = form.querySelector<HTMLElement>('[data-preview-notice]'); // non-production only
  if (!summary || !summaryList || !status || !alertBox || !failureTpl || !submit || !honeypot || !origine) return;
  const submitLabel = submit.textContent ?? '';

  // ?interesse= : one fixed radio from the allow-list; the raw value is never written anywhere.
  const key = parseInteresse(window.location.search);
  if (key !== null) {
    const radio = document.getElementById(INTERESSE[key].radioId);
    if (radio instanceof HTMLInputElement) radio.checked = true;
  }

  // origine: allow-listed constant only.
  origine.value = resolveOrigin(document.referrer, window.location.origin);

  const input = (f: ValidatedField) => document.getElementById(FIELD_INPUT_ID[f]) as HTMLInputElement | null;
  const errorEl = (f: ValidatedField) => document.getElementById(`${FIELD_INPUT_ID[f]}-error`);

  const setFieldError = (f: ValidatedField, message: string | undefined): void => {
    const el = input(f);
    const err = errorEl(f);
    if (!el || !err) return;
    if (message === undefined) {
      el.removeAttribute('aria-invalid');
      err.textContent = '';
      err.hidden = true;
    } else {
      el.setAttribute('aria-invalid', 'true');
      err.textContent = message;
      err.hidden = false;
    }
  };

  const values = () => ({
    nome: input('nome')?.value ?? '',
    azienda: input('azienda')?.value ?? '',
    ruolo: input('ruolo')?.value ?? '',
    telefono: input('telefono')?.value ?? '',
    email: input('email')?.value ?? '',
    privacy: input('privacy')?.checked ?? false,
  });

  let attempted = false;
  const showErrors = (): boolean => {
    const errors = validateContact(values());
    summaryList.replaceChildren();
    for (const f of VALIDATED_FIELDS) {
      const message = errors[f];
      setFieldError(f, message);
      if (message !== undefined) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${FIELD_INPUT_ID[f]}`;
        a.textContent = message;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          input(f)?.focus();
        });
        li.append(a);
        summaryList.append(li);
      }
    }
    const hasErrors = summaryList.childElementCount > 0;
    summary.hidden = !hasErrors;
    return hasErrors;
  };

  // Errors clear on correction (after a first attempt).
  form.addEventListener('input', () => {
    if (attempted) showErrors();
  });

  let busy = false;
  const setBusy = (on: boolean): void => {
    busy = on;
    submit.disabled = on;
    submit.textContent = on ? SENDING : submitLabel;
    status.textContent = on ? SENDING : '';
  };

  const showFailure = (): void => {
    alertBox.replaceChildren(failureTpl.content.cloneNode(true));
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (busy) return;
    alertBox.replaceChildren();
    // Honeypot filled: nothing is sent, inline success, no navigation, no event.
    if (honeypot.value !== '') {
      status.textContent = INLINE_SUCCESS;
      return;
    }
    attempted = true;
    if (showErrors()) {
      summary.focus();
      return;
    }
    const choice = chooseAdapter(currentSiteEnv(), undefined, window.location.search);
    if (choice === 'preview-disabled') {
      // Preview: nothing is sent, no success, no navigation. Announce and focus the notice.
      status.textContent = previewNotice?.textContent?.trim() ?? '';
      previewNotice?.focus();
      return;
    }
    setBusy(true);
    const adapter = createAdapter(choice);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    let ok = false;
    try {
      const result = await adapter.submit(new FormData(form), controller.signal);
      ok = result.ok;
    } catch {
      ok = false;
    } finally {
      window.clearTimeout(timer);
    }
    if (ok) {
      try {
        window.location.assign('/grazie/');
        return;
      } catch {
        setBusy(false);
        status.textContent = INLINE_SUCCESS;
        return;
      }
    }
    setBusy(false);
    showFailure(); // entered values are kept: the form is never reset or re-rendered
  });
}

const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
if (form) init(form);
