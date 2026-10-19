#!/usr/bin/env node
/**
 * Release check — ARCHITECTURE §11.1, §11.5 (Phase 3B foundation).
 *
 * Usage:
 *   npm run release-check                 non-production (default): reports everything, exits 0
 *   npm run release-check:production      production: FAILS on anything that blocks a release
 *   node scripts/check-release.mjs --mode=production
 *   PUBLIC_SITE_ENV=production node scripts/check-release.mjs   (also from .env files)
 *   CONTEXT=production node scripts/check-release.mjs           (Netlify production context)
 *
 * Environment (S3, S8): loaded exactly like the build does — Vite's
 * `loadEnv('production', root, '')` (.env, .env.local, .env.production,
 * .env.production.local; process.env wins) — and resolved by the same module as
 * astro.config.mjs (src/lib/env.ts). 'production' is the mode of a default `astro build`.
 * An invalid PUBLIC_SITE_ENV or a CONTEXT conflict is a bad invocation (exit 2).
 * Stricter wins: production if --mode=production OR the environment says production.
 *
 * How it runs without a TS build step: the registry and the pure modules under src/lib
 * are TypeScript written with erasable syntax only, imported directly through Node's
 * native type stripping (Node >= 24 pinned in .nvmrc / engines). If that fails, the check
 * FAILS — it never passes silently.
 *
 * Implemented layers:
 *   1. Source layer: registry tiers -> FAIL / WARNING / INFO / UNCLASSIFIED WARNING, plus
 *      the frozen §11.4.1 REQUIRED contract (classify.ts REQUIRED_CONTRACT).
 *   2. Output layer (foundation): dist/ must exist with HTML and index.html; the build
 *      record dist/.build-record.json must be a valid production record; no page may carry
 *      the preview "noindex, nofollow"; every HTML page has exactly one approved robots
 *      meta; marker scan (raw + normalised) of every regular file except verified images /
 *      fonts (magic bytes); unscannable archives / documents fail unless approved
 *      (APPROVED_BINARY_ASSETS, empty); symlinks / special files are failures.
 *      R-rule terms, structure invariants and implementation-integrity checks are NOT yet
 *      implemented (build sequence step 7).
 *
 * TEST-ONLY OVERRIDE — RELEASE_CHECK_ROOT=<absolute dir> (F1):
 *   Runs the check against <dir> instead of the repository: env files are loaded from
 *   <dir>, the registry from <dir>/src/content/registry.ts and the output from <dir>/dist.
 *   Used only by the subprocess tests (tests/*.test.ts) with temp fixture roots.
 *   Accepted ONLY when the REAL process env has VITEST === 'true' (set by Vitest itself) AND
 *   no CI is active (none of CI, NETLIFY, CONTEXT, GITHUB_ACTIONS, BUILD_ID is set to a
 *   non-empty value). These are read from process.env only, never from fixture .env files.
 *   Otherwise the override is refused (exit 2). A fixture run can never exit 0 in
 *   production: a production run that would pass exits 3; non-production fixture runs may
 *   exit 0 and are marked "TEST FIXTURE ROOT".
 *
 * Exit codes: 0 = pass/report (repository; or non-production fixture run);
 *   1 = release FAIL or structural error; 2 = bad invocation (incl. a refused override);
 *   3 = production fixture run that would otherwise pass (NEVER a release result).
 * The exit code is set through process.exitCode (no process.exit), so piped output is
 * never truncated.
 */
