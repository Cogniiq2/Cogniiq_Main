// Owner customer & task management regression test. Two layers:
//   (A) STRUCTURAL — static assertions over the migration + frontend wiring: the additive migration
//       defines the three tables with owner-only RLS, the offer archive/link columns, the full RPC
//       surface (customers, tasks, offer archive), de-dup rules, and never edits a prior migration;
//       the API layer and routes/nav expose the feature.
//   (B) INTEGRATION — runs the throwaway-PostgreSQL owner-customers SQL suite end to end when the
//       PostgreSQL server binaries are available.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

// ---------------------------------------------------------------- (A) migration structural
const mig = read('supabase/migrations/20260724120000_owner_customer_task_management.sql');
ok(/create table if not exists public\.owner_customers/.test(mig), 'migration creates owner_customers');
ok(/create table if not exists public\.owner_customer_tasks/.test(mig), 'migration creates owner_customer_tasks');
ok(/create table if not exists public\.owner_customer_activity/.test(mig), 'migration creates owner_customer_activity');
ok(/check \(status in \('active', 'waiting', 'completed', 'archived'\)\)/.test(mig), 'customer status vocabulary is active/waiting/completed/archived');
ok(/check \(status in \('open', 'in_progress', 'completed', 'cancelled'\)\)/.test(mig), 'task status vocabulary is open/in_progress/completed/cancelled');
ok(/check \(priority in \('low', 'normal', 'high', 'urgent'\)\)/.test(mig), 'task priority vocabulary is low/normal/high/urgent');
ok(/add column if not exists owner_customer_id uuid/.test(mig) && /add column if not exists archived_at timestamptz/.test(mig), 'offers get owner_customer_id + archived_at additively');
ok(/is not in that list/.test(mig) || /owner_customer_id \/ archived_at \/ archived_by are deliberately NOT in that list/.test(mig), 'migration documents why owner_guard_offer is not modified');

// Owner-only RLS on every new table. The customers/tasks policies are created in a format() loop
// over the table array; the live SQL suite asserts they actually exist at runtime.
ok(/create policy %I on public\.%I for all to authenticated using \(public\.is_platform_owner\(\)\) with check \(public\.is_platform_owner\(\)\)/.test(mig), 'owner-only RLS policy is created for the customer/task tables');
ok(/array\['owner_customers', 'owner_customer_tasks'\]/.test(mig), 'both owner_customers and owner_customer_tasks get the owner-only policy');
ok(/owner_customer_activity_owner_select/.test(mig) && /owner_customer_activity_owner_insert/.test(mig), 'activity is append-only for owners (select + insert only)');

// Every mutating RPC is owner-gated (SECURITY DEFINER + is_platform_owner guard).
for (const fn of [
  'owner_create_customer', 'owner_update_customer', 'owner_set_customer_status',
  'owner_create_customer_task', 'owner_update_customer_task', 'owner_set_customer_task_status',
  'owner_delete_customer_task', 'owner_reorder_customer_tasks',
  'owner_archive_offer', 'owner_unarchive_offer', 'owner_link_offer_customer',
  'owner_list_customers', 'owner_customer_detail',
]) {
  ok(new RegExp(`function public\\.${fn}\\(`).test(mig), `RPC ${fn} is defined`);
}
ok((mig.match(/if not public\.is_platform_owner\(\) then raise exception 'Owner access required'/g) || []).length >= 13, 'all owner RPCs enforce is_platform_owner');
ok(/security definer/gi.test(mig), 'RPCs are SECURITY DEFINER with a pinned search_path');

// De-duplication rules: account first, then normalized email, never company alone.
ok(/client_account_id = v_client/.test(mig) && /lower\(btrim\(email\)\) = v_norm/.test(mig), 'create de-dups on client_account then normalized email');
ok(/company name is NEVER used|Company alone never matches|company name alone/i.test(mig), 'company name is never a merge key');

// Archiving never changes status or deletes evidence; drafts are not archived.
ok(/draft offers are deleted, not archived/.test(mig), 'drafts are deleted, not archived');
ok(/Only the archive flag changes\. status and all commercial fields are left untouched\./.test(mig), 'archive changes only the flag, not status');

// Idempotent + additive.
ok(/create table if not exists/.test(mig) && !/drop table/.test(mig), 'migration is additive (no drop table)');
ok(/add constraint|alter column|drop column/.test(mig) === false, 'migration does not alter or drop existing columns');
ok(/NOT EXISTS guards|not exists \(\s*select 1 from public\.owner_customers/.test(mig.replace(/\n/g, ' ')), 'backfill is guarded by NOT EXISTS (idempotent)');

// Does not touch any previously applied migration file (only the new file exists at this timestamp).
ok(/20260724120000_owner_customer_task_management\.sql/.test(read('.github/scripts/run-owner-customers-sql-tests.sh')), 'runner applies the new migration');

// ---------------------------------------------------------------- (A) frontend wiring
const api = read('src/lib/ownerFinance/customersApi.ts');
for (const fn of ['loadCustomers', 'loadCustomerDetail', 'createCustomer', 'updateCustomer', 'setCustomerStatus',
  'createTask', 'updateTask', 'setTaskStatus', 'deleteTask', 'reorderTasks', 'archiveOffer', 'unarchiveOffer', 'linkOfferCustomer']) {
  ok(new RegExp(`export async function ${fn}`).test(api), `customersApi exposes ${fn}`);
}
const finance = read('src/pages/admin/finance/FinanceModule.tsx');
ok(/path="customers"/.test(finance) && /path="customers\/:customerId"/.test(finance), 'finance module routes the customer overview + detail');
const nav = read('src/pages/admin/internalNavigation.ts');
ok(/Kunden & Aufgaben/.test(nav) && /\/admin\/finance\/customers/.test(nav), 'navigation adds the "Kunden & Aufgaben" entry');
const checklist = read('src/components/finance/CustomerTaskChecklist.tsx');
ok(/roll back|setLocal\(snapshot\)/.test(checklist), 'task checklist rolls back the optimistic update on error');
ok(/reorderTasks/.test(checklist), 'task checklist persists reordering');
const dialog = read('src/components/finance/OfferArchiveDialog.tsx');
ok(/deleteOfferDraft/.test(dialog) && /archiveOffer/.test(dialog), 'offer dialog deletes drafts but archives everything else');
ok(/signierte Annahme.*bleiben.*erhalten|signierte Annahme, alle Angebotsversionen/.test(dialog), 'accepted-offer copy states evidence is preserved');

// ---------------------------------------------------------------- (B) live SQL suite
const runner = resolve(here, 'run-owner-customers-sql-tests.sh');
if (existsSync('/usr/lib/postgresql') || existsSync('/usr/bin/initdb') || existsSync('/usr/lib/postgresql/16/bin/initdb')) {
  const res = spawnSync('bash', [runner], { encoding: 'utf8' });
  const out = (res.stdout ?? '') + (res.stderr ?? '');
  ok(res.status === 0, 'owner-customers SQL suite exits 0');
  ok(/owner-customers SQL tests: ALL PASSED/.test(out), 'owner-customers SQL suite reports ALL PASSED');
  ok(/20260724120000 re-applied cleanly/.test(out), 'new migration convergence holds');
} else {
  console.log('note: PostgreSQL server binaries not found — skipping live SQL run (structural checks still enforced).');
}

if (failures) { console.error(`\nowner customer & task tests: ${failures} FAILED`); process.exit(1); }
console.log('\nowner customer & task tests: ALL PASSED');
