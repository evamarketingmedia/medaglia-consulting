/**
 * Pure logic added with the full site build: phone derivation, ?interesse= allow-list,
 * form validation, origin, adapter choice, fact view, JSON-LD, sitemap/robots, routes,
 * capabilities (R13 / U2 fallbacks).
 */
import { describe, expect, it } from 'vitest';
import { toE164, toTelHref } from '../src/lib/phone.ts';
import { INTERESSE_KEYS, contattiHref, parseInteresse } from '../src/lib/form/interesse.ts';
import { MESSAGES, isPlausiblePhone, validateContact } from '../src/lib/form/validation.ts';
import { resolveOrigin } from '../src/lib/form/origin.ts';
import { chooseAdapter } from '../src/lib/form/adapter.ts';
import { createAdapter } from '../src/lib/form/adapters/mock.ts';
import { viewFact } from '../src/lib/fact-view.ts';
import { slot } from '../src/lib/slots.ts';
import {
  SERVICES,
  breadcrumbNode,
  canEmitFor,
  faqNode,
  organizationNode,
  personNode,
  serializeGraph,
  serviceNode,
  websiteNode,
} from '../src/lib/seo/jsonld.ts';
import { robotsTxt, sitemapXml } from '../src/lib/seo/sitemap.ts';
import { ROUTES, SITEMAP_PATHS, CONTEXT_LINKS, cookiePolicyRequired } from '../src/content/site.ts';
import { FAQ_AFFIANCAMENTO, FAQ_CONSULENZA, publishedFaq } from '../src/content/faq.ts';
import { CAPABILITIES, capabilityLead, renderedActivities } from '../src/content/capabilities.ts';
import { facts } from '../src/content/facts.ts';

const BASE = 'https://medaglia-test-domain.it';

describe('phone (PhoneLink derivation)', () => {
  it('derives E.164 and tel: from the verified display value', () => {
    expect(toE164('0039 334 1201847')).toBe('+393341201847');
    expect(toTelHref('0039 334 1201847')).toBe('tel:+393341201847');
    expect(toE164('+39 334-120.1847')).toBe('+393341201847');
  });
  it('uses the facts.ts value', () => {
    expect(facts.phone).toEqual({ state: 'value', value: '0039 334 1201847' });
  });
  it('throws on anything that is not a clear international number', () => {
    for (const bad of ['', '334 1201847', '0039', '[MISSING: numero di telefono]', '00 0', '+0 123 4567']) {
      expect(() => toE164(bad), bad).toThrow();
    }
  });
});

describe('?interesse= parsing (CD §E definitive mapping)', () => {
  it('accepts exactly the four values', () => {
    expect(INTERESSE_KEYS).toEqual(['affiancamento', 'consulenza', 'operativo', 'formazione']);
    for (const k of INTERESSE_KEYS) expect(parseInteresse(`?interesse=${k}`)).toBe(k);
    expect(parseInteresse('?utm_source=x&interesse=operativo')).toBe('operativo');
  });
  it('falls back to null for anything else', () => {
    for (const s of [
      '',
      '?',
      '?interesse=',
      '?interesse=Affiancamento',
      '?interesse=%20affiancamento',
      '?interesse=affiancamento%20',
      '?interesse=reti',
      '?interesse=non-so',
      '?interesse=__proto__',
      '?interesse=constructor',
      '?interesse=toString',
      '?interesse=affiancamento&interesse=consulenza',
      '?interesse=affiancamento&interesse=affiancamento',
      `?interesse=${'a'.repeat(5000)}`,
      '?interesse=%E2%80%8Baffiancamento',
      '?interesse=<script>',
      '?Interesse=affiancamento',
    ]) {
      expect(parseInteresse(s), s).toBeNull();
    }
  });
  it('builds clean or allow-listed CTA links only', () => {
    expect(contattiHref()).toBe('/contatti/');
    expect(contattiHref('formazione')).toBe('/contatti/?interesse=formazione');
    expect(() => contattiHref('reti' as never)).toThrow();
  });
});

