import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Behavioural coverage for the three client-platform CRM list pages.
//
// They had none. That mattered here specifically: this suite was written alongside a
// visual migration onto the shared dashboard primitives, and a refactor with no tests is
// exactly how filtering, sorting or an action-gating rule disappears while every screenshot
// still looks right. Everything asserted below is behaviour that existed before the
// migration and must survive it — not the new styling.
//
// Plain vitest assertions only — this repo does not register jest-dom matchers globally.

// src/lib/supabase.ts validates its configuration at module scope and throws without one.
// The dashboard barrel reaches it through DashboardShell -> AuthContext, so the value has to
// exist before any of these imports resolve. Nothing in this file talks to a backend.
vi.stubEnv('VITE_SUPABASE_URL', 'https://crm-pages-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'crm-pages-test-anon-key');

const loadAdminClients = vi.fn();
const setSolutionStatus = vi.fn();
const resendInvitationViaEdge = vi.fn();
const revokeInvitation = vi.fn();

vi.mock('@/lib/clientPlatform/adminApi', () => ({
  loadAdminClients: (...args: unknown[]) => loadAdminClients(...args),
  setSolutionStatus: (...args: unknown[]) => setSolutionStatus(...args),
  resendInvitationViaEdge: (...args: unknown[]) => resendInvitationViaEdge(...args),
  revokeInvitation: (...args: unknown[]) => revokeInvitation(...args),
}));

const { ToastProvider } = await import('@/components/dashboard');
const { ClientsListPage } = await import('@/pages/admin/clients/ClientsListPage');
const { AdminInvitationsPage } = await import('@/pages/admin/clients/AdminInvitationsPage');
const { AdminSolutionsPage } = await import('@/pages/admin/clients/AdminSolutionsPage');

function account(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc', organization_id: 'org', lifecycle_status: 'active', primary_email: 'a@example.de',
    primary_contact_name: 'Anna Admin', phone: '+49 89 1', industry: 'Zahnmedizin',
    estimated_monthly_value_cents: 50000, currency: 'EUR', internal_owner: 'Mario',
    updated_at: '2026-08-01T00:00:00Z', ...overrides,
  };
}

const ROWS = [
  {
    organizationId: 'org-b', organizationName: 'Beta Praxis', organizationStatus: 'active',
    account: account({ id: 'acc-b', organization_id: 'org-b', lifecycle_status: 'paused', primary_email: 'beta@example.de', primary_contact_name: 'Bert', industry: 'Physio', estimated_monthly_value_cents: 90000, updated_at: '2026-08-20T00:00:00Z' }),
    solutions: [{ id: 'sol-b', organization_id: 'org-b', catalog_key: 'ai_receptionist', implementation_key: 'v1', instance_key: 'inst-b', display_name: 'KI-Empfang', status: 'paused' }],
    engagements: [],
    invitations: [{ id: 'inv-b', organization_id: 'org-b', email: 'beta@example.de', organization_role: 'owner', status: 'pending', created_at: '2026-08-02T00:00:00Z', expires_at: '2099-01-01T00:00:00Z' }],
  },
  {
    organizationId: 'org-a', organizationName: 'Alpha Klinik', organizationStatus: 'active',
    account: account({ id: 'acc-a', organization_id: 'org-a' }),
    solutions: [{ id: 'sol-a', organization_id: 'org-a', catalog_key: 'website', implementation_key: 'v2', instance_key: 'inst-a', display_name: 'Website', status: 'active' }],
    engagements: [],
    invitations: [{ id: 'inv-a', organization_id: 'org-a', email: 'alpha@example.de', organization_role: 'member', status: 'accepted', created_at: '2026-08-01T00:00:00Z', expires_at: '2099-01-01T00:00:00Z' }],
  },
];

// DataTable mounts BOTH layouts and lets CSS decide which is visible, so jsdom sees every
// row twice. Scoping to the <table> is what keeps these assertions about behaviour rather
// than about how many times the DOM repeats a name.
const table = () => screen.getAllByRole('table')[0];

function renderPage(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/admin/clients']}>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  loadAdminClients.mockResolvedValue(ROWS);
  setSolutionStatus.mockResolvedValue({ error: null });
  resendInvitationViaEdge.mockResolvedValue({ ok: true, outcome: 'sent', error: null });
  revokeInvitation.mockResolvedValue({ error: null });
});

