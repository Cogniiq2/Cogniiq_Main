// Supabase transport for offer engagement.
//
// Three narrow anon RPCs, all defined in
// supabase/migrations/20260827120000_owner_offer_engagement.sql. None of them
// changes offer state, enqueues automation, or sends mail.
//
// Deliberately NOT used here: public_offer_by_token. That RPC records a
// 'viewed' access event, advances the offer status and notifies the owner — a
// 15s heartbeat routed through it would produce a storm of spurious view events
// and owner notifications. Engagement resolves the token on its own,
// read-only, and leaves the existing "viewed" semantics untouched.
//
// Every call resolves rather than rejects: on the customer's page, analytics
// failure is a non-event.

import { supabase } from '@/lib/supabase';
import type { EngagementEventType, EngagementTransport, HeartbeatPayload } from '@/lib/offerEngagement/tracker';

export function createEngagementTransport(token: string): EngagementTransport {
  return {
    async start(sessionId: string): Promise<void> {
      await supabase.rpc('public_offer_engagement_start', {
        p_token: token,
        p_client_session_id: sessionId,
      });
    },
    async heartbeat(sessionId: string, payload: HeartbeatPayload): Promise<void> {
      await supabase.rpc('public_offer_engagement_heartbeat', {
        p_token: token,
        p_client_session_id: sessionId,
        p_active_delta_seconds: payload.activeDeltaSeconds,
        p_scroll_bp: payload.scrollBp,
        p_sections: payload.sections,
      });
    },
    async event(sessionId: string, type: EngagementEventType): Promise<void> {
      await supabase.rpc('public_offer_engagement_event', {
        p_token: token,
        p_client_session_id: sessionId,
        p_event_type: type,
      });
    },
  };
}
