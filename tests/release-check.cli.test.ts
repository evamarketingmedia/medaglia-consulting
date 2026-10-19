/**
 * Subprocess integration tests (S9a): the REAL `node scripts/check-release.mjs`, run
 * against temporary fixture roots in os.tmpdir() through the documented test-only
 * RELEASE_CHECK_ROOT override (F1: accepted only under Vitest with no CI active; a
 * production fixture run that would pass exits 3, never 0). Scenarios where the override
 * is refused by design (CONTEXT set) run the script of an isolated temp copy instead (F12).
 * The repository is never written, and its .env* files never decide a result.
 *
 * Fixture data (registry values, the domain https://medaglia-test-domain.it) exists only
 * in the temp dirs; it is not client data and never appears in src/.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REQUIRED_CONTRACT } from '../src/lib/release/classify.ts';
import { createBuildRecord } from '../src/lib/build-record.ts';
import { copyCheckerProject, makeSymlink, makeTempDir, removeDir, runCheck, runCheckIn, writeTree } from './helpers/node-io.mjs';

const FIXTURE_ORIGIN = 'https://medaglia-test-domain.it';
const created: string[] = [];
afterAll(() => {
  for (const d of created) removeDir(d);
});

type Item = Record<string, unknown> & { id: string };

const resolvedContract = (): Item[] =>
  Object.entries(REQUIRED_CONTRACT).map(([id, c]) => ({
    id,
    name: `Fixture ${id}`,
    source: 'test fixture',
    tier: 'required',
    omitAllowed: c.omitAllowed,
    slot: { state: 'value', value: `Valore di prova confermato ${id}` },
  }));

/** Exit code of a production FIXTURE run that would otherwise pass (F1). */
const FIXTURE_PASS = 3;
/** A real 1x1 PNG. */
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const page = (robots: string, body = '<p>ok</p>') =>
  `<!doctype html><html lang="it"><head><meta name="robots" content="${robots}"></head><body>${body}</body></html>`;

// siteOrigin is written verbatim (not normalised) so invalid origins reach the checker as-is.
const record = (siteEnv: 'production' | 'non-production' = 'production', site = FIXTURE_ORIGIN) =>
  `${JSON.stringify({ ...createBuildRecord({ siteEnv, site: FIXTURE_ORIGIN, builtAt: new Date('2026-10-19T08:00:00Z') }), siteOrigin: site })}\n`;

type FileContent = string | null | { base64: string };
type FixtureOptions = {
  items?: Item[];
  complete?: boolean;
  /** dist/ files; `undefined` = a clean production dist, `null` = no dist/. */
  dist?: Record<string, FileContent> | null;
  files?: Record<string, FileContent>;
};

const cleanDist = (): Record<string, FileContent> => ({
  'index.html': page('index, follow'),
  'grazie/index.html': page('noindex, follow'),
  '.build-record.json': record(),
});

function fixture(opts: FixtureOptions = {}): string {
  const root = makeTempDir('check');
  created.push(root);
  const registry = { complete: opts.complete ?? true, items: opts.items ?? resolvedContract() };
  const tree: Record<string, FileContent> = {
    'package.json': '{ "type": "module" }\n',
    'src/content/registry.ts': `export const registry = ${JSON.stringify(registry, null, 2)};\n`,
    ...(opts.files ?? {}),
  };
  const dist = opts.dist === undefined ? cleanDist() : opts.dist;
  if (dist !== null) {
    tree['dist'] = null;
    for (const [k, v] of Object.entries(dist)) tree[`dist/${k}`] = v;
  }
  writeTree(root, tree);
  return root;
}

const check = (root: string, args: string[] = [], env: Record<string, string | null> = {}) =>
  runCheck(args, { RELEASE_CHECK_ROOT: root, ...env });
const prod = (root: string, env: Record<string, string | null> = {}) => check(root, ['--mode=production'], env);

const withItem = (id: string, patch: Record<string, unknown>) =>
  resolvedContract().map((i) => (i.id === id ? { ...i, ...patch } : i));

