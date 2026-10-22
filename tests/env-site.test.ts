import { describe, expect, it } from 'vitest';
import { resolveSiteEnv, viteModeFromArgv } from '../src/lib/env.ts';
import { NON_PRODUCTION_SITE_URL, resolveSiteUrl, validateProductionSiteUrl } from '../src/lib/site-url.ts';
import { BUILD_RECORD_SCHEMA, createBuildRecord, validateBuildRecord } from '../src/lib/build-record.ts';

// Neutral FIXTURE domain — clearly not the client's domain; never used in src/.
const FIXTURE = 'https://medaglia-test-domain.it';

describe('resolveSiteEnv (S8)', () => {
  it('accepts exactly production / preview / development / unset', () => {
    expect(resolveSiteEnv({ PUBLIC_SITE_ENV: 'production' })).toMatchObject({ ok: true, siteEnv: 'production' });
    expect(resolveSiteEnv({ PUBLIC_SITE_ENV: 'preview' })).toMatchObject({ ok: true, siteEnv: 'non-production' });
    expect(resolveSiteEnv({ PUBLIC_SITE_ENV: 'development' })).toMatchObject({ ok: true, siteEnv: 'non-production' });
    expect(resolveSiteEnv({})).toMatchObject({ ok: true, siteEnv: 'non-production' });
    expect(resolveSiteEnv({ PUBLIC_SITE_ENV: '' })).toMatchObject({ ok: true, siteEnv: 'non-production' });
  });
  it('rejects mis-cased, padded and unknown values', () => {
    for (const v of ['Production', 'PRODUCTION', ' production', 'production ', 'prod', 'Preview', 'staging', 'true']) {
      expect(resolveSiteEnv({ PUBLIC_SITE_ENV: v }).ok, v).toBe(false);
    }
  });
  it('CONTEXT=production is production; conflicting explicit values are errors', () => {
    expect(resolveSiteEnv({ CONTEXT: 'production' })).toMatchObject({ ok: true, siteEnv: 'production' });
    expect(resolveSiteEnv({ CONTEXT: 'production', PUBLIC_SITE_ENV: 'production' })).toMatchObject({ ok: true, siteEnv: 'production' });
    expect(resolveSiteEnv({ CONTEXT: 'production', PUBLIC_SITE_ENV: 'preview' }).ok).toBe(false);
    expect(resolveSiteEnv({ CONTEXT: 'production', PUBLIC_SITE_ENV: 'development' }).ok).toBe(false);
  });
  it('CLIENT PREVIEW (D37): CONTEXT=production + the exact client-preview host is a non-production preview', () => {
    const host = 'https://medaglia-consulting.netlify.app';
    expect(resolveSiteEnv({ CONTEXT: 'production', SITE_URL: host })).toEqual({
      ok: true,
      siteEnv: 'non-production',
      reason: 'client-preview host (D37)',
    });
    expect(resolveSiteUrl('non-production', host)).toEqual({ ok: true, site: host });
  });
  it('CLIENT PREVIEW (D37): anything else stays production and keeps failing the production SITE_URL check', () => {
    for (const u of [
      'https://other-site.netlify.app',
      'https://x.medaglia-consulting.netlify.app',
      'https://medaglia-consulting.netlify.app/',
      'https://medaglia-consulting.netlify.app/path',
      'https://user:pw@medaglia-consulting.netlify.app',
      'https://medaglia-consulting.netlify.app:8443',
      'http://medaglia-consulting.netlify.app',
    ]) {
      const r = resolveSiteEnv({ CONTEXT: 'production', SITE_URL: u });
      expect(r, u).toMatchObject({ ok: true, siteEnv: 'production' });
      expect(resolveSiteUrl('production', u).ok, u).toBe(false);
    }
    // a lookalike suffix is NOT the client-preview host: it stays production (behaviour unchanged;
    // the production validator treats it like any other apex, exactly as before D37)
    const lookalike = 'https://medaglia-consulting.netlify.app.evil.com';
    expect(resolveSiteEnv({ CONTEXT: 'production', SITE_URL: lookalike })).toMatchObject({ ok: true, siteEnv: 'production', reason: 'CONTEXT=production' });
    // explicit PUBLIC_SITE_ENV=production: production, and the validator still rejects the host
    const host = 'https://medaglia-consulting.netlify.app';
    expect(resolveSiteEnv({ CONTEXT: 'production', PUBLIC_SITE_ENV: 'production', SITE_URL: host })).toMatchObject({ ok: true, siteEnv: 'production' });
    expect(resolveSiteUrl('production', host).ok).toBe(false);
    // conflicts stay errors
    expect(resolveSiteEnv({ CONTEXT: 'production', PUBLIC_SITE_ENV: 'preview', SITE_URL: host }).ok).toBe(false);
    expect(resolveSiteEnv({ CONTEXT: 'production', PUBLIC_SITE_ENV: 'development', SITE_URL: host }).ok).toBe(false);
    // a real apex is unchanged
    expect(resolveSiteEnv({ CONTEXT: 'production', SITE_URL: FIXTURE })).toMatchObject({ ok: true, siteEnv: 'production', reason: 'CONTEXT=production' });
    expect(resolveSiteUrl('production', FIXTURE)).toEqual({ ok: true, site: FIXTURE });
  });
  it('deploy-preview / branch-deploy never produce production', () => {
    for (const c of ['deploy-preview', 'branch-deploy']) {
      expect(resolveSiteEnv({ CONTEXT: c })).toMatchObject({ ok: true, siteEnv: 'non-production' });
      expect(resolveSiteEnv({ CONTEXT: c, PUBLIC_SITE_ENV: 'preview' })).toMatchObject({ ok: true, siteEnv: 'non-production' });
      expect(resolveSiteEnv({ CONTEXT: c, PUBLIC_SITE_ENV: 'production' }).ok).toBe(false);
    }
  });
});

