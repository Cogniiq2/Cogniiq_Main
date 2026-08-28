// ─────────────────────────────────────────────────────────────────────────────
// End-to-end behaviour of the service delivery layer, driven through the real
// components the owner uses.
//
// The store below is a faithful model of the server contract in migration
// 20260830120000: one service row per (customer, service), one engagement per
// service row, a template snapshot taken at instantiation, and a go-live gate
// that refuses the production statuses while a blocker is open. If the UI ever
// starts assuming a rule the database does not actually enforce — or provisions
// an engagement twice — these tests stop agreeing with it.
// ─────────────────────────────────────────────────────────────────────────────
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/components/dashboard';
import { describeSupabaseError, isMissingBackendError } from '@/lib/ownerFinance/errorText';
// The real sanitiser, not a stub: it has no Supabase dependency, and using the real one keeps
// this suite honest about what the owner actually sees when a service cannot be added.
import { describeServiceFailure } from '@/lib/serviceOnboarding/serviceErrors';
import type {
  CustomerServiceSummary, EngagementDetail, EngagementField, EngagementSection,
  EngagementTask, EngagementTaskStatus, ServiceKey, ServiceState,
} from '@/lib/serviceOnboarding/types';

/* src/lib/supabase.ts validates its configuration at module scope and the dashboard barrel
   reaches it transitively, so the stub has to be hoisted above the imports. Every data path
   below is mocked and no request is ever made; the client only has to be constructible. */
vi.hoisted(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://service-onboarding-test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
});

/* ───────────────────────────── the modelled server ──────────────────────── */

const ENTITY = { id: 'entity-1' };
const CUSTOMER_ID = 'cust-1';

/** A miniature version of the seeded template, with the same shape and the same rules. */
const TEMPLATE = {
  code: 'ai_receptionist_healthcare',
  version: 1,
  sections: [
    { code: 'legal', title: 'Recht & Datenschutz', nav_group: 'compliance', readiness_category: 'legal', healthcare_only: false, sort_order: 10 },
    { code: 'agent', title: 'Golden Agent & ElevenLabs', nav_group: 'agent', readiness_category: 'agent', healthcare_only: false, sort_order: 20 },
  ],
  tasks: [
    { section_code: 'legal', code: 'LEG-002', title: 'AVV vom Kunden erhalten', required: true, blocker: true, healthcare_only: false, sort_order: 2 },
    { section_code: 'legal', code: 'LEG-005', title: 'Art. 9 DSGVO bestätigt', required: true, blocker: true, healthcare_only: true, sort_order: 5 },
    { section_code: 'agent', code: 'AGT-001', title: 'Golden Agent geklont', required: true, blocker: false, healthcare_only: false, sort_order: 1 },
  ],
  fields: [
    { section_code: 'agent', code: 'AGT-F004', label: 'ElevenLabs Agent-ID', data_type: 'text', required: true, blocker: true, healthcare_only: false, sort_order: 4 },
  ],
};

interface StoredService {
  id: string; customer_id: string; service_key: ServiceKey; state: ServiceState;
  engagement_id: string | null;
}
interface StoredEngagement {
  id: string; customer_service_id: string; service_key: ServiceKey;
  template_code: string | null; template_version: number | null;
  lifecycle_status: string; healthcare: boolean;
  tasks: EngagementTask[]; fields: EngagementField[]; sections: EngagementSection[];
  activity: { id: string; event_type: string; summary: string; task_id: string | null; field_code: string | null; created_at: string }[];
}

let services: StoredService[] = [];
let engagements: StoredEngagement[] = [];
/** Every instantiation, so "exactly once" is provable rather than assumed. */
let instantiations: string[] = [];
let customers: { id: string; email: string | null }[] = [];

const NOW = '2026-08-30T10:00:00Z';

