// ─────────────────────────────────────────────────────────────────────────────
// End-to-end behaviour of the owner CRM, driven through the real components the
// owner uses.
//
// The store below is a faithful model of the server contract in migration
// 20260902120000: a lead needs one identifier and nothing more, a loss needs a
// reason, the pre-offer assessment refuses `complete` while a question is open,
// and conversion is idempotent both under a replayed key and under a second
// call on an already-converted lead. If the UI ever starts assuming a rule the
// database does not enforce — or converts a lead twice — these tests stop
// agreeing with it.
// ─────────────────────────────────────────────────────────────────────────────
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/components/dashboard';
import type {
  ConversionResult, DuplicateMatch, LeadDetail, LeadIntegrationCheck, LeadListRow,
} from '@/lib/ownerCrm/types';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';

/* src/lib/supabase.ts validates its configuration at module scope and the dashboard barrel
   reaches it transitively, so the stub has to be hoisted above the imports. Every data path
   below is mocked and no request is ever made; the client only has to be constructible. */
vi.hoisted(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://owner-crm-test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
});

/* ───────────────────────────── the modelled server ──────────────────────── */

const ENTITY = { id: 'entity-1', display_name: 'Cogniiq' };
const NOW = '2026-09-02T09:00:00Z';

interface StoredLead {
  id: string;
  company: string | null; contact_name: string | null; email: string | null; phone: string | null;
  website: string | null; city: string | null;
  stage: string; priority: string;
  estimated_setup_cents: number | null; estimated_monthly_cents: number | null;
  next_follow_up_at: string | null; follow_up_note: string | null;
  last_contact_at: string | null; last_activity_at: string;
  won_at: string | null; lost_at: string | null; lost_reason: string | null;
  converted_customer_id: string | null; converted_at: string | null;
  archived_at: string | null;
  service_interests: ServiceKey[];
}

let leads: StoredLead[] = [];
let followUps: Array<{ id: string; lead_id: string; due_at: string; reason: string | null; status: string }> = [];
let tasks: Array<{ id: string; lead_id: string; title: string; status: string; due_date: string | null; priority: string }> = [];
let activity: Array<{ id: string; lead_id: string; event_type: string; summary: string; channel: string | null; occurred_at: string }> = [];
let checks: Record<string, LeadIntegrationCheck> = {};
let customers: Array<{ id: string; company: string | null; email: string | null }> = [];
let customerServices: Array<{ customer_id: string; service_key: ServiceKey; engagement_id: string }> = [];
/** Every conversion call, so "exactly one customer" is provable rather than assumed. */
let conversionCalls: string[] = [];

function record(leadId: string, eventType: string, summary: string, channel: string | null = null) {
  activity.push({ id: `act-${activity.length + 1}`, lead_id: leadId, event_type: eventType, summary, channel, occurred_at: NOW });
  const lead = leads.find((l) => l.id === leadId);
  if (lead) lead.last_activity_at = NOW;
}

function displayName(l: StoredLead): string {
  return l.company?.trim() || l.contact_name?.trim() || l.email?.trim() || 'Lead';
}

function refreshFollowUp(leadId: string) {
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return;
  const open = followUps
    .filter((f) => f.lead_id === leadId && f.status === 'open')
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  lead.next_follow_up_at = open?.due_at ?? null;
  lead.follow_up_note = open?.reason ?? null;
}

function emptyCheck(leadId: string): LeadIntegrationCheck {
  return {
    lead_id: leadId,
    pvs_name: null, pvs_vendor: null, pvs_version: null, appointment_system: null,
    interface_type: null, api_documentation_obtained: null, api_access_included: null,
    partner_approval_required: null, partner_approval_status: null, sandbox_available: null,
    supports_availability: null, supports_booking: null, supports_reschedule: null,
    supports_cancel: null, supports_patient_write: null,
    rate_limits: null, vendor_restrictions: null,
    third_party_setup_cents: null, third_party_monthly_cents: null,
    third_party_cost_note: null, third_party_costs_confirmed: false,
    integration_mode: null, fallback_description: null,
    customer_informed_at: null, documented_in_offer_at: null,
    status: 'not_started', notes: null, created_at: NOW, updated_at: NOW,
  };
}

