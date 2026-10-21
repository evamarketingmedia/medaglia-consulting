import { describe, expect, it } from 'vitest';
import { checkSlot, isPlaceholderValue, slot } from '../src/lib/slots.ts';
import { evaluateItem } from '../src/lib/release/classify.ts';
import { facts } from '../src/content/facts.ts';

describe('checkSlot', () => {
  it('value is resolved', () => {
    expect(checkSlot(slot.value('Valore confermato'), false)).toEqual({ ok: true, resolved: true });
  });
  it('empty or absent value is an error', () => {
    expect(checkSlot({ state: 'value', value: '  ' }, false).ok).toBe(false);
    expect(checkSlot({ state: 'value' }, false).ok).toBe(false);
  });
  it('missing is unresolved and keeps verbatim labels', () => {
    expect(checkSlot(slot.missing('[MISSING: numero di telefono]'), false)).toEqual({ ok: true, resolved: false });
    expect(checkSlot(slot.missing(), false)).toEqual({ ok: true, resolved: false });
    expect(checkSlot({ state: 'missing', labels: [''] }, false).ok).toBe(false);
  });
  it('omitted needs omitAllowed AND a non-empty reason', () => {
    expect(checkSlot(slot.omitted('non applicabile (confermato)'), true)).toEqual({ ok: true, resolved: true });
    expect(checkSlot(slot.omitted('non applicabile'), false).ok).toBe(false);
    expect(checkSlot(slot.omitted(''), true).ok).toBe(false);
    expect(checkSlot(slot.omitted('   '), true).ok).toBe(false);
    expect(checkSlot({ state: 'omitted' }, true).ok).toBe(false);
  });
  it('unknown state is an error', () => {
    expect(checkSlot({ state: 'tbd' }, true).ok).toBe(false);
    expect(checkSlot(null, true).ok).toBe(false);
  });
});