describe('ClientsListPage', () => {
  it('lists every client and sorts by name by default', async () => {
    renderPage(<ClientsListPage />);
    await screen.findAllByText('Alpha Klinik');
    const names = within(table()).getAllByRole('link', { name: /Klinik|Praxis/ }).map((el) => el.textContent);
    expect(names[0]).toBe('Alpha Klinik');
  });

  it('filters by free-text search across company, contact, e-mail and industry', async () => {
    const user = userEvent.setup();
    renderPage(<ClientsListPage />);
    await screen.findAllByText('Alpha Klinik');

    await user.type(screen.getByLabelText('Suche'), 'Physio');
    await waitFor(() => expect(screen.queryAllByText('Alpha Klinik').length).toBe(0));
    expect(within(table()).getAllByText('Beta Praxis').length).toBeGreaterThan(0);
  });

  it('shows a filter-aware empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage(<ClientsListPage />);
    await screen.findAllByText('Alpha Klinik');

    await user.type(screen.getByLabelText('Suche'), 'existiert-nicht');
    expect(await screen.findByText('Keine Kunden gefunden')).toBeTruthy();
  });

  it('distinguishes "no clients at all" from "nothing matches the filter"', async () => {
    loadAdminClients.mockResolvedValue([]);
    renderPage(<ClientsListPage />);
    expect(await screen.findByText('Noch keine Kunden')).toBeTruthy();
  });

  it('surfaces a load failure without leaking it as an empty list', async () => {
    loadAdminClients.mockRejectedValue(new Error('RLS denied'));
    renderPage(<ClientsListPage />);
    expect(await screen.findByText('RLS denied')).toBeTruthy();
    expect(screen.queryByText('Noch keine Kunden')).toBeNull();
  });

  it('renders each client status and access status as a badge', async () => {
    renderPage(<ClientsListPage />);
    await screen.findAllByText('Alpha Klinik');
    expect(within(table()).getAllByText('paused').length).toBeGreaterThan(0);   // Beta lifecycle
    expect(within(table()).getAllByText('accepted').length).toBeGreaterThan(0); // Alpha invitation
  });
});

describe('AdminInvitationsPage', () => {
  it('offers resend and revoke for a pending invitation', async () => {
    renderPage(<AdminInvitationsPage />);
    await screen.findAllByText('beta@example.de');
    expect(within(table()).getAllByRole('button', { name: /Erneut senden/ }).length).toBe(1);
    expect(within(table()).getAllByRole('button', { name: /Widerrufen/ }).length).toBe(1);
  });

  it('offers no resend or revoke for an accepted invitation', async () => {
    loadAdminClients.mockResolvedValue([ROWS[1]]);
    renderPage(<AdminInvitationsPage />);
    await screen.findAllByText('alpha@example.de');
    expect(within(table()).queryByRole('button', { name: /Erneut senden/ })).toBeNull();
    expect(within(table()).queryByRole('button', { name: /Widerrufen/ })).toBeNull();
  });

  it('resends through the edge function and reloads', async () => {
    const user = userEvent.setup();
    renderPage(<AdminInvitationsPage />);
    await screen.findAllByText('beta@example.de');

    await user.click(within(table()).getAllByRole('button', { name: /Erneut senden/ })[0]);
    await waitFor(() => expect(resendInvitationViaEdge).toHaveBeenCalledWith('inv-b', false));
    await waitFor(() => expect(loadAdminClients).toHaveBeenCalledTimes(2));
  });

  it('reports a failed resend instead of claiming success', async () => {
    const user = userEvent.setup();
    resendInvitationViaEdge.mockResolvedValue({ ok: false, outcome: undefined, error: 'smtp down' });
    renderPage(<AdminInvitationsPage />);
    await screen.findAllByText('beta@example.de');

    await user.click(within(table()).getAllByRole('button', { name: /Erneut senden/ })[0]);
    expect(await screen.findByText('smtp down')).toBeTruthy();
    // A failure must not silently refetch and look like it worked.
    expect(loadAdminClients).toHaveBeenCalledTimes(1);
  });

  it('revokes an invitation', async () => {
    const user = userEvent.setup();
    renderPage(<AdminInvitationsPage />);
    await screen.findAllByText('beta@example.de');

    await user.click(within(table()).getByRole('button', { name: /Widerrufen/ }));
    await waitFor(() => expect(revokeInvitation).toHaveBeenCalledWith('inv-b'));
  });

  it('filters by status through the picker', async () => {
    // The native <select> became the dashboard's listbox picker. Swapping a control is
    // exactly the kind of change that keeps rendering while quietly no longer filtering,
    // so the wiring is asserted rather than assumed.
    const user = userEvent.setup();
    renderPage(<AdminInvitationsPage />);
    await screen.findAllByText('beta@example.de');
    expect(within(table()).getAllByText('alpha@example.de').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('combobox', { name: /Status/ }));
    await user.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'accepted' }));

    await waitFor(() => expect(screen.queryAllByText('beta@example.de').length).toBe(0));
    expect(within(table()).getAllByText('alpha@example.de').length).toBeGreaterThan(0);
  });

  it('shows an empty state when the status filter matches nothing', async () => {
    loadAdminClients.mockResolvedValue([]);
    renderPage(<AdminInvitationsPage />);
    expect(await screen.findByText('Keine Einladungen für diesen Filter')).toBeTruthy();
  });
});

