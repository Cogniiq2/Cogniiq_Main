// Supabase Edge Function: customer document upload + retire. SOURCE ONLY — NOT DEPLOYED by this task.
//
// The ONE controlled server-side flow for putting bytes into the private
// 'customer-documents' bucket and for taking them out again. The browser never
// talks to Storage directly for customer documents: customers hold no policy at all,
// and internal staff go through here so that upload+registration (and delete+cleanup)
// can never half-succeed.
//
// SECURITY
// - The service-role (secret) key is read from the environment the Edge Function
//   runtime already provides automatically at deploy time — see ../_shared/env.ts.
//   It is never logged, never returned in any response, and never ships to the browser.
// - The caller is identified by verifying THEIR JWT, then checked with
//   is_platform_admin_as (service_role only). No role claim is read from the request.
// - The storage path is generated server-side from the organization/project ids plus
//   a random id; the client filename is sanitized and its extension is derived from
//   the VALIDATED content type, never from the supplied name.
// - MIME allow-list and a 25 MB cap are enforced before the write, and the persisted
//   size/content-type are read back from the stored object rather than trusted.
// - Uploaded documents start unpublished; visibility is a separate explicit action.
//
// Decision logic lives in ./handler.ts so it is executable under test.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from '../_shared/env.ts';
import { handleUploadRequest, handleRetireRequest } from './handler.ts';

interface StorageListEntry {
  name: string;
  metadata?: { size?: number; mimetype?: string };
}

interface RegisterDocumentInput {
  callerId: string;
  organizationId: string;
  projectId: string | null;
  category: string;
  title: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
}

const SUPABASE_URL = getSupabaseUrl();
const SERVICE_ROLE = getSupabaseSecretKey();
const ANON_KEY = getSupabasePublishableKey();
const BUCKET = 'customer-documents';

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

function buildDeps() {
  const service = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    randomId: () => crypto.randomUUID(),

    verifyJwt: async (token: string) => {
      const { data, error } = await anon.auth.getUser(token);
      if (error || !data?.user?.id) return null;
      return data.user.id;
    },

    isPlatformAdmin: async (callerId: string) => {
      const { data, error } = await service.rpc('is_platform_admin_as', { target_user_id: callerId });
      return !error && data === true;
    },

    // Server-side resolution of the AUTHORITATIVE organization for a given project id,
    // rather than trusting the client-supplied organization id. Returns null when the
    // project does not exist so the handler can reject before touching Storage.
    resolveProjectOrganization: async (projectId: string) => {
      const { data, error } = await service
        .from('customer_projects')
        .select('organization_id')
        .eq('id', projectId)
        .maybeSingle();
      if (error || !data) return null;
      return data.organization_id as string;
    },

    organizationExists: async (organizationId: string) => {
      const { data, error } = await service
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .maybeSingle();
      return !error && !!data;
    },

    // Full error detail is logged server-side only; the browser never sees it.
    logError: (context: string, error: unknown) => {
      console.error(`customer-document-upload: ${context}`, error instanceof Error ? error.message : error);
    },

    uploadObject: async (path: string, file: Blob, contentType: string) => {
      const { error } = await service.storage.from(BUCKET).upload(path, file, {
        contentType,
        upsert: false,
      });
      return !error;
    },

    // Read the ACTUAL stored object back so persisted metadata reflects reality
    // rather than what the client claimed.
    statObject: async (path: string) => {
      const slash = path.lastIndexOf('/');
      const folder = slash >= 0 ? path.slice(0, slash) : '';
      const name = slash >= 0 ? path.slice(slash + 1) : path;
      const { data, error } = await service.storage.from(BUCKET).list(folder, { search: name, limit: 1 });
      const entry = (data as StorageListEntry[] | null)?.find((item) => item.name === name);
      if (error || !entry) return null;
      return {
        size: Number(entry.metadata?.size ?? 0),
        contentType: String(entry.metadata?.mimetype ?? ''),
      };
    },

    removeObject: async (path: string) => {
      const { error } = await service.storage.from(BUCKET).remove([path]);
      if (error) console.error('customer-document-upload: storage cleanup failed', error.message);
      return !error;
    },

    registerDocument: async (input: RegisterDocumentInput) => {
      const { data, error } = await service.rpc('register_customer_document_from_upload', {
        p_caller_id: input.callerId,
        p_organization_id: input.organizationId,
        p_project_id: input.projectId,
        p_category: input.category,
        p_title: input.title,
        p_storage_path: input.storagePath,
        p_content_type: input.contentType,
        p_size_bytes: input.sizeBytes,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },

    // Uses the caller-id-explicit, service_role-only RPC: `archive_customer_document()`
    // (authenticated, auth.uid()-based) would always reject a service-role call, since
    // a service-role connection has no session auth.uid(). This variant re-checks
    // is_platform_admin_as(callerId) in the database and records the VERIFIED caller
    // as the actor in the audit event, never a null/service-role actor.
    archiveDocument: async (callerId: string, documentId: string) => {
      const { error } = await service.rpc('archive_customer_document_as', {
        p_caller_id: callerId,
        p_document_id: documentId,
      });
      return !error;
    },

    deleteUnpublishedDocument: async (callerId: string, documentId: string) => {
      const { data, error } = await service.rpc('delete_unpublished_customer_document', {
        p_caller_id: callerId,
        p_document_id: documentId,
      });
      if (error) throw new Error(error.message);
      return (data as string | null) ?? null;
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const deps = buildDeps();
  const authorizationHeader = req.headers.get('authorization');
  const url = new URL(req.url);
  const isRetire = url.pathname.endsWith('/retire');

  if (isRetire) {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }
    const result = await handleRetireRequest(deps, {
      authorizationHeader,
      documentId: body?.document_id,
      mode: body?.mode,
    });
    return json(result.body, result.status);
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: 'invalid_multipart_body' }, 400); }

  const file = form.get('file') as File | null;
  const result = await handleUploadRequest(deps, {
    authorizationHeader,
    organizationId: String(form.get('organization_id') ?? ''),
    projectId: (form.get('project_id') as string | null) || null,
    category: String(form.get('category') ?? ''),
    title: String(form.get('title') ?? ''),
    filename: file?.name ?? '',
    // The declared type gates the write; the STORED type is what gets persisted.
    contentType: file?.type ?? '',
    file,
  });
  return json(result.body, result.status);
});
