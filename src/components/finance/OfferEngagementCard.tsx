// "Kundeninteresse" — the owner's internal sales-intelligence panel for one offer.
//
// Built from the existing dashboard primitives (Card, SectionHeader, StatusBadge,
// KpiCard-style tiles) so it reads as part of the dashboard rather than a bolted-on
// analytics widget. The headline stays to four numbers plus a level; sessions, section
// attention and the activity log sit behind progressive disclosure so OfferDetailPage
// does not become a wall of statistics.
//
// Copy discipline (see offerEngagement.ts): "Aktive Betrachtungszeit", never "Lesezeit";
// "Stärkstes gemessenes Engagement", never a purchase prediction. The follow-up hint is
// DISPLAY ONLY — nothing in this component or anywhere downstream contacts the customer.

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Card, SectionHeader, StatusBadge } from '@/components/dashboard';
import {
  ENGAGEMENT_EVENT_LABEL_DE, ENGAGEMENT_LEVEL_HEADLINE_DE, ENGAGEMENT_LEVEL_LABEL_DE, ENGAGEMENT_LEVEL_TONE,
  formatActiveClock, formatActiveDuration, formatRelativeDe, formatScrollBp,
  offerSectionLabel, scoreEngagement, suggestsManualFollowUp,
  type OfferEngagementSummary,
} from '@/lib/ownerFinance/offerEngagement';

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</p>
      <p className="mt-1 text-[17px] font-semibold tabular-nums text-gray-950">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function OfferEngagementCard({ summary, offerStatus }: {
  summary: OfferEngagementSummary | null;
  offerStatus: string;
}) {
  const [open, setOpen] = useState(false);

  const score = useMemo(
    () => summary ? scoreEngagement(summary) : null,
    [summary],
  );

  if (!summary) return null;

  const measured = summary.total_sessions > 0;
  const followUp = score ? suggestsManualFollowUp(score, summary, offerStatus) : false;

  // Pre-feature opens. These give first/last CONTACT only. A duration is deliberately
  // NOT derived from them: (last event − first event) is wall-clock between two opens,
  // not attention, and presenting it as viewing time would be a fabrication.
  const historyOnly = !measured && summary.historical_view_count > 0;

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Kundeninteresse"
          description="Interne Auswertung. Gemessenes Engagement ist ein Aufmerksamkeitssignal — kein Nachweis einer Kaufabsicht."
        />
        {score && measured ? (
          <StatusBadge
            label={`Engagement: ${ENGAGEMENT_LEVEL_LABEL_DE[score.level]}`}
            tone={ENGAGEMENT_LEVEL_TONE[score.level]}
          />
        ) : null}
      </div>

      {historyOnly ? (
        <div className="space-y-2 text-[13px]">
          <p className="text-gray-600">
            {summary.historical_view_count}× geöffnet · zuletzt {formatRelativeDe(summary.historical_last_viewed_at)}
          </p>
          <p className="text-[12px] text-gray-400">
            Keine historische Betrachtungsdauer verfügbar — diese Öffnungen stammen aus der Zeit vor
            der Messung. Die Betrachtungszeit wird erst ab dem nächsten Aufruf erfasst.
          </p>
        </div>
      ) : !measured ? (
        <p className="text-[13px] text-gray-400">
          Noch keine Aufrufe gemessen. Sobald der Kunde das Angebot öffnet, erscheinen hier
          Besuche, aktive Betrachtungszeit und Scrolltiefe.
        </p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              label="Besuche"
              value={String(summary.total_sessions)}
              hint={summary.historical_view_count > 0 ? `${summary.historical_view_count} frühere Öffnungen` : undefined}
            />
            <Tile
              label="Aktive Betrachtungszeit"
              value={formatActiveDuration(summary.total_active_seconds)}
              hint={`Längste Sitzung: ${formatActiveDuration(summary.longest_active_seconds)}`}
            />
            <Tile label="Max. angesehen" value={formatScrollBp(summary.max_scroll_bp)} hint="maximale Scrolltiefe" />
            <Tile label="Letzte Aktivität" value={formatRelativeDe(summary.last_activity_at)} />
          </div>

          {/* The precision disclaimer sits next to the numbers, not in a footnote. */}
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            Aktive Betrachtungszeit = Zeit, in der das Angebot im aktiven Browserfenster sichtbar war.
            Konservativ gemessen und serverseitig begrenzt; Hintergrund-Tabs zählen nicht mit.
          </p>

          {score && score.reasons.length ? (
            <div className="mt-4 rounded-xl border border-gray-100 p-3">
              <p className="text-[13px] font-semibold text-gray-950">
                {ENGAGEMENT_LEVEL_HEADLINE_DE[score.level]}
                <span className="ml-2 text-[11px] font-normal text-gray-400">
                  {score.points} von {score.maxPoints} Punkten
                </span>
              </p>
              <ul className="mt-2 space-y-1 text-[13px] text-gray-600">
                {score.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {followUp ? (
            <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-[13px] text-sky-900">
              <span className="font-semibold">Persönliches Follow-up sinnvoll</span>
              <span className="text-sky-800"> — hohe aktuelle Aktivität. Es wird nichts automatisch versendet.</span>
            </div>
          ) : null}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-950"
          >
            <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden="true" />
            {open ? 'Details ausblenden' : 'Details anzeigen'}
          </button>

          {open ? (
            <div className="mt-4 space-y-5 border-t border-gray-100 pt-4">
              {summary.sections.length ? (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Betrachtungszeit nach Bereich</p>
                  <ul className="space-y-1">
                    {summary.sections.map((s) => (
                      <li key={s.section_id} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="text-gray-600">{offerSectionLabel(s.section_id)}</span>
                        <span className="tabular-nums text-gray-900">{formatActiveClock(s.active_seconds)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summary.sessions.length ? (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Sitzungen</p>
                  <ul className="space-y-1">
                    {summary.sessions.map((s, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="text-gray-500">{formatRelativeDe(s.started_at)}</span>
                        <span className="tabular-nums text-gray-900">
                          {formatActiveClock(s.active_seconds)} · {formatScrollBp(s.max_scroll_bp)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summary.events.length ? (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Aktivitätsverlauf</p>
                  {/* Business-level events only. Heartbeats are technical state and are
                      deliberately never rendered here. */}
                  <ul className="space-y-1">
                    {summary.events.map((e, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="text-gray-600">{ENGAGEMENT_EVENT_LABEL_DE[e.event_type] ?? e.event_type}</span>
                        <span className="text-gray-400">{formatRelativeDe(e.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summary.historical_view_count > 0 ? (
                <p className="text-[11px] leading-relaxed text-gray-400">
                  Zusätzlich {summary.historical_view_count} Öffnungen vor Beginn der Messung
                  (erste {formatRelativeDe(summary.historical_first_viewed_at)}). Für diese ist
                  keine historische Betrachtungsdauer verfügbar.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
