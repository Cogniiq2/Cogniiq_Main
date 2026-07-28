// Pure request handler for the customer document upload / retire Edge Function.
//
// Upload and deletion are ONE controlled server-side flow rather than two browser
// calls, because a browser doing "upload then register" (or "delete row then delete
// object") leaves orphaned files or broken metadata whenever the second call fails.
// Here the storage object and its metadata row are always reconciled: a failed
// registration triggers compensating removal of the just-uploaded object.
//
// All effects arrive through `deps` so the real control flow is executable in tests.

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Categories reserved for the canonical owner registry. A raw upload may never
// claim one — the database enforces this too, this is the friendly early rejection.
const OWNER_RESERVED_CATEGORIES = ['offer', 'acceptance', 'invoice'];

const EXTENSION_BY_CONTENT_TYPE = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

/**
 * Reduce a client-supplied filename to a safe slug. The extension is NEVER taken
 * from the client name — it is derived from the validated content type — so a
 * "report.pdf.exe" or a traversal attempt cannot influence the stored path.
 */
export function sanitizeFilename(rawName, contentType) {
  const base = String(rawName ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .pop() ?? '';
  const withoutExtension = base.replace(/\.[^.]*$/, '');
  const slug = withoutExtension
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 60)
    .toLowerCase();
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? 'bin';
  return `${slug || 'dokument'}.${extension}`;
}

/** Server-generated object path. No client input reaches it un-sanitized. */
export function buildStoragePath(deps, organizationId, projectId, filename) {
  return `${organizationId}/${projectId ?? '_org'}/${deps.randomId()}-${filename}`;
}

export async function handleUploadRequest(deps, request) {
  const token = bearerToken(request.authorizationHeader);
  if (!token) return { status: 401, body: { error: 'authentication_required' } };

  const callerId = await deps.verifyJwt(token);
  if (!callerId) return { status: 401, body: { error: 'authentication_required' } };

  // Only internal staff may publish documents into a customer workspace.
  if (!(await deps.isPlatformAdmin(callerId))) {
    return { status: 403, body: { error: 'not_authorized' } };
  }

  const { organizationId, projectId, category, title, filename, contentType, file } = request;

  if (!organizationId || typeof organizationId !== 'string') {
    return { status: 400, body: { error: 'organization_id_required' } };
  }
  if (!category || typeof category !== 'string') {
    return { status: 400, body: { error: 'category_required' } };
  }
  if (OWNER_RESERVED_CATEGORIES.includes(category)) {
    return { status: 400, body: { error: 'category_requires_canonical_document' } };
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { status: 400, body: { error: 'title_required' } };
  }
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { status: 415, body: { error: 'unsupported_content_type' } };
  }
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { status: 400, body: { error: 'file_required' } };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { status: 413, body: { error: 'file_too_large', max_bytes: MAX_UPLOAD_BYTES } };
  }

  const safeName = sanitizeFilename(filename, contentType);
  const storagePath = buildStoragePath(deps, organizationId, projectId ?? null, safeName);

  const uploaded = await deps.uploadObject(storagePath, file, contentType);
  if (!uploaded) return { status: 502, body: { error: 'upload_failed' } };

  // Trust the STORED object, not the client's declaration: size and content type are
  // read back from Storage and those verified values are what get persisted.
  const stat = await deps.statObject(storagePath);
  if (!stat) {
    await deps.removeObject(storagePath);
    return { status: 502, body: { error: 'upload_verification_failed' } };
  }
  if (stat.size > MAX_UPLOAD_BYTES || !ALLOWED_CONTENT_TYPES.includes(stat.contentType)) {
    // The object that actually landed violates policy — remove it, keep no metadata.
    await deps.removeObject(storagePath);
    return { status: 415, body: { error: 'stored_object_rejected' } };
  }

  try {
    const documentId = await deps.registerDocument({
      callerId,
      organizationId,
      projectId: projectId ?? null,
      category,
      title: title.trim(),
      storagePath,
      contentType: stat.contentType,
      sizeBytes: stat.size,
    });
    // Uploaded documents start UNPUBLISHED: an explicit publish step makes them
    // customer-visible, so nothing reaches a customer by accident.
    return { status: 201, body: { document_id: documentId, customer_visible: false } };
  } catch (error) {
    // Compensation: never leave bytes behind without owning metadata.
    await deps.removeObject(storagePath);
    return { status: 500, body: { error: 'registration_failed', detail: String(error?.message ?? error) } };
  }
}

export async function handleRetireRequest(deps, request) {
  const token = bearerToken(request.authorizationHeader);
  if (!token) return { status: 401, body: { error: 'authentication_required' } };

  const callerId = await deps.verifyJwt(token);
  if (!callerId) return { status: 401, body: { error: 'authentication_required' } };
  if (!(await deps.isPlatformAdmin(callerId))) {
    return { status: 403, body: { error: 'not_authorized' } };
  }

  const documentId = typeof request.documentId === 'string' ? request.documentId.trim() : '';
  if (!documentId) return { status: 400, body: { error: 'document_id_required' } };

  if (request.mode === 'archive') {
    // Archival never touches storage: the bytes and the audit trail are preserved.
    const archived = await deps.archiveDocument(callerId, documentId);
    if (!archived) return { status: 409, body: { error: 'archive_failed' } };
    return { status: 200, body: { document_id: documentId, archived: true } };
  }

  if (request.mode === 'delete') {
    // Permanent deletion is reserved for documents that were NEVER published. The
    // RPC re-checks this and a database trigger enforces it for any caller, so this
    // is a friendly early exit rather than the actual guarantee.
    let storagePath;
    try {
      storagePath = await deps.deleteUnpublishedDocument(callerId, documentId);
    } catch (error) {
      return { status: 409, body: { error: 'delete_rejected', detail: String(error?.message ?? error) } };
    }
    // Metadata is gone; remove the bytes it owned. A failure here leaves an orphaned
    // object rather than a dangling row — the strictly less harmful direction.
    if (storagePath) {
      const removed = await deps.removeObject(storagePath);
      if (!removed) {
        return { status: 200, body: { document_id: documentId, deleted: true, storage_cleanup: 'failed' } };
      }
    }
    return { status: 200, body: { document_id: documentId, deleted: true, storage_cleanup: 'ok' } };
  }

  return { status: 400, body: { error: 'invalid_mode' } };
}

function bearerToken(header) {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(String(header).trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}
