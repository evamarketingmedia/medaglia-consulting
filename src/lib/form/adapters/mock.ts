/**
 * Mock adapters — dev and tests only (ARCHITECTURE §5.4, §5.7). No network, ever.
 */
import type { AdapterChoice, FormAdapter, SubmitResult } from '../adapter.ts';

const delay = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });

async function settle(ms: number, signal: AbortSignal, result: SubmitResult): Promise<SubmitResult> {
  try {
    await delay(ms, signal);
    return result;
  } catch {
    return { ok: false, reason: 'timeout' };
  }
}

export function createAdapter(choice: AdapterChoice): FormAdapter {
  switch (choice) {
    case 'preview-disabled':
      // Non-production preview: nothing is sent and success is never simulated.
      return { id: choice, submit: async () => ({ ok: false, reason: 'preview' }) };
    case 'mock-failure':
      return { id: choice, submit: (_d, signal) => settle(600, signal, { ok: false, reason: 'failure' }) };
    case 'mock-timeout':
      // Never settles on its own; the caller's AbortController timeout ends it.
      return { id: choice, submit: (_d, signal) => settle(60_000, signal, { ok: false, reason: 'timeout' }) };
    case 'unavailable':
      return { id: choice, submit: async () => ({ ok: false, reason: 'unavailable' }) };
  }
}
