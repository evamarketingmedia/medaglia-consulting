import { describe, expect, it } from 'vitest';
import {
  NON_PRODUCTION_NOTICE,
  REQUIRED_CONTRACT,
  UNCLASSIFIED_NOTICE,
  analyseDist,
  checkRequiredContract,
  evaluateItem,
  APPROVED_BINARY_ASSETS,
  extractRobots,
  isBinaryPath,
  isUnscannablePath,
  looksLikeBinaryMedia,
  outcomeForTier,
  resolveMode,
  runReleaseCheck,
  scanOutput,
  type DistEntry,
  type DistScan,
  type ReleaseMode,
} from '../src/lib/release/classify.ts';
import { normaliseForScan } from '../src/lib/release/markers.ts';
import { createBuildRecord } from '../src/lib/build-record.ts';
import { registry } from '../src/content/registry.ts';
import { bytesOf } from './helpers/node-io.mjs';

// ---- Fixtures (UNCLASSIFIED exists only here, never in the real registry) ----
const required = { id: 'FX-R', name: 'Fixture required', source: 'test', tier: 'required', omitAllowed: false, slot: { state: 'missing', labels: ['[MISSING: x]'] } };
const important = { id: 'FX-I', name: 'Fixture important', source: 'test', tier: 'important', omitAllowed: false, slot: { state: 'missing', labels: [] }, fallback: { kind: 'omit', ref: 'test omit' } };
const optional = { id: 'FX-O', name: 'Fixture optional', source: 'test', tier: 'optional', omitAllowed: false, slot: { state: 'missing', labels: [] }, fallback: { kind: 'approved', ref: 'test wording' } };
const unclassified = { id: 'FX-U', name: 'Fixture unclassified', source: 'test', tier: 'unclassified', omitAllowed: false, slot: { state: 'missing', labels: [] } };

// The §11.4.1 contract items, all resolved — fixture data only (never in src/).
const contractItems = Object.entries(REQUIRED_CONTRACT).map(([id, c]) => ({
  id,
  name: `Fixture ${id}`,
  source: 'test',
  tier: 'required',
  omitAllowed: c.omitAllowed,
  slot: { state: 'value', value: `Valore di prova confermato ${id}` },
}));
const reg = (items: unknown[], complete = true) => ({ complete, items: [...contractItems, ...items] });

// A clean production dist/ (fixture domain, never in src/).
const FIXTURE_ORIGIN = 'https://medaglia-test-domain.it';
const page = (robots: string) => `<!doctype html><html><head><meta name="robots" content="${robots}"></head><body><p>ok</p></body></html>`;
const record = (siteEnv: 'production' | 'non-production' = 'production', site = FIXTURE_ORIGIN) =>
  JSON.stringify(createBuildRecord({ siteEnv, site, builtAt: new Date('2026-10-19T00:00:00Z') }));
const dist = (extra: DistEntry[] = [], rec: string | null = record()): DistScan =>
  analyseDist([
    { path: 'index.html', kind: 'file', content: page('index, follow') },
    ...(rec === null ? [] : [{ path: '.build-record.json', kind: 'file' as const, content: rec }]),
    ...extra,
  ]);
const run = (registry: unknown, mode: ReleaseMode = 'production', output: DistScan | null = dist()) =>
  runReleaseCheck({ mode, registry, output });