describe('release check CLI — positive control', () => {
  it('a complete, resolved fixture with a clean production dist would pass: exit 3 (fixture), never 0', () => {
    const r = prod(fixture());
    expect(r.status, r.output).toBe(FIXTURE_PASS);
    expect(r.stdout).toContain('RESULT: FIXTURE PASS (TEST FIXTURE ROOT — NOT A RELEASE RESULT; exit 3, never 0)');
    expect(r.stdout).toContain('TEST FIXTURE ROOT (RELEASE_CHECK_ROOT)');
    expect(r.stdout).not.toContain('RESULT: PASS');
  });

  it('a legitimate non-production check stays usable (exit 0) even with blockers', () => {
    const root = fixture({ items: withItem('R1', { slot: { state: 'missing', labels: ['[MISSING: numero di telefono]'] } }), dist: { 'index.html': page('noindex, nofollow'), '.build-record.json': record('non-production', 'https://site-url-not-set.invalid') } });
    const r = check(root);
    expect(r.status, r.output).toBe(0);
    expect(r.stdout).toContain('RESULT: REPORT ONLY');
    expect(r.stdout).toContain('(TEST FIXTURE ROOT)');
    expect(r.stdout).toContain('TEST FIXTURE ROOT (RELEASE_CHECK_ROOT)');
    expect(r.stdout).toContain('(would FAIL in production; reported only)');
  });
});

describe('release check CLI — test-only override guard (F1)', () => {
  it('a leftover RELEASE_CHECK_ROOT outside Vitest (VITEST unset) is refused: exit 2, never a production pass', () => {
    const r = prod(fixture(), { VITEST: null });
    expect(r.status, r.output).toBe(2);
    expect(r.stderr).toContain('refused outside Vitest');
    expect(r.stdout).not.toContain('RESULT: PASS');
  });
  it('VITEST must be exactly "true"', () => {
    for (const v of ['1', 'TRUE', '']) expect(prod(fixture(), { VITEST: v }).status, v).toBe(2);
  });
  for (const ci of ['CI', 'NETLIFY', 'CONTEXT', 'GITHUB_ACTIONS', 'BUILD_ID']) {
    it(`the override is refused while ${ci} is set (exit 2)`, () => {
      const r = prod(fixture(), { [ci]: ci === 'CONTEXT' ? 'production' : 'true' });
      expect(r.status, r.output).toBe(2);
      expect(r.stderr).toContain(`refused while CI is active (${ci} set)`);
    });
  }
  it('an EMPTY CI variable is not an active CI (fixture still runs: exit 3)', () => {
    expect(prod(fixture(), { CI: '' }).status).toBe(FIXTURE_PASS);
  });
  it('CONTEXT=production in the FIXTURE .env does not count as CI and cannot produce exit 0', () => {
    const r = check(fixture({ files: { '.env': 'CONTEXT=production\n' } }));
    expect(r.stdout).toContain('mode: PRODUCTION (CONTEXT=production)');
    expect(r.status, r.output).toBe(FIXTURE_PASS);
  });
  it('a relative override path is refused (exit 2)', () => {
    expect(runCheck(['--mode=production'], { RELEASE_CHECK_ROOT: 'relative/dir' }).status).toBe(2);
  });
});

describe('release check CLI — REQUIRED items and contract (S2)', () => {
  for (const id of ['R1', 'R6', 'R7', 'R19']) {
    it(`production FAILS on unresolved ${id} alone (registry complete:true)`, () => {
      const r = prod(fixture({ items: withItem(id, { slot: { state: 'missing', labels: [] } }) }));
      expect(r.status, r.output).toBe(1);
      expect(r.stdout).toContain(`  - REQUIRED item unresolved: ${id} Fixture ${id}`);
      expect(r.stdout).not.toContain('registry is marked incomplete');
    });
  }

  it('R7 omitted with a real reason resolves; omitted with "TBD" is an error in both modes', () => {
    expect(prod(fixture({ items: withItem('R7', { slot: { state: 'omitted', reason: 'Non applicabile: confermato dal cliente' } }) })).status).toBe(FIXTURE_PASS);
    const bad = fixture({ items: withItem('R7', { slot: { state: 'omitted', reason: 'TBD' } }) });
    expect(prod(bad).status).toBe(1);
    const nonProd = check(bad);
    expect(nonProd.status, nonProd.output).toBe(1);
    expect(nonProd.stdout).toContain('STRUCTURAL ERRORS');
  });

  it('a placeholder value (S1) is a structural error, not a resolution', () => {
    const r = check(fixture({ items: withItem('R1', { slot: { state: 'value', value: '[MISSING: numero di telefono]' } }) }));
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain('STRUCTURAL ERRORS');
    expect(r.stdout).toContain("ERROR  registry item #0 (R1): slot state 'value' is not a real value: string contains a release marker");
    expect(r.stdout).toContain("  - ERROR: registry item #0 (R1): slot state 'value' is not a real value: string contains a release marker");
  });

  for (const value of ['ＴＢＤ', 'TBD\u3164', 'da definire', 'N.D.', '—', 'TODO: numero']) {
    it(`a placeholder value ${JSON.stringify(value)} is a structural error (F2)`, () => {
      const r = check(fixture({ items: withItem('R1', { slot: { state: 'value', value } }) }));
      expect(r.status, r.output).toBe(1);
      expect(r.stdout).toContain("(R1): slot state 'value' is not a real value:");
    });
  }

  it('a deleted REQUIRED ID fails production and is listed (exit 0) in non-production', () => {
    const root = fixture({ items: resolvedContract().filter((i) => i.id !== 'R3') });
    const p = prod(root);
    expect(p.status, p.output).toBe(1);
    expect(p.stdout).toContain('REQUIRED contract: R3: absent from the registry');
    const n = check(root);
    expect(n.status, n.output).toBe(0);
    expect(n.stdout).toContain('[REPORT] R3: absent from the registry');
  });

  it('a re-tiered REQUIRED ID fails production', () => {
    const r = prod(fixture({ items: withItem('R4', { tier: 'important', fallback: { kind: 'omit', ref: 'x' } }) }));
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain('R4: tier is "important"');
  });

  it('a changed omitAllowed fails production', () => {
    const r = prod(fixture({ items: withItem('R12', { omitAllowed: false }) }));
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain('R12: omitAllowed is false, the contract requires true');
  });
});

