// The shared conformance vectors (plan §2.2, §9, §14.1.2).
//
// `conformanceVectors.json` is run by both repositories: here against this repository's modules, and
// in SVHeinersreuth against its transcriptions of the same modules. Because the two copies cannot
// import one another, agreeing on this file — plus the pinned module hashes — is what keeps them
// from drifting apart silently.

import { describe, expect, it } from 'vitest';

import vectors from './conformanceVectors.json';
import { canonicalJson } from './canonicalJson';
import {
  CQGW1_CANONICAL_PATH,
  buildCanonicalString,
  isCqgw1Operation,
  type Cqgw1Operation,
} from './cqgw1';
import { sha256Hex, utf8Bytes } from './encoding';
import { readGatewayEnvelope, GatewayResponseError } from './clubGatewayResponse';
import { validateOperationQuery } from './operationValidation';

describe('the vector file itself', () => {
  it('is version 1 and has all three sections populated', () => {
    expect(vectors.version).toBe(1);
    expect(vectors.operationValidation.length).toBeGreaterThanOrEqual(40);
    expect(vectors.canonicalSigning.length).toBeGreaterThanOrEqual(3);
    expect(vectors.envelope.length).toBeGreaterThanOrEqual(5);
  });

  it('covers every one of the closed twelve operations', () => {
    const covered = new Set(vectors.operationValidation.map((vector) => vector.operation));
    for (const operation of [
      'getOverview',
      'listBookings',
      'listPayments',
      'listInvoices',
      'listReconciliation',
      'getMonthlyReport',
      'getReport',
      'listVouchers',
      'listMembers',
      'listActivity',
      'listAlerts',
      'getSettings',
    ]) {
      expect(covered.has(operation), operation).toBe(true);
    }
  });

  it('contains no key material, token, host or real identifier', () => {
    const text = JSON.stringify(vectors);
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toMatch(/heinersreuth/i);
    expect(text).not.toMatch(/[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,}/i);
    expect(text).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  });
});

describe('operation validation vectors', () => {
  for (const vector of vectors.operationValidation) {
    it(`${vector.expect}s: ${vector.name}`, () => {
      if (!isCqgw1Operation(vector.operation)) {
        // An operation outside the closed twelve can only be a reject vector.
        expect(vector.expect).toBe('reject');
        return;
      }
      const result = validateOperationQuery(vector.operation, vector.query);
      expect(result.ok, JSON.stringify(result)).toBe(vector.expect === 'accept');
    });
  }
});

describe('canonical signing vectors', () => {
  for (const vector of vectors.canonicalSigning) {
    it(`reproduces the canonical string for: ${vector.name}`, async () => {
      expect(vector.path).toBe(CQGW1_CANONICAL_PATH);

      const canonicalBody = canonicalJson(vector.body);
      expect(canonicalBody).toBe(vector.canonicalBody);

      const bodySha256Hex = await sha256Hex(utf8Bytes(canonicalBody));
      expect(bodySha256Hex).toBe(vector.bodySha256Hex);

      const canonical = buildCanonicalString({
        method: vector.method,
        path: vector.path,
        keyId: vector.keyId,
        timestamp: vector.timestamp,
        requestId: vector.requestId,
        operation: vector.operation as Cqgw1Operation,
        bodySha256Hex,
      });
      expect(canonical).toBe(vector.canonicalString);
    });
  }

  it('signs and verifies a vector end to end with a locally generated key', async () => {
    const { privateKey, publicKey } = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;
    const vector = vectors.canonicalSigning[0];
    const bytes = utf8Bytes(vector.canonicalString);
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, bytes);
    await expect(
      crypto.subtle.verify({ name: 'Ed25519' }, publicKey, signature, bytes),
    ).resolves.toBe(true);

    // One flipped byte in the canonical string is a failed verification.
    const tampered = utf8Bytes(vector.canonicalString.replace('listBookings', 'listPayments'));
    await expect(
      crypto.subtle.verify({ name: 'Ed25519' }, publicKey, signature, tampered),
    ).resolves.toBe(false);
  });
});

describe('envelope vectors', () => {
  const requestId = 'conformanceVector0002';
  const operation: Cqgw1Operation = 'getSettings';

  for (const vector of vectors.envelope) {
    it(`${vector.expect}s: ${vector.name}`, async () => {
      const response = new Response(JSON.stringify(vector.value), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const promise = readGatewayEnvelope({
        response,
        requestId,
        operation,
        validateResult: (_operation, result) => result,
      });
      if (vector.expect === 'accept') {
        await expect(promise).resolves.toBeDefined();
      } else {
        await expect(promise).rejects.toBeInstanceOf(GatewayResponseError);
      }
    });
  }
});
