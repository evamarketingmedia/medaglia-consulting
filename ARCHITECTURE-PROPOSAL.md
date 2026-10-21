# ARCHITECTURE-PROPOSAL — Medaglia Consulting Website

**Status:** FINAL ARCHITECTURE — ready for owner commit approval (PHASE 3A)
**Date:** 2026-10-19
**Sources:** BLUEPRINT-APPROVED.md (**BP**), COPY-DRAFT.md (**CD**), SEO-PLAN.md (**SP**), the approved Checkpoint 2 baseline at commit `bb7cdb5`; owner decisions N1–N15, additional amendments 1–8, the final release classifications and the final clarifications FRC-2 (all 2026-10-19; §11.1, §11.4, §20).
**Precedence:** the approved Phase 3A release-classification decisions (2026-10-19) govern the **release-check logic** wherever earlier source-document wording is broader (e.g. COPY-DRAFT line 7, BLUEPRINT §13 "before launch" items). This governs the release-check logic only; it is **not** permission to change approved copy or SEO content. BLUEPRINT-APPROVED.md, COPY-DRAFT.md and SEO-PLAN.md remain unmodified (§11.1).
**Supersedes:** the architect's Phase 3A draft proposal. Where the draft and this document differ, this document applies. Superseded content (Next.js option, JS/CSS budgets, new-tab privacy link, `/grazie/` query parameters, og:image build failure, blanket slot failure) has been removed.
**Scope of this document:** architecture only. Nothing has been created, installed, connected or deployed. This document does not authorise deployment, publishing, DNS/domain changes, purchases, client communications or resolving PRE-LAUNCH items (BP D26).

---

## Legend

| Label | Meaning |
|---|---|
| **[APPROVED]** | APPROVED ARCHITECTURE: approved by the owner (N-decisions / amendments) for implementation. |
| **[DEFERRED]** | DEFERRED DECISION: built only up to a stable boundary; the decision is taken later (see §16). |
| **[PRE-LAUNCH]** | PRE-LAUNCH DEPENDENCY: needs client/owner data or confirmation before go-live (see §11, §17). |
| **[PROHIBITED]** | PROHIBITED WITHOUT FURTHER APPROVAL (see §18). |
| **[AR]** | Requirement taken from an approved document (BP / CD / SP), cited. |

Platform behaviours (Netlify defaults, redirect behaviour, header handling, preview protection) are **not verified**. Anything marked "verify" must be checked before it is relied on.

---

## 1. Stack

| Area | Decision | Label |
|---|---|---|
| Site type | Static HTML output; no CMS, no database; no server runtime | [AR] BP §11 · [APPROVED] N1 |
| Framework | **Astro**, fully static (`output: 'static'`), `trailingSlash: 'always'`, `build.format: 'directory'` (`/page/index.html`, matches SP F.4) | [APPROVED] N1 |
| Language | **TypeScript strict** for content, libraries and client scripts | [APPROVED] N1 |
| Routing | Astro file routing, flat files in `src/pages/`; no `/servizi/` prefix | [AR] BP §6.2 |
| Styling | **Plain CSS**: shared design tokens (`tokens.css`) + base/layout CSS + component/page styles. No Tailwind, Sass, React or component library unless a later requirement creates a concrete need. System font stack until D17. | [APPROVED] N1 |
| Package manager | **npm** with committed `package-lock.json`; exact versions; Node pinned (`.nvmrc` + `engines`) | [APPROVED] N1 |
| Hosting target | **Netlify** is the intended target; architecture and build are Netlify-compatible. No site, deploy, Git integration, env vars, domain or DNS is created or connected. | [APPROVED] N3 · [PROHIBITED] connection |
| Runtime dependency | `astro` only | [APPROVED] |
| Dev dependencies | `typescript`, `@astrojs/check`, `vitest` | [APPROVED] N1, N6 |
| Client JS | Vanilla TS modules, loaded only on the pages that need them; no islands, no framework runtime, no view transitions | [APPROVED] |
| Sitemap / robots | Own endpoints (`sitemap.xml.ts`, `robots.txt.ts`) driven by the route registry; environment-aware robots | [AR] SP F.1–F.3 |
| SEO / form / icon / animation libraries | Not used (own small, typed helpers) | [APPROVED] |
| Images | `astro:assets` once real images exist. None now; no placeholders. | [AR] D17, SP F.7 |
| Fonts | Self-hosted WOFF2, after visual identity is chosen | [AR] BP §11, SP F.8 |
| Tests | **Vitest**, focused on behaviour with meaningful failure risk (see §15). No coverage-percentage targets. | [APPROVED] N6 |

Next.js evaluated and not selected (N1).

### 1.1 Netlify compatibility (future configuration, described only)

`netlify.toml` is **not created** in this phase. Its future content is described here so the build stays compatible:

- **Build:** `npm ci && npm run build`; publish directory `dist`.
- **Contexts:** production = production build + release check (§11.5). Deploy previews / branch deploys = same build with `PUBLIC_SITE_ENV=preview`: noindex everywhere, release check in report-only mode.
- **Redirects:** `/index.html` → `/` and `/*/index.html` → `/:splat/` as 301s. http → https and no-slash → slash expected from host defaults (**verify**). www → apex via host domain settings (**not configured**; [PROHIBITED] until approved).
- **404:** `dist/404.html` served with a real 404 status (**verify**).
- **Headers:** §10.
- **Preview protection:** §10.2 (N5).

---

## 2. Project tree

```
MEDAGLIACONSULTING/                (approved docs stay at root, unchanged)
├─ astro.config.mjs        site=SITE_URL, trailingSlash:'always', build.format:'directory',
│                          build.inlineStylesheets:'never', vite.build.assetsInlineLimit:0
├─ netlify.toml            FUTURE ONLY (§1.1, §10) — not created in 3A
├─ package.json  package-lock.json  .nvmrc  tsconfig.json (strict)  .env.example (non-secret keys only)
├─ public/                 EMPTY until real D17 assets exist (no fake logo/photo/og image). robots/sitemap are generated.
├─ scripts/
│  └─ check-release.mjs    post-build release check over dist/ + content registry (§11.5)
├─ tests/                  vitest (§15): interesse, release checks, structured data/content parity,
│                          missing-data handling, form logic
└─ src/
   ├─ pages/
   │  index.astro  affiancamento-commerciale.astro  consulenza-commerciale.astro
   │  sviluppo-commerciale-operativo.astro  sviluppo-reti-commerciali.astro
   │  formazione-commerciale.astro  chi-siamo.astro  contatti.astro  grazie.astro  404.astro
   │  [legal].astro         -> /privacy-policy/ and (only if the flag is true) /cookie-policy/
   │  sitemap.xml.ts  robots.txt.ts
   ├─ layouts/
   │  BaseLayout.astro      lang="it", SeoHead, skip link, Header, <main id="main">, Footer, StickyBar
   │  ServiceLayout.astro   5 service pages: Breadcrumbs + Hero + <slot/> + CtaBlock + JSON-LD
   ├─ components/
   │  layout/   Header  Footer (incl. legal block)  StickyBar  Breadcrumbs  SeoHead
   │  ui/       Cta  PhoneLink  EmailLink  ExternalLink  ContextLink  Section  Hero  CtaBlock  Fact  FaqList
   │  patterns/ ThreeLevels  MethodSteps  LevelComparison  ExperienceBlock  CapabilityCard
   │  form/     ContactForm  Field  RadioGroup
   ├─ content/
   │  site.ts          brand name, nav, CTA labels, discovery-call note, closing headline, footer line
   │  facts.ts         slots: phone, hours, email, legal data, PEC/REA, address, linkedin, logo, photo, ogImage
   │  registry.ts      pre-launch registry: every item of §11.4 with tier, source, status
   │  routes.ts        RouteKey registry: path, title, meta, robots, sitemap, breadcrumb label, heroCta, interesse
   │  links.ts         CONTEXT_LINKS (CD §A fixed anchors) + internal-links.ts (SP §D required pairs)
   │  capabilities.ts  team.ts  form.ts (options, messages, privacyLabel)
   │  pages/           home.ts affiancamento.ts consulenza.ts operativo.ts reti.ts formazione.ts
   │                   chi-siamo.ts contatti.ts grazie.ts not-found.ts
   │  legal/           privacy-policy.md (+ cookie-policy.md only if required) — client/advisor text only
   ├─ lib/
   │  slots.ts  env.ts
   │  seo/        meta.ts  jsonld.ts  sitemap.ts
   │  form/       interesse.ts  validation.ts  adapter.ts  adapters/mock.ts  submit.ts
   │  analytics/  events.ts  track.ts
   ├─ client/     nav.ts  contact-form.ts  analytics-init.ts  grazie.ts   (entry points, per page)
   └─ styles/     tokens.css  reset.css  base.css  layout.css
```

No real form-provider adapter and no analytics-provider adapter exist in the tree until N2 / N4 are decided.

---

## 3. Route map

All [AR] BP §6.2, SP C.1–C.9, SP F.1, F.4. Trailing slash always. Titles are copied **verbatim from SP** into `routes.ts`; a parity test compares them with SP §C.

| Public URL | Source | Robots | Sitemap | Canonical | Schema | Title (verbatim, SP) |
|---|---|---|---|---|---|---|
| `/` | `index.astro` | index | yes | self | WebSite + ProfessionalService | Sviluppo commerciale PMI Nord Italia \| Medaglia Consulting |
| `/affiancamento-commerciale/` | `affiancamento-commerciale.astro` | index | yes | self | + Service, BreadcrumbList, FAQPage | Affiancamento commerciale per PMI \| Medaglia Consulting |
| `/consulenza-commerciale/` | `consulenza-commerciale.astro` | index | yes | self | + Service, BreadcrumbList, FAQPage | Consulenza commerciale per PMI B2B \| Medaglia Consulting |
| `/sviluppo-commerciale-operativo/` | `sviluppo-commerciale-operativo.astro` | index | yes | self | + Service, BreadcrumbList | Sviluppo commerciale operativo per PMI \| Medaglia Consulting |
| `/sviluppo-reti-commerciali/` | `sviluppo-reti-commerciali.astro` | index | yes | self | + Service, BreadcrumbList | Sviluppo rete commerciale per PMI \| Medaglia Consulting |
| `/formazione-commerciale/` | `formazione-commerciale.astro` | index | yes | self | + Service, BreadcrumbList | Formazione commerciale per venditori \| Medaglia Consulting |
| `/chi-siamo/` | `chi-siamo.astro` | index | yes | self | + Person, BreadcrumbList | Chi siamo: Alberto Medaglia \| Medaglia Consulting |
| `/contatti/` | `contatti.astro` | index | yes | always `/contatti/`, also with `?interesse=` | + BreadcrumbList | Contatti: richiedi un confronto \| Medaglia Consulting |
| `/grazie/` | `grazie.astro` | `noindex, follow` | no | none | none | Richiesta ricevuta \| Medaglia Consulting |
| `/privacy-policy/` | `[legal].astro` | `noindex, follow` (D15) | no | none | none | Privacy policy \| Medaglia Consulting |
| `/cookie-policy/` | `[legal].astro` | `noindex, follow` | no | none | none | Cookie policy \| Medaglia Consulting |
| 404 | `404.astro` → `/404.html` | real 404 status | no | none | none | Pagina non trovata \| Medaglia Consulting |

