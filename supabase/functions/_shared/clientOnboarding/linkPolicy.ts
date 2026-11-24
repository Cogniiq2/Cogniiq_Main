// Which entry link an onboarding email may carry. Pure and shared: the Edge Function
// client-onboarding-invite imports it from _shared, the unit tests pin every branch.
//
//   test send                                   -> 'portal'   (portal login; no auth link minted)
//   no pending portal invitation / signed in    -> 'login'    (normal login, redirect to /app/setup)
//   pending invitation, no account yet          -> 'invite'   (creates the ONE auth user)
//   pending invitation, account never signed in -> 'magiclink'(same set-password page; no new
//                                                               account, no new membership)

export type RecipientAccount = 'none' | 'pending_activation' | 'active' | null | undefined;
export type LinkDecision = 'portal' | 'login' | 'invite' | 'magiclink';

export function decideLink(input: {
  isTest: boolean;
  portalInvitationPending: boolean;
  recipientAccount: RecipientAccount;
}): LinkDecision {
  if (input.isTest) return 'portal';
  if (!input.portalInvitationPending || input.recipientAccount === 'active') return 'login';
  return input.recipientAccount === 'none' ? 'invite' : 'magiclink';
}

/** Bounded email-link lifetime; the conservative default can only under-state validity. */
export function linkTtlSeconds(raw: string | undefined | null): number {
  const n = Number(raw ?? '3600');
  return Number.isFinite(n) && n >= 300 && n <= 86400 ? Math.floor(n) : 3600;
}