function instantiate(service: StoredService): string {
  const existing = engagements.find((e) => e.customer_service_id === service.id);
  if (existing) return existing.id;  // the UNIQUE constraint, modelled

  const id = `eng-${engagements.length + 1}`;
  instantiations.push(id);
  const base = { engagement_id: id, created_at: NOW, updated_at: NOW };
  engagements.push({
    id,
    customer_service_id: service.id,
    service_key: service.service_key,
    // Only the AI Receptionist has a template today; the others open an empty workspace.
    template_code: service.service_key === 'ai_receptionist' ? TEMPLATE.code : null,
    template_version: service.service_key === 'ai_receptionist' ? TEMPLATE.version : null,
    lifecycle_status: 'lead',
    healthcare: false,
    sections: service.service_key !== 'ai_receptionist' ? [] : TEMPLATE.sections.map((s, i) => ({
      id: `sec-${id}-${i}`, ...base, description: null, ...s,
    })) as EngagementSection[],
    tasks: service.service_key !== 'ai_receptionist' ? [] : TEMPLATE.tasks.map((t, i) => ({
      id: `task-${id}-${i}`, ...base, template_task_id: null, section_code: t.section_code,
      code: t.code, title: t.title, description: null,
      readiness_category: TEMPLATE.sections.find((s) => s.code === t.section_code)!.readiness_category,
      is_required: t.required, is_go_live_blocker: t.blocker, healthcare_only: t.healthcare_only,
      status: 'not_started', blocker_reason: null, client_request: null, evidence_url: null,
      evidence_note: null, notes: null, reviewer: null, completed_by: null, completed_at: null,
      sort_order: t.sort_order,
    })) as EngagementTask[],
    fields: service.service_key !== 'ai_receptionist' ? [] : TEMPLATE.fields.map((f, i) => ({
      id: `field-${id}-${i}`, ...base, template_field_id: null, section_code: f.section_code,
      code: f.code, label: f.label, description: null, data_type: f.data_type, options: [],
      unit: null, placeholder: null, is_required: f.required, is_go_live_blocker: f.blocker,
      healthcare_only: f.healthcare_only, value_text: null, value_number: null, value_bool: null,
      value_date: null, not_applicable: false, sort_order: f.sort_order, updated_by: null,
    })) as EngagementField[],
    activity: [{ id: `act-${id}`, event_type: 'engagement_created', summary: 'Onboarding-Workspace angelegt', task_id: null, field_code: null, created_at: NOW }],
  });
  service.engagement_id = id;
  return id;
}

/** The server's gate, reimplemented exactly as the SQL does it. */
function gateOf(engagement: StoredEngagement) {
  const blockers = [
    ...engagement.tasks.filter((t) => t.is_go_live_blocker
      && t.status !== 'complete' && t.status !== 'not_applicable'
      && (!t.healthcare_only || engagement.healthcare)),
    ...engagement.fields.filter((f) => f.is_go_live_blocker && !f.not_applicable
      && (!f.healthcare_only || engagement.healthcare)
      && f.value_text === null && f.value_number === null && f.value_bool === null && f.value_date === null),
  ];
  return { ready: blockers.length === 0, count: blockers.length };
}

