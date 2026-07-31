// Structural regression tests for the three release blockers fixed in this change.
//
//  1. COMMERCIAL-DOCUMENT PUBLISHING UI MISSING. publishOwnerDocumentToCustomer()
//     existed but no shipped Owner UI called it, so the Pankofer invoice PDF had to be
//     generated and published BY HAND. This locks in the publishing card on both
//     InvoiceDetailPage and OfferDetailPage: per-PDF publication state, project
//     selection, the three explicit actions, category derivation that matches the
//     database exactly, loading/error/retry/success handling, and — critically — that
//     it publishes a POINTER via the existing RPC and never copies or uploads a PDF.
//
//  2. COMMERCIAL OVERVIEW MISSING FROM THE CANONICAL CUSTOMER PAGE. Offers and
//     invoices are organization-scoped, but every surface for them hung off
//     owner_customers, which Pankofer has no row in. This locks in the
//     organization-scoped "Kommerziell" tab and its independence from owner_customers.
//
//  3. DUPLICATE ORGANIZATIONS. The wizard resubmitted with a fresh idempotency key and
//     a different invitation email created a second organization. This locks in the
//     identity-decision round trip: the conflict is surfaced as a CHOICE, neither
//     option is preselected, and the client never defaults the decision.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const card = read('src/components/finance/CustomerPortalPublishCard.tsx');
const api = read('src/lib/customerPlatform/ownerProjectsApi.ts');
const invoicePage = read('src/pages/owner/InvoiceDetailPage.tsx');
const offerPage = read('src/pages/owner/OfferDetailPage.tsx');
const clientDetail = read('src/pages/admin/clients/ClientDetailPage.tsx');
const commercialApi = read('src/lib/ownerFinance/organizationCommercial.ts');
const wizard = read('src/pages/admin/clients/NewClientWizard.tsx');
const adminApi = read('src/lib/clientPlatform/adminApi.ts');
const provisionFn = read('supabase/functions/admin-provision-client/index.ts');
const publishMigration = read('supabase/migrations/20260731120000_customer_document_publish_guard.sql');
const identityMigration = read('supabase/migrations/20260731121000_client_provisioning_identity.sql');

// ==========================================================================
// 1) Commercial-document publishing UI
// ==========================================================================

