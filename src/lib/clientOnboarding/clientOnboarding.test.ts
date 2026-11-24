import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { defaultSubject, escapeHtml, renderOnboardingEmail, safeHref } from '@/lib/clientOnboarding/emailTemplate';
import { describeOnboardingError } from '@/lib/clientOnboarding/errors';
import { ownerFacingError } from '@/lib/clientOnboarding/sendErrors';
import { decideLink, linkTtlSeconds } from '@/lib/clientOnboarding/linkPolicy';
import {
  defaultHours, formatAnswer, invitationState, isLocked, latestLinkMessage, linkState, messageStatusLabel, missingRequired, overallPercent, stageProgress,
  validateAnswer, validateHours,
} from '@/lib/clientOnboarding/intake';
import type { OnboardingInvitation, OnboardingMessage, Question } from '@/lib/clientOnboarding/types';

const base = {
  kind: 'invitation' as const, language: 'de' as const, company: 'Praxis Muster',
  ctaUrl: 'https://cogniiq.de/auth/confirmed?flow=invite&token=abc', portalUrl: 'https://cogniiq.de/app',
  sender: { legalName: 'Cogniiq GmbH', email: 'hallo@example.test', phone: '+49 921 1' },
};

describe('onboarding email template', () => {
  it('escapes every caller-provided string in HTML', () => {
    const r = renderOnboardingEmail({ ...base, recipientName: '<script>alert(1)</script>', company: 'A&B "Praxis"',
      intro: 'Hallo <b>Welt</b>\n\nZweiter Absatz' });
    expect(r.html).not.toContain('<script>');
    expect(r.html).toContain('&lt;script&gt;');
    expect(r.html).toContain('A&amp;B &quot;Praxis&quot;');
    expect(r.html).toContain('Hallo &lt;b&gt;Welt&lt;/b&gt;');
  });

  it('never renders a non-http(s) link', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('https://x.test/a?b=1')).toBe('https://x.test/a?b=1');
    const r = renderOnboardingEmail({ ...base, ctaUrl: 'javascript:alert(1)' });
    expect(r.html).not.toContain('javascript:');
  });

  it('contains no tracking pixel and no image', () => {
    const r = renderOnboardingEmail(base);
    expect(r.html).not.toMatch(/<img/i);
  });

  it('has a plain-text alternative with the same CTA and the configured sender', () => {
    const r = renderOnboardingEmail(base);
    expect(r.text).toContain(base.ctaUrl);
    expect(r.text).toContain('Cogniiq GmbH');
    expect(r.text).toContain('Einrichtung starten');
  });

  it('renders English and the request question', () => {
    const r = renderOnboardingEmail({ ...base, kind: 'request', language: 'en', requestQuestion: 'Which <software>?' });
    expect(r.html).toContain('lang="en"');
    expect(r.html).toContain('Which &lt;software&gt;?');
    expect(r.text).toContain('Which <software>?');
  });

  it('marks test emails visibly', () => {
    expect(renderOnboardingEmail({ ...base, isTest: true }).text).toMatch(/^\[TEST-E-MAIL/);
  });

  it('invents no sender details', () => {
    const r = renderOnboardingEmail({ ...base, sender: {} });
    expect(r.text).not.toContain('undefined');
    expect(r.text).not.toContain('null');
  });

  it('builds default subjects per kind and language', () => {
    expect(defaultSubject('invitation', 'de', 'Praxis')).toBe('Ihr Projektstart mit Cogniiq – Praxis');
    expect(defaultSubject('reminder', 'en', '')).toBe('Continue your setup with Cogniiq');
    expect(escapeHtml(`'`)).toBe('&#39;');
  });
});

