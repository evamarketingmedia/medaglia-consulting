/**
 * Canonical and robots inputs for BaseLayout — ARCHITECTURE §6, N5.
 * Foundation only: no OG/Twitter, no JSON-LD (later: SeoHead, build step 5).
 */
import type { SiteEnv } from '../env.ts';

/**
 * Allowed DECLARED page policies. 'noindex, nofollow' is allowed only because the
 * development page uses it (the per-page nofollow policy is deferred, D7).
 */
export const ROBOTS_VALUES = ['index, follow', 'noindex, follow', 'noindex, nofollow'] as const;
export type Robots = (typeof ROBOTS_VALUES)[number];

export function isRobots(value: unknown): value is Robots {
  return typeof value === 'string' && (ROBOTS_VALUES as readonly string[]).includes(value);
}

/** Non-production builds are noindex, nofollow on every page (N5). */
export function resolveRobots(requested: Robots, env: SiteEnv): Robots {
  return env === 'production' ? requested : 'noindex, nofollow';
}

/**
 * Absolute canonical URL: site origin + route path, trailing slash (SP F.4).
 * Throws on malformed input so a bad canonical fails the build instead of shipping.
 */
export function buildCanonical(path: string, site: URL | string | undefined): string {
  if (site === undefined) throw new Error('canonical: `site` is not configured');
  if (!path.startsWith('/') || !path.endsWith('/')) {
    throw new Error(`canonical: path must start and end with "/": ${JSON.stringify(path)}`);
  }
  if (path.includes('//') || /[?#\s]/.test(path)) {
    throw new Error(`canonical: path must be a clean route path: ${JSON.stringify(path)}`);
  }
  const origin = new URL(site).origin;
  return `${origin}${path}`;
}

/** Canonical only on indexable pages (§6: none on noindex pages). */
export function assertCanonicalAllowed(path: string | undefined, requested: Robots): void {
  if (path !== undefined && requested !== 'index, follow') {
    throw new Error(`canonical: a "${requested}" page must not declare a canonical path (${path})`);
  }
}

/**
 * Page policy (S7), checked against the DECLARED robots value (never the env-forced one):
 *  - robots must be one of ROBOTS_VALUES (runtime check: props are untyped at runtime);
 *  - 'index, follow' requires a path (an indexable page always has a self canonical, §6);
 *  - a noindex page must not declare a path (no canonical on noindex pages, §6).
 */
export function assertPagePolicy(path: unknown, robots: unknown): asserts robots is Robots {
  if (!isRobots(robots)) {
    throw new Error(`robots: ${JSON.stringify(robots)} is not allowed (use one of ${ROBOTS_VALUES.join(' | ')})`);
  }
  if (path === undefined) {
    if (robots === 'index, follow') {
      throw new Error('robots: an "index, follow" page must declare its `path` (self canonical, §6)');
    }
    return;
  }
  if (typeof path !== 'string') throw new Error('path must be a string when given');
  assertCanonicalAllowed(path, robots);
}
