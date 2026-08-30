import { describe, expect, it } from 'vitest';

import {
  allNavHrefs, getActiveModule, getSections, getSubNav, hiddenNavHrefs, isSubNavActive,
} from '@/pages/admin/internalNavigation';

/**
 * The navigation contract.
 *
 * Two failures this file exists to prevent:
 *
 *  1. A dead link. Every destination the rail offers must be a route the router
 *     actually resolves — the owner cannot tell "not built yet" from "broken", so the
 *     rail is never allowed to advertise something that is not there.
 *  2. A deleted route. Oura Analytics and the standalone Task/Execution OS left the
 *     rail deliberately; they must keep working when typed, because leaving the
 *     navigation is a presentation decision and destroying a surface is not.
 */

// The /admin routes App.tsx mounts, transcribed. A route added there without a matching
// entry here (or vice versa) is exactly the drift this test is for.
const MOUNTED_ROUTES = [
  '/admin',
  '/admin/tasks',
  '/admin/tasks/today',
  '/admin/tasks/overdue',
  '/admin/tasks/completed',
  '/admin/tasks/revenue',
  '/admin/execution',
  '/admin/oura-analytics',
  '/admin/clients',
  '/admin/clients/new',
  '/admin/solutions',
  '/admin/invitations',
  // /admin/finance/* is one nested router; its own destinations are listed explicitly.
  '/admin/finance/overview',
  '/admin/finance/customers',
  '/admin/finance/offers',
  '/admin/finance/invoices',
  '/admin/finance/expenses',
  '/admin/finance/subscriptions',
  '/admin/finance/assets',
  '/admin/finance/taxes',
  '/admin/finance/revenue',
  '/admin/finance/contracts',
  '/admin/finance/documents',
  '/admin/finance/audit',
  '/admin/finance/settings',
];

describe('Admin Center navigation contract', () => {
  it('offers no destination the router does not mount', () => {
    for (const href of allNavHrefs()) {
      expect(MOUNTED_ROUTES, `dead navigation link: ${href}`).toContain(href);
    }
  });

  it('keeps every hidden surface routable', () => {
    for (const href of hiddenNavHrefs()) {
      expect(MOUNTED_ROUTES, `hidden surface lost its route: ${href}`).toContain(href);
    }
  });

  it('withholds Oura Analytics and the standalone task OS from the business navigation', () => {
    const hrefs = allNavHrefs();
    expect(hrefs).not.toContain('/admin/oura-analytics');
    expect(hrefs).not.toContain('/admin/execution');
    expect(hrefs).not.toContain('/admin/tasks');
  });

  it('lands the owner on the Command Center', () => {
    expect(getActiveModule('/admin').key).toBe('home');
    expect(getSections('/admin', { isOwner: true })[0].href).toBe('/admin');
  });

  it('claims the canonical customer workspace for the customers module, not finance', () => {
    expect(getActiveModule('/admin/finance/customers').key).toBe('customers');
    expect(getActiveModule('/admin/finance/customers/abc').key).toBe('customers');
    expect(getActiveModule('/admin/finance/customers/abc/services/ai_receptionist').key).toBe('customers');
    expect(getActiveModule('/admin/finance/invoices').key).toBe('finance');
  });

  it('never shows a non-owner the finance module or an owner-only destination', () => {
    const sections = getSections('/admin', { isOwner: false });
    expect(sections.map((s) => s.key)).not.toContain('finance');

    const hrefs = getSubNav('/admin/clients', { isOwner: false }).flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain('/admin/finance/customers');
    expect(hrefs).toContain('/admin/clients');
  });

  it('points a non-owner customers module at the portal tenants it can actually reach', () => {
    const customers = getSections('/admin/clients', { isOwner: false }).find((s) => s.key === 'customers');
    expect(customers?.href).toBe('/admin/clients');
    const owner = getSections('/admin/clients', { isOwner: true }).find((s) => s.key === 'customers');
    expect(owner?.href).toBe('/admin/finance/customers');
  });

  it('groups the finance rail by what the business does with the money', () => {
    const labels = getSubNav('/admin/finance/overview', { isOwner: true }).map((g) => g.label);
    expect(labels).toEqual([undefined, 'Einnahmen', 'Kosten', 'Buchhaltung', 'System']);
  });

  it('drops empty groups rather than rendering an orphan heading', () => {
    for (const group of getSubNav('/admin/clients', { isOwner: false })) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('highlights a sub-item for its own subtree only', () => {
    expect(isSubNavActive('/admin/finance/invoices/abc', '/admin/finance/invoices')).toBe(true);
    expect(isSubNavActive('/admin/finance/invoices', '/admin/finance/invoices')).toBe(true);
    // /admin is a destination, not a prefix — it must never swallow the whole workspace.
    expect(isSubNavActive('/admin/finance/invoices', '/admin')).toBe(false);
  });
});