vi.mock('@/lib/serviceOnboarding/api', () => ({
  // The error classifiers are pure and carry no Supabase dependency, so the real ones are
  // used rather than stubbed — a stub here would hide a regression in the pre-migration path.
  classifyServiceError: (err: unknown) => (isMissingBackendError(err) ? 'missing' : 'error'),
  describeServiceError: (err: unknown) => describeSupabaseError(err, 'Unbekannter Fehler'),
  isMissingBackendMessage: (message: string | null) =>
    message !== null && isMissingBackendError({ message }),
  describeServiceFailure,

  loadCustomerServices: vi.fn(async (customerId: string): Promise<CustomerServiceSummary[]> =>
    services.filter((s) => s.customer_id === customerId).map((s) => {
      const engagement = engagements.find((e) => e.id === s.engagement_id);
      return {
        id: s.id, customer_id: s.customer_id, service_key: s.service_key, state: s.state,
        label: null, notes: null, activated_at: NOW,
        archived_at: s.state === 'archived' ? NOW : null, created_at: NOW,
        engagement: engagement
          ? {
            id: engagement.id, lifecycle_status: engagement.lifecycle_status as never,
            healthcare: engagement.healthcare, integration_mode: null,
            template_code: engagement.template_code, template_version: engagement.template_version,
            went_live_at: null, go_live_target_date: null,
            task_total: engagement.tasks.filter((t) => t.status !== 'not_applicable' && (!t.healthcare_only || engagement.healthcare)).length,
            task_done: engagement.tasks.filter((t) => t.status === 'complete' && (!t.healthcare_only || engagement.healthcare)).length,
            blocker_count: gateOf(engagement).count,
          }
          : null,
      };
    })),

  addCustomerService: vi.fn(async (customerId: string, serviceKey: ServiceKey) => {
    // UNIQUE (customer_id, service_key): re-adding reuses the row and reactivates it.
    let service = services.find((s) => s.customer_id === customerId && s.service_key === serviceKey);
    const created = !service;
    if (!service) {
      service = { id: `svc-${services.length + 1}`, customer_id: customerId, service_key: serviceKey, state: 'active', engagement_id: null };
      services.push(service);
    } else if (service.state !== 'active') {
      service.state = 'active';
    }
    const engagementId = instantiate(service);
    return { serviceId: service.id, engagementId, created, error: null };
  }),

  setCustomerServiceState: vi.fn(async (serviceId: string, state: ServiceState) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) service.state = state;
    return { error: null };
  }),

  loadEngagementDetail: vi.fn(async (engagementId: string): Promise<EngagementDetail | null> => {
    const engagement = engagements.find((e) => e.id === engagementId);
    if (!engagement) return null;
    return {
      engagement: {
        id: engagement.id, business_entity_id: ENTITY.id, customer_id: CUSTOMER_ID,
        customer_service_id: engagement.customer_service_id, service_key: engagement.service_key,
        template_id: 'tpl-1', template_code: engagement.template_code,
        template_version: engagement.template_version,
        lifecycle_status: engagement.lifecycle_status as never, healthcare: engagement.healthcare,
        integration_mode: null, integration_limitations: null, summary: null,
        go_live_target_date: null, went_live_at: null, monitoring_until: null,
        created_by: null, created_at: NOW, updated_at: NOW,
      },
      customer: { id: CUSTOMER_ID, company: 'Beispielpraxis GmbH', contact_name: null, email: null, phone: null, city: null, status: 'active' },
      sections: engagement.sections,
      tasks: engagement.tasks,
      fields: engagement.fields,
      appointment_types: [],
      activity: engagement.activity,
      go_live: { ...gateOf(engagement), blockers: [] },
    };
  }),

  updateEngagement: vi.fn(async (engagementId: string, patch: { healthcare?: boolean }) => {
    const engagement = engagements.find((e) => e.id === engagementId);
    if (engagement && patch.healthcare !== undefined) engagement.healthcare = patch.healthcare;
    return { error: null };
  }),

  setEngagementStatus: vi.fn(async (engagementId: string, status: string) => {
    const engagement = engagements.find((e) => e.id === engagementId);
    if (!engagement) return { error: 'engagement not found' };
    if (['ready_for_go_live', 'live', 'monitoring'].includes(status)) {
      const gate = gateOf(engagement);
      if (!gate.ready) return { error: `Go-Live gesperrt: ${gate.count} offene Blocker` };
    }
    engagement.lifecycle_status = status;
    return { error: null };
  }),

  setEngagementTask: vi.fn(async (taskId: string, patch: Record<string, unknown>) => {
    const engagement = engagements.find((e) => e.tasks.some((t) => t.id === taskId));
    const task = engagement?.tasks.find((t) => t.id === taskId);
    if (!engagement || !task) return { error: 'task not found' };
    const status = (patch.status as EngagementTaskStatus) ?? task.status;
    const reason = patch.blocker_reason !== undefined ? (patch.blocker_reason as string | null) : task.blocker_reason;
    const request = patch.client_request !== undefined ? (patch.client_request as string | null) : task.client_request;
    if (status === 'blocked' && !reason) return { error: 'Ein blockierter Schritt braucht eine Begründung' };
    if (status === 'waiting_for_client' && !request) return { error: 'Bitte angeben, was genau vom Kunden benötigt wird' };
    task.status = status;
    task.blocker_reason = status === 'blocked' ? reason : null;
    task.client_request = request;
    task.completed_at = status === 'complete' ? NOW : null;
    if (patch.notes !== undefined) task.notes = patch.notes as string | null;
    if (patch.evidence_url !== undefined) task.evidence_url = patch.evidence_url as string | null;
    engagement.activity.unshift({
      id: `act-${engagement.activity.length + 1}`, event_type: 'task_status_changed',
      summary: `${task.title} -> ${status}`, task_id: task.id, field_code: null, created_at: NOW,
    });
    return { error: null };
  }),

  setEngagementField: vi.fn(async (fieldId: string, patch: { value?: string | null; not_applicable?: boolean }) => {
    const engagement = engagements.find((e) => e.fields.some((f) => f.id === fieldId));
    const field = engagement?.fields.find((f) => f.id === fieldId);
    if (!field) return { error: 'field not found' };
    if (patch.value !== undefined) field.value_text = patch.value;
    if (patch.not_applicable !== undefined) field.not_applicable = patch.not_applicable;
    return { error: null };
  }),

  upsertAppointmentType: vi.fn(async () => ({ id: 'apt-1', error: null })),
  deleteAppointmentType: vi.fn(async () => ({ error: null })),
}));