ok(/publishOwnerDocumentToCustomer\(/.test(card),
  'the publishing card goes through the existing publishOwnerDocumentToCustomer()');
ok(!/supabase\.storage/.test(card) && !/\.storage\.from\(/.test(card),
  'the publishing card never touches Storage — it registers a pointer, never a copy');
ok(!/uploadCustomerDocument/.test(card),
  'the publishing card never re-uploads a canonical PDF through the upload path');
ok(!/renderTransactionalPdf|renderPremiumPdf|generateAndStoreDocument/.test(card),
  'the publishing card never re-renders or re-generates the PDF it publishes');

// Both detail pages actually mount it, with the right source type.
ok(/CustomerPortalPublishCard/.test(invoicePage) && /sourceType="owner_invoices"/.test(invoicePage),
  'InvoiceDetailPage mounts the publishing card as an owner_invoices source');
ok(/CustomerPortalPublishCard/.test(offerPage) && /sourceType="owner_offers"/.test(offerPage),
  'OfferDetailPage mounts the publishing card as an owner_offers source');
ok(/organizationId=\{invoice\.organization_id\}/.test(invoicePage),
  'InvoiceDetailPage scopes publishing to the invoice\'s own organization');
ok(/organizationId=\{offer\.organization_id\}/.test(offerPage),
  'OfferDetailPage scopes publishing to the offer\'s own organization');

// Publication state per finalized PDF.
ok(/Nicht registriert/.test(card) && /Registriert, nicht freigegeben/.test(card) && /Für Kunden freigegeben/.test(card),
  'the card shows all three publication states per generated PDF');
ok(/pointerFor/.test(card) && /owner_generated_document_id === generatedId/.test(card),
  'publication state is resolved per canonical PDF, not per document list position');
ok(/archived_at === null/.test(card),
  'archived pointers are not treated as a live publication state');

// The three explicit actions, named exactly as specified.
ok(/Für Kundenportal registrieren/.test(card), 'the card offers "Für Kundenportal registrieren"');
ok(/Für Kunden freigeben/.test(card), 'the card offers "Für Kunden freigeben"');
ok(/Freigabe zurücknehmen/.test(card), 'the card offers "Freigabe zurücknehmen"');
ok(/setCustomerDocumentVisibility\(pointer\.id, true\)/.test(card)
   && /setCustomerDocumentVisibility\(pointer\.id, false\)/.test(card),
  'release and revoke both go through set_customer_document_visibility');

// Registering must not publish: they are separate acts.
ok(/registriert[\s\S]{0,80}Noch nicht für den Kunden sichtbar/.test(card),
  'the card states plainly that registering does NOT yet make the document visible');
ok(!/publishOwnerDocumentToCustomer[\s\S]{0,400}setCustomerDocumentVisibility\([^)]*true/.test(card),
  'registering never chains straight into making the document visible');

// The "PDF speichern" explanation when nothing is publishable.
ok(/publishable\.length === 0/.test(card) && /PDF speichern/.test(card),
  'with no finalized PDF the card explains that "PDF speichern" is required');
ok(/status === 'finalized'/.test(card) && /d\.pdf_storage_path/.test(card),
  'only finalized PDFs that actually have stored bytes are offered for publication');

// Project selection.
ok(/loadOwnerCustomerProjects\(/.test(card), 'the card loads the organization\'s customer projects');
ok(/id="publish-project"/.test(card) && /Kundenprojekt/.test(card),
  'the card offers an explicit customer-project selection');
ok(/!p\.is_archived/.test(card), 'archived projects are never offered as a publication target');
ok(/activeProjects\.length === 1\) setProjectId/.test(card),
  'a single project is preselected; with several the owner must choose');

// Category derivation matches the database.
ok(/customerCategoryForOwnerDocument/.test(card),
  'the card derives the category rather than letting the owner mislabel a document');
ok(/render_metadata\?\.signed/.test(api) && /isSigned \? 'acceptance' : 'offer'/.test(api),
  'acceptance is reserved for a SIGNED certificate; an ordinary offer maps to offer');
for (const type of ['invoice', 'credit_note', 'payment_confirmation', 'cancellation_invoice']) {
  ok(new RegExp(`'${type}'`).test(api.split('customerCategoryForOwnerDocument')[1] ?? ''),
    `billing document type ${type} maps to category invoice`);
}
ok(/customer_document_category_matches_owner_source/.test(publishMigration),
  'the database has the matching category rule the UI mirrors');

// Duplicate prevention.
ok(/customer_documents_owner_source_live_unique/.test(publishMigration),
  'a partial unique index prevents duplicate live pointers to one canonical PDF');
ok(/archived_at is null/.test(publishMigration),
  'the pointer uniqueness index is scoped to live rows so archiving still allows re-registration');
ok(/return v_existing_id;/.test(publishMigration),
  'the publish RPC converges on an existing pointer instead of inserting a second one');
ok(/pg_advisory_xact_lock/.test(publishMigration),
  'concurrent registrations of the same PDF are serialized');
ok(/IDEMPOTENT/.test(api) || /Idempotent/.test(api),
  'the client API documents that registering twice cannot create two documents');

// Validation is respected and translated, never rendered raw.
for (const code of [
  'source_document_not_finalized', 'source_document_has_no_pdf', 'source_organization_mismatch',
  'category_source_mismatch', 'acceptance_offer_not_accepted', 'project_not_available',
]) {
  ok(publishMigration.includes(code), `the database raises the stable code ${code}`);
  ok(api.includes(code), `the client translates the stable code ${code} into German`);
}
ok(/describePublishErrorCode\(raw\) \?\? raw/.test(api),
  'a publish failure is translated before it reaches the UI');

// Loading / error / retry / success.
ok(/if \(loading\)/.test(card) && /animate-pulse/.test(card), 'the card renders a labelled loading state');
ok(/if \(loadError\)/.test(card) && /Erneut versuchen/.test(card),
  'a failed status load renders an explicit retry');
ok(/actionError/.test(card) && /Status neu laden/.test(card),
  'a failed action renders an error with a retry rather than failing silently');
ok(/actionSuccess/.test(card) && /role="status"/.test(card),
  'a successful action is confirmed to the owner');
ok(/role="alert"/.test(card), 'failures are announced to assistive technology');
ok(/disabled=\{busy !== null && busy !== \w+Key\}/.test(card),
  'a pending action disables the others so two writes cannot race from one card');
ok(/!organizationId/.test(card) && /Keine Organisation zugeordnet/.test(card),
  'an invoice with no organization explains that, instead of offering an action that must fail');

// ==========================================================================
// 2) Organization-scoped commercial overview on the canonical customer page
// ==========================================================================

ok(/'Kommerziell'/.test(clientDetail), 'the canonical client detail page has a "Kommerziell" tab');
ok(/CommercialTab organizationId=\{detail\.organizationId\}/.test(clientDetail),
  'the commercial tab is scoped by organizationId');
ok(/loadOrganizationCommercialOverview/.test(clientDetail),
  'the tab loads the organization-scoped commercial overview');
// Comments legitimately MENTION owner_customers (explaining why it is not used), so
// this checks for actual reads and writes rather than for the word.
const touchesOwnerCustomers = (src) =>
  /\.from\(\s*['"]owner_customers['"]/.test(src)
  || /owner_customers['"]?\s*\)/.test(src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''))
  || /ownerCustomerId/.test(src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''));
ok(!touchesOwnerCustomers(commercialApi),
  'the commercial overview never reads or requires owner_customers');
ok(!touchesOwnerCustomers(clientDetail),
  'the canonical client detail page never requires an owner_customers row');
ok(/\.eq\('organization_id', organizationId\)/.test(commercialApi),
  'offers and invoices are selected purely by organization_id');
ok(/Angebote \(\{data\.offers\.length\}\)/.test(clientDetail)
   && /Rechnungen \(\{data\.invoices\.length\}\)/.test(clientDetail),
  'the tab shows offer and invoice counts');
ok(/\/admin\/finance\/offers\/\$\{o\.id\}/.test(clientDetail),
  'each offer links to its existing detail page');
ok(/\/admin\/finance\/invoices\/\$\{i\.id\}/.test(clientDetail),
  'each invoice links to its existing detail page');
ok(/Erneut versuchen/.test(clientDetail) && /Kommerzielle Daten konnten nicht geladen werden/.test(clientDetail),
  'the commercial tab has an explicit error + retry state');
ok(/aria-label="Kommerzielle Daten werden geladen"/.test(clientDetail),
  'the commercial tab has a labelled loading state');

// ==========================================================================
// 3) Duplicate-organization prevention, end to end
// ==========================================================================

ok(/provision_client_workspace_with_identity/.test(provisionFn),
  'the Edge Function calls the identity-resolving provisioning RPC');
ok(/organization_identity_conflict/.test(provisionFn) && /409/.test(provisionFn),
  'an identity conflict is returned as a 409 decision, not an opaque failure');
ok(/parseCandidates/.test(provisionFn),
  'the candidate list is parsed server-side rather than forwarded raw');
ok(/skipped_existing_member/.test(provisionFn),
  'no invitation email is sent to somebody who is already a member');

ok(/identityDecision/.test(adminApi) && /targetOrganizationId/.test(adminApi),
  'the client API can carry an explicit owner decision');
ok(/identityConflict/.test(adminApi), 'the client API surfaces the candidate list to the UI');
ok(/FunctionsHttpError/.test(adminApi),
  'the 409 body is read from the error context, where a non-2xx response actually lives');
ok(/identityDecision\?: 'reuse' \| 'create_separate' \| null/.test(adminApi),
  'only the two legitimate decisions are representable');

ok(/IdentityConflictPanel/.test(wizard), 'the wizard presents the conflict as a decision panel');
ok(/Diese weiterverwenden/.test(wizard) && /Bewusst separate Organisation anlegen/.test(wizard),
  'both options are offered explicitly');
ok(/identityDecision: 'reuse'/.test(wizard) && /identityDecision: 'create_separate'/.test(wizard),
  'each option sends the corresponding explicit decision');
ok(/identityDecision: decision\?\.identityDecision \?\? null/.test(wizard),
  'the first submission sends NO decision, so the server refuses an ambiguous match');
ok(/disabled=\{submitting \|\| conflict !== null\}/.test(wizard),
  'the main submit is disabled while a decision is pending, since resubmitting would stop again');
ok(/reused_existing_organization/.test(wizard),
  'the success screen reports whether an existing organization was reused');
ok(/weiterverwendet/.test(wizard),
  'the success screen does not claim "created" when nothing was created');
// Neither decision may be taken without a click: no effect, timer or auto-retry may
// resolve the conflict on the owner's behalf.
const wizardWithoutComments = wizard.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
ok(!/useEffect\([\s\S]{0,400}identityDecision/.test(wizardWithoutComments),
  'no effect resolves the identity conflict automatically');
ok(!/setTimeout[\s\S]{0,200}identityDecision/.test(wizardWithoutComments),
  'no timer resolves the identity conflict automatically');
ok((wizardWithoutComments.match(/onClick=\{\(\) => onCreateSeparate\(\)\}|onClick=\{onCreateSeparate\}/g) ?? []).length === 1
   && /onClick=\{\(\) => onReuse\(c\.organization_id\)\}/.test(wizardWithoutComments),
  'each decision is reachable only through its own explicit click');

// The database-side guarantees the UI depends on.
ok(/normalize_client_identity_name/.test(identityMigration),
  'company-name identity normalization exists');
ok(/client_identity_email_domain/.test(identityMigration)
   && /gmail\.com/.test(identityMigration),
  'free-mail domains are explicitly excluded as identity signals');
ok(/'name_only'/.test(identityMigration) && /'strong'/.test(identityMigration),
  'the two match strengths are distinguished');
ok(/pg_advisory_xact_lock\(hashtextextended\('client_identity:'/.test(identityMigration),
  'concurrent provisioning of the same customer is serialized on the identity key');
ok(/on conflict \(organization_id\) do update/.test(identityMigration),
  'reuse cannot create a second client_account');
ok(/coalesce\(client_accounts\./.test(identityMigration),
  'reuse backfills only NULL CRM fields and never overwrites corrected data');
ok(/MEMBERSHIPS ARE NEVER TOUCHED HERE/.test(identityMigration),
  'reuse never modifies memberships');
ok(/reuse_target_not_a_candidate/.test(identityMigration),
  'a reuse target must be one of the presented candidates');
ok(!/create unique index[\s\S]{0,120}normalize_client_identity_name/i.test(identityMigration),
  'normalized name is NOT unique — a deliberate split must remain possible');

// The legacy signature must still exist, unchanged, and must delegate.
ok(/create or replace function public\.provision_client_workspace\(/.test(identityMigration),
  'the original provisioning signature is preserved');
ok(/select public\.provision_client_workspace_with_identity\(/.test(identityMigration),
  'the original signature delegates rather than keeping a second implementation');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\ncommercial publishing + duplicate-prevention UI tests: ALL PASSED');
