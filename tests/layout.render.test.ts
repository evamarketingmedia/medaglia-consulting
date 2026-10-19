/**
 * BaseLayout rendered through Astro's container API (S7, S9b).
 * Runs under the Astro Vite config (vitest.config.ts -> getViteConfig), in the test
 * environment's site env: non-production, so every page renders "noindex, nofollow".
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';
import IndexPage from '../src/pages/index.astro';
import { NON_PRODUCTION_SITE_URL } from '../src/lib/site-url.ts';

let container: AstroContainer;
beforeAll(async () => {
  // The container does not read astro.config.mjs `site`; pass the non-production default explicitly.
  container = await AstroContainer.create({ astroConfig: { site: NON_PRODUCTION_SITE_URL } });
});

const render = (props: Record<string, unknown>) =>
  container.renderToString(BaseLayout, {
    props: { title: 'Titolo di prova', description: 'Descrizione di prova', ...props },
    slots: { default: '<p>contenuto</p>' },
  });

const robotsOf = (html: string) => /<meta name="robots" content="([^"]*)"/.exec(html)?.[1];

describe('BaseLayout robots / canonical (S7)', () => {
  it('index, follow with a path renders (env-forced noindex, nofollow outside production) and a canonical', async () => {
    const html = await render({ robots: 'index, follow', path: '/contatti/' });
    expect(robotsOf(html)).toBe('noindex, nofollow');
    expect(html).toContain('<link rel="canonical" href="https://site-url-not-set.invalid/contatti/">');
    expect(html).toContain('<html lang="it">');
  });

  it('noindex, follow without a path renders without a canonical', async () => {
    const html = await render({ robots: 'noindex, follow' });
    expect(robotsOf(html)).toBe('noindex, nofollow');
    expect(html).not.toContain('rel="canonical"');
  });

  it('noindex, nofollow without a path renders (dev page only; D7 deferred)', async () => {
    expect(robotsOf(await render({ robots: 'noindex, nofollow' }))).toBe('noindex, nofollow');
  });

  for (const robots of [undefined, '', 'index,follow', 'noindex', 'none', 'INDEX, FOLLOW', 'index, nofollow']) {
    it(`throws on robots ${JSON.stringify(robots)}`, async () => {
      await expect(render({ robots })).rejects.toThrow(/robots/);
    });
  }

  it('throws on an indexable page without a path', async () => {
    await expect(render({ robots: 'index, follow' })).rejects.toThrow(/must declare its `path`/);
  });

  it('throws on a noindex page with a path', async () => {
    await expect(render({ robots: 'noindex, follow', path: '/grazie/' })).rejects.toThrow(/must not declare a canonical/);
  });

  it('the dev index page still renders (noindex, nofollow, no canonical)', async () => {
    const html = await container.renderToString(IndexPage);
    expect(robotsOf(html)).toBe('noindex, nofollow');
    expect(html).not.toContain('rel="canonical"');
  });
});
