// EXECUTABLE tests for the customer document upload / retire Edge Function handler.
//
// Proves the controlled server-side flow actually behaves: MIME allow-list, size cap,
// filename sanitization, server-generated paths, verification against the STORED
// object rather than the client's claims, compensating cleanup on partial failure,
// and the publish/archive/delete lifecycle rules.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const src = read('supabase/functions/customer-document-upload/handler.ts');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const {
  handleUploadRequest, handleRetireRequest, sanitizeFilename,
  MAX_UPLOAD_BYTES, ALLOWED_CONTENT_TYPES,
} = mod;

const AUTH = 'Bearer real-jwt';
const PDF = 'application/pdf';

const ORG_A = '11111111-1111-1111-1111-111111111111';
const ORG_B = '33333333-3333-3333-3333-333333333333';
const PROJ_A = '22222222-2222-2222-2222-222222222222';

function makeDeps(overrides = {}) {
  const calls = { upload: [], stat: [], remove: [], register: [], archive: [], delete: [], logError: [] };
  const deps = {
    randomId: () => 'fixed-random-id',
    verifyJwt: async () => 'admin-1',
    isPlatformAdmin: async () => true,
    // Defaults model a consistent, existing org/project pair: project PROJ_A belongs to ORG_A.
    resolveProjectOrganization: async (projectId) => (projectId === PROJ_A ? ORG_A : null),
    organizationExists: async (organizationId) => organizationId === ORG_A,
    uploadObject: async (path, file, contentType) => { calls.upload.push([path, file, contentType]); return true; },
    statObject: async (path) => { calls.stat.push([path]); return { size: 1024, contentType: PDF }; },
    removeObject: async (path) => { calls.remove.push([path]); return true; },
    registerDocument: async (input) => { calls.register.push([input]); return 'doc-new'; },
    archiveDocument: async (callerId, id) => { calls.archive.push([callerId, id]); return true; },
    deleteUnpublishedDocument: async (callerId, id) => { calls.delete.push([callerId, id]); return 'org/p/file.pdf'; },
    logError: (context, error) => { calls.logError.push([context, error]); },
    ...overrides,
  };
  return { deps, calls };
}

function uploadRequest(overrides = {}) {
  return {
    authorizationHeader: AUTH,
    organizationId: ORG_A,
    projectId: PROJ_A,
    category: 'concept',
    title: 'Konzept',
    filename: 'Mein Konzept.pdf',
    contentType: PDF,
    file: { size: 1024 },
    ...overrides,
  };
}

// ---------------------------------------------------------------- filename sanitization
ok(sanitizeFilename('Mein Konzept.pdf', PDF) === 'mein-konzept.pdf', 'spaces become hyphens, extension from MIME');
ok(sanitizeFilename('../../etc/passwd', PDF) === 'passwd.pdf', 'path traversal is stripped to a bare name');
ok(sanitizeFilename('report.pdf.exe', PDF) === 'report.pdf.pdf',
  'a double extension cannot smuggle .exe: the extension comes from the validated MIME');
ok(sanitizeFilename('', PDF) === 'dokument.pdf', 'an empty name falls back to a safe default');
ok(!sanitizeFilename('Ünïcødé Ätzend!.pdf', PDF).match(/[^a-z0-9.\-_]/),
  'unicode and punctuation are reduced to a safe slug');
ok(sanitizeFilename('a'.repeat(300) + '.pdf', PDF).length <= 65, 'very long names are truncated');
ok(sanitizeFilename('x.png', 'image/png') === 'x.png', 'png keeps its correct extension');

