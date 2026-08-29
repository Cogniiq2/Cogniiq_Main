// Structural regression tests for two owner-side defects found in hosted QA:
//
//  1. UPLOAD UI MISSING. uploadCustomerDocument() existed but no shipped Owner UI
//     called it — owners could view/publish already-registered documents but
//     could not upload one. This locks in the upload dialog: it requires project,
//     category, title and file; shows the allowed MIME types and the 25 MiB
//     limit; goes ONLY through uploadCustomerDocument() (never Storage directly);
//     uploaded documents start unpublished; a success reloads the list and still
//     requires the explicit "Freigeben" action; failures render a retry state.
//
//  2. INTEGRATION POINT MISSING. Canonical portal customers live under
//     /admin/clients (organizations/client_accounts). CustomerProjectPanel was
//     only wired into the separate Owner Finance owner_customers detail page, so
//     real portal customers with no owner_customers row (e.g. Pankofer) had no
//     reachable project management UI at all, and the CRM "Kunden & Aufgaben"
//     screen looked broken (empty) instead of explaining what it actually is.
//     This locks in: the /admin/clients/:organizationId "Kundenportal" tab,
//     organization-scoped project creation with no owner_customers dependency,
//     and the explanatory empty state on the CRM screen.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const panel = read('src/components/finance/CustomerProjectPanel.tsx');
const api = read('src/lib/customerPlatform/ownerProjectsApi.ts');
const clientDetail = read('src/pages/admin/clients/ClientDetailPage.tsx');
const customersPage = read('src/pages/owner/CustomersPage.tsx');
const customerDetailPage = read('src/pages/owner/CustomerDetailPage.tsx');
const migration = read('supabase/migrations/20260730120000_customer_project_organization_scope.sql');
const handler = read('supabase/functions/customer-document-upload/handler.ts');

