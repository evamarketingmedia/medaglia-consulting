/**
 * The build's site env, as resolved once in astro.config.mjs and injected through
 * `vite.define` (__MEDAGLIA_SITE_ENV__). Validated on every read (fail closed).
 * Used by components (server) and client modules alike.
 */
import type { SiteEnv } from './env.ts';

export function currentSiteEnv(): SiteEnv {
  const injected: string = __MEDAGLIA_SITE_ENV__;
  if (injected !== 'production' && injected !== 'non-production') {
    throw new Error(`site env: invalid build site env ${JSON.stringify(injected)}`);
  }
  return injected;
}