- `/cookie-policy/` and its footer link exist **only if** the tracking/cookie setup requires it (D16, BP §13 items 4 and 13). Generated only when the registry flag `cookiePolicyRequired` is `true`. [DEFERRED] via N4.
- `/grazie/` is always the clean URL `/grazie/` (amendment 1). The SP page title "Richiesta ricevuta | Medaglia Consulting" is the approved `<title>`; it is distinct from the inline success message (§5.4).
- No other public pages. Parameter URLs never appear in the sitemap. No `/en/` now; root-level Italian slugs leave room for it (SP F.5).
- Meta descriptions are copied verbatim from SP §C. Title ≤ 60 and meta ≤ 160 characters are asserted by a parity test.

---

## 4. Components

Principle: a component exists only if it is reused at least twice or guards a rule. Page-specific sections stay inline in page files, fed by `src/content/pages/*.ts`.

| Component | Responsibility | Notes |
|---|---|---|
| **BaseLayout** | `<html lang="it">`; skip link first; `header` / `main#main` / `footer`; `data-page=<RouteKey>`; loads `nav.ts` and `analytics-init.ts` | Reserves bottom space for the mobile sticky bar. |
| **SeoHead** | title, meta, canonical, robots, OG/Twitter, JSON-LD | From `routes.ts` + `lib/seo`. Non-production: `noindex, nofollow` everywhere (N5). |
| **Header** | Brand (plain text until a real logo exists; U1 IMPORTANT, never invented), nav, header CTA **"Richiedi un confronto"** | **The header CTA is visible on ALL screen sizes** (BP §5.1 "Always visible in the header"; N9). Nav: "Come collaboriamo" is a disclosure `<button aria-expanded aria-controls>` with real links (Affiancamento first/emphasised, Consulenza, Operativo), then Reti commerciali, Formazione, Chi siamo, Contatti (CD §B). Non-sticky header. |
| **Nav behaviour** (`nav.ts`) | Disclosure pattern (not ARIA menu). Esc closes and returns focus. Toggles `aria-expanded`. | No-JS baseline: all links visible. The open mobile menu ends with the "Richiedi un confronto" button (CD §B). |
| **StickyBar** | Fixed bottom bar, **<768 px only**: "Chiama" (`aria-label="Chiama Medaglia Consulting"`) + "Richiedi un confronto" (`aria-label="Richiedi un confronto: vai al modulo di contatto"`) | [AR] CD §B, BP §7.10. Must not cover form fields or focused controls: body bottom padding + `scroll-padding-bottom` + `scroll-margin-bottom`. **N9:** coexists with the header CTA; frontend-design must keep the two from creating excessive visual duplication or obstructing content. |
| **Footer** | Positioning line, area served, contacts, link column, legal block, legal links, © | Legal block per CD §B / D25. Address only if publication confirmed: text + "Apri in Google Maps" `ExternalLink`, no embed. LinkedIn omitted unless provided (OPTIONAL). |
| **Breadcrumbs** | `Home › label`, `nav aria-label`, `aria-current="page"` | Labels from `routes.ts`, same source as BreadcrumbList (CD §B). Not on Home; omitted on Grazie. |
| **Cta** | The one primary link-button "Richiedi un confronto" | Props `interesse?: InteresseKey` (4 values only), `placement`. Builds `/contatti/` or `/contatti/?interesse=x`. Label hard-coded in `site.ts`. |
| **PhoneLink** | `tel:` from the phone slot | Value: `<a href="tel:+39…">`. Missing (preview): visible non-link `[MISSING: numero di telefono]` marker, no dead `tel:`. Missing (production): release check fails (§11). "Chiama" button <768 px; desktop text "Oppure chiama il {phone}" ≥768 px (CD §A). |
| **EmailLink** | `mailto:` from the email slot, label "Scrivici" | Same slot logic. |
| **ExternalLink** | `target="_blank" rel="noopener noreferrer"` | Only for LinkedIn (optional) and the Maps link. **Not** used for the privacy link (N10). |
| **ContextLink** | Renders fixed anchor text from `CONTEXT_LINKS` | Enforces CD §A "always the same text". |
| **Hero** | Eyebrow, H1, body, optional CTA | Only H1 emitter. CTA on Home + 5 service pages; none on Chi siamo, Contatti, Grazie, 404 hero (CD §A). |
| **CtaBlock** | H2 "Parliamo dello sviluppo commerciale della tua azienda." + discovery-call note + Cta + phone | Not used on Contatti or Grazie. 404 has its own CTA (CD §9b). |
| **Section** | `<section aria-labelledby>`, `weight: 'main' \| 'compact'` | Visual weighting only; heading levels and order stay exactly as CD (§12). |
| **ThreeLevels** | Home level cards; Affiancamento badge "Il percorso più completo" | Home only. |
| **MethodSteps** | 4-step method, `compact` prop | Home + Affiancamento, same data. |
| **LevelComparison** | 3×3 comparison (CD Affiancamento) | **Single DOM** responsive cards, each a `<dl>`; desktop grid with aligned rows and highlighted middle column; no `<table>`, no hidden duplicate. [APPROVED] N13 |
| **FaqList** | Visible FAQ (H3 + answer, not collapsed) | Same array feeds FAQPage JSON-LD. Items with `published:false` (cost FAQ, D18/C6) never rendered or in schema. |
| **ExperienceBlock** | H2 + capability one-liners + fixed link "Leggi il percorso di Alberto Medaglia" | Capability labels only; never company names. |
| **CapabilityCard** | Chi siamo capability: title, sector-first lead (name or fallback), activities, Settore, optional Azienda, "Come si traduce oggi nel nostro lavoro" + link | §11.3. Primary activities [DEFERRED] N8. Company names hidden while `show_company:false` (U2); capability 1 OVB figures rendered only when `figuresConfirmed:true` (R13). |
| **ContactForm / Field / RadioGroup** | §5 | One form site-wide (D21). |
| **Fact** | Renders a slot: value / preview marker / production safe fallback (IMPORTANT and OPTIONAL items) / nothing for `omitted` | Single place where `[MISSING: …]` text is produced; never produces a marker in a production build (§11.1). |

**Avoided on purpose:** generic Card/Grid/Icon/Button kit; one component per section; a mobile twin of the comparison.

---

## 5. Form and lead flow

### 5.1 Status

- **[APPROVED]** One form, on `/contatti/` only (D21), built behind a small **provider adapter boundary**.
- **[DEFERRED] N2:** no form provider is chosen or connected. Only **dev/test mock adapters** exist.
- **[PROHIBITED]** Production form submission and connecting any provider (§18).
- **N12 (accepted):** client-side validation is for usability, not security. Real submission validation and abuse protection must come from the selected form service. **The form must not be represented as production-ready until a provider is selected and tested.**
- A production release **fails while no real provider is configured** (mock or none) — see §11.

### 5.2 Fields [AR] BP §5.3, CD §E

| Field (visible label) | `name` | Control | Required | autocomplete |
|---|---|---|---|---|
| Nome e cognome * | `nome` | text | yes | `name` |
| Azienda * | `azienda` | text | yes | `organization` |
| Ruolo * (placeholder "Es. titolare, direttore commerciale") | `ruolo` | text | yes | `organization-title` |
| Telefono * (helper "Ti chiameremo a questo numero.") | `telefono` | `type=tel` | yes | `tel` |
| Email * (placeholder "nome@azienda.it") | `email` | `type=email` | yes | `email` |
| Privacy checkbox * | `privacy` | checkbox, **not pre-ticked** | yes | — |
| La situazione della tua azienda (facoltativo) | `situazione` | radios: Ha già una rete commerciale / Vuole costruirla / Altro | no | — |
| Interesse (facoltativo) | `interesse` | radios in order: Affiancamento continuativo / Consulenza mirata / Sviluppo commerciale operativo / Formazione / Non so ancora; **no Reti option**; helper: Non sei sicuro? Scegli "Non so ancora": ne parliamo durante la telefonata. | no | — |
| Quando preferisci ricevere la chiamata? (facoltativo) | `orario` | radios Mattina / Pomeriggio; no scheduling | no | — |
| Messaggio (facoltativo) | `messaggio` | textarea, placeholder from CD §E | no | — |
| Origin (hidden) | `origine` | set by JS (§5.6) | — | — |
| Honeypot | configurable name | §5.5 | — | — |

- Form heading "Richiedi un confronto"; legend "I campi con * sono obbligatori."; line under the form "Il modulo è dedicato alle richieste delle aziende."; submit button "Richiedi un confronto"; sending state "Invio in corso…" (CD §E, CD §C8).
- Radio `value` = readable label, so a lead is legible.
- **Privacy checkbox wording is PRE-LAUNCH** (BP §13 item 15, CD §E). The current CD label "Ho letto l'informativa sulla privacy." is stored as `privacyLabel` with a registry entry; no legal wording is written.
- **Privacy link (N10):** opens in the **same tab**. No forced new tab and no additional visually-hidden new-tab notice. Because the form is on the same page, possibly losing typed values when the visitor follows the link is an **accepted trade-off**.

### 5.3 `?interesse=` parsing [AR] BP §5.3, CD §E, SP F.4

```ts
const INTERESSE = { affiancamento: 'int-affiancamento', consulenza: 'int-consulenza',
                    operativo: 'int-operativo', formazione: 'int-formazione' } as const;
export function parseInteresse(search: string): InteresseKey | null {
  const all = new URLSearchParams(search).getAll('interesse');
  if (all.length !== 1) return null;                              // missing or duplicated
  return Object.hasOwn(INTERESSE, all[0]) ? (all[0] as InteresseKey) : null; // exact, case-sensitive
}
```

- Only the four exact values are accepted. Anything else (empty, unknown, different case, whitespace, `__proto__`, duplicates, long or unicode input) returns `null`: **safe fallback — no pre-selection, no error message**.
- The radio to check is looked up from the fixed table; the parameter value is **never written into the page**.
- "Non so ancora" has no parameter value. Home, Reti, Chi siamo, header, sticky bar, footer and direct visits use clean `/contatti/`.
- Without JS: no pre-selection (graceful degradation).

