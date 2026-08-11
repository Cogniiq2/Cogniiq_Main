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
        subNavLabel={activeModule.subNavLabel}
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
      '/admin/oura-analytics',
    ]) {
      const view = renderAt(pathname);
      for (const nav of screen.getAllByRole('navigation', { name: 'Workspace Navigation' })) {
        expect(nav.querySelectorAll('[aria-current="page"]').length, `pathname ${pathname}`).toBe(1);
      }
      view.unmount();
    }
  });

  it('keeps a module without sub-navigation as the page itself', () => {
    renderAt('/admin/oura-analytics');
    const nav = rail();
    // Oura has no sub-nav, so the module row is the destination rather than a container.
    expect(within(nav).getByRole('link', { name: 'Oura Analytics' }).getAttribute('aria-current')).toBe('page');
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
    for (const item of getActiveModule('/admin/finance/overview').subNav) {
      expect(hrefs, item.label).toContain(item.href);
    }
  });
});
