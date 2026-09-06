import type { BadgeTone } from '@/components/dashboard';
import type { DeploymentStage, ProvisioningPhase } from '@/lib/goldenAgent';

export const STAGE_LABEL: Record<DeploymentStage, string> = {
  dev: 'DEV', evaluation: 'EVALUATION', staging: 'STAGING', live: 'LIVE', paused: 'PAUSIERT',
};

export const STAGE_TONE: Record<DeploymentStage, BadgeTone> = {
  dev: 'neutral', evaluation: 'info', staging: 'warning', live: 'success', paused: 'danger',
};

export const STAGE_OPTIONS: Array<{ value: DeploymentStage; label: string; description: string }> = [
  { value: 'dev', label: 'DEV', description: 'Test-Agent, Mock-Buchung, keine echten Daten' },
  { value: 'evaluation', label: 'EVALUATION', description: 'Evaluationsläufe gegen den DEV-Agenten' },
  { value: 'staging', label: 'STAGING', description: 'Staging-Agent mit Staging-Integrationen' },
  { value: 'live', label: 'LIVE', description: 'Produktiver Kunden-Agent (nur nach Freigabe)' },
  { value: 'paused', label: 'PAUSIERT', description: 'Tools antworten mit "pausiert"' },
];

export function formatDateTimeDe(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(date);
}

export const PROVISIONING_TONE: Record<ProvisioningPhase, BadgeTone> = {
  config_invalid: 'danger',
  not_provisioned: 'neutral',
  partially_provisioned: 'warning',
  provisioning_failed: 'danger',
  provisioned: 'success',
  provider_drift: 'warning',
};

export const OUTCOME_LABEL: Record<string, string> = {
  booked: 'Gebucht', rescheduled: 'Verschoben', cancelled: 'Storniert', answered: 'Beantwortet', escalated: 'Eskaliert',
  callback: 'Rückruf', declined: 'Abgelehnt', emergency_routed: 'Notfall', no_action: 'Keine Aktion', unknown: 'Unbekannt',
};