### 5.4 Submit, success, failure

| State | Behaviour |
|---|---|
| Submitting | Button disabled; `aria-live="polite"` status "Invio in corso…"; timeout via `AbortController`; double-submit guard. |
| Success | Navigate to the clean URL **`/grazie/`** (no query parameters). If navigation fails, show the inline fallback **verbatim (CD §E): "Richiesta inviata. Ti ricontatteremo per la telefonata conoscitiva."** in a live region. |
| Failure | `role="alert"` message verbatim from CD §E: "Non siamo riusciti a inviare la richiesta. Riprova tra qualche minuto, oppure chiamaci al [phone] o scrivi a [email]." (phone/email via PhoneLink/EmailLink, `placement=form-failure`). **All entered values are preserved**; the form is never reset or re-rendered; retry possible. |
| Honeypot filled | Nothing is sent; inline success text shown; no navigation; no analytics event. |

Until N2 is decided, these states are exercised only through the mock adapters (`mock-success`, `mock-failure`, `mock-timeout`) in dev and tests.

### 5.5 Validation and errors (usability only — N12)

- Native `required` attributes for the no-JS path; JS sets `novalidate` and takes over.
- Rules: required fields non-empty after trim; basic email shape; phone permissive (digits after removing spaces, `.`, `-`, `()`, optional `+`/`00`; 6–15 digits); privacy checked.
- Messages verbatim from CD §E:

| Where | Message |
|---|---|
| Summary (focus moves here) | Controlla i campi evidenziati. |
| Nome e cognome | Inserisci nome e cognome. |
| Azienda | Inserisci il nome dell'azienda. |
| Ruolo | Indica il tuo ruolo in azienda. |
| Telefono (empty) | Inserisci un numero di telefono. |
| Telefono (invalid) | Il numero non sembra corretto: controlla le cifre. |
| Email (empty) | Inserisci un indirizzo email. |
| Email (invalid) | L'indirizzo email non sembra corretto (es. nome@azienda.it). |
| Privacy | Per inviare la richiesta, conferma di aver letto l'informativa sulla privacy. |

- Accessible wiring: summary `tabindex="-1"` + links to invalid fields; per-field message with `id`; `aria-invalid="true"`; `aria-describedby` = helper + error; errors clear on correction.
- **Honeypot [AR] CD §E / BP §5.3:** off-screen wrapper with `aria-hidden="true"` on the wrapper (not the input); input `tabindex="-1"`, `autocomplete="off"`; label "Lascia vuoto questo campo"; hidden by off-screen positioning, not `display:none`. No CAPTCHA unless spam appears.

### 5.6 Origin and service context (amendment 1)

- Context is captured **on `/contatti/` before submission** and travels **with the submission**:
  - hidden `origine` = same-origin `document.referrer` pathname if it matches an allow-listed `RouteKey` path; otherwise `diretto` or `esterno`. Never echoed in the DOM;
  - the selected **Interesse** radio value.
- No origin or interesse parameter is ever added to `/grazie/`. Referrer is imperfect; no extra URL parameters are added (D21).
- The hidden `origine` field and its use must be disclosed to the privacy-text author.

### 5.7 Provider adapter boundary [DEFERRED] N2

- `lib/form/adapter.ts` defines a small interface, e.g. `{ id, buildRequest(form): Request, isSuccess(res): boolean }`. Selection through a non-secret public setting (e.g. `PUBLIC_FORM_PROVIDER`).
- **Only mock adapters exist now** (`adapters/mock.ts`). The release check fails a production build whose provider is unset or a mock.
- Netlify-specific attributes, if Netlify Forms is ever chosen, stay inside its adapter branch; nothing else changes.
- The lead-recipient email (BP §13 item 2) must never appear in HTML or client JS; it lives only in the provider's configuration.

**Provider options — background, for the future decision (N2, N11). Not a selection.**

| Option | Pros | Cons / checks |
|---|---|---|
| Netlify Forms | No extra vendor on Netlify; built-in honeypot attribute; notification email set outside the code | Host-coupled. Submissions stored in the host dashboard, which sits uneasily with BP §11 "No database" and raises storage/privacy questions (**N11, deferred**). Limits and spam options: verify. |
| Third-party form endpoint | Host-independent; email delivery handled | Another data processor to name in the privacy text; CSP `connect-src` / `form-action` must allow it; behaviour differs per vendor. |
| Own function + transactional email | Full server-side validation, rate limiting | Adds a server runtime and secrets; departs from the static-only direction. |

---

## 6. SEO

