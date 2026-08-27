// The engagement classification, its German formatting, and variant comparison.
//
// Two things are being protected here. One is arithmetic: the score is a fixed
// points table and must stay deterministic and explainable. The other is
// LANGUAGE: this feature reports measured attention, and the moment its copy
// starts implying intent it becomes a lie the owner might act on. The last
// describe block pins the vocabulary.
import { describe, expect, it } from 'vitest';

import {
  ENGAGEMENT_EVENT_LABEL_DE, ENGAGEMENT_LEVEL_HEADLINE_DE, ENGAGEMENT_LEVEL_LABEL_DE, ENGAGEMENT_MAX_POINTS,
  compareEngagement, formatActiveClock, formatActiveDuration, formatRelativeDe, formatScrollBp,
  scoreEngagement, suggestsManualFollowUp, type EngagementComparisonRow,
} from '@/lib/ownerFinance/offerEngagement';

const NOW = new Date('2026-08-27T12:00:00Z');
const base = {
  total_sessions: 0, total_active_seconds: 0, max_scroll_bp: 0,
  pdf_download_count: 0, acceptance_open_count: 0, last_activity_at: null as string | null,
};
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

describe('engagement classification', () => {
  it('reports no activity when nothing was measured', () => {
    const s = scoreEngagement(base, NOW);
    expect(s.level).toBe('none');
    expect(s.points).toBe(0);
    expect(s.reasons).toEqual([]);
  });

  it('is deterministic — the same input always scores the same', () => {
    const input = { ...base, total_sessions: 3, total_active_seconds: 527, max_scroll_bp: 10_000, last_activity_at: minutesAgo(30) };
    expect(scoreEngagement(input, NOW)).toEqual(scoreEngagement(input, NOW));
  });

  it('scores the worked example from the brief as high engagement', () => {
    // 3 Besuche · 8:47 aktiv · PDF heruntergeladen · heute erneut geöffnet
    const s = scoreEngagement({
      total_sessions: 3, total_active_seconds: 527, max_scroll_bp: 10_000,
      pdf_download_count: 1, acceptance_open_count: 0, last_activity_at: minutesAgo(42),
    }, NOW);
    // 3 (time≥5min) + 2 (3 visits) + 2 (100%) + 2 (pdf) + 2 (<24h) = 11
    expect(s.points).toBe(11);
    expect(s.level).toBe('very_high');
  });

  it('separates the levels in the documented order', () => {
    const at = (o: Partial<typeof base>) => scoreEngagement({ ...base, ...o }, NOW).level;
    expect(at({ total_sessions: 1, total_active_seconds: 40 })).toBe('low');
    expect(at({ total_sessions: 1, total_active_seconds: 200, max_scroll_bp: 8_000 })).toBe('medium');
    expect(at({ total_sessions: 2, total_active_seconds: 320, max_scroll_bp: 10_000 })).toBe('high');
    expect(at({
      total_sessions: 4, total_active_seconds: 900, max_scroll_bp: 10_000,
      pdf_download_count: 1, acceptance_open_count: 1, last_activity_at: minutesAgo(10),
    })).toBe('very_high');
  });

  it('never exceeds the declared maximum', () => {
    const s = scoreEngagement({
      total_sessions: 99, total_active_seconds: 99_999, max_scroll_bp: 10_000,
      pdf_download_count: 9, acceptance_open_count: 9, last_activity_at: minutesAgo(1),
    }, NOW);
    expect(s.points).toBeLessThanOrEqual(ENGAGEMENT_MAX_POINTS);
    expect(s.maxPoints).toBe(ENGAGEMENT_MAX_POINTS);
  });

  it('explains every level it awards', () => {
    const s = scoreEngagement({ ...base, total_sessions: 2, total_active_seconds: 400, pdf_download_count: 1 }, NOW);
    expect(s.level).not.toBe('none');
    expect(s.reasons.length).toBeGreaterThan(0);
  });

  it('treats an unreadable or missing timestamp as simply not recent', () => {
    expect(scoreEngagement({ ...base, total_sessions: 1, last_activity_at: 'nonsense' }, NOW).points).toBe(0);
  });
});

describe('manual follow-up hint', () => {
  const hot = {
    total_sessions: 4, total_active_seconds: 900, max_scroll_bp: 10_000,
    pdf_download_count: 1, acceptance_open_count: 1, last_activity_at: minutesAgo(30),
  };

  it('is offered for a hot, still-open offer', () => {
    expect(suggestsManualFollowUp(scoreEngagement(hot, NOW), hot, 'viewed', NOW)).toBe(true);
  });

  it('is withheld once the offer is decided or gone', () => {
    for (const status of ['accepted', 'rejected', 'converted', 'cancelled', 'expired', 'draft']) {
      expect(suggestsManualFollowUp(scoreEngagement(hot, NOW), hot, status, NOW)).toBe(false);
    }
  });

  it('is withheld for stale activity and for low engagement', () => {
    const stale = { ...hot, last_activity_at: minutesAgo(60 * 24 * 5) };
    expect(suggestsManualFollowUp(scoreEngagement(stale, NOW), stale, 'viewed', NOW)).toBe(false);
    const cold = { ...base, total_sessions: 1, total_active_seconds: 35, last_activity_at: minutesAgo(5) };
    expect(suggestsManualFollowUp(scoreEngagement(cold, NOW), cold, 'viewed', NOW)).toBe(false);
  });
});

