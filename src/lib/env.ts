/**
 * Build environment — ARCHITECTURE §1.1, §10.2 (N5), §10.3.
 *
 * ONE resolver, used by astro.config.mjs (build), by BaseLayout (through the value the
 * config passes down) and by scripts/check-release.mjs, so all three agree. Both callers
 * feed it the same env: Vite's `loadEnv(mode, root, '')` (.env files + process.env,
 * process.env winning).
 *
 * Rules:
 *  - PUBLIC_SITE_ENV accepts exactly 'production', 'preview', 'development', or unset
 *    (an empty value counts as unset). Anything else — 'Production', ' production',
 *    'prod' … — is an ERROR, never guessed.
 *  - Netlify CONTEXT=production means production. CONTEXT=production with an explicit
 *    PUBLIC_SITE_ENV of preview/development is a conflict → ERROR.
 *  - CONTEXT=deploy-preview / branch-deploy never produce indexable output:
 *    combined with PUBLIC_SITE_ENV=production it is a conflict → ERROR.
 *  - CLIENT PREVIEW (D37, temporary): CONTEXT=production with PUBLIC_SITE_ENV unset and
 *    SITE_URL exactly an https origin on a CLIENT_PREVIEW_HOSTS host → non-production.
 *  - Only 'production' is production; everything else is non-production
 *    (noindex, nofollow everywhere).
 *
 * Pure, erasable TypeScript (also run by Node's native type stripping).
 */
export type SiteEnv = 'production' | 'non-production';

export const PUBLIC_SITE_ENV_VALUES = ['production', 'preview', 'development'] as const;
export type PublicSiteEnv = (typeof PUBLIC_SITE_ENV_VALUES)[number];

/** Netlify contexts that must never produce indexable pages. */
export const NON_PRODUCTION_CONTEXTS = ['deploy-preview', 'branch-deploy'] as const;

export type EnvSource = Readonly<Record<string, string | undefined>>;

export type SiteEnvResult =
  | { readonly ok: true; readonly siteEnv: SiteEnv; readonly reason: string }
  | { readonly ok: false; readonly error: string };

function isPublicSiteEnv(value: string): value is PublicSiteEnv {
  return (PUBLIC_SITE_ENV_VALUES as readonly string[]).includes(value);
}

/**
 * CLIENT PREVIEW (2026-10-22, D37): temporary. While the client's domain is not connected,
 * a Netlify production-context build whose SITE_URL host is exactly one of these hosts is
 * built as a NON-production preview (noindex robots, preview form notice, no production
 * JSON-LD). REMOVE before launch together with setting SITE_URL to the client's apex
 * domain (R11).
 */
export const CLIENT_PREVIEW_HOSTS = ['medaglia-consulting.netlify.app'] as const;

/**
 * True only when SITE_URL is exactly `https://<host>` (no credentials, port, path, query,
 * hash or trailing slash) with a hostname EXACTLY in CLIENT_PREVIEW_HOSTS — no suffix match.
 */
export function isClientPreviewSiteUrl(raw: string | undefined): boolean {
  if (raw === undefined || raw === '') return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '') return false;
  if (raw !== url.origin) return false;
  return (CLIENT_PREVIEW_HOSTS as readonly string[]).includes(url.hostname);
}

export function resolveSiteEnv(env: EnvSource): SiteEnvResult {
  const rawValue = env['PUBLIC_SITE_ENV'];
  const raw = rawValue === '' ? undefined : rawValue;
  const context = env['CONTEXT'];

  if (raw !== undefined && !isPublicSiteEnv(raw)) {
    return {
      ok: false,
      error: `PUBLIC_SITE_ENV=${JSON.stringify(raw)} is not allowed (use exactly "production", "preview" or "development", or leave it unset)`,
    };
  }
  if (context === 'production') {
    if (raw === 'preview' || raw === 'development') {
      return { ok: false, error: `conflict: CONTEXT="production" but PUBLIC_SITE_ENV=${JSON.stringify(raw)}` };
    }
    // CLIENT PREVIEW (D37): see CLIENT_PREVIEW_HOSTS. Only with PUBLIC_SITE_ENV unset.
    if (raw === undefined && isClientPreviewSiteUrl(env['SITE_URL'])) {
      return { ok: true, siteEnv: 'non-production', reason: 'client-preview host (D37)' };
    }
    return { ok: true, siteEnv: 'production', reason: 'CONTEXT=production' };
  }
  if (context !== undefined && (NON_PRODUCTION_CONTEXTS as readonly string[]).includes(context) && raw === 'production') {
    return {
      ok: false,
      error: `conflict: CONTEXT=${JSON.stringify(context)} must never build production output, but PUBLIC_SITE_ENV="production"`,
    };
  }
  if (raw === 'production') return { ok: true, siteEnv: 'production', reason: 'PUBLIC_SITE_ENV=production' };
  return {
    ok: true,
    siteEnv: 'non-production',
    reason: raw === undefined ? 'PUBLIC_SITE_ENV unset' : `PUBLIC_SITE_ENV=${raw}`,
  };
}

/**
 * The Vite mode Astro uses for the same command line (it selects the .env.[mode] files):
 * an explicit `--mode X` / `--mode=X`, else 'development' for `astro dev`, else 'production'
 * (Astro's default for `astro build`). The release check always uses 'production', the
 * mode of a default `astro build`.
 */
export function viteModeFromArgv(argv: readonly string[]): string {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mode') {
      const next = argv[i + 1];
      if (next !== undefined && next !== '') return next;
    } else if (arg !== undefined && arg.startsWith('--mode=') && arg.length > '--mode='.length) {
      return arg.slice('--mode='.length);
    }
  }
  return argv.includes('dev') ? 'development' : 'production';
}
