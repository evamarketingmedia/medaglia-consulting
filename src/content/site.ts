/**
 * Site-wide copy and route registry — CD §A, §B; SP §C, C.9; ARCHITECTURE §3, §4.
 * All strings verbatim from COPY-DRAFT.md / SEO-PLAN.md. Nothing here is invented.
 */
import type { InteresseKey } from '../lib/form/interesse.ts';
import type { Robots } from '../lib/seo/meta.ts';

export const BRAND = 'Medaglia Consulting';

export const CTA_LABEL = 'Richiedi un confronto';
export const CALL_LABEL = 'Chiama';
export const EMAIL_LABEL = 'Scrivici';
export const STICKY_CALL_ARIA = 'Chiama Medaglia Consulting';
export const STICKY_CTA_ARIA = 'Richiedi un confronto: vai al modulo di contatto';
export const CLOSING_HEADLINE = 'Parliamo dello sviluppo commerciale della tua azienda.';
export const DISCOVERY_NOTE =
  'Una telefonata conoscitiva per capire le esigenze della tua azienda e valutare insieme come possiamo supportarti.';
export const FOOTER_POSITIONING =
  'Medaglia Consulting — Creazione, organizzazione e sviluppo di reti commerciali per PMI B2B e industriali.';
export const AREA_SERVED = 'Nord Italia';

/**
 * R9 / D16: whether a cookie policy is required is UNDECIDED (null). /cookie-policy/ and its
 * footer link exist only when this is exactly `true`.
 */
export const cookiePolicyRequired: boolean | null = null;

export type RouteKey =
  | 'home'
  | 'affiancamento'
  | 'consulenza'
  | 'operativo'
  | 'reti'
  | 'formazione'
  | 'chiSiamo'
  | 'contatti'
  | 'grazie'
  | 'privacy'
  | 'notFound';

export type RouteDef = {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly robots: Robots;
  readonly sitemap: boolean;
  /** Visible breadcrumb label = BreadcrumbList name (CD §B, SP E.4). */
  readonly breadcrumb?: string;
  /** CTA pre-selection for this page (CD §E table). */
  readonly interesse?: InteresseKey;
};