describe('form validation (usability only, CD §E messages)', () => {
  const ok = { nome: 'Mario Rossi', azienda: 'Acme', ruolo: 'titolare', telefono: '+39 333 1234567', email: 'm@acme.it', privacy: true };
  it('passes valid input', () => {
    expect(validateContact(ok)).toEqual({});
  });
  it('reports every required field with the verbatim message', () => {
    expect(validateContact({ nome: ' ', azienda: '', ruolo: '', telefono: '', email: '', privacy: false })).toEqual({
      nome: MESSAGES.nome,
      azienda: MESSAGES.azienda,
      ruolo: MESSAGES.ruolo,
      telefono: 'Inserisci un numero di telefono.',
      email: 'Inserisci un indirizzo email.',
      privacy: "Per inviare la richiesta, conferma di aver letto l'informativa sulla privacy.",
    });
  });
  it('distinguishes invalid phone and email', () => {
    expect(validateContact({ ...ok, telefono: '12ab' }).telefono).toBe('Il numero non sembra corretto: controlla le cifre.');
    expect(validateContact({ ...ok, email: 'mario@' }).email).toBe("L'indirizzo email non sembra corretto (es. nome@azienda.it).");
  });
  it('is permissive on phone formats', () => {
    for (const p of ['0039 334 1201847', '+39 (02) 123-4567', '035.123456', '3331234567']) expect(isPlausiblePhone(p), p).toBe(true);
    for (const p of ['12345', '+', 'abc', '1'.repeat(16)]) expect(isPlausiblePhone(p), p).toBe(false);
  });
});

describe('origine (hidden field)', () => {
  const own = 'https://medaglia-test-domain.it';
  it('maps same-origin allow-listed paths, else diretto / esterno', () => {
    expect(resolveOrigin('', own)).toBe('diretto');
    expect(resolveOrigin(`${own}/affiancamento-commerciale/`, own)).toBe('/affiancamento-commerciale/');
    expect(resolveOrigin(`${own}/affiancamento-commerciale/?x=1#y`, own)).toBe('/affiancamento-commerciale/');
    expect(resolveOrigin(`${own}/unknown/`, own)).toBe('esterno');
    expect(resolveOrigin('https://example.org/affiancamento-commerciale/', own)).toBe('esterno');
    expect(resolveOrigin('not a url', own)).toBe('esterno');
  });
});

describe('form adapter boundary (mock only, N2)', () => {
  it('chooses mock adapters only outside production', () => {
    expect(chooseAdapter('non-production', undefined, '')).toBe('mock-success');
    expect(chooseAdapter('non-production', undefined, '?mock-invio=errore')).toBe('mock-failure');
    expect(chooseAdapter('non-production', undefined, '?mock-invio=timeout')).toBe('mock-timeout');
    expect(chooseAdapter('production', undefined, '')).toBe('unavailable');
    expect(chooseAdapter('production', undefined, '?mock-invio=errore')).toBe('unavailable');
    expect(chooseAdapter('non-production', 'some-provider', '')).toBe('unavailable');
  });
  it('mock adapters resolve without network', async () => {
    const c = new AbortController();
    expect(await createAdapter('mock-failure').submit(new FormData(), c.signal)).toEqual({ ok: false, reason: 'failure' });
    expect(await createAdapter('unavailable').submit(new FormData(), c.signal)).toEqual({ ok: false, reason: 'unavailable' });
    const t = new AbortController();
    const p = createAdapter('mock-timeout').submit(new FormData(), t.signal);
    t.abort();
    expect(await p).toEqual({ ok: false, reason: 'timeout' });
  });
});

describe('fact view (preview markers never reach production)', () => {
  const missing = slot.missing<string>('[MISSING: orari di contatto]');
  it('non-production shows the verbatim marker, production nothing', () => {
    expect(viewFact(missing, 'non-production')).toEqual({ kind: 'marker', labels: ['[MISSING: orari di contatto]'] });
    expect(viewFact(missing, 'production')).toEqual({ kind: 'none' });
    expect(viewFact(slot.missing<string>(), 'non-production')).toEqual({ kind: 'none' });
    expect(viewFact(slot.omitted<string>('non applicabile'), 'non-production')).toEqual({ kind: 'none' });
    expect(viewFact(slot.value('x'), 'production')).toEqual({ kind: 'value', value: 'x' });
  });
});