describe('tier outcomes (§11.1)', () => {
  it('maps each tier to its outcome', () => {
    expect(outcomeForTier('required')).toBe('FAIL');
    expect(outcomeForTier('important')).toBe('WARNING');
    expect(outcomeForTier('optional')).toBe('INFO');
    expect(outcomeForTier('unclassified')).toBe('WARNING');
  });

  it('IMPORTANT unresolved is a WARNING and never fails production', () => {
    const r = run(reg([important]));
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]?.outcome).toBe('WARNING');
    expect(r.findings[0]?.fallback).toContain('test omit');
    expect(r.exitCode).toBe(0);
  });

  it('OPTIONAL unresolved is INFO and never fails production', () => {
    const r = run(reg([optional]));
    expect(r.findings[0]?.outcome).toBe('INFO');
    expect(r.exitCode).toBe(0);
  });

  it('UNCLASSIFIED unresolved is the owner-review WARNING and never fails production', () => {
    const r = run(reg([unclassified]));
    expect(r.findings[0]?.outcome).toBe('WARNING');
    expect(r.findings[0]?.note).toBe(UNCLASSIFIED_NOTICE);
    expect(UNCLASSIFIED_NOTICE).toBe('UNCLASSIFIED — OWNER REVIEW REQUIRED');
    expect(r.exitCode).toBe(0);
  });

  it('reports every unresolved item with id, name, tier and fallback', () => {
    const r = run(reg([required, important, optional, unclassified]), 'non-production');
    expect(r.findings.map((f) => [f.id, f.tier])).toEqual([
      ['FX-R', 'required'],
      ['FX-I', 'important'],
      ['FX-O', 'optional'],
      ['FX-U', 'unclassified'],
    ]);
    for (const f of r.findings) {
      expect(f.name).not.toBe('');
      expect(f.fallback).not.toBe('');
    }
  });
});

describe('production vs non-production', () => {
  it('production FAILS on an unresolved REQUIRED item', () => {
    const r = run(reg([required, important]));
    expect(r.exitCode).toBe(1);
    expect(r.failures.some((f) => f.includes('FX-R'))).toBe(true);
  });

  it('non-production reports the REQUIRED item but exits 0', () => {
    const r = run(reg([required]), 'non-production', null);
    expect(r.findings[0]?.outcome).toBe('FAIL');
    expect(r.exitCode).toBe(0);
    expect(NON_PRODUCTION_NOTICE).toBe('NON-PRODUCTION MODE — NOT A LAUNCH-READINESS RESULT');
  });

  it('production passes only when nothing REQUIRED is unresolved, registry complete and output clean', () => {
    const resolved = { ...required, slot: { state: 'value', value: '+39 02 1234567' } };
    expect(run(reg([resolved, important, optional, unclassified])).exitCode).toBe(0);
  });

  it('production FAILS on an incomplete registry', () => {
    const r = run(reg([important], false));
    expect(r.exitCode).toBe(1);
  });

  it('production FAILS when dist/ output was not available', () => {
    expect(run(reg([important]), 'production', null).exitCode).toBe(1);
  });

  it('production FAILS on a leaked marker; non-production only reports it', () => {
    const leak = dist([{ path: 'a/index.html', kind: 'file', content: '<p>[MISSING: x]</p>' }]);
    expect(run(reg([important]), 'production', leak).exitCode).toBe(1);
    expect(run(reg([important]), 'non-production', leak).exitCode).toBe(0);
  });

  it('the real (foundation) registry fails production and passes non-production', () => {
    const prod = runReleaseCheck({ mode: 'production', registry, output: dist() });
    expect(prod.exitCode).toBe(1);
    expect(prod.errors).toEqual([]);
    const nonProd = runReleaseCheck({ mode: 'non-production', registry, output: null });
    expect(nonProd.exitCode).toBe(0);
    expect(nonProd.findings.map((f) => f.id)).toEqual(['R6', 'R7', 'R19', 'I1', 'R14', 'U5']);
  });

  it('the real registry fails production on EACH unresolved REQUIRED item by name (R6, R7, R19)', () => {
    const prod = runReleaseCheck({ mode: 'production', registry, output: dist() });
    for (const id of ['R6', 'R7', 'R19']) {
      expect(prod.failures.some((f) => f.startsWith(`REQUIRED item unresolved: ${id} `))).toBe(true);
    }
  });

  it('the real registry R1 (phone) is resolved and is no longer a production failure', () => {
    const r1 = registry.items.find((i) => i.id === 'R1');
    expect(r1?.slot).toEqual({ state: 'value', value: '0039 334 1201847' });
    expect(evaluateItem(r1, 0).kind).toBe('resolved');
    const prod = runReleaseCheck({ mode: 'production', registry, output: dist() });
    expect(prod.failures.some((f) => /\bR1\b/.test(f))).toBe(false);
    expect(prod.errors).toEqual([]);
  });

  for (const id of ['R1', 'R6', 'R7', 'R19']) {
    it(`a complete registry with only ${id} unresolved still FAILS production on ${id}`, () => {
      const items = contractItems.map((i) => (i.id === id ? { ...i, slot: { state: 'missing', labels: [] } } : i));
      const r = runReleaseCheck({ mode: 'production', registry: { complete: true, items }, output: dist() });
      expect(r.exitCode).toBe(1);
      expect(r.failures).toEqual([`REQUIRED item unresolved: ${id} Fixture ${id}`]);
    });
  }
});

