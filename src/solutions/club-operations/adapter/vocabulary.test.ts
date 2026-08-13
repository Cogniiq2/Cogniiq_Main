// Vocabulary agreement between the browser module and the server-side gateway modules.
//
// The two sides must name the same things, but they must not *import* each other: the inertness
// boundary forbids any file outside this module from referencing it, and forbids this module from
// reaching into `src/lib`. So the check is made by reading the gateway module's source as text and
// comparing the names it declares against the ones the domain model declares here.
//
// A text comparison is weaker than a type-level one, but it is the strongest check available that
// does not create the coupling the boundary exists to prevent — and it catches the failure that
// actually matters: one side gaining or renaming a category the other has never heard of.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { taxCategories } from '../types';
import { clubOperationsOperations } from './transport';
import { createTransportAdapter } from './transportAdapter';

const repoRoot = resolve(__dirname, '../../../..');

function declaredStringArray(source: string, constantName: string): string[] {
  const match = new RegExp(`${constantName}\\s*=\\s*\\[([^\\]]*)\\]`).exec(source);
  if (!match) throw new Error(`${constantName} not found in the gateway source`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

describe('the gateway and the domain model share one vocabulary', () => {
  const taxSource = readFileSync(resolve(repoRoot, 'src/lib/gateway/clubOperationsTax.ts'), 'utf8');
  const cqgw1Source = readFileSync(resolve(repoRoot, 'src/lib/gateway/cqgw1.ts'), 'utf8');

  it('declares the same six tax categories on both sides', () => {
    expect(declaredStringArray(taxSource, 'clubOperationsTaxCategories').sort()).toEqual(
      [...taxCategories].sort(),
    );
  });

  it('declares the same twelve operations on both sides', () => {
    expect(declaredStringArray(cqgw1Source, 'cqgw1Operations').sort()).toEqual(
      [...clubOperationsOperations].sort(),
    );
  });

  it('names one operation per adapter method, with no method unreachable and no operation spare', () => {
    const adapter = createTransportAdapter({
      transport: async () => ({ status: 503, body: null }),
    });
    const methods = Object.keys(adapter).filter((name) => name !== 'id');
    expect(methods.sort()).toEqual([...clubOperationsOperations].sort());
  });

  it('keeps the operation union read-only in name as well as in effect', () => {
    for (const operation of clubOperationsOperations) {
      expect(operation).toMatch(/^(get|list)[A-Z]/);
    }
  });
});
