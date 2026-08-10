import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LayoutGrid, FileText } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PremiumShell, type ShellNavGroup } from './PremiumShell';

// Behavioural tests for the one premium shell both dashboards render through.
//
// jsdom has no layout engine and does not evaluate Tailwind's media queries, so "is it vertical
// at 1024px" cannot be measured here. What CAN be locked down — and is what actually regressed —
// is the STRUCTURE and the RESPONSIVE CONTRACT: an <aside> whose nav is a vertical flex column,
// offset content, no second primary navigation, and the drawer's full interaction contract.
// The pixel-level verification lives in the browser QA script.

const groups: ShellNavGroup[] = [
  {
    id: 'portal',
    label: 'Portal',
    items: [
      { key: '/app', label: 'Übersicht', href: '/app', icon: LayoutGrid, active: true },
      { key: '/app/documents', label: 'Dokumente', href: '/app/documents', icon: FileText, active: false },
    ],
  },
  {
    id: 'solution',
    label: 'Vereinsverwaltung Heinersreuth',
    items: [{ key: '/app/solutions/svh', label: 'Mitgliederverwaltung', href: '/app/solutions/svh', active: false }],
  },
];

const signOut = vi.fn();

function renderShell(overrides: Partial<Parameters<typeof PremiumShell>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <PremiumShell
        brandTitle="Cogniiq"
        brandSubtitle="Kundenbereich"
        brandHref="/"
        groups={groups}
        navLabel="Kundenbereich Navigation"
        indicatorId="test-shell"
        storageKey="test.shell.collapsed"
        identity={{
          displayName: 'Maria Musterfrau',
          email: 'maria@example.de',
          organizationName: 'SV Heinersreuth',
          onSignOut: signOut,
        }}
        {...overrides}
      >
        <p>Seiteninhalt</p>
      </PremiumShell>
    </MemoryRouter>
  );
}

function setPrefersReducedMotion(reduced: boolean) {
  (window as unknown as Record<string, unknown>).matchMedia = (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  setPrefersReducedMotion(false);
});

afterEach(() => {
  document.body.style.overflow = '';
});

/* ---------------------------------------------------------------- 3) vertical, not horizontal */

describe('desktop primary navigation is vertical, not horizontal', () => {
  it('renders the primary navigation inside a persistent <aside>, not a header row', () => {
    const { container } = renderShell();
    const sidebar = container.querySelector('aside[data-shell-nav="primary-desktop"]');
    expect(sidebar).not.toBeNull();
    expect(sidebar!.tagName).toBe('ASIDE');
  });

  it('lays the navigation out as a vertical column and declares that orientation', () => {
    const { container } = renderShell();
    const nav = container.querySelector('aside[data-shell-nav="primary-desktop"] nav')!;
    expect(nav.getAttribute('data-orientation')).toBe('vertical');
    expect(nav.className).toContain('flex-col');
    // The exact failure that shipped: a horizontal row of primary items.
    expect(nav.className).not.toMatch(/\bflex-row\b/);
    expect(nav.className).not.toMatch(/\boverflow-x-auto\b/);
  });

  it('pins the sidebar to the left edge at the specified premium widths', () => {
    const { container } = renderShell();
    const sidebar = container.querySelector('aside[data-shell-nav="primary-desktop"]')!;
    // 80px rail from md, 272px expanded from lg — inside the required 260–280 / 76–88 bands.
    expect(sidebar.className).toContain('fixed');
    expect(sidebar.className).toContain('inset-y-0');
    expect(sidebar.className).toContain('left-0');
    expect(sidebar.className).toContain('w-20');
    expect(sidebar.className).toContain('lg:w-[272px]');
  });

  it('offsets the content column by the sidebar width so nothing is overlapped', () => {
    renderShell();
    const main = document.getElementById('shell-main')!;
    const column = main.parentElement!;
    expect(column.className).toContain('md:pl-20');
    expect(column.className).toContain('lg:pl-[272px]');
  });

  it('drops the content offset to the rail width when the sidebar is collapsed', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Navigation einklappen' }));

    const sidebar = container.querySelector('aside[data-shell-nav="primary-desktop"]')!;
    expect(sidebar.getAttribute('data-shell-collapsed')).toBe('true');
    expect(sidebar.className).not.toContain('lg:w-[272px]');
    expect(document.getElementById('shell-main')!.parentElement!.className).not.toContain('lg:pl-[272px]');
    // Collapsed is a user preference, so it survives a reload.
    expect(window.localStorage.getItem('test.shell.collapsed')).toBe('collapsed');
  });

  it('gives every collapsed item a tooltip so a rail is still readable', () => {
    const { container } = renderShell();
    const tooltips = container.querySelectorAll('aside[data-shell-nav="primary-desktop"] [data-shell-tooltip]');
    expect(tooltips.length).toBe(3);
    expect([...tooltips].map((node) => node.textContent)).toEqual([
      'Übersicht',
      'Dokumente',
      'Mitgliederverwaltung',
    ]);
  });
});

