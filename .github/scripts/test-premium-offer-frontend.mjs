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

if (failures > 0) { console.error(`\npremium offer frontend tests: ${failures} FAILED`); process.exit(1); }
console.log('premium offer frontend tests: ALL PASSED');
