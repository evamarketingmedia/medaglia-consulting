/**
 * Pre-launch registry — ARCHITECTURE §11.4 (final classifications, 2026-10-19).
 *
 * COMPLETE: every item of §11.4.1 (REQUIRED), §11.4.2 (IMPORTANT) and §11.4.3 (OPTIONAL)
 * is present as a REAL entry. All are UNRESOLVED exactly as they are today, except R1
 * (phone: verified by agency owner, 2026-10-19; see facts.ts). IDs, tiers, sources and
 * fallbacks are taken from ARCHITECTURE §11.4; nothing here resolves an item or changes a
 * tier (§18). A production release check FAILS while any REQUIRED item is unresolved.
 *
 * Labels: a slot's labels are COPY-DRAFT / SEO-PLAN marker texts, verbatim; items with no
 * such marker have an empty label list (a marker is never invented).
 *
 * UNCLASSIFIED: no real item exists today (§11.4.4). It is exercised with test fixtures
 * only — never add a fake item here.
 */
import { slot, type Registry, type RegistryItem } from '../lib/slots.ts';
import { facts } from './facts.ts';

/** An unresolved confirmation with no marker text (decision / configuration items). */
const open = () => slot.missing<string>();

const required = [
  {
    id: 'R1',
    name: 'Phone number',
    source: 'BP §13.1; CD §B, §A',
    tier: 'required',
    omitAllowed: false,
    // Resolved: verified by agency owner, 2026-10-19 (value in facts.ts).
    slot: facts.phone,
  },
  // R3: intentionally not published (D32, agency owner, 2026-10-20) -> omitted with a reason.
  { id: 'R3', name: 'Contact hours (orari)', source: 'BP §13.1; CD §B, §C8', tier: 'required', omitAllowed: true, slot: facts.hours },
  {
    id: 'R4',
    name: 'Email receiving form requests (provider configuration, never in code)',
    source: 'BP §13.2',
    tier: 'required',
    omitAllowed: false,
    slot: open(),
  },
  { id: 'R5', name: 'Publishable email', source: 'BP §13.2; CD §B, §C8, §E', tier: 'required', omitAllowed: false, slot: facts.email },
  { id: 'R6', name: 'Ragione sociale, P.IVA, sede legale', source: 'BP §13.3; CD §B', tier: 'required', omitAllowed: false, slot: facts.legal },
  { id: 'R7', name: 'PEC, REA ("se applicabile")', source: 'BP §13.3; CD §B', tier: 'required', omitAllowed: true, slot: facts.pecRea },
  { id: 'R8', name: 'Privacy policy text', source: 'BP §13.4', tier: 'required', omitAllowed: false, slot: open() },
  {
    id: 'R9',
    name: 'Cookie policy: whether needed (cookiePolicyRequired, undecided), and text if needed',
    source: 'BP §13.4, D16',
    tier: 'required',
    omitAllowed: false,
    slot: open(),
  },
  {
    id: 'R10',
    name: 'Whether cookieless analytics removes the need for a cookie banner',
    source: 'BP §13.13; N4',
    tier: 'required',
    omitAllowed: false,
    slot: open(),
  },
  {
    id: 'R11',
    name: 'Domain / DNS access / business email (SITE_URL)',
    source: 'BP §13.5; SP F.4, I.1',
    tier: 'required',
    omitAllowed: false,
    slot: slot.missing<string>('[MISSING: dominio]'),
  },
  {
    id: 'R12',
    name: 'Office address and whether to publish it',
    source: 'BP §13.6; CD §B',
    tier: 'required',
    omitAllowed: true,
    slot: facts.address,
  },
  {
    id: 'R16',
    name: 'Operativo service boundaries',
    source: 'BP §13.14, D22; CD §C4, §G11; SP C.4 meta re-check',
    tier: 'required',
    omitAllowed: false,
    slot: open(),
  },
  {
    id: 'R17',
    name: 'Privacy checkbox wording (legal advisor)',
    source: 'BP §13.15; CD §E',
    tier: 'required',
    omitAllowed: false,
    slot: open(),
  },
  {
    id: 'R18',
    name: 'Home H1 [REVIEW WITH CLIENT] and goal sentence [COPY REVIEW] (current approved text renders, no marker)',
    source: 'BP §13.16; CD §C1, §G8',
    tier: 'required',
    omitAllowed: false,
    slot: open(),
  },
  {
    id: 'R19',
    name: 'Real form provider selected, configured and tested',
    source: 'Amendment 5, N2, N12; BP §11',
    tier: 'required',
    omitAllowed: false,
    // No COPY-DRAFT marker exists for this item.
    slot: open(),
  },
] as const satisfies readonly RegistryItem[];