describe('never a silent pass', () => {
  const bad: [string, unknown][] = [
    ['undefined registry', undefined],
    ['null registry', null],
    ['non-object registry', 'nope'],
    ['empty registry', { complete: true, items: [] }],
    ['items not an array', { complete: true, items: {} }],
    ['complete flag missing', { items: [important] }],
    ['unknown tier', reg([{ ...required, tier: 'requird' }])],
    ['missing tier', reg([{ ...required, tier: undefined }])],
    ['IMPORTANT without fallback', reg([{ ...important, fallback: undefined }])],
    ['REQUIRED with fallback', reg([{ ...required, fallback: { kind: 'omit', ref: 'x' } }])],
    ['duplicate id', reg([important, important])],
    ['malformed slot', reg([{ ...required, slot: { state: 'maybe' } }])],
    ['missing id', reg([{ ...required, id: '' }])],
  ];
  for (const mode of ['production', 'non-production'] as const) {
    for (const [name, value] of bad) {
      it(`${mode}: ${name} -> FAIL`, () => {
        const r = run(value, mode);
        expect(r.errors.length).toBeGreaterThan(0);
        expect(r.exitCode).toBe(1);
      });
    }
    it(`${mode}: load error -> FAIL`, () => {
      const r = runReleaseCheck({ mode, registry: undefined, loadError: 'boom', output: dist() });
      expect(r.exitCode).toBe(1);
    });
  }
});