import { lstat, readdir, readFile, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const errorMessage = (err) => (err instanceof Error ? err.message : String(err));

function fatal(message, code = 1) {
  console.error(`RELEASE CHECK: FAIL — ${message}`);
  return code;
}

/** Env vars that mean a CI / hosted build is active (any non-empty value). */
const CI_ENV_VARS = ['CI', 'NETLIFY', 'CONTEXT', 'GITHUB_ACTIONS', 'BUILD_ID'];

/** Exit code of a production FIXTURE run that would otherwise pass (never 0). */
const FIXTURE_PRODUCTION_PASS_EXIT = 3;

/**
 * Resolve the root: the repository, or the test-only RELEASE_CHECK_ROOT (F1). The
 * conditions are read from the real process env only (fixture .env files are loaded later
 * and can never enable the override).
 */
async function resolveRoot() {
  const override = process.env.RELEASE_CHECK_ROOT;
  if (override === undefined) return { root: REPO_ROOT, fixture: false };
  if (process.env.VITEST !== 'true') {
    return { error: 'RELEASE_CHECK_ROOT is a test-only override and is refused outside Vitest (VITEST is not "true")' };
  }
  const activeCi = CI_ENV_VARS.filter((k) => (process.env[k] ?? '') !== '');
  if (activeCi.length > 0) {
    return { error: `RELEASE_CHECK_ROOT is a test-only override and is refused while CI is active (${activeCi.join(', ')} set)` };
  }
  if (!isAbsolute(override)) return { error: 'RELEASE_CHECK_ROOT must be an absolute path' };
  try {
    if (!(await stat(override)).isDirectory()) return { error: 'RELEASE_CHECK_ROOT is not a directory' };
  } catch (err) {
    return { error: `RELEASE_CHECK_ROOT is not accessible: ${errorMessage(err)}` };
  }
  return { root: override, fixture: true };
}

/**
 * Walk dist/ without following symlinks. Every regular file is read as bytes:
 *  - unscannable types (archives, documents …): content omitted (the classifier fails them
 *    unless approved);
 *  - image / font extensions: content omitted ONLY if the magic bytes match; else scanned;
 *  - everything else: decoded as UTF-8 and scanned.
 */
async function walk(dir, base, classify, out) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const path = relative(base, full).split(sep).join('/');
    if (entry.isSymbolicLink()) out.push({ path, kind: 'symlink' });
    else if (entry.isDirectory()) await walk(full, base, classify, out);
    else if (entry.isFile()) {
      if (classify.isUnscannablePath(path)) {
        out.push({ path, kind: 'file' });
        continue;
      }
      const bytes = await readFile(full);
      if (classify.isBinaryPath(path) && classify.looksLikeBinaryMedia(path, bytes)) out.push({ path, kind: 'file' });
      else out.push({ path, kind: 'file', content: bytes.toString('utf8') });
    } else out.push({ path, kind: 'other' });
  }
  return out;
}

/** dist/ status: { scan } or { unavailable: reason }. Read errors propagate (-> FAIL). */
async function scanDist(dist, classify) {
  let info;
  try {
    info = await lstat(dist);
  } catch (err) {
    if (err && err.code === 'ENOENT') return { unavailable: 'dist/ does not exist' };
    throw err;
  }
  if (info.isSymbolicLink()) return { unavailable: 'dist/ is a symlink (not allowed)' };
  if (!info.isDirectory()) return { unavailable: 'dist/ is not a directory' };
  const entries = await walk(dist, dist, classify, []);
  return { scan: classify.analyseDist(entries) };
}