describe('release check CLI — dist/ and build record (S3, S5)', () => {
  const failsWith = (root: string, text: string, env: Record<string, string> = {}) => {
    const r = prod(root, env);
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain(text);
    return r;
  };

  it('missing dist/ fails production; non-production still exits 0', () => {
    const root = fixture({ dist: null });
    failsWith(root, 'dist/ does not exist');
    expect(check(root).status).toBe(0);
  });
  it('dist/ that is a file fails production', () => {
    failsWith(fixture({ dist: null, files: { dist: 'not a directory' } }), 'dist/ is not a directory');
  });
  it('empty dist/ fails production (no HTML, no index.html, no record)', () => {
    const r = failsWith(fixture({ dist: {} }), 'dist/ contains no HTML files');
    expect(r.stdout).toContain('dist/index.html is missing');
    expect(r.stdout).toContain('build record dist/.build-record.json is missing');
  });
  it('dist/ without index.html fails production', () => {
    failsWith(fixture({ dist: { 'chi-siamo/index.html': page('index, follow'), '.build-record.json': record() } }), 'dist/index.html is missing');
  });
  it('stale dist/ (no build record) fails production', () => {
    failsWith(fixture({ dist: { 'index.html': page('index, follow') } }), 'build record dist/.build-record.json is missing');
  });
  it('an unparseable or schema-invalid record fails production', () => {
    failsWith(fixture({ dist: { ...cleanDist(), '.build-record.json': '{oops' } }), 'is not valid JSON');
    failsWith(fixture({ dist: { ...cleanDist(), '.build-record.json': JSON.stringify({ schema: 'other' }) } }), 'build record schema is "other"');
  });
  it('a preview build record fails production', () => {
    failsWith(fixture({ dist: { ...cleanDist(), '.build-record.json': record('non-production', 'https://site-url-not-set.invalid') } }), 'dist/ is not a production build');
  });
  it('a record that disagrees with SITE_URL in the environment fails production', () => {
    failsWith(fixture(), 'does not match SITE_URL', { SITE_URL: 'https://altro-test-domain.it' });
  });
  it('a "noindex, nofollow" page fails production', () => {
    failsWith(fixture({ dist: { ...cleanDist(), 'x/index.html': page('noindex, nofollow') } }), 'x/index.html: robots "noindex, nofollow"');
  });
  it('a record without builtAt, or with an invalid one, fails production (F9)', () => {
    const base = JSON.parse(record()) as Record<string, unknown>;
    const { builtAt: _drop, ...noBuiltAt } = base;
    failsWith(fixture({ dist: { ...cleanDist(), '.build-record.json': JSON.stringify(noBuiltAt) } }), 'build record builtAt is missing');
    failsWith(fixture({ dist: { ...cleanDist(), '.build-record.json': JSON.stringify({ ...base, builtAt: '2026' }) } }), 'is not a valid ISO-8601 UTC timestamp');
  });
  it('a page without a robots meta fails production (F9)', () => {
    const bare = '<!doctype html><html lang="it"><head></head><body><p>ok</p></body></html>';
    failsWith(fixture({ dist: { ...cleanDist(), 'x/index.html': bare } }), 'x/index.html: no <meta name="robots">');
  });
  it('a page with two robots metas fails production (F9)', () => {
    const dup = '<!doctype html><html><head><meta name="robots" content="index, follow"><META NAME=ROBOTS CONTENT="index, follow"></head><body></body></html>';
    failsWith(fixture({ dist: { ...cleanDist(), 'x/index.html': dup } }), 'x/index.html: 2 <meta name="robots"> tags');
  });
  it('an unapproved robots value fails production; an unquoted approved value is parsed (F9)', () => {
    failsWith(fixture({ dist: { ...cleanDist(), 'x/index.html': page('index, nofollow') } }), 'x/index.html: robots "index, nofollow" is not an approved value');
    const unquoted = '<!doctype html><html><head><meta content=noindex,follow name=robots></head><body></body></html>';
    const r = prod(fixture({ dist: { ...cleanDist(), 'x/index.html': unquoted } }));
    expect(r.status, r.output).toBe(FIXTURE_PASS);
    expect(r.stdout).toContain('robots x/index.html: noindex, follow');
  });
  it('a symlink inside dist/ fails production', () => {
    const root = fixture();
    makeSymlink('/etc/hosts', `${root}/dist/linked.txt`);
    failsWith(root, 'symlink in dist/ is not allowed: linked.txt');
  });

  const badOrigins: [string, string][] = [
    ['not https', 'http://medaglia-test-domain.it'],
    ['path', 'https://medaglia-test-domain.it/it'],
    ['.invalid', 'https://site-url-not-set.invalid'],
    ['.test', 'https://medaglia.test'],
    ['.example', 'https://medaglia.example'],
    ['.localhost', 'https://medaglia.localhost'],
    ['localhost', 'https://localhost'],
    ['IPv4', 'https://192.168.1.10'],
    ['IPv6', 'https://[2001:db8::1]'],
    ['example.com', 'https://example.com'],
    ['example.org subdomain', 'https://www.example.org'],
    ['www', 'https://www.medaglia-test-domain.it'],
  ];
  for (const [name, origin] of badOrigins) {
    it(`a production record with an invalid origin (${name}) fails production`, () => {
      failsWith(fixture({ dist: { ...cleanDist(), '.build-record.json': record('production', origin) } }), 'build record siteOrigin');
    });
  }
});