vi.mock('@/lib/ownerFinance/customersApi', () => ({
  createCustomer: vi.fn(async (input: Record<string, unknown>) => {
    const email = ((input.email as string) ?? '').trim().toLowerCase();
    const match = email ? customers.find((c) => (c.email ?? '').toLowerCase() === email) : undefined;
    if (match) return { id: match.id, matched: true, error: null };
    const customer = { id: CUSTOMER_ID, email: email || null };
    customers.push(customer);
    return { id: customer.id, matched: false, error: null };
  }),
  updateCustomer: vi.fn(async () => ({ error: null })),
}));

/* Imported after the mocks so the components pick them up. */
const { CustomerFormDialog } = await import('@/components/finance/CustomerFormDialog');
const { CustomerServicesPanel } = await import('@/components/services/CustomerServicesPanel');
const { ServiceEngagementPage } = await import('@/pages/owner/ServiceEngagementPage');

/* ───────────────────────────── harness ──────────────────────────────────── */

beforeEach(() => {
  services = [];
  engagements = [];
  instantiations = [];
  customers = [];
});

function renderWithProviders(ui: React.ReactNode, initialPath = '/') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
    </ToastProvider>,
  );
}

function renderWorkspace() {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/finance/customers/:customerId/services/:serviceKey" element={<ServiceEngagementPage />} />
    </Routes>,
    `/admin/finance/customers/${CUSTOMER_ID}/services/ai_receptionist`,
  );
}

async function seedReceptionist(): Promise<StoredEngagement> {
  const api = await import('@/lib/serviceOnboarding/api');
  await api.addCustomerService(CUSTOMER_ID, 'ai_receptionist');
  return engagements[0];
}

/* ───────────────────────────── service assignment ───────────────────────── */

describe('service assignment', () => {
  it('provisions the AI Receptionist workspace when the service is selected on a new customer', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithProviders(
      <CustomerFormDialog open onClose={() => {}} entityId={ENTITY.id} onSaved={onSaved} />,
    );

    await user.type(screen.getByLabelText('Firma'), 'Beispielpraxis GmbH');
    await user.click(screen.getByRole('button', { name: /AI Receptionist/ }));
    await user.click(screen.getByRole('button', { name: 'Kunde anlegen' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(services).toHaveLength(1);
    expect(services[0].service_key).toBe('ai_receptionist');
    expect(engagements).toHaveLength(1);
    expect(instantiations).toHaveLength(1);
  });

  it('supports several services on one canonical customer', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithProviders(
      <CustomerFormDialog open onClose={() => {}} entityId={ENTITY.id} onSaved={onSaved} />,
    );

    await user.type(screen.getByLabelText('Firma'), 'Beispielpraxis GmbH');
    await user.click(screen.getByRole('button', { name: /AI Receptionist/ }));
    await user.click(screen.getByRole('button', { name: /Automationen/ }));
    await user.click(screen.getByRole('button', { name: 'Kunde anlegen' }));

    // Wait on the component's own completion signal rather than on the module-level store:
    // `waitFor` polls inside act(), which does not reliably let a chain of already-pending
    // promises settle, so a plain array can still read empty long after the save is done.
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(services).toHaveLength(2);
    // One customer, two services — not two customers.
    expect(new Set(services.map((s) => s.customer_id)).size).toBe(1);
    expect(customers).toHaveLength(1);
  });

  it('creates the engagement exactly once even if the service is added again', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    await api.addCustomerService(CUSTOMER_ID, 'ai_receptionist');
    await api.addCustomerService(CUSTOMER_ID, 'ai_receptionist');
    await api.addCustomerService(CUSTOMER_ID, 'ai_receptionist');

    expect(services).toHaveLength(1);
    expect(engagements).toHaveLength(1);
    expect(instantiations).toHaveLength(1);
  });

  it('snapshots the template version the engagement was created from', async () => {
    const engagement = await seedReceptionist();
    expect(engagement.template_code).toBe('ai_receptionist_healthcare');
    expect(engagement.template_version).toBe(1);
    // A later template version must not retro-fit a running engagement.
    TEMPLATE.tasks.push({ section_code: 'agent', code: 'AGT-999', title: 'Neu in v2', required: true, blocker: true, healthcare_only: false, sort_order: 99 });
    expect(engagement.tasks.some((t) => t.code === 'AGT-999')).toBe(false);
    TEMPLATE.tasks.pop();
  });

  it('opens a usable but empty workspace for a service that has no template yet', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    await api.addCustomerService(CUSTOMER_ID, 'website');
    expect(engagements[0].template_code).toBeNull();
    expect(engagements[0].tasks).toHaveLength(0);
  });
});

