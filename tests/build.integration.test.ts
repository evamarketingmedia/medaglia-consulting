/**
 * Real `astro build` integration tests (S3, S4, S8, S9) in a TEMP COPY of the project
 * (os.tmpdir(); node_modules entries symlinked read-only). No production build is ever
 * produced inside the repository, and no real domain is used: the only "valid" domain is
 * the neutral fixture https://medaglia-test-domain.it.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { copyProject, makeTempDir, pathExists, readText, removeDir, runAstroBuild, runCheck, writeTree } from './helpers/node-io.mjs';

const FIXTURE_ORIGIN = 'https://medaglia-test-domain.it';
const BUILD_TIMEOUT = 120_000;

let project = '';
beforeAll(() => {
  project = makeTempDir('build');
  copyProject(project);
});
afterAll(() => {
  if (project !== '') removeDir(project);
});

function build(env: Record<string, string> = {}, dotenv?: string) {
  removeDir(`${project}/dist`);
  removeDir(`${project}/.env`);
  if (dotenv !== undefined) writeTree(project, { '.env': dotenv });
  return runAstroBuild(project, env);
}

const robotsOf = (html: string) => /<meta name="robots" content="([^"]*)"/.exec(html)?.[1];
const recordOf = () => JSON.parse(readText(`${project}/dist/.build-record.json`)) as Record<string, unknown>;

describe('astro build — non-production', () => {
  it('builds with no SITE_URL; record is non-production; pages noindex, nofollow; check exit 0', () => {
    const b = build();
    expect(b.status, b.output).toBe(0);
    expect(recordOf()).toMatchObject({
      schema: 'medaglia-build-record/1',
      siteEnv: 'non-production',
      siteOrigin: 'https://site-url-not-set.invalid',
      robotsDefault: 'noindex, nofollow',
    });
    expect(Object.keys(recordOf()).sort()).toEqual(['builtAt', 'robotsDefault', 'schema', 'siteEnv', 'siteOrigin']);
    expect(robotsOf(readText(`${project}/dist/index.html`))).toBe('noindex, nofollow');
    const c = runCheck([], { RELEASE_CHECK_ROOT: project });
    expect(c.status, c.output).toBe(0);
    const p = runCheck(['--mode=production'], { RELEASE_CHECK_ROOT: project });
    expect(p.status, p.output).toBe(1);
    expect(p.stdout).toContain('dist/ is not a production build');
  }, BUILD_TIMEOUT);

  it('CONTEXT=deploy-preview never produces indexable output', () => {
    const b = build({ CONTEXT: 'deploy-preview', SITE_URL: FIXTURE_ORIGIN });
    expect(b.status, b.output).toBe(0);
    expect(recordOf()['siteEnv']).toBe('non-production');
    expect(robotsOf(readText(`${project}/dist/index.html`))).toBe('noindex, nofollow');
  }, BUILD_TIMEOUT);
});

describe('astro build — production with a FIXTURE domain still fails the release check', () => {
  it('builds, records production, and the production check FAILS on the unresolved REQUIRED data', () => {
    const b = build({ PUBLIC_SITE_ENV: 'production', SITE_URL: FIXTURE_ORIGIN });
    expect(b.status, b.output).toBe(0);
    expect(recordOf()).toMatchObject({ siteEnv: 'production', siteOrigin: FIXTURE_ORIGIN, robotsDefault: 'index, follow' });
    const c = runCheck(['--mode=production'], { RELEASE_CHECK_ROOT: project });
    expect(c.status, c.output).toBe(1);
    for (const id of ['R4', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R16', 'R17', 'R18', 'R19']) {
      expect(c.stdout).toContain(`REQUIRED item unresolved: ${id} `);
    }
    expect(c.stdout).not.toContain('REQUIRED item unresolved: R1 ');
    expect(c.stdout).not.toContain('REQUIRED item unresolved: R3 ');
    expect(c.stdout).not.toContain('REQUIRED item unresolved: R5 ');
    expect(c.stdout).not.toContain('REQUIRED contract:');
    // Production output: approved robots on every page, and NO marker leaks (fallbacks applied).
    expect(c.stdout).toContain('robots index.html: index, follow');
    expect(c.stdout).toContain('robots grazie/index.html: noindex, follow');
    expect(c.stdout).not.toContain('noindex, nofollow');
    expect(c.stdout).not.toContain('leaked marker');
    expect(c.stdout).toContain('markers found: 0');
    expect(c.stdout).not.toContain('build record siteEnv');
    // Production robots.txt / sitemap use the fixture origin; exactly 8 sitemap URLs.
    expect(readText(`${project}/dist/robots.txt`)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${FIXTURE_ORIGIN}/sitemap.xml\n`);
    expect(readText(`${project}/dist/sitemap.xml`).match(/<loc>/g)).toHaveLength(8);
    // No unconfirmed OVB figures, no company names, no photo box in production. The real
    // portrait renders (Phase 3) but is never the og:image; Person.image is the approved photo (R14 provided).
    const chi = readText(`${project}/dist/chi-siamo/index.html`);
    for (const banned of ['tre uffici', 'circa 70', 'OVB', 'Elatos', 'Metal System', 'Euromec', 'Bergamo', 'data-photo-slot', 'og:image']) {
      expect(chi).not.toContain(banned);
    }
    expect(chi).toContain(`"image":"${FIXTURE_ORIGIN}/images/alberto-medaglia.png"`);
    expect(chi).toMatch(/<img[^>]*alt="Alberto Medaglia"/);
    expect(chi).toContain('Senior Manager');
    // JSON-LD present on indexable pages, with the E.164 phone and no pruned properties.
    const home = readText(`${project}/dist/index.html`);
    expect(home).toContain('"telephone":"+393341201847"');
    for (const pruned of ['"email"', '"legalName"', '"vatID"', '"address"', '"logo"', '"founder"', '"sameAs"']) {
      expect(home).not.toContain(pruned);
    }
  }, BUILD_TIMEOUT);
});

describe('astro build — production refuses an invalid domain or env (S4, S8, S3)', () => {
  const refused: [string, Record<string, string>, string | undefined, RegExp][] = [
    ['missing SITE_URL', { PUBLIC_SITE_ENV: 'production' }, undefined, /SITE_URL is missing/],
    ['www host', { PUBLIC_SITE_ENV: 'production', SITE_URL: 'https://www.medaglia-test-domain.it' }, undefined, /www host/],
    ['.invalid host', { PUBLIC_SITE_ENV: 'production', SITE_URL: 'https://site-url-not-set.invalid' }, undefined, /reserved test domain/],
    ['http', { PUBLIC_SITE_ENV: 'production', SITE_URL: 'http://medaglia-test-domain.it' }, undefined, /not https/],
    ['mis-cased PUBLIC_SITE_ENV', { PUBLIC_SITE_ENV: 'Production', SITE_URL: FIXTURE_ORIGIN }, undefined, /is not allowed/],
    ['CONTEXT=production without SITE_URL', { CONTEXT: 'production' }, undefined, /SITE_URL is missing/],
    ['CONTEXT=production vs PUBLIC_SITE_ENV=preview', { CONTEXT: 'production', PUBLIC_SITE_ENV: 'preview' }, undefined, /conflict/],
    ['CONTEXT=deploy-preview vs PUBLIC_SITE_ENV=production', { CONTEXT: 'deploy-preview', PUBLIC_SITE_ENV: 'production', SITE_URL: FIXTURE_ORIGIN }, undefined, /conflict/],
    ['.env PUBLIC_SITE_ENV=production without SITE_URL', {}, 'PUBLIC_SITE_ENV=production\n', /SITE_URL is missing/],
  ];
  for (const [name, env, dotenv, re] of refused) {
    it(`fails: ${name}`, () => {
      const b = build(env, dotenv);
      expect(b.status, b.output).not.toBe(0);
      expect(b.output).toMatch(re);
      expect(pathExists(`${project}/dist/index.html`)).toBe(false);
    }, BUILD_TIMEOUT);
  }
});

describe('astro build — a build record must never come from public/ (F9)', () => {
  it('fails the build when public/.build-record.json exists, with a clear error', () => {
    writeTree(project, { 'public/.build-record.json': '{"schema":"medaglia-build-record/1"}\n' });
    try {
      const b = build({ PUBLIC_SITE_ENV: 'production', SITE_URL: FIXTURE_ORIGIN });
      expect(b.status, b.output).not.toBe(0);
      expect(b.output).toContain('public/.build-record.json must not exist');
      expect(pathExists(`${project}/dist/index.html`)).toBe(false);
      expect(pathExists(`${project}/dist/.build-record.json`)).toBe(false);
      // Non-production builds are refused too.
      const n = build();
      expect(n.status, n.output).not.toBe(0);
      expect(n.output).toContain('public/.build-record.json must not exist');
    } finally {
      removeDir(`${project}/public`);
    }
    expect(build().status).toBe(0);
  }, BUILD_TIMEOUT * 3);
});