// ---------------------------------------------------------------- happy path
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 201, 'valid upload returns 201');
  ok(res.body.document_id === 'doc-new', 'the new document id is returned');
  ok(res.body.customer_visible === false,
    'uploads start UNPUBLISHED so nothing reaches a customer by accident');

  const [path] = calls.upload[0];
  ok(path === `${ORG_A}/${PROJ_A}/fixed-random-id-mein-konzept.pdf`,
    `path is server-generated from org/project/random/slug (got ${path})`);
  ok(calls.remove.length === 0, 'no cleanup on a successful upload');
}
{
  // Organization-level upload (no project) lands in the _org folder.
  const { deps, calls } = makeDeps();
  await handleUploadRequest(deps, uploadRequest({ projectId: null }));
  ok(calls.upload[0][0] === `${ORG_A}/_org/fixed-random-id-mein-konzept.pdf`,
    'project-less uploads use the _org folder');
}

// ---------------------------------------------------------------- authz
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ authorizationHeader: null }));
  ok(res.status === 401, 'missing auth -> 401');
  ok(calls.upload.length === 0, 'missing auth: nothing uploaded');
}
{
  const { deps, calls } = makeDeps({ isPlatformAdmin: async () => false });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 403, 'non-admin caller -> 403');
  ok(calls.upload.length === 0, 'non-admin: nothing uploaded');
  ok(calls.register.length === 0, 'non-admin: nothing registered');
}

// ---------------------------------------------------------------- validation
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ contentType: 'application/x-msdownload' }));
  ok(res.status === 415, 'disallowed MIME -> 415');
  ok(calls.upload.length === 0, 'disallowed MIME: nothing written to storage');
}
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ file: { size: MAX_UPLOAD_BYTES + 1 } }));
  ok(res.status === 413, 'oversized file -> 413');
  ok(calls.upload.length === 0, 'oversized file: nothing written to storage');
}
ok(MAX_UPLOAD_BYTES === 26214400, 'the size cap is 25 MB');
ok(ALLOWED_CONTENT_TYPES.length === 5 && ALLOWED_CONTENT_TYPES.includes(PDF), 'the MIME allow-list is explicit');
for (const category of ['offer', 'acceptance', 'invoice']) {
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ category }));
  ok(res.status === 400, `raw upload cannot claim the reserved category "${category}"`);
  ok(calls.upload.length === 0, `reserved category "${category}": nothing uploaded`);
}
for (const [label, patch] of [
  ['missing organization', { organizationId: '' }],
  ['missing category', { category: '' }],
  ['blank title', { title: '   ' }],
  ['missing file', { file: null }],
]) {
  const { deps } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest(patch));
  ok(res.status === 400, `${label} -> 400`);
}

// ---------------------------------------------------------------- upload target validation
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ organizationId: 'not-a-uuid' }));
  ok(res.status === 400 && res.body.error === 'invalid_organization_id',
    'a malformed organization id is rejected before any lookup or storage call');
  ok(calls.upload.length === 0, 'malformed organization id: nothing uploaded');
}
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ organizationId: '../../../etc/passwd' }));
  ok(res.status === 400 && res.body.error === 'invalid_organization_id',
    'a path-traversal organization id is rejected before any storage call');
  ok(calls.upload.length === 0, 'traversal attempt: nothing uploaded');
}
{
  const { deps, calls } = makeDeps();
  const res = await handleUploadRequest(deps, uploadRequest({ projectId: 'not-a-uuid' }));
  ok(res.status === 400 && res.body.error === 'invalid_project_id', 'a malformed project id is rejected');
  ok(calls.upload.length === 0, 'malformed project id: nothing uploaded');
}
{
  // Project id is well-formed but does not exist.
  const { deps, calls } = makeDeps({ resolveProjectOrganization: async () => null });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 400 && res.body.error === 'project_not_found',
    'a project id that does not resolve to any project is rejected');
  ok(calls.upload.length === 0, 'unresolvable project: nothing uploaded');
}
{
  // Project exists but belongs to a DIFFERENT organization than the client claimed.
  const { deps, calls } = makeDeps({ resolveProjectOrganization: async () => ORG_B });
  const res = await handleUploadRequest(deps, uploadRequest({ organizationId: ORG_A, projectId: PROJ_A }));
  ok(res.status === 400 && res.body.error === 'project_organization_mismatch',
    'a project/organization mismatch is rejected rather than silently filed under the wrong tenant');
  ok(calls.upload.length === 0, 'mismatched project/organization: nothing uploaded');
}
{
  // No project supplied: the organization itself must exist.
  const { deps, calls } = makeDeps({ organizationExists: async () => false });
  const res = await handleUploadRequest(deps, uploadRequest({ projectId: null }));
  ok(res.status === 400 && res.body.error === 'organization_not_found',
    'an organization-level upload against a nonexistent organization is rejected');
  ok(calls.upload.length === 0, 'nonexistent organization: nothing uploaded');
}
{
  // The project's resolved organization is what gets used server-side -- never the
  // raw client value -- even though in this case they happen to agree.
  const { deps, calls } = makeDeps();
  await handleUploadRequest(deps, uploadRequest());
  const [input] = calls.register[0];
  ok(input.organizationId === ORG_A,
    'the SERVER-RESOLVED (project-authoritative) organization id is what gets registered');
}

