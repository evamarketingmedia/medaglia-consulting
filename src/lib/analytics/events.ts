/**
 * Internal analytics abstraction — ARCHITECTURE §7 (N4 DEFERRED, U8).
 * Event names and allow-listed properties only. No phone, email, hrefs or form values.
 */
export const EVENT_NAMES = ['form_submit', 'tel_click', 'mailto_click', 'cta_click'] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export type EventProps = {
  readonly page?: string;
  readonly placement?: string;
  readonly interesse?: string;
  readonly origin?: string;
};

/** The in-page CustomEvent type. Nothing listens outside the page; nothing is sent. */
export const ANALYTICS_EVENT = 'medaglia:analytics';

const SAFE_TOKEN = /^[a-z0-9/_-]{1,64}$/;

/** Keep only allow-listed keys with short, token-like values. */
export function sanitiseProps(props: Readonly<Record<string, unknown>>): EventProps {
  const out: Record<string, string> = {};
  for (const key of ['page', 'placement', 'interesse', 'origin'] as const) {
    const v = props[key];
    if (typeof v === 'string' && SAFE_TOKEN.test(v)) out[key] = v;
  }
  return out;
}
