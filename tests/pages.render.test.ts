/**
 * Page rendering (container API, non-production test env): verbatim copy rules,
 * FAQ visible text = FAQPage JSON-LD, preview markers only where allowed, form markup.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Affiancamento from '../src/pages/affiancamento-commerciale.astro';
import Contatti from '../src/pages/contatti.astro';
import ChiSiamo from '../src/pages/chi-siamo.astro';
import Grazie from '../src/pages/grazie.astro';
import Home from '../src/pages/index.astro';
import { NON_PRODUCTION_SITE_URL } from '../src/lib/site-url.ts';

const decode = (s: string) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

describe('pages with a fixture site (JSON-LD emitted)', () => {
  let c: AstroContainer;
  beforeAll(async () => {
    c = await AstroContainer.create({ astroConfig: { site: 'https://medaglia-test-domain.it' } });
  });

  it('Affiancamento: FAQ JSON-LD equals the visible FAQ; cost FAQ absent', async () => {
    const html = await c.renderToString(Affiancamento, { request: new Request('https://medaglia-test-domain.it/affiancamento-commerciale/') });
    const json = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)?.[1];
    expect(json).toBeDefined();
    const graph = JSON.parse(json!)['@graph'] as Record<string, unknown>[];
    expect(graph.map((n) => n['@type'])).toEqual(['WebSite', 'ProfessionalService', 'Service', 'BreadcrumbList', 'FAQPage']);
    const faq = graph.find((n) => n['@type'] === 'FAQPage') as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    const visibleQ = [...html.matchAll(/<h3 class="faq__q">(.*?)<\/h3>/g)].map((m) => decode(m[1]!));
    const visibleA = [...html.matchAll(/<p class="faq__a">(.*?)<\/p>/g)].map((m) => decode(m[1]!));
    expect(faq.mainEntity.map((q) => q.name)).toEqual(visibleQ);
    expect(faq.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(visibleA);
    expect(html).not.toContain('Come viene definito il costo');
    // Service-page CTAs carry the page's interesse value only.
    expect(html).toContain('href="/contatti/?interesse=affiancamento"');
    expect(html.match(/\?interesse=(\w+)/g)?.every((m) => m === '?interesse=affiancamento')).toBe(true);
    // No in-person/remote line (U4), no design notes.
    expect(html).not.toMatch(/in presenza|da remoto|\[DESIGN|Phase 3/);
    // CL-27 order: … L'obiettivo · FAQ · cross-links · final CTA (last section).
    const order = ['id="obiettivo"', 'id="faq"', 'id="altri-livelli"', 'id="cta-block-title"'].map((m) => html.indexOf(m));
    expect(order.every((i, k) => i > -1 && (k === 0 || i > order[k - 1]!))).toBe(true);
    expect(html.match(/cta-block-title/g)).toHaveLength(2);
    expect(decode(html)).toContain("L'obiettivo: un metodo che non dipenda da una sola persona.</h2>");
  });

  it('Home: JSON-LD has no BreadcrumbList; H1 rendered without review markers; real portrait, never og:image', async () => {
    const html = await c.renderToString(Home, { request: new Request('https://medaglia-test-domain.it/') });
    // Phase 3 H1: one heading, two lines, the second highlighted.
    expect(html).toContain('<h1 id="page-title" class="hero__title">È meglio pagare zero per avere 1 <span class="hero__accent">o meglio pagare 1 per avere 4?</span></h1>');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('Reti commerciali per PMI B2B e industriali del Nord Italia');
    expect(html).toContain('href="#come-lavoriamo"');
    expect(html).toContain('id="come-lavoriamo"');
    expect(html).not.toMatch(/REVIEW WITH CLIENT|COPY REVIEW|BreadcrumbList/);
    expect(html).toMatch(/<img[^>]*alt="Alberto Medaglia"[^>]*width="1385" height="1136"/);
    expect(html).not.toContain('og:image');
    expect(html).not.toMatch(/senza impegno/i);
  });
});

describe('pages in the non-production test env', () => {
  let c: AstroContainer;
  beforeAll(async () => {
    c = await AstroContainer.create({ astroConfig: { site: NON_PRODUCTION_SITE_URL } });
  });

  it('Contatti: one form, privacy not pre-ticked, same-tab privacy link, honeypot spec, canonical /contatti/', async () => {
    const html = await c.renderToString(Contatti, { request: new Request('https://x.invalid/contatti/?interesse=consulenza') });
    expect(html.match(/<form\b/g)).toHaveLength(1);
    expect(html).toMatch(/<input id="f-privacy"[^>]*type="checkbox"/);
    expect(html).not.toMatch(/<input id="f-privacy"[^>]*checked/);
    expect(html).toContain('<a href="/privacy-policy/">informativa sulla privacy</a>');
    expect(html).toMatch(/<div class="hp" aria-hidden="true">\s*<label for="f-hp">Lascia vuoto questo campo<\/label>\s*<input id="f-hp"[^>]*tabindex="-1" autocomplete="off"/);
    expect(html).toContain('<link rel="canonical" href="https://site-url-not-set.invalid/contatti/">');
    expect(html).toContain('Parliamo dello sviluppo commerciale della tua azienda</h1>');
    expect(html).not.toContain('consulenza" checked');
    expect(html).toContain('Il modulo è dedicato alle richieste delle aziende.');
    expect(html).toContain('[MISSING: chi richiama ed entro quando]');
    // R5 verified by agency owner, 2026-10-20: public email rendered as a mailto: link.
    expect(html).toContain('href="mailto:medagliaconsulenza@gmail.com"');
    expect(html).not.toContain('[MISSING: email pubblicabile]');
    expect(html).not.toContain('Orari');
    expect(html).toContain('href="tel:+393341201847"');
    // Preview activation notice (non-production only), phone via PhoneLink, no email.
    expect(html).toMatch(/<p class="note" tabindex="-1" data-preview-notice>Il modulo di contatto è in fase di attivazione\. Per questa anteprima puoi contattarci telefonicamente\. <a class="phone-link" href="tel:\+393341201847" data-placement="form-preview">0039 334 1201847<\/a><\/p>/);
    // No JSON-LD for the reserved non-production host.
    expect(html).not.toContain('application/ld+json');
  });

  it('Chi siamo: real portrait (no preview box), name only, no figures or company names', async () => {
    const html = await c.renderToString(ChiSiamo, { request: new Request('https://x.invalid/chi-siamo/') });
    expect(html).not.toContain('data-photo-slot');
    expect(html).toMatch(/<img[^>]*alt="Alberto Medaglia"/);
    expect(html).not.toContain('og:image');
    expect(html).not.toMatch(/tre uffici|circa 70|OVB|Elatos|Metal System|Euromec|Bergamo|fondatore/);
    expect(html).toContain('<h2 id="alberto" class="profile__name">Alberto Medaglia</h2>');
    expect(html).not.toContain('ruolo di Alberto Medaglia');
    // CL-27: principle replaced, no disclaimer-style sentence.
    expect(html).not.toContain('Nessuna promessa');
    expect(html).toContain('Misurare per migliorare:');
    // D35: "Misurabilità" merged; capability activities kept in data but not rendered.
    expect(html).not.toContain('Misurabilità');
    expect(html).not.toContain('ricerca e inserimento di nuovi consulenti');
    // D36: the Home question is absent here; the band explains the principle instead.
    expect(html).not.toContain('pagare zero');
    expect(html).not.toContain('pagare 1 per avere 4');
    expect(html).toContain('<h2 id="leva" class="manifesto__heading">Creare leva, non dipendenza.</h2>');
    expect(html).not.toMatch(/REVIEW WITH CLIENT/);
  });

  it('Grazie: noindex page, no canonical, phone link', async () => {
    const html = await c.renderToString(Grazie, { request: new Request('https://x.invalid/grazie/') });
    expect(html).not.toContain('rel="canonical"');
    expect(html).toContain('Hai bisogno di parlarci prima? Chiama il <a class="phone-link" href="tel:+393341201847" data-placement="grazie">0039 334 1201847</a>.');
  });
});