// ---------------------------------------------------------------- stored object is the source of truth
{
  // Client claims 1 KB but the stored object is oversized: reject AND clean up.
  const { deps, calls } = makeDeps({
    statObject: async () => ({ size: MAX_UPLOAD_BYTES + 5000, contentType: PDF }),
  });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 415, 'a stored object exceeding the cap is rejected despite a small declared size');
  ok(calls.remove.length === 1, 'the rejected object is removed from storage');
  ok(calls.register.length === 0, 'no metadata row is created for a rejected object');
}
{
  // Stored MIME differs from the declared one and is not allowed.
  const { deps, calls } = makeDeps({
    statObject: async () => ({ size: 100, contentType: 'application/x-msdownload' }),
  });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 415, 'a stored object with a disallowed real MIME is rejected');
  ok(calls.remove.length === 1, 'the mismatched object is removed');
}
{
  const { deps, calls } = makeDeps({ statObject: async () => ({ size: 4096, contentType: PDF }) });
  await handleUploadRequest(deps, uploadRequest({ file: { size: 1 } }));
  const [input] = calls.register[0];
  ok(input.sizeBytes === 4096, 'the VERIFIED size is persisted, not the declared one');
  ok(input.contentType === PDF, 'the VERIFIED content type is persisted');
  ok(input.callerId === 'admin-1', 'the verified caller is recorded as the uploader');
}
{
  const { deps, calls } = makeDeps({ statObject: async () => null });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 502, 'an unverifiable upload -> 502');
  ok(calls.remove.length === 1, 'an unverifiable object is cleaned up');
}

// ---------------------------------------------------------------- compensation on partial failure
{
  const { deps, calls } = makeDeps({
    registerDocument: async () => { throw new Error('duplicate key value violates constraint customer_documents_pkey'); },
  });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 500, 'a failed registration -> 500');
  ok(calls.remove.length === 1 && calls.remove[0][0] === calls.upload[0][0],
    'the orphaned object is removed when registration fails (no bytes without metadata)');
  ok(res.body.error === 'registration_failed' && !('detail' in res.body) && !JSON.stringify(res.body).includes('constraint'),
    'the browser gets only a stable generic code, never the raw DB error text');
  ok(calls.logError.length === 1 && calls.logError[0][0] === 'registration_failed'
    && /constraint/.test(String(calls.logError[0][1]?.message ?? calls.logError[0][1])),
    'the real error is captured server-side via logError so it is not silently lost');
}
{
  const { deps, calls } = makeDeps({ uploadObject: async () => false });
  const res = await handleUploadRequest(deps, uploadRequest());
  ok(res.status === 502, 'a failed storage write -> 502');
  ok(calls.register.length === 0, 'no metadata row when the write itself failed');
}

// ---------------------------------------------------------------- retire: archive
{
  const { deps, calls } = makeDeps();
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1', mode: 'archive' });
  ok(res.status === 200 && res.body.archived === true, 'archive succeeds');
  ok(calls.remove.length === 0, 'archival never deletes the stored bytes');
  ok(calls.delete.length === 0, 'archival does not go through the delete path');
}