/* ───────────────────────────── existing customers ───────────────────────── */

describe('existing customers', () => {
  it('shows an empty state and provisions nothing on its own', async () => {
    renderWithProviders(<CustomerServicesPanel customerId={CUSTOMER_ID} />);
    expect(await screen.findByText(/noch keine Leistung zugeordnet/)).toBeInTheDocument();
    expect(services).toHaveLength(0);
    expect(engagements).toHaveLength(0);
  });

  it('lets a service be added later, from the customer page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerServicesPanel customerId={CUSTOMER_ID} />);
    await screen.findByText(/noch keine Leistung zugeordnet/);

    await user.click(screen.getAllByRole('button', { name: /Leistung hinzufügen/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /AI Receptionist/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Leistung hinzufügen' }));

    await waitFor(() => expect(engagements).toHaveLength(1));
    expect(await screen.findByRole('link', { name: /AI Receptionist/ })).toBeInTheDocument();
  });

  it('reports WHY a service could not be added, without painting SQL into the toast', async () => {
    // The confirmed production failure. The panel used to discard this entirely and show
    // "Leistung konnte nicht hinzugefügt werden" with only the service name, which is
    // indistinguishable from an expired session and told the owner nothing.
    const AUDIT_FK = {
      code: '23503',
      message: 'insert or update on table "owner_audit_log" violates foreign key constraint "owner_audit_log_business_entity_id_fkey"',
      details: 'Key (business_entity_id)=(64e1b3cf-82c3-451c-b54c-636b86073903) is not present in table "owner_business_entities".',
    };
    const user = userEvent.setup();
    const api = await import('@/lib/serviceOnboarding/api');
    vi.mocked(api.addCustomerService).mockResolvedValueOnce({
      serviceId: null, engagementId: null, created: false, error: AUDIT_FK.message,
      failure: describeServiceFailure(AUDIT_FK, 'AI Receptionist'),
    });

    renderWithProviders(<CustomerServicesPanel customerId={CUSTOMER_ID} />);
    await screen.findByText(/noch keine Leistung zugeordnet/);

    await user.click(screen.getAllByRole('button', { name: /Leistung hinzufügen/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /AI Receptionist/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Leistung hinzufügen' }));

    // A real reason, naming the service and the code worth quoting in a bug report.
    expect(await screen.findByText(/Datenbankregel 23503/)).toBeInTheDocument();
    expect(screen.getByText(/erneuter Versuch ändert nichts/)).toBeInTheDocument();
    // And none of the database's own words.
    expect(screen.queryByText(/owner_audit_log/)).not.toBeInTheDocument();
    expect(screen.queryByText(/foreign key constraint/)).not.toBeInTheDocument();
    expect(screen.queryByText(/64e1b3cf/)).not.toBeInTheDocument();
  });

  it('archiving a service preserves its onboarding history', async () => {
    const user = userEvent.setup();
    const engagement = await seedReceptionist();
    engagement.tasks[0].status = 'complete';
    engagement.tasks[0].completed_at = NOW;

    renderWithProviders(<CustomerServicesPanel customerId={CUSTOMER_ID} />);
    await screen.findByRole('link', { name: /AI Receptionist/ });
    await user.click(screen.getByRole('button', { name: 'Archivieren' }));
    await user.click(await screen.findByRole('button', { name: 'Leistung archivieren' }));

    // Same reason as above: wait on the rendered outcome, not on the module-level store.
    expect(await screen.findByRole('button', { name: 'Wieder aktivieren' })).toBeInTheDocument();
    expect(services[0].state).toBe('archived');
    // Nothing was destroyed.
    expect(engagements).toHaveLength(1);
    expect(engagements[0].tasks[0].status).toBe('complete');
    // The badge in the archived list, plus the toast confirming it. Both are expected.
    expect(screen.getAllByText('Archiviert').length).toBeGreaterThan(0);
  });
});

/* ──────────────────── behaviour before the migrations are applied ───────── */

describe('pre-migration behaviour', () => {
  /** What PostgREST returns for an RPC that does not exist yet. */
  const MISSING_RPC = {
    code: 'PGRST202',
    message: 'Could not find the function public.owner_list_customer_services(p_customer_id) in the schema cache',
    details: null,
    hint: null,
  };

  it('states plainly that the feature is not activated yet, without an error or a retry', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    vi.mocked(api.loadCustomerServices).mockRejectedValueOnce(MISSING_RPC);

    renderWithProviders(<CustomerServicesPanel customerId={CUSTOMER_ID} />);

    expect(await screen.findByText(/noch nicht aktiviert/)).toBeInTheDocument();
    // No alarm and no retry: retrying cannot create the tables.
    expect(screen.queryByRole('button', { name: 'Erneut versuchen' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Leistung hinzufügen/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/konnten nicht geladen werden/)).not.toBeInTheDocument();
  });

  it('still surfaces a genuine failure as an error with a retry — it is never masked', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    vi.mocked(api.loadCustomerServices).mockRejectedValueOnce({
      code: '42501', message: 'permission denied for function owner_list_customer_services',
    });

    renderWithProviders(<CustomerServicesPanel customerId={CUSTOMER_ID} />);

    expect(await screen.findByText(/konnten nicht geladen werden/)).toBeInTheDocument();
    expect(screen.getByText(/permission denied/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    expect(screen.queryByText(/noch nicht aktiviert/)).not.toBeInTheDocument();
  });

  it('the workspace route says the same thing rather than showing a Postgres error', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    vi.mocked(api.loadCustomerServices).mockRejectedValueOnce(MISSING_RPC);

    renderWorkspace();

    expect(await screen.findByText('Leistungsverwaltung noch nicht aktiviert')).toBeInTheDocument();
    expect(screen.queryByText(/schema cache/)).not.toBeInTheDocument();
  });

  it('saves the customer and explains the service could not be provisioned yet', async () => {
    const user = userEvent.setup();
    const api = await import('@/lib/serviceOnboarding/api');
    vi.mocked(api.addCustomerService).mockResolvedValueOnce({
      serviceId: null, engagementId: null, created: false, error: MISSING_RPC.message,
      failure: describeServiceFailure(MISSING_RPC, 'AI Receptionist'),
    });
    const onSaved = vi.fn();

    renderWithProviders(
      <CustomerFormDialog open onClose={() => {}} entityId={ENTITY.id} onSaved={onSaved} />,
    );
    await user.type(screen.getByLabelText('Firma'), 'Beispielpraxis GmbH');
    await user.click(screen.getByRole('button', { name: /AI Receptionist/ }));
    await user.click(screen.getByRole('button', { name: 'Kunde anlegen' }));

    // The customer itself was saved; only the service layer was unavailable.
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(customers).toHaveLength(1);
    expect(await screen.findByText('Leistungen noch nicht verfügbar')).toBeInTheDocument();
    expect(screen.getByText(/Der Kunde wurde gespeichert/)).toBeInTheDocument();
  }, 20000);
});

/* ───────────────────────────── the workspace ────────────────────────────── */

describe('AI Receptionist workspace', () => {
  it('opens on the command centre with readiness, the blocker count and the next action', async () => {
    await seedReceptionist();
    renderWorkspace();

    expect(await screen.findByRole('heading', { name: 'Beispielpraxis GmbH' })).toBeInTheDocument();
    // Two blockers apply to a non-healthcare client: the AVV task and the agent id field.
    expect(await screen.findByRole('button', { name: '2 Blocker ansehen' })).toBeInTheDocument();
    expect(screen.getByText('Go-Live: gesperrt')).toBeInTheDocument();
    expect(screen.getAllByText('AVV vom Kunden erhalten').length).toBeGreaterThan(0);
  });

  it('hides healthcare obligations until the project is marked healthcare', async () => {
    const engagement = await seedReceptionist();
    renderWorkspace();
    await screen.findByRole('heading', { name: 'Beispielpraxis GmbH' });
    expect(screen.queryByText('Art. 9 DSGVO bestätigt')).not.toBeInTheDocument();

    engagement.healthcare = true;
    renderWorkspace();
    await waitFor(() => expect(screen.getAllByText('Art. 9 DSGVO bestätigt').length).toBeGreaterThan(0));
  });

  it('refuses the production phases while a blocker is open, and says why', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    const engagement = await seedReceptionist();

    const blocked = await api.setEngagementStatus(engagement.id, 'live');
    expect(blocked.error).toContain('Go-Live gesperrt');
    expect(engagement.lifecycle_status).toBe('lead');

    renderWorkspace();
    await screen.findByRole('heading', { name: 'Beispielpraxis GmbH' });
    expect(screen.getByText(/Startbereit, Live und Monitoring bleiben gesperrt/)).toBeInTheDocument();
  });

  it('opens the gate once every applicable blocker is resolved', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    const engagement = await seedReceptionist();

    await api.setEngagementTask(engagement.tasks.find((t) => t.code === 'LEG-002')!.id, { status: 'complete' });
    await api.setEngagementField(engagement.fields[0].id, { value: 'agent_abc123' });

    expect(gateOf(engagement).ready).toBe(true);
    expect((await api.setEngagementStatus(engagement.id, 'live')).error).toBeNull();

    renderWorkspace();
    expect(await screen.findByText('Go-Live: freigegeben')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Blocker ansehen/ })).not.toBeInTheDocument();
  });

  it('a healthcare blocker re-closes the gate for a healthcare client', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    const engagement = await seedReceptionist();
    await api.setEngagementTask(engagement.tasks.find((t) => t.code === 'LEG-002')!.id, { status: 'complete' });
    await api.setEngagementField(engagement.fields[0].id, { value: 'agent_abc123' });
    expect(gateOf(engagement).ready).toBe(true);

    await api.updateEngagement(engagement.id, { healthcare: true });
    expect(gateOf(engagement).ready).toBe(false);
    expect((await api.setEngagementStatus(engagement.id, 'ready_for_go_live')).error).toContain('Go-Live gesperrt');
  });

  it('demands a reason before a step may be marked blocked', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    const engagement = await seedReceptionist();
    const task = engagement.tasks[0];

    expect((await api.setEngagementTask(task.id, { status: 'blocked' })).error)
      .toContain('braucht eine Begründung');
    expect(task.status).toBe('not_started');

    expect((await api.setEngagementTask(task.id, { status: 'blocked', blocker_reason: 'Kunde antwortet nicht' })).error).toBeNull();
    expect(task.status).toBe('blocked');
    expect(task.blocker_reason).toBe('Kunde antwortet nicht');
  });

  it('demands the exact request before a step may wait on the client', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    const engagement = await seedReceptionist();
    const task = engagement.tasks[0];

    expect((await api.setEngagementTask(task.id, { status: 'waiting_for_client' })).error)
      .toContain('was genau vom Kunden benötigt wird');
    expect((await api.setEngagementTask(task.id, { status: 'waiting_for_client', client_request: 'AVV im Original' })).error).toBeNull();
    expect(task.client_request).toBe('AVV im Original');
  });

  it('records meaningful state changes in the engagement history', async () => {
    const api = await import('@/lib/serviceOnboarding/api');
    const engagement = await seedReceptionist();
    await api.setEngagementTask(engagement.tasks[0].id, { status: 'in_progress' });

    renderWorkspace();
    await screen.findByRole('heading', { name: 'Beispielpraxis GmbH' });
    expect(screen.getByText('Onboarding-Workspace angelegt')).toBeInTheDocument();
    expect(screen.getByText(/AVV vom Kunden erhalten -> in_progress/)).toBeInTheDocument();
  });

  it('reports the template version it was instantiated from', async () => {
    await seedReceptionist();
    renderWorkspace();
    await screen.findByRole('heading', { name: 'Beispielpraxis GmbH' });
    expect(screen.getByText(/ai_receptionist_healthcare · v1/)).toBeInTheDocument();
  });
});