| Item | Rule | Label |
|---|---|---|
| Title / meta | From `routes.ts`, verbatim SP C.1–C.9 | [AR] SP §C |
| Canonical | `SITE_URL` + path, absolute, trailing slash; self on the 8 indexable pages; none on noindex pages; `/contatti/` always `/contatti/`; unknown parameters (e.g. utm_) ignored | [AR] SP F.4 |
| Canonical host | Non-www apex (D15). `SITE_URL` is a required item (§11); production fails if missing, not https, `www.` or ends with a slash | [AR] |
| Redirects | http→https, host variant→apex, `/page`→`/page/`, `index.html` forms → slash form, single-hop 301 (future config, §1.1) | [AR] SP F.4 |
| Robots meta | `noindex, follow` on /grazie/, /privacy-policy/, /cookie-policy/; everything `noindex, nofollow` outside production | [AR] SP C.9, F.3 · [APPROVED] N5 |
| Language | `<html lang="it">`, `og:locale it_IT`, no hreflang | [AR] SP F.5 |
| Open Graph / Twitter | `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `twitter:card` | [AR] SP F.6 |
| **og:image (N7)** | **While missing, the `og:image` tag is omitted.** No fake or generated social image. `twitter:card` falls back to `summary` until a real image exists, then `summary_large_image` (SP F.6). Missing og:image is **PRE-LAUNCH IMPORTANT**: release-check warning, **not** a production blocker. | [APPROVED] N7 |
| robots.txt | Production: `User-agent: *`, `Allow: /`, `Sitemap: {SITE_URL}/sitemap.xml`; never disallow noindex pages; non-production robots environment-specific, never deployed to production | [AR] SP F.2, F.3 |
| Sitemap | Exactly the 8 URLs, absolute, slash; no `priority`/`changefreq`; `lastmod` only with real dates; release check asserts count = 8 | [AR] SP F.1 |
| 404 | Real 404 status; CD §9b copy and links | [AR] SP F.9 |

### 6.1 JSON-LD (`lib/seo/jsonld.ts`)

One `@graph` per page, built by pure functions from the same content modules that render the page.

| Node | Rule |
|---|---|
| WebSite + ProfessionalService (every indexable page) | SP E.1. Properties whose item is not resolved to a value are **pruned**: `legalName`, `logo`, `image`, `telephone`, `email`, `vatID`, `address`, `sameAs`. No `openingHours` (SP E.1). `areaServed` "Nord Italia". `employee` → Alberto `@id`. **No `founder`** until Alberto's title is confirmed as founder (amendment 7). |
| Service (5 pages) | SP E.3; descriptions derived strictly from visible copy (D23). No offers/price/rating/review. |
| BreadcrumbList | Same labels as visible breadcrumbs (parity test). |
| FAQPage (Affiancamento, Consulenza) | The rendered `faq[]`; unpublished items excluded. |
| Person (/chi-siamo/) | SP E.2. **No `jobTitle`** until the title is confirmed (amendment 7). `image` only when the real photo exists. No `alumniOf`, no past employers. Second profile never emitted. |

- The serializer throws if any string contains `[`, `MISSING`, `{BASE}` or `.invalid`.
- No Review / AggregateRating (BP §9 rule R9).

### 6.2 Internal-link enforcement [AR] SP §D, CD §A

- Content references route keys, never raw paths; `Cta` and `ContextLink` fix anchors and paths; `interesse` typed to the 4 values.
- `internal-links.ts` encodes SP §D required from→to pairs.
- Release check (output): every page links to `/affiancamento-commerciale/`; required pairs present; every internal `href` resolves to a known route and ends with `/`; `?interesse=` only with the 4 allowed values and only on the matching service-page CTAs; Experience blocks link to /chi-siamo/; no "clicca qui"; no company names in anchors.

---

## 7. Analytics

**[AR]** Cookieless analytics with `form_submit` (success only, never on click), `tel_click`, `mailto_click` (BP §5.5, §11; CD §E developer notes).
**[DEFERRED] N4:** only the **internal event abstraction** is built. It **sends no data and loads no provider** until the privacy/cookie decision is made. **[PROHIBITED]** installing analytics or loading any provider.
**Release tier (2026-10-19):** analytics active at launch is **U8, PRE-LAUNCH IMPORTANT**. The site may launch without analytics (production WARNING, not a blocker); no provider may be loaded until the privacy/cookie decision (N4, R9, R10) is resolved.

| Piece | Design |
|---|---|
| `lib/analytics/events.ts` | Event names `form_submit \| tel_click \| mailto_click \| cta_click` and allow-listed properties: `page` (RouteKey), `placement`, `interesse` (key or `none`), `origin` (RouteKey / `diretto` / `esterno`). No phone, email, hrefs or form values. |
| `track.ts` | `track(name, props)` dispatches an in-page `CustomEvent`. Zero network. Errors caught; dev-only logging. |
| `analytics-init.ts` | The single future gate. No provider configured → no adapter, no script, no network. A future provider = one adapter file + CSP update + consent handling if required, after N4. |
| `tel_click` / `mailto_click` | One delegated listener on `a[href^="tel:"], a[href^="mailto:"]`; placement from `data-placement`; covers header, sticky bar, hero, CTA blocks, footer, Contatti, Grazie and the form-failure message. |
| `form_submit` | Dispatched internally only on `/grazie/` load after a successful submission (CD §E), not on button click; a direct visit (no same-origin `/contatti/` referrer) does not dispatch. |
| `cta_click` | **Inactive** within the abstraction ([APPROVED] N14): defined for "Richiedi un confronto" clicks with `placement` and target `interesse`; dispatches nothing outward. |

### 7.1 Context hand-off to `/grazie/` (amendment 1) — [DEFERRED], depends on N4

- `/grazie/` stays the clean URL; no query parameters are ever added to it.
- **Future option, only after N4 (provider + privacy decision):** on successful submission, write the allow-listed `origin` and `interesse` keys to **short-lived, same-tab `sessionStorage`**; `/grazie/` reads, validates against the allow-lists, attaches them to `form_submit`, then deletes the entry immediately.
- **No storage of any kind is implemented before that decision.** Until then `form_submit` carries no origin/interesse properties (the data still reaches the lead via the hidden `origine` field and the Interesse value, §5.6).
- Known gaps (accepted): a reload of `/grazie/` with a `/contatti/` referrer may re-dispatch; a failed redirect (inline success only) does not dispatch; no-JS submissions have no properties. Redirect-referrer behaviour must be verified once a provider exists.

---

## 8. Performance

- **Minimise client-side JavaScript and ship only what each page requires. Measure the actual output during the performance review.** (amendment 2 — no fixed KB budgets; no budget assertion in the release check.)
- Everything renders at build. Client modules: `nav.ts` and `analytics-init.ts` (layout), `contact-form.ts` (Contatti only), `grazie.ts` (Grazie only).
- **Fonts [AR] SP F.8:** system stack now; later self-hosted WOFF2, at most 2 files, subset, `font-display: swap`, preload only the primary.
- **Images [AR] SP F.7:** none yet. Later via `astro:assets`: explicit width/height, AVIF/WebP, `srcset`; LCP image eager with `fetchpriority="high"`; others lazy below the fold; Italian alt; no text in images.
- **CWV [AR] SP F.8:** text-first hero (LCP); sticky bar fixed from first paint with reserved space (CLS); no late-injected banners — a cookie banner, if ever needed, overlays; minimal JS (INP); hashed assets cacheable as immutable (SP F.8 OPTIONAL).

---

## 9. Accessibility

[AR] BP §11 (semantic headings, one H1, labelled fields with visible errors, AA contrast, visible focus, keyboard dropdown, tap targets ≥ 44 px, alt text, no text in images), WCAG 2.2 AA-oriented.

- **Semantics:** one H1 per page; no skipped heading levels; `header`/`nav`/`main`/`footer`; labelled breadcrumb `nav`; skip link first and visible on focus.
- **Navigation:** disclosure button; Esc closes; real links; no focus trap; header not sticky.
- **Focus:** `:focus-visible` always visible, ≥ 3:1. The sticky bar never hides focused controls (WCAG 2.4.11); the header CTA and sticky bar must not obstruct content (N9).
- **Forms:** visible labels; `autocomplete` tokens; errors via `aria-describedby`; focused error summary; values retained after failure; honeypot hidden from assistive technology.
- **Accessible names:** sticky-bar names start with the visible label (WCAG 2.5.3), wording from CD §B.
- **Contrast:** verified once colour tokens exist (after D17).
- **Motion:** `prefers-reduced-motion` respected; no animation needed at launch.
- **Alt text:** per SP F.7; decorative `alt=""`.

---

## 10. Security and headers

### 10.1 Strategy (amendment 3)

**Restrictive by default.** A strict production CSP is **not finalised** until the actual form provider, analytics setup, fonts and other external resources are known (N2, N4, D17). The CSP below is a **draft baseline — NOT FINAL**.

```
# DRAFT BASELINE — NOT FINAL (future netlify.toml headers; not created)
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none';
  frame-ancestors 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

- `connect-src` / `form-action` will need the chosen form provider's origin (N2); any analytics provider needs its own entries (N4).
- HSTS only once HTTPS is stable on the final domain (SP F.9).
- To keep a strict CSP possible: Astro config avoids inlined scripts/styles (`inlineStylesheets:'never'`, `assetsInlineLimit:0`); no `style=` attributes; `application/ld+json` is a data block. The release check reports inline scripts/styles. Verify at first build.

### 10.2 Preview protection (N5)

- **[APPROVED]** Preview builds are `noindex` (robots meta `noindex, nofollow` on every page, non-production robots.txt; `X-Robots-Tag: noindex, nofollow` header as secondary control, SP F.3).
- **[APPROVED]** Design for preview **protection** too (password/authentication, SP F.3). **The actual Netlify protection mechanism and its plan availability must be verified before it is relied on.** `Disallow: /` is never the only protection and never reaches production.
- Before launch: confirm production sends no `noindex` / `X-Robots-Tag` on the 8 pages (SP F.3).

### 10.3 Other rules

| Area | Rule |
|---|---|
| Form abuse | Honeypot + provider-side spam filtering and validation (N12). No CAPTCHA unless spam appears (BP §5.3). |
| DOM safety | No `innerHTML` with dynamic data; `textContent` only. Query parameters never echoed. |
| Secrets / env | No secrets in the repo or client. Public settings only (`SITE_URL`, `PUBLIC_SITE_ENV`, `PUBLIC_FORM_PROVIDER`, any non-secret form ID). `.env` git-ignored. Production env vars are [PROHIBITED] until approved. |
| Links | `rel="noopener noreferrer"` on all `target="_blank"` links (ExternalLink). |
| Data exposure | No lead-recipient email in HTML/JS; no personal data in analytics properties. |
| Third parties | None. Maps = link only; no chat, pixels, font CDNs or embeds (BP §11, SP F.8). |
| Dependencies | 1 runtime + 3 dev dependencies; committed lockfile; `npm ci`; `npm audit` before any release. |

---

## 11. Content model and missing-data tiers

**Choice:** typed local TS content files (`src/content/**`), not copy-in-components, not CMS. Copy is final and structured; typed data enables the parity, allow-list and missing-data rules. Markdown only for client-supplied legal text.

### 11.1 Tiers and general release rule (amendment 4; final release classifications 2026-10-19)

**General release rule (owner decision, 2026-10-19):**

- **Only PRE-LAUNCH REQUIRED items may block a production release.**
- A missing item is REQUIRED only when there is **no safe launch fallback**, or when it is **legally or technically necessary** for the production site.
- PRE-LAUNCH IMPORTANT → a visible release **WARNING**; never fails the build by itself.
- OPTIONAL → **informational only**; never fails, never a blocking condition.
- UNCLASSIFIED → the warning **"UNCLASSIFIED — OWNER REVIEW REQUIRED"**; never an automatic failure. (The former "unclassified → fail" rule is removed.)
- The release check **prints every unresolved item with its classification** and **never silently passes an unresolved REQUIRED item**.

| Tier | Meaning | Preview build | Production build output | Production release check |
|---|---|---|---|---|
| **PRE-LAUNCH REQUIRED** | No safe launch fallback, or legally/technically necessary | Visible `[MISSING: …]` marker where the copy shows one; listed in report | — (release fails before it can ship) | **FAIL** while unresolved |
| **PRE-LAUNCH IMPORTANT** | Should be resolved before launch; an approved safe fallback exists | `[MISSING …]` marker may be shown; listed in report | Approved safe fallback rendered; **no marker** | **WARNING** (visible), does not block |
| **OPTIONAL** | Not required for launch (BP §14 and owner classifications) | `[MISSING …]` marker may be shown, or default rendering; listed in report | Approved safe fallback / default rendered; **no marker** | **INFO**, never blocks |
| **UNCLASSIFIED** | Any future item not yet given a tier by the owner (none at 2026-10-19) | Approved default/fallback rendered; listed in report | Approved default/fallback rendered; no marker | **WARNING "UNCLASSIFIED — OWNER REVIEW REQUIRED"**, never an automatic failure |

**Rendering rule for items with a safe fallback:** for IMPORTANT and OPTIONAL items, preview builds may show the `[MISSING …]` marker so reviewers see the gap. A **production build renders the approved safe fallback instead**, so no marker reaches production output. The output-layer marker scan (§11.5) therefore **stays a FAIL in production**: a leaked marker is a defect, not a tier outcome.

**Implementation-integrity failures (owner-approved 2026-10-19).** Two production failures are kept, both in the output layer (§11.5):
- (a) unconfirmed OVB figures rendered while `figuresConfirmed:false` → **FAIL**;
- (b) Alberto's photo missing, but an image, fake photo or placeholder image/box rendered as if it were his photo → **FAIL**.

They fail because the **approved fallback was not applied** (an implementation defect), not because the item is missing. They **do not change the IMPORTANT classification of R13 or R14**: an unresolved R13 or R14 whose fallback is correctly applied remains a production WARNING and never blocks release.

**Precedence (owner decision, 2026-10-19).** Later approved Phase 3A release-classification decisions (2026-10-19, FRC and FRC-2, §20) **govern the release-check logic** wherever earlier source-document wording is broader. Examples:
- COPY-DRAFT line 7 ("Launch is blocked while any [MISSING] remains in visible copy"): for the items classified IMPORTANT or OPTIONAL on 2026-10-19 (U1–U8, R2 with R15 merged, R13, R14, R20) an unresolved item does not block launch, provided its safe fallback (not the marker) is what production renders.
- BLUEPRINT §13 "before launch" items: they remain pre-launch work to resolve, but only the items classified REQUIRED here can fail a production release.

This precedence governs **the release-check logic only**. It is **not** permission to change approved copy or SEO content. BLUEPRINT-APPROVED.md, COPY-DRAFT.md and SEO-PLAN.md **remain unmodified**; syncing them is a separate owner decision. For REQUIRED items, CD line 7 continues to apply unchanged.

### 11.2 Slot and registry model (`lib/slots.ts`, `content/registry.ts`)

```ts
type Tier = 'required' | 'important' | 'optional' | 'unclassified';
type Slot<T> =
  | { state: 'value'; value: T }
  | { state: 'missing'; label: string }            // CD marker label, verbatim
  | { state: 'omitted'; reason: string };          // documented owner/client decision
type Fallback =
  | { kind: 'omit' }                               // render nothing (no element, no placeholder)
  | { kind: 'approved'; ref: string };             // approved wording/flag, cited (CD/BP/owner decision)
type Item<T> = { id: string; source: string; tier: Tier; omitAllowed: boolean; slot: Slot<T>;
                 fallback?: Fallback };            // required for 'important' and 'optional'
```

- `omitted` is accepted only where `omitAllowed` is true (PEC/REA "se applicabile", address "solo se il cliente ne conferma la pubblicazione", OPTIONAL items) and always needs a stated reason.
- Items without a text slot (confirmations) use `slot` with `value` = a reference to the documented confirmation.
- Status changes only on documented client/owner confirmation; never resolved by the build team (D26).
- **Fallback rendering (2026-10-19):** every IMPORTANT and OPTIONAL item carries an approved `fallback`. In preview, a `missing` slot may render its `[MISSING …]` marker; in production, `Fact` (and the components that read these items) render the `fallback` instead, so production output never shows a marker for them. A fallback is only ever approved wording or omission; the build team never writes substitute copy. If omitting a value leaves an approved sentence grammatically or semantically incomplete (R13, Q1 rule), the item is flagged for owner review and the release check reports the flag (WARNING); no copy is invented.
- The release check reads the tier from the registry; REQUIRED items have no fallback and keep the preview marker / production FAIL behaviour.

### 11.3 Capabilities, team, FAQ, review flags

- **Capabilities [AR] BP §11, CD §D:** `{id, title, leadName, leadFallback, activities:[{text, primary?, figure?}], sector, company, show_company:false, mapped_service_url, translation, links}`; capability 1 additionally has `figuresConfirmed:false`. With `show_company:false` the fallback lead (bracket removed, nothing else changed) renders and "Azienda:" is hidden (U2 fallback until permission is confirmed). Each company toggles independently; names only on /chi-siamo/ (BP §9 rule R2).
- **OVB figures toggle (R13; Q1 resolved 2026-10-19):** with `figuresConfirmed:false` the unconfirmed figures ("tre uffici commerciali", "circa 70 collaboratori") are **not rendered**; only verified professional experience remains. Rule: **no new fallback marketing copy** is created to replace the figures; only **already-approved wording that remains accurate when the figures are omitted** is used (an approved activity line that depends on a figure is dropped). If removing the figures makes an approved sentence grammatically or semantically incomplete during implementation, it is **flagged for owner review**; copy is never invented. This does not block Phase 3B. Rendering the figures while `figuresConfirmed:false` is an implementation-integrity failure (§11.1, §11.5), not a tier change.
- **"Senior Manager" (Q2 resolved 2026-10-19):** client-provided professional-history information (explicitly supplied in the client material, BP Appendix B / CD §D) and may be represented in the content model (capability 1 lead, as in the approved CD §D wording). It is not a figure and is not governed by `figuresConfirmed`. Publication of the detailed OVB experience stays subject to the existing pre-launch confirmation rules (R13 / BP §13.8). This does not block Phase 3B.
- **Metal System / Euromec (U3):** only the approved neutral wording renders; no current client status, timing or relationship is implied beyond verified facts.
- **Progressive disclosure:** all activities stay in the HTML; non-primary ones may sit in `<details>`. Which 3–4 are primary is [DEFERRED] N8: chosen during the visual/content pass, from approved activities only, without changing their meaning. Until then all activities show.
- **Team:** Alberto `published:true`; second profile `published:false` with no data, never in HTML, sitemap or schema.
- **Alberto (amendment 7):** until the title is confirmed, render **name only** (CD §C7); no `jobTitle`, no `founder`.
- **FAQ:** `{q, a, published}`; Affiancamento cost FAQ `published:false` (D18/C6; U7 OPTIONAL) until the client provides an approved answer.
- **Review flags:** Home H1 `{text, review:'client'}` and goal sentence `{text, review:'copy'}` keep the current approved text (CD §G8) and are registry items.
- **Design notes** (`[DESIGN …]`, "Phase 3 design note") are implemented in layout (§12), never in output.

### 11.4 Classification table — item → tier → file/component → check behaviour

Final classifications recorded by the owner on 2026-10-19 (FRC and FRC-2, §20). Item IDs are kept stable (R2, R13, R14, R15 and R20 keep their IDs after moving out of the REQUIRED table; R15 is merged with R2; U1–U8 keep theirs), so references stay traceable; no renumbering.

#### 11.4.1 PRE-LAUNCH REQUIRED (only tier that can block a production release) — 15 items

R1, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R16, R17, R18, R19. (R2, R13, R14, R15 → IMPORTANT; R20 → OPTIONAL.)

| # | Item | Source | File / component | Check behaviour |
|---|---|---|---|---|
| R1 | Phone number | BP §13.1; CD §B, §A (visible `[MISSING]`) | `facts.ts` phone → PhoneLink, StickyBar, Hero, CtaBlock, Footer, Contatti, Grazie, form failure, schema `telephone` | Preview marker; production FAIL |
| R3 | Contact hours (orari) | BP §13.1; CD §B, §C8 (visible `[MISSING]`) | `facts.ts` hours → Footer, Contatti | Preview marker; production FAIL |
| R4 | Email receiving form requests | BP §13.2 | provider configuration (never in code); `registry.ts` | Production FAIL while open |
| R5 | Publishable email | BP §13.2; CD §B, §C8, §E (visible `[MISSING]`) | `facts.ts` email → EmailLink, Footer, Contatti, form failure, schema `email` | Preview marker; production FAIL |
| R6 | Ragione sociale, P.IVA, sede legale | BP §13.3; CD §B (visible `[MISSING]`) | `facts.ts` legal → Footer legal block, ©, schema `legalName`/`vatID` | Preview marker; production FAIL |
| R7 | PEC, REA ("se applicabile") | BP §13.3; CD §B | `facts.ts` → Footer | Value **or** `omitted` with reason ("non applicabile", confirmed). Production FAIL only while `missing`. |
| R8 | Privacy policy text | BP §13.4 | `content/legal/privacy-policy.md` → `/privacy-policy/` | Production FAIL while missing |
| R9 | Cookie policy: whether needed, and text if needed | BP §13.4, D16 | `registry.ts.cookiePolicyRequired`; `legal/cookie-policy.md`; Footer link; `[legal].astro` | FAIL while the flag is undecided; if `true`, FAIL while text missing |
| R10 | Whether cookieless analytics removes the need for a cookie banner | BP §13.13 | `registry.ts` → analytics gate, R9 | Production FAIL while open (linked to N4) |
| R11 | Domain / DNS access / business email | BP §13.5; SP F.4, I.1 | `SITE_URL` env (canonicals, sitemap, robots, schema); `registry.ts` for DNS and business email | FAIL if `SITE_URL` missing/invalid; FAIL while registry entries open |
| R12 | Office address and whether to publish it | BP §13.6; CD §B | `facts.ts` address → Footer, Maps link, schema `address` | Value **or** `omitted` with reason (client declined publication). FAIL only while `missing`. |
| R16 | Operativo service boundaries | BP §13.14, D22 ("REQUIRED"); CD §C4, §G11 | `registry.ts`; Operativo content; SP C.4 meta re-check | Production FAIL while open |
| R17 | Privacy checkbox wording | BP §13.15; CD §E | `form.ts.privacyLabel` + `registry.ts` | Production FAIL while open |
| R18 | Home H1 `[REVIEW WITH CLIENT]` and goal sentence `[COPY REVIEW]` | BP §13.16; CD §C1, §G8 | `pages/home.ts` review flags | Current approved text renders (no marker); production FAIL while flags open |
| R19 | Real form provider selected, configured and tested | Amendment 5, N2, N12; BP §11 | `lib/form/adapter.ts`; provider setting | Production FAIL while provider is unset or a mock |

#### 11.4.2 PRE-LAUNCH IMPORTANT (visible WARNING; never fails the build by itself)

Preview may show the `[MISSING …]` marker; production renders the safe fallback below (§11.1).

| # | Item | Source | File / component | Safe fallback (production) and check behaviour |
|---|---|---|---|---|
| I1 | og:image (real 1200×630 brand image) | SP F.6; N7 | `facts.ts` ogImage → SeoHead | Tag omitted, `twitter:card=summary`; production WARNING |
| I2 | Alberto's title at Medaglia Consulting | BP §13.10; CD §C7 ("show the name only, no title"), §G9; amendment 7 | `team.ts` → Chi siamo subline; Person `jobTitle`; Org `founder` | Name only, no `jobTitle`/`founder`; production WARNING |
| U1 | Logo | BP §13 (before visual design), §7.10; SP E.1, I.1 | `facts.ts` logo → Header, schema `logo`, og:image | **Never invent a logo.** Brand name as plain text; schema `logo` pruned; architecture and build work without a logo. Production WARNING |
| U2 | Permission to publish each company name (OVB, Elatos, Metal System, Euromec) | BP §13.7, D7; CD §D, §G3 | `capabilities.ts` `show_company` | Names not displayed (`show_company:false`, CD §D fallback lead) until permission is confirmed per company. Production WARNING |
| U3 | Metal System / Euromec relationship and status (Euromec ongoing or concluded) | BP §13.9; CD §G4, §G10 | `registry.ts` → `capabilities.ts` capabilities 3–4 | Only the approved neutral wording; imply no current client status, timing or relationship beyond verified facts. Production WARNING |
| U4 | In-person / remote meetings | BP §13.11; CD §C2 editorial note (not visible), §G2 | `pages/affiancamento.ts` | State no meeting format until confirmed. Production WARNING |
| U8 | Analytics active at launch | BP §12 MUST HAVE "Cookieless analytics with events"; N4 | `analytics-init.ts` | Site may launch without analytics; internal abstraction only, no data sent; **no provider loaded until the privacy/cookie decision (N4, R9, R10) is resolved**. Production WARNING |
| R2 + R15 (R15 merged with R2) | **Who answers / calls back and when** (who returns the call, and within what timeframe) | BP §13.1, §13.12; CD §C8, §C9 (visible `[MISSING: chi richiama ed entro quando]`) | `registry.ts`; `pages/contatti.ts` (§2), `pages/grazie.ts` | Safe fallback: **do not identify the person who will call back and do not promise a response time** until confirmed. Preview may show the `[MISSING: chi richiama ed entro quando]` marker; **production omits those lines on Contatti §2 and Grazie (not rendered)**. Absence → production **WARNING**, never a production block (FRC-2, Q3 resolved). |
| R13 | Accuracy of OVB figures (tre uffici commerciali, circa 70 collaboratori) | BP §13.8; CD §D, §G4 | `registry.ts` → `capabilities.ts` capability 1 (`figuresConfirmed:false`) | Unconfirmed figures not rendered; only verified professional experience kept. Q1 rule (resolved 2026-10-19): no new fallback marketing copy; only already-approved wording that stays accurate without the figures; an approved sentence left incomplete by the omission is flagged for owner review (never invented copy); does not block Phase 3B. "Senior Manager" is client-provided professional history and may be modelled (Q2 resolved); publication of the detailed OVB experience stays subject to R13 / BP §13.8 confirmation. Production WARNING. Rendering the unconfirmed figures is an implementation-integrity failure (§11.1) and does **not** change this IMPORTANT tier. |
| R14 | Alberto's professional photo | BP §13 (before visual design), §13.10; CD §C7 (visible `[MISSING]`), §G9 | `facts.ts` photo → Chi siamo image, Person `image` | Preview: neutral labelled box with the marker, never an image. Production: site complete and usable without the photo; **no image element, no placeholder box**, Person `image` pruned; no fake photography. Production WARNING. Rendering an image, fake photo or placeholder image/box as if it were his photo is an implementation-integrity failure (§11.1) and does **not** change this IMPORTANT tier. |

#### 11.4.3 OPTIONAL (INFO only; never fails, never a blocking condition)

| # | Item | Source | File / component | Default / safe fallback |
|---|---|---|---|---|
| O1 | LinkedIn URL | BP §14; CD §B | `facts.ts` linkedin → Footer, schema `sameAs` | Omitted |
| O2 | Second team profile | BP §14, §11 | `team.ts` `published:false` | Never emitted (scan confirms) |
| O3 | Whether the discovery call is free, and its duration | BP §14, §5.3; CD §A, §C8 | not modelled | Never stated (scan for "gratuit") |
| O4 | Google Business Profile | BP §14; SP G.2 | none (off-site) | Not set up |
| O5 | Funded training (Fondi Interprofessionali) | BP §14 | not modelled | Not mentioned |
| O6 | Testimonials / case studies with written consent | BP §14 | none | No section built |
| O7 | Online booking, WhatsApp | BP §14, D2 | none | Not at launch |
| O8 | Reference websites the client likes/dislikes | BP §13 ("helpful") | design input only | — |
| O9 | AI-crawler rules in robots.txt | SP F.2 | `robots.txt.ts` | None |
| U5 | Exact areas within Nord Italia | BP §13.11; SP G.3 | none (copy stays "Nord Italia") | The approved "Nord Italia"; naming regions would be a scope change (BP §12) |
| U6 | Home hero photo | CD §C1 image note; N15 | `pages/home.ts` hero | No image (text-first hero); no fake or stock photography as a substitute for Alberto |
| U7 | Affiancamento cost FAQ answer | D18/C6; CD §G1 | `pages/affiancamento.ts` `published:false` | Stays unpublished (not shown, not in schema) until the client provides an approved answer |
| R20 | Whether a previous site/domain exists (if so, a 301 redirect map is required) | SP F.4 (`[MISSING]`) | `registry.ts`; future redirect config | OPTIONAL for the build: no redirect map. **Before any actual deployment or domain migration**, if an existing site or domain is discovered or confirmed, the redirect/migration requirements must be reviewed separately. |

#### 11.4.4 Owner to classify

None — all classified 2026-10-19. Any future item without an owner tier is reported as **"UNCLASSIFIED — OWNER REVIEW REQUIRED"** (warning, never an automatic failure).

**Questions arising from the classifications — none open (Q1–Q3 resolved 2026-10-19, FRC-2)**

| # | Question | Related item | Status | Rule |
|---|---|---|---|---|
| Q1 | Fallback for capability 1 without the OVB figures | R13 | **Resolved 2026-10-19** | No new fallback marketing copy; use only already-approved wording that remains accurate when the figures are omitted; if the omission leaves an approved sentence grammatically or semantically incomplete during implementation, flag it for owner review, never invent copy. Does not block Phase 3B. |
| Q2 | Treatment of "Senior Manager" | R13 | **Resolved 2026-10-19** | Client-provided professional-history information (BP Appendix B / CD §D); may be represented in the content model. Publication of the detailed OVB experience stays subject to the pre-launch confirmation rules (R13 / BP §13.8). Does not block Phase 3B. |
| Q3 | Does R15 have a safe fallback, given the R2 fallback? | R2, R15 | **Resolved 2026-10-19: IMPORTANT, omit-line fallback** | R15 merged with R2 into the IMPORTANT item "Who answers / calls back and when"; production omits the `[MISSING: chi richiama ed entro quando]` lines (Contatti §2, Grazie); absence → WARNING, never a block. |

### 11.5 Release check (`scripts/check-release.mjs` + source assertion)

Two layers. In **preview/dev** both only report. In **production** they apply the tier rules above.

1. **Source layer:** reads `registry.ts`, `facts.ts`, `team.ts`, `capabilities.ts` (`show_company`, `figuresConfirmed`), review flags and the form-provider setting; applies §11.1:

   | Classification of an unresolved item | Production outcome |
   |---|---|
   | REQUIRED | **FAIL** |
   | IMPORTANT | **WARNING** |
   | OPTIONAL | **INFO** |
   | UNCLASSIFIED | **WARNING "UNCLASSIFIED — OWNER REVIEW REQUIRED"** (never an automatic failure) |

   It **prints every unresolved item** with its ID, classification, source and the fallback in use, plus any owner-review flag raised during implementation under the Q1 rule (§11.3; WARNING, never a failure). No questions remain open (§11.4.4). It **never silently passes an unresolved REQUIRED item**: an item it cannot read or classify is reported, never skipped. Only REQUIRED items can set a failing exit code.
2. **Output layer** (scan of `dist/**`: HTML, JSON-LD, sitemap, robots):
   - markers `[MISSING`, `[REVIEW WITH CLIENT]`, `[COPY REVIEW]`, `[PRE-LAUNCH]`, `[DESIGN`, `[CONDITIONAL`, `[OPTIONAL`, "Phase 3 design note", `{BASE}`, `.invalid` → FAIL in production. Because production renders the safe fallback for IMPORTANT/OPTIONAL items (§11.1), any marker found here is a **defect** (leaked marker), not a tier outcome;
   - **implementation-integrity failures (owner-approved 2026-10-19)**, both FAIL in production because the approved fallback was not applied: (a) unconfirmed OVB figures rendered in capability 1 while `figuresConfirmed:false`; (b) Alberto's photo missing (R14) but an image, fake photo or placeholder image/box rendered as if it were his photo. These **do not change the IMPORTANT classification of R13 or R14** (§11.1);
   - R2/R15: the `[MISSING: chi richiama ed entro quando]` lines are omitted in production; any trace of them is caught by the marker scan above (leaked marker);
   - R-rule terms (BP §9): company names outside /chi-siamo/ or with `show_company:false`; Bergamo/Brescia/Lecco outside /chi-siamo/; "selezione del personale", "head hunting", "ricerca candidati"; "fondatore"; "gratuit"; "temporary sales manager", "direttore commerciale esterno"; the second-profile name; Review/AggregateRating → FAIL.
3. **Structure invariants:** 8-URL sitemap; canonical/robots rules (§6); one H1 per page; JSON-LD parses; FAQ and breadcrumb parity with visible text; exactly one `<form>`, on /contatti/; privacy checkbox not `checked`; link rules (§6.2); no inline scripts/styles; `rel` on external links; no `og:image` tag pointing to a non-existent file.
4. **Not checked:** JS/CSS size budgets (amendment 2); presence of og:image, logo, analytics or any other IMPORTANT/OPTIONAL item as a blocker (N7; 2026-10-19 classifications — warning/info only).

---

## 12. Responsive strategy

Mobile-first; breakpoints 768 px and 1024 px as documented constants.

| Aspect | Desktop (≥1024) | Tablet (768–1023) | Mobile (<768) |
|---|---|---|---|
| Nav | Inline; "Come collaboriamo" disclosure | Menu button | Menu button; open menu ends with "Richiedi un confronto" |
| **Header CTA "Richiedi un confronto"** | **Visible** | **Visible** | **Visible** (BP §5.1; N9) |
| Sticky bar | Hidden | Hidden | Shown: Chiama + Richiedi un confronto (BP §7.10, CD §B) |
| Header CTA + sticky bar coexistence | — | — | frontend-design ensures no excessive visual duplication and no obstruction of content/form fields (N9) |
| Phone | "Oppure chiama il …" (`tel:` link) | Same as desktop | "Chiama" button |
| Comparison | 3 aligned cards, middle highlighted | Aligned or stacked | Stacked cards, same DOM (N13) |
| Capability blocks | 2 columns where space allows | 1–2 columns | 1 column; secondary activities in `<details>` (once N8 decided) |

**Design-note mapping** (grouping is visual only; H2/H3 levels and order stay exactly as CD, preserving SP heading topics):

| CD design note | Implementation |
|---|---|
| Home: not 11 equal sections; integrate "goal"; "External perspective" compact (CD §C1, CL-11) | `Section weight`: goal as a light lead-in to the next block; External perspective `compact` |
| Affiancamento: sections must not feel equal | Visual groups: hero; trigger list; "Che cos'è" + "Perché" as one block; compact `MethodSteps`; "Su cosa possiamo lavorare" with "Costruito sulla tua azienda" integrated; "Cosa resta"; Experience + comparison + compact cross-link; FAQ; CTA |
| Affiancamento comparison on mobile | `LevelComparison` single-DOM cards |
| Operativo: "Competenze complementari quando servono" compact supporting block | Compact block, visually distinct from the commercial-partnership section |
| Reti: "Cosa facciamo" main, others compact | Main weight on that section; supporting sections compact |
| Formazione: topics + formats as a compact pair; distinct from Affiancamento service | Two-column pair; the Affiancamento-related section styled apart |
| Chi siamo: no wall of text, no logo wall (CD §C7) | `CapabilityCard`: capability → context → 3–4 key activities (N8) → "Come si traduce oggi"; others disclosed, still in HTML; no logos ever (BP §9 rule R9) |

---

## 13. Missing assets

| Can be built now (neutral, D17-safe) | Waits |
|---|---|
| All routes, layouts, header/nav/footer/sticky bar structure | Logo, wordmark treatment, favicon (D17; U1 IMPORTANT — build works without a logo: brand name as plain text, schema `logo` pruned) |
| Content modules (copy approved), slots, registry, release check | Alberto's professional photo (D17; R14 IMPORTANT — site complete without it) |
| SEO head, JSON-LD, sitemap, robots | Colour palette, typography, font files |
| Form, validation, adapter boundary, mock adapters | Final spacing/hierarchy, imagery, iconography |
| Analytics abstraction (no provider), tests | og:image (I1) |
| Neutral wireframe tokens: greyscale, spacing and type scale, system fonts, focus ring | Final contrast verification; Home hero photo placement (N15; U6 OPTIONAL) |

- **No fake logo, photo, og:image or branding.** The brand name renders as plain text (U1). Photo slots in **preview** may be a neutral labelled box with the CD marker, never an image. In **production**, a missing photo (R14, U6) renders **nothing**: no image element and no placeholder box; the pages remain complete and usable.
- No generated or stock imagery (BP §5.4, CD §G7); no fake or stock photography as a substitute for Alberto (R14, U6).

---

## 14. Build sequence

Implementation starts only after owner approval of this document (BP §15.4). Each phase ends with its quality gates (§15).

1. **Foundation** — pin Node; npm project; Astro strict config; telemetry disabled; `slots.ts`, `env.ts`, `routes.ts`, `registry.ts`, `facts.ts`; neutral tokens/reset/base CSS; `BaseLayout` + `SeoHead` (noindex outside production).
2. **Shared components** — Header (CTA all sizes), nav disclosure, StickyBar, Footer + legal block, Breadcrumbs; `Cta`, `PhoneLink`, `EmailLink`, `ExternalLink`, `ContextLink`, `Fact`, `Section`, `Hero`, `CtaBlock`, `FaqList`.
3. **Pages** — content modules verbatim from CD; `ServiceLayout`; patterns (`ThreeLevels`, `MethodSteps`, `LevelComparison`, `ExperienceBlock`, `CapabilityCard`); Home → Affiancamento → other service pages → Chi siamo → Contatti → Grazie → 404 → `[legal]`.
4. **Form** — `interesse.ts`; validation + CD messages; `ContactForm`; adapter boundary + **mock adapters only**; success (clean `/grazie/`) / failure / honeypot states; origin capture.
5. **SEO** — JSON-LD builders with pruning; FAQ/breadcrumb parity; sitemap/robots endpoints; SP parity test.
6. **Analytics** — `events.ts`, `track.ts`, delegated tel/mailto listener, `grazie.ts`, inactive `cta_click`; **no provider, no storage, no network**.
7. **Accessibility / performance / release check** — keyboard, focus, ARIA passes; reduced motion; measure actual JS/CSS output; `check-release.mjs` with the tier model.
8. **Review** — quality gates; fix findings.
9. **Pre-launch integration (only with confirmations and approvals)** — fill items only from confirmed client data; review with the owner any flag raised under the Q1 rule (§11.3; Q1–Q3 are resolved, §11.4.4) and any future UNCLASSIFIED item; select provider (N2) and analytics (N4) on decision; final visual pass after D17 assets; preview verification. Any deployment, Netlify connection or DNS work needs separate explicit approval (§18).

---

## 15. Quality gates

| Gate | When / how |
|---|---|
| **frontend-design** | Used during the structural / neutral implementation (phases 2–3), explicitly instructed **not to invent visual identity**; responsible for the N9 header-CTA / sticky-bar balance. The **final visual design waits for the logo and Alberto's photo (D17)**. |
| **security-guidance** | Expected on changes to `contact-form.ts`, `submit.ts`, `adapter.ts`, `env.ts`, `.env*`, future headers/CSP, and any DOM/URL handling. Must always be reported as **VERIFIED RUN** (with evidence of its output) or **NOT VERIFIED** — never assumed. If NOT VERIFIED, a manual pass against §10 is recorded. **Current status (Phase 3A): NOT VERIFIED.** The presence of a `.git/sg-hook-once-*` file is not sufficient evidence that a relevant security review ran successfully. In Phase 3B it may be reported as **VERIFIED RUN** only with evidence of actual execution and its output. |
| **pr-review-toolkit:code-reviewer** | End of each build phase and before the final review. |
| **pr-review-toolkit:silent-failure-hunter** | After the form phase (fetch, timeout, fallbacks), the SEO phase (pruning, serializer), the analytics phase (caught errors) and on `check-release.mjs` (a check that silently passes is the main risk). |
| **website-auditor** | **Read-only.** On the locally built output (after phases 3 and 7) and again on a protected preview build before pre-launch (only once a preview is approved). |
| **Vitest (N6)** | Behaviour with meaningful failure risk: interesse parsing (hostile inputs, fallback); release checks (REQUIRED → FAIL, IMPORTANT → WARNING, OPTIONAL → INFO, UNCLASSIFIED → owner-review WARNING and never a failure; every unresolved item printed; an unresolved REQUIRED item never passes silently; leaked markers in production output; the two implementation-integrity failures (OVB figures rendered while unconfirmed; image/placeholder rendered for a missing photo) fail while R13/R14 themselves stay WARNING; mock-provider failure); structured-data/content consistency (FAQ, breadcrumbs, Service descriptions, SP titles/metas, pruning, no `jobTitle`/`founder`); missing-data handling (slot states, omitted-with-reason, preview marker vs production fallback for IMPORTANT/OPTIONAL items, `show_company:false`, `figuresConfirmed:false`, no photo element without R14, R2/R15 call-back lines omitted in production on Contatti §2 and Grazie); form logic where appropriate (validation, state transitions with mock adapters, values preserved). **No coverage-percentage targets.** |

---

## 16. Deferred decisions

| ID | Decision | Owner | Trigger | Impact while deferred |
|---|---|---|---|---|
| N2 | Form provider | Agency owner (+ privacy author for data processing) | Before any production submission; before pre-launch integration | Mock adapters only; production release fails (R19); CSP `form-action`/`connect-src` not final |
| N4 | Analytics provider; cookie-banner need; `/cookie-policy/` existence (D16, BP §13.13) | Agency owner + privacy-text author | Privacy/cookie decision | Abstraction only, no data, no provider, no storage; R9/R10 open (REQUIRED); U8 IMPORTANT — launch possible without analytics, no provider loaded; CSP not final |
| N8 | Primary 3–4 activities per capability | Agency owner / copywriter | Visual/content implementation pass | All activities shown; no `<details>` split yet |
| N11 | Netlify Forms storage/privacy (only if Netlify Forms is chosen) | Agency owner + privacy author | N2 decision | None until N2 |
| N15 | Home hero photo placement | Agency owner | Alberto's real photo available | Text-first Home hero; U6 OPTIONAL (no fake/stock substitute) |
| N5 (verification) | Actual Netlify preview-protection mechanism and plan availability | Agency owner | Before any preview deploy is approved | Previews are noindex by design; protection not relied on until verified |
| Final CSP | Strict production CSP | Agency owner | N2, N4, fonts and external resources known | Draft baseline only (§10.1) |
| `form_submit` context hand-off | Same-tab sessionStorage hand-off to `/grazie/` | Agency owner | N4 decided | Not implemented; no storage |
| Tier classification | Items U1–U8 | Agency owner | — | **Resolved 2026-10-19** (§11.4, §20): none unclassified. Future unclassified items → owner-review WARNING, never an automatic failure |
| R13 fallback copy (Q1) | Capability 1 without the OVB figures | Agency owner | — | **Resolved 2026-10-19 (FRC-2):** no new fallback marketing copy; only already-approved wording that stays accurate without the figures; an incomplete approved sentence is flagged for owner review during implementation, never invented. Does not block Phase 3B. |
| Senior Manager (Q2) | Treatment of "Senior Manager" in capability 1 | Agency owner | — | **Resolved 2026-10-19 (FRC-2):** client-provided professional history (BP Appendix B / CD §D), may be modelled; publication of the detailed OVB experience stays subject to R13 / BP §13.8. Does not block Phase 3B. |
| R15 overlap (Q3) | Whether R15 has a safe fallback, given the R2 fallback | Agency owner | — | **Resolved 2026-10-19: IMPORTANT, omit-line fallback.** R15 merged with R2; production omits the call-back lines; WARNING, never a block. |
| Previous site/domain (R20) | Redirect/migration requirements if an existing site or domain is found | Agency owner | Before any actual deployment or domain migration | OPTIONAL for the build; reviewed separately if a site/domain is discovered or confirmed |
| Visual design | Final identity, palette, typography | Agency owner | Logo and photo delivered (D17) | Neutral wireframe styling only |

---

## 17. Pre-launch dependencies (consolidated from BP §13 and CD §G)

| Dependency | BP §13 / CD §G | Tier |
|---|---|---|
| Logo and brand identity | BP §13 before visual design | IMPORTANT (U1) — plain-text brand name, schema `logo` pruned |
| Alberto's professional photo | BP §13 before visual design, §13.10; CD §G9 | IMPORTANT (R14) — no image element, no placeholder in production |
| Reference websites | BP §13 ("helpful") | OPTIONAL (O8) |
| Phone, hours | BP §13.1 | REQUIRED (R1, R3) |
| Who answers / calls back and when (R15 merged with R2) | BP §13.1, §13.12 | IMPORTANT (R2 + R15) — do not identify who calls back and promise no response time until confirmed; call-back lines omitted in production (Q3 resolved) |
| Lead-recipient email and publishable email | BP §13.2 | REQUIRED (R4, R5) |
| Ragione sociale, P.IVA, sede legale; PEC/REA if applicable | BP §13.3 | REQUIRED (R6); PEC/REA REQUIRED with omit-with-reason (R7) |
| Privacy policy; cookie policy if needed | BP §13.4 | REQUIRED (R8, R9) |
| Domain, DNS access, business email | BP §13.5 | REQUIRED (R11) |
| Office address and publication decision | BP §13.6 | REQUIRED with omit-with-reason (R12) |
| Company-name permissions ×4 | BP §13.7; CD §G3 | IMPORTANT (U2) — `show_company:false` until confirmed |
| OVB figures accuracy | BP §13.8; CD §G4 | IMPORTANT (R13) — `figuresConfirmed:false`; approved wording only, no new copy, incomplete sentence → owner review (Q1 resolved); Senior Manager may be modelled, publication subject to R13 (Q2 resolved) |
| Metal System / Euromec relationship and status | BP §13.9; CD §G4, §G10 | IMPORTANT (U3) — approved neutral wording only |
| Alberto's title | BP §13.10; CD §G9 | IMPORTANT (I2) |
| In person / remote | BP §13.11; CD §G2 | IMPORTANT (U4) — no meeting format stated |
| Areas of Nord Italia covered | BP §13.11 | OPTIONAL (U5) — "Nord Italia" |
| Cookie banner need | BP §13.13 | REQUIRED (R10) |
| Operativo boundaries | BP §13.14, D22; CD §G11 | REQUIRED (R16) |
| Privacy checkbox wording | BP §13.15; CD §G5 | REQUIRED (R17) |
| Home H1 / goal review flags | BP §13.16; CD §G8 | REQUIRED (R18) |
| Affiancamento cost FAQ | CD §G1 (D18/C6) | OPTIONAL (U7) — unpublished until an approved answer exists |
| Proof for later (testimonials, case material) | CD §G6; BP §14 | OPTIONAL (O6) |
| Image direction (real photos only) | CD §G7 | Rule, not a data item; enforced by "no fake assets" |
| Real form provider | Amendment 5, N2/N12 | REQUIRED (R19) |
| Previous site / old URLs | SP F.4 | OPTIONAL for the build (R20); review redirects/migration separately before any deployment or domain migration if a site/domain exists |
| og:image | SP F.6; N7 | IMPORTANT (I1) |
| Home hero photo | CD §C1 image note; N15 | OPTIONAL (U6) — text-first hero; no fake/stock substitute |
| Analytics active at launch | BP §12; N4 | IMPORTANT (U8) — launch possible without analytics; no provider until the privacy/cookie decision |

Only the REQUIRED rows above (15 items, §11.4.1) can block a production release (§11.1). IMPORTANT rows produce a release WARNING, OPTIONAL rows INFO. The two implementation-integrity failures (§11.1) are defects in applying a fallback and do not change any tier.

Launch-day actions outside the release check (SP §H): Search Console setup and sitemap submission (BP §11, §12), production `noindex` absence check (SP F.3), redirect verification (SP F.4). All require deployment approval first.

---

## 18. Prohibited actions without further approval

- Deploying; connecting Netlify; creating a Netlify site; Git integration; adding a remote; pushing.
- DNS or domain changes; production environment variables.
- Connecting a form provider or enabling production form submission.
- Installing analytics or loading any analytics provider (including storing analytics context).
- Purchases; client communications.
- Resolving PRE-LAUNCH items, review flags or owner-review flags raised under the Q1 rule, writing substitute copy, or changing any recorded tier without documented owner/client confirmation.
- Fake, placeholder or generated logo, photo or og:image.
- Final visual design before the D17 assets (logo, Alberto's photo).
- Modifying BLUEPRINT-APPROVED.md, COPY-DRAFT.md or SEO-PLAN.md without approval.

---

## 19. Risks and things not to build

**Risks**
- **Silent release check:** a check that passes silently would let markers or blockers through. Mitigation: tests per tier + silent-failure-hunter.
- **Form represented as production-ready:** it is not, until a provider is selected and tested (N12). The release check enforces R19.
- **Tier drift:** IMPORTANT/OPTIONAL items must not become blockers by habit, and REQUIRED items must not be downgraded without the owner.
- **Fallback leakage:** an IMPORTANT/OPTIONAL marker or placeholder reaching production output. Mitigation: production renders the approved fallback; the output-layer scan fails on any leaked marker (§11.5).
- **Source-document drift:** for U1–U8, R2 (with R15 merged), R13, R14 and R20 the 2026-10-19 decisions govern the release-check logic over CD line 7 and BP §13 "before launch" wording (§11.1), while BP/CD/SP stay unmodified until the owner decides to sync them. This precedence never permits changing approved copy or SEO content.
- **Fallback not applied:** OVB figures rendered while unconfirmed, or an image/placeholder rendered for Alberto's missing photo. Mitigation: implementation-integrity failures in the output scan (§11.5); R13/R14 tiers unchanged.
- **Invented copy under the Q1 rule:** omitting the OVB figures could tempt a rewrite. Mitigation: approved wording only; incomplete sentences flagged for owner review.
- **Visible/schema drift:** prevented by generating both from the same arrays; the Service-description lint is not a substitute for review.
- **CSP breakage** from inlined scripts/styles or `style=` attributes; verify at first build. CSP stays draft until N2/N4/D17 resources are known.
- **Header CTA + sticky bar duplication on mobile** (N9): visual crowding or obstruction; owned by frontend-design.
- **Lost form input** when following the same-tab privacy link (N10): accepted trade-off.
- **Attribution limits:** referrer-based origin is imperfect; no URL parameters are added.
- **Provider lock-in:** keep provider-specific code inside its adapter.
- **Unverified platform claims:** Netlify redirects, 404 handling, headers, preview protection, redirect-referrer behaviour — verify before relying on them.

**Do not build:** blog, FAQ page, recruiting page, testimonials/logo wall, WhatsApp/booking, English version, city/region pages, map embeds, cookie banner (unless required), i18n library, component kit, icon or animation library, Tailwind/Sass/React, a real form-provider adapter or analytics adapter (until N2/N4), any client-side storage (until N4), fixed JS/CSS budgets.

**Do not fabricate:** logo, photo, og:image, phone, email, hours, legal data, address, company-name visibility, Alberto's title, OVB figures, primary activities, cookie/privacy wording.

---

## 20. Decision log

| # | Decision | Final outcome |
|---|---|---|
| N1 | Stack | **APPROVED:** Astro, fully static, TypeScript strict, plain CSS with shared tokens + component/page styles, npm with committed lockfile. No Tailwind/Sass/React/component library without a concrete need. Next.js evaluated and not selected. |
| N2 | Form provider | **DEFERRED:** none chosen or connected; adapter boundary + mock adapters; no production submission authorised. |
| N3 | Hosting | Netlify is the intended target; build for compatibility. No site, deploy, Git integration, env vars, domain or DNS authorised; `netlify.toml` described as future configuration only. |
| N4 | Analytics / cookie setup | **DEFERRED:** internal abstraction only; sends no data, loads no provider. |
| N5 | Preview protection | **APPROVED:** previews noindex; protection designed; actual Netlify mechanism verified before reliance. |
| N6 | Tests | **APPROVED:** Vitest on high-risk behaviour; no coverage targets. |
| N7 | og:image | **CHANGED:** PRE-LAUNCH IMPORTANT, not a build blocker; tag omitted while missing; no fake image. |
| N8 | Primary capability activities | **DEFERRED:** chosen in the visual/content pass from approved activities, meaning unchanged. |
| N9 | Header CTA on small screens | Header CTA visible on all screen sizes (BP §5.1) plus the approved mobile sticky bar; frontend-design prevents excessive duplication/obstruction. |
| N10 | Privacy link | Same tab; no new-tab string; losing typed values accepted. |
| N11 | Netlify Forms storage/privacy | **DEFERRED:** waits for N2. |
| N12 | Validation | **ACCEPTED:** client validation is usability only; provider supplies real validation/abuse protection; form not production-ready until provider selected and tested. |
| N13 | Comparison layout | **APPROVED:** single-DOM responsive cards. |
| N14 | `cta_click` | **APPROVED:** inactive event within the analytics abstraction. |
| N15 | Home hero photo | **DEFERRED:** until Alberto's real photo is available. |
| FRC | **Final release classifications (2026-10-19)** | **General release rule:** only PRE-LAUNCH REQUIRED items may block a production release; a missing item is REQUIRED only when there is no safe launch fallback or it is legally/technically necessary. Outcomes: REQUIRED → production FAIL; IMPORTANT → production WARNING; OPTIONAL → INFO; UNCLASSIFIED → "UNCLASSIFIED — OWNER REVIEW REQUIRED" warning (the "unclassified → fail" rule is removed). The check prints every unresolved item with its classification and never silently passes an unresolved REQUIRED item. Preview may show `[MISSING …]` for IMPORTANT/OPTIONAL items; production renders the approved safe fallback; a leaked marker stays a production FAIL. For the items below this decision takes precedence over CD line 7; BP/CD/SP are not modified (syncing them is a separate owner decision). **Classified:** U1 Logo → IMPORTANT (never invented; plain-text brand, schema `logo` pruned); U2 company-name permission → IMPORTANT (`show_company:false`); U3 Metal System / Euromec relationship and status → IMPORTANT (approved neutral wording only); U4 in-person / remote meetings → IMPORTANT (no format stated); U5 exact areas within Nord Italia → OPTIONAL ("Nord Italia"); U6 Home hero photo → OPTIONAL (no fake/stock substitute); U7 cost FAQ → OPTIONAL (unpublished until an approved answer); U8 analytics active at launch → IMPORTANT (launch without analytics; no provider until the privacy/cookie decision). **Reclassified:** R2 who answers / returns the call → IMPORTANT (do not identify who calls back); R13 OVB figures → IMPORTANT (`figuresConfirmed:false`, figures not rendered; fallback rule and Senior Manager settled in FRC-2); R14 Alberto's photo → IMPORTANT (no image element or placeholder in production; no fake photography); R20 previous site/domain → OPTIONAL for the build (review redirects/migration separately before any deployment or domain migration). R15: amended by FRC-2 (merged with R2, IMPORTANT). |
| FRC-2 | **Final clarifications (2026-10-19)** | (1) **Implementation-integrity failures (owner-approved 2026-10-19):** production FAIL if (a) unconfirmed OVB figures are rendered, or (b) Alberto's photo is missing but an image, fake photo or placeholder image/box is rendered as if it were his photo. They do **not** change the IMPORTANT classification of R13 or R14. (2) **R15 merged with R2** into the PRE-LAUNCH IMPORTANT item "Who answers / calls back and when": do not identify who calls back or promise a response time until confirmed; production omits the `[MISSING: chi richiama ed entro quando]` lines on Contatti §2 and Grazie (preview may show the marker); absence → WARNING, never a block. R15 removed from REQUIRED; REQUIRED now 15 items. **Q3 resolved: IMPORTANT, omit-line fallback.** (3) **Q1 resolved:** no new fallback marketing copy for the OVB figures; only already-approved wording that remains accurate without them; an approved sentence left grammatically or semantically incomplete is flagged for owner review, never invented; does not block Phase 3B. (4) **Q2 resolved:** "Senior Manager" is client-provided professional-history information (BP Appendix B / CD §D) and may be represented in the content model; publication of the detailed OVB experience stays subject to R13 / BP §13.8; does not block Phase 3B. (5) **Precedence:** later approved Phase 3A release-classification decisions (2026-10-19) govern the release-check logic wherever earlier source wording is broader (e.g. CD line 7, BP §13 "before launch" items); release-check logic only, not permission to change approved copy or SEO content; BP, CD and SP remain unmodified. (6) No open questions remain. |

Additional amendments 1–8 (2026-10-19) are applied in: §3, §5.4, §5.6, §7.1 (1); §8, §11.5 (2); §10.1 (3); §11 (4); §5 (5); §5.4 (6); §6.1, §11.3, §11.4.2 (7); §15 (8).

Final release classifications (2026-10-19) are applied in: header; §4 (Header, CapabilityCard, Fact); §7; §11.1, §11.2, §11.3, §11.4 (tier tables, questions Q1–Q3), §11.5; §13; §14 (step 9); §15 (security-guidance status, Vitest); §16; §17; §18; §19; §20.

Final clarifications FRC-2 (2026-10-19) are applied in: header (Sources, Precedence); §11.1 (integrity failures, precedence); §11.2; §11.3 (Q1, Q2); §11.4 (REQUIRED count 15, R2 + R15 merged, R13, R14, Q1–Q3 resolved); §11.5; §14 (step 9); §15 (Vitest); §16; §17; §18; §19; §20.

## Amendments (2026-10-20)

Recorded only; the proposal above is not rewritten.
- **R3 (contact hours):** now omittable (D32, client decision: hours intentionally not published). `facts.hours` is an omitted-with-reason slot and the registry marks R3 `omitAllowed: true`, so it is no longer a production FAIL.
- **Logo:** `Logo.astro` renders the approved final asset `public/brand/medaglia-consulting.svg` as-is (U1 provided/verified), in header and footer.
- **D34:** `CtaBlock` accepts an optional `title` (default CLOSING_HEADLINE), used only on Affiancamento. `LevelComparison` and `ExperienceBlock` are kept in the codebase; `LevelComparison` is currently unused.

END OF DOCUMENT
