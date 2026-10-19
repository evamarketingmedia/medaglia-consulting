// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { resolveSiteEnv, viteModeFromArgv } from './src/lib/env.ts';
import { resolveSiteUrl } from './src/lib/site-url.ts';
import { BUILD_RECORD_FILE, createBuildRecord } from './src/lib/build-record.ts';

/**
 * Environment (S3, S8) — ARCHITECTURE §1.1, §6, §10.2 (N5).
 *
 * The env is loaded exactly as Astro/Vite load it for pages — `loadEnv(mode, root, '')`:
 * .env, .env.local, .env.[mode], .env.[mode].local, with process.env winning — and goes
 * through the same resolver as scripts/check-release.mjs (src/lib/env.ts). The resolved
 * value is passed to pages as `__MEDAGLIA_SITE_ENV__`, so config, pages, the build record
 * and the release check always agree.
 *
 * `process` is read through globalThis because @types/node is not an approved
 * dependency (ARCHITECTURE §1); its shape is typed explicitly here.
 */
/** @type {{ argv: string[]; cwd(): string; env: Record<string, string | undefined> }} */
const proc = Reflect.get(globalThis, 'process');
/**
 * Test isolation (F12): Vitest evaluates this config (vitest.config.ts -> getViteConfig)
 * only to compile components for tests, and sets VITEST=true itself. There, NO env file is
 * read (`loadEnv(mode, false)` = process.env only), so a developer's .env / .env.production*
 * can never leak into tests. `astro build` / `astro dev` never set VITEST, so builds are
 * unchanged. (Were VITEST set on a real build, .env files would be ignored and the release
 * check — which always reads them — would disagree with the record and fail closed.)
 */
const envDir = proc.env['VITEST'] === 'true' ? false : proc.cwd();
const env = loadEnv(viteModeFromArgv(proc.argv), envDir, '');

const siteEnvResult = resolveSiteEnv(env);
if (!siteEnvResult.ok) throw new Error(`[site env] ${siteEnvResult.error}`);
const siteEnv = siteEnvResult.siteEnv;

/**
 * SITE_URL — canonical origin (ARCHITECTURE §6, R11; S4). The production domain is
 * MISSING (R11): no real domain is configured here. A production build throws unless
 * SITE_URL is a valid https apex origin; non-production builds use SITE_URL if given,
 * else a reserved `.invalid` host that the release check flags in production (§11.5).
 */
const siteResult = resolveSiteUrl(siteEnv, env['SITE_URL']);
if (!siteResult.ok) throw new Error(`[SITE_URL] ${siteResult.error} — required for a ${siteEnv} build (${siteEnvResult.reason})`);
const site = siteResult.site;

/**
 * Writes dist/.build-record.json after a build: non-secret metadata only
 * ({schema, siteEnv, siteOrigin, robotsDefault, builtAt}). Read by the release check.
 * `node:fs/promises` is imported with a non-literal specifier and typed explicitly,
 * because @types/node is not an approved dependency.
 * @type {import('astro').AstroIntegration}
 */
const buildRecordIntegration = {
  name: 'medaglia-build-record',
  hooks: {
    /**
     * F9: a build record must only ever come from this hook. A public/.build-record.json
     * would be copied into dist/ (and could be mistaken for a real record), so its mere
     * presence fails the build.
     */
    'astro:config:setup': async ({ config, command }) => {
      if (command !== 'build') return;
      const fsSpecifier = 'node:fs/promises';
      /** @type {{ lstat(file: URL): Promise<unknown> }} */
      const fs = await import(/* @vite-ignore */ fsSpecifier);
      const forbidden = new URL(BUILD_RECORD_FILE, config.publicDir);
      const exists = await fs.lstat(forbidden).then(
        () => true,
        /** @param {unknown} err */
        (err) => {
          if (err !== null && typeof err === 'object' && Reflect.get(err, 'code') === 'ENOENT') return false;
          throw err;
        },
      );
      if (exists) {
        throw new Error(
          `[build record] public/${BUILD_RECORD_FILE} must not exist: the build record is written only by the build (astro:build:done). Remove ${forbidden.pathname}.`,
        );
      }
    },
    'astro:build:done': async ({ dir, logger }) => {
      const fsSpecifier = 'node:fs/promises';
      /** @type {{ writeFile(file: URL, data: string, encoding: 'utf8'): Promise<void> }} */
      const fs = await import(/* @vite-ignore */ fsSpecifier);
      const record = createBuildRecord({ siteEnv, site, builtAt: new Date() });
      await fs.writeFile(new URL(BUILD_RECORD_FILE, dir), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
      logger.info(`${BUILD_RECORD_FILE}: siteEnv=${record.siteEnv} siteOrigin=${record.siteOrigin}`);
    },
  },
};

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [buildRecordIntegration],
  build: {
    format: 'directory',
    // §10.1: keep a strict CSP possible — no inlined stylesheets.
    inlineStylesheets: 'never',
  },
  vite: {
    define: {
      // Read by BaseLayout (validated there). Never a secret.
      __MEDAGLIA_SITE_ENV__: JSON.stringify(siteEnv),
    },
    build: {
      // §10.1: never inline assets as data: URIs.
      assetsInlineLimit: 0,
    },
  },
});
