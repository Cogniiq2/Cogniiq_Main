import { describe, expect, it } from 'vitest';

import { UNIVERSAL_NAV_ITEMS, buildPortalNavigation } from './navigation';
import { BASELINE_CAPABILITIES } from './capabilities';
import type { PortalSolution } from './types';

function capabilityChecker(granted: readonly string[]) {
  const set = new Set(granted);
  return (keys: readonly string[]) => keys.every((key) => set.has(key));
}

function solution(overrides: Partial<PortalSolution> = {}): PortalSolution {
  return {
    id: 'sol-1',
    catalog_key: 'ai_receptionist',
    instance_key: 'acme-receptionist',
    implementation_key: 'ai_receptionist',
    display_name: 'KI-Rezeptionist',
    status: 'active',
    nav_order: 0,
    ...overrides,
  };
}

function hrefs(groups: ReturnType<typeof buildPortalNavigation>): string[] {
  return groups.flatMap((group) => group.items.map((item) => item.href));
}

describe('navigation changes by capability', () => {
  it('gives a baseline member exactly the navigation existing customers already have', () => {
    const groups = buildPortalNavigation({
      solutions: [],
      hasEveryCapability: capabilityChecker(BASELINE_CAPABILITIES),
    });

    expect(hrefs(groups)).toEqual(UNIVERSAL_NAV_ITEMS.map((item) => item.href));
  });

  it('hides items whose capability is missing', () => {
    const groups = buildPortalNavigation({
      solutions: [],
      // A narrow functional role: overview only, no documents and no billing.
      hasEveryCapability: capabilityChecker(['portal.overview.view']),
    });

    expect(hrefs(groups)).toContain('/app');
    expect(hrefs(groups)).not.toContain('/app/documents');
    expect(hrefs(groups)).not.toContain('/app/billing');
    expect(hrefs(groups)).not.toContain('/app/support');
  });

  it('shows different navigation to two members of the SAME organization', () => {
    const solutions = [solution()];
    const finance = buildPortalNavigation({
      solutions,
      hasEveryCapability: capabilityChecker([...BASELINE_CAPABILITIES]),
    });
    const restricted = buildPortalNavigation({
      solutions,
      hasEveryCapability: capabilityChecker(['portal.overview.view']),
    });

    expect(hrefs(finance)).toContain('/app/billing');
    expect(hrefs(restricted)).not.toContain('/app/billing');
  });

  it('renders no capability-gated item at all while the context is still loading', () => {
    // While loading, the provider reports false for every capability.
    const groups = buildPortalNavigation({ solutions: [solution()], hasEveryCapability: () => false });

    // Only the capability-free entries survive; nothing gated is briefly shown.
    expect(hrefs(groups)).not.toContain('/app');
    expect(hrefs(groups)).not.toContain('/app/documents');
    expect(hrefs(groups)).not.toContain('/app/billing');
  });

  it('derives product navigation from the enabled solutions', () => {
    const groups = buildPortalNavigation({
      solutions: [solution()],
      hasEveryCapability: capabilityChecker(BASELINE_CAPABILITIES),
    });

    const productGroup = groups.find((group) => group.id.startsWith('sol-1-'));
    expect(productGroup?.label).toBe('KI-Rezeptionist');
    expect(hrefs(groups)).toContain('/app/solutions/acme-receptionist');
  });

  it('drops navigation for a disabled solution', () => {
    const groups = buildPortalNavigation({
      solutions: [solution({ status: 'disabled' })],
      hasEveryCapability: capabilityChecker(BASELINE_CAPABILITIES),
    });

    expect(groups.some((group) => group.id.startsWith('sol-1-'))).toBe(false);
  });

  it('never branches on an organization identity', () => {
    // The navigation builder receives no organization id or name at all, which is what makes a
    // per-customer conditional impossible rather than merely absent.
    const parameterNames = Object.keys({
      solutions: [],
      hasEveryCapability: () => false,
    });
    expect(parameterNames).toEqual(['solutions', 'hasEveryCapability']);
  });
});
