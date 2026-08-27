// Variant comparison: how the offers sent to ONE customer compare on measured engagement.
//
// Siblings are found through owner_offers.organization_id — a real relation — never by
// matching recipient name strings, which would silently group unrelated customers who
// happen to share a company name.
//
// The card renders nothing at all when the evidence is too thin to be worth showing:
// fewer than two sibling offers, or no measured activity. And it names a strongest offer
// only when one is actually ahead — see compareEngagement, which returns no winner on a
// tie. The verdict is always "Stärkstes gemessenes Engagement", a statement about what
// was measured, never a prediction about what the customer will choose.

import { useMemo } from 'react';

import { Card, SectionHeader } from '@/components/dashboard';
import {
  compareEngagement, formatActiveClock, formatRelativeDe, formatScrollBp, scoreEngagement,
  type EngagementComparisonRow, type OfferEngagementOverviewRow,
} from '@/lib/ownerFinance/offerEngagement';

export interface ComparableOffer {
  id: string;
  label: string;
}

export function OfferEngagementComparison({ offers, overview, currentOfferId }: {
  /** Sibling offers of the same organization, including the one being viewed. */
  offers: ComparableOffer[];
  overview: OfferEngagementOverviewRow[];
  currentOfferId: string;
}) {
  const comparison = useMemo(() => {
    const byOffer = new Map(overview.map((r) => [r.offer_id, r]));
    const rows: EngagementComparisonRow[] = offers.map((o) => {
      const m = byOffer.get(o.id);
      const base = {
        total_sessions: m?.total_sessions ?? 0,
        total_active_seconds: m?.total_active_seconds ?? 0,
        max_scroll_bp: m?.max_scroll_bp ?? 0,
        pdf_download_count: m?.pdf_download_count ?? 0,
        acceptance_open_count: m?.acceptance_open_count ?? 0,
        last_activity_at: m?.last_activity_at ?? null,
      };
      return {
        offerId: o.id,
        label: o.label,
        totalActiveSeconds: base.total_active_seconds,
        totalSessions: base.total_sessions,
        maxScrollBp: base.max_scroll_bp,
        lastActivityAt: base.last_activity_at,
        score: scoreEngagement(base),
      };
    });
    return compareEngagement(rows);
  }, [offers, overview]);

  if (offers.length < 2) return null;
  if (!comparison.rows.some((r) => r.totalActiveSeconds > 0 || r.totalSessions > 0)) return null;

  const strongest = comparison.rows.find((r) => r.offerId === comparison.strongestOfferId);

  return (
    <Card className="p-6">
      <SectionHeader
        title="Angebotsvergleich"
        description="Gemessenes Engagement der Angebote dieses Kunden. Reiner Aufmerksamkeitsvergleich."
      />
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[520px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              <th className="px-2 pb-2 font-bold">Angebot</th>
              <th className="px-2 pb-2 text-right font-bold">Aktiv</th>
              <th className="px-2 pb-2 text-right font-bold">Besuche</th>
              <th className="px-2 pb-2 text-right font-bold">Scroll</th>
              <th className="px-2 pb-2 text-right font-bold">Letzte Aktivität</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => (
              <tr
                key={r.offerId}
                className={r.offerId === currentOfferId ? 'bg-gray-50/70' : undefined}
              >
                <td className="px-2 py-1.5 text-gray-800">
                  {r.label}
                  {r.offerId === currentOfferId ? <span className="ml-2 text-[11px] text-gray-400">aktuell</span> : null}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-900">{formatActiveClock(r.totalActiveSeconds)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">{r.totalSessions}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">{formatScrollBp(r.maxScrollBp)}</td>
                <td className="px-2 py-1.5 text-right text-gray-500">{formatRelativeDe(r.lastActivityAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {strongest ? (
        <p className="mt-3 text-[13px] text-gray-700">
          <span className="font-semibold">Stärkstes gemessenes Engagement:</span> {strongest.label}
        </p>
      ) : (
        // Deliberately silent: with no clear leader, saying nothing is more accurate
        // than naming one.
        <p className="mt-3 text-[12px] text-gray-400">
          Kein eindeutiger Unterschied im gemessenen Engagement.
        </p>
      )}
    </Card>
  );
}