/* ---------------------------------------------------------------- 10) one navigation system */

describe('no surface renders two primary navigation systems at once', () => {
  it('renders exactly one persistent primary navigation', () => {
    const { container } = renderShell();
    expect(container.querySelectorAll('[data-shell-nav="primary-desktop"]').length).toBe(1);
  });

  it('keeps the mobile top bar free of navigation items — it carries only the drawer trigger', () => {
    const { container } = renderShell();
    const topBar = container.querySelector('header')!;
    expect(topBar.className).toContain('md:hidden');
    expect(topBar.querySelectorAll('nav').length).toBe(0);
    // Only the brand link and the drawer trigger.
    expect(within(topBar).queryByRole('link', { name: /Übersicht|Dokumente/ })).toBeNull();
  });

  it('does not mount the drawer navigation until it is opened', () => {
    const { container } = renderShell();
    expect(container.querySelectorAll('[data-shell-nav="primary-mobile"]').length).toBe(0);
  });

  it('scopes the drawer strictly below md, so it can never overlay the persistent sidebar', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Kundenbereich Navigation' }));

    const drawer = await screen.findByRole('dialog');
    expect(drawer.parentElement!.className).toContain('md:hidden');
    // The persistent sidebar is md-and-up only, so the two are mutually exclusive by breakpoint.
    expect(container.querySelector('aside[data-shell-nav="primary-desktop"]')!.className).toContain('md:flex');
  });
});

/* ---------------------------------------------------------------- 7) + 8) drawer behaviour */