describe('release check CLI — marker scan (S6)', () => {
  const variants: [string, string, string][] = [
    ['index.html', '<p>&#91;MISSING: telefono]</p>', '"[MISSING" (normalised)'],
    ['index.html', '<p>&#x5b;MISSING: telefono]</p>', '"[MISSING" (normalised)'],
    ['index.html', '<p>&lsqb;MISSING: telefono&rsqb;</p>', '"[MISSING" (normalised)'],
    ['index.html', '<p>&lbrack;MISSING: telefono&rbrack;</p>', '"[MISSING" (normalised)'],
    ['index.html', '<a href="/x?q=%5BMISSING%3A%20x%5D">x</a>', '"[MISSING" (normalised)'],
    ['index.html', '<p>[missing: x]</p>', '"[MISSING" (normalised)'],
    ['index.html', '<p>[ MISSING: x]</p>', '"[MISSING" (normalised)'],
    ['index.html', '<p>[<span>MISSING</span>: x]</p>', '"[MISSING" (normalised)'],
    ['index.html', '<p>[MISSING: x]</p>', '"[MISSING" (raw+normalised)'],
    ['logo.svg', '<svg><text>[MISSING: logo]</text></svg>', 'in logo.svg'],
    ['ICON.SVG', '<svg><text>[COPY REVIEW]</text></svg>', 'in ICON.SVG'],
    ['_redirects', '/vecchio https://x.invalid/ 301', 'in _redirects'],
    ['site.webmanifest', '{"name":"[REVIEW WITH CLIENT]"}', 'in site.webmanifest'],
    ['_astro/app.mjs', 'export const x = "[PRE-LAUNCH]";', 'in _astro/app.mjs'],
  ];
  for (const [file, content, expected] of variants) {
    it(`finds ${JSON.stringify(content.slice(0, 40))} in ${file}`, () => {
      const dist = { ...cleanDist(), [file]: file === 'index.html' ? page('index, follow', content) : content };
      const r = prod(fixture({ dist }));
      expect(r.status, r.output).toBe(1);
      expect(r.stdout).toContain(expected);
    });
  }

  it('a real PNG (magic bytes) is not scanned and does not block (fixture exit 3)', () => {
    const r = prod(fixture({ dist: { ...cleanDist(), 'img/photo.PNG': { base64: PNG_1X1 } } }));
    expect(r.status, r.output).toBe(FIXTURE_PASS);
    expect(r.stdout).toContain('4 file(s), 3 scanned as text');
  });
  it('a TEXT file named .png / .woff2 is scanned and its marker is caught (F6)', () => {
    const r = prod(fixture({ dist: { ...cleanDist(), 'img/photo.PNG': '[MISSING: binary]', 'font.woff2': '[MISSING' } }));
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain('leaked marker "[MISSING" (raw+normalised) in img/photo.PNG');
    expect(r.stdout).toContain('leaked marker "[MISSING" (raw+normalised) in font.woff2');
  });
  for (const file of ['docs/brochure.pdf', 'assets/app.js.gz', 'assets/app.js.br', 'download.zip', 'img/logo.svgz', 'x.7z']) {
    it(`an unscannable ${file.slice(file.lastIndexOf('.'))} file fails production; non-production only reports it (F6)`, () => {
      const root = fixture({ dist: { ...cleanDist(), [file]: { base64: PNG_1X1 } } });
      const r = prod(root);
      expect(r.status, r.output).toBe(1);
      expect(r.stdout).toContain(`unscannable file in dist/ (archive / compressed / document type; not in APPROVED_BINARY_ASSETS): ${file}`);
      expect(check(root).status).toBe(0);
    });
  }
});