// ---------------------------------------------------------------- 1) upload UI
ok(/function UploadDocumentDialog/.test(panel), 'CustomerProjectPanel defines an upload dialog component');
ok(/Dokument hochladen/.test(panel), 'panel exposes a "Dokument hochladen" action');
ok(/uploadCustomerDocument\(/.test(panel), 'the dialog calls uploadCustomerDocument()');
ok(!/supabase\.storage/.test(panel), 'the panel never touches supabase.storage directly (server-side flow only)');
ok(!/\.storage\.from\(/.test(api), 'ownerProjectsApi never touches Storage directly either');

// Required fields: project, category, title, file.
ok(/id="doc-project"[\s\S]{0,200}required/.test(panel), 'upload dialog requires a project');
ok(/id="doc-category"[\s\S]{0,200}required/.test(panel), 'upload dialog requires a category');
ok(/id="doc-title"[\s\S]{0,80}required/.test(panel), 'upload dialog requires a title');
ok(/type="file"[\s\S]{0,400}Datei <span className="text-red-500">\*<\/span>/.test(panel) || /Datei <span className="text-red-500">\*<\/span>/.test(panel),
  'upload dialog marks the file input as required');
ok(/canSubmit = Boolean\(projectId\) && Boolean\(category\) && title\.trim\(\)\.length > 0\s*\n\s*&& Boolean\(file\)/.test(panel),
  'submit is gated on project, category, title AND file all being present');

// MIME types + size limit shown, sourced from the one place that mirrors the Edge Function.
ok(/CUSTOMER_UPLOAD_MAX_BYTES/.test(panel) && /CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES/.test(panel),
  'upload dialog sources its limits from the shared constants (not a re-typed copy)');
ok(/Erlaubte Dateitypen/.test(panel), 'upload dialog shows the allowed file types to the owner');
ok(/MAX_SIZE_MIB/.test(panel) && /CUSTOMER_UPLOAD_MAX_BYTES \/ \(1024 \* 1024\)/.test(panel),
  'upload dialog derives the displayed size limit from the real byte constant, not a hardcoded number');

// Unpublished by default + explicit Freigeben still required.
ok(/noch NICHT für den Kunden sichtbar|starten unveröffentlicht/.test(panel),
  'upload dialog tells the owner the document is not yet customer-visible');
ok(/Geben Sie es über „Freigeben“ frei/.test(panel), 'success path still requires the explicit "Freigeben" action');
ok(/onUploaded[\s\S]{0,120}void load\(\)/.test(panel), 'a successful upload reloads the document list');

// Retry / error state: the dialog keeps the form and shows the failure with a retry affordance.
ok(/setError\(uploadError\)/.test(panel), 'a failed upload surfaces the specific error message');
ok(/error \? 'Erneut versuchen' : 'Hochladen'/.test(panel), 'the submit button becomes an explicit retry after a failure');
ok(/InfoBanner tone="danger" title="Upload fehlgeschlagen"/.test(panel), 'upload failure renders a visible error banner');

// Client-side type/size pre-check, so an obviously invalid file is caught before a round trip.
ok(/typeAllowed = !file \|\| \(CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES/.test(panel), 'dialog pre-validates the file type');
ok(/sizeAllowed = !file \|\| file\.size <= CUSTOMER_UPLOAD_MAX_BYTES/.test(panel), 'dialog pre-validates the file size');

// Server-side error codes (wrong type, oversized, org/project mismatch) are translated, not raw.
for (const code of ['unsupported_content_type', 'file_too_large', 'project_organization_mismatch', 'organization_not_found']) {
  ok(new RegExp(`case '${code}':`).test(api), `uploadCustomerDocument translates the "${code}" Edge Function error code`);
}
ok(/FunctionsHttpError/.test(api), 'ownerProjectsApi extracts the structured error body from a FunctionsHttpError');

// The dialog's category list must never include the owner-reserved ones the Edge
// Function refuses (offer/acceptance/invoice) — those come only from publishing a
// canonical document, never a raw upload.
ok(/CUSTOMER_UPLOAD_CATEGORIES: CustomerDocumentCategory\[\] = \[/.test(api), 'a dedicated upload-category allow-list exists');
for (const reserved of ['offer', 'acceptance', 'invoice']) {
  const listMatch = /CUSTOMER_UPLOAD_CATEGORIES: CustomerDocumentCategory\[\] = \[([\s\S]*?)\];/.exec(api)?.[1] ?? '';
  ok(!new RegExp(`'${reserved}'`).test(listMatch), `owner-reserved category "${reserved}" is excluded from the upload dialog's choices`);
}
ok(new RegExp(`OWNER_RESERVED_CATEGORIES = \\['offer', 'acceptance', 'invoice'\\]`).test(handler),
  'the Edge Function itself still rejects the owner-reserved categories (frontend exclusion is defence in depth, not the boundary)');

// ---------------------------------------------------------------- 2) integration point
ok(/'Kundenportal'/.test(clientDetail), '/admin/clients/:organizationId defines a "Kundenportal" tab');
ok(/function PortalTab/.test(clientDetail), 'ClientDetailPage renders a dedicated Kundenportal tab component');
ok(/<CustomerProjectPanel[\s\S]{0,120}organizationId=\{detail\.organizationId\}/.test(clientDetail),
  'the Kundenportal tab scopes CustomerProjectPanel directly by organizationId');
ok(!/PortalTab[\s\S]{0,400}ownerCustomerId/.test(clientDetail),
  'the Kundenportal tab never supplies an ownerCustomerId (no owner_customers row required)');

// ownerCustomerId is now optional on the panel, and CreateProjectDialog branches accordingly.
ok(/ownerCustomerId\?: string \| null/.test(panel), 'CustomerProjectPanel makes ownerCustomerId optional');
ok(/createCustomerProjectForOrganization/.test(panel), 'panel can create a project via the organization-scoped path');
ok(/ownerCustomerId\s*\n\s*\? await createCustomerProject\(/.test(panel),
  'project creation still uses the owner_customers-scoped RPC when ownerCustomerId is supplied (Owner Finance page unaffected)');

// The Owner Finance customer detail page usage is untouched (still passes ownerCustomerId).
ok(/<CustomerProjectPanel[\s\S]{0,120}ownerCustomerId=\{c\.id\}/.test(customerDetailPage),
  'Owner Finance CustomerDetailPage still wires ownerCustomerId (its existing CRM-scoped path)');

// New migration: organization-scoped RPC, admin-gated, no owner_customers dependency,
// never touches owner_customers as a side effect, pinned empty search_path.
ok(/create or replace function public\.create_customer_project_for_organization/.test(migration),
  'new migration adds create_customer_project_for_organization');
ok(/is_platform_admin\(\)/.test(migration), 'new RPC is owner/admin-gated');
ok(/not exists \(select 1 from public\.organizations o where o\.id = p_organization_id\)/.test(migration),
  'new RPC validates the organization exists (tenant validation)');
// Comments are allowed to explain the RELATIONSHIP to owner_customers (why it's
// not needed); the actual SQL statements must never reference the table.
const migrationCode = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
ok(!/owner_customers/.test(migrationCode), 'new migration\'s SQL statements never reference owner_customers (no dependency, no backfill, no merge)');
ok(/set search_path = ''/.test(migration), 'new RPC pins an empty search_path');
ok(/revoke all on function public\.create_customer_project_for_organization/.test(migration)
  && /grant execute on function public\.create_customer_project_for_organization[\s\S]*to authenticated/.test(migration),
  'new RPC has explicit revoke-then-grant privileges');
ok(/^begin;/m.test(migration) && /^commit;/m.test(migration), 'new migration is transactional');

// Existing migrations 20260728120000-20260728124000 (already applied to hosted Supabase) untouched.
for (const existing of [
  '20260728120000_customer_project_core',
  '20260728121000_customer_documents',
  '20260728122000_customer_billing_link',
  '20260728123000_owner_invoice_organization_assignment',
  '20260728124000_customer_document_archive_service_role',
]) {
  ok(!new RegExp(`create_customer_project_for_organization`).test(read(`supabase/migrations/${existing}.sql`)),
    `${existing} was not modified to add the new RPC (it lives in a new forward-only migration instead)`);
}

// The empty "Kunden & Aufgaben" screen explains itself and links to the canonical list.
// Post canonical-customer consolidation (feat(admin): one canonical customer, and deletion
// that respects the books): owner_customers IS the canonical commercial customer — CRM and
// Finance read the same row, there is no second dataset to synchronise. The copy must say so.
ok(/derselbe Datensatz/.test(customersPage),
  'empty CustomersPage screen explains Finance/CRM share the same canonical customer record');
ok(/navigate\('\/admin\/clients'\)/.test(customersPage),
  'empty CustomersPage screen links to the canonical /admin/clients customer list');

console.log('');
console.log(failures === 0 ? 'owner customer-portal integration tests: ALL PASSED' : `owner customer-portal integration tests: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
