import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const api = vi.hoisted(() => ({
  listReceptionists: vi.fn(),
  listOrganizations: vi.fn(),
  adminAction: vi.fn(),
}));

vi.mock('@/lib/goldenAgent/dashboard/receptionistApi', () => ({
  listReceptionists: api.listReceptionists,
  listOrganizations: api.listOrganizations,
  adminAction: api.adminAction,
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

afterEach(() => { vi.clearAllMocks(); });

describe('AI Receptionists list', () => {
  it('lists receptionists with stage badges and creates a new one through the admin function', async () => {
    api.listReceptionists.mockResolvedValue([
      { id: 'r1', organization_id: 'o1', organization_name: 'Haema Leipzig', name: 'Haema Leipzig — DEV', stage: 'dev', provider: 'elevenlabs', provider_agent_id: 'agent_1', config_version: 3, prompt_version: '2026.09.1', last_synced_at: '2026-09-05T10:00:00Z', last_sync_error: null, updated_at: '2026-09-05T10:00:00Z' },
      { id: 'r2', organization_id: 'o2', organization_name: 'Test Clinic', name: 'Test Clinic', stage: 'evaluation', provider: 'elevenlabs', provider_agent_id: null, config_version: 1, prompt_version: null, last_synced_at: null, last_sync_error: 'boom', updated_at: '2026-09-05T10:00:00Z' },
    ]);
    api.listOrganizations.mockResolvedValue([{ id: 'o3', name: 'Neue Praxis' }]);
    api.adminAction.mockResolvedValue({ ok: true, receptionistId: 'r3', gaps: [] });
    const { ToastProvider } = await import('@/components/dashboard');
    const { ReceptionistsListPage } = await import('./ReceptionistsListPage');

    render(<MemoryRouter><ToastProvider><ReceptionistsListPage /></ToastProvider></MemoryRouter>);
    expect((await screen.findAllByText('Haema Leipzig — DEV')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('DEV').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EVALUATION').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fehler').length).toBeGreaterThan(0);

    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: /Create AI Receptionist/ })[0]);
    await waitFor(() => expect(api.listOrganizations).toHaveBeenCalled());
    await user.type(screen.getByLabelText(/Name/), 'Neue Praxis Rezeption');
    await user.click(screen.getByRole('button', { name: 'Anlegen' }));
    await waitFor(() => expect(api.adminAction).toHaveBeenCalledWith({ action: 'create', organizationId: 'o3', name: 'Neue Praxis Rezeption' }));
    expect(navigate).toHaveBeenCalledWith('/admin/receptionists/r3');
  });
});