describe('placeholder / empty values are never resolved (S1)', () => {
  const rejected: [string, unknown][] = [
    ['TBD', 'TBD'],
    ['tbd padded', '  tbd  '],
    ['TBA', 'TBA'],
    ['todo', 'todo'],
    ['xxx', 'XXX'],
    ['xxxxx', 'xxxxx'],
    ['n/a', 'N/A'],
    ['placeholder', 'Placeholder'],
    ['lorem ipsum', 'Lorem ipsum dolor sit amet'],
    ['dash', '-'],
    ['dashes', '---'],
    ['question mark', '?'],
    ['ellipsis', '...'],
    ['unicode ellipsis', '\u2026'],
    ['[MISSING: …]', '[MISSING: numero di telefono]'],
    ['lower-case marker', 'tel: [missing: numero]'],
    ['entity-encoded marker', '&#91;MISSING: x]'],
    ['.invalid URL', 'https://x.invalid'],
    ['{BASE}', '{BASE}/contatti/'],
    ['empty string', ''],
    ['whitespace', ' \t\n '],
    ['zero-width space only', '\u200b'],
    ['zero-width + nbsp', '\u200b\u00a0\ufeff\u200c\u200d'],
    ['empty object', {}],
    ['object with empty fields', { ragioneSociale: '', partitaIva: '', sedeLegale: '' }],
    ['object with one placeholder field', { ragioneSociale: 'Medaglia Consulting', partitaIva: 'TBD', sedeLegale: 'Via' }],
    ['nested placeholder', { a: { b: ['ok', 'xxx'] } }],
    ['object with null field', { pec: null }],
    ['object with undefined field', { pec: undefined }],
    ['empty array', []],
    ['array with empty string', ['ok', '']],
    ['array of empty arrays', [[]]],
    ['false', false],
    ['true', true],
    ['0', 0],
    ['NaN', Number.NaN],
    ['nested NaN', { n: Number.NaN }],
    ['null', null],
    ['function', () => 'x'],
  ];
  for (const [name, value] of rejected) {
    it(`value slot rejects ${name}`, () => {
      expect(isPlaceholderValue(value), name).not.toBeNull();
      expect(checkSlot({ state: 'value', value }, false).ok, name).toBe(false);
    });
  }

  const accepted: [string, unknown][] = [
    ['Nord Italia', 'Nord Italia'],
    ['sentence with "todo" inside a word', 'Seguiamo il metodo in tutto il processo commerciale.'],
    ['sentence with "na" and "tbd"-like words', 'Una consulenza mirata, non standard: ogni azienda ha la sua strada.'],
    ['real-looking https URL', 'https://www.linkedin.com/in/profilo-di-prova'],
    ['object with real fields', { ragioneSociale: 'Ragione Sociale Prova S.r.l.', partitaIva: '01234567890', sedeLegale: 'Via Prova 1, Milano' }],
    ['number and boolean fields alongside a meaningful string', { label: 'Logo principale', width: 1200, height: 630, published: true }],
    ['array of strings', ['Lombardia']],
    ['null-prototype object with a real field', Object.assign(Object.create(null) as object, { citta: 'Milano' })],
  ];
  for (const [name, value] of accepted) {
    it(`value slot accepts ${name}`, () => {
      expect(isPlaceholderValue(value), name).toBeNull();
      expect(checkSlot({ state: 'value', value }, false)).toEqual({ ok: true, resolved: true });
    });
  }

  it('omission reasons follow the same rule', () => {
    for (const reason of ['da definire', 'N.D.', '—', 'TODO: motivo', 'ＴＢＤ']) {
      expect(checkSlot({ state: 'omitted', reason }, true).ok, reason).toBe(false);
    }
    for (const reason of ['TBD', 'todo', '-', '\u200b', '[MISSING: motivo]', 'n/a']) {
      expect(checkSlot({ state: 'omitted', reason }, true).ok, reason).toBe(false);
    }
    expect(checkSlot({ state: 'omitted', reason: 42 }, true).ok).toBe(false);
    expect(checkSlot(slot.omitted('Non applicabile: confermato dal cliente il 2026-10-19'), true)).toEqual({ ok: true, resolved: true });
  });

  it('a value slot that still carries labels (or any extra key) is an error', () => {
    expect(checkSlot({ state: 'value', value: '+39 000 0000000', labels: ['[MISSING: numero di telefono]'] }, false).ok).toBe(false);
    expect(checkSlot({ state: 'value', value: 'ok', labels: [] }, false).ok).toBe(false);
    expect(checkSlot({ state: 'omitted', reason: 'Non pubblicato su richiesta del cliente', value: 'x' }, true).ok).toBe(false);
    expect(checkSlot({ state: 'missing', labels: [], value: 'x' }, false).ok).toBe(false);
  });

  it('nesting is bounded', () => {
    let deep: unknown = 'ok';
    for (let i = 0; i < 20; i += 1) deep = { d: deep };
    expect(isPlaceholderValue(deep)).toBe('field d: field d: field d: field d: field d: field d: field d: field d: field d: value is nested too deeply');
  });
});