async function main() {
  const rootResult = await resolveRoot();
  if ('error' in rootResult) return fatal(`invalid invocation: ${rootResult.error}`, 2);
  const { root: ROOT, fixture } = rootResult;

  let classify;
  let loadEnv;
  try {
    classify = await import('../src/lib/release/classify.ts');
    ({ loadEnv } = await import('vite'));
  } catch (err) {
    return fatal(`could not load the checker modules: ${errorMessage(err)}`);
  }

  let env;
  try {
    env = loadEnv('production', ROOT, '');
  } catch (err) {
    return fatal(`could not load the environment: ${errorMessage(err)}`);
  }

  const modeResult = classify.resolveMode(process.argv.slice(2), env);
  if (!modeResult.ok) return fatal(`invalid invocation: ${modeResult.error}`, 2);
  const mode = modeResult.mode;

  let registry;
  let loadError;
  try {
    const mod = await import(pathToFileURL(join(ROOT, 'src', 'content', 'registry.ts')).href);
    registry = mod.registry;
  } catch (err) {
    loadError = errorMessage(err);
  }

  let dist;
  try {
    dist = await scanDist(join(ROOT, 'dist'), classify);
  } catch (err) {
    return fatal(`could not scan dist/: ${errorMessage(err)}`);
  }

  const siteUrl = env.SITE_URL;
  const result = classify.runReleaseCheck({
    mode,
    registry,
    ...(loadError !== undefined ? { loadError } : {}),
    output: dist.scan ?? null,
    ...(dist.unavailable !== undefined ? { outputUnavailableReason: dist.unavailable } : {}),
    ...(siteUrl !== undefined && siteUrl !== '' ? { siteUrl } : {}),
  });

  // ---- Report -------------------------------------------------------------------------
  const prod = mode === 'production';
  const line = '-'.repeat(72);
  console.log(line);
  console.log(`RELEASE CHECK — mode: ${mode.toUpperCase()} (${modeResult.reason})`);
  if (fixture) console.log(`TEST FIXTURE ROOT (RELEASE_CHECK_ROOT): ${ROOT} — NOT A RELEASE RESULT FOR THIS REPOSITORY`);
  if (!prod) console.log(classify.NON_PRODUCTION_NOTICE);
  console.log(line);

  if (result.errors.length > 0) {
    console.log('STRUCTURAL ERRORS (fail in every mode):');
    for (const e of result.errors) console.log(`  ERROR  ${e}`);
    console.log(line);
  }

  const completeness =
    result.errors.length > 0 ? 'UNKNOWN (registry invalid)' : result.registryComplete ? 'yes' : 'NO (foundation subset of §11.4)';
  console.log(`Registry: ${result.checked} item(s) checked; complete: ${completeness}`);
  console.log(`Unresolved: ${result.findings.length}`);
  for (const f of result.findings) {
    const outcome = f.note ? `${f.outcome} "${f.note}"` : f.outcome;
    const effect = f.outcome === 'FAIL' && !prod ? ' (would FAIL in production; reported only)' : '';
    console.log(`  [${outcome}] ${f.id} — ${f.name}${effect}`);
    console.log(`      tier:     ${f.tier.toUpperCase()}`);
    console.log(`      fallback: ${f.fallback}`);
    console.log(`      source:   ${f.source}`);
    if (f.labels.length > 0) console.log(`      markers:  ${f.labels.join(' ')}`);
  }
  console.log(line);

  const tag = prod ? 'FAIL' : 'REPORT';
  console.log(`REQUIRED contract (§11.4.1, ${Object.keys(classify.REQUIRED_CONTRACT).length} items): ${result.contractViolations.length} violation(s)`);
  for (const v of result.contractViolations) console.log(`  [${tag}] ${v}`);
  console.log(line);

  const out = result.output;
  if (out === null) {
    console.log(`Output layer: not scanned — ${dist.unavailable}${prod ? ' (FAIL in production)' : ''}`);
  } else {
    console.log(
      `Output layer (foundation): ${out.fileCount} file(s), ${out.scannedCount} scanned as text, ${out.htmlFiles.length} HTML; index.html: ${out.hasIndexHtml ? 'yes' : 'NO'}`,
    );
    const rec = out.buildRecord;
    if (!rec.present) console.log('  build record: MISSING');
    else if ('parseError' in rec) console.log(`  build record: NOT VALID JSON (${rec.parseError})`);
    else console.log(`  build record: ${JSON.stringify(rec.parsed)}`);
    for (const p of out.robots) console.log(`  robots ${p.file}: ${p.values.length > 0 ? p.values.join(' | ') : '(none)'}`);
    for (const p of out.problems) console.log(`  [${tag}] ${p}`);
    console.log(`  markers found: ${out.markers.length}`);
    for (const o of out.markers) {
      const how = o.raw && o.normalised ? 'raw+normalised' : o.raw ? 'raw' : 'normalised';
      console.log(`  [${tag}] ${JSON.stringify(o.marker)} (${how}) in ${o.file}`);
    }
  }
  console.log('Not yet implemented: R-rule term scan, structure invariants, implementation-integrity checks (§11.5; build step 7).');
  console.log(line);

  if (!prod && result.productionBlockers.length > 0) {
    console.log(`Would block a production release (${result.productionBlockers.length}; reported only):`);
    for (const b of result.productionBlockers) console.log(`  - ${b}`);
    console.log(line);
  }

  if (result.exitCode !== 0) {
    console.log('RESULT: FAIL');
    for (const f of result.failures) console.log(`  - ${f}`);
    return result.exitCode;
  }
  if (prod && fixture) {
    console.log(
      `RESULT: FIXTURE PASS (TEST FIXTURE ROOT — NOT A RELEASE RESULT; exit ${FIXTURE_PRODUCTION_PASS_EXIT}, never 0)`,
    );
    return FIXTURE_PRODUCTION_PASS_EXIT;
  }
  if (prod) console.log('RESULT: PASS');
  else console.log(`RESULT: REPORT ONLY — ${classify.NON_PRODUCTION_NOTICE}${fixture ? ' (TEST FIXTURE ROOT)' : ''}`);
  return result.exitCode;
}

try {
  process.exitCode = await main();
} catch (err) {
  process.exitCode = fatal(`unexpected error: ${errorMessage(err)}`);
}
