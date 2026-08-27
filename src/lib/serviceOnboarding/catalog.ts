import { Bot, Workflow, Globe, Sparkles, type LucideIcon } from 'lucide-react';

import type { BadgeTone } from '@/components/dashboard';
import type {
  EngagementStatus, EngagementTaskStatus, IntegrationMode, NavGroup,
  ReadinessCategory, ServiceKey, ServiceState,
} from '@/lib/serviceOnboarding/types';

// The service catalogue plus every German label and badge tone the service layer uses.
// One place, so the customer list, the customer page and the engagement workspace can never
// disagree about what a status is called or which colour it carries.

export interface ServiceDefinition {
  key: ServiceKey;
  name: string;
  /** One line, shown on the selection card. */
  description: string;
  icon: LucideIcon;
  /** False until that service ships its own onboarding template. */
  hasOnboarding: boolean;
}

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    key: 'ai_receptionist',
    name: 'AI Receptionist',
    description: 'KI-Telefonassistent mit Terminbuchung, Weiterleitung und Notfallregeln.',
    icon: Bot,
    hasOnboarding: true,
  },
  {
    key: 'automations',
    name: 'Automationen',
    description: 'Workflow-Automatisierung entlang bestehender Systeme des Kunden.',
    icon: Workflow,
    hasOnboarding: false,
  },
  {
    key: 'website',
    name: 'Website',
    description: 'Website-Projekt inklusive Inhalten, Technik und Veröffentlichung.',
    icon: Globe,
    hasOnboarding: false,
  },
  {
    key: 'custom_project',
    name: 'Individuelles Projekt',
    description: 'Individuell zugeschnittenes Projekt außerhalb der Standardleistungen.',
    icon: Sparkles,
    hasOnboarding: false,
  },
];

export const SERVICE_BY_KEY: Record<ServiceKey, ServiceDefinition> = Object.fromEntries(
  SERVICE_DEFINITIONS.map((s) => [s.key, s]),
) as Record<ServiceKey, ServiceDefinition>;

export const SERVICE_KEYS: ServiceKey[] = SERVICE_DEFINITIONS.map((s) => s.key);

export function isServiceKey(value: string): value is ServiceKey {
  return (SERVICE_KEYS as string[]).includes(value);
}

/* ------------------------------------------------------------------ Service state */

export const serviceStateLabel: Record<ServiceState, string> = {
  active: 'Aktiv', paused: 'Pausiert', archived: 'Archiviert',
};
export const serviceStateTone: Record<ServiceState, BadgeTone> = {
  active: 'success', paused: 'warning', archived: 'neutral',
};

/* ------------------------------------------------------------------ Lifecycle */

export const engagementStatusLabel: Record<EngagementStatus, string> = {
  lead: 'Interessent',
  contracted: 'Beauftragt',
  discovery: 'Aufnahme',
  building: 'Aufbau',
  integrating: 'Integration',
  testing: 'Test',
  client_approval: 'Kundenabnahme',
  ready_for_go_live: 'Startbereit',
  live: 'Live',
  monitoring: 'Monitoring',
};

export const engagementStatusTone: Record<EngagementStatus, BadgeTone> = {
  lead: 'neutral',
  contracted: 'info',
  discovery: 'info',
  building: 'info',
  integrating: 'info',
  testing: 'warning',
  client_approval: 'warning',
  ready_for_go_live: 'success',
  live: 'success',
  monitoring: 'success',
};

/** Presentation order; also the order the status picker offers. */
export const ENGAGEMENT_STATUS_ORDER: EngagementStatus[] = [
  'lead', 'contracted', 'discovery', 'building', 'integrating',
  'testing', 'client_approval', 'ready_for_go_live', 'live', 'monitoring',
];

/** Statuses the server refuses while go-live blockers remain unresolved. */
export const GATED_STATUSES: EngagementStatus[] = ['ready_for_go_live', 'live', 'monitoring'];

/* ------------------------------------------------------------------ Task status */

export const taskStatusLabel: Record<EngagementTaskStatus, string> = {
  not_started: 'Offen',
  in_progress: 'In Arbeit',
  waiting_for_client: 'Wartet auf Kunde',
  blocked: 'Blockiert',
  complete: 'Erledigt',
  not_applicable: 'Nicht zutreffend',
};

export const taskStatusTone: Record<EngagementTaskStatus, BadgeTone> = {
  not_started: 'neutral',
  in_progress: 'info',
  waiting_for_client: 'warning',
  blocked: 'danger',
  complete: 'success',
  not_applicable: 'neutral',
};

/** Short form for dense rows, where the badge sits next to the title. */
export const taskStatusShort: Record<EngagementTaskStatus, string> = {
  not_started: 'Offen',
  in_progress: 'In Arbeit',
  waiting_for_client: 'Kunde',
  blocked: 'Blockiert',
  complete: 'Erledigt',
  not_applicable: 'N/A',
};

export const TASK_STATUS_ORDER: EngagementTaskStatus[] = [
  'not_started', 'in_progress', 'waiting_for_client', 'blocked', 'complete', 'not_applicable',
];

/* ------------------------------------------------------------------ Readiness */