describe('F2 / F4: invisible characters, compatibility forms and placeholder tokens', () => {
  const rejected: [string, string][] = [
    ['U+3164 HANGUL FILLER only', '\u3164'],
    ['U+2800 BRAILLE BLANK only', '\u2800'],
    ['U+180E MONGOLIAN VOWEL SEPARATOR only', '\u180e'],
    ['U+2061 FUNCTION APPLICATION only', '\u2061'],
    ['U+034F COMBINING GRAPHEME JOINER only', '\u034f'],
    ['U+115F HANGUL CHOSEONG FILLER only', '\u115f'],
    ['U+1160 HANGUL JUNGSEONG FILLER only', '\u1160'],
    ['U+FFA0 HALFWIDTH HANGUL FILLER only', '\uffa0'],
    ['LRM / RLM only', '\u200e\u200f'],
    ['TBD + U+3164', 'TBD\u3164'],
    ['T + U+034F + BD', 'T\u034fBD'],
    ['TBD with LRM inside', 'T\u200eB\u200fD'],
    ['fullwidth ＴＢＤ', 'ＴＢＤ'],
    ['fullwidth ｔｏｄｏ', 'ｔｏｄｏ'],
    ['Cyrillic look-alike ТВD', '\u0422\u0412D'],
    ['Cyrillic look-alike tоdо', 't\u043ed\u043e'],
    ['Cyrillic look-alike ХХХ', '\u0425\u0425\u0425'],
    ['da definire', 'da definire'],
    ['DA CONFERMARE', 'DA CONFERMARE'],
    ['Da definire.', 'Da definire.'],
    ['in attesa', 'In attesa'],
    ['non disponibile', 'Non disponibile'],
    ['N.D.', 'N.D.'],
    ['n.d.', 'n.d.'],
    ['ND', 'ND'],
    ['n.a.', 'n.a.'],
    ['em dash', '\u2014'],
    ['en dash', '\u2013'],
    ['underscores', '___'],
    ['question marks', '???'],
    ['single x', 'x'],
    ['single X', 'X'],
    ['single 0', '0'],
    ['zeros', '000'],
    ['null', 'null'],
    ['undefined', 'undefined'],
    ['false', 'false'],
    ['true', 'TRUE'],
    ['none', 'None'],
    ['[TBD]', '[TBD]'],
    ['TBD.', 'TBD.'],
    ['"TBD"', '"TBD"'],
    ['«TBD»', '«TBD»'],
    ['(todo)', '(todo)'],
    ['TODO: numero', 'TODO: numero'],
    ['tbd: …', 'tbd: da chiarire'],
    ['TBA: data', 'TBA: data'],
    ['[TODO] testo', '[TODO] testo'],
    ['Lorem', 'Lorem'],
    ['Lorem dolor', 'Lorem dolor sit'],
    ['.invalid host', 'site-url-not-set.invalid'],
    ['.INVALID URL upper-case', 'https://x.INVALID/path'],
    ['.invalid at sentence end', 'Vedi https://x.invalid.'],
    ['fullwidth marker', '［MISSING: telefono］'],
  ];
  for (const [name, value] of rejected) {
    it(`rejects ${name}`, () => {
      expect(isPlaceholderValue(value), name).not.toBeNull();
      expect(checkSlot({ state: 'value', value }, false).ok, name).toBe(false);
    });
  }

  const accepted: [string, string][] = [
    ['NA (not a placeholder: may be real data)', 'NA'],
    ['na', 'na'],
    ['a real domain containing "invalid" (invalidicivili.it)', 'invalidicivili.it'],
    ['a real URL containing ".invalid" as a label prefix', 'https://www.invalidicivili.it/contatti'],
    ['a host whose label is "invalid" followed by more labels', 'https://invalid.medaglia-test-domain.it'],
    ['sentence with "definire"', 'Gli obiettivi commerciali sono da definire insieme durante il primo incontro.'],
    ['sentence with "confermare"', 'Ti chiameremo per confermare la data della consulenza.'],
    ['sentence with "in attesa" in the middle', 'Nessun cliente resta in attesa di una risposta per più di un giorno.'],
    ['sentence with "todo" in the middle', 'Il metodo non è un todo generico: è un percorso su misura.'],
    ['sentence with "lorem" in the middle', 'Il nome del font di prova, lorem, non compare mai nel sito.'],
    ['sentence with "invalid" in the middle', 'Una richiesta invalid viene respinta dal modulo.'],
    ['sentence with "non disponibile" in the middle', 'Il servizio è non disponibile solo nei festivi.'],
    ['word starting with "todo"', 'Todos los días'],
    ['word starting with "tba"', 'Tbaccheria'],
    ['single letter that is not x', 'A'],
    ['x followed by a digit', 'x1'],
    ['a number with leading zero', '0123'],
    ['partita IVA-like digits', '01234567890'],
    ['company name', 'Medaglia Consulting S.r.l.'],
    ['Italian address', 'Via Prova 1, 20100 Milano'],
    ['NFKC-normal accented text', 'Società e attività'],
  ];
  for (const [name, value] of accepted) {
    it(`accepts ${name}`, () => {
      expect(isPlaceholderValue(value), name).toBeNull();
      expect(checkSlot({ state: 'value', value }, false)).toEqual({ ok: true, resolved: true });
    });
  }
});

