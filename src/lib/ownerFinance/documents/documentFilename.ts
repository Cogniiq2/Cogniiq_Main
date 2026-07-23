// Stable, human-readable filenames for generated transactional PDFs, plus randomized,
// entity-prefixed STORAGE paths (never a public URL; the raw path is owner-only). Kept separate so
// UI download names and private storage keys are derived consistently.

import type { TransactionalDocument, TransactionalDocumentKind } from './documentModel';

const KIND_LABEL: Record<TransactionalDocumentKind, string> = { offer: 'Angebot', invoice: 'Rechnung' };

function slug(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'Dokument';
}

/** User-facing download filename, e.g. "Angebot-AN-2026-0001.pdf" or "Rechnung-Entwurf.pdf". */
export function documentFilename(doc: TransactionalDocument): string {
  const label = KIND_LABEL[doc.kind];
  const suffix = doc.documentNumber ? slug(doc.documentNumber) : 'Entwurf';
  return `${label}-${suffix}.pdf`;
}

/**
 * Randomized, entity-prefixed private storage path. A raw random component ensures the path is not
 * guessable from the resource id. NEVER expose this as a public URL — downloads must go through a
 * short-lived signed URL requested by an authorized (owner / edge-function) context.
 */
export function documentStoragePath(entityId: string, kind: TransactionalDocumentKind, version: number, randomHex: string): string {
  const rand = slug(randomHex).slice(0, 32);
  return `${slug(entityId)}/${kind}/v${version}-${rand}.pdf`;
}
