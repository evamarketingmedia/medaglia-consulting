/** sitemap.xml — exactly the 8 indexable URLs (SP F.1), absolute, trailing slash, no priority/changefreq/lastmod. */
import type { APIRoute } from 'astro';
import { SITEMAP_PATHS } from '../content/site.ts';
import { sitemapXml } from '../lib/seo/sitemap.ts';

export const GET: APIRoute = ({ site }) => {
  if (site === undefined) throw new Error('sitemap.xml: `site` is not configured');
  return new Response(sitemapXml(site.href, SITEMAP_PATHS), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
