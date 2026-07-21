// Pure, dependency-free invitation status/result rules shared by the admin UI.
// Kept import-free so it can be unit-tested directly (see .github/scripts/test-invitation-status.mjs)
// and so its logic matches the Edge Function's expiry handling.

export type StoredInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type EffectiveInvitationStatus = StoredInvitationStatus;

export interface InvitationLike {
  status: string;
  expires_at: string | null;
}

// A stored-pending invitation whose expiry has passed behaves as expired everywhere in the UI
// (badge, filter, actions) — matching the Edge Function, which treats it as expired too.
export function effectiveInvitationStatus(
  invitation: InvitationLike,
  now: number = Date.now(),
): EffectiveInvitationStatus {
  if (
    invitation.status === 'pending' &&
    invitation.expires_at != null &&
    new Date(invitation.expires_at).getTime() <= now
  ) {
    return 'expired';
  }
  if (
    invitation.status === 'pending' ||
    invitation.status === 'accepted' ||
    invitation.status === 'revoked' ||
    invitation.status === 'expired'
  ) {
    return invitation.status;
  }
  // Unknown stored values are treated conservatively as non-actionable.
  return 'revoked';
}

// Only a live pending invitation may be resent normally.
export function canResendInvitation(effective: EffectiveInvitationStatus): boolean {
  return effective === 'pending';
}

// Only an expired invitation may be explicitly renewed and re-sent.
export function canRenewInvitation(effective: EffectiveInvitationStatus): boolean {
  return effective === 'expired';
}

export type ResendOutcome = 'sent' | 'existing_user' | 'email_error' | 'unknown';

// The invite email step "succeeded" for 'sent' and 'existing_user' (existing users gain access on
// their next verified login); 'email_error' is a genuine failure that must not report success.
export function isResendEmailOk(outcome: ResendOutcome | string | undefined): boolean {
  return outcome === 'sent' || outcome === 'existing_user';
}

// Human-readable, accurate message for a resend/renew result.
export function resendOutcomeMessage(
  outcome: ResendOutcome | string | undefined,
  renewed: boolean,
): string {
  switch (outcome) {
    case 'sent':
      return renewed ? 'Einladung erneuert und E-Mail gesendet.' : 'Einladung erneut gesendet.';
    case 'existing_user':
      return 'Nutzer existiert bereits – Zugang wird beim nächsten verifizierten Login übernommen.';
    case 'email_error':
      return 'E-Mail-Versand fehlgeschlagen. Die Einladung bleibt bestehen; bitte erneut versuchen.';
    default:
      return 'Unerwartetes Ergebnis beim Senden der Einladung.';
  }
}
