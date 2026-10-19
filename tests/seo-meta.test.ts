import { describe, expect, it } from 'vitest';
import { assertCanonicalAllowed, assertPagePolicy, buildCanonical, resolveRobots } from '../src/lib/seo/meta.ts';

describe('robots (N5)', () => {
  it('non-production is always noindex, nofollow', () => {
    expect(resolveRobots('index, follow', 'non-production')).toBe('noindex, nofollow');
    expect(resolveRobots('noindex, follow', 'non-production')).toBe('noindex, nofollow');
  });
  it('production keeps the page policy', () => {
    expect(resolveRobots('index, follow', 'production')).toBe('index, follow');
    expect(resolveRobots('noindex, follow', 'production')).toBe('noindex, follow');
  });
});

describe('canonical', () => {
  it('is absolute with a trailing slash', () => {
    expect(buildCanonical('/', 'https://a.invalid')).toBe('https://a.invalid/');
    expect(buildCanonical('/contatti/', new URL('https://a.invalid/x/'))).toBe('https://a.invalid/contatti/');
  });
  it('rejects malformed paths and a missing site', () => {
    for (const p of ['contatti/', '/contatti', '/a//b/', '/contatti/?interesse=x', '/a b/']) {
      expect(() => buildCanonical(p, 'https://a.invalid')).toThrow();
    }
    expect(() => buildCanonical('/', undefined)).toThrow();
  });
  it('is not allowed on noindex pages (§6)', () => {
    expect(() => assertCanonicalAllowed('/grazie/', 'noindex, follow')).toThrow();
    expect(() => assertCanonicalAllowed(undefined, 'noindex, follow')).not.toThrow();
    expect(() => assertCanonicalAllowed('/', 'index, follow')).not.toThrow();
  });
});

describe('page policy (S7)', () => {
  it('accepts the three allowed robots values with the right path rule', () => {
    expect(() => assertPagePolicy('/', 'index, follow')).not.toThrow();
    expect(() => assertPagePolicy(undefined, 'noindex, follow')).not.toThrow();
    expect(() => assertPagePolicy(undefined, 'noindex, nofollow')).not.toThrow();
  });
  it('rejects any other robots value', () => {
    for (const v of [undefined, '', 'index,follow', 'noindex', 'Index, Follow', 'none', 'index, nofollow', 42]) {
      expect(() => assertPagePolicy(undefined, v), String(v)).toThrow(/robots/);
    }
  });
  it('an indexable page needs a path; a noindex page must not have one', () => {
    expect(() => assertPagePolicy(undefined, 'index, follow')).toThrow(/must declare its `path`/);
    expect(() => assertPagePolicy('/grazie/', 'noindex, follow')).toThrow(/must not declare a canonical/);
    expect(() => assertPagePolicy('/', 'noindex, nofollow')).toThrow(/must not declare a canonical/);
  });
});
