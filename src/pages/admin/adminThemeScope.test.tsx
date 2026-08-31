import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// The internal workspace pins `data-admin-theme="light"` on <html> so the legacy `--admin-*`
// variables (read only by ExecutionPage and OuraAnalyticsPage) resolve. <html> outlives this
// layout in a single-page session, so the attribute has to be removed again on unmount —
// otherwise every marketing page visited after /admin keeps the admin theme scope for the rest
// of the session. That leak is invisible in a screenshot, which is why it is asserted here.

vi.mock('@/components/auth/PlatformAdminRoute', () => ({
  PlatformAdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/dashboard', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CommandPaletteProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isPlatformOwner: true }),
}));

const { InternalWorkspaceLayout } = await import('@/pages/admin/InternalWorkspace');

describe('internal workspace theme scope', () => {
  it('sets the admin theme scope while mounted and removes it on unmount', () => {
    expect(document.documentElement.hasAttribute('data-admin-theme')).toBe(false);

    const view = render(
      <MemoryRouter initialEntries={['/admin']}>
        <InternalWorkspaceLayout />
      </MemoryRouter>,
    );

    expect(document.documentElement.getAttribute('data-admin-theme')).toBe('light');

    view.unmount();

    expect(document.documentElement.hasAttribute('data-admin-theme')).toBe(false);
  });
});

describe('admin theme scope stylesheet', () => {
  // Comments are stripped first: the block that removed this rule quotes it verbatim
  // so a future reader knows what was there and why, and a naive source scan would
  // match that explanation and report a rule that no longer exists.
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('declares no blanket transition under the admin theme scope', () => {
    // `data-admin-theme` sits on <html>, so `[data-admin-theme] *` is a document-wide
    // rule wearing an admin-looking selector. It animated every colour change on every
    // element at 250ms — outside the 140-180ms dashboard band, uncovered by the
    // reduced-motion block scoped to [data-cq-surface], and applied to pages that have
    // nothing to do with the admin centre.
    expect(css).not.toMatch(/\[data-admin-theme\]\s*\*\s*\{/);
  });

  it('keeps the dashboard motion tokens inside the 140-180ms interaction band', () => {
    expect(css).toMatch(/--cq-duration-fast:\s*140ms/);
    expect(css).toMatch(/--cq-duration-base:\s*180ms/);
  });
});
