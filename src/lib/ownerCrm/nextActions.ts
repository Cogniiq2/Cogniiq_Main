import {
  integrationCheckStatusLabel, leadStageLabel,
} from '@/lib/ownerCrm/catalog';
import type {
  CommandCenterData, LeadDetail, LeadIntegrationCheck, LeadListRow,
} from '@/lib/ownerCrm/types';

/**
 * The deterministic next-action engine for the sales side.
 *
 * Pure: same input, same output. The only impurity is the day boundary, and it
 * is passed IN rather than read from the clock, so a test can state what "today"
 * is and a rendered list can be reproduced exactly.
 *
 * There is no model here and no scoring. Every sentence this produces is a
 * restatement of a row that exists — "Follow-up seit 2 Tagen überfällig" means a
 * follow-up row is two days past its due date. A rule that cannot be traced to a
 * stored value does not belong in this file.
 *
 * The delivery side has its own engine (`serviceOnboarding/readiness.ts`) which
 * derives next actions from engagement tasks and fields. The command center
 * shows both; neither duplicates the other's logic.
 */

export type NextActionSeverity = 'overdue' | 'due' | 'attention' | 'info';

export type NextActionKind =
  | 'follow_up' | 'no_follow_up' | 'task' | 'integration_gate'
  | 'offer_waiting' | 'stage_stalled' | 'conversion';

export interface NextAction {
  kind: NextActionKind;
  severity: NextActionSeverity;
  /** German, ready to render. Never a template with an unfilled slot. */
  label: string;
  /** Second line: why this is being shown. Empty when the label says it all. */
  detail?: string;
  leadId?: string;
  taskId?: string;
  offerId?: string;
  /** Sort key. Lower sorts first; ties fall back to the label. */
  weight: number;
}

const SEVERITY_WEIGHT: Record<NextActionSeverity, number> = {
  overdue: 0, due: 100, attention: 200, info: 300,
};

/** Whole days between two calendar dates, ignoring the time of day. */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso.slice(0, 10));
  const b = Date.parse(toIso.slice(0, 10));
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/**
 * "2 Tage" / "1 Tag" — nominative, for "2 Tage überfällig".
 * Sign is ignored: the caller supplies the direction.
 */
export function dayCountLabel(days: number): string {
  const n = Math.abs(days);
  return n === 1 ? '1 Tag' : `${n} Tage`;
}

/**
 * "seit 2 Tagen" / "in 3 Tagen" — the dative form German prepositions require.
 * Using `dayCountLabel` after "seit" or "in" produces "seit 2 Tage", which reads
 * as broken German to every owner who opens the dashboard.
 */
export function dayCountLabelDative(days: number): string {
  const n = Math.abs(days);
  return n === 1 ? '1 Tag' : `${n} Tagen`;
}

function sortActions(actions: NextAction[]): NextAction[] {
  return [...actions].sort((a, b) => (a.weight - b.weight) || a.label.localeCompare(b.label, 'de'));
}

/* --------------------------------------------------------- Per-lead actions */

/**
 * Which pre-offer questions are still unanswered. Returns the exact list the
 * server's gate will refuse on, so the UI can say what is missing BEFORE the
 * owner tries to close the assessment and gets an error.
 *
 * These four conditions are mirrored from `owner_upsert_lead_integration_check`.
 * The server remains the authority; this is only the polite version.
 */
export function missingIntegrationAnswers(check: LeadIntegrationCheck | null): string[] {
  if (!check) return ['PVS bzw. Terminsoftware erfassen'];
  const missing: string[] = [];
  const has = (v: string | null) => (v ?? '').trim().length > 0;

  if (!has(check.pvs_name) && !has(check.appointment_system)) {
    missing.push('PVS bzw. Terminsoftware erfassen');
  }
  if (check.interface_type === null) {
    missing.push('Schnittstelle prüfen');
  }
  if (!check.third_party_costs_confirmed) {
    missing.push('Drittanbieter-Kosten prüfen und bestätigen');
  }
  if (check.integration_mode === null || check.integration_mode === 'unknown') {
    missing.push('Voll- oder Teilautomatisierung festlegen');
  } else if (check.integration_mode !== 'full_automation' && !has(check.fallback_description)) {
    missing.push('Genauen Fallback dokumentieren');
  }
  return missing;
}

/**
 * The two things that are not gate conditions but are still promises to the
 * client: that they were told about the third-party costs, and that it went
 * into the offer. Kept separate so a complete assessment is not blocked on them.
 */
export function openCustomerDisclosures(check: LeadIntegrationCheck | null): string[] {
  if (!check || check.status !== 'complete') return [];
  const open: string[] = [];
  if (check.customer_informed_at === null) open.push('Kunden über Integration und Kosten informieren');
  if (check.documented_in_offer_at === null) open.push('Integrationsumfang im Angebot dokumentieren');
  return open;
}

export interface LeadActionContext {
  /** Today, as YYYY-MM-DD, in the owner's timezone. */
  today: string;
  /** Days a lead may sit in one stage before it is called out. */
  stalledAfterDays?: number;
  /** Days an unanswered offer may sit before it is called out. */
  offerWaitingAfterDays?: number;
}

