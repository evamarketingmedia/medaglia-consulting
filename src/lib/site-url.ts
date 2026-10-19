/**
 * SITE_URL — canonical origin (ARCHITECTURE §6, D15, R11).
 *
 * Used by astro.config.mjs (a production build throws on an invalid value) and by
 * scripts/check-release.mjs (validates the origin recorded in dist/.build-record.json).
 * Pure, erasable TypeScript (also run by Node's native type stripping).
 *
 * The real production domain is MISSING (R11). No real domain is configured anywhere;
 * non-production builds without SITE_URL use a reserved `.invalid` host.
 */
import type { SiteEnv } from './env.ts';

export const NON_PRODUCTION_SITE_URL = 'https://site-url-not-set.invalid';

export type SiteUrlCheck = { readonly ok: true; readonly origin: string } | { readonly ok: false; readonly error: string };

const RESERVED_SUFFIXES = ['.invalid', '.test', '.example', '.localhost'] as const;
/**
 * Non-public / internal / platform host endings refused for the PRODUCTION SITE_URL only (F8):
 * mDNS, private and special-use names, reverse-DNS, onion, and Netlify platform hosts (the
 * canonical is the client's own apex, never a *.netlify.app / *.netlify.com host).
 */
const NON_PUBLIC_SUFFIXES = [
  '.local',
  '.internal',
  '.lan',
  '.home.arpa',
  '.arpa',
  '.onion',
  '.corp',
  '.intranet',
  '.localdomain',
] as const;
const PLATFORM_SUFFIXES = ['.netlify.app', '.netlify.com'] as const;
/** host is the suffix's domain itself or a subdomain of it. */
const hasSuffix = (host: string, suffix: string): boolean => host === suffix.slice(1) || host.endsWith(suffix);
const EXAMPLE_DOMAINS = ['example.com', 'example.net', 'example.org'] as const;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * A production SITE_URL must be exactly an https origin on a real public apex host:
 * `https://<host>` — no path, query, hash, credentials, port or trailing slash (§6),
 * not www (non-www apex, D15), not localhost / an IP / a reserved, example, internal /
 * non-public (.local, .internal, .lan, .arpa, .onion, .corp, .intranet, .localdomain) or
 * Netlify platform (.netlify.app, .netlify.com) domain.
 */
export function validateProductionSiteUrl(raw: unknown): SiteUrlCheck {
  const fail = (why: string): SiteUrlCheck => ({ ok: false, error: `SITE_URL ${JSON.stringify(raw)} ${why}` });
  if (typeof raw !== 'string' || raw.trim() === '') return { ok: false, error: 'SITE_URL is missing (R11)' };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fail('is malformed (not a URL)');
  }
  if (url.protocol !== 'https:') return fail('is not https');
  if (url.username !== '' || url.password !== '') return fail('is malformed (must not contain credentials)');
  if (url.port !== '') return fail('is malformed (must not set a port)');
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return fail('has a path, query or hash');

  const host = url.hostname;
  if (host.startsWith('[') || IPV4.test(host)) return fail('uses an IP address, not a domain');
  if (host === 'localhost' || host.endsWith('.localhost')) return fail('is localhost');
  if (host.endsWith('.')) return fail('is malformed (trailing dot in the host)');
  if (!host.includes('.')) return fail('is malformed (host is not a public domain)');
  for (const suffix of RESERVED_SUFFIXES) {
    if (host.endsWith(suffix)) return fail(`uses a reserved test domain (${suffix})`);
  }
  for (const suffix of NON_PUBLIC_SUFFIXES) {
    if (hasSuffix(host, suffix)) return fail(`uses a non-public / internal domain (${suffix})`);
  }
  for (const suffix of PLATFORM_SUFFIXES) {
    if (hasSuffix(host, suffix)) return fail(`uses a hosting-platform domain (${suffix}), not the client's own apex domain`);
  }
  for (const d of EXAMPLE_DOMAINS) {
    if (host === d || host.endsWith(`.${d}`)) return fail(`uses an example domain (${d})`);
  }
  if (host.startsWith('www.')) return fail('uses a www host (the canonical host is the non-www apex, §6/D15)');

  // Exact origin form only: lower-case, no trailing slash (§6), no default port, no whitespace.
  if (raw !== url.origin) {
    return fail(`must be exactly the origin ${JSON.stringify(url.origin)} (no trailing slash, lower-case, no default port)`);
  }
  return { ok: true, origin: url.origin };
}

export type SiteResolution = { readonly ok: true; readonly site: string } | { readonly ok: false; readonly error: string };

/**
 * The `site` for astro.config.mjs. Production: a valid SITE_URL is mandatory.
 * Non-production: SITE_URL if given (must parse as an http(s) URL), else the `.invalid` default.
 */
export function resolveSiteUrl(siteEnv: SiteEnv, raw: string | undefined): SiteResolution {
  if (siteEnv === 'production') {
    const check = validateProductionSiteUrl(raw);
    return check.ok ? { ok: true, site: check.origin } : { ok: false, error: check.error };
  }
  if (raw === undefined || raw === '') return { ok: true, site: NON_PRODUCTION_SITE_URL };
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('protocol');
    return { ok: true, site: raw };
  } catch {
    return { ok: false, error: `SITE_URL ${JSON.stringify(raw)} is malformed` };
  }
}
