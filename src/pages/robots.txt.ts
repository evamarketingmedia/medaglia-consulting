/** robots.txt — environment-aware (SP F.2, F.3; ARCH §6): production allows all + sitemap; non-production disallows all. */
import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/seo/sitemap.ts';
import { currentSiteEnv } from '../lib/site-env.ts';

export const GET: APIRoute = ({ site }) => {
  if (site === undefined) throw new Error('robots.txt: `site` is not configured');
  return new Response(robotsTxt(currentSiteEnv(), site.href), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
