// Pure request handler for the customer document download Edge Function.
//
// Deliberately free of Supabase client construction and of Deno globals: every
// external effect arrives through `deps`. That makes the ACTUAL control flow
// executable in a plain Node test with fakes and spies, so we can prove — rather
// than grep for — that the function verifies the JWT before authorizing, that all
// denial reasons return one indistinguishable 404, that the response body carries
// no bucket or object path, and that the signed URL is requested with the intended
// expiry.

export const SIGNED_URL_TTL_SECONDS = 600;

export interface AuthorizedObject {
  bucketId: string;
  objectPath: string;
}

export interface DownloadDeps {
  /** Resolve the bearer token to a user id. Returns null for missing/invalid tokens. */
  verifyJwt: (token: string) => Promise<string | null>;
  /**
   * Server-side authorization. Must return null for EVERY denial reason
   * (cross-organization, suspended membership, not visible, archived, missing),
   * so the handler cannot accidentally distinguish them to the caller.
   */
  authorize: (callerId: string, documentId: string) => Promise<AuthorizedObject | null>;
  mintSignedUrl: (bucketId: string, objectPath: string, expiresIn: number) => Promise<string | null>;
  recordEvent: (callerId: string, documentId: string, eventType: 'url_issued') => Promise<void>;
}

export interface DownloadRequest {
  authorizationHeader: string | null;
  documentId: unknown;
}

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
}

// One body for every denial: a caller must not be able to tell "not yours" from
// "does not exist" from "not published yet".
const NOT_FOUND: HandlerResult = {
  status: 404,
  body: { error: 'document_not_found' },
};

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export async function handleDownloadRequest(
  deps: DownloadDeps,
  request: DownloadRequest,
): Promise<HandlerResult> {
  const token = bearerToken(request.authorizationHeader);
  if (!token) {
    return { status: 401, body: { error: 'authentication_required' } };
  }

  const callerId = await deps.verifyJwt(token);
  if (!callerId) {
    return { status: 401, body: { error: 'authentication_required' } };
  }

  const documentId = typeof request.documentId === 'string' ? request.documentId.trim() : '';
  if (!documentId) {
    return { status: 400, body: { error: 'document_id_required' } };
  }

  const authorized = await deps.authorize(callerId, documentId);
  if (!authorized) {
    return NOT_FOUND;
  }

  const url = await deps.mintSignedUrl(
    authorized.bucketId,
    authorized.objectPath,
    SIGNED_URL_TTL_SECONDS,
  );
  if (!url) {
    return { status: 502, body: { error: 'download_link_unavailable' } };
  }

  // Audited AFTER a URL actually exists. The event is named for what happened —
  // a URL was issued — not for a view or download, which we cannot observe.
  await deps.recordEvent(callerId, documentId, 'url_issued');

  // The response deliberately contains ONLY the signed URL and its lifetime.
  // bucketId and objectPath never leave the server.
  return { status: 200, body: { url, expires_in: SIGNED_URL_TTL_SECONDS } };
}
