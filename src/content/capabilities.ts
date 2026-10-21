/**
 * Chi siamo — the four capabilities (CD §D; ARCHITECTURE §11.3).
 *
 * - `show_company:false` for every company (U2): the FALLBACK lead renders and "Azienda"
 *   is hidden. Company names are kept here only as data for a future, confirmed switch.
 * - Capability 1 `figuresConfirmed:false` (R13): activities flagged `figure:true` are NOT
 *   rendered. Per the Q1 rule no replacement copy is written; the two figure bullets are
 *   simply dropped (owner-review flag).
 * - N8 (primary activities) is DEFERRED.
 * - D35: Chi siamo renders only `capability` (the capability gained) and `today` (how it now
 *   serves companies). Leads, sectors, activities and translations are KEPT here as source
 *   data for later use; they are not rendered in this pass.
 */
import type { ContextLinkKey } from './site.ts';

export type Activity = { readonly text: string; readonly figure?: true };

export type Capability = {
  readonly id: string;
  readonly title: string;
  /** D35: one short line, the capability gained from this experience. */
  readonly capability: string;
  /** D35: one short line, how the capability now serves companies. */
  readonly today: string;
  readonly leadName: string;
  readonly leadFallback: string;
  /** "Responsabilità" (cap. 1) or "Attività" (CD §D labels). */
  readonly activitiesLabel: 'Responsabilità' | 'Attività';
  readonly activities: readonly Activity[];
  readonly sector: string;
  readonly company: string;
  readonly show_company: boolean;
  readonly figuresConfirmed?: boolean;
  readonly translation: string;
  readonly links: readonly ContextLinkKey[];
};

