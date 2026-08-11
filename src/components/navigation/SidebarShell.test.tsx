import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LayoutGrid, Wallet } from 'lucide-react';

import { SidebarShell } from '@/components/navigation/SidebarShell';
import type { SidebarNavGroup } from '@/components/navigation/navModel';

// Behavioural coverage for the shared navigation rail: the accessibility contract, the collapsed
// icon-only mode and the mobile drawer. Route/permission resolution lives in each surface's own
// navigation module and is deliberately not exercised here.
// Plain vitest assertions only — this repo does not register jest-dom matchers globally.

function groups(activeHref = '/app'): SidebarNavGroup[] {
  return [
    {
      id: 'portal',
      label: 'Portal',
      items: [
        { key: '/app', label: 'Übersicht', href: '/app', icon: LayoutGrid, active: activeHref === '/app' },
        {
          key: '/app/billing',
          label: 'Abrechnung',
          href: '/app/billing',
          icon: Wallet,
          active: activeHref === '/app/billing',
        },
      ],
    },
  ];
}

function renderShell(overrides: Partial<Parameters<typeof SidebarShell>[0]> = {}) {
  const onToggleCollapse = vi.fn();
  const utils = render(
    <MemoryRouter initialEntries={['/app']}>
      <SidebarShell
        surfaceLabel="Kundenbereich"
        brandHref="/app"
        navLabel="Kundenbereich Navigation"
        groups={groups()}
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        {...overrides}
      >
        <p>Inhalt</p>
      </SidebarShell>
    </MemoryRouter>,
  );
  return { ...utils, onToggleCollapse };
}

/** The desktop rail is the first navigation landmark; the drawer mounts a second one when open. */
function desktopNav() {
  return screen.getAllByRole('navigation', { name: 'Kundenbereich Navigation' })[0];
}

describe('SidebarShell', () => {
  it('exposes a named navigation landmark on the desktop rail', () => {
    renderShell();
    expect(within(desktopNav()).getByRole('link', { name: 'Übersicht' }).getAttribute('href')).toBe('/app');
  });

  it('marks the active item with aria-current and leaves the others unmarked', () => {
    renderShell({ groups: groups('/app/billing') });
    const nav = desktopNav();
    expect(within(nav).getByRole('link', { name: 'Abrechnung' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Übersicht' }).getAttribute('aria-current')).toBeNull();
  });

  it('honours an explicit aria-current value so containing sections announce "true"', () => {
    renderShell({
      groups: [
        {
          id: 'sections',
          label: 'Bereiche',
          items: [
            { key: 'fin', label: 'Finance', href: '/admin/finance', icon: Wallet, active: true, current: 'true' },
          ],
        },
        {
          id: 'module',
          label: 'Finance',
          items: [
            { key: 'ov', label: 'Übersicht', href: '/admin/finance/overview', icon: LayoutGrid, active: true, current: 'page' },
          ],
        },
      ],
    });
    const nav = desktopNav();
    expect(within(nav).getByRole('link', { name: 'Finance' }).getAttribute('aria-current')).toBe('true');
    expect(within(nav).getByRole('link', { name: 'Übersicht' }).getAttribute('aria-current')).toBe('page');
    // The whole point: exactly one 'page' per rendered landmark.
    expect(nav.querySelectorAll('[aria-current="page"]').length).toBe(1);
  });

  it('keeps every item reachable by name when the rail is collapsed', () => {
    renderShell({ collapsed: true });
    const nav = desktopNav();
    // Labels are visually hidden but must stay in the accessibility tree.
    expect(within(nav).getByRole('link', { name: 'Übersicht' }).getAttribute('href')).toBe('/app');
    expect(within(nav).getByRole('link', { name: 'Abrechnung' }).getAttribute('href')).toBe('/app/billing');
  });

  it('reports collapse state on the toggle and calls back when used', async () => {
    const user = userEvent.setup();
    const { onToggleCollapse } = renderShell();
    const toggle = screen.getByRole('button', { name: 'Navigation einklappen' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await user.click(toggle);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('advertises the expand affordance when collapsed', () => {
    renderShell({ collapsed: true });
    expect(screen.getByRole('button', { name: 'Navigation ausklappen' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the mobile drawer as a dialog and closes it on Escape', async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Kundenbereich Navigation' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('link', { name: 'Übersicht' })).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders slots with the variant so duplicated form controls can stay unique', () => {
    renderShell({
      topSlot: ({ variant }) => <div data-testid={`top-${variant}`} />,
      footerSlot: ({ variant }) => <div data-testid={`footer-${variant}`} />,
    });
    expect(screen.getByTestId('top-desktop')).toBeTruthy();
    expect(screen.getByTestId('footer-desktop')).toBeTruthy();
  });

  it('renders its children as page content', () => {
    renderShell();
    expect(screen.getByText('Inhalt')).toBeTruthy();
  });
});