describe('mobile drawer', () => {
  const openDrawer = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Kundenbereich Navigation' }));
    return screen.findByRole('dialog');
  };

  it('opens with the full navigation and closes again from its own control', async () => {
    const user = userEvent.setup();
    renderShell();

    const drawer = await openDrawer(user);
    expect(within(drawer).getByRole('link', { name: 'Dokumente' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kundenbereich Navigation' }).getAttribute('aria-expanded')).toBe('true');

    await user.click(within(drawer).getByRole('button', { name: 'Navigation schließen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderShell();
    await openDrawer(user);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    renderShell();
    await openDrawer(user);

    await user.click(document.getElementById('shell-main')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes when a route is selected', async () => {
    const user = userEvent.setup();
    renderShell();
    const drawer = await openDrawer(user);

    await user.click(within(drawer).getByRole('link', { name: 'Dokumente' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('is a modal dialog, locks body scrolling while open and releases it on close', async () => {
    const user = userEvent.setup();
    renderShell();

    const drawer = await openDrawer(user);
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
  });

  it('traps focus inside the drawer instead of letting Tab escape to the page behind it', async () => {
    const user = userEvent.setup();
    renderShell();
    const drawer = await openDrawer(user);

    const focusables = [...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select')];
    expect(focusables.length).toBeGreaterThan(2);

    // Wrap forwards off the last element…
    focusables[focusables.length - 1].focus();
    await user.tab();
    expect(drawer.contains(document.activeElement)).toBe(true);

    // …and backwards off the first.
    focusables[0].focus();
    await user.tab({ shift: true });
    expect(drawer.contains(document.activeElement)).toBe(true);
  });

  it('gives every drawer target a 44px touch height', async () => {
    const user = userEvent.setup();
    renderShell();
    const drawer = await openDrawer(user);

    for (const link of drawer.querySelectorAll('nav a')) {
      expect(link.className).toContain('min-h-11');
    }
    expect(screen.getByRole('button', { name: 'Kundenbereich Navigation' }).className).toContain('h-11');
  });
});

/* ---------------------------------------------------------------- 9) reduced motion */

describe('reduced motion', () => {
  it('renders the active indicator as a plain element, with no shared-layout animation', () => {
    setPrefersReducedMotion(true);
    const { container } = renderShell();

    const activeLink = container.querySelector('aside[data-shell-nav="primary-desktop"] a[aria-current="page"]')!;
    expect(activeLink.querySelector('[data-shell-indicator="static"]')).not.toBeNull();
    expect(activeLink.querySelector('[data-shell-indicator="animated"]')).toBeNull();
  });

  it('animates the active indicator when motion is allowed', () => {
    setPrefersReducedMotion(false);
    const { container } = renderShell();

    const activeLink = container.querySelector('aside[data-shell-nav="primary-desktop"] a[aria-current="page"]')!;
    expect(activeLink.querySelector('[data-shell-indicator="animated"]')).not.toBeNull();
    expect(activeLink.querySelector('[data-shell-indicator="static"]')).toBeNull();
  });

  it('opens the drawer with no entry animation when reduced motion is requested', async () => {
    setPrefersReducedMotion(true);
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Kundenbereich Navigation' }));
    const drawer = await screen.findByRole('dialog');
    expect(drawer.getAttribute('data-shell-motion')).toBe('reduced');
  });

  it('animates the drawer when motion is allowed', async () => {
    setPrefersReducedMotion(false);
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Kundenbereich Navigation' }));
    const drawer = await screen.findByRole('dialog');
    expect(drawer.getAttribute('data-shell-motion')).toBe('full');
  });

  it('marks the loading skeleton so its pulse stops under reduced motion', () => {
    const { container } = renderShell({ loading: true });
    const skeleton = screen.getAllByTestId('shell-nav-skeleton')[0];
    expect(skeleton).toBeTruthy();
    expect(container.querySelectorAll('.motion-reduce\\:animate-none').length).toBeGreaterThan(0);
  });
});

/* ---------------------------------------------------------------- loading + identity */

describe('loading and identity', () => {
  it('renders fixed-height navigation skeletons that match a real item, so nothing shifts', () => {
    renderShell({ loading: true });
    const skeleton = screen.getAllByTestId('shell-nav-skeleton')[0];
    const rows = [...skeleton.children];
    expect(rows.length).toBe(6);
    for (const row of rows) expect(row.className).toContain('min-h-11');
    // No navigation links are guessed at while the model is unknown.
    expect(screen.queryByRole('link', { name: 'Dokumente' })).toBeNull();
  });

  it('puts identity, organization context and logout at the bottom of the sidebar', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();

    const sidebar = container.querySelector('aside[data-shell-nav="primary-desktop"]')!;
    const profileTrigger = within(sidebar as HTMLElement).getByRole('button', { name: /Maria Musterfrau/ });
    // Last child of the sidebar — below the navigation, not above it.
    expect(sidebar.lastElementChild!.contains(profileTrigger)).toBe(true);

    await user.click(profileTrigger);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('SV Heinersreuth')).toBeTruthy();
    await user.click(within(menu).getByRole('menuitem', { name: 'Abmelden' }));
    expect(signOut).toHaveBeenCalled();
  });

  it('opens the profile menu upwards and bounds it to the viewport, so it is never clipped', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();
    const sidebar = container.querySelector('aside[data-shell-nav="primary-desktop"]')!;
    await user.click(within(sidebar as HTMLElement).getByRole('button', { name: /Maria Musterfrau/ }));

    const menu = screen.getByRole('menu');
    expect(menu.className).toContain('bottom-[calc(100%-0.25rem)]');
    expect(menu.className).toContain('max-w-[calc(100vw-2rem)]');
  });

  it('truncates long German labels rather than overflowing the sidebar horizontally', () => {
    const { container } = renderShell();
    const sidebar = container.querySelector('aside[data-shell-nav="primary-desktop"]')!;
    expect(sidebar.querySelector('nav')!.className).toContain('overflow-x-hidden');
    for (const label of sidebar.querySelectorAll(
      'nav a > span:not([data-shell-tooltip]):not([data-shell-indicator])'
    )) {
      expect(label.className).toContain('truncate');
    }
  });
});