describe('error sanitising', () => {
  it('passes deliberate German validation messages and hides internals', () => {
    expect(describeOnboardingError({ code: 'P0001', message: 'Bitte geben Sie bei „Website" eine Adresse beginnend mit https:// an.' }).kind).toBe('validation');
    expect(describeOnboardingError({ code: '23505', message: 'duplicate key value violates unique constraint "x"' }).message)
      .not.toContain('constraint');
    expect(describeOnboardingError({ code: 'P0001', message: 'engagement not found' }).kind).toBe('unknown');
    expect(describeOnboardingError({ code: '40001', message: 'x' }).kind).toBe('conflict');
    expect(describeOnboardingError({ code: 'PGRST202', message: 'Could not find the function' }).kind).toBe('unavailable');
  });

  it('maps send reservation errors to fixed owner-facing text', () => {
    expect(ownerFacingError('Diese E-Mail-Adresse gehört nicht zu den Kontakten dieses Kunden.').status).toBe(400);
    expect(ownerFacingError('Zu viele Testnachrichten. Bitte versuchen Sie es später erneut.').status).toBe(429);
    expect(ownerFacingError('permission denied for table client_onboarding_messages').message).not.toContain('table');
    expect(ownerFacingError('Owner access required').status).toBe(403);
  });
});

const q = (over: Partial<Question>): Question => ({
  code: 'x', stage: 'business', label: 'X', kind: 'text', required: true, options: [], max_length: 200, ...over,
});

describe('intake logic', () => {
  it('validates kinds like the server', () => {
    expect(validateAnswer(q({ kind: 'phone' }), '+49 921 123456')).toBeNull();
    expect(validateAnswer(q({ kind: 'phone' }), 'abc')).not.toBeNull();
    expect(validateAnswer(q({ kind: 'url' }), 'https://praxis.test')).toBeNull();
    expect(validateAnswer(q({ kind: 'url' }), 'praxis.test')).not.toBeNull();
    expect(validateAnswer(q({ kind: 'number' }), '60')).toBeNull();
    expect(validateAnswer(q({ kind: 'number' }), '12345')).not.toBeNull();
    expect(validateAnswer(q({ kind: 'choice', options: [{ value: 'a', label: 'A' }] }), 'b')).not.toBeNull();
    expect(validateAnswer(q({ required: false }), '')).toBeNull();
    expect(validateAnswer(q({ required: true }), '  ')).toBe('Bitte ausfüllen.');
  });

  it('validates opening hours', () => {
    expect(validateHours(defaultHours())).toBeNull();
    expect(validateHours({ mon: { closed: false, ranges: [['12:00', '08:00']] } })).toMatch(/Beginn/);
    expect(validateHours({ mon: { closed: false, ranges: [['08:00', '12:00'], ['11:00', '14:00']] } })).toMatch(/überschneiden/);
    expect(validateHours({ mon: { closed: false, ranges: [['08:00', '09:00'], ['10:00', '11:00'], ['12:00', '13:00'], ['14:00', '15:00']] } })).toMatch(/drei/);
    expect(formatAnswer({ kind: 'hours', options: [] }, defaultHours())).toContain('Mo: 08:00–12:00, 14:00–18:00');
  });

  it('computes progress from required answers only', () => {
    const questions = [q({ code: 'a' }), q({ code: 'b', required: false }), q({ code: 'c', stage: 'operations' })];
    const progress = stageProgress(questions, { a: 'Name' });
    expect(progress.find((p) => p.stage === 'business')?.complete).toBe(true);
    expect(overallPercent(progress)).toBe(50);
    expect(missingRequired(questions, { a: 'Name' }).map((x) => x.code)).toEqual(['c']);
  });

  it('locks approved answers and submitted intakes', () => {
    expect(isLocked('in_progress', 'approved')).toBe(true);
    expect(isLocked('changes_requested', 'changes_requested')).toBe(false);
    expect(isLocked('submitted', 'draft')).toBe(true);
  });

  it('never claims delivery', () => {
    const now = Date.parse('2026-11-24T12:00:00Z');
    expect(messageStatusLabel('accepted', '2026-11-24T11:59:00Z', now).label).toBe('Vom E-Mail-Anbieter angenommen');
    expect(messageStatusLabel('sending', '2026-11-24T11:00:00Z', now).tone).toBe('warning');
    for (const s of ['accepted', 'failed', 'sending'] as const) {
      expect(messageStatusLabel(s, '2026-11-24T11:59:00Z', now).label).not.toMatch(/zugestellt|geöffnet|gelesen/i);
    }
  });
});

const msg = (over: Partial<OnboardingMessage>): OnboardingMessage => ({
  id: 'm', kind: 'invitation', is_test: false, recipient_email: 'a@x.test', subject: 'S', status: 'accepted',
  error_code: null, provider_message_id: 'p', created_at: '2026-11-24T10:00:00Z', completed_at: '2026-11-24T10:00:01Z',
  link_kind: 'activation', link_expires_at: '2026-11-24T11:00:00Z', ...over,
});

