// Deterministic canonical JSON.
//
// Two runs over the same data must produce the same bytes, whatever order the keys were built in.
// That is what makes a report snapshot's hash meaningful and what makes a signed request
// reproducible by the verifier.
//
// The canonical form, fixed:
//   * UTF-8, characters emitted literally — no \u escaping of non-ASCII.
//   * Object keys sorted by Unicode **code point**, not by UTF-16 code unit.
//   * No insignificant whitespace.
//   * Numbers must be finite integers. Money is integer cents; a float in canonical output would
//     reintroduce exactly the ambiguity the cents convention exists to remove.
//   * A key whose value is `undefined` is omitted entirely. Absent is absent — it is never spelled
//     as `null`.
//   * Everything else — `undefined` in an array, functions, symbols, BigInt, NaN, Infinity,
//     non-integer numbers, cycles — is a typed rejection, never a silent substitution.

export const canonicalJsonErrorReasons = [
  'unsupported_type',
  'non_finite_number',
  'non_integer_number',
  'cycle',
  'undefined_in_array',
  'depth_exceeded',
] as const;
export type CanonicalJsonErrorReason = (typeof canonicalJsonErrorReasons)[number];

/** Carries a reason and a structural path — never a value, which could be financial or personal. */
export class CanonicalJsonError extends Error {
  readonly reason: CanonicalJsonErrorReason;
  readonly path: string;

  constructor(reason: CanonicalJsonErrorReason, path: string) {
    super(`canonical JSON rejected: ${reason} at ${path || '$'}`);
    this.name = 'CanonicalJsonError';
    this.reason = reason;
    this.path = path;
  }
}

/** Guards against a hostile or accidentally recursive structure exhausting the stack. */
const MAX_DEPTH = 64;

/**
 * Compare by Unicode code point.
 *
 * JavaScript's `<` on strings compares UTF-16 code units, which orders astral characters (U+10000
 * and above, encoded as surrogate pairs beginning at U+D800) *before* characters in U+E000–U+FFFF —
 * the opposite of code-point order. Two implementations disagreeing on that would produce different
 * bytes for the same object, which is precisely the failure this module exists to prevent.
 */
export function compareByCodePoint(a: string, b: string): number {
  const left = [...a];
  const right = [...b];
  const shared = Math.min(left.length, right.length);
  for (let i = 0; i < shared; i += 1) {
    const difference = left[i].codePointAt(0)! - right[i].codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function encode(value: unknown, path: string, depth: number, seen: Set<object>): string {
  if (depth > MAX_DEPTH) throw new CanonicalJsonError('depth_exceeded', path);

  if (value === null) return 'null';

  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';

    case 'number': {
      if (!Number.isFinite(value)) throw new CanonicalJsonError('non_finite_number', path);
      if (!Number.isInteger(value)) throw new CanonicalJsonError('non_integer_number', path);
      // `+ 0` collapses -0 to 0, so a signed zero cannot produce two spellings of one value.
      return String(value + 0);
    }

    case 'string':
      // JSON.stringify's string escaping is already deterministic and spec-fixed: control characters
      // and the two mandatory escapes, everything else literal UTF-8.
      return JSON.stringify(value);

    case 'object':
      break;

    default:
      // undefined, function, symbol, bigint
      throw new CanonicalJsonError('unsupported_type', path);
  }

  const object = value as object;
  if (seen.has(object)) throw new CanonicalJsonError('cycle', path);
  seen.add(object);
  try {
    if (Array.isArray(object)) {
      const parts = object.map((item, index) => {
        if (item === undefined) throw new CanonicalJsonError('undefined_in_array', `${path}[${index}]`);
        return encode(item, `${path}[${index}]`, depth + 1, seen);
      });
      return `[${parts.join(',')}]`;
    }

    const record = object as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort(compareByCodePoint);
    const parts = keys.map(
      (key) => `${JSON.stringify(key)}:${encode(record[key], `${path}.${key}`, depth + 1, seen)}`,
    );
    return `{${parts.join(',')}}`;
  } finally {
    // Removed on the way out so a value legitimately appearing twice in a tree is not mistaken for
    // a cycle; only an ancestor chain counts.
    seen.delete(object);
  }
}

/** Canonical JSON text for a value. Deterministic across key insertion orders. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) throw new CanonicalJsonError('unsupported_type', '$');
  return encode(value, '', 0, new Set<object>());
}
