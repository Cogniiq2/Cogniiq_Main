// Owner-side engagement model: types, the engagement classification, and the
// German formatting helpers the dashboard renders.
//
// LANGUAGE DISCIPLINE — this is measurement, not prediction.
//
// What we measure is how long an offer was actively on screen and what was
// looked at. That is a signal of attention. It is NOT evidence of intent, and
// nothing here may be phrased as though it were. So: "Stärkstes gemessenes
// Engagement", never "der Kunde wird X wählen"; "Aktive Betrachtungszeit",
// never "Lesezeit"; an engagement LEVEL, never a Kaufwahrscheinlichkeit.
//
// The classification below is a fixed points table, not a model. It is
// deterministic, has no learned parameters, and every point it awards is shown
// to the owner as a plain-language reason, so a level can always be explained.

import { offerSectionLabel } from '@/lib/offerEngagement/sections';

export interface OfferEngagementSection {
  section_id: string;
  active_seconds: number;
  session_count: number;
}

export interface OfferEngagementSession {
  started_at: string;
  last_activity_at: string;
  active_seconds: number;
  max_scroll_bp: number;
  pdf_download_count: number;
  acceptance_open_count: number;
}

export type OfferEngagementEventType =
  | 'session_start' | 'return_visit' | 'scroll_complete'
  | 'pdf_download' | 'acceptance_opened' | 'acceptance_completed' | 'rejection_opened';

export interface OfferEngagementEvent {
  event_type: OfferEngagementEventType;
  created_at: string;
}

export interface OfferEngagementSummary {
  offer_id: string;
  total_sessions: number;
  total_active_seconds: number;
  longest_active_seconds: number;
  max_scroll_bp: number;
  first_session_at: string | null;
  last_activity_at: string | null;
  pdf_download_count: number;
  acceptance_open_count: number;
  rejection_open_count: number;
  /** Opens recorded BEFORE this feature existed. Count and timestamps only. */
  historical_view_count: number;
  historical_first_viewed_at: string | null;
  historical_last_viewed_at: string | null;
  sections: OfferEngagementSection[];
  sessions: OfferEngagementSession[];
  events: OfferEngagementEvent[];
}

/** Compact per-offer row used by the offers list and by variant comparison. */
export interface OfferEngagementOverviewRow {
  offer_id: string;
  organization_id: string | null;
  total_sessions: number;
  total_active_seconds: number;
  longest_active_seconds: number;
  max_scroll_bp: number;
  first_session_at: string | null;
  last_activity_at: string | null;
  pdf_download_count: number;
  acceptance_open_count: number;
}

export type EngagementLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

export const ENGAGEMENT_LEVEL_LABEL_DE: Record<EngagementLevel, string> = {
  none: 'Keine Aktivität',
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  very_high: 'Sehr hoch',
};

export const ENGAGEMENT_LEVEL_TONE: Record<EngagementLevel, 'neutral' | 'info' | 'success'> = {
  none: 'neutral', low: 'neutral', medium: 'info', high: 'success', very_high: 'success',
};

export interface EngagementScore {
  level: EngagementLevel;
  /** 0..16. Exposed so the owner can see the classification is arithmetic, not magic. */
  points: number;
  maxPoints: number;
  /** Plain-German bullet points; exactly the signals that scored. */
  reasons: string[];
}

export const ENGAGEMENT_MAX_POINTS = 16;

/**
 * The weighting, in full.
 *
 *   Aktive Betrachtungszeit   ≥10min 4 · ≥5min 3 · ≥2min 2 · ≥30s 1
 *   Besuche                   ≥4     3 · ≥3    2 · ≥2    1
 *   Scrolltiefe               100%   2 · ≥75%  1
 *   PDF heruntergeladen                       2
 *   Annahmeprozess geöffnet                   3
 *   Aktualität                <24h   2 · <72h  1
 *
 *   ≥10 sehr hoch · ≥6 hoch · ≥3 mittel · ≥1 niedrig · 0 keine Aktivität
 *
 * Thresholds are round numbers chosen once, up front. They are intentionally
 * coarse: a scoring curve tuned to look right on the offers we happen to have
 * would be overfitted to a handful of visits and would not survive the next
 * customer.
 */
