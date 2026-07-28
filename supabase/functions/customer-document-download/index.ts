// Supabase Edge Function: customer document download. SOURCE ONLY — NOT DEPLOYED by this task.
//
// Purpose: the ONLY route by which an authenticated customer obtains bytes for a
// customer document. Customers hold no Storage policy on either bucket, so this
// function is the sole path — there is no parallel client-side download.
//
// SECURITY
// - SUPABASE_SERVICE_ROLE_KEY is a FUNCTION SECRET, read via Deno.env only. It never
//   ships to the browser.
// - The caller's identity comes from verifying THEIR JWT (auth.getUser with the anon
//   client), never from a request field. The verified id is then passed explicitly to
//   authorize_customer_document_download, which is granted to service_role only —
//   so a browser cannot call it directly and read object paths out of the response.
// - Every denial reason collapses to one 404 body, so document existence never leaks.
// - The signed URL is scoped to a single object and expires in 10 minutes. A signed
//   URL does not re-check Storage RLS on use (that is inherent to signed URLs); the
//   guard is that it is only minted after the server-side membership + visibility
//   check above. Accepted residual risk: an already-issued URL remains usable for its
//   remaining TTL if visibility is revoked immediately afterwards.
// - The response body carries the URL and its lifetime only — never bucket or path.
//
// All decision logic lives in ./handler.ts so it can be executed under test with
// fakes; this file only wires real clients into that handler.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { handleDownloadRequest, type DownloadDeps } from './handler.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const service = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const deps: DownloadDeps = {
    // Identity is established by verifying the caller's own JWT — never trusted
    // from the request body.
    verifyJwt: async (token) => {
      const { data, error } = await anon.auth.getUser(token);
      if (error || !data?.user?.id) return null;
      return data.user.id;
    },

    authorize: async (callerId, documentId) => {
      const { data, error } = await service.rpc('authorize_customer_document_download', {
        p_caller_id: callerId,
        p_document_id: documentId,
      });
      if (error) return null;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.bucket_id || !row?.object_path) return null;
      return { bucketId: row.bucket_id, objectPath: row.object_path };
    },

    mintSignedUrl: async (bucketId, objectPath, expiresIn) => {
      const { data, error } = await service.storage.from(bucketId).createSignedUrl(objectPath, expiresIn);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },

    recordEvent: async (callerId, documentId, eventType) => {
      // Audit failures must not deny a legitimate download; they are logged only.
      const { error } = await service.rpc('record_customer_document_access', {
        p_caller_id: callerId,
        p_document_id: documentId,
        p_event_type: eventType,
      });
      if (error) console.error('customer-document-download: audit insert failed', error.message);
    },
  };

  let documentId: unknown = null;
  try {
    const body = await req.json();
    documentId = body?.document_id;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const result = await handleDownloadRequest(deps, {
    authorizationHeader: req.headers.get('authorization'),
    documentId,
  });

  return json(result.body, result.status);
});