// ---------------------------------------------------------------- retire: delete
{
  const { deps, calls } = makeDeps();
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1', mode: 'delete' });
  ok(res.status === 200 && res.body.deleted === true, 'deleting a never-published document succeeds');
  ok(calls.delete.length === 1, 'deletion goes through the guarded RPC');
  ok(calls.remove.length === 1 && calls.remove[0][0] === 'org/p/file.pdf',
    'the owned storage object is cleaned up after the metadata row is gone');
  ok(res.body.storage_cleanup === 'ok', 'cleanup status is reported');
}
{
  // A published document: the RPC refuses, so no storage removal may happen.
  const { deps, calls } = makeDeps({
    deleteUnpublishedDocument: async () => { throw new Error('document has been published: constraint violated'); },
  });
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1', mode: 'delete' });
  ok(res.status === 409, 'deleting a published document -> 409');
  ok(calls.remove.length === 0, 'a refused deletion never removes the stored bytes');
  ok(res.body.error === 'delete_rejected' && !('detail' in res.body) && !JSON.stringify(res.body).includes('constraint'),
    'the browser gets only a stable generic code, never the raw RPC error text');
  ok(calls.logError.length === 1 && calls.logError[0][0] === 'delete_rejected',
    'the real deletion-rejection error is captured server-side via logError');
}
{
  // Pointer rows own no bytes: nothing to clean up.
  const { deps, calls } = makeDeps({ deleteUnpublishedDocument: async () => null });
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-ptr', mode: 'delete' });
  ok(res.status === 200, 'deleting a pointer row succeeds');
  ok(calls.remove.length === 0, 'a pointer row never triggers a storage delete (the canonical PDF is untouched)');
}
{
  const { deps, calls } = makeDeps({ removeObject: async () => false });
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1', mode: 'delete' });
  ok(res.status === 200 && res.body.storage_cleanup === 'failed',
    'a storage cleanup failure is reported honestly rather than hidden');
}
{
  const { deps } = makeDeps({ isPlatformAdmin: async () => false });
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1', mode: 'archive' });
  ok(res.status === 403, 'non-admin cannot retire a document');
}
{
  const { deps } = makeDeps();
  const res = await handleRetireRequest(deps, { authorizationHeader: AUTH, documentId: 'doc-1', mode: 'nonsense' });
  ok(res.status === 400, 'an unknown retire mode -> 400');
}

// ---------------------------------------------------------------- entrypoint wiring
{
  const index = read('supabase/functions/customer-document-upload/index.ts');
  ok(/handleUploadRequest/.test(index) && /handleRetireRequest/.test(index), 'the entrypoint delegates to tested handlers');
  ok(/is_platform_admin_as/.test(index), 'admin status is checked through the service_role RPC');
  ok(/register_customer_document_from_upload/.test(index), 'registration uses the service_role RPC');
  ok(/getSupabaseSecretKey\(\)/.test(index), 'the service role key is read via the shared getSupabaseSecretKey() helper');
  ok(!/Deno\.env\.get\('SUPABASE_/.test(index), 'no reserved SUPABASE_ env var is read directly (that prefix is rejected by supabase secrets set)');
  ok(/crypto\.randomUUID\(\)/.test(index), 'storage paths use a server-generated random id');
  ok(/resolveProjectOrganization/.test(index) && /customer_projects/.test(index),
    'the authoritative organization is resolved server-side from the project');
  ok(/organizationExists/.test(index) && /from\('organizations'\)/.test(index),
    'organization existence is checked server-side');
  ok(/logError/.test(index) && /console\.error/.test(index),
    'errors are logged server-side rather than returned to the browser');
}

if (failures) { console.error(`\ncustomer document upload handler tests: ${failures} FAILED`); process.exit(1); }
console.log('\ncustomer document upload handler tests: ALL PASSED');
