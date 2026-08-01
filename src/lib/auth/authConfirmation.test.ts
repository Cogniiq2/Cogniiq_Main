import { describe, expect, it } from 'vitest';

import {
  CONFIRMATION_ERROR_COPY,
  INVITE_READY_COPY,
  MIN_PASSWORD_LENGTH,
  PASSWORD_MISMATCH_MESSAGE,
  PASSWORD_TOO_SHORT_MESSAGE,
  SIGNUP_SUCCESS_COPY,
  describePasswordUpdateFailure,
  hasLinkError,
  normalizeFlow,
  resolveConfirmationPhase,
  validatePasswordPair,
  type ConfirmationInput,
} from './authConfirmation';

function input(overrides: Partial<ConfirmationInput> = {}): ConfirmationInput {
  return {
    linkFailed: false,
    isLoading: false,
    authTimedOut: false,
    hasSession: false,
    isEmailConfirmed: false,
    waitElapsed: false,
    ...overrides,
  };
}

describe('normalizeFlow', () => {
  it('accepts the two supported flows, case-insensitively', () => {
    expect(normalizeFlow('signup')).toBe('signup');
    expect(normalizeFlow('invite')).toBe('invite');
    expect(normalizeFlow('INVITE')).toBe('invite');
    expect(normalizeFlow(' invite ')).toBe('invite');
  });

  it('falls back to signup for missing or unknown values', () => {
    expect(normalizeFlow(null)).toBe('signup');
    expect(normalizeFlow('')).toBe('signup');
    expect(normalizeFlow('recovery')).toBe('signup');
    expect(normalizeFlow('../../etc')).toBe('signup');
  });
});

describe('hasLinkError', () => {
  it('detects a Supabase failure in the query string', () => {
    expect(hasLinkError('?error=access_denied&error_code=otp_expired', '')).toBe(true);
  });

  it('detects a Supabase failure in the URL fragment', () => {
    expect(
      hasLinkError('', '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')
    ).toBe(true);
  });

  it('treats a clean confirmation URL as healthy', () => {
    expect(hasLinkError('?flow=signup', '#access_token=abc&type=signup')).toBe(false);
    expect(hasLinkError('', '')).toBe(false);
  });
});

describe('resolveConfirmationPhase', () => {
  it('reports an expired/invalid link even while the bootstrap is still running', () => {
    expect(resolveConfirmationPhase(input({ linkFailed: true, isLoading: true }))).toEqual({
      kind: 'error',
      reason: 'expired-link',
    });
  });

  it('reports a network failure when the bootstrap never answered', () => {
    expect(resolveConfirmationPhase(input({ authTimedOut: true, waitElapsed: true }))).toEqual({
      kind: 'error',
      reason: 'network',
    });
  });

  it('stays in the loading state while authentication is being resolved', () => {
    expect(resolveConfirmationPhase(input({ isLoading: true })).kind).toBe('resolving');
    // Session has not landed yet, but the bounded wait has not elapsed: still resolving.
    expect(resolveConfirmationPhase(input({ isLoading: false })).kind).toBe('resolving');
  });

  it('reports a missing session only once the bounded wait has elapsed', () => {
    expect(resolveConfirmationPhase(input({ waitElapsed: true }))).toEqual({
      kind: 'error',
      reason: 'missing-session',
    });
  });

  it('never reports success for a session whose email is not confirmed', () => {
    const phase = resolveConfirmationPhase(
      input({ hasSession: true, isEmailConfirmed: false, waitElapsed: true })
    );
    expect(phase.kind).not.toBe('ready');
    expect(phase).toEqual({ kind: 'error', reason: 'missing-session' });
  });

  it('reaches ready only with a confirmed authenticated session', () => {
    expect(resolveConfirmationPhase(input({ hasSession: true, isEmailConfirmed: true }))).toEqual({
      kind: 'ready',
    });
  });
});

describe('password validation', () => {
  it(`requires at least ${MIN_PASSWORD_LENGTH} characters`, () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(validatePasswordPair('short12', 'short12')).toBe(PASSWORD_TOO_SHORT_MESSAGE);
    expect(validatePasswordPair('', '')).toBe(PASSWORD_TOO_SHORT_MESSAGE);
  });

  it('requires both entries to match', () => {
    expect(validatePasswordPair('correct-horse', 'correct-horsE')).toBe(PASSWORD_MISMATCH_MESSAGE);
  });

  it('accepts a valid pair', () => {
    expect(validatePasswordPair('correct-horse', 'correct-horse')).toBeNull();
  });
});

describe('copy', () => {
  it('uses the exact German success wording for the signup flow', () => {
    expect(SIGNUP_SUCCESS_COPY.title).toBe('E-Mail erfolgreich bestätigt');
    expect(SIGNUP_SUCCESS_COPY.description).toBe('Ihr Cogniiq-Zugang wurde aktiviert.');
  });

  it('uses the exact German wording for an accepted invitation', () => {
    expect(INVITE_READY_COPY.title).toBe('Einladung erfolgreich angenommen');
    expect(INVITE_READY_COPY.description).toBe('Legen Sie jetzt Ihr persönliches Passwort fest.');
  });

  it('maps a password update failure to our own copy, discarding the provider message', () => {
    const copy = describePasswordUpdateFailure();
    expect(copy).toEqual(CONFIRMATION_ERROR_COPY['password-update']);
    // The mapper takes no argument at all, so a provider string cannot leak through it.
    expect(describePasswordUpdateFailure.length).toBe(0);
  });

  it('never exposes provider vocabulary in any user-facing error message', () => {
    const provider = /supabase|otp|jwt|token|gotrue|http\s?\d{3}|AuthApiError/i;
    for (const copy of Object.values(CONFIRMATION_ERROR_COPY)) {
      expect(copy.title).not.toMatch(provider);
      expect(copy.description).not.toMatch(provider);
    }
  });
});