/** The server's pre-offer gate, reimplemented exactly as the SQL does it. */
function gateRefusal(c: LeadIntegrationCheck): string | null {
  const has = (v: string | null) => (v ?? '').trim().length > 0;
  if (!has(c.pvs_name) && !has(c.appointment_system)) {
    return 'record the PVS or the appointment system before completing the assessment';
  }
  if (c.interface_type === null) {
    return 'record whether an interface exists before completing the assessment';
  }
  if (!c.third_party_costs_confirmed) {
    return 'third-party costs must be confirmed before completing the assessment';
  }
  if (c.integration_mode === null || c.integration_mode === 'unknown') {
    return 'record whether this is full or partial automation before completing the assessment';
  }
  if (c.integration_mode !== 'full_automation' && !has(c.fallback_description)) {
    return 'a partial automation must describe its exact fallback';
  }
  return null;
}

function toListRow(l: StoredLead): LeadListRow {
  return {
    ...l,
    contact_role: null, postal_code: null, source: null, probability_percent: null,
    display_name: displayName(l),
    created_at: NOW,
    stage: l.stage as LeadListRow['stage'],
    priority: l.priority as LeadListRow['priority'],
    open_task_count: tasks.filter((t) => t.lead_id === l.id && (t.status === 'open' || t.status === 'in_progress')).length,
    offer_count: 0,
    integration_status: checks[l.id]?.status ?? 'not_started',
  } as LeadListRow;
}

