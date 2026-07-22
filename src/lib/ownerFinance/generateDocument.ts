// Generate + persist a transactional PDF end to end: render deterministic bytes, upload to the
// PRIVATE finance bucket at a randomized entity-prefixed path, then register an immutable generated-
// document row (with source hash + template version). Includes upload compensation: if the metadata
// RPC fails after a successful upload, the orphaned storage object is removed so no unmanaged blob
// is left behind. Downloads always go through short-lived signed URLs — never a public path.

import { secureUuid } from '@/lib/ownerFinance/api';
import {
  registerGeneratedDocument, uploadGeneratedPdf, removeStorageObject,
} from '@/lib/ownerFinance/offersApi';
import {
  documentHash, documentStoragePath, renderTransactionalPdf, validateTransactionalDocument,
  type TransactionalDocument,
} from '@/lib/ownerFinance/documents';

export interface GenerateResult {
  documentId: string | null;
  version: number | null;
  sourceHash: string;
  storagePath: string | null;
  error: string | null;
  blocked?: string[];
}

/**
 * Render, store and register a finalized document. When `requireValid` is true (final invoices),
 * generation is blocked if required fields are missing, returning the checklist instead of a file.
 */
export async function generateAndStoreDocument(
  entityId: string,
  sourceResourceId: string,
  doc: TransactionalDocument,
  opts: { requireValid?: boolean } = {},
): Promise<GenerateResult> {
  const hash = documentHash(doc);
  const validation = validateTransactionalDocument(doc);
  if (opts.requireValid && !validation.canFinalize) {
    return { documentId: null, version: null, sourceHash: hash, storagePath: null, error: 'Pflichtangaben fehlen', blocked: validation.missing };
  }

  const bytes = await renderTransactionalPdf(doc);
  const rand = secureUuid().replace(/-/g, '');
  const path = documentStoragePath(entityId, doc.kind, 1, rand);

  const up = await uploadGeneratedPdf(path, bytes);
  if (up.error) return { documentId: null, version: null, sourceHash: hash, storagePath: null, error: up.error };

  const reg = await registerGeneratedDocument({
    business_entity_id: entityId,
    document_type: doc.kind,
    source_resource_type: doc.kind === 'offer' ? 'owner_offers' : 'owner_invoices',
    source_resource_id: sourceResourceId,
    document_number: doc.documentNumber,
    status: doc.isDraft ? 'draft' : 'finalized',
    language: doc.language,
    currency: doc.currency,
    template_version: doc.templateVersion,
    source_hash: hash,
    pdf_storage_path: path,
    render_metadata: { net: doc.netTotalCents, gross: doc.grossTotalCents, lines: doc.lines.length },
  });

  if (reg.error) {
    // Compensation: remove the orphaned object so storage never diverges from metadata.
    await removeStorageObject(path).catch(() => {});
    return { documentId: null, version: null, sourceHash: hash, storagePath: null, error: `Registrierung fehlgeschlagen (Datei entfernt): ${reg.error}` };
  }
  return { documentId: reg.documentId, version: reg.version, sourceHash: hash, storagePath: path, error: null };
}
