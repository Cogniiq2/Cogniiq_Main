import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// DashboardShell only needs an identity for the account block; the surrounding workspace supplies
// the real one. Everything about routing and permissions comes in as props.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { full_name: 'Owner', email: 'owner@cogniiq.de' },
    user: { email: 'owner@cogniiq.de' },
    signOut: vi.fn(),
  }),
}));

const { DashboardShell } = await import('@/components/dashboard/DashboardShell');
const { getSections, getActiveModule, isSubNavActive } = await import('@/pages/admin/internalNavigation');

function renderAt(pathname: string, { isOwner = true } = {}) {
  const activeModule = getActiveModule(pathname);
  const moduleAllowed = !activeModule.ownerOnly || isOwner;
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <DashboardShell
        sections={getSections(pathname, { isOwner })}
        subNav={moduleAllowed ? activeModule.subNav : []}
        activeSubKey={isSubNavActive}
        title={moduleAllowed ? activeModule.title : 'Cogniiq'}
      >
        <p>Inhalt</p>
      </DashboardShell>
    </MemoryRouter>,
  );
}

function rail() {
  return screen.getAllByRole('navigation', { name: 'Workspace Navigation' })[0];
}

describe('DashboardShell aria-current semantics', () => {
  it('announces the owner finance module as a containing section and the sub-page as the page', () => {
    renderAt('/admin/finance/invoices');
    const nav = rail();

    expect(within(nav).getByRole('link', { name: 'Finance & Steuern' }).getAttribute('aria-current')).toBe('true');
    expect(within(nav).getByRole('link', { name: 'Rechnungen' }).getAttribute('aria-current')).toBe('page');
  });

  it('renders exactly one aria-current="page" per navigation landmark', () => {
    for (const pathname of [
      '/admin',
      '/admin/tasks/today',
      '/admin/clients',
      '/admin/finance/overview',
      '/admin/finance/invoices',
      '/admin/finance/expenses',
      '/admin/finance/taxes',
    ]) {
      const view = renderAt(pathname);
      for (const nav of screen.getAllByRole('navigation', { name: 'Workspace Navigation' })) {
        expect(nav.querySelectorAll('[aria-current="page"]').length, `pathname ${pathname}`).toBe(1);
      }
      view.unmount();
    }
  });

  it('never announces more than one current page on a route the rail does not represent', () => {
    // Oura is withheld from the rail (route intact, link gone), so nothing in the
    // navigation corresponds to this location. Announcing zero current pages is correct;
    // announcing two would be a broken landmark.
    renderAt('/admin/oura-analytics');
    for (const nav of screen.getAllByRole('navigation', { name: 'Workspace Navigation' })) {
      expect(nav.querySelectorAll('[aria-current="page"]').length).toBeLessThanOrEqual(1);
    }
  });

  it('keeps a module without sub-navigation as the page itself', () => {
    // A component-level contract, exercised directly: every module in the app's current
    // navigation happens to carry a sub-navigation, but the shell must still downgrade
    // nothing when a caller supplies none.
    render(
      <MemoryRouter initialEntries={['/admin/solo']}>
        <DashboardShell
          sections={[{ key: 'solo', label: 'Solo', href: '/admin/solo', active: true }]}
          subNav={[]}
        >
          <p>Inhalt</p>
        </DashboardShell>
      </MemoryRouter>,
    );
    const nav = screen.getAllByRole('navigation', { name: 'Workspace Navigation' })[0];
    expect(within(nav).getByRole('link', { name: 'Solo' }).getAttribute('aria-current')).toBe('page');
  });

  it('drops an empty sub-navigation group instead of rendering an orphan heading', () => {
    render(
      <MemoryRouter initialEntries={['/admin/solo']}>
        <DashboardShell
          sections={[{ key: 'solo', label: 'Solo', href: '/admin/solo', active: true }]}
          subNav={[
            { key: 'filled', label: 'Vorhanden', items: [{ key: 'a', label: 'A', href: '/admin/solo/a' }] },
            // The shape a future section takes while its destinations do not exist yet.
            { key: 'pending', label: 'Noch nicht da', items: [] },
          ]}
        >
          <p>Inhalt</p>
        </DashboardShell>
      </MemoryRouter>,
    );
    const nav = screen.getAllByRole('navigation', { name: 'Workspace Navigation' })[0];
    expect(within(nav).queryByText('Noch nicht da')).toBeNull();
    expect(within(nav).getByText('Vorhanden')).toBeTruthy();
  });

  it('still marks the module as active, so the visual selected state is unchanged', () => {
    renderAt('/admin/finance/invoices');
    const nav = rail();
    const moduleLink = within(nav).getByRole('link', { name: 'Finance & Steuern' });
    // 'true' and 'page' both style as selected; what matters is that it is still marked at all.
    expect(moduleLink.getAttribute('aria-current')).not.toBeNull();
  });

  it('withholds the owner-only module from a non-owner without breaking the landmark', () => {
    renderAt('/admin', { isOwner: false });
    const nav = rail();
    expect(within(nav).queryByRole('link', { name: 'Finance & Steuern' })).toBeNull();
    expect(nav.querySelectorAll('[aria-current="page"]').length).toBe(1);
  });

  it('preserves every destination the navigation module defines', () => {
    renderAt('/admin/finance/overview');
    const nav = rail();
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    for (const group of getActiveModule('/admin/finance/overview').subNav) {
      for (const item of group.items) {
        expect(hrefs, item.label).toContain(item.href);
      }
    }
  });
});