const important = [
  {
    id: 'I1',
    name: 'og:image (real 1200×630 brand image)',
    source: 'SP F.6; N7',
    tier: 'important',
    omitAllowed: false,
    slot: facts.ogImage,
    fallback: { kind: 'omit', ref: 'N7 / SP F.6: og:image tag omitted, twitter:card=summary' },
  },
  {
    id: 'I2',
    name: "Alberto's title at Medaglia Consulting",
    source: 'BP §13.10; CD §C7, §G9; amendment 7',
    tier: 'important',
    omitAllowed: false,
    slot: facts.albertoTitle,
    fallback: { kind: 'omit', ref: 'CD §C7: name only, no title; no Person jobTitle, no Organization founder' },
  },
  {
    id: 'U1',
    name: 'Logo',
    source: 'BP §13, §7.10; SP E.1, I.1',
    tier: 'important',
    omitAllowed: false,
    slot: facts.logo,
    fallback: { kind: 'approved', ref: 'ARCH §11.4.2: brand name as plain text; schema logo pruned; never invent a logo' },
  },
  {
    id: 'U2',
    name: 'Permission to publish each company name (OVB, Elatos, Metal System, Euromec)',
    source: 'BP §13.7, D7; CD §D, §G3',
    tier: 'important',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'approved', ref: 'CD §D fallback leads; show_company:false for every company' },
  },
  {
    id: 'U3',
    name: 'Metal System / Euromec relationship and status',
    source: 'BP §13.9; CD §G4, §G10',
    tier: 'important',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'approved', ref: 'CD §D approved neutral, tense-neutral wording only' },
  },
  {
    id: 'U4',
    name: 'In-person / remote meetings',
    source: 'BP §13.11; CD §C2 editorial note, §G2',
    tier: 'important',
    omitAllowed: false,
    slot: slot.missing<string>('[MISSING: modalità degli incontri — in presenza, da remoto o entrambe]'),
    fallback: { kind: 'omit', ref: 'CD §C2: until confirmed say nothing (editorial note, never rendered)' },
  },
  {
    id: 'U8',
    name: 'Analytics active at launch',
    source: 'BP §12; N4',
    tier: 'important',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'approved', ref: 'ARCH §7: internal abstraction only, no provider, no data sent' },
  },
  {
    id: 'R2',
    name: 'Who answers / calls back and when (R15 merged)',
    source: 'BP §13.1, §13.12; CD §C8, §C9',
    tier: 'important',
    omitAllowed: false,
    slot: facts.callback,
    fallback: { kind: 'omit', ref: 'FRC-2 Q3: production omits the line on Contatti §2 and Grazie; no person, no response time' },
  },
  {
    id: 'R13',
    name: 'Accuracy of OVB figures (tre uffici commerciali, circa 70 collaboratori)',
    source: 'BP §13.8; CD §D, §G4',
    tier: 'important',
    omitAllowed: false,
    slot: open(),
    fallback: {
      kind: 'omit',
      ref: 'Q1 rule: figuresConfirmed:false — the two figure bullets of capability 1 are not rendered; no replacement copy (owner-review flag)',
    },
  },
  {
    id: 'R14',
    name: "Alberto's professional photo",
    source: 'BP §13 (before visual design), §13.10; CD §C7, §G9',
    tier: 'important',
    omitAllowed: false,
    slot: facts.photo,
    fallback: {
      kind: 'omit',
      ref: '§11.4.2: no image element, no placeholder box, Person image pruned; no fake photography',
    },
  },
] as const satisfies readonly RegistryItem[];

const optional = [
  {
    id: 'O1',
    name: 'LinkedIn URL',
    source: 'BP §14; CD §B',
    tier: 'optional',
    omitAllowed: false,
    slot: facts.linkedin,
    fallback: { kind: 'omit', ref: 'CD §B: omit until the URL is provided; no sameAs' },
  },
  {
    id: 'O2',
    name: 'Second team profile',
    source: 'BP §14, §11',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'published:false — never in HTML, sitemap or schema' },
  },
  {
    id: 'O3',
    name: 'Whether the discovery call is free, and its duration',
    source: 'BP §14, §5.3; CD §A, §C8',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'CD §A: never stated' },
  },
  {
    id: 'O4',
    name: 'Google Business Profile',
    source: 'BP §14; SP G.2',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'Not set up' },
  },
  {
    id: 'O5',
    name: 'Funded training (Fondi Interprofessionali)',
    source: 'BP §14',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'Not mentioned (CD §C6 editorial note)' },
  },
  {
    id: 'O6',
    name: 'Testimonials / case studies with written consent',
    source: 'BP §14',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'No section built' },
  },
  {
    id: 'O7',
    name: 'Online booking, WhatsApp',
    source: 'BP §14, D2',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'Not at launch' },
  },
  {
    id: 'O8',
    name: 'Reference websites the client likes / dislikes',
    source: 'BP §13 ("helpful")',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'approved', ref: 'Design input only; provisional palette documented in tokens.css' },
  },
  {
    id: 'O9',
    name: 'AI-crawler rules in robots.txt',
    source: 'SP F.2',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'SP F.2: default is none' },
  },
  {
    id: 'U5',
    name: 'Exact areas within Nord Italia',
    source: 'BP §13.11; SP G.3',
    tier: 'optional',
    omitAllowed: false,
    // No COPY-DRAFT marker exists for this item; copy stays "Nord Italia".
    slot: open(),
    fallback: { kind: 'approved', ref: 'FRC 2026-10-19: approved wording "Nord Italia"; naming regions is a scope change (BP §12)' },
  },
  {
    id: 'U6',
    name: 'Home hero photo',
    source: 'CD §C1 image note; N15',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'Text-first hero; no fake or stock photography' },
  },
  {
    id: 'U7',
    name: 'Affiancamento cost FAQ answer',
    source: 'D18/C6; CD §G1',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'published:false — not shown, not in FAQPage schema' },
  },
  {
    id: 'R20',
    name: 'Whether a previous site/domain exists (301 redirect map)',
    source: 'SP F.4',
    tier: 'optional',
    omitAllowed: false,
    slot: open(),
    fallback: { kind: 'omit', ref: 'No redirect map; review before any deployment or domain migration' },
  },
] as const satisfies readonly RegistryItem[];

export const registry: Registry = {
  complete: true,
  items: [...required, ...important, ...optional],
};