/**
 * Next actions for one lead, from its full detail record.
 *
 * A won-and-converted lead produces nothing: it is the customer's engagement
 * that carries the work from there, and repeating it here would be two systems
 * claiming the same task.
 */
export function computeLeadNextActions(detail: LeadDetail, ctx: LeadActionContext): NextAction[] {
  const { lead } = detail;
  const stalledAfter = ctx.stalledAfterDays ?? 14;
  const offerWaitingAfter = ctx.offerWaitingAfterDays ?? 7;
  const actions: NextAction[] = [];

  if (lead.archived_at) return [];

  // Won but not yet converted: the single most valuable thing on the board.
  if (lead.stage === 'won' && !lead.converted_customer_id) {
    actions.push({
      kind: 'conversion', severity: 'due', leadId: lead.id,
      label: 'In Kunde umwandeln',
      detail: 'Gewonnen, aber noch kein Kundendatensatz angelegt.',
      weight: SEVERITY_WEIGHT.due - 50,
    });
  }
  if (lead.converted_customer_id || lead.stage === 'lost') return sortActions(actions);

  // Follow-ups.
  const openFollowUp = detail.follow_ups.find((f) => f.status === 'open');
  if (openFollowUp) {
    const overdueDays = daysBetween(openFollowUp.due_at, ctx.today);
    if (overdueDays > 0) {
      actions.push({
        kind: 'follow_up', severity: 'overdue', leadId: lead.id,
        label: `Follow-up ${dayCountLabel(overdueDays)} überfällig`,
        detail: openFollowUp.reason ?? undefined,
        weight: SEVERITY_WEIGHT.overdue - overdueDays,
      });
    } else if (overdueDays === 0) {
      actions.push({
        kind: 'follow_up', severity: 'due', leadId: lead.id,
        label: 'Follow-up heute',
        detail: openFollowUp.reason ?? undefined,
        weight: SEVERITY_WEIGHT.due,
      });
    }
  } else {
    actions.push({
      kind: 'no_follow_up', severity: 'attention', leadId: lead.id,
      label: 'Kein Follow-up geplant',
      detail: `Letzte Aktivität vor ${dayCountLabelDative(daysBetween(lead.last_activity_at, ctx.today))}.`,
      weight: SEVERITY_WEIGHT.attention,
    });
  }

  // Overdue CRM tasks on this lead.
  for (const task of detail.tasks) {
    if (task.status === 'completed' || task.status === 'cancelled' || !task.due_date) continue;
    const overdueDays = daysBetween(task.due_date, ctx.today);
    if (overdueDays < 0) continue;
    actions.push({
      kind: 'task', severity: overdueDays > 0 ? 'overdue' : 'due',
      leadId: lead.id, taskId: task.id,
      label: overdueDays > 0
        ? `Aufgabe ${dayCountLabel(overdueDays)} überfällig: ${task.title}`
        : `Aufgabe heute fällig: ${task.title}`,
      weight: (overdueDays > 0 ? SEVERITY_WEIGHT.overdue : SEVERITY_WEIGHT.due) - overdueDays,
    });
  }

  // The pre-offer gate — but only once the AI Receptionist is actually on the
  // table AND the conversation has moved past first contact. Demanding a PVS
  // assessment from a brand-new lead is noise, not an action.
  const wantsReceptionist = detail.service_interests.includes('ai_receptionist');
  const pastFirstContact = lead.stage !== 'new' && lead.stage !== 'contacted';
  if (wantsReceptionist && pastFirstContact) {
    const missing = missingIntegrationAnswers(detail.integration_check);
    const nearOffer = lead.stage === 'offer_preparation' || lead.stage === 'offer_sent' || lead.stage === 'negotiation';
    for (const item of missing) {
      actions.push({
        kind: 'integration_gate', severity: nearOffer ? 'overdue' : 'attention', leadId: lead.id,
        label: item,
        detail: nearOffer
          ? 'Vor dem Angebot zu klären — sonst drohen nachträgliche Drittanbieter-Kosten.'
          : `Schnittstellen-Prüfung: ${integrationCheckStatusLabel[detail.integration_check?.status ?? 'not_started']}`,
        weight: (nearOffer ? SEVERITY_WEIGHT.overdue : SEVERITY_WEIGHT.attention) + 10,
      });
    }
    for (const item of openCustomerDisclosures(detail.integration_check)) {
      actions.push({
        kind: 'integration_gate', severity: 'attention', leadId: lead.id,
        label: item, weight: SEVERITY_WEIGHT.attention + 20,
      });
    }
  }

  // An offer that left draft and has not been answered.
  for (const offer of detail.offers) {
    if (offer.archived_at) continue;
    if (!['finalized', 'sent', 'viewed'].includes(offer.status)) continue;
    const waitingDays = daysBetween(offer.created_at, ctx.today);
    if (waitingDays < offerWaitingAfter) continue;
    actions.push({
      kind: 'offer_waiting', severity: 'attention', leadId: lead.id, offerId: offer.id,
      label: `Angebot wartet seit ${dayCountLabelDative(waitingDays)}`,
      detail: offer.offer_number ? `Angebot ${offer.offer_number}` : undefined,
      weight: SEVERITY_WEIGHT.attention + 30,
    });
  }

  // Nothing has happened in a fortnight and the lead is not terminal.
  const quietDays = daysBetween(lead.last_activity_at, ctx.today);
  if (quietDays >= stalledAfter) {
    actions.push({
      kind: 'stage_stalled', severity: 'info', leadId: lead.id,
      label: `Seit ${dayCountLabelDative(quietDays)} keine Aktivität`,
      detail: `Phase: ${leadStageLabel[lead.stage]}`,
      weight: SEVERITY_WEIGHT.info,
    });
  }

  return sortActions(actions);
}

