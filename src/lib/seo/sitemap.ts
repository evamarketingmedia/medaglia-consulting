/**
 * sitemap.xml and robots.txt bodies — SP F.1, F.2, F.3; ARCHITECTURE §6. Pure.
 */
import type { SiteEnv } from '../env.ts';

export function sitemapXml(origin: string, paths: readonly string[]): string {
  const base = new URL(origin).origin;
  const urls = paths.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Production: allow everything and point to the sitemap (never disallow noindex pages).
 * Non-production: disallow everything (secondary control only; never deployed to production).
 */
export function robotsTxt(env: SiteEnv, origin: string): string {
  if (env === 'production') {
    return `User-agent: *\nAllow: /\n\nSitemap: ${new URL(origin).origin}/sitemap.xml\n`;
  }
  return 'User-agent: *\nDisallow: /\n';
}