export const ROUTES = {
  home: {
    path: '/',
    title: 'Sviluppo commerciale PMI Nord Italia | Medaglia Consulting',
    description:
      "Creiamo, organizziamo e sviluppiamo reti commerciali per PMI B2B e industriali del Nord Italia. Affianchiamo l'imprenditore, non ci limitiamo a consigliare.",
    robots: 'index, follow',
    sitemap: true,
  },
  affiancamento: {
    path: '/affiancamento-commerciale/',
    title: 'Affiancamento commerciale per PMI | Medaglia Consulting',
    description:
      "Affiancamento commerciale continuativo per PMI B2B, di 6–12 mesi, anche superiori: costruiamo un metodo commerciale e ne supportiamo l'applicazione.",
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Affiancamento continuativo',
    interesse: 'affiancamento',
  },
  consulenza: {
    path: '/consulenza-commerciale/',
    title: 'Consulenza commerciale per PMI B2B | Medaglia Consulting',
    description:
      "Consulenza commerciale per PMI B2B: interventi mirati per analizzare i problemi di vendita e definire le strategie, con un supporto periodico all'imprenditore.",
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Consulenza commerciale',
    interesse: 'consulenza',
  },
  operativo: {
    path: '/sviluppo-commerciale-operativo/',
    title: 'Sviluppo commerciale operativo per PMI | Medaglia Consulting',
    description:
      'Sviluppo commerciale operativo: partecipiamo direttamente a organizzazione e gestione delle vendite, coordinamento dei commerciali e sviluppo di nuovi clienti.',
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Sviluppo commerciale operativo',
    interesse: 'operativo',
  },
  reti: {
    path: '/sviluppo-reti-commerciali/',
    title: 'Sviluppo rete commerciale per PMI | Medaglia Consulting',
    description:
      'Creazione e sviluppo della rete commerciale per PMI: organizzazione della rete vendita, obiettivi e KPI, formazione, segnalatori, rivenditori e partner.',
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Reti commerciali',
  },
  formazione: {
    path: '/formazione-commerciale/',
    title: 'Formazione commerciale per venditori | Medaglia Consulting',
    description:
      'Formazione commerciale per venditori, responsabili commerciali e imprenditori: tecniche di vendita, negoziazione, gestione delle obiezioni. In azienda o online.',
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Formazione commerciale',
    interesse: 'formazione',
  },
  chiSiamo: {
    path: '/chi-siamo/',
    title: 'Chi siamo: Alberto Medaglia | Medaglia Consulting',
    description:
      "Alberto Medaglia e l'approccio di Medaglia Consulting: competenze manageriali, conoscenza diretta delle vendite, analisi aziendale e implementazione operativa.",
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Chi siamo',
  },
  contatti: {
    path: '/contatti/',
    title: 'Contatti: richiedi un confronto | Medaglia Consulting',
    description:
      'Parliamo dello sviluppo commerciale della tua azienda. Richiedi una telefonata conoscitiva: Medaglia Consulting lavora con PMI B2B del Nord Italia.',
    robots: 'index, follow',
    sitemap: true,
    breadcrumb: 'Contatti',
  },
  grazie: {
    path: '/grazie/',
    title: 'Richiesta ricevuta | Medaglia Consulting',
    description:
      'Grazie per la richiesta. Ti spieghiamo i prossimi passi per la telefonata conoscitiva con Medaglia Consulting.',
    robots: 'noindex, follow',
    sitemap: false,
  },
  privacy: {
    path: '/privacy-policy/',
    title: 'Privacy policy | Medaglia Consulting',
    description: 'Informativa sul trattamento dei dati personali di Medaglia Consulting.',
    robots: 'noindex, follow',
    sitemap: false,
  },
  notFound: {
    path: '/404/',
    title: 'Pagina non trovata | Medaglia Consulting',
    // No SP meta exists for the 404; the CD §9b body sentence is used (approved copy).
    description: 'La pagina che cerchi non esiste o è stata spostata.',
    robots: 'noindex, follow',
    sitemap: false,
  },
} as const satisfies Record<RouteKey, RouteDef>;

/** The 8 indexable URLs, in SP F.1 order. */
export const SITEMAP_PATHS: readonly string[] = Object.values(ROUTES)
  .filter((r) => r.sitemap)
  .map((r) => r.path);

/** Header navigation (CD §B). */
export const NAV_GROUP_LABEL = 'Come collaboriamo';
export const NAV_GROUP: readonly { readonly key: RouteKey; readonly label: string; readonly emphasis?: true }[] = [
  { key: 'affiancamento', label: 'Affiancamento continuativo', emphasis: true },
  { key: 'consulenza', label: 'Consulenza commerciale' },
  { key: 'operativo', label: 'Sviluppo commerciale operativo' },
];
export const NAV_ITEMS: readonly { readonly key: RouteKey; readonly label: string }[] = [
  { key: 'reti', label: 'Reti commerciali' },
  { key: 'formazione', label: 'Formazione' },
  { key: 'chiSiamo', label: 'Chi siamo' },
  { key: 'contatti', label: 'Contatti' },
];
/** Footer link column (CD §B), in order. */
export const FOOTER_LINKS: readonly { readonly key: RouteKey; readonly label: string }[] = [
  ...NAV_GROUP.map(({ key, label }) => ({ key, label })),
  ...NAV_ITEMS,
];

/** Fixed contextual anchors (CD §A: always the same text). */
export const CONTEXT_LINKS = {
  affiancamento: { text: "Scopri l'affiancamento continuativo", route: 'affiancamento' },
  consulenza: { text: 'Scopri la consulenza commerciale', route: 'consulenza' },
  operativo: { text: 'Scopri lo sviluppo commerciale operativo', route: 'operativo' },
  reti: { text: 'Scopri come sviluppiamo le reti commerciali', route: 'reti' },
  formazione: { text: 'Scopri la formazione commerciale', route: 'formazione' },
  percorso: { text: 'Leggi il percorso di Alberto Medaglia', route: 'chiSiamo' },
} as const satisfies Record<string, { text: string; route: RouteKey }>;
export type ContextLinkKey = keyof typeof CONTEXT_LINKS;