vi.mock('@/lib/ownerCrm/api', async () => {
  // The date helper is pure and has no Supabase dependency; using the real one
  // keeps the tests honest about the timezone boundary the pages rely on.
  const actual = await vi.importActual<typeof import('@/lib/ownerCrm/api')>('@/lib/ownerCrm/api');

  return {
    localIsoDate: actual.localIsoDate,

    loadLeads: vi.fn(async (): Promise<LeadListRow[]> => leads.map(toListRow)),

    loadLeadDetail: vi.fn(async (leadId: string): Promise<LeadDetail | null> => {
      const l = leads.find((x) => x.id === leadId);
      if (!l) return null;
      return {
        lead: { ...toListRow(l), business_entity_id: ENTITY.id } as LeadDetail['lead'],
        service_interests: l.service_interests,
        follow_ups: followUps.filter((f) => f.lead_id === leadId) as LeadDetail['follow_ups'],
        tasks: tasks.filter((t) => t.lead_id === leadId) as unknown as LeadDetail['tasks'],
        activity: activity.filter((a) => a.lead_id === leadId).slice().reverse() as LeadDetail['activity'],
        integration_check: checks[leadId] ?? null,
        offers: [],
        customer: l.converted_customer_id
          ? { id: l.converted_customer_id, company: l.company, contact_name: l.contact_name, status: 'active' }
          : null,
      };
    }),

    createLead: vi.fn(async (input: Record<string, unknown>) => {
      const company = ((input.company as string) ?? '').trim() || null;
      const contact = ((input.contact_name as string) ?? '').trim() || null;
      const email = ((input.email as string) ?? '').trim() || null;
      if (!company && !contact && !email) {
        return { id: null, duplicates: [], error: 'a lead needs at least a company, a contact or an email' };
      }
      const id = `lead-${leads.length + 1}`;
      leads.push({
        id, company, contact_name: contact, email,
        phone: ((input.phone as string) ?? '').trim() || null,
        website: ((input.website as string) ?? '').trim() || null,
        city: ((input.city as string) ?? '').trim() || null,
        stage: (input.stage as string) ?? 'new',
        priority: (input.priority as string) ?? 'normal',
        estimated_setup_cents: (input.estimated_setup_cents as number) ?? null,
        estimated_monthly_cents: (input.estimated_monthly_cents as number) ?? null,
        next_follow_up_at: null, follow_up_note: null,
        last_contact_at: null, last_activity_at: NOW,
        won_at: null, lost_at: null, lost_reason: null,
        converted_customer_id: null, converted_at: null, archived_at: null,
        service_interests: (input.service_interests as ServiceKey[]) ?? [],
      });
      if (input.next_follow_up_at) {
        followUps.push({
          id: `fu-${followUps.length + 1}`, lead_id: id,
          due_at: input.next_follow_up_at as string,
          reason: (input.follow_up_note as string) ?? null, status: 'open',
        });
        refreshFollowUp(id);
      }
      record(id, 'lead_created', `Lead angelegt: ${company ?? contact ?? email}`);
      return { id, duplicates: [], error: null };
    }),

    updateLead: vi.fn(async (leadId: string, patch: Record<string, unknown>) => {
      const l = leads.find((x) => x.id === leadId);
      if (!l) return { error: 'lead not found' };
      if ('company' in patch) l.company = (patch.company as string) ?? null;
      if ('email' in patch) l.email = (patch.email as string) ?? null;
      if ('phone' in patch) l.phone = (patch.phone as string) ?? null;
      if ('priority' in patch) l.priority = patch.priority as string;
      if ('service_interests' in patch) l.service_interests = patch.service_interests as ServiceKey[];
      record(leadId, 'lead_updated', 'Lead-Daten aktualisiert');
      return { error: null };
    }),

    setLeadStage: vi.fn(async (leadId: string, stage: string, note?: string | null) => {
      const l = leads.find((x) => x.id === leadId);
      if (!l) return { error: 'lead not found' };
      if (stage === 'lost' && !(note ?? '').trim()) return { error: 'a lost opportunity needs a reason' };
      if (l.converted_customer_id && stage !== 'won') {
        return { error: 'this lead is already converted into a customer and stays won' };
      }
      l.stage = stage;
      l.won_at = stage === 'won' ? (l.won_at ?? NOW) : null;
      l.lost_at = stage === 'lost' ? (l.lost_at ?? NOW) : null;
      l.lost_reason = stage === 'lost' ? (note ?? '').trim() : null;
      record(leadId, stage === 'won' ? 'lead_won' : stage === 'lost' ? 'lead_lost' : 'stage_changed',
        stage === 'lost' ? `Als verloren markiert: ${note}` : stage === 'won' ? 'Als gewonnen markiert' : `Phase geändert auf: ${stage}`);
      return { error: null };
    }),

    setLeadArchived: vi.fn(async (leadId: string, archived: boolean) => {
      const l = leads.find((x) => x.id === leadId);
      if (l) l.archived_at = archived ? NOW : null;
      record(leadId, archived ? 'lead_archived' : 'lead_restored', archived ? 'Lead archiviert' : 'Lead wiederhergestellt');
      return { error: null };
    }),

    logLeadContact: vi.fn(async (leadId: string, channel: string, summary: string) => {
      if (!summary.trim()) return { error: 'a note cannot be empty' };
      record(leadId, channel === 'note' ? 'note_added' : 'contact_logged', summary, channel);
      // A note is not contact.
      if (channel !== 'note') {
        const l = leads.find((x) => x.id === leadId);
        if (l) l.last_contact_at = NOW;
      }
      return { error: null };
    }),

    upsertFollowUp: vi.fn(async (leadId: string, followUpId: string | null, dueAt: string, reason: string | null) => {
      if (followUpId) {
        const f = followUps.find((x) => x.id === followUpId && x.status === 'open');
        if (!f) return { id: null, error: 'open follow-up not found' };
        f.due_at = dueAt; f.reason = reason;
      } else {
        followUps.push({ id: `fu-${followUps.length + 1}`, lead_id: leadId, due_at: dueAt, reason, status: 'open' });
      }
      refreshFollowUp(leadId);
      record(leadId, 'follow_up_created', 'Follow-up gesetzt');
      return { id: 'fu', error: null };
    }),

    completeFollowUp: vi.fn(async (followUpId: string, status: string) => {
      const f = followUps.find((x) => x.id === followUpId);
      if (!f) return { error: 'follow-up not found' };
      if (f.status !== 'open') return { error: 'this follow-up is already closed' };
      f.status = status;
      refreshFollowUp(f.lead_id);
      record(f.lead_id, 'follow_up_completed', 'Follow-up erledigt');
      return { error: null };
    }),

    createLeadTask: vi.fn(async (input: { lead_id: string; title: string; due_date?: string | null; priority?: string }) => {
      if (!input.title.trim()) return { id: null, error: 'a task title is required' };
      const id = `task-${tasks.length + 1}`;
      tasks.push({
        id, lead_id: input.lead_id, title: input.title, status: 'open',
        due_date: input.due_date ?? null, priority: input.priority ?? 'normal',
      });
      record(input.lead_id, 'task_created', `Aufgabe erstellt: ${input.title}`);
      return { id, error: null };
    }),

    setLeadTaskStatus: vi.fn(async (taskId: string, status: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (!t) return { error: 'task not found' };
      t.status = status;
      record(t.lead_id, status === 'completed' ? 'task_completed' : 'task_status_changed',
        `Aufgabe ${status === 'completed' ? 'erledigt' : 'geändert'}: ${t.title}`);
      return { error: null };
    }),

    deleteLeadTask: vi.fn(async (taskId: string) => {
      const t = tasks.find((x) => x.id === taskId);
      if (t) { tasks = tasks.filter((x) => x.id !== taskId); record(t.lead_id, 'task_deleted', `Aufgabe gelöscht: ${t.title}`); }
      return { error: null };
    }),

    saveIntegrationCheck: vi.fn(async (leadId: string, patch: Record<string, unknown>) => {
      const current = checks[leadId] ?? emptyCheck(leadId);
      const next = { ...current } as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(patch)) {
        if (key === 'status') continue;
        // The server casts 'true'/'false' text into the boolean column.
        next[key] = value === 'true' ? true : value === 'false' ? false : value;
      }
      const merged = next as unknown as LeadIntegrationCheck;
      const requested = (patch.status as string) ?? current.status;

      if (requested === 'complete') {
        const refusal = gateRefusal(merged);
        if (refusal) return { status: null, error: refusal };
      }
      merged.status = requested as LeadIntegrationCheck['status'];
      checks[leadId] = merged;
      record(leadId, 'integration_check_updated', 'Schnittstellen-Prüfung aktualisiert');
      return { status: merged.status, error: null };
    }),

    convertLeadToCustomer: vi.fn(async (leadId: string, options: { services?: ServiceKey[] } = {}) => {
      conversionCalls.push(leadId);
      const l = leads.find((x) => x.id === leadId);
      if (!l) return { result: null, error: 'lead not found' };

      let customerId = l.converted_customer_id;
      let matched = customerId !== null;

      if (!customerId) {
        // Normalised-email match before creating anything new.
        const existing = l.email
          ? customers.find((c) => (c.email ?? '').toLowerCase() === l.email!.toLowerCase())
          : undefined;
        if (existing) { customerId = existing.id; matched = true; }
        else {
          customerId = `cust-${customers.length + 1}`;
          customers.push({ id: customerId, company: l.company, email: l.email });
        }
        l.stage = 'won';
        l.won_at = l.won_at ?? NOW;
        l.converted_customer_id = customerId;
        l.converted_at = NOW;
        record(leadId, 'lead_converted', `In Kunde umgewandelt: ${displayName(l)}`);
      }

      const requested = options.services ?? l.service_interests;
      const result: ConversionResult = {
        lead_id: leadId, customer_id: customerId, matched_existing: matched,
        services: requested.map((key) => {
          // UNIQUE (customer, service): re-adding reuses the row and its engagement.
          const existing = customerServices.find((s) => s.customer_id === customerId && s.service_key === key);
          if (existing) {
            return { service_key: key, service_id: `svc-${key}`, engagement_id: existing.engagement_id, created: false };
          }
          const engagementId = `eng-${customerServices.length + 1}`;
          customerServices.push({ customer_id: customerId!, service_key: key, engagement_id: engagementId });
          return { service_key: key, service_id: `svc-${key}`, engagement_id: engagementId, created: true };
        }),
      };
      return { result, error: null };
    }),

    findDuplicates: vi.fn(async (_entityId: string, probe: Record<string, string | null>): Promise<DuplicateMatch[]> => {
      const email = probe.email?.trim().toLowerCase() || null;
      const out: DuplicateMatch[] = [];
      for (const l of leads) {
        if (email && (l.email ?? '').toLowerCase() === email) {
          out.push({ kind: 'lead', id: l.id, name: displayName(l), state: l.stage, city: l.city, matched_on: 'email', confidence: 'strong' });
        }
      }
      for (const c of customers) {
        if (email && (c.email ?? '').toLowerCase() === email) {
          out.push({ kind: 'customer', id: c.id, name: c.company ?? 'Kunde', state: 'active', city: null, matched_on: 'email', confidence: 'strong' });
        }
      }
      return out;
    }),

    loadCommandCenter: vi.fn(async () => null),
    loadOriginLead: vi.fn(async () => null),
    linkOfferLead: vi.fn(async () => ({ error: null })),
  };
});

vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({
    entity: ENTITY, status: 'ready', backendReady: true, backendDetail: null,
    error: null, taxYear: 2026, setTaxYear: () => {}, reload: async () => {},
  }),
}));

/* ────────────────────────────────── harness ─────────────────────────────── */

import { LeadsPage } from '@/pages/owner/LeadsPage';
import { LeadDetailPage } from '@/pages/owner/LeadDetailPage';

/**
 * DataTable renders the desktop table AND the mobile card list into the DOM at
 * once, letting CSS choose which is visible. A row therefore legitimately
 * appears twice, so list assertions count matches rather than demanding one
 * node. Tab labels are excluded: several of them ("Gewonnen", "Verloren",
 * "Ohne Follow-up") read exactly like the row names in these fixtures, and a
 * tab is chrome, not a result.
 */
function rowCount(name: string | RegExp): number {
  return screen.queryAllByText(name).filter((el) => el.closest('[role="tab"]') === null).length;
}

function renderApp(path = '/admin/finance/leads') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/finance/leads" element={<LeadsPage />} />
          <Route path="/admin/finance/leads/:leadId" element={<LeadDetailPage />} />
          <Route path="/admin/finance/customers/:customerId" element={<div>Kundenseite</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

function seedLead(overrides: Partial<StoredLead> = {}): StoredLead {
  const lead: StoredLead = {
    id: `lead-${leads.length + 1}`,
    company: 'Praxis Dr. Beispiel', contact_name: 'Dr. Anna Beispiel',
    email: 'praxis@beispiel.test', phone: '+49 89 1234567', website: null, city: 'München',
    stage: 'qualification', priority: 'high',
    estimated_setup_cents: 480000, estimated_monthly_cents: 39900,
    next_follow_up_at: null, follow_up_note: null,
    last_contact_at: null, last_activity_at: NOW,
    won_at: null, lost_at: null, lost_reason: null,
    converted_customer_id: null, converted_at: null, archived_at: null,
    service_interests: ['ai_receptionist'],
    ...overrides,
  };
  leads.push(lead);
  record(lead.id, 'lead_created', `Lead angelegt: ${displayName(lead)}`);
  return lead;
}

beforeEach(() => {
  leads = []; followUps = []; tasks = []; activity = [];
  checks = {}; customers = []; customerServices = []; conversionCalls = [];
});

/* ─────────────────────────────────── tests ──────────────────────────────── */

describe('Lead anlegen', () => {
  it('needs nothing but a name', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('Noch keine Leads erfasst');

    await user.click(screen.getAllByRole('button', { name: /Lead hinzufügen/ })[0]);
    await user.type(await screen.findByLabelText(/Praxis \/ Firma/), 'Praxis Minimal');
    await user.click(screen.getByRole('button', { name: 'Lead anlegen' }));

    await waitFor(() => expect(leads).toHaveLength(1));
    expect(leads[0]).toMatchObject({ company: 'Praxis Minimal', stage: 'new', priority: 'normal' });
    // Nothing the owner did not type was invented.
    expect(leads[0].email).toBeNull();
    expect(leads[0].phone).toBeNull();
    expect(leads[0].estimated_setup_cents).toBeNull();
  });

  it('keeps the submit button unavailable until an identifier exists', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('Noch keine Leads erfasst');
    await user.click(screen.getAllByRole('button', { name: /Lead hinzufügen/ })[0]);

    const submit = await screen.findByRole('button', { name: 'Lead anlegen' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/E-Mail/), 'nur@email.test');
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('warns about a duplicate e-mail without blocking the creation', async () => {
    seedLead();
    const user = userEvent.setup();
    renderApp();
    await waitFor(() => expect(rowCount('Praxis Dr. Beispiel')).toBeGreaterThan(0));

    await user.click(screen.getAllByRole('button', { name: /Lead hinzufügen/ })[0]);
    await user.type(await screen.findByLabelText(/Praxis \/ Firma/), 'Zweite Praxis');
    await user.type(screen.getByLabelText(/E-Mail/), 'praxis@beispiel.test');

    await screen.findByText('Möglicherweise bereits vorhanden');
    // The warning is advisory: creating stays available and nothing is merged.
    const submit = screen.getByRole('button', { name: 'Lead anlegen' });
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() => expect(leads).toHaveLength(2));
  });
});