describe('REQUIRED contract (S2)', () => {
  it('is frozen and matches §11.4.1 (15 IDs; only R7 and R12 omit-allowed)', () => {
    expect(Object.isFrozen(REQUIRED_CONTRACT)).toBe(true);
    expect(Object.isFrozen(REQUIRED_CONTRACT['R1'])).toBe(true);
    expect(Object.keys(REQUIRED_CONTRACT)).toEqual(['R1', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R16', 'R17', 'R18', 'R19']);
    expect(Object.entries(REQUIRED_CONTRACT).filter(([, c]) => c.omitAllowed).map(([id]) => id)).toEqual(['R7', 'R12']);
    expect(() => {
      (REQUIRED_CONTRACT as Record<string, unknown>)['R99'] = { tier: 'required', omitAllowed: true };
    }).toThrow();
  });

  it('a complete, fully resolved contract registry passes production', () => {
    expect(run(reg([])).failures).toEqual([]);
  });

  it('a missing (deleted) REQUIRED ID fails production even with complete:true', () => {
    const items = contractItems.filter((i) => i.id !== 'R3');
    const r = run({ complete: true, items });
    expect(r.exitCode).toBe(1);
    expect(r.failures).toEqual(['REQUIRED contract: R3: absent from the registry (REQUIRED, §11.4.1)']);
  });

  it('a re-tiered REQUIRED ID fails production', () => {
    const items = contractItems.map((i) =>
      i.id === 'R4' ? { ...i, tier: 'important', fallback: { kind: 'omit', ref: 'x' } } : i,
    );
    const r = run({ complete: true, items });
    expect(r.exitCode).toBe(1);
    expect(r.contractViolations).toEqual(['R4: tier is "important", the contract requires "required" (§11.4.1)']);
  });

  it('a changed omitAllowed fails production (either direction)', () => {
    const items = contractItems.map((i) =>
      i.id === 'R12' ? { ...i, omitAllowed: false } : i.id === 'R1' ? { ...i, omitAllowed: true } : i,
    );
    expect(checkRequiredContract(items)).toEqual([
      'R1: omitAllowed is true, the contract requires false (§11.4.1)',
      'R12: omitAllowed is false, the contract requires true (§11.4.1)',
    ]);
    expect(run({ complete: true, items }).exitCode).toBe(1);
  });

  it('non-production lists contract violations but exits 0', () => {
    const r = runReleaseCheck({ mode: 'non-production', registry, output: null });
    expect(r.exitCode).toBe(0);
    expect(r.contractViolations).toHaveLength(11);
    expect(r.contractViolations[0]).toBe('R3: absent from the registry (REQUIRED, §11.4.1)');
  });
});

describe('output layer (S5)', () => {
  it('fails production when dist/ is unavailable, empty, or without index.html', () => {
    expect(runReleaseCheck({ mode: 'production', registry: reg([]), output: null, outputUnavailableReason: 'dist/ does not exist' }).failures)
      .toEqual(['build output (dist/) not available — dist/ does not exist; output layer could not be verified']);
    const empty = run(reg([]), 'production', analyseDist([]));
    expect(empty.failures).toContain('dist/ contains no HTML files');
    expect(empty.failures).toContain('dist/index.html is missing');
    const noIndex = run(reg([]), 'production', analyseDist([
      { path: 'chi-siamo/index.html', kind: 'file', content: page('index, follow') },
      { path: '.build-record.json', kind: 'file', content: record() },
    ]));
    expect(noIndex.failures).toEqual(['dist/index.html is missing']);
  });

  it('fails production on a missing, unparseable, invalid or preview build record', () => {
    expect(run(reg([]), 'production', dist([], null)).failures[0]).toContain('build record dist/.build-record.json is missing');
    expect(run(reg([]), 'production', dist([], '{nope')).failures[0]).toContain('is not valid JSON');
    expect(run(reg([]), 'production', dist([], JSON.stringify({ ...JSON.parse(record()), schema: 'x' }))).exitCode).toBe(1);
    expect(run(reg([]), 'production', dist([], JSON.stringify({ ...JSON.parse(record()), secret: 'x' }))).failures[0]).toContain('unexpected key "secret"');
    expect(run(reg([]), 'production', dist([], record('non-production'))).failures).toContain(
      'build record siteEnv is "non-production": dist/ is not a production build',
    );
  });

  it('fails production when the record origin is invalid or disagrees with SITE_URL in the env', () => {
    expect(run(reg([]), 'production', dist([], record('production', 'https://www.medaglia-test-domain.it'))).exitCode).toBe(1);
    const mismatch = runReleaseCheck({ mode: 'production', registry: reg([]), output: dist(), siteUrl: 'https://other-test-domain.it' });
    expect(mismatch.failures[0]).toContain('does not match SITE_URL');
    expect(runReleaseCheck({ mode: 'production', registry: reg([]), output: dist(), siteUrl: FIXTURE_ORIGIN }).exitCode).toBe(0);
  });

  it('fails production on any "noindex, nofollow" page; "noindex, follow" is allowed', () => {
    const ok = run(reg([]), 'production', dist([{ path: 'grazie/index.html', kind: 'file', content: page('noindex, follow') }]));
    expect(ok.exitCode).toBe(0);
    for (const v of ['noindex, nofollow', 'NOINDEX,NOFOLLOW', 'nofollow, noindex', 'none']) {
      const bad = run(reg([]), 'production', dist([{ path: 'x/index.html', kind: 'file', content: page(v) }]));
      expect(bad.exitCode, v).toBe(1);
    }
  });

  it('fails production on symlinks and special files in dist/', () => {
    expect(run(reg([]), 'production', dist([{ path: 'link', kind: 'symlink' }])).failures).toEqual(['symlink in dist/ is not allowed: link']);
    expect(run(reg([]), 'production', dist([{ path: 'fifo', kind: 'other' }])).exitCode).toBe(1);
  });

  it('extracts robots values in either attribute order and quote style', () => {
    expect(extractRobots(`<meta content='noindex,follow' name='robots'><meta name=robots content="index, follow">`)).toEqual([
      'noindex, follow',
      'index, follow',
    ]);
  });

  it('parses robots metas robustly: unquoted, upper-case, extra attributes, no content (F9)', () => {
    expect(extractRobots('<meta name=robots content=noindex,follow>')).toEqual(['noindex, follow']);
    expect(extractRobots('<META NAME="ROBOTS" CONTENT="INDEX, FOLLOW" />')).toEqual(['index, follow']);
    expect(extractRobots('<meta data-x="1" content="index, follow" name="robots"/>')).toEqual(['index, follow']);
    expect(extractRobots('<meta name="robots">')).toEqual(['']);
    expect(extractRobots('<meta data-name="robots" content="index, follow"><meta name="googlebot" content="noindex">')).toEqual([]);
    expect(extractRobots('<meta name="description" content="robots">')).toEqual([]);
  });

  it('every production page needs exactly ONE robots meta with an approved value (F9)', () => {
    const html = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`;
    const fails = (head: string, text: string) => {
      const r = run(reg([]), 'production', dist([{ path: 'x/index.html', kind: 'file', content: html(head) }]));
      expect(r.exitCode, head).toBe(1);
      expect(r.failures.join('\n'), head).toContain(text);
      expect(run(reg([]), 'non-production', dist([{ path: 'x/index.html', kind: 'file', content: html(head) }])).exitCode).toBe(0);
    };
    fails('', 'x/index.html: no <meta name="robots">');
    fails('<meta name="robots" content="index, follow"><meta name="robots" content="index, follow">', 'x/index.html: 2 <meta name="robots"> tags');
    fails('<meta name="robots" content="index, follow"><meta name=ROBOTS content=noindex,follow>', '2 <meta name="robots"> tags');
    fails('<meta name="robots">', 'x/index.html: robots "" is not an approved value');
    fails('<meta name="robots" content="index, nofollow">', 'robots "index, nofollow" is not an approved value');
    fails('<meta name="robots" content="noindex">', 'robots "noindex" is not an approved value');
    fails('<meta name="robots" content="all">', 'robots "all" is not an approved value');
    for (const ok of ['<meta name=robots content="index, follow">', "<meta content='noindex, follow' name='robots'>", '<meta name=robots content=index,follow>']) {
      expect(run(reg([]), 'production', dist([{ path: 'x/index.html', kind: 'file', content: html(ok) }])).exitCode, ok).toBe(0);
    }
  });

  it('rejects an invalid mode (defence in depth) instead of treating it as non-production', () => {
    const r = runReleaseCheck({ mode: 'prod' as ReleaseMode, registry: reg([]), output: dist() });
    expect(r.mode).toBe('production');
    expect(r.exitCode).toBe(1);
  });
});

describe('resolveMode (S8)', () => {
  it('defaults to non-production', () => {
    expect(resolveMode([], {})).toMatchObject({ ok: true, mode: 'non-production' });
  });
  it('accepts --mode=production, PUBLIC_SITE_ENV=production and CONTEXT=production', () => {
    expect(resolveMode(['--mode=production'], {})).toMatchObject({ ok: true, mode: 'production' });
    expect(resolveMode([], { PUBLIC_SITE_ENV: 'production' })).toMatchObject({ ok: true, mode: 'production' });
    expect(resolveMode([], { CONTEXT: 'production' })).toMatchObject({ ok: true, mode: 'production' });
  });
  it('production env wins over a non-production flag (stricter)', () => {
    expect(resolveMode(['--mode=non-production'], { PUBLIC_SITE_ENV: 'production' })).toMatchObject({ ok: true, mode: 'production' });
    expect(resolveMode(['--mode=non-production'], { CONTEXT: 'production' })).toMatchObject({ ok: true, mode: 'production' });
  });
  it('preview / development / deploy previews are non-production', () => {
    for (const env of [{ PUBLIC_SITE_ENV: 'preview' }, { PUBLIC_SITE_ENV: 'development' }, { CONTEXT: 'deploy-preview' }, { CONTEXT: 'branch-deploy' }]) {
      expect(resolveMode([], env)).toMatchObject({ ok: true, mode: 'non-production' });
    }
  });
  it('rejects unknown values, mis-cased env values, conflicts and arguments', () => {
    expect(resolveMode(['--mode=prod'], {}).ok).toBe(false);
    expect(resolveMode(['--force'], {}).ok).toBe(false);
    for (const v of ['Production', 'PRODUCTION', ' production', 'prod', 'staging']) {
      expect(resolveMode([], { PUBLIC_SITE_ENV: v }).ok, v).toBe(false);
      expect(resolveMode(['--mode=production'], { PUBLIC_SITE_ENV: v }).ok, v).toBe(false);
    }
    expect(resolveMode([], { CONTEXT: 'production', PUBLIC_SITE_ENV: 'preview' }).ok).toBe(false);
    expect(resolveMode([], { CONTEXT: 'production', PUBLIC_SITE_ENV: 'development' }).ok).toBe(false);
    expect(resolveMode([], { CONTEXT: 'deploy-preview', PUBLIC_SITE_ENV: 'production' }).ok).toBe(false);
  });
});

describe('marker scan (S6)', () => {
  it('finds raw markers and ignores clean files', () => {
    const found = scanOutput([
      { path: 'a.html', content: '<p>[MISSING: numero di telefono]</p>' },
      { path: 'b.html', content: '<link rel="canonical" href="https://x.invalid/">' },
      { path: 'c.html', content: '<p>ok</p>' },
    ]);
    expect(found).toEqual([
      { file: 'a.html', marker: '[MISSING', raw: true, normalised: true },
      { file: 'b.html', marker: '.invalid', raw: true, normalised: true },
    ]);
  });

  const encoded: [string, string][] = [
    ['decimal entity', '<p>&#91;MISSING: x]</p>'],
    ['hex entity', '<p>&#x5b;MISSING: x]</p>'],
    ['hex entity upper', '<p>&#X5B;MISSING: x]</p>'],
    ['&lsqb;', '<p>&lsqb;MISSING: x&rsqb;</p>'],
    ['&lbrack;', '<p>&lbrack;MISSING: x&rbrack;</p>'],
    ['double-encoded &amp;#91;', '<p>&amp;#91;MISSING: x]</p>'],
    ['percent-encoded', '<a href="/x?%5BMISSING%3A%20x%5D">x</a>'],
    ['lower-case', '<p>[missing: x]</p>'],
    ['space after [', '<p>[ MISSING: x]</p>'],
    ['nbsp after [', '<p>[&nbsp;MISSING: x]</p>'],
    ['split by tags', '<p>[<span>MISSING</span>: x]</p>'],
    ['split inside the word', '<p>[MIS<b>SING: x]</p>'],
    ['zero-width inside', '<p>[MIS\u200bSING: x]</p>'],
    ['mixed case review', '<p>[Review With Client]</p>'],
    ['upper-case invalid host', '<a href="https://X.INVALID/">x</a>'],
    ['split design note', 'Phase 3 <em>design</em>\n note'],
    ['encoded {BASE}', '<a href="%7BBASE%7D/x">x</a>'],
  ];
  for (const [name, content] of encoded) {
    it(`finds a normalised marker: ${name}`, () => {
      const found = scanOutput([{ path: 'x.html', content }]);
      expect(found.length, name).toBeGreaterThan(0);
      expect(found.every((f) => f.normalised)).toBe(true);
    });
  }

  it('keeps raw text on malformed percent-encoding and stays bounded', () => {
    expect(normaliseForScan('100%ZZ [MISSING %E0%A4%A')).toBe('100%zz [missing %e0%a4%a');
    expect(normaliseForScan('&#99999999;')).toBe('&#99999999;');
  });

  it('does not flag ordinary copy', () => {
    expect(scanOutput([{ path: 'x.html', content: '<p>Consulenza commerciale nel Nord Italia: [vedi sotto] e opzioni.</p>' }])).toEqual([]);
  });

  it('image / font extensions (any case) are the only binary-media candidates; archives and documents are unscannable (F6)', () => {
    for (const p of ['a.png', 'b.JPG', 'c/d.Woff2', 'e.ico', 'f.eot', 'g.avif']) expect(isBinaryPath(p), p).toBe(true);
    for (const p of ['e.pdf', 'f.wasm', 'g.br', 'h.GZ', 'i.zip', 'j.svgz', 'k.7z', 'l.rar', 'm.tar', 'n.docx', 'o.mp4']) {
      expect(isBinaryPath(p), p).toBe(false);
      expect(isUnscannablePath(p), p).toBe(true);
    }
    for (const p of ['_redirects', 'logo.svg', 'LOGO.SVG', 'site.webmanifest', 'app.mjs', 'robots.txt', '.build-record.json', 'x.bmp']) {
      expect(isBinaryPath(p), p).toBe(false);
      expect(isUnscannablePath(p), p).toBe(false);
    }
    expect(APPROVED_BINARY_ASSETS.size).toBe(0);
  });

  it('magic bytes decide whether an image / font is skipped (F6)', () => {
    const png = bytesOf('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    const text = new TextEncoder().encode('[MISSING: not an image]');
    expect(looksLikeBinaryMedia('a.png', png)).toBe(true);
    expect(looksLikeBinaryMedia('a.PNG', png)).toBe(true);
    expect(looksLikeBinaryMedia('a.png', text)).toBe(false);
    expect(looksLikeBinaryMedia('a.jpg', png)).toBe(false);
    expect(looksLikeBinaryMedia('a.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(looksLikeBinaryMedia('a.gif', new TextEncoder().encode('GIF89a....'))).toBe(true);
    expect(looksLikeBinaryMedia('a.webp', new TextEncoder().encode('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '))).toBe(true);
    expect(looksLikeBinaryMedia('a.webp', new TextEncoder().encode('RIFF....WAVE'))).toBe(false);
    expect(looksLikeBinaryMedia('a.woff2', new TextEncoder().encode('wOF2rest'))).toBe(true);
    expect(looksLikeBinaryMedia('a.woff', new TextEncoder().encode('wOF2rest'))).toBe(false);
    expect(looksLikeBinaryMedia('a.ttf', new Uint8Array([0, 1, 0, 0, 0]))).toBe(true);
    expect(looksLikeBinaryMedia('a.otf', new TextEncoder().encode('OTTO'))).toBe(true);
    expect(looksLikeBinaryMedia('a.ico', new Uint8Array([0, 0, 1, 0, 1]))).toBe(true);
    expect(looksLikeBinaryMedia('a.png', new Uint8Array([]))).toBe(false);
    expect(looksLikeBinaryMedia('a.txt', png)).toBe(false);
  });

  it('an unscannable file is a problem unless its exact path is approved (allowlist mechanism, F6)', () => {
    const entries: DistEntry[] = [
      { path: 'index.html', kind: 'file', content: page('index, follow') },
      { path: 'docs/brochure.pdf', kind: 'file' },
    ];
    expect(analyseDist(entries).problems).toEqual([
      'unscannable file in dist/ (archive / compressed / document type; not in APPROVED_BINARY_ASSETS): docs/brochure.pdf',
    ]);
    expect(analyseDist(entries, new Set(['docs/brochure.pdf'])).problems).toEqual([]);
    expect(analyseDist(entries, new Set(['brochure.pdf'])).problems).toHaveLength(1);
    expect(analyseDist(entries, new Set(['docs/BROCHURE.pdf'])).problems).toHaveLength(1);
    const prodRun = run(reg([]), 'production', dist([{ path: 'a.js.gz', kind: 'file' }]));
    expect(prodRun.exitCode).toBe(1);
    expect(run(reg([]), 'non-production', dist([{ path: 'a.js.gz', kind: 'file' }])).exitCode).toBe(0);
  });

  it('a text file named .png (content provided by the walker) is scanned (F6)', () => {
    const scan = analyseDist([{ path: 'img/x.png', kind: 'file', content: '[MISSING: x]' }]);
    expect(scan.markers.map((m) => m.file)).toEqual(['img/x.png']);
    expect(scan.scannedCount).toBe(1);
  });

  it('analyseDist scans non-HTML text files and skips binaries', () => {
    const scan = analyseDist([
      { path: 'logo.svg', kind: 'file', content: '<svg><text>[MISSING: logo]</text></svg>' },
      { path: '_redirects', kind: 'file', content: '/old https://x.invalid/ 301' },
      { path: 'site.webmanifest', kind: 'file', content: '{"name":"[COPY REVIEW]"}' },
      { path: 'photo.PNG', kind: 'file' },
    ]);
    expect(scan.markers.map((m) => [m.file, m.marker])).toEqual([
      ['logo.svg', '[MISSING'],
      ['_redirects', '.invalid'],
      ['site.webmanifest', '[COPY REVIEW]'],
    ]);
    expect(scan.fileCount).toBe(4);
    expect(scan.scannedCount).toBe(3);
  });
});