describe('release check CLI — mode and environment (S3, S8)', () => {
  it('a .env file with PUBLIC_SITE_ENV=production makes the check run in production (same loader as the build)', () => {
    const r = check(fixture({ dist: null, files: { '.env': 'PUBLIC_SITE_ENV=production\n' } }));
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain('mode: PRODUCTION (PUBLIC_SITE_ENV=production)');
  });

  for (const v of ['Production', 'PRODUCTION', ' production', 'prod']) {
    it(`PUBLIC_SITE_ENV=${JSON.stringify(v)} is a bad invocation (exit 2)`, () => {
      const r = check(fixture(), [], { PUBLIC_SITE_ENV: v });
      expect(r.status, r.output).toBe(2);
      expect(r.stderr).toContain('is not allowed');
    });
  }

  it('an invalid PUBLIC_SITE_ENV in a .env file is also exit 2', () => {
    expect(check(fixture({ files: { '.env': 'PUBLIC_SITE_ENV=prod\n' } })).status).toBe(2);
  });

  it('unknown --mode or argument is exit 2', () => {
    expect(check(fixture(), ['--mode=prod']).status).toBe(2);
    expect(check(fixture(), ['--force']).status).toBe(2);
  });

  it('RELEASE_CHECK_ROOT is refused when CONTEXT is set (exit 2)', () => {
    const r = check(fixture(), [], { CONTEXT: 'deploy-preview' });
    expect(r.status, r.output).toBe(2);
    expect(r.stderr).toContain('test-only override');
  });
});

// CONTEXT scenarios (F12): the override is refused whenever CONTEXT is set, so these run
// the check script of an ISOLATED temp copy (scripts/ + src/ copied, node_modules
// symlinked; no .env file, no dist/). The repository's .env* files and dist/ are never read.
describe('release check CLI — CONTEXT in an isolated copy (S3, S8, F12)', () => {
  let copy = '';
  beforeAll(() => {
    copy = makeTempDir('checker');
    created.push(copy);
    copyCheckerProject(copy);
  });

  it('CONTEXT=production runs in production (exit 1: foundation registry and no dist/)', () => {
    const r = runCheckIn(copy, [], { CONTEXT: 'production' });
    expect(r.status, r.output).toBe(1);
    expect(r.stdout).toContain('mode: PRODUCTION (CONTEXT=production)');
    expect(r.stdout).not.toContain('TEST FIXTURE ROOT');
  });
  it('CONTEXT=production with PUBLIC_SITE_ENV=preview is a conflict (exit 2)', () => {
    const r = runCheckIn(copy, [], { CONTEXT: 'production', PUBLIC_SITE_ENV: 'preview' });
    expect(r.status, r.output).toBe(2);
    expect(r.stderr).toContain('conflict');
  });
  it('CONTEXT=deploy-preview with PUBLIC_SITE_ENV=production is a conflict (exit 2)', () => {
    expect(runCheckIn(copy, [], { CONTEXT: 'deploy-preview', PUBLIC_SITE_ENV: 'production' }).status).toBe(2);
  });
  it('CONTEXT=branch-deploy is non-production (exit 0, report only)', () => {
    const r = runCheckIn(copy, [], { CONTEXT: 'branch-deploy' });
    expect(r.status, r.output).toBe(0);
    expect(r.stdout).toContain('mode: NON-PRODUCTION');
  });
});
