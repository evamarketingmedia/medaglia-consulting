/**
 * FAQ — CD §C2 (12), §C3 (6). Visible FaqList and FAQPage JSON-LD are generated from these
 * same arrays (SP E.6: text identical). `published:false` items are never rendered nor
 * emitted (cost FAQ, CD CL-8 / §G1, U7).
 */
export type Faq = { readonly q: string; readonly a: string; readonly published: boolean };

export const FAQ_AFFIANCAMENTO: readonly Faq[] = [
  { q: 'Quanto dura un affiancamento?', a: 'Generalmente 6–12 mesi, anche superiori. È un percorso di medio-lungo periodo.', published: true },
  { q: 'Ogni quanto ci si incontra?', a: 'In genere ogni settimana o ogni due settimane, oppure con un affiancamento più intenso.', published: true },
  {
    q: "Quanto devo essere coinvolto come imprenditore?",
    a: "Il tuo coinvolgimento fa parte del percorso: ci confrontiamo regolarmente con te, oltre che con responsabili e commerciali. La frequenza viene definita in base alle esigenze dell'azienda e al livello di affiancamento necessario.",
    published: true,
  },
  {
    q: 'Lavorate anche con aziende che non hanno ancora una rete commerciale?',
    a: 'Sì. Lavoriamo sia con aziende che hanno già una rete vendita, sia con imprese che vogliono costruirla partendo da zero.',
    published: true,
  },
  { q: 'In quale zona lavorate?', a: 'Lavoriamo con PMI del Nord Italia.', published: true },
  // CD §G1: removed until the client provides the answer (no answer text exists).
  { q: 'Come viene definito il costo?', a: '', published: false },
];

export const FAQ_CONSULENZA: readonly Faq[] = [
  {
    q: 'Da dove parte una consulenza mirata?',
    a: "Dall'analisi dell'attività commerciale esistente, per poi individuare le strategie più adatte.",
    published: true,
  },
  {
    q: 'Riceverò solo indicazioni teoriche?',
    a: "No. Non ci limitiamo a indicazioni teoriche: possiamo affiancarti direttamente nell'applicazione delle strategie, se e quando serve.",
    published: true,
  },
  {
    q: 'Con che frequenza si svolge la consulenza direzionale?',
    a: "È un supporto periodico all'imprenditore. In generale, le nostre collaborazioni possono prevedere incontri settimanali o quindicinali.",
    published: true,
  },
  {
    q: 'Una consulenza può diventare un percorso più lungo?',
    a: "Sì. La collaborazione può partire dalla semplice consulenza e arrivare all'affiancamento continuativo o alla gestione operativa dello sviluppo commerciale.",
    published: true,
  },
];

export function publishedFaq(list: readonly Faq[]): readonly Faq[] {
  return list.filter((f) => f.published && f.a.trim() !== '');
}