describe('F3: structured values', () => {
  class Contact {
    name = 'Mario';
  }
  const rejected: [string, unknown][] = [
    ['[false]', [false]],
    ['[0]', [0]],
    ['[1, true]', [1, true]],
    ['{configured:false}', { configured: false }],
    ['{n:0}', { n: 0 }],
    ['{a:true}', { a: true }],
    ['numbers and booleans only', { width: 1200, height: 630, published: true }],
    ["new String('TBD')", new String('TBD')],
    ["new String('Milano') (boxed primitive)", new String('Milano')],
    ['new Number(1)', new Number(1)],
    ['new Boolean(true)', new Boolean(true)],
    ['Map', new Map([['a', 'Milano']])],
    ['Set', new Set(['Milano'])],
    ['Date', new Date('2026-10-19T00:00:00Z')],
    ['class instance', new Contact()],
    ['object inheriting from a non-Object prototype', Object.assign(Object.create({ inherited: 'x' }) as object, { a: 'Milano' })],
    ['nested Map', { a: 'Milano', b: new Map() }],
    ['nested boxed string', { a: 'Milano', b: new String('Roma') }],
    ['string leaf empty', { a: 'Milano', b: '' }],
    ['string leaf placeholder', { a: 'Milano', b: 'da definire' }],
    ['string leaf invisible only', { a: 'Milano', b: '\u3164' }],
    ['array with a placeholder', ['Milano', 'TBD']],
    ['symbol leaf', { a: 'Milano', s: Symbol('x') }],
    ['function leaf', { a: 'Milano', f: () => 'x' }],
    ['bigint leaf', { a: 'Milano', n: BigInt(1) }],
    ['sparse array hole', [, 'Milano']],
    ['symbol', Symbol('x')],
  ];
  for (const [name, value] of rejected) {
    it(`rejects ${name}`, () => {
      expect(isPlaceholderValue(value), name).not.toBeNull();
      expect(checkSlot({ state: 'value', value }, false).ok, name).toBe(false);
    });
  }

  const accepted: [string, unknown][] = [
    ['object with one meaningful string', { citta: 'Milano' }],
    ['object with a meaningful string and a boolean / number', { citta: 'Milano', pubblicato: true, ordine: 0 }],
    ['nested plain objects and arrays', { sede: { citta: 'Milano', cap: '20100' }, zone: ['Lombardia', 'Piemonte'] }],
    ['array mixing a string and a number', ['Milano', 2]],
  ];
  for (const [name, value] of accepted) {
    it(`accepts ${name}`, () => {
      expect(isPlaceholderValue(value), name).toBeNull();
      expect(checkSlot({ state: 'value', value }, false)).toEqual({ ok: true, resolved: true });
    });
  }
});

describe('registry items with slots', () => {
  const base = { id: 'R7', name: 'PEC, REA', source: 'BP §13.3', tier: 'required', omitAllowed: true };
  it('a REQUIRED omit-allowed item omitted with a reason counts as resolved', () => {
    expect(evaluateItem({ ...base, slot: slot.omitted('non applicabile, confermato') }, 0).kind).toBe('resolved');
  });
  it('omitted without a reason is an error, not a resolution', () => {
    expect(evaluateItem({ ...base, slot: { state: 'omitted', reason: '' } }, 0).kind).toBe('error');
  });
  it("omitted with the placeholder reason 'TBD' is an error, not a resolution", () => {
    expect(evaluateItem({ ...base, slot: { state: 'omitted', reason: 'TBD' } }, 0).kind).toBe('error');
  });
});