export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'reti',
    title: 'Creazione e gestione di reti commerciali',
    capability: 'Costruire, formare e coordinare una rete commerciale strutturata.',
    today: 'Il metodo per creare o riorganizzare la rete vendita della tua azienda.',
    leadName:
      'In una rete di consulenza finanziaria e assicurativa (OVB), Alberto è passato dal ruolo di segnalatore a quello di Senior Manager.',
    leadFallback:
      'In una rete di consulenza finanziaria e assicurativa, Alberto è passato dal ruolo di segnalatore a quello di Senior Manager.',
    activitiesLabel: 'Responsabilità',
    activities: [
      { text: 'apertura e gestione di tre uffici commerciali tra Bergamo, Brescia e Lecco;', figure: true },
      { text: 'coordinamento di circa 70 collaboratori, part-time e full-time;', figure: true },
      { text: 'ricerca e inserimento di nuovi consulenti, come parte dello sviluppo della rete;' },
      { text: 'formazione sulle tecniche commerciali e sui processi di vendita;' },
      { text: 'definizione di obiettivi individuali e di squadra;' },
      { text: 'monitoraggio delle performance, motivazione e sviluppo professionale dei collaboratori;' },
      { text: 'creazione di una struttura organizzativa pensata per sostenere lo sviluppo della rete.' },
    ],
    sector: 'Consulenza finanziaria e assicurativa',
    company: 'OVB',
    show_company: false,
    figuresConfirmed: false,
    translation:
      'di questa esperienza portiamo il metodo per costruire, formare e coordinare una rete commerciale, non il settore.',
    links: ['reti', 'formazione'],
  },
  {
    id: 'vendita',
    title: 'Vendita diretta e sviluppo di partnership',
    capability: 'Vendere in prima persona e aprire canali indiretti con partner e segnalatori.',
    today: 'Vendita B2B, coordinamento dei venditori, partnership e canali indiretti.',
    leadName:
      "In un'azienda di software gestionali cloud per imprese (Elatos), con un ruolo di direzione e sviluppo commerciale:",
    leadFallback: "In un'azienda di software gestionali cloud per imprese, con un ruolo di direzione e sviluppo commerciale:",
    activitiesLabel: 'Attività',
    activities: [
      { text: 'vendita diretta delle soluzioni gestionali alle aziende;' },
      { text: 'organizzazione e supporto delle attività di vendita di altri collaboratori commerciali;' },
      { text: 'affiancamento nella gestione delle trattative e nello sviluppo di nuove opportunità;' },
      { text: 'ricerca e sviluppo di partnership con imprese e operatori complementari;' },
      { text: "collaborazioni per lo scambio di opportunità commerciali e l'acquisizione reciproca di nuovi clienti;" },
      { text: 'sviluppo di canali di vendita indiretti attraverso segnalatori e partner.' },
    ],
    sector: 'Software gestionali cloud per imprese',
    company: 'Elatos',
    show_company: false,
    translation: 'vendita B2B in prima persona, coordinamento dei venditori, partnership e canali indiretti.',
    links: ['operativo'],
  },
  {
    id: 'analisi',
    title: "Analisi organizzativa ed economica dell'impresa",
    capability: "Leggere organizzazione, costi e attività commerciale di un'impresa.",
    today: 'Priorità commerciali decise dopo aver letto organizzazione e numeri.',
    leadName:
      "In un'azienda di scaffalature industriali e sistemi di stoccaggio (Metal System), attività di consulenza organizzativa e sviluppo commerciale:",
    leadFallback:
      "In un'azienda di scaffalature industriali e sistemi di stoccaggio, attività di consulenza organizzativa e sviluppo commerciale:",
    activitiesLabel: 'Attività',
    activities: [
      { text: "analisi dell'organizzazione aziendale e delle criticità commerciali;" },
      { text: "studio dei centri di costo, per comprendere meglio la struttura economica dell'impresa;" },
      { text: "analisi dell'attività commerciale esistente e delle opportunità di miglioramento;" },
      { text: 'elaborazione di un piano per organizzare e sviluppare la funzione commerciale;' },
      { text: "supporto all'imprenditore nelle decisioni organizzative e nella definizione delle priorità;" },
      { text: 'affiancamento nella gestione di problematiche operative e nella pianificazione dello sviluppo aziendale.' },
    ],
    sector: 'Scaffalature industriali e sistemi di stoccaggio',
    company: 'Metal System',
    show_company: false,
    translation: "leggere organizzazione e numeri dell'impresa prima di decidere le priorità commerciali.",
    links: ['consulenza'],
  },
  {
    id: 'industriali',
    title: 'Sviluppo di strutture commerciali industriali',
    capability: 'Rendere una struttura commerciale industriale organizzata, misurabile e replicabile.',
    today: 'Metodo, obiettivi e progettazione della rete per aziende industriali.',
    leadName:
      "In un'azienda di macchinari e attrezzature industriali (Euromec), attività di consulenza e sviluppo della struttura commerciale:",
    leadFallback:
      "In un'azienda di macchinari e attrezzature industriali, attività di consulenza e sviluppo della struttura commerciale:",
    activitiesLabel: 'Attività',
    activities: [
      { text: 'analisi della struttura commerciale esistente e dei suoi risultati;' },
      { text: 'individuazione delle criticità nei processi di vendita e di acquisizione clienti;' },
      { text: 'definizione di un metodo commerciale più organizzato, misurabile e replicabile;' },
      { text: 'affiancamento e formazione delle risorse commerciali;' },
      { text: 'pianificazione delle attività con obiettivi e indicatori di performance (KPI);' },
      { text: 'sviluppo di strategie per ampliare la presenza commerciale sul mercato italiano;' },
      { text: 'progettazione di una rete commerciale mista: venditori diretti, segnalatori, rivenditori e partner;' },
      { text: "supporto nella ricerca di nuove opportunità e nell'organizzazione della gestione commerciale;" },
      { text: 'monitoraggio di attività, opportunità di vendita e risultati.' },
    ],
    sector: 'Macchinari e attrezzature industriali',
    company: 'Euromec',
    show_company: false,
    translation: 'metodo, obiettivi e progettazione della rete commerciale per aziende industriali.',
    links: ['affiancamento'],
  },
];

/** The lead sentence that may render: the name version only when show_company is true. */
export function capabilityLead(c: Capability): string {
  return c.show_company ? c.leadName : c.leadFallback;
}

/** Activities that may render: figure bullets only when figures are confirmed (R13). */
export function renderedActivities(c: Capability): readonly Activity[] {
  return c.figuresConfirmed === false ? c.activities.filter((a) => a.figure !== true) : c.activities;
}