export const readinessCategoryLabel: Record<ReadinessCategory, string> = {
  commercial: 'Kommerziell',
  discovery: 'Aufnahme',
  legal: 'Recht & Datenschutz',
  integration: 'Integration',
  knowledge: 'Wissensdatenbank',
  agent: 'Agent',
  backend: 'Backend',
  telephony: 'Telefonie',
  testing: 'Tests',
  client_approval: 'Kundenabnahme',
};

export const READINESS_CATEGORY_ORDER: ReadinessCategory[] = [
  'commercial', 'discovery', 'legal', 'integration', 'knowledge',
  'agent', 'backend', 'telephony', 'testing', 'client_approval',
];

/* ------------------------------------------------------------------ Canonical phases */

/**
 * The canonical 16-phase AI Receptionist onboarding process.
 *
 * This is the PROCESS definition — the lifecycle the business actually runs. It is separate
 * from three other things it is easy to confuse it with:
 *
 *   - the template's SECTIONS, which are how the process is stored and edited. There are 20,
 *     because four phases are split into two sections each where one section would have mixed
 *     unrelated data (see `sections` below). A split is a subdivision, never a new phase.
 *   - the NAV GROUPS, which are how the process is *displayed* — nine tabs, so the workspace is
 *     not twenty tiny ones.
 *   - the READINESS CATEGORIES, which are how progress is *scored*.
 *
 * Keeping the four apart is the point: the process must stay recognisable even as the UI groups
 * it differently. `aiReceptionistTemplate.test.ts` asserts that every phase below is present in
 * the seeded template and that every seeded section belongs to exactly one phase, so neither the
 * template nor this list can drift away from the other.
 */
export interface CanonicalPhase {
  /** 1–16, in lifecycle order. */
  number: number;
  title: string;
  /** Template section codes that carry this phase. More than one means a deliberate split. */
  sections: string[];
  /** Why the phase is split, where it is. */
  splitRationale?: string;
}

export const CANONICAL_PHASES: CanonicalPhase[] = [
  { number: 1, title: 'Kundenprofil & Leistungsumfang', sections: ['profile', 'scope'],
    splitRationale: 'Who the client is (contacts, locations, languages) is stable reference data; what the agent is allowed to do is a 16-capability decision list. Editing them together would be one unreadable form.' },
  { number: 2, title: 'Bestandssysteme & Integrationsfähigkeit', sections: ['software', 'integration'],
    splitRationale: 'What the client runs today is discovery; whether it can be automated — and how honestly — is an assessment with its own go-live gate.' },
  { number: 3, title: 'Recht & Datenschutz', sections: ['legal'] },
  { number: 4, title: 'Datenschutz-Produktionsinfrastruktur', sections: ['privacy_infra'] },
  { number: 5, title: 'Workflow-Discovery', sections: ['workflow', 'identity'],
    splitRationale: 'Appointment types are a one-to-many record list; identification and escalation rules are prose decisions. Different shapes, different editors.' },
  { number: 6, title: 'Wissensdatenbank', sections: ['knowledge'] },
  { number: 7, title: 'Golden Agent / ElevenLabs', sections: ['agent'] },
  { number: 8, title: 'Backend / n8n', sections: ['backend'] },
  { number: 9, title: 'Telefonie', sections: ['telephony'] },
  { number: 10, title: 'Automatisierte Tests', sections: ['testing'] },
  { number: 11, title: 'Performance', sections: ['performance'] },
  { number: 12, title: 'Kundenabnahme (UAT)', sections: ['uat'] },
  { number: 13, title: 'Go-Live-Gate', sections: ['commercial', 'golive'],
    splitRationale: 'The gate has a commercial half (contract signed, scope approved) and a technical half (rollback plan, production credentials). Both block go-live; they are approved by different people at different times.' },
  { number: 14, title: 'Produktivsetzung', sections: ['deployment'] },
  { number: 15, title: 'Monitoring erste Woche', sections: ['monitoring'] },
  { number: 16, title: 'Laufende Wartung', sections: ['maintenance'] },
];

/** Reverse lookup: which canonical phase a template section belongs to. */
export const PHASE_BY_SECTION: Record<string, CanonicalPhase> = Object.fromEntries(
  CANONICAL_PHASES.flatMap((phase) => phase.sections.map((code) => [code, phase])),
);

/* ------------------------------------------------------------------ Navigation */

export const navGroupLabel: Record<NavGroup, string> = {
  overview: 'Überblick',
  discovery: 'Aufnahme',
  compliance: 'Compliance',
  integration: 'Integration',
  agent: 'Agent',
  telephony: 'Telefonie',
  testing: 'Tests',
  golive: 'Go-Live',
  monitoring: 'Monitoring',
};

export const NAV_GROUP_ORDER: NavGroup[] = [
  'overview', 'discovery', 'compliance', 'integration',
  'agent', 'telephony', 'testing', 'golive', 'monitoring',
];

/* ------------------------------------------------------------------ Integration mode */

export const integrationModeLabel: Record<IntegrationMode, string> = {
  full_automation: 'Vollautomatisierung',
  partial_automation: 'Teilautomatisierung',
};

export const integrationModeDescription: Record<IntegrationMode, string> = {
  full_automation: 'KI → Cogniiq → Bestandssystem des Kunden → Vorgang abgeschlossen.',
  partial_automation: 'Nur teilweise automatisiert. Die exakte Einschränkung muss dokumentiert sein.',
};
