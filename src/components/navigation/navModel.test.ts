import { describe, expect, it } from 'vitest';

import { resolveAriaCurrent } from '@/components/navigation/navModel';
import type { SidebarNavGroup } from '@/components/navigation/navModel';

// The customer rail nests: a solution's pages live under /app/solutions/<key>/..., which the
// universal "Meine Lösungen" entry also matches. Both must stay highlighted, but only one may
// announce aria-current="page".

function customerRail(pathname: string): SidebarNavGroup[] {
  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);

  const item = (label: string, href: string) => ({
    key: href,
    label,
    href,
    active: isActive(href),
    current: 'page' as const,
  });

  return [
    {
      id: 'portal',
      label: 'Portal',
      items: [
        item('Übersicht', '/app'),
        item('Dokumente', '/app/documents'),
        item('Meine Lösungen', '/app/solutions'),
      ],
    },
    {
      id: 'receptionist',
      label: 'KI-Telefonassistent',
      items: [item('Anrufe', '/app/solutions/rezeption/calls')],
    },
  ];
}

function flat(groups: SidebarNavGroup[]) {
  return groups.flatMap((group) => group.items);
}

function currents(groups: SidebarNavGroup[]) {
  return flat(groups)
    .filter((item) => item.active)
    .map((item) => `${item.label}:${item.current}`);
}

describe('resolveAriaCurrent', () => {
  it('leaves a single active leaf announcing "page"', () => {
    const resolved = resolveAriaCurrent(customerRail('/app/documents'));
    expect(currents(resolved)).toEqual(['Dokumente:page']);
  });

  it('treats the exact overview route as the only active item', () => {
    const resolved = resolveAriaCurrent(customerRail('/app'));
    expect(currents(resolved)).toEqual(['Übersicht:page']);
  });

  it('keeps the deepest match as the page and downgrades the containing entry to "true"', () => {
    const resolved = resolveAriaCurrent(customerRail('/app/solutions/rezeption/calls'));
    expect(currents(resolved)).toEqual(['Meine Lösungen:true', 'Anrufe:page']);
  });

  it('never yields more than one aria-current="page" across the whole rail', () => {
    for (const pathname of [
      '/app',
      '/app/documents',
      '/app/solutions',
      '/app/solutions/rezeption/calls',
    ]) {
      const resolved = resolveAriaCurrent(customerRail(pathname));
      const pages = flat(resolved).filter((item) => item.active && item.current === 'page');
      expect(pages.length, `pathname ${pathname}`).toBeLessThanOrEqual(1);
    }
  });

  it('still highlights every matching item, so the visual active state is unchanged', () => {
    const resolved = resolveAriaCurrent(customerRail('/app/solutions/rezeption/calls'));
    const active = flat(resolved).filter((item) => item.active).map((item) => item.label);
    expect(active).toEqual(['Meine Lösungen', 'Anrufe']);
  });

  it('returns the groups untouched when nothing is active', () => {
    const groups = customerRail('/somewhere-else');
    expect(resolveAriaCurrent(groups)).toBe(groups);
  });
});
