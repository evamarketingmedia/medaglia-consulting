/**
 * Node I/O helpers for the subprocess / build integration tests.
 *
 * Plain JavaScript on purpose: @types/node is not an approved dependency (ARCHITECTURE §1),
 * so Node built-ins cannot be imported from type-checked .ts files. The TypeScript tests
 * import these helpers; all assertions stay in TypeScript.
 *
 * Everything is created under os.tmpdir() and removed by the caller; the repository is
 * only ever READ (source files are copied out, node_modules entries are symlinked).
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const CHECK_SCRIPT = join(REPO_ROOT, 'scripts', 'check-release.mjs');
const ASTRO_BIN = join(REPO_ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs');

/**
 * Env vars that would change the result; stripped from the inherited env of every subprocess
 * (F12: controlled inputs). The CI markers are stripped too, so the suite behaves the same
 * locally and on CI; a test that needs one sets it explicitly. VITEST is inherited (Vitest
 * sets it) unless a test unsets it with `null`.
 */
const CONTROLLED = [
  'PUBLIC_SITE_ENV',
  'SITE_URL',
  'CONTEXT',
  'RELEASE_CHECK_ROOT',
  'NODE_ENV',
  'CI',
  'NETLIFY',
  'GITHUB_ACTIONS',
  'BUILD_ID',
];

/** @param {string} prefix */
export function makeTempDir(prefix) {
  return mkdtempSync(join(tmpdir(), `medaglia-${prefix}-`));
}

/** @param {string} dir */
export function removeDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/**
 * Write files under root. A `null` value creates an empty directory; `{ base64 }` writes
 * those bytes (binary fixtures such as a real PNG).
 * @param {string} root
 * @param {Record<string, string | null | { base64: string }>} files
 */
export function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    if (content === null) {
      mkdirSync(full, { recursive: true });
      continue;
    }
    mkdirSync(dirname(full), { recursive: true });
    if (typeof content === 'string') writeFileSync(full, content, 'utf8');
    else writeFileSync(full, Buffer.from(content.base64, 'base64'));
  }
}

/** @param {string} base64 @returns {Uint8Array} */
export function bytesOf(base64) {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/** @param {string} target @param {string} path */
export function makeSymlink(target, path) {
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(target, path);
}

/** @param {string} path */
export function readText(path) {
  return readFileSync(path, 'utf8');
}

/** @param {string} path */
export function pathExists(path) {
  return existsSync(path);
}

/**
 * Inherited env minus CONTROLLED, plus `extra`. In `extra`, a string sets a variable,
 * `null` removes it (e.g. `{ VITEST: null }`), `undefined` is ignored.
 * @param {Record<string, string | null | undefined>} extra
 */
function childEnv(extra) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && !CONTROLLED.includes(k)) env[k] = v;
  }
  for (const [k, v] of Object.entries(extra)) {
    if (v === null) delete env[k];
    else if (v !== undefined) env[k] = v;
  }
  env.ASTRO_TELEMETRY_DISABLED = '1';
  env.NO_COLOR = '1';
  return env;
}

/**
 * @param {string[]} args
 * @param {{ cwd?: string; env?: Record<string, string | null | undefined> }} [opts]
 */
function runNode(args, opts = {}) {
  const r = spawnSync(process.execPath, args, {
    cwd: opts.cwd ?? REPO_ROOT,
    env: childEnv(opts.env ?? {}),
    encoding: 'utf8',
    timeout: 120_000,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '', output: `${r.stdout ?? ''}\n${r.stderr ?? ''}` };
}

/**
 * Run the REAL scripts/check-release.mjs of the repository. Every caller passes a
 * RELEASE_CHECK_ROOT fixture (or expects a refusal), so the repository's own .env* files
 * and dist/ are never what decides a result (F12).
 * @param {string[]} args
 * @param {Record<string, string | null | undefined>} [env]
 */
export function runCheck(args, env = {}) {
  return runNode([CHECK_SCRIPT, ...args], { env });
}

/**
 * Run the check script of an ISOLATED COPY (copyCheckerProject) with no override, for
 * scenarios where the override is refused by design (e.g. CONTEXT set). The copy has no
 * .env file and no dist/ unless the test writes them.
 * @param {string} root
 * @param {string[]} args
 * @param {Record<string, string | null | undefined>} [env]
 */
export function runCheckIn(root, args, env = {}) {
  return runNode([join(root, 'scripts', 'check-release.mjs'), ...args], { cwd: root, env: { RELEASE_CHECK_ROOT: null, ...env } });
}

/**
 * Copy the buildable project (config + src) to a temp dir; node_modules entries are
 * symlinked from the repository (caches are therefore written inside the temp dir).
 * @param {string} dest
 */
export function copyProject(dest) {
  for (const f of ['astro.config.mjs', 'package.json', 'tsconfig.json']) cpSync(join(REPO_ROOT, f), join(dest, f));
  cpSync(join(REPO_ROOT, 'src'), join(dest, 'src'), { recursive: true });
  const nm = join(dest, 'node_modules');
  mkdirSync(nm);
  for (const name of readdirSync(join(REPO_ROOT, 'node_modules'))) {
    if (name === '.vite' || name === '.astro' || name === '.cache') continue;
    symlinkSync(join(REPO_ROOT, 'node_modules', name), join(nm, name));
  }
}

/**
 * Copy the release checker (scripts/ + the buildable project) to a temp dir.
 * @param {string} dest
 */
export function copyCheckerProject(dest) {
  copyProject(dest);
  cpSync(join(REPO_ROOT, 'scripts'), join(dest, 'scripts'), { recursive: true });
}

/**
 * Run `astro build` in a project copy, as a real build runs: without VITEST (which would
 * switch astro.config.mjs to its test-isolation mode and skip .env files).
 * @param {string} cwd
 * @param {Record<string, string | null | undefined>} [env]
 */
export function runAstroBuild(cwd, env = {}) {
  return runNode([ASTRO_BIN, 'build'], { cwd, env: { VITEST: null, ...env } });
}