describe('viteModeFromArgv (S3)', () => {
  it('mirrors Astro: --mode wins, dev -> development, otherwise production', () => {
    expect(viteModeFromArgv(['node', 'astro', 'build'])).toBe('production');
    expect(viteModeFromArgv(['node', 'astro', 'dev'])).toBe('development');
    expect(viteModeFromArgv(['node', 'astro', 'build', '--mode', 'staging'])).toBe('staging');
    expect(viteModeFromArgv(['node', 'astro', 'build', '--mode=staging'])).toBe('staging');
  });
});

describe('validateProductionSiteUrl (S4)', () => {
  const invalid: [string, unknown, RegExp][] = [
    ['missing', undefined, /missing/],
    ['empty', '', /missing/],
    ['malformed', 'medaglia-test-domain.it', /malformed/],
    ['malformed (spaces)', 'https://medaglia test.it', /malformed/],
    ['not https', 'http://medaglia-test-domain.it', /not https/],
    ['path', 'https://medaglia-test-domain.it/it', /path, query or hash/],
    ['query', 'https://medaglia-test-domain.it/?a=1', /path, query or hash/],
    ['hash', 'https://medaglia-test-domain.it/#x', /path, query or hash/],
    ['trailing slash (§6)', 'https://medaglia-test-domain.it/', /exactly the origin/],
    ['upper-case host', 'https://Medaglia-Test-Domain.it', /exactly the origin/],
    ['credentials', 'https://user:pw@medaglia-test-domain.it', /credentials/],
    ['port', 'https://medaglia-test-domain.it:8443', /port/],
    ['.invalid', 'https://site-url-not-set.invalid', /reserved/],
    ['.test', 'https://medaglia.test', /reserved/],
    ['.example', 'https://medaglia.example', /reserved/],
    ['.localhost', 'https://medaglia.localhost', /localhost/],
    ['localhost', 'https://localhost', /localhost/],
    ['IPv4', 'https://127.0.0.1', /IP address/],
    ['IPv4 (numeric form)', 'https://2130706433', /IP address/],
    ['IPv6', 'https://[::1]', /IP address/],
    ['example.com', 'https://example.com', /example domain/],
    ['example.net', 'https://example.net', /example domain/],
    ['example.org', 'https://example.org', /example domain/],
    ['subdomain of example.com', 'https://medaglia.example.com', /example domain/],
    ['www', 'https://www.medaglia-test-domain.it', /www/],
    ['single-label host', 'https://intranet', /public domain/],
    ['.local (F8)', 'https://medaglia.local', /non-public \/ internal domain \(\.local\)/],
    ['.internal (F8)', 'https://sito.internal', /\(\.internal\)/],
    ['.lan (F8)', 'https://medaglia.lan', /\(\.lan\)/],
    ['.home.arpa (F8)', 'https://medaglia.home.arpa', /\(\.home\.arpa\)/],
    ['.arpa (F8)', 'https://1.0.0.127.in-addr.arpa', /\(\.arpa\)/],
    ['.onion (F8)', 'https://medagliaxyz.onion', /\(\.onion\)/],
    ['.corp (F8)', 'https://medaglia.corp', /\(\.corp\)/],
    ['.intranet (F8)', 'https://medaglia.intranet', /\(\.intranet\)/],
    ['.localdomain (F8)', 'https://medaglia.localdomain', /\(\.localdomain\)/],
    ['.netlify.app (F8)', 'https://medaglia-consulting.netlify.app', /hosting-platform domain \(\.netlify\.app\)/],
    ['.netlify.com (F8)', 'https://medaglia.netlify.com', /\(\.netlify\.com\)/],
    ['netlify.app itself (F8)', 'https://netlify.app', /\(\.netlify\.app\)/],
  ];
  for (const [name, value, re] of invalid) {
    it(`rejects ${name}`, () => {
      const r = validateProductionSiteUrl(value);
      expect(r.ok, name).toBe(false);
      if (!r.ok) expect(r.error).toMatch(re);
    });
  }
  it('accepts a valid-looking apex https origin (fixture domain)', () => {
    expect(validateProductionSiteUrl(FIXTURE)).toEqual({ ok: true, origin: FIXTURE });
  });
  it('does not reject domains that merely contain the words', () => {
    expect(validateProductionSiteUrl('https://notexample.com').ok).toBe(true);
    expect(validateProductionSiteUrl('https://wwwmedaglia-test-domain.it').ok).toBe(true);
    expect(validateProductionSiteUrl('https://local-test-domain.it').ok).toBe(true);
    expect(validateProductionSiteUrl('https://medaglianetlify.app.it').ok).toBe(true);
    expect(validateProductionSiteUrl('https://mylocal.it').ok).toBe(true);
  });
});

