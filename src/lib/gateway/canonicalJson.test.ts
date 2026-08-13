import { describe, expect, it } from 'vitest';

import { canonicalJson, CanonicalJsonError, compareByCodePoint } from './canonicalJson';
import { sha256Hex, utf8ByteLength, utf8Bytes } from './encoding';

describe('key order is canonical, not insertion order', () => {
  it('produces identical text for objects built in different orders', () => {
    const forwards = { alpha: 1, beta: 2, gamma: 3 };
    const backwards: Record<string, number> = {};
    backwards.gamma = 3;
    backwards.beta = 2;
    backwards.alpha = 1;
    expect(canonicalJson(forwards)).toBe('{"alpha":1,"beta":2,"gamma":3}');
    expect(canonicalJson(backwards)).toBe(canonicalJson(forwards));
  });

  it('sorts nested objects independently at every level', () => {
    const value = { z: { d: 1, a: { y: 1, b: 2 } }, a: [{ n: 1, m: 2 }] };
    expect(canonicalJson(value)).toBe('{"a":[{"m":2,"n":1}],"z":{"a":{"b":2,"y":1},"d":1}}');
  });

  it('never reorders arrays, which are ordered by definition', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
    expect(canonicalJson([[2, 1], [1, 2]])).toBe('[[2,1],[1,2]]');
  });

  it('sorts by Unicode code point rather than by UTF-16 code unit', () => {
    // U+1F600 is an astral character stored as the surrogate pair D83D DE00. A UTF-16 comparison
    // orders it *before* U+FF00, a code-point comparison after it. This is the one case where the
    // two disagree, so it is the case worth pinning.
    const astral = '\u{1F600}';
    const bmp = '＀';
    expect(astral < bmp).toBe(true); // what a naive `sort()` would do
    expect(compareByCodePoint(astral, bmp)).toBeGreaterThan(0);

    const value: Record<string, number> = {};
    value[astral] = 1;
    value[bmp] = 2;
    expect(canonicalJson(value)).toBe(`{${JSON.stringify(bmp)}:2,${JSON.stringify(astral)}:1}`);
  });

  it('orders a prefix before the longer string that extends it', () => {
    expect(canonicalJson({ ab: 1, a: 2 })).toBe('{"a":2,"ab":1}');
  });
});

describe('UTF-8 and German text survive unescaped', () => {
  it('emits umlauts and sharp s literally', () => {
    expect(canonicalJson({ name: 'Grüße für Köln, Maß' })).toBe('{"name":"Grüße für Köln, Maß"}');
  });

  it('sorts German keys by code point, so umlauts follow ASCII letters', () => {
    expect(canonicalJson({ Ärger: 1, Anfang: 2, zuletzt: 3 })).toBe(
      '{"Anfang":2,"zuletzt":3,"Ärger":1}',
    );
  });

  it('escapes only what JSON requires', () => {
    expect(canonicalJson({ q: 'a"b\\c\nd\te' })).toBe('{"q":"a\\"b\\\\c\\nd\\te"}');
  });

  it('measures byte length in UTF-8, not in UTF-16 code units', () => {
    // 5 characters, but ö and ß are two bytes each.
    expect(utf8ByteLength('Größe')).toBe(7);
    expect('Größe'.length).toBe(5);
    expect(utf8ByteLength('\u{1F600}')).toBe(4);
    expect('\u{1F600}'.length).toBe(2);
  });
});

describe('empty and edge structures', () => {
  it('renders empty containers', () => {
    expect(canonicalJson({})).toBe('{}');
    expect(canonicalJson([])).toBe('[]');
    expect(canonicalJson({ a: {}, b: [] })).toBe('{"a":{},"b":[]}');
  });

  it('renders scalars at the top level', () => {
    expect(canonicalJson(0)).toBe('0');
    expect(canonicalJson(-5)).toBe('-5');
    expect(canonicalJson(true)).toBe('true');
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson('')).toBe('""');
  });

  it('collapses negative zero, so one value has one spelling', () => {
    expect(canonicalJson(-0)).toBe('0');
    expect(canonicalJson({ a: -0 })).toBe(canonicalJson({ a: 0 }));
  });

  it('omits keys whose value is undefined instead of writing null', () => {
    expect(canonicalJson({ a: 1, b: undefined, c: 3 })).toBe('{"a":1,"c":3}');
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });

  it('keeps an explicit null, which is a value rather than an absence', () => {
    expect(canonicalJson({ a: null })).toBe('{"a":null}');
  });

  it('allows the same object to appear twice in a tree without calling it a cycle', () => {
    const shared = { s: 1 };
    expect(canonicalJson({ left: shared, right: shared })).toBe('{"left":{"s":1},"right":{"s":1}}');
  });
});

