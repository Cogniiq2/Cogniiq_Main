// The operator-facing half of the AI Receptionists detail page.
//
// These assertions are about honesty, not layout. An operator looking at this page must be able to
// answer three questions correctly without opening a terminal:
//   1. Is this thing actually provisioned, or did a run fail halfway?
//   2. When a provisioning failed, what do I have to change?
//   3. Are the bookings this agent makes real?

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const api = vi.hoisted(() => ({
  getReceptionist: vi.fn(),
  listCalls: vi.fn(),
  listCallEvents: vi.fn(),
  listConfigVersions: vi.fn(),
  listEvaluationRuns: vi.fn(),
  listEvaluationResults: vi.fn(),
  adminAction: vi.fn(),
}));

class FakeAdminActionError extends Error {
  constructor(message: string, readonly status: number, readonly details: unknown) {
    super(message);
    this.name = 'AdminActionError';
  }
}

vi.mock('@/lib/goldenAgent/dashboard/receptionistApi', () => ({
  ...api,
  AdminActionError: FakeAdminActionError,
}));

async function detailRow(overrides: Record<string, unknown> = {}) {
  const { testClinicConfig, TEST_CLINIC_CLIENT_ID } = await import('@/lib/goldenAgent');
  return {
    id: 'r1', organization_id: TEST_CLINIC_CLIENT_ID, organization_name: 'Test Clinic',
    name: 'Test Clinic DEV', stage: 'dev', provider: 'elevenlabs',
    provider_agent_id: null, config_version: 1, prompt_version: null,
    last_synced_at: null, last_sync_error: null, updated_at: '2026-09-05T10:00:00Z',
    created_at: '2026-09-01T10:00:00Z', notes: null,
    client_config: testClinicConfig({ stage: 'dev' }),
    provider_state: {},
    ...overrides,
  };
}

async function renderDetail() {
  const { ToastProvider } = await import('@/components/dashboard');
  const { ReceptionistDetailPage } = await import('./ReceptionistDetailPage');
  render(
    <MemoryRouter initialEntries={['/admin/receptionists/r1']}>
      <ToastProvider>
        <Routes><Route path="/admin/receptionists/:receptionistId" element={<ReceptionistDetailPage />} /></Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

afterEach(() => { vi.clearAllMocks(); });

describe('AI Receptionist detail — operator truthfulness', () => {
  it('says "not provisioned" while no agent exists, and warns that mock bookings are not real', async () => {
    api.getReceptionist.mockResolvedValue(await detailRow());
    api.listConfigVersions.mockResolvedValue([]);
    await renderDetail();

    expect(await screen.findByText('Nicht provisioniert')).toBeInTheDocument();
    expect(screen.getByText(/0\/11 Tools|0 von 11/)).toBeInTheDocument();
    expect(screen.getByText(/es entstehen KEINE echten Termine/i)).toBeInTheDocument();
  });

  it('shows "partially provisioned" when tools exist but the agent does not', async () => {
    api.getReceptionist.mockResolvedValue(await detailRow({
      provider_state: { toolIds: { get_available_slots: 'tool_1', create_appointment: 'tool_2' } },
    }));
    api.listConfigVersions.mockResolvedValue([]);
    await renderDetail();
    expect(await screen.findByText('Teilweise provisioniert')).toBeInTheDocument();
    expect(screen.getByText(/2 von 11 Tools existieren, aber noch kein Agent/)).toBeInTheDocument();
  });

  it('keeps a failed provisioning visible with its actionable message, not just a toast', async () => {
    const message = 'ElevenLabs authentication failure (HTTP 401) while creating the workspace tool secret. Verify that ELEVENLABS_API_KEY is valid, not expired, and has the "Workspace Secrets (write)" permission.';
    api.getReceptionist.mockResolvedValue(await detailRow({ last_sync_error: message }));
    api.listConfigVersions.mockResolvedValue([]);
    await renderDetail();

    expect(await screen.findByText('Provisionierung fehlgeschlagen')).toBeInTheDocument();
    expect(screen.getByText(new RegExp('Workspace Secrets \\(write\\)'))).toBeInTheDocument();
  });

  it('explains a permission failure returned by a provisioning attempt as a key problem, not a config problem', async () => {
    api.getReceptionist.mockResolvedValue(await detailRow());
    api.listConfigVersions.mockResolvedValue([]);
    api.adminAction.mockRejectedValue(new FakeAdminActionError(
      'ElevenLabs authentication failure (HTTP 401) while creating the workspace tool secret. Verify that ELEVENLABS_API_KEY is valid, not expired, and has the "Workspace Secrets (write)" permission.',
      502,
      { kind: 'authentication', status: 401, action: 'create_workspace_secret', retryable: false },
    ));
    const user = await renderDetail();

    await user.click(await screen.findByRole('tab', { name: 'Agent' }));
    await user.click(await screen.findByRole('button', { name: /Agent erstellen/ }));

    await waitFor(() => expect(screen.getAllByText(/Workspace Secrets \(write\)/).length).toBeGreaterThan(0));
    expect(screen.getByText(/Berechtigung des ElevenLabs-API-Keys, kein Fehler in der Konfiguration/)).toBeInTheDocument();
    expect(screen.getByText(/bereits erstellte Ressourcen werden wiederverwendet/i)).toBeInTheDocument();
  });

  it('never presents the offline suite as evidence about the live agent', async () => {
    api.getReceptionist.mockResolvedValue(await detailRow({ provider_agent_id: 'agent_1', last_synced_at: '2026-09-05T10:00:00Z' }));
    api.listConfigVersions.mockResolvedValue([]);
    api.listEvaluationRuns.mockResolvedValue([
      { id: 'run1', mode: 'offline_reference', status: 'completed', config_version: 1, prompt_version: '2026.09.1', provider_invocation_id: null, total: 39, passed: 39, failed: 0, summary: {}, error: null, created_at: '2026-09-05T10:00:00Z', finished_at: '2026-09-05T10:01:00Z' },
    ]);
    api.listEvaluationResults.mockResolvedValue([]);
    const user = await renderDetail();

    await user.click(await screen.findByRole('tab', { name: 'Evaluations' }));
    // The label appears both in the legend of modes and on the run itself.
    expect((await screen.findAllByText('Offline-Referenz')).length).toBeGreaterThan(1);
    expect(screen.getAllByText('belegt KEIN Live-Verhalten').length).toBeGreaterThan(0);

    // Selecting the green offline run states plainly what it does not prove.
    await user.click(screen.getByRole('button', { name: /39\/39 bestanden/ }));
    await waitFor(() => expect(screen.getByText(/Was dieser Lauf belegt — und was nicht/)).toBeInTheDocument());
  });
});