describe('AdminSolutionsPage', () => {
  it('lists every solution instance across organizations', async () => {
    renderPage(<AdminSolutionsPage />);
    await screen.findAllByText('KI-Empfang');
    expect(within(table()).getAllByText('Website').length).toBeGreaterThan(0);
  });

  it('activates a paused solution and reloads', async () => {
    const user = userEvent.setup();
    renderPage(<AdminSolutionsPage />);
    await screen.findAllByText('KI-Empfang');

    await user.click(within(table()).getByRole('button', { name: /Aktivieren/ }));
    await waitFor(() => expect(setSolutionStatus).toHaveBeenCalledWith('sol-b', 'active'));
    await waitFor(() => expect(loadAdminClients).toHaveBeenCalledTimes(2));
  });

  it('pauses an active solution', async () => {
    const user = userEvent.setup();
    renderPage(<AdminSolutionsPage />);
    await screen.findAllByText('Website');

    await user.click(within(table()).getByRole('button', { name: /Pausieren/ }));
    await waitFor(() => expect(setSolutionStatus).toHaveBeenCalledWith('sol-a', 'paused'));
  });

  it('reports a failed status change and does not reload', async () => {
    const user = userEvent.setup();
    setSolutionStatus.mockResolvedValue({ error: 'permission denied' });
    renderPage(<AdminSolutionsPage />);
    await screen.findAllByText('KI-Empfang');

    await user.click(within(table()).getByRole('button', { name: /Aktivieren/ }));
    expect(await screen.findByText('permission denied')).toBeTruthy();
    expect(loadAdminClients).toHaveBeenCalledTimes(1);
  });

  it('links each instance back to its organization', async () => {
    renderPage(<AdminSolutionsPage />);
    await screen.findAllByText('KI-Empfang');
    const link = within(table()).getAllByRole('link', { name: 'Beta Praxis' })[0];
    expect(link.getAttribute('href')).toBe('/admin/clients/org-b');
  });
});

describe('mobile keyboard access', () => {
  it('links the client name from the mobile card, not only the desktop cell', async () => {
    // Below md the "Firma" column is hidden and the mobile card's other affordance is a
    // row click, which a keyboard cannot reach. Without a link in the card title the
    // client detail page becomes unreachable by keyboard on a phone — a regression that
    // no visual check and no desktop-scoped query would ever see.
    renderPage(<ClientsListPage />);
    await screen.findAllByText('Alpha Klinik');

    const all = screen.getAllByRole('link', { name: 'Alpha Klinik' });
    const outsideTable = all.filter((link) => !table().contains(link));
    expect(outsideTable.length).toBeGreaterThan(0);
    expect(outsideTable[0].getAttribute('href')).toBe('/admin/clients/org-a');
  });
});

describe('one design language', () => {
  it('renders no legacy CRM card on the migrated list pages', async () => {
    // The legacy AdminCard is a 16px-radius surface with a 60px drop shadow; the dashboard
    // Card is a 12px hairline. Both on screen at once is the inconsistency this migration
    // removes, and it is invisible to every other assertion in this file.
    const { container } = renderPage(<ClientsListPage />);
    await screen.findAllByText('Alpha Klinik');
    expect(container.querySelectorAll('.rounded-2xl').length).toBe(0);
  });
});
