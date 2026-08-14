// Pinned hashes of the shared contract modules (plan §2.2, §14.1.7).
//
// D3b-B cannot import anything from this repository: the upstream gateway runs in another project,
// in another repository, under Deno. Its copies of `cqgw1.ts`, `encoding.ts`, `canonicalJson.ts` and
// `operationValidation.ts` are therefore transcriptions, and **drift between the two copies is the
// failure mode**. The guard is a byte-hash parity check on both sides: this file pins the hashes
// here, the upstream suite pins the same values there, and the shared conformance vectors
// (`conformanceVectors.json`) are run by both.
//
// A failure here means one of two things, and both need a human:
//   * the module changed deliberately — update the pin here, and update the upstream transcription
//     and its pin in the same review; or
//   * the module changed by accident — which is exactly what this test exists to catch.
//
// Line endings are normalised to LF before hashing, so the pin is the same on every platform and
// under any `core.autocrlf` setting. It is the module's content that is pinned, not its checkout.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const gatewayRoot = resolve(__dirname);

function contentHash(file: string): string {
  const source = readFileSync(resolve(gatewayRoot, file), 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

/**
 * The frozen contract surface. Every entry is transcribed into SVHeinersreuth for D3b-B, modulo the
 * mechanical `.ts`-specifier rewrite the D2d spike validated; the upstream repository pins the
 * post-rewrite hash of its own copy.
 */
const PINNED: Record<string, string> = {
  'cqgw1.ts': '0c344424d210c9fb138a77bc54bc2bdeeb33381ccf3acbd35657c092327c701e',
  // Unchanged since the D2d spike recorded it, which is the point of pinning it.
  'encoding.ts': 'd75efd31c7b9acab94f5c76810139435d45fb0a9406edecd4fd008e56ac020bb',
  'canonicalJson.ts': 'd508c2f1901134008d623705d73b4d02be0c4cc32fc95d6a3afc1865c2b3bda7',
  'operationValidation.ts': '137a6c8fafd0b21c9642d4258fe8506bba18e03c4ffe90d712ccc34f1b2d3c20',
};

describe('the shared contract modules are pinned', () => {
  for (const [file, expected] of Object.entries(PINNED)) {
    it(`${file} still hashes to its pinned value`, () => {
      expect(contentHash(file), `${file} changed — update the upstream transcription too`).toBe(
        expected,
      );
    });
  }

  it('pins exactly the modules the upstream transcribes, and no others', () => {
    expect(Object.keys(PINNED).sort()).toEqual([
      'canonicalJson.ts',
      'cqgw1.ts',
      'encoding.ts',
      'operationValidation.ts',
    ]);
  });

  it('normalises line endings, so the pin does not depend on the checkout', () => {
    const crlf = 'a\r\nb\r\n';
    const lf = 'a\nb\n';
    expect(createHash('sha256').update(crlf.replace(/\r\n/g, '\n'), 'utf8').digest('hex')).toBe(
      createHash('sha256').update(lf, 'utf8').digest('hex'),
    );
  });
});
