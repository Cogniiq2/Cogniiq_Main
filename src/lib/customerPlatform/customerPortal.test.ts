import { describe, expect, it } from 'vitest';

import {
  fileTypeLabel,
  filterDocuments,
  formatFileSizeDe,
  getWorkspaceStatus,
  groupInvoices,
  pickCogniiqNextAction,
  pickCustomerNextAction,
  pickPrimaryProject,
  summarizeInvoices,
  tabFromHash,
} from './customerPortalModel';
import { buildCustomerActivity, isRecentlyPublished } from './customerActivity';
import {
  customerMembershipStatusLabel,
  customerOrganizationRoleLabel,
  customerOrganizationStatusLabel,
  customerPlatformRoleLabel,
  rawCustomerAccountEnumValues,
} from './customerLabels';
import type {
  CustomerDocument,
  CustomerInvoice,
  CustomerMilestone,
  CustomerProject,
} from './types';
import {
  customerDocumentCategoryLabels,
  customerInvoiceStatusLabels,
  customerMilestoneStatusLabels,
  customerProjectStatusLabels,
} from './types';

/* ------------------------------------------------------------------ builders */

const project = (over: Partial<CustomerProject> = {}): CustomerProject => ({
  id: 'p1',
  organization_id: 'o1',
  title: 'Projekt',
  business_objective: 'Ziel',
  status: 'on_track',
  phase: 'Umsetzung',
  progress_percent: 50,
  start_date: '2026-01-01',
  target_date: '2026-12-01',
  next_action_summary: null,
  next_action_owner: null,
  next_action_due_date: null,
  customer_safe_blocker_summary: null,
  contact_display_name: null,
  contact_role_label: null,
  contact_business_email: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

const invoice = (over: Partial<CustomerInvoice> = {}): CustomerInvoice => ({
  invoice_id: 'i1',
  project_id: 'p1',
  invoice_number: 'RE-1',
  status: 'issued',
  issue_date: '2026-01-01',
  due_date: '2026-01-15',
  currency: 'EUR',
  net_total_cents: 10_000,
  vat_total_cents: 1_900,
  gross_total_cents: 11_900,
  amount_paid_cents: 0,
  outstanding_cents: 11_900,
  pdf_document_id: null,
  ...over,
});

const doc = (over: Partial<CustomerDocument> = {}): CustomerDocument => ({
  id: 'd1',
  project_id: 'p1',
  category: 'offer',
  title: 'Angebot',
  version: 1,
  content_type: 'application/pdf',
  size_bytes: 1000,
  uploaded_at: '2026-01-01T00:00:00Z',
  ...over,
});

const milestone = (over: Partial<CustomerMilestone> = {}): CustomerMilestone => ({
  id: 'm1',
  project_id: 'p1',
  title: 'Meilenstein',
  description: null,
  status: 'upcoming',
  target_date: '2026-03-01',
  completed_at: null,
  sort_order: 1,
  ...over,
});

/* ------------------------------------------------------------ primary project */

describe('pickPrimaryProject', () => {
  it('leads with a blocked project over one that merely needs attention', () => {
    const chosen = pickPrimaryProject([
      project({ id: 'a', status: 'attention_needed' }),
      project({ id: 'b', status: 'blocked' }),
    ]);
    expect(chosen?.id).toBe('b');
  });

  it('prefers the nearest target date within the same status tier', () => {
    const chosen = pickPrimaryProject([
      project({ id: 'late', target_date: '2027-01-01' }),
      project({ id: 'soon', target_date: '2026-02-01' }),
    ]);
    expect(chosen?.id).toBe('soon');
  });

  it('treats a missing target date as furthest away, not as nearest', () => {
    const chosen = pickPrimaryProject([
      project({ id: 'none', target_date: null }),
      project({ id: 'dated', target_date: '2026-02-01' }),
    ]);
    expect(chosen?.id).toBe('dated');
  });

  it('is deterministic for fully tied projects', () => {
    const tied = [project({ id: 'b' }), project({ id: 'a' })];
    expect(pickPrimaryProject(tied)?.id).toBe('a');
    expect(pickPrimaryProject([...tied].reverse())?.id).toBe('a');
  });

  it('returns null with no projects', () => {
    expect(pickPrimaryProject([])).toBeNull();
  });
});

/* --------------------------------------------------------- next-action ownership */

describe('pickCustomerNextAction', () => {
  const mine = project({ id: 'mine', next_action_owner: 'customer', next_action_summary: 'Freigabe erteilen' });
  const theirs = project({ id: 'theirs', next_action_owner: 'cogniiq', next_action_summary: 'Ansagen einsprechen' });

  it('returns a customer-owned action on the primary project', () => {
    expect(pickCustomerNextAction([mine], mine)?.id).toBe('mine');
  });

  it('NEVER returns a Cogniiq-owned action, however urgent', () => {
    const urgent = project({
      ...theirs, next_action_due_date: '2020-01-01',
    });
    expect(pickCustomerNextAction([urgent], urgent)).toBeNull();
  });

  it('falls back to another active project that the customer does own', () => {
    expect(pickCustomerNextAction([theirs, mine], theirs)?.id).toBe('mine');
  });

  it('returns null when no project has an owner set at all', () => {
    const unowned = project({ next_action_owner: null, next_action_summary: 'Etwas' });
    expect(pickCustomerNextAction([unowned], unowned)).toBeNull();
  });

  it('returns null when a customer-owned action has no summary to show', () => {
    const empty = project({ next_action_owner: 'customer', next_action_summary: null });
    expect(pickCustomerNextAction([empty], empty)).toBeNull();
  });

  it('prefers the primary project over an earlier one in the list', () => {
    const other = project({ id: 'other', next_action_owner: 'customer', next_action_summary: 'Anderes' });
    expect(pickCustomerNextAction([other, mine], mine)?.id).toBe('mine');
  });
});

describe('pickCogniiqNextAction', () => {
  it('returns the Cogniiq-owned action on the primary project', () => {
    const p = project({ next_action_owner: 'cogniiq', next_action_summary: 'Auswertung' });
    expect(pickCogniiqNextAction(p)?.id).toBe('p1');
  });

  it('NEVER presents a customer-owned action as Cogniiq work', () => {
    const p = project({ next_action_owner: 'customer', next_action_summary: 'Freigabe' });
    expect(pickCogniiqNextAction(p)).toBeNull();
  });

  it('returns null without a primary project', () => {
    expect(pickCogniiqNextAction(null)).toBeNull();
  });
});

/* -------------------------------------------------------------------- billing */

describe('groupInvoices', () => {
  it('groups by outstanding amount and the STORED overdue status', () => {
    const groups = groupInvoices([
      invoice({ invoice_id: 'paid', outstanding_cents: 0, amount_paid_cents: 11_900, status: 'paid' }),
      invoice({ invoice_id: 'open' }),
      invoice({ invoice_id: 'late', status: 'overdue' }),
    ]);
    expect(groups.settled.map((i) => i.invoice_id)).toEqual(['paid']);
    expect(groups.open.map((i) => i.invoice_id)).toEqual(['open']);
    expect(groups.overdue.map((i) => i.invoice_id)).toEqual(['late']);
  });

  it('never derives "overdue" from the due date in the browser', () => {
    // Due a decade ago, but the server still calls it `issued`. The client must not
    // promote it: the server owns that judgement and a wrong client clock must not be
    // able to move an invoice between groups.
    const groups = groupInvoices([
      invoice({ invoice_id: 'ancient', status: 'issued', due_date: '2016-01-01' }),
    ]);
    expect(groups.overdue).toHaveLength(0);
    expect(groups.open.map((i) => i.invoice_id)).toEqual(['ancient']);
  });

  it('sorts each group newest first by issue date', () => {
    const groups = groupInvoices([
      invoice({ invoice_id: 'old', issue_date: '2026-01-01' }),
      invoice({ invoice_id: 'new', issue_date: '2026-06-01' }),
    ]);
    expect(groups.open.map((i) => i.invoice_id)).toEqual(['new', 'old']);
  });
});

describe('summarizeInvoices', () => {
  it('sums STORED cents without recalculating any amount', () => {
    const summary = summarizeInvoices([
      invoice({ invoice_id: 'a', outstanding_cents: 11_900, amount_paid_cents: 0 }),
      invoice({ invoice_id: 'b', outstanding_cents: 0, amount_paid_cents: 5_000, status: 'paid' }),
      invoice({ invoice_id: 'c', outstanding_cents: 2_500, amount_paid_cents: 1_000, status: 'overdue' }),
    ]);
    expect(summary.outstanding).toBe(14_400);
    expect(summary.paid).toBe(6_000);
    expect(summary.overdue).toBe(2_500);
    expect(summary.openCount).toBe(2);
    expect(summary.overdueCount).toBe(1);
    expect(summary.settledCount).toBe(1);
  });

  it('reports amount_paid_cents as stored, not gross minus outstanding', () => {
    // A credited invoice: nothing was paid, yet gross − outstanding would claim 11.900 €.
    const summary = summarizeInvoices([
      invoice({ status: 'credited', gross_total_cents: 11_900, amount_paid_cents: 0, outstanding_cents: 0 }),
    ]);
    expect(summary.paid).toBe(0);
  });

  it('defaults to EUR for an empty list rather than throwing', () => {
    expect(summarizeInvoices([]).currency).toBe('EUR');
  });
});

/* ------------------------------------------------------------------ documents */

describe('filterDocuments', () => {
  const documents = [
    doc({ id: 'a', title: 'Übergabeprotokoll', category: 'handover', project_id: 'p1' }),
    doc({ id: 'b', title: 'Angebot AN-2026-0142', category: 'offer', project_id: 'p2' }),
    doc({ id: 'c', title: 'Auftragsverarbeitungsvertrag', category: 'dpa', project_id: null }),
  ];
  const base = { query: '', category: 'all' as const, projectId: 'all' };

  it('returns everything with no filter applied', () => {
    expect(filterDocuments(documents, base)).toHaveLength(3);
  });

  it('matches the title case- and diacritic-insensitively', () => {
    expect(filterDocuments(documents, { ...base, query: 'ubergabe' }).map((d) => d.id)).toEqual(['a']);
    expect(filterDocuments(documents, { ...base, query: 'ÜBERGABE' }).map((d) => d.id)).toEqual(['a']);
  });

  it('never matches on an id or any non-title field', () => {
    expect(filterDocuments(documents, { ...base, query: 'p2' })).toHaveLength(0);
    expect(filterDocuments(documents, { ...base, query: 'handover' })).toHaveLength(0);
  });

  it('filters by category and by project independently', () => {
    expect(filterDocuments(documents, { ...base, category: 'offer' }).map((d) => d.id)).toEqual(['b']);
    expect(filterDocuments(documents, { ...base, projectId: 'p1' }).map((d) => d.id)).toEqual(['a']);
  });

  it('selects organization-level documents with the "none" project filter', () => {
    expect(filterDocuments(documents, { ...base, projectId: 'none' }).map((d) => d.id)).toEqual(['c']);
  });

  it('combines filters conjunctively', () => {
    expect(filterDocuments(documents, { query: 'angebot', category: 'offer', projectId: 'p1' })).toHaveLength(0);
  });
});

describe('document presentation helpers', () => {
  it('names only the file types the product publishes', () => {
    expect(fileTypeLabel('application/pdf')).toBe('PDF');
    expect(fileTypeLabel('application/pdf; charset=binary')).toBe('PDF');
    expect(fileTypeLabel(null)).toBeNull();
  });

  it('never returns a raw MIME string for an unknown type', () => {
    expect(fileTypeLabel('application/x-cogniiq-internal')).toBeNull();
  });

  it('formats sizes with a German decimal comma', () => {
    expect(formatFileSizeDe(512)).toBe('512 B');
    expect(formatFileSizeDe(2048)).toBe('2 KB');
    expect(formatFileSizeDe(1_572_864)).toBe('1,5 MB');
    expect(formatFileSizeDe(null)).toBeNull();
    expect(formatFileSizeDe(0)).toBeNull();
  });
});

describe('isRecentlyPublished', () => {
  const now = Date.parse('2026-08-04T12:00:00Z');
  it('marks a document published inside the window', () => {
    expect(isRecentlyPublished('2026-08-01T12:00:00Z', now)).toBe(true);
  });
  it('does not mark one published outside it', () => {
    expect(isRecentlyPublished('2026-07-01T12:00:00Z', now)).toBe(false);
  });
  it('rejects an unparseable timestamp instead of guessing', () => {
    expect(isRecentlyPublished('not-a-date', now)).toBe(false);
  });
});

/* ------------------------------------------------------------------- activity */

describe('buildCustomerActivity', () => {
  it('builds entries only from customer-safe timestamps that exist', () => {
    const entries = buildCustomerActivity({
      projects: [project({ id: 'p1', title: 'Rollout' })],
      documents: [doc({ id: 'd1', title: 'Angebot', uploaded_at: '2026-03-01T00:00:00Z' })],
      invoices: [invoice({ invoice_id: 'i1', invoice_number: 'RE-9', issue_date: '2026-02-01' })],
      milestones: [milestone({ id: 'm1', status: 'completed', completed_at: '2026-04-01T00:00:00Z' })],
    });
    expect(entries.map((e) => e.kind)).toEqual([
      'milestone_completed', 'document_published', 'invoice_issued',
    ]);
  });

  it('sorts newest first and is stable for equal timestamps', () => {
    const stamp = '2026-05-01T00:00:00Z';
    const run = () => buildCustomerActivity({
      projects: [],
      documents: [doc({ id: 'd2', uploaded_at: stamp }), doc({ id: 'd1', uploaded_at: stamp })],
      invoices: [invoice({ invoice_id: 'i1', issue_date: '2026-05-01' })],
    }).map((e) => e.id);
    expect(run()).toEqual(run());
    expect(run()[0]).toBe('document_published:d1');
  });

  it('omits a milestone that is not completed', () => {
    const entries = buildCustomerActivity({
      projects: [], documents: [], invoices: [],
      milestones: [milestone({ status: 'in_progress', completed_at: null })],
    });
    expect(entries).toHaveLength(0);
  });

  it('does not report a freshly created project as "updated"', () => {
    const entries = buildCustomerActivity({
      projects: [project({ created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:10Z' })],
      documents: [], invoices: [],
    });
    expect(entries).toHaveLength(0);
  });

  it('does report a genuinely later update', () => {
    const entries = buildCustomerActivity({
      projects: [project({ created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' })],
      documents: [], invoices: [],
    });
    expect(entries.map((e) => e.kind)).toEqual(['project_updated']);
  });

  it('skips objects whose timestamp is missing or unparseable', () => {
    const entries = buildCustomerActivity({
      projects: [],
      documents: [doc({ uploaded_at: 'nonsense' })],
      invoices: [invoice({ issue_date: null })],
    });
    expect(entries).toHaveLength(0);
  });

  it('honours the limit', () => {
    const documents = Array.from({ length: 20 }, (_, i) =>
      doc({ id: `d${i}`, uploaded_at: `2026-0${(i % 9) + 1}-01T00:00:00Z` }));
    expect(buildCustomerActivity({ projects: [], documents, invoices: [], limit: 5 })).toHaveLength(5);
  });

  it('names the project on a document entry when the title is known', () => {
    const [entry] = buildCustomerActivity({
      projects: [project({ id: 'p1', title: 'Rollout Oberfranken' })],
      documents: [doc({ project_id: 'p1' })],
      invoices: [],
    });
    expect(entry.detail).toBe('Rollout Oberfranken');
  });
});

/* ----------------------------------------------------------------- navigation */

describe('getWorkspaceStatus', () => {
  it('reports a missing organization', () => {
    expect(getWorkspaceStatus(false, null, 0, 'ready').label).toBe('Keine Organisation');
  });

  it('surfaces a non-active organization status as a humanised label', () => {
    const status = getWorkspaceStatus(true, 'suspended', 2, 'ready');
    expect(status.label).toBe('Ausgesetzt');
    expect(status.tone).toBe('attention');
  });

  it('never states a project count on the strength of an unfinished request', () => {
    expect(getWorkspaceStatus(true, 'active', 0, 'loading').label).toBe('Aktiv');
    expect(getWorkspaceStatus(true, 'active', 0, 'error').label).toBe('Aktiv');
  });

  it('counts active projects once the request succeeded', () => {
    expect(getWorkspaceStatus(true, 'active', 1, 'ready').label).toBe('1 aktives Projekt');
    expect(getWorkspaceStatus(true, 'active', 3, 'ready').label).toBe('3 aktive Projekte');
    expect(getWorkspaceStatus(true, 'active', 0, 'ready').label).toBe('Kein aktives Projekt');
  });
});

describe('tabFromHash', () => {
  it('maps every section hash to its tab', () => {
    expect(tabFromHash('#uebersicht')).toBe('overview');
    expect(tabFromHash('#meilensteine')).toBe('milestones');
    expect(tabFromHash('#dokumente')).toBe('documents');
    expect(tabFromHash('#abrechnung')).toBe('billing');
  });
  it('is case-insensitive and falls back to the overview', () => {
    expect(tabFromHash('#MEILENSTEINE')).toBe('milestones');
    expect(tabFromHash('')).toBe('overview');
    expect(tabFromHash('#nonsense')).toBe('overview');
  });
});

/* --------------------------------------------------------------------- labels */

describe('customer-facing labels', () => {
  it('humanises every account enum a customer can see', () => {
    expect(customerPlatformRoleLabel('customer')).toBe('Kundenzugang');
    expect(customerPlatformRoleLabel('cogniiq_admin')).toBe('Cogniiq Administration');
    expect(customerOrganizationStatusLabel('pending')).toBe('Wird eingerichtet');
    expect(customerOrganizationRoleLabel('owner')).toBe('Inhaber');
    expect(customerMembershipStatusLabel('suspended')).toBe('Ausgesetzt');
  });

  it('renders an em dash rather than a raw token for an unknown value', () => {
    expect(customerPlatformRoleLabel('something_new')).toBe('—');
    expect(customerOrganizationStatusLabel(null)).toBe('—');
    expect(customerMembershipStatusLabel(undefined)).toBe('—');
  });

  it('never returns the raw token for any known account enum', () => {
    for (const raw of rawCustomerAccountEnumValues) {
      const rendered = [
        customerPlatformRoleLabel(raw),
        customerOrganizationStatusLabel(raw),
        customerMembershipStatusLabel(raw),
      ];
      expect(rendered).not.toContain(raw);
    }
  });

  it('gives every customer RPC enum value a German label distinct from the token', () => {
    const maps = [
      customerProjectStatusLabels,
      customerMilestoneStatusLabels,
      customerDocumentCategoryLabels,
      customerInvoiceStatusLabels,
    ];
    for (const map of maps) {
      for (const [token, label] of Object.entries(map)) {
        expect(label).toBeTruthy();
        expect(label).not.toBe(token);
      }
    }
  });
});
