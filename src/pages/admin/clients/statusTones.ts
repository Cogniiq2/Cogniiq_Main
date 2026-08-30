// Status tone mapping for the client-platform CRM.
//
// DOMAIN knowledge, not styling: which lifecycle state reads as a warning and which reads as a
// failure is a product judgement, and it must be the same judgement wherever a status is shown.
// Keeping it in a plain module (rather than beside the components that happen to render it) is
// what lets the migrated list pages and the not-yet-migrated detail page share one answer.
//
// Typed against the dashboard's BadgeTone so a tone that does not exist cannot be named.
import type { BadgeTone } from '@/components/dashboard';

export const lifecycleTone: Record<string, BadgeTone> = {
  lead: 'neutral',
  qualified: 'info',
  active: 'success',
  paused: 'warning',
  churned: 'danger',
  archived: 'neutral',
};

export const solutionTone: Record<string, BadgeTone> = {
  active: 'success',
  provisioning: 'info',
  paused: 'warning',
  disabled: 'neutral',
};

export const invitationTone: Record<string, BadgeTone> = {
  pending: 'warning',
  accepted: 'success',
  revoked: 'danger',
  expired: 'neutral',
};