describe('resolveSiteUrl', () => {
  it('production requires a valid SITE_URL', () => {
    expect(resolveSiteUrl('production', undefined).ok).toBe(false);
    expect(resolveSiteUrl('production', 'https://www.medaglia-test-domain.it').ok).toBe(false);
    expect(resolveSiteUrl('production', FIXTURE)).toEqual({ ok: true, site: FIXTURE });
  });
  it('the F8 production-only endings do not affect non-production', () => {
    for (const u of ['https://medaglia.local', 'https://anteprima--medaglia.netlify.app', 'http://medaglia.lan']) {
      expect(resolveSiteUrl('non-production', u), u).toEqual({ ok: true, site: u });
      expect(resolveSiteUrl('production', u).ok, u).toBe(false);
    }
  });
  it('non-production works without SITE_URL (.invalid default) and rejects a malformed one', () => {
    expect(resolveSiteUrl('non-production', undefined)).toEqual({ ok: true, site: NON_PRODUCTION_SITE_URL });
    expect(resolveSiteUrl('non-production', '')).toEqual({ ok: true, site: NON_PRODUCTION_SITE_URL });
    expect(resolveSiteUrl('non-production', 'not a url').ok).toBe(false);
  });
});

describe('build record (S3)', () => {
  it('a missing builtAt is reported as missing (F9)', () => {
    const { builtAt: _drop, ...rest } = createBuildRecord({ siteEnv: 'production', site: FIXTURE, builtAt: new Date('2026-10-19T08:00:00Z') });
    const r = validateBuildRecord(rest);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain('build record builtAt is missing');
  });
  const at = new Date('2026-10-19T08:00:00Z');
  it('contains only non-secret metadata', () => {
    expect(createBuildRecord({ siteEnv: 'non-production', site: NON_PRODUCTION_SITE_URL, builtAt: at })).toEqual({
      schema: BUILD_RECORD_SCHEMA,
      siteEnv: 'non-production',
      siteOrigin: NON_PRODUCTION_SITE_URL,
      robotsDefault: 'noindex, nofollow',
      builtAt: '2026-10-19T08:00:00.000Z',
    });
    expect(createBuildRecord({ siteEnv: 'production', site: FIXTURE, builtAt: at }).robotsDefault).toBe('index, follow');
  });
  it('validates schema, keys, siteEnv, robotsDefault consistency and date', () => {
    const good = createBuildRecord({ siteEnv: 'production', site: FIXTURE, builtAt: at });
    expect(validateBuildRecord(good).ok).toBe(true);
    for (const bad of [
      null,
      [],
      'x',
      { ...good, schema: 'medaglia-build-record/0' },
      { ...good, siteEnv: 'preview' },
      { ...good, robotsDefault: 'noindex, nofollow' },
      { ...good, builtAt: 'yesterday' },
      { ...good, builtAt: '2026' },
      { ...good, builtAt: 'Oct 19 2026' },
      { ...good, builtAt: '2026-10-19' },
      { ...good, builtAt: '2026-10-19T08:00:00Z' },
      { ...good, builtAt: '2026-02-30T08:00:00.000Z' },
      { ...good, builtAt: '' },
      { ...good, builtAt: null },
      { ...good, builtAt: 1760860800000 },
      { ...good, token: 'secret' },
      { ...good, astroVersion: 7 },
    ]) {
      expect(validateBuildRecord(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});