describe('Lead-Liste', () => {
  it('shows an overdue follow-up as overdue and filters on it', async () => {
    const lead = seedLead();
    followUps.push({ id: 'fu-1', lead_id: lead.id, due_at: '2026-01-01T10:00:00Z', reason: 'Rückruf', status: 'open' });
    refreshFollowUp(lead.id);
    seedLead({ company: 'Ohne Follow-up', email: 'zwei@test.de' });

    const user = userEvent.setup();
    renderApp();
    await waitFor(() => expect(rowCount('Praxis Dr. Beispiel')).toBeGreaterThan(0));

    await user.click(screen.getByRole('tab', { name: /Überfällig/ }));
    await waitFor(() => expect(rowCount('Praxis Dr. Beispiel')).toBeGreaterThan(0));
    expect(rowCount('Ohne Follow-up')).toBe(0);
  });

  it('separates won and lost from the active list', async () => {
    seedLead({ company: 'Aktiv' });
    seedLead({ company: 'Gewonnen', stage: 'won', email: 'w@test.de' });
    seedLead({ company: 'Verloren', stage: 'lost', lost_reason: 'Budget', email: 'v@test.de' });

    const user = userEvent.setup();
    renderApp();
    await waitFor(() => expect(rowCount('Aktiv')).toBeGreaterThan(0));

    expect(rowCount('Gewonnen')).toBe(0);

    await user.click(screen.getByRole('tab', { name: /^Verloren/ }));
    await waitFor(() => expect(rowCount('Verloren')).toBeGreaterThan(0));
  });

  it('searches across contact details, not only the name', async () => {
    seedLead({ company: 'Praxis A', email: 'findmich@test.de' });
    seedLead({ company: 'Praxis B', email: 'anders@test.de' });

    const user = userEvent.setup();
    renderApp();
    await waitFor(() => expect(rowCount('Praxis A')).toBeGreaterThan(0));

    await user.type(screen.getByPlaceholderText(/Suchen/), 'findmich');
    await waitFor(() => expect(rowCount('Praxis B')).toBe(0));
    expect(rowCount('Praxis A')).toBeGreaterThan(0);
  });
});