describe('invitation validity vs email-link validity', () => {
  const now = Date.parse('2026-11-24T12:00:00Z');
  const inv: OnboardingInvitation = {
    id: 'i', recipient_email: 'a@x.test', recipient_name: null, status: 'active', expires_at: '2026-12-24T10:00:00Z',
    created_at: '2026-11-24T10:00:00Z', revoked_at: null, portal_invitation_status: 'pending', access_active: false,
  };

  it('keeps the invitation open while the activation link has expired', () => {
    expect(invitationState(inv, now).label).toBe('Eingeladen – noch nicht angemeldet');
    const link = linkState(latestLinkMessage('a@x.test', [msg({})]), now);
    expect(link?.expired).toBe(true);
    expect(link?.label).toBe('Aktivierungslink abgelaufen');
  });

  it('reports a still-valid activation link with its recorded expiry', () => {
    const link = linkState(msg({ link_expires_at: '2026-11-24T13:00:00Z' }), now);
    expect(link?.expired).toBe(false);
    expect(link?.label).toMatch(/^Aktivierungslink gültig bis ca\./);
  });

  it('uses the newest real, accepted message and ignores tests and failures', () => {
    const latest = latestLinkMessage('a@x.test', [
      msg({ id: 'old', created_at: '2026-11-24T09:00:00Z' }),
      msg({ id: 'new', created_at: '2026-11-24T11:30:00Z', link_kind: 'login', link_expires_at: null }),
      msg({ id: 'test', is_test: true, created_at: '2026-11-24T11:50:00Z' }),
      msg({ id: 'fail', status: 'failed', created_at: '2026-11-24T11:55:00Z' }),
    ]);
    expect(latest?.id).toBe('new');
    expect(linkState(latest, now)?.label).toBe('Anmeldelink gesendet (Konto besteht bereits)');
  });

  it('treats a missing expiry on an activation link as expired, never as valid', () => {
    expect(linkState(msg({ link_expires_at: null }), now)?.expired).toBe(true);
  });

  it('marks test emails with the staff-account caveat', () => {
    const r = renderOnboardingEmail({ ...base, isTest: true });
    expect(r.text).toContain('Cogniiq-Konto');
  });
});


describe('entry-link policy (shared with the Edge Function)', () => {
  it('never mints an auth link for a test send', () => {
    expect(decideLink({ isTest: true, portalInvitationPending: true, recipientAccount: 'none' })).toBe('portal');
  });
  it('creates an account only when none exists and an invitation is pending', () => {
    expect(decideLink({ isTest: false, portalInvitationPending: true, recipientAccount: 'none' })).toBe('invite');
    expect(decideLink({ isTest: false, portalInvitationPending: false, recipientAccount: 'none' })).toBe('login');
  });
  it('re-activates an unused account with a magic link instead of a second account', () => {
    expect(decideLink({ isTest: false, portalInvitationPending: true, recipientAccount: 'pending_activation' })).toBe('magiclink');
  });
  it('sends signed-in users to the normal login', () => {
    expect(decideLink({ isTest: false, portalInvitationPending: true, recipientAccount: 'active' })).toBe('login');
  });
  it('bounds the configured link lifetime', () => {
    expect(linkTtlSeconds(undefined)).toBe(3600);
    expect(linkTtlSeconds('86400')).toBe(86400);
    expect(linkTtlSeconds('999999')).toBe(3600);
    expect(linkTtlSeconds('abc')).toBe(3600);
  });
});

describe('Edge Function bundle boundary', () => {
  it('imports only from supabase/functions or pinned URLs (no unproven cross-directory imports)', () => {
    const src = readFileSync('supabase/functions/client-onboarding-invite/index.ts', 'utf8');
    const specs = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(specs.length).toBeGreaterThan(0);
    for (const s of specs) expect(s.startsWith('https://') || s.startsWith('../_shared/')).toBe(true);
    for (const s of specs.filter((x) => x.startsWith('https://'))) expect(s).toMatch(/@\d+\.\d+\.\d+/);
  });
});
