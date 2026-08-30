import type { BadgeTone } from '@/components/dashboard';
import type {
  ActivityChannel, ContactChannel, FollowUpStatus, InterfaceType,
  IntegrationCheckStatus, LeadIntegrationMode, LeadPriority, LeadStage,
  PartnerApprovalStatus,
} from '@/lib/ownerCrm/types';

// Every German label and badge tone the CRM uses, in one place — so the leads
// list, the pipeline, the lead page and the command center can never disagree
// about what a stage is called or which colour it carries.

/* ------------------------------------------------------------------ Stages */

export const leadStageLabel: Record<LeadStage, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  qualification: 'Qualifizierung',
  discovery: 'Termin / Analyse',
  interested: 'Interessiert',
  offer_preparation: 'Angebot in Vorbereitung',
  offer_sent: 'Angebot versendet',
  negotiation: 'Verhandlung',
  won: 'Gewonnen',
  lost: 'Verloren',
};

export const leadStageTone: Record<LeadStage, BadgeTone> = {
  new: 'neutral',
  contacted: 'info',
  qualification: 'info',
  discovery: 'info',
  interested: 'info',
  offer_preparation: 'warning',
  offer_sent: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
};

/** Pipeline order. `won` and `lost` are terminal and sit at the end. */
export const LEAD_STAGE_ORDER: LeadStage[] = [
  'new', 'contacted', 'qualification', 'discovery', 'interested',
  'offer_preparation', 'offer_sent', 'negotiation', 'won', 'lost',
];

/** The stages still worth working. Everything the command center counts as live. */
export const ACTIVE_LEAD_STAGES: LeadStage[] = LEAD_STAGE_ORDER.filter(
  (s) => s !== 'won' && s !== 'lost',
);

export function isLeadStage(value: string): value is LeadStage {
  return (LEAD_STAGE_ORDER as string[]).includes(value);
}

/* ---------------------------------------------------------------- Priority */

export const leadPriorityLabel: Record<LeadPriority, string> = {
  low: 'Niedrig', normal: 'Normal', high: 'Hoch', urgent: 'Dringend',
};

export const leadPriorityTone: Record<LeadPriority, BadgeTone> = {
  low: 'neutral', normal: 'neutral', high: 'warning', urgent: 'danger',
};

export const LEAD_PRIORITY_ORDER: LeadPriority[] = ['low', 'normal', 'high', 'urgent'];

/** Sort weight, so "Dringend" sorts above "Niedrig" rather than alphabetically. */
export const leadPriorityWeight: Record<LeadPriority, number> = {
  urgent: 3, high: 2, normal: 1, low: 0,
};

/* ----------------------------------------------------------------- Contact */

export const contactChannelLabel: Record<ContactChannel, string> = {
  phone: 'Telefon', email: 'E-Mail', meeting: 'Termin', other: 'Sonstiges',
};

export const activityChannelLabel: Record<ActivityChannel, string> = {
  call: 'Anruf', email: 'E-Mail', meeting: 'Termin', note: 'Notiz', other: 'Sonstiges',
};

export const ACTIVITY_CHANNEL_ORDER: ActivityChannel[] = ['call', 'email', 'meeting', 'note', 'other'];

export const followUpStatusLabel: Record<FollowUpStatus, string> = {
  open: 'Offen', done: 'Erledigt', cancelled: 'Abgebrochen',
};

/* ------------------------------------------------- Pre-offer integration gate */

export const integrationCheckStatusLabel: Record<IntegrationCheckStatus, string> = {
  not_started: 'Nicht begonnen',
  in_progress: 'In Prüfung',
  blocked: 'Blockiert',
  complete: 'Abgeschlossen',
};

export const integrationCheckStatusTone: Record<IntegrationCheckStatus, BadgeTone> = {
  not_started: 'neutral', in_progress: 'info', blocked: 'danger', complete: 'success',
};