describe('Lead-Workspace', () => {
  it('logs a note without pretending it was contact', async () => {
    const lead = seedLead();
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });

    await user.click(screen.getAllByRole('button', { name: /Notiz \/ Kontakt/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Inhalt'), 'Setzt tomedo ein.');
    // The channel select defaults to "Anruf"; switch it to a plain note.
    await user.click(within(dialog).getByRole('combobox', { name: /Art/ }));
    await user.click(await screen.findByRole('option', { name: 'Notiz' }));
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(activity.some((a) => a.event_type === 'note_added')).toBe(true));
    expect(leads.find((l) => l.id === lead.id)!.last_contact_at).toBeNull();
  });

  it('refuses to mark a lead lost without a reason, and keeps the history when it does', async () => {
    const lead = seedLead();
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });

    await user.click(screen.getByRole('button', { name: /Als verloren markieren/ }));
    const dialog = await screen.findByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Als verloren markieren' });
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Grund'), 'Budget für 2026 gestrichen');
    await user.click(submit);

    await waitFor(() => expect(leads[0].stage).toBe('lost'));
    expect(leads[0].lost_reason).toBe('Budget für 2026 gestrichen');
    // Nothing was removed: the creation event is still there.
    expect(activity.filter((a) => a.lead_id === lead.id).some((a) => a.event_type === 'lead_created')).toBe(true);
  });

  it('creates and completes a CRM task on the lead', async () => {
    const lead = seedLead();
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });

    await user.click(screen.getByRole('button', { name: /Aufgabe$/ }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Titel/), 'Angebot vorbereiten');
    await user.click(within(dialog).getByRole('button', { name: 'Anlegen' }));

    await waitFor(() => expect(tasks).toHaveLength(1));
    const checkbox = await screen.findByRole('checkbox', { name: /Angebot vorbereiten als erledigt markieren/ });
    await user.click(checkbox);
    await waitFor(() => expect(tasks[0].status).toBe('completed'));
  });

  it('surfaces the next action for an overdue follow-up', async () => {
    const lead = seedLead();
    followUps.push({ id: 'fu-1', lead_id: lead.id, due_at: '2026-01-01T10:00:00Z', reason: 'PVS klären', status: 'open' });
    refreshFollowUp(lead.id);

    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByText('Nächste Schritte');
    expect(await screen.findByText(/Follow-up .* überfällig/)).toBeInTheDocument();
  });
});