describe('facts (foundation) stay unresolved, except the verified phone (R1), photo (R14), logo (U1) and email (R5)', () => {
  it('every fact slot except phone, photo, logo and email is missing, with COPY-DRAFT labels verbatim', () => {
    for (const [key, s] of Object.entries(facts)) {
      if (!['phone', 'photo', 'logo', 'email', 'hours'].includes(key)) expect(s.state, key).toBe('missing');
    }
  });
  it('hours (R3) are intentionally not published (D32): omitted with a reason, resolved', () => {
    expect(facts.hours).toEqual({ state: 'omitted', reason: 'Scelta del cliente: orari non pubblicati (D32, 2026-10-20)' });
  });
  it('photo (R14) and logo (U1) reference the approved files (provided/verified by agency owner, 2026-10-19)', () => {
    expect(facts.photo).toEqual({
      state: 'value',
      value: { src: '/images/alberto-medaglia.png', alt: 'Alberto Medaglia', width: 1385, height: 1136 },
    });
    expect(facts.logo).toEqual({
      state: 'value',
      value: { src: '/brand/medaglia-consulting.svg', alt: 'Medaglia Consulting', width: 2048, height: 682 },
    });
    expect(checkSlot(facts.photo, false)).toEqual({ ok: true, resolved: true });
    expect(checkSlot(facts.logo, false)).toEqual({ ok: true, resolved: true });
  });
  it('phone (R1) holds the verified value exactly as provided (verified by agency owner, 2026-10-19)', () => {
    expect(facts.phone).toEqual({ state: 'value', value: '0039 334 1201847' });
    expect(checkSlot(facts.phone, false)).toEqual({ ok: true, resolved: true });
  });
});

// Permanent regression test: any later placeholder hardening (e.g. N1) must keep this passing.
describe('verified client data is never rejected as a placeholder', () => {
  it('verified client phone 0039 334 1201847 is accepted as a resolved value', () => {
    expect(isPlaceholderValue('0039 334 1201847')).toBeNull();
    expect(checkSlot(slot.value('0039 334 1201847'), false)).toEqual({ ok: true, resolved: true });
  });
});

describe('N1 / N2: masked draft values, separator-normalised tokens, narrowed prefix', () => {
  const rejected: string[] = [
    '+39 XXX XXX XXXX',
    '+39 000 000 0000',
    'xxx xxx xxxx',
    'XXX-XXX',
    'DA_DEFINIRE',
    'da-definire',
    'da.verificare',
    'TBC',
    '[TBC]',
    'da verificare',
    '[TBD]',
    'TBA',
    '[TBA]',
    'TBD/TBA',
    'TODO: numero',
    '[TODO] testo',
  ];
  for (const value of rejected) {
    it(`rejects ${JSON.stringify(value)}`, () => {
      expect(isPlaceholderValue(value), value).not.toBeNull();
      expect(checkSlot({ state: 'value', value }, false).ok, value).toBe(false);
    });
  }

  const accepted: string[] = [
    '+393341201847',
    '02 1234567',
    '+39 06 1234 5678',
    'Todo Modo srl',
    'TBD Group S.p.A.',
    'Maxxi',
    'Via Roma 1',
    'NA',
    'X Factor',
    'I dettagli operativi restano da definire con il cliente durante il primo incontro.',
  ];
  for (const value of accepted) {
    it(`accepts ${JSON.stringify(value)}`, () => {
      expect(isPlaceholderValue(value), value).toBeNull();
      expect(checkSlot({ state: 'value', value }, false)).toEqual({ ok: true, resolved: true });
    });
  }

  it('an omitted slot with the reason DA_DEFINIRE is rejected', () => {
    expect(checkSlot({ state: 'omitted', reason: 'DA_DEFINIRE' }, true).ok).toBe(false);
  });
});
