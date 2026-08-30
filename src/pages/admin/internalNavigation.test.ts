import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { allNavHrefs, getActiveModule, getSections, isSubNavActive } from '@/pages/admin/internalNavigation';

// The navigation contract.
//
// The rule this file exists to enforce: the rail may only offer destinations that
// actually resolve. A link to a page that does not exist is worse than no link,
// because the owner cannot tell "not built yet" from "broken" — and the target
// architecture names several sections (Command Center, Leads & Pipeline, Projects)
// whose pages are still being built in other workstreams. Nothing may start
// advertising them by accident.

const APP_SOURCE = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const FINANCE_SOURCE = readFileSync(resolve(process.cwd(), 'src/pages/admin/finance/FinanceModule.tsx'), 'utf8');

/** Does a route exist for this href, in App.tsx or inside the finance module's own Routes? */
function routeExists(href: string): boolean {
  if (APP_SOURCE.includes(`path="${href}"`)) return true;
  if (href.startsWith('/admin/finance/')) {
    const relative = href.slice('/admin/finance/'.length);
    return FINANCE_SOURCE.includes(`path="${relative}"`);
  }
  return false;
}

describe('internal navigation destinations', () => {
  it('offers only destinations that have a route', () => {
    for (const href of allNavHrefs()) {
      expect(routeExists(href), `no route for ${href}`).toBe(true);
    }
  });

  it('advertises no section whose backend is still being built elsewhere', () => {
    // Leads & Pipeline waits on the CRM lead foundation; Projects waits on the project
    // spine; the Command Center waits on both. Until then they must not appear.
    const hrefs = allNavHrefs().join(' ');
    for (const forbidden of ['/admin/leads', '/admin/projects', '/admin/command', '/admin/home']) {
      expect(hrefs, `${forbidden} must not be linked yet`).not.toContain(forbidden);
    }
  });
});

describe('surfaces withheld from the rail', () => {
  const sections = getSections('/admin', { isOwner: true });

  it('does not show Oura Analytics in the top-level navigation', () => {
    expect(sections.some((s) => s.key === 'oura')).toBe(false);
  });

  it('keeps the Oura route resolvable and correctly titled when reached by URL', () => {
    // Hidden, not deleted: the page, its data and its deep links are untouched.
    const active = getActiveModule('/admin/oura-analytics');
    expect(active.key).toBe('oura');
    expect(active.title).toBe('Oura Analytics');
    expect(APP_SOURCE.includes('path="/admin/oura-analytics"')).toBe(true);
  });

  it('does not link Execution OS from the task navigation, but keeps its route', () => {
    expect(allNavHrefs()).not.toContain('/admin/execution');
    expect(APP_SOURCE.includes('path="/admin/execution"')).toBe(true);
    // It still belongs to the task module, so reaching it by URL keeps the right rail.
    expect(getActiveModule('/admin/execution').key).toBe('tasks');
  });
});

describe('finance information architecture', () => {
  const finance = getActiveModule('/admin/finance/overview');

  it('groups the finance module by what the business actually does', () => {
    expect(finance.subNav.map((group) => group.label)).toEqual([
      undefined, 'Einnahmen', 'Kosten', 'Buchhaltung', 'System',
    ]);
  });

  it('keeps every previously reachable finance destination', () => {
    // Regrouping must not quietly drop a page. These are the thirteen destinations the
    // flat sub-navigation carried before.
    const hrefs = finance.subNav.flatMap((group) => group.items.map((item) => item.href));
    for (const key of [
      'overview', 'customers', 'offers', 'invoices', 'expenses', 'subscriptions', 'assets',
      'taxes', 'revenue', 'contracts', 'documents', 'audit', 'settings',
    ]) {
      expect(hrefs, key).toContain(`/admin/finance/${key}`);
    }
    expect(hrefs.length).toBe(13);
  });

  it('lists no destination twice', () => {
    const hrefs = finance.subNav.flatMap((group) => group.items.map((item) => item.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('uses unique group keys so the rail can key its bands', () => {
    const keys = finance.subNav.map((group) => group.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('owner-only filtering is unchanged', () => {
  it('withholds finance from a non-owner', () => {
    expect(getSections('/admin', { isOwner: false }).some((s) => s.key === 'finance')).toBe(false);
  });

  it('offers finance to an owner', () => {
    expect(getSections('/admin', { isOwner: true }).some((s) => s.key === 'finance')).toBe(true);
  });
});

describe('sub-navigation highlighting', () => {
  it('highlights a parent list from its detail page', () => {
    expect(isSubNavActive('/admin/finance/invoices/abc', '/admin/finance/invoices')).toBe(true);
  });

  it('never lets the /admin root swallow every task tab', () => {
    expect(isSubNavActive('/admin/tasks/today', '/admin')).toBe(false);
  });
});
