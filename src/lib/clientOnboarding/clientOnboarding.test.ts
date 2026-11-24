import { describe, expect, it } from 'vitest';

import { defaultSubject, escapeHtml, renderOnboardingEmail, safeHref } from '@/lib/clientOnboarding/emailTemplate';
import { describeOnboardingError } from '@/lib/clientOnboarding/errors';
import { ownerFacingError } from '@/lib/clientOnboarding/sendErrors';
import {
  defaultHours, formatAnswer, isLocked, messageStatusLabel, missingRequired, overallPercent, stageProgress,
  validateAnswer, validateHours,
} from '@/lib/clientOnboarding/intake';
import type { Question } from '@/lib/clientOnboarding/types';

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
