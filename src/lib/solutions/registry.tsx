// Controlled solution registry.
//
// The database may select a known implementation_key, but it must NEVER supply an arbitrary
// dynamic import path. This registry is the single, closed mapping from a controlled
// implementation key to a lazily-loaded frontend module. Unknown / unavailable keys resolve to a
// safe fallback. Adding a product (e.g. pankofer_operations) means adding one entry here, without
// touching the receptionist module.

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Cpu,
  Headphones,
  LayoutGrid,
  Phone,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

import type { ImplementationKey, OrganizationSolution } from '@/lib/clientPlatform/types';

export interface SolutionNavItem {
  key: string;
  label: string;
  // When absolute is true, `path` is used verbatim as the route (e.g. an existing /app route).
  // Otherwise `path` is a suffix appended after /app/solutions/:instanceKey.
  path: string;
  absolute?: boolean;
  icon: LucideIcon;
}

export function buildSolutionNavHref(instanceKey: string, item: SolutionNavItem): string {
  if (item.absolute) return item.path;
  return `/app/solutions/${instanceKey}${item.path}`;
}

export interface SolutionNavGroup {
  id: string;
  label: string;
  items: SolutionNavItem[];
}

export type SolutionLandingProps = {
  solution: OrganizationSolution;
};

export interface SolutionImplementation {
  implementationKey: ImplementationKey;
  label: string;
  icon: LucideIcon;
  // Whether this implementation is actually runnable in the frontend.
  available: boolean;
  navGroups: SolutionNavGroup[];
  Landing: LazyExoticComponent<ComponentType<SolutionLandingProps>>;
}

function lazyLanding(
  importer: () => Promise<{ default: ComponentType<SolutionLandingProps> }>,
): LazyExoticComponent<ComponentType<SolutionLandingProps>> {
  return lazy(importer);
}

const receptionistImplementation: SolutionImplementation = {
  implementationKey: 'ai_receptionist',
  label: 'KI-Rezeptionist',
  icon: Headphones,
  available: true,
  navGroups: [
    {
      id: 'receptionist',
      label: 'KI-Rezeptionist',
      items: [
        { key: 'overview', label: 'Übersicht', path: '', icon: LayoutGrid },
        { key: 'onboarding', label: 'Einrichtung', path: '/app/onboarding', absolute: true, icon: Wand2 },
        { key: 'receptionist', label: 'Rezeptionist', path: '/app/receptionist', absolute: true, icon: Headphones },
        { key: 'phone', label: 'Telefon', path: '/app/phone', absolute: true, icon: Phone },
      ],
    },
  ],
  Landing: lazyLanding(() => import('@/components/app/solutions/ReceptionistSolutionLanding')),
};

const automationImplementation: SolutionImplementation = {
  implementationKey: 'automation_workspace',
  label: 'Automatisierungs-Workspace',
  icon: Cpu,
  available: true,
  navGroups: [
    {
      id: 'automation',
      label: 'Automatisierung',
      items: [
        { key: 'overview', label: 'Übersicht', path: '', icon: LayoutGrid },
      ],
    },
  ],
  Landing: lazyLanding(() => import('@/components/app/solutions/AutomationSolutionLanding')),
};

const unavailableImplementation: SolutionImplementation = {
  implementationKey: 'unavailable',
  label: 'Lösung',
  icon: LayoutGrid,
  available: false,
  navGroups: [],
  Landing: lazyLanding(() => import('@/components/app/solutions/UnavailableSolutionLanding')),
};

// Closed registry. No entry here means "unavailable".
const registry: Record<ImplementationKey, SolutionImplementation> = {
  ai_receptionist: receptionistImplementation,
  automation_workspace: automationImplementation,
  // pankofer_operations is intentionally not yet implemented; it resolves to the safe fallback
  // until its module is added here, without modifying the receptionist implementation.
  pankofer_operations: unavailableImplementation,
  unavailable: unavailableImplementation,
};

export function resolveImplementation(key: string | null | undefined): SolutionImplementation {
  if (key && Object.prototype.hasOwnProperty.call(registry, key)) {
    return registry[key as ImplementationKey];
  }
  return unavailableImplementation;
}

export function isImplementationAvailable(key: string | null | undefined): boolean {
  return resolveImplementation(key).available;
}
