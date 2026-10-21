/**
 * JSON-LD — SP §E; ARCHITECTURE §6.1.
 *
 * One @graph per indexable page, built by pure functions from the same content that renders
 * the page (FAQ arrays, breadcrumb labels, facts). Properties whose fact is not resolved are
 * PRUNED (legalName, logo, image, email, vatID, address, sameAs, founder, jobTitle).
 * `telephone` is the verified phone (R1) in E.164. No Review / AggregateRating / offers.
 *
 * The serializer throws if any string value contains "[", "MISSING", "{BASE}" or ".invalid",
 * so placeholder text or the non-production reserved host can never be emitted.
 */
import type { Slot } from '../slots.ts';
import { toE164 } from '../phone.ts';
import type { Faq } from '../../content/faq.ts';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type JsonObject = { [k: string]: JsonValue };

const FORBIDDEN = ['[', 'MISSING', '{BASE}', '.invalid'] as const;

function assertSafe(value: JsonValue, path: string): void {
  if (typeof value === 'string') {
    for (const bad of FORBIDDEN) {
      if (value.includes(bad)) throw new Error(`JSON-LD: ${path} contains forbidden text ${JSON.stringify(bad)}`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => assertSafe(v, `${path}[${i}]`));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) assertSafe(v, `${path}.${k}`);
  }
}

/** JSON text for a <script type="application/ld+json"> data block ("<" escaped). */
export function serializeGraph(nodes: readonly JsonObject[]): string {
  const doc: JsonObject = { '@context': 'https://schema.org', '@graph': [...nodes] };
  assertSafe(doc, '$');
  return JSON.stringify(doc).replace(/</g, '\\u003c');
}

/** True when JSON-LD can be emitted for this origin (never for reserved / test hosts). */
export function canEmitFor(origin: string): boolean {
  return !/\.(invalid|test|example|localhost)$/i.test(new URL(origin).hostname);
}

const AREA = { '@type': 'Place', name: 'Nord Italia' } as const;

export type OrgFacts = {
  readonly phone: Slot<string>;
};

export function websiteNode(base: string): JsonObject {
  return {
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: `${base}/`,
    name: 'Medaglia Consulting',
    inLanguage: 'it-IT',
    publisher: { '@id': `${base}/#organization` },
  };
}

export function organizationNode(base: string, f: OrgFacts): JsonObject {
  const node: JsonObject = {
    '@type': 'ProfessionalService',
    '@id': `${base}/#organization`,
    name: 'Medaglia Consulting',
    url: `${base}/`,
    description:
      'Creazione, organizzazione e sviluppo delle reti commerciali delle piccole e medie imprese, in particolare B2B e industriali.',
    areaServed: { ...AREA },
    knowsAbout: [
      'Sviluppo reti commerciali',
      'Affiancamento commerciale',
      'Consulenza commerciale',
      'Sviluppo commerciale operativo',
      'Formazione commerciale',
      'Reti di segnalatori e rivenditori',
    ],
    employee: { '@id': `${base}/chi-siamo/#alberto-medaglia` },
  };
  if (f.phone.state === 'value') node['telephone'] = toE164(f.phone.value);
  // Pruned while unresolved: legalName, logo, image, email, vatID, address, sameAs, founder (SP E.1, ARCH §6.1).
  return node;
}

export type ServiceDef = { readonly path: string; readonly name: string; readonly serviceType: string; readonly description: string };

/** SP E.3 table — descriptions are the approved strings, verbatim. */
export const SERVICES = {
  affiancamento: {
    path: '/affiancamento-commerciale/',
    name: 'Affiancamento commerciale continuativo',
    serviceType: 'Affiancamento commerciale',
    description:
      "Percorso di affiancamento commerciale, generalmente di 6–12 mesi, anche superiori, con l'imprenditore, i responsabili e i commerciali, per costruire un metodo commerciale e metterlo in pratica.",
  },
  consulenza: {
    path: '/consulenza-commerciale/',
    name: 'Consulenza commerciale',
    serviceType: 'Consulenza commerciale',
    description:
      "Consulenza mirata: interventi specifici per analizzare un problema, individuare le soluzioni e definire la strategia. Consulenza direzionale commerciale: un supporto periodico all'imprenditore per analizzare i risultati, valutare nuove strategie e migliorare l'organizzazione commerciale.",
  },
  operativo: {
    path: '/sviluppo-commerciale-operativo/',
    name: 'Sviluppo commerciale operativo',
    serviceType: 'Gestione e sviluppo commerciale',
    description:
      "Coinvolgimento diretto nell'organizzazione, nella gestione e nello sviluppo dell'attività commerciale dell'azienda: il livello di collaborazione più operativo.",
  },
  reti: {
    path: '/sviluppo-reti-commerciali/',
    name: 'Sviluppo reti commerciali',
    serviceType: 'Sviluppo e organizzazione della rete commerciale',
    description:
      "Lavoriamo sull'intera organizzazione commerciale per costruire reti più organizzate ed efficaci: metodo, persone, obiettivi, processi e canali di vendita.",
  },
  formazione: {
    path: '/formazione-commerciale/',
    name: 'Formazione commerciale',
    serviceType: 'Formazione commerciale',
    description:
      'Formazione commerciale per venditori, responsabili e imprenditori: l\'obiettivo non è soltanto trasferire conoscenze, ma rendere più efficace il lavoro commerciale sul campo.',
  },
} as const satisfies Record<string, ServiceDef>;

export type ServiceKey = keyof typeof SERVICES;

export function serviceNode(base: string, key: ServiceKey): JsonObject {
  const s = SERVICES[key];
  return {
    '@type': 'Service',
    '@id': `${base}${s.path}#service`,
    name: s.name,
    serviceType: s.serviceType,
    description: s.description,
    url: `${base}${s.path}`,
    provider: { '@id': `${base}/#organization` },
    areaServed: { ...AREA },
    audience: { '@type': 'BusinessAudience', audienceType: 'Piccole e medie imprese B2B e industriali' },
  };
}

export function breadcrumbNode(base: string, path: string, label: string): JsonObject {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${base}${path}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: label, item: `${base}${path}` },
    ],
  };
}

export function faqNode(base: string, path: string, faqs: readonly Faq[]): JsonObject {
  return {
    '@type': 'FAQPage',
    '@id': `${base}${path}#faq`,
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export type PersonFacts = { readonly photo: Slot<{ readonly src: string }>; readonly title: Slot<string> };

export function personNode(base: string, f: PersonFacts): JsonObject {
  const node: JsonObject = {
    '@type': 'Person',
    '@id': `${base}/chi-siamo/#alberto-medaglia`,
    name: 'Alberto Medaglia',
    url: `${base}/chi-siamo/`,
    worksFor: { '@id': `${base}/#organization` },
    knowsAbout: [
      'Creazione e gestione di reti commerciali',
      'Vendita diretta e sviluppo di partnership',
      "Analisi organizzativa ed economica dell'impresa",
      'Sviluppo di strutture commerciali industriali',
      'Formazione commerciale',
    ],
  };
  if (f.photo.state === 'value') node['image'] = new URL(f.photo.value.src, `${base}/`).href;
  // jobTitle is pruned until the title is confirmed (I2, amendment 7): never set here while missing.
  return node;
}