describe('forbidden and non-JSON values are rejected, never coerced', () => {
  const cases: Array<[string, unknown, string]> = [
    ['undefined at the top level', undefined, 'unsupported_type'],
    ['undefined inside an array', [1, undefined], 'undefined_in_array'],
    ['a function', { f: () => 1 }, 'unsupported_type'],
    ['a symbol', { s: Symbol('x') }, 'unsupported_type'],
    ['a bigint', { b: 1n }, 'unsupported_type'],
    ['NaN', { n: NaN }, 'non_finite_number'],
    ['Infinity', { n: Infinity }, 'non_finite_number'],
    ['negative Infinity', { n: -Infinity }, 'non_finite_number'],
    ['a non-integer number', { amount: 12.34 }, 'non_integer_number'],
  ];

  for (const [what, value, reason] of cases) {
    it(`rejects ${what}`, () => {
      expect(() => canonicalJson(value)).toThrow(CanonicalJsonError);
      try {
        canonicalJson(value);
      } catch (error) {
        expect((error as CanonicalJsonError).reason).toBe(reason);
      }
    });
  }

  it('rejects a cycle rather than recursing forever', () => {
    const node: Record<string, unknown> = { name: 'a' };
    node.self = node;
    expect(() => canonicalJson(node)).toThrow(CanonicalJsonError);
    try {
      canonicalJson(node);
    } catch (error) {
      expect((error as CanonicalJsonError).reason).toBe('cycle');
    }
  });

  it('rejects a structure deeper than the guard allows', () => {
    let deep: unknown = 1;
    for (let i = 0; i < 200; i += 1) deep = { next: deep };
    expect(() => canonicalJson(deep)).toThrow(CanonicalJsonError);
  });

  it('names a structural path but never the offending value', () => {
    try {
      canonicalJson({ outer: { inner: [1, 12.34] } });
    } catch (error) {
      const canonicalError = error as CanonicalJsonError;
      expect(canonicalError.path).toBe('.outer.inner[1]');
      expect(canonicalError.message).not.toContain('12.34');
    }
  });

  it('refuses a float amount, which is what keeps money in integer cents', () => {
    expect(() => canonicalJson({ grossCents: 1234.5 })).toThrow(CanonicalJsonError);
    expect(canonicalJson({ grossCents: 1234 })).toBe('{"grossCents":1234}');
  });
});

describe('determinism is stable enough to hash', () => {
  it('two independently built structures hash identically', async () => {
    const first = {
      period: { end: '2026-07-31', start: '2026-07-01' },
      timezone: 'Europe/Berlin',
      figures: { vatCents: 700, grossCents: 10700, netCents: 10000 },
    };
    const second: Record<string, unknown> = {};
    second.figures = { netCents: 10000, grossCents: 10700, vatCents: 700 };
    second.timezone = 'Europe/Berlin';
    second.period = { start: '2026-07-01', end: '2026-07-31' };

    expect(canonicalJson(first)).toBe(canonicalJson(second));
    expect(await sha256Hex(utf8Bytes(canonicalJson(first)))).toBe(
      await sha256Hex(utf8Bytes(canonicalJson(second))),
    );
  });

  it('a one-cent change changes the hash', async () => {
    const base = await sha256Hex(utf8Bytes(canonicalJson({ grossCents: 10700 })));
    const moved = await sha256Hex(utf8Bytes(canonicalJson({ grossCents: 10701 })));
    expect(moved).not.toBe(base);
  });
});
