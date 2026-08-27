// Owner-side reads for offer engagement.
//
// Both RPCs are owner-gated in the database (`is_platform_owner()`), and the
// underlying tables grant SELECT to authenticated only under an owner RLS
// policy — anon has no table grant at all. Aggregation happens server-side; the
// dashboard never reassembles metrics from raw rows.
//
// Unlike the public page, owner-side load errors are surfaced normally: a
// silent empty dashboard would be worse than an error the owner can see.

import { supabase } from '@/lib/supabase';
import type { OfferEngagementSummary, OfferEngagementOverviewRow } from '@/lib/ownerFinance/offerEngagement';

export async function loadOfferEngagementSummary(offerId: string): Promise<OfferEngagementSummary | null> {
  const { data, error } = await supabase.rpc('owner_offer_engagement_summary', { p_offer_id: offerId });
  if (error) throw error;
  return (data as OfferEngagementSummary | null) ?? null;
}

export async function loadOfferEngagementOverview(entityId: string): Promise<OfferEngagementOverviewRow[]> {
  const { data, error } = await supabase.rpc('owner_offer_engagement_overview', { p_entity: entityId });
  if (error) throw error;
  return (data as OfferEngagementOverviewRow[] | null) ?? [];
}