describe('Schnittstellen- und Kostenprüfung (Gate vor dem Angebot)', () => {
  async function openIntegrationTab(leadId: string) {
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${leadId}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });
    await user.click(screen.getByRole('tab', { name: /Schnittstelle & Kosten/ }));
    await screen.findByText('Schnittstellen- und Kostenprüfung');
    return user;
  }

  it('asks for the system first when nothing at all has been recorded', async () => {
    // One clear first step beats four simultaneous demands on an untouched lead.
    const lead = seedLead();
    await openIntegrationTab(lead.id);

    // Shown twice on purpose: in the panel's banner, and in the page-level
    // "Nächste Schritte" card that stays visible across tabs.
    await waitFor(() => expect(rowCount('PVS bzw. Terminsoftware erfassen')).toBeGreaterThan(0));
    expect(rowCount('Drittanbieter-Kosten prüfen und bestätigen')).toBe(0);
  });

  it('lists every remaining question once the assessment has been started', async () => {
    const lead = seedLead();
    checks[lead.id] = { ...emptyCheck(lead.id), status: 'in_progress' };
    await openIntegrationTab(lead.id);

    await waitFor(() => expect(rowCount('PVS bzw. Terminsoftware erfassen')).toBeGreaterThan(0));
    expect(rowCount('Schnittstelle prüfen')).toBeGreaterThan(0);
    expect(rowCount('Drittanbieter-Kosten prüfen und bestätigen')).toBeGreaterThan(0);
    expect(rowCount('Voll- oder Teilautomatisierung festlegen')).toBeGreaterThan(0);
  });

  it('refuses to complete while the third-party costs are unconfirmed, and says so', async () => {
    const lead = seedLead();
    checks[lead.id] = {
      ...emptyCheck(lead.id), pvs_name: 'tomedo', interface_type: 'official_api',
      integration_mode: 'full_automation', status: 'in_progress',
    };
    const user = await openIntegrationTab(lead.id);

    await user.click(screen.getByRole('button', { name: /Prüfung abschließen/ }));
    expect(await screen.findByText(/third-party costs must be confirmed/)).toBeInTheDocument();
    expect(checks[lead.id].status).toBe('in_progress');
  });

  it('refuses a partial automation that names no fallback', async () => {
    const lead = seedLead();
    checks[lead.id] = {
      ...emptyCheck(lead.id), pvs_name: 'tomedo', interface_type: 'official_api',
      third_party_costs_confirmed: true, integration_mode: 'partial_automation', status: 'in_progress',
    };
    const user = await openIntegrationTab(lead.id);

    await user.click(screen.getByRole('button', { name: /Prüfung abschließen/ }));
    expect(await screen.findByText(/exact fallback/)).toBeInTheDocument();
    expect(checks[lead.id].status).toBe('in_progress');
  });

  it('completes once every question is answered, and then asks for the client disclosures', async () => {
    const lead = seedLead();
    checks[lead.id] = {
      ...emptyCheck(lead.id), pvs_name: 'tomedo', interface_type: 'official_api',
      third_party_costs_confirmed: true, third_party_setup_cents: 90000,
      integration_mode: 'full_automation', status: 'in_progress',
    };
    const user = await openIntegrationTab(lead.id);

    await user.click(screen.getByRole('button', { name: /Prüfung abschließen/ }));
    await waitFor(() => expect(checks[lead.id].status).toBe('complete'));

    expect(await screen.findByText(/Technisch geprüft/)).toBeInTheDocument();
    // The known third-party cost is stated so it cannot quietly miss the offer.
    expect(rowCount(/900,00/)).toBeGreaterThan(0);
    expect(rowCount('Kunden über Integration und Kosten informieren')).toBeGreaterThan(0);
  });

  it('is not shown at all for a lead that does not want the receptionist', async () => {
    const lead = seedLead({ service_interests: ['website'] });
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });
    await user.click(screen.getByRole('tab', { name: /Schnittstelle & Kosten/ }));

    expect(await screen.findByText('Keine Schnittstellen-Prüfung erforderlich')).toBeInTheDocument();
  });
});