describe('variant comparison', () => {
  const row = (id: string, active: number, sessions: number): EngagementComparisonRow => ({
    offerId: id, label: id, totalActiveSeconds: active, totalSessions: sessions,
    maxScrollBp: 10_000, lastActivityAt: minutesAgo(20),
    score: scoreEngagement({
      total_sessions: sessions, total_active_seconds: active, max_scroll_bp: 10_000,
      pdf_download_count: 0, acceptance_open_count: 0, last_activity_at: minutesAgo(20),
    }, NOW),
  });

  it('names the strongest measured offer', () => {
    const c = compareEngagement([row('admin', 74, 1), row('pro', 292, 3), row('complete', 571, 4)]);
    expect(c.strongestOfferId).toBe('complete');
    expect(c.rows[0].offerId).toBe('complete');
  });

  it('names nobody with a single offer, no activity, or a tie', () => {
    expect(compareEngagement([row('only', 500, 3)]).strongestOfferId).toBeNull();
    expect(compareEngagement([row('a', 0, 0), row('b', 0, 0)]).strongestOfferId).toBeNull();
    expect(compareEngagement([row('a', 300, 2), row('b', 300, 2)]).strongestOfferId).toBeNull();
  });

  it('does not mutate the input array', () => {
    const rows = [row('a', 10, 1), row('b', 900, 4)];
    const order = rows.map((r) => r.offerId);
    compareEngagement(rows);
    expect(rows.map((r) => r.offerId)).toEqual(order);
  });
});

describe('German formatting', () => {
  it.each([
    [0, '0 Sek.'], [47, '47 Sek.'], [60, '1 Min.'], [527, '8 Min. 47 Sek.'], [3_600, '1 Std.'], [4_500, '1 Std. 15 Min.'],
  ])('formatActiveDuration(%i) = %s', (s, out) => expect(formatActiveDuration(s)).toBe(out));

  it.each([[74, '1:14'], [292, '4:52'], [571, '9:31'], [5, '0:05']])(
    'formatActiveClock(%i) = %s', (s, out) => expect(formatActiveClock(s)).toBe(out));

  it('rounds scroll depth DOWN so it never overstates what was seen', () => {
    expect(formatScrollBp(9_999)).toBe('99 %');
    expect(formatScrollBp(10_000)).toBe('100 %');
    expect(formatScrollBp(3_180)).toBe('31 %');
    expect(formatScrollBp(-5)).toBe('0 %');
    expect(formatScrollBp(50_000)).toBe('100 %');
  });

  it('formats recency in German and degrades safely', () => {
    expect(formatRelativeDe(minutesAgo(42), NOW)).toBe('vor 42 Min.');
    expect(formatRelativeDe(minutesAgo(60 * 5), NOW)).toBe('vor 5 Std.');
    expect(formatRelativeDe(minutesAgo(60 * 24 * 1.5), NOW)).toBe('gestern');
    expect(formatRelativeDe(null, NOW)).toBe('—');
    expect(formatRelativeDe('not-a-date', NOW)).toBe('—');
  });
});

describe('copy never claims intent', () => {
  const allCopy = [
    ...Object.values(ENGAGEMENT_LEVEL_LABEL_DE),
    ...Object.values(ENGAGEMENT_EVENT_LABEL_DE),
    ...scoreEngagement({
      total_sessions: 4, total_active_seconds: 900, max_scroll_bp: 10_000,
      pdf_download_count: 2, acceptance_open_count: 1, last_activity_at: minutesAgo(5),
    }, NOW).reasons,
  ].join(' | ').toLowerCase();

  it.each([
    'kaufwahrscheinlichkeit', 'wird kaufen', 'wird wählen', 'purchase probability',
    'conversion probability', 'lesezeit', 'garantiert',
  ])('never says "%s"', (banned) => {
    expect(allCopy).not.toContain(banned);
  });

  // German adjectives inflect irregularly, so the headline must never be built by
  // gluing a suffix onto the short label. Doing so previously shipped "Mitteles
  // Engagement" (not a word) and "Sehr hoches Engagement" (stem should lose its <c>).
  it.each([
    ['none', 'Keine gemessene Aktivität'],
    ['low', 'Niedriges Engagement'],
    ['medium', 'Mittleres Engagement'],
    ['high', 'Hohes Engagement'],
    ['very_high', 'Sehr hohes Engagement'],
  ] as const)('headline for %s is correct German', (level, expected) => {
    expect(ENGAGEMENT_LEVEL_HEADLINE_DE[level]).toBe(expected);
  });

  it.each(['Mitteles', 'Hoches', 'Niedrigs', 'Sehr hoches'])(
    'never produces the malformed adjective "%s"', (bad) => {
      expect(Object.values(ENGAGEMENT_LEVEL_HEADLINE_DE).join(' | ')).not.toContain(bad);
    });

  it('does not derive the headline from the short label by concatenation', () => {
    // "Niedrig" + "es" happens to land on the correct "Niedriges", which is exactly
    // why the old bug survived review — three of the four levels were wrong and the
    // first one looked fine. These are the three that concatenation gets wrong.
    for (const level of ['medium', 'high', 'very_high'] as const) {
      expect(ENGAGEMENT_LEVEL_HEADLINE_DE[level]).not.toBe(`${ENGAGEMENT_LEVEL_LABEL_DE[level]}es Engagement`);
    }
  });

  it('describes opening the acceptance dialog as an open, never as an acceptance', () => {
    expect(ENGAGEMENT_EVENT_LABEL_DE.acceptance_opened).toBe('Annahmeprozess geöffnet');
    expect(ENGAGEMENT_EVENT_LABEL_DE.acceptance_opened).not.toContain('angenommen');
  });
});
