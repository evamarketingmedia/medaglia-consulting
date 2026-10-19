/**
 * Build record — dist/.build-record.json (S3).
 *
 * Written by the inline `astro:build:done` integration in astro.config.mjs; read and
 * validated by scripts/check-release.mjs. NON-SECRET METADATA ONLY: no env values other
 * than the resolved environment and the public site origin, no client data. Extra keys
 * are rejected so nothing else can slip in.
 *
 * Pure, erasable TypeScript (also run by Node's native type stripping).
 */
import type { SiteEnv } from './env.ts';
import { resolveRobots, type Robots } from './seo/meta.ts';

export const BUILD_RECORD_FILE = '.build-record.json';
export const BUILD_RECORD_SCHEMA = 'medaglia-build-record/1';

export type BuildRecord = {
  readonly schema: typeof BUILD_RECORD_SCHEMA;
  readonly siteEnv: SiteEnv;
  readonly siteOrigin: string;
  /** Robots an indexable page gets in this build: 'index, follow' in production, else env-forced 'noindex, nofollow'. */
  readonly robotsDefault: Robots;
  readonly builtAt: string;
  readonly astroVersion?: string;
};

const ALLOWED_KEYS = new Set(['schema', 'siteEnv', 'siteOrigin', 'robotsDefault', 'builtAt', 'astroVersion']);

export function createBuildRecord(input: {
  readonly siteEnv: SiteEnv;
  readonly site: string;
  readonly builtAt: Date;
  readonly astroVersion?: string;
}): BuildRecord {
  return {
    schema: BUILD_RECORD_SCHEMA,
    siteEnv: input.siteEnv,
    siteOrigin: new URL(input.site).origin,
    robotsDefault: resolveRobots('index, follow', input.siteEnv),
    builtAt: input.builtAt.toISOString(),
    ...(input.astroVersion !== undefined ? { astroVersion: input.astroVersion } : {}),
  };
}

/**
 * builtAt must be exactly what createBuildRecord writes: Date#toISOString() output
 * (e.g. "2026-10-19T08:00:00.000Z"). Loose Date.parse forms ("2026", "Oct 19") are invalid.
 * No freshness window is applied (F9).
 */
function isIsoTimestamp(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const time = Date.parse(value);
  return !Number.isNaN(time) && new Date(time).toISOString() === value;
}

export type BuildRecordCheck =
  | { readonly ok: true; readonly record: BuildRecord }
  | { readonly ok: false; readonly errors: readonly string[] };

/** Structural validation of a parsed record (any mode). Production rules live in the release check. */
export function validateBuildRecord(raw: unknown): BuildRecordCheck {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['build record is not a JSON object'] };
  }
  const r = raw as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of Object.keys(r)) {
    if (!ALLOWED_KEYS.has(key)) errors.push(`build record has an unexpected key ${JSON.stringify(key)}`);
  }
  if (r['schema'] !== BUILD_RECORD_SCHEMA) {
    errors.push(`build record schema is ${JSON.stringify(r['schema'])}, expected ${JSON.stringify(BUILD_RECORD_SCHEMA)}`);
  }
  const siteEnv = r['siteEnv'];
  if (siteEnv !== 'production' && siteEnv !== 'non-production') {
    errors.push(`build record siteEnv is invalid: ${JSON.stringify(siteEnv)}`);
  }
  if (typeof r['siteOrigin'] !== 'string' || r['siteOrigin'] === '') errors.push('build record siteOrigin is missing');
  if (
    (siteEnv === 'production' || siteEnv === 'non-production') &&
    r['robotsDefault'] !== resolveRobots('index, follow', siteEnv)
  ) {
    errors.push(`build record robotsDefault ${JSON.stringify(r['robotsDefault'])} does not match siteEnv ${JSON.stringify(siteEnv)}`);
  }
  const builtAt = r['builtAt'];
  if (builtAt === undefined || builtAt === null || builtAt === '') errors.push('build record builtAt is missing');
  else if (!isIsoTimestamp(builtAt)) errors.push(`build record builtAt ${JSON.stringify(builtAt)} is not a valid ISO-8601 UTC timestamp`);
  if ('astroVersion' in r && typeof r['astroVersion'] !== 'string') errors.push('build record astroVersion is not a string');
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, record: r as BuildRecord };
}