describe('Lead → Kunde', () => {
  it('creates the customer, keeps the lead, and instantiates the receptionist onboarding once', async () => {
    const lead = seedLead();
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });

    await user.click(screen.getByRole('button', { name: /In Kunde umwandeln/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Umwandeln' }));

    await waitFor(() => expect(customers).toHaveLength(1));
    expect(customers[0]).toMatchObject({ company: 'Praxis Dr. Beispiel', email: 'praxis@beispiel.test' });

    // The lead survives, is marked won and links to the customer.
    const stored = leads.find((l) => l.id === lead.id)!;
    expect(stored.stage).toBe('won');
    expect(stored.converted_customer_id).toBe(customers[0].id);
    expect(activity.filter((a) => a.lead_id === lead.id).length).toBeGreaterThan(1);

    // Exactly one engagement for the AI Receptionist.
    expect(customerServices.filter((s) => s.service_key === 'ai_receptionist')).toHaveLength(1);
  });

  it('warns about an unfinished pre-offer assessment without preventing the conversion', async () => {
    const lead = seedLead();
    const user = userEvent.setup();
    renderApp(`/admin/finance/leads/${lead.id}`);
    await screen.findByRole('heading', { name: 'Praxis Dr. Beispiel' });

    await user.click(screen.getByRole('button', { name: /In Kunde umwandeln/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Schnittstellen-Prüfung noch nicht abgeschlossen')).toBeInTheDocument();

    const submit = within(dialog).getByRole('button', { name: 'Umwandeln' });
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() => expect(customers).toHaveLength(1));
  });

  it('is safe against a double click — a second conversion adds no second customer', async () => {
    const lead = seedLead();
    const { convertLeadToCustomer } = await import('@/lib/ownerCrm/api');

    const first = await convertLeadToCustomer(lead.id, { services: ['ai_receptionist'] });
    const second = await convertLeadToCustomer(lead.id, { services: ['ai_receptionist'] });

    expect(conversionCalls).toHaveLength(2);
    expect(second.result!.customer_id).toBe(first.result!.customer_id);
    expect(customers).toHaveLength(1);
    expect(customerServices.filter((s) => s.service_key === 'ai_receptionist')).toHaveLength(1);
    // The second call reports that it reused rather than created.
    expect(second.result!.matched_existing).toBe(true);
    expect(second.result!.services[0].created).toBe(false);
  });

  it('links an existing customer by e-mail instead of creating a duplicate', async () => {
    customers.push({ id: 'cust-existing', company: 'Praxis Dr. Beispiel', email: 'praxis@beispiel.test' });
    const lead = seedLead();
    const { convertLeadToCustomer } = await import('@/lib/ownerCrm/api');

    const { result } = await convertLeadToCustomer(lead.id, { services: [] });
    expect(result!.customer_id).toBe('cust-existing');
    expect(result!.matched_existing).toBe(true);
    expect(customers).toHaveLength(1);
  });

  it('attaches several services at once', async () => {
    const lead = seedLead({ service_interests: ['ai_receptionist', 'website'] });
    const { convertLeadToCustomer } = await import('@/lib/ownerCrm/api');

    const { result } = await convertLeadToCustomer(lead.id, {});
    expect(result!.services.map((s) => s.service_key).sort()).toEqual(['ai_receptionist', 'website']);
    expect(customerServices).toHaveLength(2);
  });

  it('keeps a converted lead won — its stage cannot be walked backwards', async () => {
    const lead = seedLead();
    const { convertLeadToCustomer, setLeadStage } = await import('@/lib/ownerCrm/api');
    await convertLeadToCustomer(lead.id, {});

    const { error } = await setLeadStage(lead.id, 'negotiation');
    expect(error).toMatch(/already converted/);
    expect(leads[0].stage).toBe('won');
  });
});