describe('JSON-LD (SP §E)', () => {
  it('organization: E.164 telephone, Nord Italia, pruned unresolved properties', () => {
    const org = organizationNode(BASE, { phone: facts.phone });
    expect(org['telephone']).toBe('+393341201847');
    expect(org['areaServed']).toEqual({ '@type': 'Place', name: 'Nord Italia' });
    for (const k of ['email', 'legalName', 'vatID', 'address', 'logo', 'image', 'founder', 'sameAs', 'openingHours']) {
      expect(org, k).not.toHaveProperty(k);
    }
  });
  it('person: no jobTitle while missing; image from the approved photo (R14)', () => {
    const p = personNode(BASE, { photo: facts.photo, title: facts.albertoTitle });
    expect(p).not.toHaveProperty('jobTitle');
    expect(p['image']).toBe(`${BASE}/images/alberto-medaglia.png`);
    expect(p).not.toHaveProperty('alumniOf');
  });
  it('services use the approved SP E.3 descriptions', () => {
    expect(Object.keys(SERVICES)).toEqual(['affiancamento', 'consulenza', 'operativo', 'reti', 'formazione']);
    expect(serviceNode(BASE, 'reti')['description']).toBe(
      "Lavoriamo sull'intera organizzazione commerciale per costruire reti più organizzate ed efficaci: metodo, persone, obiettivi, processi e canali di vendita.",
    );
  });
  it('breadcrumb names equal the visible labels', () => {
    const b = breadcrumbNode(BASE, ROUTES.reti.path, ROUTES.reti.breadcrumb);
    expect(JSON.stringify(b)).toContain('"name":"Reti commerciali"');
  });
  it('FAQPage holds only published items, text identical to the source', () => {
    const f = faqNode(BASE, '/affiancamento-commerciale/', publishedFaq(FAQ_AFFIANCAMENTO));
    const json = JSON.stringify(f);
    expect(json).not.toContain('costo');
    expect(publishedFaq(FAQ_AFFIANCAMENTO)).toHaveLength(5);
    expect(publishedFaq(FAQ_CONSULENZA)).toHaveLength(4);
  });
  it('serializer refuses markers and reserved hosts', () => {
    expect(() => serializeGraph([{ name: '[MISSING: x]' }])).toThrow(/forbidden/);
    expect(() => serializeGraph([{ name: 'MISSING' }])).toThrow(/forbidden/);
    expect(() => serializeGraph([{ url: '{BASE}/' }])).toThrow(/forbidden/);
    expect(() => serializeGraph([websiteNode('https://site-url-not-set.invalid')])).toThrow(/forbidden/);
    expect(canEmitFor('https://site-url-not-set.invalid')).toBe(false);
    expect(canEmitFor(BASE)).toBe(true);
    const out = serializeGraph([websiteNode(BASE), { t: '</script>' }]);
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out)['@graph']).toHaveLength(2);
    expect(out).not.toMatch(/Review|AggregateRating|offers/);
  });
});

describe('routes, sitemap, robots (SP §C, F.1, F.2)', () => {
  it('titles ≤ 60 and metas ≤ 160 characters, all unique', () => {
    const all = Object.values(ROUTES);
    for (const r of all) {
      expect(r.title.length, r.title).toBeLessThanOrEqual(60);
      expect(r.description.length, r.description).toBeLessThanOrEqual(160);
    }
    expect(new Set(all.map((r) => r.title)).size).toBe(all.length);
  });
  it('the sitemap has exactly the 8 indexable URLs in SP order', () => {
    expect(SITEMAP_PATHS).toEqual([
      '/',
      '/affiancamento-commerciale/',
      '/consulenza-commerciale/',
      '/sviluppo-commerciale-operativo/',
      '/sviluppo-reti-commerciali/',
      '/formazione-commerciale/',
      '/chi-siamo/',
      '/contatti/',
    ]);
    const xml = sitemapXml(`${BASE}/`, SITEMAP_PATHS);
    expect(xml.match(/<loc>/g)).toHaveLength(8);
    expect(xml).not.toMatch(/priority|changefreq|lastmod|grazie|privacy/);
  });
  it('robots.txt is environment-aware', () => {
    expect(robotsTxt('production', `${BASE}/`)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
    expect(robotsTxt('non-production', `${BASE}/`)).toBe('User-agent: *\nDisallow: /\n');
  });
  it('cookie policy stays undecided (R9): no /cookie-policy/ route', () => {
    expect(cookiePolicyRequired).toBeNull();
    expect(Object.values(ROUTES).some((r) => (r.path as string) === '/cookie-policy/')).toBe(false);
  });
  it('contextual anchors are the fixed CD §A texts', () => {
    expect(Object.values(CONTEXT_LINKS).map((l) => l.text)).toEqual([
      "Scopri l'affiancamento continuativo",
      'Scopri la consulenza commerciale',
      'Scopri lo sviluppo commerciale operativo',
      'Scopri come sviluppiamo le reti commerciali',
      'Scopri la formazione commerciale',
      'Leggi il percorso di Alberto Medaglia',
    ]);
  });
});

describe('capabilities (U2 fallback, R13 figures)', () => {
  it('no company name renders while show_company is false', () => {
    for (const c of CAPABILITIES) {
      expect(c.show_company).toBe(false);
      expect(capabilityLead(c)).not.toContain(c.company);
      expect(capabilityLead(c)).not.toContain('(');
    }
  });
  it('capability 1 drops exactly the two figure bullets and keeps Senior Manager', () => {
    const c1 = CAPABILITIES[0]!;
    expect(c1.figuresConfirmed).toBe(false);
    const rendered = renderedActivities(c1).map((a) => a.text).join(' ');
    expect(rendered).not.toMatch(/tre uffici|circa 70|Bergamo|Brescia|Lecco/);
    expect(renderedActivities(c1)).toHaveLength(c1.activities.length - 2);
    expect(capabilityLead(c1)).toContain('Senior Manager');
  });
});