export const INTEGRATION_CHECK_STATUS_ORDER: IntegrationCheckStatus[] = [
  'not_started', 'in_progress', 'blocked', 'complete',
];

export const interfaceTypeLabel: Record<InterfaceType, string> = {
  official_api: 'Offizielle API',
  fhir: 'FHIR',
  hl7: 'HL7',
  gdt: 'GDT',
  rest_api: 'REST-API',
  partner_interface: 'Offizielle Partnerschnittstelle',
  middleware: 'Middleware',
  none: 'Keine Schnittstelle verfügbar',
  unknown: 'Noch nicht geklärt',
};

// Deliberately mirrors the engagement template's INT-F001 options, plus the two
// honest non-answers the pre-offer stage still needs.
export const INTERFACE_TYPE_ORDER: InterfaceType[] = [
  'official_api', 'fhir', 'hl7', 'gdt', 'rest_api',
  'partner_interface', 'middleware', 'none', 'unknown',
];

export const partnerApprovalLabel: Record<PartnerApprovalStatus, string> = {
  granted: 'Erteilt', pending: 'Offen', refused: 'Abgelehnt', not_required: 'Nicht erforderlich',
};

export const PARTNER_APPROVAL_ORDER: PartnerApprovalStatus[] = [
  'granted', 'pending', 'refused', 'not_required',
];

export const leadIntegrationModeLabel: Record<LeadIntegrationMode, string> = {
  full_automation: 'Vollautomatisierung',
  partial_automation: 'Teilautomatisierung',
  not_possible: 'Nicht integrierbar',
  unknown: 'Noch nicht geklärt',
};

export const leadIntegrationModeDescription: Record<LeadIntegrationMode, string> = {
  full_automation: 'KI → Cogniiq → Bestandssystem des Kunden → Vorgang abgeschlossen.',
  partial_automation: 'Nur teilweise automatisiert. Die exakte Einschränkung muss dokumentiert sein.',
  not_possible: 'Keine Anbindung möglich. Der Leistungsumfang muss das offen benennen.',
  unknown: 'Die Prüfung steht noch aus. Kein Angebot auf dieser Grundlage.',
};

export const LEAD_INTEGRATION_MODE_ORDER: LeadIntegrationMode[] = [
  'full_automation', 'partial_automation', 'not_possible', 'unknown',
];

/**
 * The five booking operations, in the order they matter for a receptionist.
 * Each is tri-state on the record: unanswered is not the same as "no".
 */
export const INTEGRATION_OPERATIONS = [
  { key: 'supports_availability', label: 'Verfügbarkeiten abfragen' },
  { key: 'supports_booking', label: 'Termin buchen' },
  { key: 'supports_reschedule', label: 'Termin verschieben' },
  { key: 'supports_cancel', label: 'Termin stornieren' },
  { key: 'supports_patient_write', label: 'Patientendaten anlegen/ändern' },
] as const;

export type IntegrationOperationKey = (typeof INTEGRATION_OPERATIONS)[number]['key'];

/** "Ja" / "Nein" / "—". The dash is load-bearing: it means nobody has checked. */
export function triStateLabel(value: boolean | null | undefined): string {
  if (value === true) return 'Ja';
  if (value === false) return 'Nein';
  return '—';
}

/* ------------------------------------------------------------------ Offers */

/** German label for the canonical owner_offers.status values the CRM displays. */
export const offerStatusLabel: Record<string, string> = {
  draft: 'Entwurf',
  finalized: 'Verbindlich',
  sent: 'Versendet',
  viewed: 'Angesehen',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
  expired: 'Abgelaufen',
  cancelled: 'Storniert',
  converted: 'In Rechnung',
};

export const offerStatusTone: Record<string, BadgeTone> = {
  draft: 'neutral',
  finalized: 'info',
  sent: 'info',
  viewed: 'info',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
  cancelled: 'neutral',
  converted: 'success',
};
