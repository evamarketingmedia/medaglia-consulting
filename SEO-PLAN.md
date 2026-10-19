# SEO IMPLEMENTATION PLAN — Medaglia Consulting (Phase 2, for Checkpoint 2)

**Status:** APPROVED AT CHECKPOINT 2 (2026-10-19, BLUEPRINT D26): approved SEO baseline for build. Produced by seo-builder; edited by website-director only to record approved decisions. Primary source of truth: BLUEPRINT-APPROVED.md. Copy: COPY-DRAFT.md. PRE-LAUNCH and [MISSING] items remain open.

## Checkpoint 2 decisions (APPROVED by the Eva MKT agency owner, 2026-10-16 / 2026-10-17)
- **Titles:** the primary SEO titles in section C are APPROVED. Alternative titles have been removed.
- **Privacy policy:** `noindex, follow` APPROVED.
- **Canonical host:** non-www (apex) APPROVED, applied once the domain is configured (PRE-LAUNCH #5).
- **Cookie policy:** whether /cookie-policy/ exists, and its requirements, depend on the actual tracking/cookie setup implemented at launch.
- **P1 APPROVED:** "rete vendita" used naturally in one H2 and in body copy on /sviluppo-reti-commerciali/ (applied in COPY-DRAFT.md).
- **P2 REJECTED:** no recruiting FAQ.
- **P3 REJECTED for now:** do not use "temporary sales manager", "direttore commerciale esterno" or similar positioning unless confirmed by the client.
- **P4 REJECTED:** keep the approved URL-parameter approach for form pre-selection (`/contatti/?interesse=…`, canonical to `/contatti/`).
- **Reconciliation C1:** Chi siamo keeps the approved section order; "Alberto Medaglia" in the title, the second H2 and Person schema satisfies the requirement.
- **Reconciliation C2:** the Chi siamo H2 uses the client's word "capacità" ("Quattro capacità complementari").
- **Reconciliation C6:** the Affiancamento cost FAQ is not shown and not included in FAQPage schema until the client provides the answer.
- **H1 check:** all copy H1s in COPY-DRAFT.md meet the section C requirements.
- **Reti Service description (2026-10-17, APPROVED, option A):** the Service structured-data description for /sviluppo-reti-commerciali/ is now taken from the new visible Hero body. The removed sentence "Non ci occupiamo soltanto di aumentare il numero dei venditori…" is not restored anywhere.
- **Reti strategy note cleanup (2026-10-17, APPROVED):** the obsolete reference to "non soltanto aumentare il numero dei venditori" in §A was replaced with organisation, method and efficiency across the whole commercial organisation. Internal note only; page copy unchanged.
- **Checkpoint 2 final decisions (2026-10-17, APPROVED):** form only on /contatti/ with fixed ?interesse= values (option a); Service descriptions for Operativo, Formazione and Affiancamento derived strictly from visible copy; Operativo service boundaries PRE-LAUNCH REQUIRED; minor fixes from the cross-site review applied (metas, FAQPage example, internal-link placements, C.4/C.8 topic lists, stale text).
- **CHECKPOINT 2 APPROVED (2026-10-19, BLUEPRINT D26):** final cleanup applied (Consulenza Service description from visible copy; link #28 reason; F3 reverted in copy). Approval covers the build baseline only: no deployment, publishing or DNS changes.

**Source read:** /Users/evastoppa/Downloads/MEDAGLIACONSULTING/BLUEPRINT-APPROVED.md, all of it, including Appendices A and B. At the time of the original SEO draft it was the only file in the project folder; the project folder now contains BLUEPRINT-APPROVED.md, COPY-DRAFT.md and SEO-PLAN.md.
**Labels used:** [VERIFIED FACT] means Blueprint/client. [RECOMMENDATION] means mine. [HYPOTHESIS — RESEARCH REQUIRED], [MISSING] and [NOT VERIFIED] mean what they say. Section numbers like §7.2 refer to the Blueprint.
**Coverage:** this report follows your A–I order. It also covers all 14 sections of the standard SEO plan: intent map → B/C, URL architecture → C/F, matrix → C, multilingual → F.9.

---

## A. Summary of the SEO strategy and keyword research findings

### A.1 Strategy in one paragraph
- **One topic cluster, one page per intent.** Home owns the brand plus the broad "sviluppo commerciale PMI (Nord Italia)" theme. Each service page owns exactly one commercial intent:
  - /affiancamento-commerciale/ → affiancamento commerciale continuativo
  - /consulenza-commerciale/ → consulenza commerciale PMI/B2B
  - /sviluppo-commerciale-operativo/ → hands-on sales management
  - /sviluppo-reti-commerciali/ → rete commerciale / rete vendita
  - /formazione-commerciale/ → formazione commerciale/venditori
- **Supporting pages:** /chi-siamo/ owns "Alberto Medaglia" and trust. /contatti/ owns brand-navigational and contact intent.
- **Hub page:** Affiancamento is the internal-linking hub. Every page links to it.
- **Geography:** "Nord Italia" appears only in the Home and Contatti titles/metas, the schema `areaServed`, and naturally in body copy. No regions or cities anywhere.
- **Not targeted:** recruitment terms, "consulenza aziendale", and ambiguous network terms.

### A.2 Keyword research status — read this first
- **[KEYWORD RESEARCH NOT PROVIDED]** I have no keyword-volume or difficulty tool. **No search volumes or difficulty figures appear in this plan. All are NOT VERIFIED.** Priorities below are relative and qualitative, based on SERP observation only.
- **Tool limitation:** the WebSearch tool returns a mixed, summarised result set. It is not a true Google.it SERP, so all intent observations below are [NOT VERIFIED] indications.
- **Recommended validation (pre-launch, optional) [RECOMMENDATION]:** run the candidate lists in B through Google Keyword Planner, set to Italy and Italian. Ranges are acceptable. Then validate against Search Console query data 8–12 weeks after launch.

### A.3 SERP observations (web findings, cited; separate from assumptions)
1. **"consulente sviluppo rete vendita aziende" returns a clear commercial-intent SERP of consultancies.** Examples: [Sprint Impresa](https://sprintimpresa.it/consulente-commerciale-sviluppo-rete-di-vendita/), [Union Fort Consulting](https://www.unionfortconsulting.it/servizi-consulenza/consulenza-creazione-rete-di-vendita/), [Perform Consulting](https://performconsulting.it/sviluppo-commerciale-e-consulenza-aziendale/creazione-rete-vendita/), [Studio Barale](https://www.studiobarale.it/consulenza-vendite.html), [A&B Associati](https://www.aebassociati.it/costruzione-reti-vendita), [Vivarelli Consulting](https://vivarelliconsulting.com/sviluppo-commerciale/), [Risolta](https://risolta.it/consulenza-aziendale/marketing-e-vendite/vendite-e-sviluppo-rete-di-vendita/).
   - Several of these bundle **ricerca e selezione of venditori/agenti** into their "rete vendita" offer.
   - **Implication [RECOMMENDATION]:** "rete vendita" / "rete commerciale" is the strongest-fit commercial theme and goes on /sviluppo-reti-commerciali/. The page should set itself apart through organisation, method and efficiency across the whole commercial organisation (as stated in the approved visible Hero copy), not through recruiting (R7).
   - Competitors frequently use **"rete vendita"** (singular, "vendita"). I recommend it as a secondary term alongside "rete commerciale".
2. **"sviluppo rete commerciale PMI consulenza" pulls in "reti d'impresa" / contratto di rete content** (Camere di commercio, e.g. [CCIAA Pavia](https://www.pv.camcom.gov.it/files/SPRI/2013-02%20Retimpresa%20-%20Management%20reti%20di%20impresa.pdf), [Unioncamere ER](https://ucer.camcom.it/api/comunicazione-e-stampa/notizie/pdf/2013_02_14laboratorioretidimpresaemiliaromagna-pdf)). These are different topics.
   - **Implication:** pair "rete commerciale" with clear sales terms ("venditori", "rete vendita", "commerciali", "segnalatori", "rivenditori") in titles, H1s and H2s so the page is not read as being about reti d'impresa.
3. **"consulenza commerciale PMI B2B" returns many job listings** (e.g. [Jooble](https://it.jooble.org/lavoro-commerciale-b2b/Stradella-(PV)), [Jobbydoo](https://www.jobbydoo.it/lavoro-consulenza-aziendale-in-provincia-di-rieti)). That means mixed intent: job-seekers search "commerciale B2B".
   - **Implication:** titles and metas must signal the buyer ("per PMI", "per imprese", "imprenditore"). Never use job-like wording. The Contatti page can include the optional "Il modulo è dedicato alle richieste delle aziende" line (§7.8 item 3), which I support for SEO/lead-quality reasons.
4. **"formazione commerciale venditori… tecniche di vendita B2B" is dominated by course marketplaces and catalogue courses with prices, dates and "finanziabile con fondi interprofessionali"** (e.g. [Emagister](https://www.emagister.it/corso_di_vendita_e_negoziazione_b2b-ec2531687.htm), [Emagister tecniche avanzate](https://www.emagister.it/corso_tecniche_di_vendita_avanzate-ec2855752.htm)). This is a mixed intent: individuals looking for a course versus companies looking for in-house training.
   - **Implication:** target the company-side variant ("formazione commerciale aziendale", "formazione venditori in azienda"). Do not compete for "corso tecniche di vendita" as a primary. Do not mention funded training (Blueprint §7.6).
5. **"affiancamento commerciale imprese consulente" has no clear dedicated SERP.** Results are scattered (export TEM consultancies, accountants, job boards), e.g. [ilcommercialistaonline](https://www.ilcommercialistaonline.it/?p=61603).
   - **Inference [HYPOTHESIS — RESEARCH REQUIRED]:** "affiancamento commerciale" is probably a low-demand but well-qualified term. Searchers with the same need may also use "consulente commerciale esterno", "direttore commerciale esterno / a tempo" or "temporary sales manager". See [pmi.it TEM](https://www.pmi.it/economia/mercati/news/51384/temporary-export-manager-per-pmi-dellemilia-romagna.html) and [investireoggi](https://www.investireoggi.it/?p=112732): temporary managers are described for "area commerciale" interventions.
   - **I do not put "temporary manager" / "direttore commerciale esterno" into any title or H1.** The client never used those terms, and they could misrepresent the service. See Proposal P3.
6. **"temporary sales manager PMI"** returns mostly editorial and older content (2012–2021, same sources as above). Demand and current competition are [NOT VERIFIED].
7. **Brand query "Medaglia Consulting" Alberto Medaglia** returned no existing web presence for the firm (unrelated results such as lombardiabeniculturali.it medal records and bain.com pages). This suggests, [NOT VERIFIED], that there is **no existing site to migrate**. The brand SERP should be easy to own once the site is indexed. The word "medaglia" is ambiguous (it means "medal"), so the WebSite/Organization schema and consistent naming help. Not verified: whether a domain or an old site exists → [MISSING], see I.

---

## B. Keyword-to-page map and cannibalisation check

All keywords are **[HYPOTHESIS — RESEARCH REQUIRED]**. Priority (High/Med/Low) is relative business fit plus observed SERP intent, **not volume**.

| Page | Primary target (owner) | Secondary / supporting terms | Intent type | Priority |
|---|---|---|---|---|
| / | sviluppo commerciale PMI (+ Nord Italia) · brand "Medaglia Consulting" | organizzazione commerciale PMI; sviluppo commerciale aziende B2B; consulente sviluppo commerciale Nord Italia | Navigational (brand) + commercial, broad | High |
| /affiancamento-commerciale/ | affiancamento commerciale (continuativo) per PMI | affiancamento imprenditore nelle vendite; supporto continuativo sviluppo commerciale; consulente commerciale esterno (HYPOTHESIS, see P3); metodo commerciale aziendale | Commercial investigation | High (core service; probably low volume, high fit) |
| /consulenza-commerciale/ | consulenza commerciale per PMI / B2B | consulente commerciale per aziende; consulenza direzionale commerciale; consulenza vendite B2B; analisi organizzazione commerciale | Commercial investigation (watch for job-seeker noise) | High |
| /sviluppo-commerciale-operativo/ | sviluppo commerciale operativo | gestione e sviluppo commerciale; gestione operativa delle vendite; coordinamento dei commerciali; sviluppo nuovi clienti B2B; partnership commerciali | Commercial | Med |
| /sviluppo-reti-commerciali/ | sviluppo rete commerciale / creazione rete vendita | organizzazione rete vendita; riorganizzazione rete commerciale; rete di segnalatori; rete rivenditori; sistemi incentivanti venditori; obiettivi e KPI commerciali; piani di carriera commerciali | Commercial investigation | High |
| /formazione-commerciale/ | formazione commerciale (aziendale) | formazione venditori in azienda; formazione responsabili commerciali; formazione tecniche di vendita e negoziazione; gestione delle obiezioni; formazione commerciale online | Commercial (company-side) | Med |
| /chi-siamo/ | Alberto Medaglia · Medaglia Consulting chi siamo | approccio Medaglia Consulting; esperienza reti commerciali | Navigational / trust | Med (brand) |
| /contatti/ | Medaglia Consulting contatti | telefono / richiedi un confronto; Nord Italia | Navigational / transactional | Med (brand) |

**Deliberately excluded as targets (never in titles, metas or H1s):**
- consulenza aziendale (too generic; Blueprint §10)
- selezione venditori / ricerca e selezione venditori / selezione del personale / head hunting / ricerca agenti (R7)
- lavoro commerciale B2B (job-seekers)
- reti d'impresa / contratto di rete (different topic)
- franchising
- fondi interprofessionali / formazione finanziata (not confirmed)
- corso tecniche di vendita as a primary (marketplace intent)
- any region or city (R8, D6)
- OVB / Elatos / Metal System / Euromec (R2)

### Cannibalisation check and rules [RECOMMENDATION]
1. **"sviluppo commerciale": Home vs /sviluppo-commerciale-operativo/.**
   - Home owns the broad head term.
   - The Operativo page always carries the qualifier "operativo" / "gestione operativa" in its title, H1 and meta.
   - Home must not use "operativo" in its title or H1.
2. **"affiancamento": /affiancamento-commerciale/ vs /formazione-commerciale/ and /sviluppo-commerciale-operativo/.**
   - Formazione uses "percorsi di affiancamento individuali e di gruppo" [VERIFIED FACT] and the Operativo source text says "affiancamento diretto" (Appendix A §7).
   - Rule: the word "affiancamento" may appear in body text on those pages, but **not in their title, H1 or meta**. Operativo uses "partecipazione diretta" / "gestione operativa" instead.
   - Both pages link to /affiancamento-commerciale/ with an "affiancamento continuativo" anchor, which reinforces the owner.
3. **"consulenza commerciale" vs "consulenza direzionale commerciale" vs Affiancamento.**
   - Both consulenza forms live on /consulenza-commerciale/ (APPROVED §7.3).
   - Affiancamento never uses "consulenza commerciale" in its title or H1.
   - Home avoids "consulenza" in its title. The brand name "Consulting" is acceptable.
4. **"rete commerciale": Home vs /sviluppo-reti-commerciali/.**
   - Home H1 and body may mention reti commerciali (it is the positioning), but the Home **title** targets "sviluppo commerciale".
   - Only the Reti page uses "rete commerciale/rete vendita" in its title.
5. **"formazione":** only /formazione-commerciale/ uses it in title or H1. The Reti and Affiancamento pages list training as an activity and link to Formazione.
6. **Chi siamo vs service pages:** capability blocks describe experience. They must not use service-target titles as H2s (e.g. avoid an H2 that is just "Sviluppo reti commerciali"). Use the capability labels, which are different wording (§8.2).

**Result:** no two pages share a primary target.

---

## C. Per-page SEO specification

**Common rules for every page:**
- Titles are ≤ 60 characters (counted manually), brand at the end, separator " | ". Metas are about 140–160 characters (counted manually).
- Final H1 wording belongs to the copywriter. The H1 requirement below lists the terms the H1 **must** contain.
- Canonical URLs use the production host `https://[MISSING: dominio]`, written below as `{BASE}`.

### C.1 Home — `/`
- **Search intent:** brand plus broad positioning. Audience A/B/C. Geography: Nord Italia. Role: entry and routing to Affiancamento.
- **Index:** INDEX, follow. **Sitemap:** yes. **Canonical:** `{BASE}/`
- **Title (57):** `Sviluppo commerciale PMI Nord Italia | Medaglia Consulting`
- **Meta (156):** `Creiamo, organizziamo e sviluppiamo reti commerciali per PMI B2B e industriali del Nord Italia. Affianchiamo l'imprenditore, non ci limitiamo a consigliare.`
- **H1 requirement:** must contain "sviluppo commerciale" or "reti commerciali", plus "PMI" (or "imprese B2B/industriali"). "Nord Italia" goes in the H1 or the hero sentence directly beneath it. Not allowed: "consulenza aziendale", "operativo".
- **H2 topics (SEO):**
  - problemi commerciali delle PMI (the 7 problems)
  - tre livelli di collaborazione (consulenza mirata / affiancamento continuativo / sviluppo commerciale operativo)
  - metodo in 4 fasi
  - reti commerciali: venditori, segnalatori, rivenditori, partner
  - prospettiva esterna
  - esperienza (capability labels, no company names)
  - formazione commerciale
  - con chi lavoriamo: PMI B2B e industriali del Nord Italia
  - CTA
- **Schema:** WebSite + ProfessionalService (sitewide graph). No BreadcrumbList on Home.

### C.2 Affiancamento continuativo — `/affiancamento-commerciale/` (CORE)
- **Search intent:** commercial investigation. Audience A/C. Role: primary conversion page.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/affiancamento-commerciale/`
- **Title (54):** `Affiancamento commerciale per PMI | Medaglia Consulting`
- **Meta (148):** `Affiancamento commerciale continuativo per PMI B2B, di 6–12 mesi, anche superiori: costruiamo un metodo commerciale e ne supportiamo l'applicazione.`
- **H1 requirement:** "affiancamento" + "commerciale" (or "sviluppo commerciale"), plus the idea of continuity ("continuativo" / "nel tempo"). Must not read as a one-off consultation.
- **H2 topics:**
  - quando serve un affiancamento commerciale
  - cos'è l'affiancamento continuativo (duration stated in the hero and FAQ)
  - perché un percorso continuativo
  - come funziona: analisi, strategie, metodo operativo, applicazione; incontri settimanali o quindicinali
  - cosa può comprendere: obiettivi e KPI, metodo e processi di vendita, formazione e affiancamento dei commerciali, gestione e motivazione, trattative, sviluppo della rete, monitoraggio
  - adattato all'impresa
  - cosa resta all'azienda
  - esperienza alle spalle
  - confronto tra i tre livelli
  - quando serve un coinvolgimento operativo
  - domande frequenti
- **H3:** one per FAQ question. One per comparison column, optional.
- **Schema:** Service, BreadcrumbList, FAQPage (only if the FAQs are rendered visibly; see E.6).

### C.3 Consulenza commerciale — `/consulenza-commerciale/`
- **Search intent:** commercial investigation. Audience A. Role: entry level, bridge to Affiancamento.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/consulenza-commerciale/`
- **Title (55):** `Consulenza commerciale per PMI B2B | Medaglia Consulting`
- **Meta (159):** `Consulenza commerciale per PMI B2B: interventi mirati per analizzare i problemi di vendita e definire le strategie, con un supporto periodico all'imprenditore.`
- **H1 requirement:** "consulenza commerciale" plus a business qualifier ("per PMI" / "per imprese" / "B2B"). This is needed to separate the page from job-ad intent.
- **H2 topics:**
  - consulenza mirata: analisi dei problemi, soluzioni, strategie
  - consulenza direzionale commerciale: supporto periodico all'imprenditore
  - esperienza (capability 3, analisi organizzativa ed economica)
  - quando basta una consulenza e quando serve un affiancamento continuativo
  - domande frequenti
- **Schema:** Service (one Service with `serviceType` covering both forms, or two Service nodes; I recommend one for simplicity), BreadcrumbList, FAQPage if visible.

### C.4 Sviluppo commerciale operativo — `/sviluppo-commerciale-operativo/`
- **Search intent:** commercial. Audience A/B. Role: highest-involvement offer.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/sviluppo-commerciale-operativo/`
- **Title (59):** `Sviluppo commerciale operativo per PMI | Medaglia Consulting`
- **Meta (159):** `Sviluppo commerciale operativo: partecipiamo direttamente a organizzazione e gestione delle vendite, coordinamento dei commerciali e sviluppo di nuovi clienti.`
- Re-check this meta once the Operativo service boundaries are confirmed (PRE-LAUNCH REQUIRED).
- **H1 requirement:** "sviluppo commerciale operativo", or "gestione operativa" plus "sviluppo commerciale". Do **not** use "affiancamento" in the H1.
- **H2 topics:**
  - cosa comprende: organizzazione delle attività, coordinamento dei commerciali, strategie, monitoraggio dei risultati, sviluppo nuovi clienti
  - quando è indicato
  - partnership e nuove opportunità commerciali
  - competenze complementari (professionisti e imprese che collaborano con noi)
  - da dove si parte: analisi dell'attività commerciale esistente
  - esperienza (capability 2)
  - affiancamento continuativo
- **Schema:** Service, BreadcrumbList. No FAQPage (the Blueprint gives this page no FAQ).

### C.5 Sviluppo reti commerciali — `/sviluppo-reti-commerciali/`
- **Search intent:** commercial investigation. Audience B. Role: the specialism page.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/sviluppo-reti-commerciali/`
- **Title (54):** `Sviluppo rete commerciale per PMI | Medaglia Consulting`
- **Meta (152):** `Creazione e sviluppo della rete commerciale per PMI: organizzazione della rete vendita, obiettivi e KPI, formazione, segnalatori, rivenditori e partner.`
  - Optional: if the copywriter wants to avoid the "KPI" jargon, replace "obiettivi e KPI" with "obiettivi e monitoraggio".
- **H1 requirement:** "rete commerciale" (or "reti commerciali") plus "sviluppo/creazione/organizzazione". Never "selezione", "ricerca venditori" or "reti d'impresa".
- **H2 topics:**
  - da dove si parte: rete vendita esistente o da costruire
  - organizzazione e metodo
  - obiettivi e monitoraggio (KPI)
  - persone: formazione, piani di carriera, sistemi incentivanti
  - crescita: partnership, segnalatori, rivenditori, nuove opportunità
  - rete commerciale mista e canali indiretti
  - prospettiva esterna
  - esperienza (capabilities 1, 2, 4)
  - quale livello di collaborazione
- **R7:** the one line on "inserimento di nuove figure commerciali, quando necessario" stays in body text. It must not be an H2 or H3.
- **Schema:** Service, BreadcrumbList.

### C.6 Formazione commerciale — `/formazione-commerciale/`
- **Search intent:** commercial, company-side. Audience C. Role: secondary service; bridge to Affiancamento.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/formazione-commerciale/`
- **Title (57):** `Formazione commerciale per venditori | Medaglia Consulting`
- **Meta (160):** `Formazione commerciale per venditori, responsabili commerciali e imprenditori: tecniche di vendita, negoziazione, gestione delle obiezioni. In azienda o online.`
- **H1 requirement:** "formazione commerciale", or "formazione" plus "venditori/commerciali". No "corso", "attestato" or "finanziata".
- **H2 topics:**
  - a chi è rivolta: venditori, responsabili commerciali, imprenditori
  - temi: tecniche di vendita, negoziazione, comunicazione, gestione delle obiezioni, pianificazione commerciale, gestione dei clienti, organizzazione dell'attività di vendita (H3s per topic optional)
  - modalità: in azienda, online, percorsi individuali e di gruppo
  - contenuti su misura
  - formazione dentro un affiancamento continuativo
  - esperienza (capability 1)
- **Schema:** Service (`serviceType` "Formazione commerciale"). Do not use Course schema: there are no discrete courses, dates or prices. BreadcrumbList.

### C.7 Chi siamo — `/chi-siamo/`
- **Search intent:** navigational/trust. Audience: all. Role: trust before conversion.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/chi-siamo/`
- **Title (48):** `Chi siamo: Alberto Medaglia | Medaglia Consulting`
- **Meta (159):** `Alberto Medaglia e l'approccio di Medaglia Consulting: competenze manageriali, conoscenza diretta delle vendite, analisi aziendale e implementazione operativa.`
- **H1 requirement:** "Medaglia Consulting" or "chi siamo". "Alberto Medaglia" appears in the title, in the second H2 (approved section order) and in Person schema — accepted at Checkpoint 2 (C1).
- **H2 topics:**
  - il nostro approccio
  - Alberto Medaglia
  - quattro capacità complementari, with one H3 per capability using the §8.2 labels:
    - Creazione e gestione di reti commerciali
    - Vendita diretta e sviluppo di partnership
    - Analisi organizzativa ed economica dell'impresa
    - Sviluppo di strutture commerciali industriali
  - come lavoriamo
  - rete di professionisti partner
- **Company names, Bergamo/Brescia/Lecco and the OVB figures:** body text only, conditional (R2/R3/R8). Never in headings, title, meta or schema.
- **Second profile:** not rendered, not in HTML output, not in the sitemap.
- **Schema:** Person (Alberto Medaglia), BreadcrumbList. Optionally AboutPage as the page type.

### C.8 Contatti — `/contatti/`
- **Search intent:** navigational/transactional. Role: conversion.
- **Index:** INDEX. **Sitemap:** yes. **Canonical:** `{BASE}/contatti/`, including when reached with `?interesse=…` (see F.4).
- **Title (52):** `Contatti: richiedi un confronto | Medaglia Consulting`
- **Meta (147):** `Parliamo dello sviluppo commerciale della tua azienda. Richiedi una telefonata conoscitiva: Medaglia Consulting lavora con PMI B2B del Nord Italia.`
- **H1 requirement:** the closing message or "Contatti". The page must contain the visible text "Nord Italia" (area served) and the phone/email in crawlable HTML, not images.
- **H2 topics:**
  - la telefonata conoscitiva
  - richiedi un confronto (form)
  - telefono ed email
  - area servita: Nord Italia
  - (dati societari: in the sitewide footer legal area, not a section of this page)
- **Schema:** BreadcrumbList. Optionally ContactPage as the page type. The organisation's contact data lives in the sitewide ProfessionalService node, not duplicated here.

### C.9 Non-indexable and utility URLs

| URL | Status | Robots meta | Canonical | Sitemap | Title | Reason |
|---|---|---|---|---|---|---|
| /grazie/ | 200 | `noindex, follow` | none | no | `Richiesta ricevuta \| Medaglia Consulting` | Post-conversion page, no search value; indexing it would also distort conversion tracking (APPROVED). |
| /privacy-policy/ | 200 | **`noindex, follow`** | none | no | `Privacy policy \| Medaglia Consulting` | **APPROVED at Checkpoint 2.** Legal boilerplate, often identical across sites (e.g. iubenda-style text), with no target query. Brand queries are already served by Home. Keeping the index to the 8 content pages matches the approved sitemap. It stays crawlable and linked from footer and form. |
| /cookie-policy/ (only if it exists) | 200 | `noindex, follow` | none | no | `Cookie policy \| Medaglia Consulting` | APPROVED. Existence and requirements depend on the actual tracking/cookie setup implemented at launch. |
| 404 page | **real 404 status** | (implicit) | none | no | `Pagina non trovata \| Medaglia Consulting` | Soft-404s waste crawl and confuse reporting. |
| /contatti/?interesse=… and any parameter URL | 200 | index (inherits) | `{BASE}/contatti/` | no | same as /contatti/ | Avoid duplicate URLs created by pre-selection. |
| Second team profile | not built | — | — | no | — | §11 data model `published:false`. |
| Staging and preview hosts | password and/or 401 | `X-Robots-Tag: noindex` | — | — | — | F.3 |

- **Optional meta for /grazie/:** `Grazie per la richiesta. Ti spieghiamo i prossimi passi per la telefonata conoscitiva con Medaglia Consulting.`
- **Privacy text:** the Blueprint says client/advisor. Optional meta for /privacy-policy/: `Informativa sul trattamento dei dati personali di Medaglia Consulting.`

**Quality check:** the 8 titles are unique and the 8 H1 requirements are distinct. No canonical points to a noindex URL. The sitemap holds only the 8 canonical 200-status URLs.

---

## D. Internal linking plan

Rules from §10, all honoured:
- every page links to /affiancamento-commerciale/
- "Esperienza" blocks link to /chi-siamo/
- each capability links to its mapped service
- breadcrumbs appear on inner pages
- all navigation is plain `<a href>` HTML. A JS-only dropdown is not acceptable; the "Come collaboriamo" parent can be a non-link toggle, but its children must be real links.

| # | From | To | Placement | Anchor concept (Italian, final wording by copywriter) | Reason |
|---|---|---|---|---|---|
| 1 | All pages (nav) | all 7 content pages | Header nav | nav labels per §6.1 | Crawlable flat architecture: every page is 1 click from any page. |
| 2 | All pages | /contatti/ | Header button, sticky bar, final CTA | "Richiedi un confronto" | Conversion. Service pages add `?interesse=` (F.4). |
| 3 | / | /affiancamento-commerciale/ | "Tre modi di collaborare", emphasised card | "affiancamento commerciale continuativo" | Strongest internal signal to the core page, with a descriptive anchor. |
| 4 | / | /consulenza-commerciale/ | Three-levels block | "consulenza mirata" / "consulenza commerciale" | Level 1 |
| 5 | / | /sviluppo-commerciale-operativo/ | Three-levels block | "sviluppo commerciale operativo" | Level 3 |
| 6 | / | /sviluppo-reti-commerciali/ | Specialism block | "sviluppo delle reti commerciali" | Journey 2 (§4.2) |
| 7 | / | /formazione-commerciale/ | Formazione block | "formazione commerciale" | — |
| 8 | / | /chi-siamo/ | Esperienza block | "l'esperienza dietro Medaglia Consulting" / "chi siamo" | Trust |
| 9 | /affiancamento-commerciale/ | /sviluppo-reti-commerciali/ | "Su cosa possiamo lavorare insieme", network bullet | "sviluppo della rete commerciale" | Contextual. |
| 10 | /affiancamento-commerciale/ | /formazione-commerciale/ | "Su cosa possiamo lavorare insieme", training bullet | "formazione dei commerciali" | Contextual. |
| 11 | /affiancamento-commerciale/ | /consulenza-commerciale/ | Comparison table (link below the table) | "consulenza mirata" | Level comparison. |
| 12 | /affiancamento-commerciale/ | /sviluppo-commerciale-operativo/ | §11 "Quando serve un coinvolgimento più diretto" only | "sviluppo commerciale operativo" | Approved bridge. |
| 13 | /affiancamento-commerciale/ | /chi-siamo/ | Esperienza block (cap. 1, 4) | "l'esperienza di Alberto Medaglia" | Rule. |
| 14 | /consulenza-commerciale/ | /affiancamento-commerciale/ | "Quando basta una consulenza, e quando serve di più" | "affiancamento continuativo" | Rule plus the natural next step. |
| 15 | /consulenza-commerciale/ | /chi-siamo/ | Esperienza (cap. 3) | "analisi organizzativa ed economica" → chi siamo | Rule. |
| 16 | /sviluppo-commerciale-operativo/ | /sviluppo-reti-commerciali/ | Partnership section | "partnership, segnalatori e rivenditori" | Contextual. |
| 17 | /sviluppo-commerciale-operativo/ | /affiancamento-commerciale/ | Section 8 | "affiancamento continuativo" | Rule. |
| 18 | /sviluppo-commerciale-operativo/ | /chi-siamo/ | Esperienza (cap. 2) | "vendita diretta e sviluppo di partnership" | Rule. |
| 19 | /sviluppo-reti-commerciali/ | /formazione-commerciale/ | "Persone" group | "formazione dei venditori" | Contextual. |
| 20 | /sviluppo-reti-commerciali/ | /affiancamento-commerciale/, /consulenza-commerciale/, /sviluppo-commerciale-operativo/ | "Quale livello" | the level names | Routing; Affiancamento first. |
| 21 | /sviluppo-reti-commerciali/ | /chi-siamo/ | Esperienza (cap. 1, 2, 4) | "creazione e gestione di reti commerciali" | Rule. |
| 22 | /formazione-commerciale/ | /affiancamento-commerciale/ | "Formazione e affiancamento continuativo possono lavorare insieme" | "affiancamento continuativo" | Rule. |
| 23 | /formazione-commerciale/ | /chi-siamo/ | Esperienza (cap. 1) | "esperienza nella formazione delle reti" | Rule. |
| 24 | /chi-siamo/ cap. 1 | /sviluppo-reti-commerciali/ (also /formazione-commerciale/) | "Come si traduce oggi" | "sviluppo reti commerciali" | §8.2 mapping. |
| 25 | /chi-siamo/ cap. 2 | /sviluppo-commerciale-operativo/ | same | "sviluppo commerciale operativo" | §8.2 |
| 26 | /chi-siamo/ cap. 3 | /consulenza-commerciale/ | same | "consulenza commerciale e direzionale" | §8.2 |
| 27 | /chi-siamo/ cap. 4 | /affiancamento-commerciale/ | same | "affiancamento continuativo" | §8.2; also satisfies the every-page rule. |
| 28 | /contatti/ | /affiancamento-commerciale/ | End of page (after Dove lavoriamo) | "Scopri l'affiancamento continuativo" | Rule; at the end of the Contatti page, routing visitors who are unsure where to start. |
| 29 | /grazie/ | /affiancamento-commerciale/, /chi-siamo/ | Body | as §7.9 | APPROVED. |
| 30 | Footer (all) | /privacy-policy/, /cookie-policy/ | Footer | "Privacy policy", "Cookie policy" | Legal; crawlable even though noindex. |
| 31 | Inner pages | / | Breadcrumb | "Home" → current page name | BreadcrumbList parity. |

**Anchor rules:**
- No company names in anchors.
- No "clicca qui".
- No recruitment wording.
- Do not repeat an exact-match anchor many times on one page; once in context is enough.

**Breadcrumbs:** two levels, `Home › [Page]`. "Come collaboriamo" has no URL, so it is **not** a breadcrumb level. Shown on all inner pages except /grazie/; optional there.

---

## E. Structured data templates (JSON-LD)

**General rules:**
- One `<script type="application/ld+json">` per page holding an `@graph`.
- Values must match visible content.
- `{BASE}` = `https://[MISSING: dominio]`.
- Remove any property whose value is still `[MISSING]` before launch. **Never ship placeholder strings in schema.**
- No Review, AggregateRating, offers or price (R9).
- No company names from Alberto's history.
- No Bergamo, Brescia or Lecco.

### E.1 Sitewide (every page): WebSite + ProfessionalService
- **WebSite:** REQUIRED. Low effort; it helps Google display the correct site name for an ambiguous brand word ("medaglia").
- **ProfessionalService:** REQUIRED. It is the most specific schema.org subtype that fits: a LocalBusiness subtype that inherits Organization properties.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "{BASE}/#website",
      "url": "{BASE}/",
      "name": "Medaglia Consulting",
      "inLanguage": "it-IT",
      "publisher": { "@id": "{BASE}/#organization" }
    },
    {
      "@type": "ProfessionalService",
      "@id": "{BASE}/#organization",
      "name": "Medaglia Consulting",
      "legalName": "[MISSING: ragione sociale — PRE-LAUNCH #3]",
      "url": "{BASE}/",
      "logo": "[MISSING: {BASE}/logo.png — PRE-LAUNCH, design]",
      "image": "[MISSING: same as logo or brand image]",
      "description": "Creazione, organizzazione e sviluppo delle reti commerciali delle piccole e medie imprese, in particolare B2B e industriali.",
      "telephone": "[MISSING: +39… — PRE-LAUNCH #1]",
      "email": "[MISSING: publishable email — PRE-LAUNCH #2]",
      "vatID": "[MISSING: IT + P.IVA — PRE-LAUNCH #3]",
      "areaServed": { "@type": "Place", "name": "Nord Italia" },
      "knowsAbout": [
        "Sviluppo reti commerciali",
        "Affiancamento commerciale",
        "Consulenza commerciale",
        "Sviluppo commerciale operativo",
        "Formazione commerciale",
        "Reti di segnalatori e rivenditori"
      ],
      "founder": "[CONDITIONAL: only if Alberto's title is confirmed as founder — PRE-LAUNCH #10; otherwise omit]",
      "employee": { "@id": "{BASE}/chi-siamo/#alberto-medaglia" },
      "address": "[CONDITIONAL — PRE-LAUNCH #6: include PostalAddress ONLY if the address is published on the site; otherwise omit the property entirely]",
      "sameAs": ["[OPTIONAL: LinkedIn company URL]"]
    }
  ]
}
```

- **Conditional address block** (use only if published, and it must match the footer character for character):
  `"address": {"@type":"PostalAddress","streetAddress":"[MISSING]","postalCode":"[MISSING]","addressLocality":"[MISSING]","addressRegion":"[MISSING]","addressCountry":"IT"}`
- **Do not add** `openingHours` until hours are confirmed (PRE-LAUNCH #1).
- **Without an address,** the node remains valid schema.org but is not eligible for local rich results. That is acceptable: no local-pack strategy at launch.
- **`founder` / `employee` reference:** if Alberto's title is confirmed as founder/titolare, use `"founder": {"@id": "{BASE}/chi-siamo/#alberto-medaglia"}` and keep or drop `employee`. If not confirmed, keep `employee` only.

### E.2 Person — /chi-siamo/ only (SHOULD HAVE)

```json
{
  "@type": "Person",
  "@id": "{BASE}/chi-siamo/#alberto-medaglia",
  "name": "Alberto Medaglia",
  "url": "{BASE}/chi-siamo/",
  "image": "[MISSING: photo URL — before design; omit until available]",
  "jobTitle": "[CONDITIONAL: exact title — PRE-LAUNCH #10; omit until confirmed; never 'Founder' unconfirmed]",
  "worksFor": { "@id": "{BASE}/#organization" },
  "knowsAbout": [
    "Creazione e gestione di reti commerciali",
    "Vendita diretta e sviluppo di partnership",
    "Analisi organizzativa ed economica dell'impresa",
    "Sviluppo di strutture commerciali industriali",
    "Formazione commerciale"
  ],
  "sameAs": ["[OPTIONAL: personal LinkedIn URL, if client provides]"]
}
```

- **Excluded, and why:** `alumniOf` (university not provided; the degree is only "Economia e Management") and `hasOccupation`.
- **Past employers (OVB, Elatos, Metal System, Euromec):** do **not** add them even after name confirmation [RECOMMENDATION]. schema.org has no clean property for past employers (`worksFor` would wrongly state current employment). Adding them would also put these names into machine-readable data outside /chi-siamo/ body copy, which conflicts with the spirit of R2. They are covered in visible text only.
- **Degree:** a `hasCredential` (EducationalOccupationalCredential "Laurea in Economia e Management") is OPTIONAL. Add it only if the copywriter publishes the degree. It is VERIFIED, so it is allowed.

### E.3 Service — one per service page (REQUIRED)
Template, shown for Affiancamento; repeat per page with the values from the table below.

```json
{
  "@type": "Service",
  "@id": "{BASE}/affiancamento-commerciale/#service",
  "name": "Affiancamento commerciale continuativo",
  "serviceType": "Affiancamento commerciale",
  "description": "Percorso di affiancamento commerciale, generalmente di 6–12 mesi, anche superiori, con l'imprenditore, i responsabili e i commerciali, per costruire un metodo commerciale e metterlo in pratica.",
  "url": "{BASE}/affiancamento-commerciale/",
  "provider": { "@id": "{BASE}/#organization" },
  "areaServed": { "@type": "Place", "name": "Nord Italia" },
  "audience": { "@type": "BusinessAudience", "audienceType": "Piccole e medie imprese B2B e industriali" }
}
```

| Page | name | serviceType | description source |
|---|---|---|---|
| /affiancamento-commerciale/ | Affiancamento commerciale continuativo | Affiancamento commerciale | Description (as in the JSON-LD above): "Percorso di affiancamento commerciale, generalmente di 6–12 mesi, anche superiori, con l'imprenditore, i responsabili e i commerciali, per costruire un metodo commerciale e metterlo in pratica." Source: Visible Affiancamento hero body |
| /consulenza-commerciale/ | Consulenza commerciale | Consulenza commerciale | Description: "Consulenza mirata: interventi specifici per analizzare un problema, individuare le soluzioni e definire la strategia. Consulenza direzionale commerciale: un supporto periodico all'imprenditore per analizzare i risultati, valutare nuove strategie e migliorare l'organizzazione commerciale." Source: Visible Consulenza §2 + §3 body (COPY-DRAFT §3, Checkpoint 2 final) |
| /sviluppo-commerciale-operativo/ | Sviluppo commerciale operativo | Gestione e sviluppo commerciale | Description: "Coinvolgimento diretto nell'organizzazione, nella gestione e nello sviluppo dell'attività commerciale dell'azienda: il livello di collaborazione più operativo." Source: Visible Operativo hero body (COPY-DRAFT §4, Checkpoint 2 final) |
| /sviluppo-reti-commerciali/ | Sviluppo reti commerciali | Sviluppo e organizzazione della rete commerciale | Visible Hero body (COPY-DRAFT §5, Reti review 2026-10-17): "Lavoriamo sull'intera organizzazione commerciale per costruire reti più organizzate ed efficaci: metodo, persone, obiettivi, processi e canali di vendita." |
| /formazione-commerciale/ | Formazione commerciale | Formazione commerciale | Description: "Formazione commerciale per venditori, responsabili e imprenditori: l'obiettivo non è soltanto trasferire conoscenze, ma migliorare concretamente le competenze e le performance commerciali." Source: Visible Formazione H1 + hero body |

No `offers`, price, `aggregateRating`, `review` or `hoursAvailable`.

### E.4 BreadcrumbList — all inner pages (REQUIRED)

```json
{
  "@type": "BreadcrumbList",
  "@id": "{BASE}/affiancamento-commerciale/#breadcrumb",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "{BASE}/" },
    { "@type": "ListItem", "position": 2, "name": "Affiancamento continuativo", "item": "{BASE}/affiancamento-commerciale/" }
  ]
}
```

Position 2 names must equal the visible breadcrumb labels:
- Consulenza commerciale
- Sviluppo commerciale operativo
- Reti commerciali
- Formazione commerciale
- Chi siamo
- Contatti

### E.5 Optional page-type nodes
- `AboutPage` on /chi-siamo/ and `ContactPage` on /contatti/, each with `"isPartOf": {"@id":"{BASE}/#website"}`.
- OPTIONAL: little benefit, but trivial to add.

### E.6 FAQPage — /affiancamento-commerciale/ and /consulenza-commerciale/ only, if FAQs are visible
- **Status: OPTIONAL. [RECOMMENDATION]**
- Since 2023 Google shows FAQ rich results only for well-known government and health sites [NOT VERIFIED for current state; based on Google's Aug-2023 announcement]. So this markup is unlikely to create rich results here.
- It remains valid schema and is cheap on a static generator if it is generated from the same data as the visible FAQ.
- Q&A text must be **identical** to the visible text and built only from VERIFIED facts.

```json
{
  "@type": "FAQPage",
  "@id": "{BASE}/affiancamento-commerciale/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quanto dura un affiancamento?",
      "acceptedAnswer": { "@type": "Answer", "text": "Generalmente 6–12 mesi, anche superiori. È un percorso di medio-lungo periodo." }
    }
  ]
}
```

- **Text must be identical to the visible FAQ; never copy from this example without checking the page.**
- Do not include any FAQ whose answer is `[MISSING]`, such as in-person vs remote or who calls back. Leave it out of both the page and the schema.
- No FAQPage on other pages unless FAQs are added visibly.

---

## F. Technical SEO requirements

### F.1 XML sitemap — REQUIRED
- **Location:** `{BASE}/sitemap.xml`. If Astro's `@astrojs/sitemap` is used it emits `sitemap-index.xml`; either works, as long as robots.txt and Search Console reference the actual file.
- **Contents (exactly 8):**
  - `/`
  - `/affiancamento-commerciale/`
  - `/consulenza-commerciale/`
  - `/sviluppo-commerciale-operativo/`
  - `/sviluppo-reti-commerciali/`
  - `/formazione-commerciale/`
  - `/chi-siamo/`
  - `/contatti/`
- **Format:** absolute https URLs on the canonical host, with trailing slash.
- **Excluded:** /grazie/, /privacy-policy/, /cookie-policy/, 404, parameter URLs, the second profile, staging hosts.
- **`<lastmod>`:** use only real content-change dates, or omit. Omit `<priority>` and `<changefreq>` (Google ignores them). No hreflang alternates (Italian only).
- **Build rule:** generate from a production `SITE_URL` variable so no staging host leaks into the sitemap or canonicals.

### F.2 robots.txt — REQUIRED (production)

```
User-agent: *
Allow: /

Sitemap: https://[MISSING: dominio]/sitemap.xml
```

- **Do not disallow /grazie/ or the legal pages.** A blocked URL cannot show its noindex.
- **Do not block** CSS, JS, fonts or images.
- **AI-crawler rules** (GPTBot, etc.): client decision, OPTIONAL, not an SEO requirement. Default is none.

### F.3 Staging and preview protection — REQUIRED
1. **Primary control:** password or authentication on all staging and deploy-preview hosts (Netlify password / Cloudflare Access / Vercel Deployment Protection).
   - Reason: R1 says no fake content on staging, and drafts containing unconfirmed company names must never be crawled.
2. **Secondary control:** send `X-Robots-Tag: noindex, nofollow` as an HTTP header on every non-production host. Hosts may add this by default for previews; verify it, do not rely on it [NOT VERIFIED per host].
3. **Do not** use `Disallow: /` as the only protection. If used on staging it must sit alongside authentication, and it must **never** be deployed to production. Keep robots.txt environment-specific.
4. Before launch, confirm that production does not send `X-Robots-Tag` or `noindex` on the 8 pages.

### F.4 Canonicals, hosts, slashes, parameters — REQUIRED
- **Canonical host:** `https://` plus the non-www (apex) host — APPROVED at Checkpoint 2, applied once the domain is configured (PRE-LAUNCH #5).
- **Redirects:**
  - `http://` → `https://`
  - other host variant → canonical host
  - `/page` → `/page/`
  - `/index.html` → `/`
  - `/page/index.html` → `/page/`
  - All as single-hop 301s.
- **Trailing slash:** always on. Internal links, canonicals, sitemap and breadcrumbs all use the slash form.
- **Self-referencing absolute canonical** on all 8 indexable pages. No canonical on noindex pages.
- **Form location:** the form exists only on /contatti/ (Checkpoint 2 final decision, option a). All other CTAs link to `/contatti/` or `/contatti/?interesse=<value>`.
- **Form pre-selection:** service-page CTA links go to `/contatti/?interesse=<value>`.

**Definitive Interesse mapping (APPROVED, Checkpoint 2 final, option a).** The form exists only on /contatti/; the canonical of every /contatti/?interesse=… URL is /contatti/.

| Source of the CTA | Link | `interesse` value | Pre-selected Interesse option |
|---|---|---|---|
| /affiancamento-commerciale/ | /contatti/?interesse=affiancamento | `affiancamento` | Affiancamento continuativo |
| /consulenza-commerciale/ | /contatti/?interesse=consulenza | `consulenza` | Consulenza mirata |
| /sviluppo-commerciale-operativo/ | /contatti/?interesse=operativo | `operativo` | Sviluppo commerciale operativo |
| /formazione-commerciale/ | /contatti/?interesse=formazione | `formazione` | Formazione |
| Home, /sviluppo-reti-commerciali/, /chi-siamo/, header button, sticky bar, footer, direct visit | /contatti/ | none | No pre-selection. All options, including "Non so ancora", are left for the visitor to choose. "Non so ancora" has no parameter value. |
| Any missing, empty, unknown or malformed value | — | — | Safe fallback: no pre-selection, no error message. Only the four exact values above are accepted; the parameter value is never written into the page. |

  - /contatti/ always outputs `canonical = {BASE}/contatti/`.
  - Parameter URLs never appear in the sitemap. Nav and header links point to clean `/contatti/`.
  - Strip or ignore unknown parameters such as utm_ in the canonical.
- **Old URLs:** [MISSING] whether a previous site or domain exists. No live presence was found (A.3 #7). If one exists, a 301 redirect map is required before launch.

### F.5 Language and HTML basics — REQUIRED
- `<html lang="it">`, `<meta charset="utf-8">`, responsive viewport, unique `<title>` and meta description per page.
- No hreflang.
- **Future /en/:** keep Italian at the root. Add /en/ subfolders later with reciprocal hreflang (`it`, `en`, `x-default` → `/`) and self-canonicals per language. Nothing needed now beyond not using root-level slugs that would collide.

### F.6 Open Graph / Twitter — REQUIRED (basic)
Per page:
- `og:title` = page title (brand suffix optional)
- `og:description` = meta description
- `og:url` = canonical
- `og:type` = `website`, or `profile` optional on /chi-siamo/
- `og:site_name` = "Medaglia Consulting"
- `og:locale` = `it_IT`
- `og:image` = 1200×630 brand image, absolute URL [MISSING: depends on logo/design]
- `twitter:card` = `summary_large_image`

Reason: B2B links are often shared on LinkedIn and email, and LinkedIn reads OG tags. No stock handshake images (§5.4).

### F.7 Images — REQUIRED
- **Alt text** in Italian, describing purpose. Example: "Alberto Medaglia, Medaglia Consulting". Empty `alt=""` for decorative images. No keyword stuffing. No text inside images (§11).
- **Filenames:** lowercase, hyphenated, descriptive. Example: `alberto-medaglia.jpg`, `og-medaglia-consulting.jpg`.
- **Logos:** never OVB or other company logos (R9).
- **Delivery:** explicit `width`/`height`, AVIF/WebP with fallback, responsive `srcset`, compressed.
- **Lazy-loading:** `loading="lazy"` only below the fold. The hero/LCP image gets no lazy-load and `fetchpriority="high"`.

### F.8 Performance / Core Web Vitals (static site) — REQUIRED unless marked
- **LCP:** hero is text-first, or uses one optimised image. Self-hosted fonts (APPROVED): WOFF2, at most 2 families or weights subset, `font-display: swap`, preload only the primary font.
- **CLS:**
  - Reserve space for the header and the mobile sticky bar; render the bar with fixed positioning from first paint.
  - Image dimensions set.
  - No late-injected banners. If a cookie banner proves needed, it overlays and does not push content.
- **INP:** minimal JS. Only the dropdown and form need it; no third-party widgets (APPROVED: no chat, maps, pixels).
- **Analytics:** a lightweight cookieless script, loaded `defer`/async.
- **OPTIONAL:** HTTP caching headers for static assets (immutable hashed files).

### F.9 Other technical items
- **404:** REQUIRED. Real 404 status, Italian helpful page with links to Home, Affiancamento and Contatti, plus the CTA.
- **HTTPS everywhere and HSTS:** REQUIRED / OPTIONAL. HTTPS is the host default; enable HSTS once HTTPS is stable on the final domain.
- **Crawlable contact data:** REQUIRED. Phone as `<a href="tel:+39…">`, email as `mailto:`, both visible text.
- **Multilingual:** not applicable — Italian only (D4). See F.5 for the future /en/ structure.
- **Local landing pages:** not applicable — no city or region pages (APPROVED).

---

## G. Regional SEO and Google Business Profile

### G.1 Using "Nord Italia" naturally [RECOMMENDATION]
- **Titles:** Home only. **Metas:** Home and Contatti.
- **Body copy:**
  - Home hero and "Con chi lavoriamo"
  - Contatti "Area servita"
  - footer "Area servita: Nord Italia"
  - at most one natural mention per service page, e.g. "per PMI del Nord Italia" in the intro or CTA; this answers the "Lavorano nella mia zona?" objection
- **Schema:** `areaServed` "Nord Italia" on ProfessionalService and every Service.
- **Never:** region or city names, Bergamo/Brescia/Lecco outside the OVB narrative on /chi-siamo/ (R8), "Lombardia" or similar until confirmed, "vicino a te"-style phrases, location pages.
- **Why sparingly:** "Nord Italia" adds relevance and qualifies the lead. Repeating it does not create local rankings, and with no address there is no local-pack eligibility to optimise for.

### G.2 Google Business Profile — OPTIONAL / later (NICE TO HAVE)
- **Prerequisite:** a real business address that can be verified (PRE-LAUNCH #6). GBP requires verification at an address even for service-area businesses. If there is no client-facing office, set it up as a **service-area business with the address hidden**.
- **Service areas:** GBP accepts specific areas (regions, provinces, cities). Whether "Nord Italia" as a whole is selectable is [NOT VERIFIED]. Realistically, GBP needs the **confirmed regions** (PRE-LAUNCH #11) before setup.
- **Exclusions:** never list Bergamo, Brescia or Lecco just because of OVB history (R8).
- **Category:** choose the most specific available category matching sales/business consultancy, verified in the GBP interface at setup. I am not asserting an exact category name [NOT VERIFIED].
- **NAP:** name "Medaglia Consulting", phone and address (if shown) must match the footer, Contatti and schema exactly. Same phone format everywhere.
- **Content rules:**
  - GBP description: use only VERIFIED positioning text
  - no review solicitation tactics
  - no reviews or rating markup on the site (R9)
- **Website link:** `{BASE}/`, optionally with UTM; the canonical handles it.

### G.3 What changes once regions are confirmed (SCOPE CHANGE — needs approval, §12 item 2)
- `areaServed` → an array of `AdministrativeArea` nodes for the confirmed regions, optionally keeping "Nord Italia".
- The Contatti "Area servita" text and footer may list the regions.
- Optionally one natural mention in the Home "Con chi lavoriamo" section.
- GBP service areas set to the confirmed regions.
- **Still no city or region pages** unless separately approved with real local substance (doorway-page risk).

---

## H. Launch and Search Console checklist

**Pre-launch**
- [ ] Production domain confirmed; apex (non-www) host configured, www → 301; HTTPS active.
- [ ] 301s in place, single hop: http→https, host variant, no-slash→slash, index.html.
- [ ] All `[MISSING]` markers removed from visible content **and from JSON-LD** (launch blocked otherwise, §9).
- [ ] The 8 pages return 200, `index, follow`, self-canonical with absolute URL and trailing slash, no `X-Robots-Tag: noindex`.
- [ ] /grazie/, /privacy-policy/ and /cookie-policy/ have `noindex, follow`, are not in the sitemap and are not blocked by robots.txt.
- [ ] The 404 page returns status 404.
- [ ] `/contatti/?interesse=affiancamento` canonicalises to `/contatti/`.
- [ ] sitemap.xml lists exactly the 8 URLs on the production host; robots.txt matches F.2.
- [ ] Titles and metas match section C (unique, within limits); one H1 per page; H1s unique.
- [ ] No recruiting terms, "consulenza aziendale" target, company names or cities in titles, metas, H1s, schema or anchors. Company names appear only on /chi-siamo/ and only where `show_company:true`.
- [ ] JSON-LD validated (Schema Markup Validator and Rich Results Test). No Review/AggregateRating/price. Address present only if published. No `founder`/`jobTitle` unless confirmed.
- [ ] Second profile absent from HTML output, sitemap and schema.
- [ ] OG tags and a 1200×630 image present; checked with LinkedIn Post Inspector.
- [ ] Mobile check: sticky bar does not cover form fields; tap targets; Lighthouse/PageSpeed run on key templates; LCP image not lazy.
- [ ] Staging still password-protected after launch, or decommissioned.
- [ ] Analytics events form_submit, tel_click and mailto_click firing (§5.5).

**Search Console (at launch; requires DNS access, PRE-LAUNCH #5)**
- [ ] Create a **Domain property** verified by DNS TXT record. This covers http/https and www/non-www in one property. Eva MKT and the client both get access; the client should be owner.
- [ ] Submit the sitemap URL.
- [ ] URL Inspection → Request indexing, priority order:
  1. /
  2. /affiancamento-commerciale/
  3. /sviluppo-reti-commerciali/
  4. /consulenza-commerciale/
  5. /sviluppo-commerciale-operativo/
  6. /formazione-commerciale/
  7. /chi-siamo/
  8. /contatti/
- [ ] OPTIONAL: Bing Webmaster Tools via "import from Search Console". Low effort; also feeds some AI and search assistants.

**First week after launch**
- [ ] Page indexing report: the 8 pages discovered or indexed; no "Duplicate, Google chose different canonical"; /grazie/ shown as "Excluded by noindex" (expected).
- [ ] Sitemap status "Success"; 8 discovered.
- [ ] Brand query "Medaglia Consulting" shows the Home page and the correct site name.
- [ ] No staging URLs indexed (`site:` check on the staging host).

**Weeks 4–12 monitoring**
- [ ] Performance report, filtered to exclude brand queries: track non-brand B2B impressions and clicks per page (§5.5 metric).
- [ ] Use the query data to validate or replace the hypothesis keywords in section B. This is the first real keyword data the project will have.
- [ ] Watch for job-seeker or recruiting queries ("lavoro commerciale", "selezione venditori"). If they grow, strengthen the buyer cues in titles and metas. Do not target them.
- [ ] Check for cannibalisation: the same query ranking two URLs alternately, especially Home vs Operativo on "sviluppo commerciale".

---

## I. Items depending on PRE-LAUNCH information, and proposals (not applied)

### I.1 PRE-LAUNCH or confirmation dependencies for SEO
1. **Domain and DNS access (#5):** canonical host, all canonicals, sitemap and robots URLs, Search Console verification, existence of old URLs to redirect.
2. **Phone, email, hours (#1, #2):** `telephone`, `email`, any future `openingHours`; NAP.
3. **Legal data (#3):** `legalName`, `vatID`, footer.
4. **Address and publication (#6):** schema `address`, GBP feasibility.
5. **Alberto's title (#10):** Person `jobTitle`, Organization `founder`.
6. **Alberto photo:** Person `image`, OG image option.
7. **Logo:** Organization `logo`, OG image.
8. **Regions covered (#11):** `areaServed` refinement, GBP service areas (G.3, scope change).
9. **In person vs remote (#11):** related FAQ and copy; omit until known.
10. **Company-name permissions (#7):** affects /chi-siamo/ body only. No SEO element uses the names either way.
11. **Privacy and cookie texts (#4) and cookie-banner need (#13):** existence of /cookie-policy/; CLS risk from a banner.
12. **LinkedIn URL (OPTIONAL):** `sameAs`.
13. **Resolved at Checkpoint 2:** privacy-policy noindex approved; non-www approved; primary titles approved.

### I.2 Conflicts with the Blueprint
- **None blocking.**
- Heads-up for the director's reconciliation: the copywriter's H1s must carry the terms in section C, and must avoid "affiancamento" in the Operativo and Formazione H1s (cannibalisation rule B.2).
- **Checked at Checkpoint 2:** all copy H1s in COPY-DRAFT.md meet the section C requirements; no Operativo/Formazione H1 contains "affiancamento".

### I.3 Proposals (NOT applied; would need approval)
- **P1 [APPROVED] — "rete vendita" wording.** Competitor SERPs use "rete vendita" heavily. Propose the copywriter uses "rete vendita" naturally in at least one H2 and in the intro of /sviluppo-reti-commerciali/. This does not change the URL; it is a copy request, not a structural change.
- **P2 [REJECTED] — FAQ on /sviluppo-reti-commerciali/.** Common pre-sale questions here ("Lavorate con aziende senza rete vendita?", "Vi occupate di selezione dei venditori?") would answer the "È un'agenzia di selezione?" objection on the page where competitors bundle recruiting. All answers must come from VERIFIED facts: Appendix A §2, and §5 "la ricerca e selezione… complementare, ma non rappresenta il servizio principale". Mentioning selection in a FAQ answer must stay compliant with R7 (no targeting, not in headings).
- **P3 [REJECTED for now] — "consulente commerciale esterno" / "direttore commerciale esterno" / "temporary sales manager".** These may be how some owners describe what Affiancamento or Operativo offer [HYPOTHESIS — RESEARCH REQUIRED]. Propose asking the client whether these descriptions are accurate. Until confirmed, they are not used in any title, H1 or meta.
- **P4 [REJECTED — keep URL parameter] — Hash instead of query parameter for form pre-selection** (`/contatti/#affiancamento`). This would remove duplicate-URL handling entirely. It is OPTIONAL: the approved parameter approach is fine with the canonical rule in F.4.
- **P5 [NOT APPROVED] — Sector landing pages** (e.g. industrial machinery companies) remain NOT APPROVED (§12). Revisit only after Search Console shows sector-modified queries and consented case material exists.

**Sources (web research, all accessed 2026-10-16 via WebSearch; indicative SERP observations only):**
- [Sprint Impresa](https://sprintimpresa.it/consulente-commerciale-sviluppo-rete-di-vendita/)
- [Risolta](https://risolta.it/consulenza-aziendale/marketing-e-vendite/vendite-e-sviluppo-rete-di-vendita/)
- [Union Fort Consulting](https://www.unionfortconsulting.it/servizi-consulenza/consulenza-creazione-rete-di-vendita/)
- [Perform Consulting](https://performconsulting.it/sviluppo-commerciale-e-consulenza-aziendale/creazione-rete-vendita/)
- [Studio Barale](https://www.studiobarale.it/consulenza-vendite.html)
- [A&B Associati](https://www.aebassociati.it/costruzione-reti-vendita)
- [Vivarelli Consulting](https://vivarelliconsulting.com/sviluppo-commerciale/)
- [CCIAA Pavia – reti d'impresa](https://www.pv.camcom.gov.it/files/SPRI/2013-02%20Retimpresa%20-%20Management%20reti%20di%20impresa.pdf)
- [Unioncamere ER – reti d'impresa](https://ucer.camcom.it/api/comunicazione-e-stampa/notizie/pdf/2013_02_14laboratorioretidimpresaemiliaromagna-pdf)
- [Jooble – lavoro commerciale B2B](https://it.jooble.org/lavoro-commerciale-b2b/Stradella-(PV))
- [Jobbydoo](https://www.jobbydoo.it/lavoro-consulenza-aziendale-in-provincia-di-rieti)
- [Emagister – vendita e negoziazione B2B](https://www.emagister.it/corso_di_vendita_e_negoziazione_b2b-ec2531687.htm)
- [Emagister – tecniche di vendita avanzate](https://www.emagister.it/corso_tecniche_di_vendita_avanzate-ec2855752.htm)
- [ilcommercialistaonline](https://www.ilcommercialistaonline.it/?p=61603)
- [pmi.it – Temporary Export Manager](https://www.pmi.it/economia/mercati/news/51384/temporary-export-manager-per-pmi-dellemilia-romagna.html)
- [investireoggi – temporary manager](https://www.investireoggi.it/?p=112732)

**File read (original SEO draft):** /Users/evastoppa/Downloads/MEDAGLIACONSULTING/BLUEPRINT-APPROVED.md. The project folder now contains BLUEPRINT-APPROVED.md, COPY-DRAFT.md and SEO-PLAN.md.

END OF DOCUMENT