export function scoreEngagement(
  summary: Pick<OfferEngagementSummary,
    'total_sessions' | 'total_active_seconds' | 'max_scroll_bp' |
    'pdf_download_count' | 'acceptance_open_count' | 'last_activity_at'>,
  now: Date = new Date(),
): EngagementScore {
  const reasons: string[] = [];
  let points = 0;

  const active = summary.total_active_seconds;
  if (active >= 600) { points += 4; reasons.push(`${formatActiveDuration(active)} aktive Betrachtung`); }
  else if (active >= 300) { points += 3; reasons.push(`${formatActiveDuration(active)} aktive Betrachtung`); }
  else if (active >= 120) { points += 2; reasons.push(`${formatActiveDuration(active)} aktive Betrachtung`); }
  else if (active >= 30) { points += 1; reasons.push(`${formatActiveDuration(active)} aktive Betrachtung`); }

  const visits = summary.total_sessions;
  if (visits >= 4) { points += 3; reasons.push(`${visits} Besuche`); }
  else if (visits >= 3) { points += 2; reasons.push(`${visits} Besuche`); }
  else if (visits >= 2) { points += 1; reasons.push(`${visits} Besuche`); }

  if (summary.max_scroll_bp >= 9800) { points += 2; reasons.push('Angebot vollständig durchgesehen'); }
  else if (summary.max_scroll_bp >= 7500) { points += 1; reasons.push(`${formatScrollBp(summary.max_scroll_bp)} max. angesehen`); }

  if (summary.pdf_download_count > 0) {
    points += 2;
    reasons.push(summary.pdf_download_count > 1 ? `PDF ${summary.pdf_download_count}× heruntergeladen` : 'PDF heruntergeladen');
  }

  // Opening the acceptance dialog is a strong ATTENTION signal. It is never
  // reported as an acceptance, and the wording keeps that distinction.
  if (summary.acceptance_open_count > 0) { points += 3; reasons.push('Annahmeprozess geöffnet'); }

  const hours = hoursSince(summary.last_activity_at, now);
  if (hours != null && hours < 24) { points += 2; reasons.push('Aktivität in den letzten 24 Stunden'); }
  else if (hours != null && hours < 72) { points += 1; reasons.push('Aktivität in den letzten 3 Tagen'); }

  const level: EngagementLevel =
    visits === 0 ? 'none' :
    points >= 10 ? 'very_high' :
    points >= 6 ? 'high' :
    points >= 3 ? 'medium' : 'low';

  return { level, points, maxPoints: ENGAGEMENT_MAX_POINTS, reasons };
}

/**
 * Whether the dashboard should suggest that the OWNER reach out personally.
 *
 * DISPLAY ONLY. Nothing in this codebase acts on it: no email, no reminder, no
 * resend, no webhook, no task pushed anywhere. It is a hint on a screen the
 * owner is already looking at, and the owner decides what to do.
 */
export function suggestsManualFollowUp(
  score: EngagementScore,
  summary: Pick<OfferEngagementSummary, 'last_activity_at'>,
  offerStatus: string,
  now: Date = new Date(),
): boolean {
  if (!['finalized', 'sent', 'viewed'].includes(offerStatus)) return false;
  if (score.level !== 'high' && score.level !== 'very_high') return false;
  const hours = hoursSince(summary.last_activity_at, now);
  return hours != null && hours < 48;
}

/* ------------------------------------------------------------------ Formatting */

/**
 * "8 Min. 47 Sek." — the owner-facing duration.
 *
 * Never labelled as reading time or as an exact measurement: it is the time the
 * offer was in an active, visible browser window, which is an upper-bounded
 * approximation of attention and nothing more.
 */
export function formatActiveDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} Sek.`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest === 0 ? `${m} Min.` : `${m} Min. ${rest} Sek.`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h} Std.` : `${h} Std. ${mm} Min.`;
}

/** Compact "4:52" form for dense tables. */
export function formatActiveClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** Basis points → "82 %". Rounded down: never overstate how much was seen. */
export function formatScrollBp(bp: number): string {
  return `${Math.floor(Math.min(Math.max(bp, 0), 10_000) / 100)} %`;
}

/** "vor 42 Min." / "gestern" / a date once it stops being recent. */
export function formatRelativeDe(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const mins = Math.floor((now.getTime() - t) / 60_000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const ENGAGEMENT_EVENT_LABEL_DE: Record<OfferEngagementEventType, string> = {
  session_start: 'Angebot geöffnet',
  return_visit: 'Erneut geöffnet',
  scroll_complete: '100 % Scrolltiefe erreicht',
  pdf_download: 'PDF heruntergeladen',
  acceptance_opened: 'Annahmeprozess geöffnet',
  acceptance_completed: 'Annahme abgeschlossen',
  rejection_opened: 'Rückfrage-/Ablehnungsdialog geöffnet',
};

export { offerSectionLabel };

/* ------------------------------------------------------------------ Variant comparison */

export interface EngagementComparisonRow {
  offerId: string;
  label: string;
  totalActiveSeconds: number;
  totalSessions: number;
  maxScrollBp: number;
  lastActivityAt: string | null;
  score: EngagementScore;
}

export interface EngagementComparison {
  rows: EngagementComparisonRow[];
  /** The offer with the strongest MEASURED engagement, or null when it cannot be told apart. */
  strongestOfferId: string | null;
}

/**
 * Rank sibling offers by measured engagement.
 *
 * Returns no winner when the evidence does not support naming one: fewer than
 * two comparable offers, no measured activity at all, or a tie at the top. A
 * silent comparison is better than a confident wrong one.
 */
export function compareEngagement(rows: EngagementComparisonRow[]): EngagementComparison {
  const sorted = [...rows].sort((a, b) =>
    b.score.points - a.score.points ||
    b.totalActiveSeconds - a.totalActiveSeconds ||
    b.totalSessions - a.totalSessions);

  if (sorted.length < 2) return { rows: sorted, strongestOfferId: null };
  const [first, second] = sorted;
  if (first.totalActiveSeconds <= 0) return { rows: sorted, strongestOfferId: null };
  const tied = first.score.points === second.score.points
    && first.totalActiveSeconds === second.totalActiveSeconds
    && first.totalSessions === second.totalSessions;
  return { rows: sorted, strongestOfferId: tied ? null : first.offerId };
}

function hoursSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return (now.getTime() - t) / 3_600_000;
}
