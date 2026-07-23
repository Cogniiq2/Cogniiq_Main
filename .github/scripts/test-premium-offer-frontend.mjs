// Frontend structural tests for the premium offer editor lifecycle. These are static
// source-level assertions (the repo has no React test runner) that lock in the required
// behaviour: the edit action exists for drafts and is absent after finalization, the editor
// is reused for new + edit with optimistic concurrency, unsaved-change warnings, section-
// linked preflight, Save & Preview, and finalization gating. Also verifies routes + that the
// finalized detail view renders from the immutable snapshot.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } };

const detail = read('src/pages/owner/OfferDetailPage.tsx');
const editor = read('src/pages/owner/OfferEditor.tsx');
const routes = read('src/pages/admin/finance/FinanceModule.tsx');
const list = read('src/pages/owner/OffersPage.tsx');
const api = read('src/lib/ownerFinance/offersApi.ts');

/* ---- Routes: one reusable editor for new + edit; detail route kept ---- */
ok(/offers\/new".*element=\{<OfferEditor/s.test(routes), 'route: offers/new -> OfferEditor');
ok(/offers\/:offerId\/edit".*element=\{<OfferEditor/s.test(routes), 'route: offers/:offerId/edit -> OfferEditor');
ok(/offers\/:offerId".*element=\{<OfferDetailPage/s.test(routes), 'route: offers/:offerId -> OfferDetailPage kept');

/* ---- Edit button appears for a draft, absent once finalized ---- */
const draftBranch = detail.slice(detail.indexOf('{isDraft ? ('), detail.indexOf(') : ('));
const finalBranch = detail.slice(detail.indexOf(') : ('), detail.indexOf('{/* end actions */}') >= 0 ? detail.indexOf('{/* end actions */}') : detail.indexOf('</PageHeader>') );
ok(/Bearbeiten/.test(draftBranch), 'Edit (Bearbeiten) button present for a draft');
ok(!/Bearbeiten/.test(finalBranch), 'Edit button ABSENT for a finalized offer (revision only)');
ok(/Entwurf löschen/.test(draftBranch), 'Delete-draft action present for a draft');
ok(/Revision erstellen/.test(finalBranch), 'Revision action present for a finalized offer');
ok(/offers\/\$\{id\}\/edit/.test(detail), 'revision navigates into the editor');

/* ---- Editor loads existing values, saves same draft, optimistic concurrency ---- */
ok(/function stateFromOffer/.test(editor), 'editor populates state from an existing offer');
ok(/loadOffer\(offerId\)/.test(editor), 'editor loads the existing draft');
ok(/updateOfferDraft\(/.test(editor), 'editor updates the SAME draft (no duplicate)');
ok(/createOffer\(header, lines, sections\)/.test(editor), 'editor creates a draft with structured sections');
ok(/expectedUpdatedAt/.test(editor) && /stale|concurrent/i.test(editor), 'editor uses optimistic concurrency + handles stale conflict');
ok(/status !== 'draft'/.test(editor) && /Revision/.test(editor), 'editor refuses to edit a non-draft (revision instead)');

/* ---- Unsaved-change warning + refresh-safe reload ---- */
ok(/beforeunload/.test(editor) && /dirty/.test(editor), 'warns before leaving with unsaved changes');
ok(/window\.confirm/.test(editor), 'in-app back navigation confirms discarding unsaved changes');
ok(/setDirty\(false\)/.test(editor), 'save clears the dirty flag');

/* ---- Save & Preview, saving/saved/error states ---- */
ok(/Speichern & Vorschau/.test(editor), 'Save & Preview action present');
ok(/'saving'|'saved'|'error'/.test(editor) && /saveState/.test(editor), 'editor tracks saving/saved/error states');

/* ---- Preflight checklist links to the missing section; finalize gated ---- */
ok(/PreflightCard/.test(editor) && /scrollIntoView/.test(editor), 'preflight items deep-link to the editor section');
ok(/disabled=\{!validation\.canFinalize\}/.test(editor), 'Finalisieren disabled until blocking data is complete');
ok(/validateOfferForFinalization/.test(editor), 'editor uses the offer finalization profile');
ok(/Finalisieren/.test(editor) && /finalize=1/.test(editor), 'Finalisieren stays a separate explicit action');

/* ---- Responsive: one-column mobile via tabs, two columns on desktop ---- */
ok(/Bearbeiten.*Vorschau/s.test(editor) && /lg:grid-cols-2/.test(editor), 'responsive editor+preview (desktop) / tabs (mobile)');
ok(/PremiumOfferPreview/.test(editor), 'editor shows the premium live preview (shared model)');

/* ---- Finalized detail renders from the immutable snapshot ---- */
ok(/snapshotToDocument/.test(detail) && /loadLatestOfferVersion/.test(detail), 'finalized detail renders from the frozen version snapshot');
ok(/renderPremiumPdf/.test(detail), 'detail uses the premium PDF engine');

/* ---- List routes to the editor instead of a modal composer ---- */
ok(/offers\/new/.test(list) && !/OfferComposer/.test(list), 'list opens the full-page editor (no modal composer)');

/* ---- API surface ---- */
ok(/export async function updateOfferDraft/.test(api), 'api: updateOfferDraft');
ok(/export async function deleteOfferDraft/.test(api), 'api: deleteOfferDraft');
ok(/export async function loadLatestOfferVersion/.test(api), 'api: loadLatestOfferVersion');

/* ---- Premium PDF preview dialog (popup-free) ---- */
const dialog = read('src/components/finance/PremiumPdfPreviewDialog.tsx');
ok(/setPreviewOpen\(true\)/.test(detail) && /PremiumPdfPreviewDialog/.test(detail), 'Vorschau opens the in-app dialog immediately (no popup)');
ok(/'loading'/.test(dialog) && /Loader2|wird erzeugt/.test(dialog), 'dialog shows a loading state');
ok(/<iframe/.test(dialog) && /createObjectURL/.test(dialog), 'successful render shows a Blob URL in an iframe');
ok(/status === 'error'/.test(dialog) && /PDF-Vorschau konnte nicht erstellt werden/.test(dialog), 'render failure is shown inside the dialog');
ok(/toastRef\.current\.error\('PDF-Vorschau konnte nicht erstellt werden'/.test(dialog), 'render failure also raises a safe error toast');
ok(/console\.error\(/.test(dialog), 'full error is logged to the console');
// Blob URL lifecycle
ok(/revokeObjectURL/.test(dialog), 'dialog revokes Blob URLs');
ok(/revoke\(\);[\s\S]{0,400}createObjectURL/.test(dialog), 'previous Blob URL is revoked before a new one is created');
ok(/\(\) => \(\) => \{ runIdRef\.current\+\+; revoke\(\); \}/.test(dialog), 'Blob URL is revoked on unmount');
ok(/if \(!open\) \{ runIdRef\.current\+\+; revoke\(\)/.test(dialog), 'Blob URL is revoked when the dialog closes');
ok(/status !== 'ready'/.test(dialog), 'iframe only renders when ready (not revoked while in use)');
ok(/runIdRef/.test(dialog), 'a run-id guard prevents state updates after unmount / out-of-order results');
// window.open is a secondary explicit action only
ok(/openInTab/.test(dialog) && /In neuem Tab öffnen/.test(dialog), 'In neuem Tab öffnen is a secondary explicit action');
ok(!/previewPdf/.test(detail), 'the old popup previewPdf function is removed');
ok(!/renderPremiumPdf\([\s\S]{0,160}window\.open/.test(detail), 'detail-page preview no longer opens a popup after rendering');
const winOpenInDialog = (dialog.match(/window\.open/g) || []).length;
ok(winOpenInDialog === 1, 'dialog uses window.open only once (the explicit secondary action)');
// Download continues to work
ok(/downloadBytes\(filename/.test(dialog), 'dialog download uses the already-generated bytes');
ok(/downloadPdf/.test(detail) && /documentFilename/.test(detail), 'detail page download still works');
// Draft + finalized snapshot preview share the dialog
ok(/renderPreview/.test(detail) && /renderPremiumPdf\(doc!\)/.test(detail), 'detail preview renders the current doc (draft or snapshot)');
ok(/PremiumPdfPreviewDialog/.test(editor) && /saveAndPreview/.test(editor) && /setPreviewOpen\(true\)/.test(editor), 'editor Save & Preview opens the same dialog');
ok(/render=\{renderPreview\}/.test(editor), 'editor preview also uses the shared dialog');

/* ---- Secure link creation feedback ---- */
ok(/Angebot versenden/.test(detail) || /Sicheren Link erstellen/.test(detail), 'secure-link / send action present for a finalized offer');
ok(/navigator\.clipboard\.writeText/.test(detail) && /Sicherer Link kopiert/.test(detail), 'link copied to clipboard when permission is available');
ok(/catch \{ toast\.success\('Sicherer Link erstellt', url\)/.test(detail), 'clipboard failure still surfaces the created URL');
ok(/Link konnte nicht erstellt werden/.test(detail), 'link-creation DB errors remain visible to the owner');
ok(!/console\.(log|error)\([^)]*token/i.test(detail), 'no raw token is written to console logs on the detail page');

/* ---- Hardened async wrapper ---- */
ok(/catch \(e: unknown\)[\s\S]{0,160}toast\.error\('Aktion fehlgeschlagen'/.test(detail), 'async action wrapper surfaces unexpected errors (never silent)');

if (failures > 0) { console.error(`\npremium offer frontend tests: ${failures} FAILED`); process.exit(1); }
console.log('premium offer frontend tests: ALL PASSED');