/* ----------------------------------------------------- Command-center actions */

/**
 * The home screen's "Nächste Schritte", assembled from the command-center
 * projection rather than from every lead's detail — one query, not N.
 *
 * `limit` caps the list because a cockpit that shows ninety things shows
 * nothing. The counts beside each section stay complete.
 */
export function computeCommandNextActions(
  data: CommandCenterData, ctx: { today: string; limit?: number },
): NextAction[] {
  const actions: NextAction[] = [];

  for (const f of data.follow_ups) {
    const overdueDays = daysBetween(f.due_at, ctx.today);
    actions.push({
      kind: 'follow_up',
      severity: f.bucket === 'overdue' ? 'overdue' : 'due',
      leadId: f.lead_id,
      label: f.bucket === 'overdue'
        ? `Follow-up ${f.lead_name} — ${dayCountLabel(overdueDays)} überfällig`
        : `Follow-up ${f.lead_name} — heute`,
      detail: f.reason ?? undefined,
      weight: (f.bucket === 'overdue' ? SEVERITY_WEIGHT.overdue : SEVERITY_WEIGHT.due) - overdueDays,
    });
  }

  for (const t of data.overdue_tasks) {
    const overdueDays = daysBetween(t.due_date, ctx.today);
    actions.push({
      kind: 'task', severity: overdueDays > 0 ? 'overdue' : 'due',
      leadId: t.lead_id ?? undefined, taskId: t.task_id,
      label: `${t.title} — ${t.subject_name}`,
      detail: overdueDays > 0 ? `${dayCountLabel(overdueDays)} überfällig` : 'Heute fällig',
      weight: (overdueDays > 0 ? SEVERITY_WEIGHT.overdue : SEVERITY_WEIGHT.due) - overdueDays + 5,
    });
  }

  for (const b of data.blockers) {
    actions.push({
      kind: 'task', severity: 'overdue', taskId: b.task_id,
      label: `Blocker: ${b.title} — ${b.customer_name}`,
      detail: b.blocker_reason ?? undefined,
      weight: SEVERITY_WEIGHT.overdue + 20,
    });
  }

  for (const g of data.integration_gate_open) {
    actions.push({
      kind: 'integration_gate', severity: 'attention', leadId: g.lead_id,
      label: `Schnittstellen-Prüfung offen — ${g.lead_name}`,
      detail: `${leadStageLabel[g.stage]} · ${integrationCheckStatusLabel[g.integration_status]}`,
      weight: SEVERITY_WEIGHT.attention,
    });
  }

  for (const w of data.waiting_for_client) {
    actions.push({
      kind: 'task', severity: 'attention', taskId: w.task_id,
      label: `Wartet auf Kunde: ${w.title} — ${w.customer_name}`,
      detail: w.client_request ?? undefined,
      weight: SEVERITY_WEIGHT.attention + 40,
    });
  }

  const sorted = sortActions(actions);
  return ctx.limit ? sorted.slice(0, ctx.limit) : sorted;
}

/* --------------------------------------------------------------- List helpers */

export type FollowUpBucket = 'overdue' | 'today' | 'upcoming' | 'none';

/** Which follow-up queue a list row belongs in, relative to the owner's today. */
export function followUpBucket(row: Pick<LeadListRow, 'next_follow_up_at'>, today: string): FollowUpBucket {
  if (!row.next_follow_up_at) return 'none';
  const delta = daysBetween(row.next_follow_up_at, today);
  if (delta > 0) return 'overdue';
  if (delta === 0) return 'today';
  return 'upcoming';
}

/** Total pipeline value of the still-open stages. Won and lost are excluded. */
export function openPipelineValue(rows: LeadListRow[]): { setupCents: number; monthlyCents: number; count: number } {
  return rows.reduce(
    (acc, r) => {
      if (r.archived_at || r.stage === 'won' || r.stage === 'lost') return acc;
      return {
        setupCents: acc.setupCents + (r.estimated_setup_cents ?? 0),
        monthlyCents: acc.monthlyCents + (r.estimated_monthly_cents ?? 0),
        count: acc.count + 1,
      };
    },
    { setupCents: 0, monthlyCents: 0, count: 0 },
  );
}
