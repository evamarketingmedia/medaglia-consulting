/**
 * Form provider adapter boundary — ARCHITECTURE §5.7 (N2 DEFERRED).
 *
 * No real provider exists. Only mock adapters (./adapters/mock.ts), and only outside
 * production:
 *   - non-production, no provider configured -> 'preview-disabled': nothing is sent, no
 *     success is ever simulated, the form shows the preview activation notice (phone only),
 *     unless a dev flag asks for 'mock-failure' or 'mock-timeout' (both end in the failure
 *     message, never in a success page);
 *   - production, no provider -> 'unavailable': every submission shows the failure
 *     message (nothing is sent, success is never faked). The release check fails a
 *     production release anyway while R19 is open.
 *
 * DEV FLAG (non-production only): open /contatti/?mock-invio=errore (failure) or
 * /contatti/?mock-invio=timeout (timeout). Ignored in production.
 */
import type { SiteEnv } from '../env.ts';

export type SubmitResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'failure' | 'timeout' | 'unavailable' | 'preview' };

export type FormAdapter = {
  readonly id: 'preview-disabled' | 'mock-failure' | 'mock-timeout' | 'unavailable';
  submit(data: FormData, signal: AbortSignal): Promise<SubmitResult>;
};

export type AdapterChoice = FormAdapter['id'];

export const MOCK_FLAG_PARAM = 'mock-invio';

/** Pure selection logic (tested). `provider` is the public provider setting (unset today). */
export function chooseAdapter(env: SiteEnv, provider: string | undefined, search: string): AdapterChoice {
  if (env === 'production') return 'unavailable';
  if (provider !== undefined && provider !== '') return 'unavailable'; // no real adapter exists (N2)
  let flag: string | null = null;
  try {
    flag = new URLSearchParams(search).get(MOCK_FLAG_PARAM);
  } catch {
    flag = null;
  }
  if (flag === 'errore') return 'mock-failure';
  if (flag === 'timeout') return 'mock-timeout';
  return 'preview-disabled';
}
