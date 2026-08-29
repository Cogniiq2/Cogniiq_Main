// ─────────────────────────────────────────────────────────────────────────────
// The deterministic sales next-action engine.
//
// These tests exist to pin down two things the UI must never be allowed to
// invent: WHICH conditions produce an action, and that the conditions the
// browser reports as missing are exactly the ones the database gate refuses on
// (`owner_upsert_lead_integration_check`, migration 20260902120000). If those
// two drift apart, the owner is told the assessment is complete and the server
// then rejects it — or worse, the other way round.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import {
  computeCommandNextActions, computeLeadNextActions, dayCountLabel, dayCountLabelDative,
  daysBetween, followUpBucket, missingIntegrationAnswers, openCustomerDisclosures,
  openPipelineValue,
} from '@/lib/ownerCrm/nextActions';
import type {
  CommandCenterData, LeadDetail, LeadIntegrationCheck, LeadListRow,
} from '@/lib/ownerCrm/types';

const TODAY = '2026-09-02';

function lead(overrides: Partial<LeadDetail['lead']> = {}): LeadDetail['lead'] {
  return {
    id: 'lead-1', business_entity_id: 'entity-1',
    company: 'Praxis Dr. Beispiel', contact_name: null, contact_role: null,
    email: null, phone: null, website: null, city: null, postal_code: null, street: null,
    country_code: null, display_name: 'Praxis Dr. Beispiel',
    stage: 'qualification', priority: 'normal', source: null, source_note: null,
    estimated_setup_cents: null, estimated_monthly_cents: null, probability_percent: null,
    industry: null, company_type: null, company_size: null, existing_systems: null,
    pain_points: null, requirements: null, notes: null, preferred_channel: null,
    next_follow_up_at: null, follow_up_note: null, last_contact_at: null,
    last_activity_at: `${TODAY}T09:00:00Z`,
    won_at: null, lost_at: null, lost_reason: null,
    converted_customer_id: null, converted_at: null, archived_at: null,
    created_at: `${TODAY}T09:00:00Z`, updated_at: `${TODAY}T09:00:00Z`, created_by: null,
    service_interests: [], open_task_count: 0, offer_count: 0, integration_status: 'not_started',
    ...overrides,
  };
}

function detail(overrides: Partial<LeadDetail> = {}): LeadDetail {
  return {
    lead: lead(), service_interests: [], follow_ups: [], tasks: [], activity: [],
    integration_check: null, offers: [], customer: null,
    ...overrides,
  };
}

function check(overrides: Partial<LeadIntegrationCheck> = {}): LeadIntegrationCheck {
  return {
    lead_id: 'lead-1',
    pvs_name: null, pvs_vendor: null, pvs_version: null, appointment_system: null,
    interface_type: null, api_documentation_obtained: null, api_access_included: null,
    partner_approval_required: null, partner_approval_status: null, sandbox_available: null,
    supports_availability: null, supports_booking: null, supports_reschedule: null,
    supports_cancel: null, supports_patient_write: null,
    rate_limits: null, vendor_restrictions: null,
    third_party_setup_cents: null, third_party_monthly_cents: null,
    third_party_cost_note: null, third_party_costs_confirmed: false,
    integration_mode: null, fallback_description: null,
    customer_informed_at: null, documented_in_offer_at: null,
    status: 'in_progress', notes: null,
    created_at: `${TODAY}T09:00:00Z`, updated_at: `${TODAY}T09:00:00Z`,
    ...overrides,
  };
}

/* --------------------------------------------------------------- Primitives */

describe('date helpers', () => {
  it('counts whole days regardless of the time of day', () => {
    // 23:00 two days ago is still two days ago, not one-and-a-bit.
    expect(daysBetween('2026-08-31T23:00:00Z', TODAY)).toBe(2);
    expect(daysBetween('2026-09-02T00:01:00Z', TODAY)).toBe(0);
    expect(daysBetween('2026-09-05T00:00:00Z', TODAY)).toBe(-3);
  });

  it('speaks German singular and plural', () => {
    expect(dayCountLabel(1)).toBe('1 Tag');
    expect(dayCountLabel(2)).toBe('2 Tage');
    // A negative count is a duration too — the caller supplies the direction.
    expect(dayCountLabel(-3)).toBe('3 Tage');
  });

  it('offers the dative form German prepositions require', () => {
    // "seit 2 Tage" and "in 3 Tage" are broken German. Anything following
    // "seit" or "in" has to use this form.
    expect(dayCountLabelDative(1)).toBe('1 Tag');
    expect(dayCountLabelDative(2)).toBe('2 Tagen');
    expect(dayCountLabelDative(-3)).toBe('3 Tagen');
  });

  it('buckets follow-ups against the owner’s day', () => {
    expect(followUpBucket({ next_follow_up_at: null }, TODAY)).toBe('none');
    expect(followUpBucket({ next_follow_up_at: '2026-08-30T10:00:00Z' }, TODAY)).toBe('overdue');
    expect(followUpBucket({ next_follow_up_at: '2026-09-02T18:00:00Z' }, TODAY)).toBe('today');
    expect(followUpBucket({ next_follow_up_at: '2026-09-09T10:00:00Z' }, TODAY)).toBe('upcoming');
  });
});

/* ------------------------------------------------- The pre-offer gate mirror */

describe('missingIntegrationAnswers', () => {
  it('asks for the system first when nothing has been recorded', () => {
    expect(missingIntegrationAnswers(null)).toEqual(['PVS bzw. Terminsoftware erfassen']);
  });

  it('names every unanswered gate condition at once', () => {
    expect(missingIntegrationAnswers(check())).toEqual([
      'PVS bzw. Terminsoftware erfassen',
      'Schnittstelle prüfen',
      'Drittanbieter-Kosten prüfen und bestätigen',
      'Voll- oder Teilautomatisierung festlegen',
    ]);
  });

  it('accepts an appointment system in place of a PVS', () => {
    const result = missingIntegrationAnswers(check({ appointment_system: 'Doctolib' }));
    expect(result).not.toContain('PVS bzw. Terminsoftware erfassen');
  });

  it('treats "keine Schnittstelle" as an answer, not a gap', () => {
    // "none" is a real, honest finding. Only null means nobody has looked.
    const result = missingIntegrationAnswers(check({ pvs_name: 'tomedo', interface_type: 'none' }));
    expect(result).not.toContain('Schnittstelle prüfen');
  });

  it('still demands the cost confirmation when no costs were entered', () => {
    // Zero third-party cost is a finding that must be confirmed, not assumed.
    const result = missingIntegrationAnswers(check({
      pvs_name: 'tomedo', interface_type: 'official_api',
      third_party_setup_cents: null, third_party_monthly_cents: null,
    }));
    expect(result).toContain('Drittanbieter-Kosten prüfen und bestätigen');
  });

  it('demands a fallback for anything short of full automation', () => {
    const base = {
      pvs_name: 'tomedo', interface_type: 'official_api' as const,
      third_party_costs_confirmed: true,
    };
    expect(missingIntegrationAnswers(check({ ...base, integration_mode: 'partial_automation' })))
      .toEqual(['Genauen Fallback dokumentieren']);
    expect(missingIntegrationAnswers(check({ ...base, integration_mode: 'not_possible' })))
      .toEqual(['Genauen Fallback dokumentieren']);
    // Full automation needs none, and the gate is then satisfied.
    expect(missingIntegrationAnswers(check({ ...base, integration_mode: 'full_automation' }))).toEqual([]);
    expect(missingIntegrationAnswers(check({
      ...base, integration_mode: 'partial_automation', fallback_description: 'Rückruf im PVS.',
    }))).toEqual([]);
  });

  it('treats "unknown" as unanswered rather than as a mode', () => {
    const result = missingIntegrationAnswers(check({
      pvs_name: 'tomedo', interface_type: 'official_api',
      third_party_costs_confirmed: true, integration_mode: 'unknown',
    }));
    expect(result).toEqual(['Voll- oder Teilautomatisierung festlegen']);
  });
});

describe('openCustomerDisclosures', () => {
  const complete = {
    pvs_name: 'tomedo', interface_type: 'official_api' as const,
    third_party_costs_confirmed: true, integration_mode: 'full_automation' as const,
    status: 'complete' as const,
  };

  it('stays silent until the assessment is actually complete', () => {
    expect(openCustomerDisclosures(check({ ...complete, status: 'in_progress' }))).toEqual([]);
    expect(openCustomerDisclosures(null)).toEqual([]);
  });

  it('names the two promises to the client that are still open', () => {
    expect(openCustomerDisclosures(check(complete))).toEqual([
      'Kunden über Integration und Kosten informieren',
      'Integrationsumfang im Angebot dokumentieren',
    ]);
  });

  it('clears each one independently', () => {
    expect(openCustomerDisclosures(check({ ...complete, customer_informed_at: `${TODAY}T10:00:00Z` })))
      .toEqual(['Integrationsumfang im Angebot dokumentieren']);
  });
});

/* --------------------------------------------------------- Per-lead actions */

describe('computeLeadNextActions', () => {
  it('says exactly how overdue a follow-up is', () => {
    const actions = computeLeadNextActions(detail({
      follow_ups: [{
        id: 'f1', lead_id: 'lead-1', due_at: '2026-08-31T10:00:00Z', reason: 'Rückruf',
        status: 'open', completed_at: null, completed_by: null, completion_note: null,
        created_at: '', updated_at: '',
      }],
    }), { today: TODAY });

    expect(actions[0]).toMatchObject({
      kind: 'follow_up', severity: 'overdue', label: 'Follow-up 2 Tage überfällig', detail: 'Rückruf',
    });
  });

  it('distinguishes "today" from "overdue"', () => {
    const actions = computeLeadNextActions(detail({
      follow_ups: [{
        id: 'f1', lead_id: 'lead-1', due_at: `${TODAY}T16:00:00Z`, reason: null,
        status: 'open', completed_at: null, completed_by: null, completion_note: null,
        created_at: '', updated_at: '',
      }],
    }), { today: TODAY });

    expect(actions.find((a) => a.kind === 'follow_up')).toMatchObject({
      severity: 'due', label: 'Follow-up heute',
    });
  });

  it('flags an active lead nobody has scheduled anything for', () => {
    const actions = computeLeadNextActions(detail(), { today: TODAY });
    expect(actions.some((a) => a.kind === 'no_follow_up')).toBe(true);
  });

  it('surfaces a won lead that has not been converted, and ranks it first', () => {
    const actions = computeLeadNextActions(
      detail({ lead: lead({ stage: 'won', won_at: `${TODAY}T09:00:00Z` }) }), { today: TODAY },
    );
    expect(actions[0]).toMatchObject({ kind: 'conversion', label: 'In Kunde umwandeln' });
  });

  it('goes quiet once the lead is a customer — the engagement owns the work from there', () => {
    expect(computeLeadNextActions(
      detail({ lead: lead({ stage: 'won', converted_customer_id: 'cust-1' }) }), { today: TODAY },
    )).toEqual([]);
  });

  it('goes quiet for lost and archived leads', () => {
    expect(computeLeadNextActions(
      detail({ lead: lead({ stage: 'lost', lost_reason: 'Budget' }) }), { today: TODAY },
    )).toEqual([]);
    expect(computeLeadNextActions(
      detail({ lead: lead({ archived_at: `${TODAY}T09:00:00Z` }) }), { today: TODAY },
    )).toEqual([]);
  });

  it('does not nag a brand-new lead about its PVS', () => {
    // Demanding an interface assessment at first contact is noise, not an action.
    const actions = computeLeadNextActions(detail({
      lead: lead({ stage: 'contacted' }), service_interests: ['ai_receptionist'],
    }), { today: TODAY });
    expect(actions.some((a) => a.kind === 'integration_gate')).toBe(false);
  });

  it('raises the integration gate to overdue once an offer is in play', () => {
    const actions = computeLeadNextActions(detail({
      lead: lead({ stage: 'offer_preparation' }), service_interests: ['ai_receptionist'],
    }), { today: TODAY });

    const gate = actions.filter((a) => a.kind === 'integration_gate');
    expect(gate.length).toBeGreaterThan(0);
    expect(gate.every((a) => a.severity === 'overdue')).toBe(true);
    expect(gate[0].detail).toContain('Drittanbieter-Kosten');
  });

  it('never raises the integration gate for a lead that does not want the receptionist', () => {
    const actions = computeLeadNextActions(detail({
      lead: lead({ stage: 'offer_preparation' }), service_interests: ['website'],
    }), { today: TODAY });
    expect(actions.some((a) => a.kind === 'integration_gate')).toBe(false);
  });

  it('reports an unanswered offer only after the waiting threshold', () => {
    const offer = {
      id: 'o1', offer_number: 'A-2026-001', title: null, status: 'sent',
      gross_total_cents: 480000, valid_until: null, archived_at: null,
    };
    const recent = computeLeadNextActions(
      detail({ offers: [{ ...offer, created_at: '2026-09-01T09:00:00Z' }] }), { today: TODAY },
    );
    expect(recent.some((a) => a.kind === 'offer_waiting')).toBe(false);

    const stale = computeLeadNextActions(
      detail({ offers: [{ ...offer, created_at: '2026-08-20T09:00:00Z' }] }), { today: TODAY },
    );
    expect(stale.find((a) => a.kind === 'offer_waiting')).toMatchObject({
      label: 'Angebot wartet seit 13 Tagen', detail: 'Angebot A-2026-001',
    });
  });

  it('ignores draft and archived offers when counting what is waiting', () => {
    const actions = computeLeadNextActions(detail({
      offers: [
        { id: 'o1', offer_number: null, title: null, status: 'draft', gross_total_cents: 0, valid_until: null, created_at: '2026-08-01T09:00:00Z', archived_at: null },
        { id: 'o2', offer_number: 'A-2', title: null, status: 'sent', gross_total_cents: 0, valid_until: null, created_at: '2026-08-01T09:00:00Z', archived_at: `${TODAY}T09:00:00Z` },
      ],
    }), { today: TODAY });
    expect(actions.some((a) => a.kind === 'offer_waiting')).toBe(false);
  });

  it('reports overdue lead tasks and ignores completed ones', () => {
    const base = {
      lead_id: 'lead-1', customer_id: null as null, description: null, notes: null,
      sort_order: 0, completed_at: null, created_at: '', updated_at: '',
      priority: 'normal' as const,
    };
    const actions = computeLeadNextActions(detail({
      tasks: [
        { ...base, id: 't1', title: 'Angebot vorbereiten', status: 'open', due_date: '2026-08-30' },
        { ...base, id: 't2', title: 'Erledigt', status: 'completed', due_date: '2026-08-01' },
        { ...base, id: 't3', title: 'Ohne Datum', status: 'open', due_date: null },
      ],
    }), { today: TODAY });

    const tasks = actions.filter((a) => a.kind === 'task');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].label).toBe('Aufgabe 3 Tage überfällig: Angebot vorbereiten');
  });

  it('sorts the most overdue thing first', () => {
    const actions = computeLeadNextActions(detail({
      follow_ups: [{
        id: 'f1', lead_id: 'lead-1', due_at: '2026-09-01T10:00:00Z', reason: null,
        status: 'open', completed_at: null, completed_by: null, completion_note: null,
        created_at: '', updated_at: '',
      }],
      tasks: [{
        id: 't1', lead_id: 'lead-1', customer_id: null, title: 'Sehr alt', description: null,
        status: 'open', priority: 'normal', due_date: '2026-08-01', notes: null, sort_order: 0,
        completed_at: null, created_at: '', updated_at: '',
      }],
    }), { today: TODAY });

    expect(actions[0].label).toContain('Sehr alt');
  });

  it('is deterministic — the same input always produces the same list', () => {
    const input = detail({
      lead: lead({ stage: 'offer_sent' }), service_interests: ['ai_receptionist'],
      integration_check: check({ pvs_name: 'tomedo' }),
    });
    expect(computeLeadNextActions(input, { today: TODAY }))
      .toEqual(computeLeadNextActions(input, { today: TODAY }));
  });
});

/* ---------------------------------------------------- Command-center actions */

function commandData(overrides: Partial<CommandCenterData> = {}): CommandCenterData {
  return {
    follow_ups: [], upcoming_follow_up_count: 0, leads_without_follow_up: [],
    overdue_tasks: [], waiting_for_client: [], blockers: [], pipeline: [],
    open_offers: [], engagements: [], monitoring: [], integration_gate_open: [],
    ...overrides,
  };
}

describe('computeCommandNextActions', () => {
  it('names the prospect in every line, so the cockpit needs no second lookup', () => {
    const actions = computeCommandNextActions(commandData({
      follow_ups: [{
        follow_up_id: 'f1', lead_id: 'lead-1', lead_name: 'Dr. Müller',
        due_at: '2026-08-31T10:00:00Z', reason: 'PVS klären',
        stage: 'qualification', priority: 'high', bucket: 'overdue',
      }],
    }), { today: TODAY });

    expect(actions[0].label).toBe('Follow-up Dr. Müller — 2 Tage überfällig');
    expect(actions[0].leadId).toBe('lead-1');
  });

  it('ranks blockers and overdue work above things that are merely waiting', () => {
    const actions = computeCommandNextActions(commandData({
      waiting_for_client: [{
        task_id: 'w1', title: 'Öffnungszeiten bestätigen', client_request: 'Bitte prüfen',
        updated_at: '2026-08-20T09:00:00Z', engagement_id: 'e1', service_key: 'ai_receptionist',
        customer_id: 'c1', customer_name: 'Praxis A',
      }],
      blockers: [{
        task_id: 'b1', title: 'AVV fehlt', blocker_reason: 'Kunde prüft',
        updated_at: '2026-08-25T09:00:00Z', engagement_id: 'e1', service_key: 'ai_receptionist',
        customer_id: 'c1', customer_name: 'Praxis A',
      }],
      integration_gate_open: [{
        lead_id: 'lead-2', lead_name: 'Praxis B', stage: 'offer_sent',
        last_activity_at: '2026-08-28T09:00:00Z', integration_status: 'in_progress',
      }],
    }), { today: TODAY });

    expect(actions.map((a) => a.label)).toEqual([
      'Blocker: AVV fehlt — Praxis A',
      'Schnittstellen-Prüfung offen — Praxis B',
      'Wartet auf Kunde: Öffnungszeiten bestätigen — Praxis A',
    ]);
  });

  it('honours the limit without reordering what survives it', () => {
    const many = commandData({
      overdue_tasks: Array.from({ length: 20 }, (_, i) => ({
        task_id: `t${i}`, title: `Aufgabe ${i}`, due_date: '2026-08-25',
        priority: 'normal' as const, lead_id: null, customer_id: 'c1',
        subject_name: 'Praxis A', subject_kind: 'customer' as const,
      })),
    });
    const limited = computeCommandNextActions(many, { today: TODAY, limit: 5 });
    const full = computeCommandNextActions(many, { today: TODAY });
    expect(limited).toHaveLength(5);
    expect(limited).toEqual(full.slice(0, 5));
  });

  it('returns nothing at all when there is nothing to do', () => {
    expect(computeCommandNextActions(commandData(), { today: TODAY })).toEqual([]);
  });
});

/* --------------------------------------------------------------- Pipeline */

describe('openPipelineValue', () => {
  const row = (o: Partial<LeadListRow>): LeadListRow => ({
    ...lead(), ...o,
  } as LeadListRow);

  it('counts only the still-open stages', () => {
    const value = openPipelineValue([
      row({ id: '1', stage: 'qualification', estimated_setup_cents: 100000, estimated_monthly_cents: 20000 }),
      row({ id: '2', stage: 'negotiation', estimated_setup_cents: 50000, estimated_monthly_cents: null }),
      row({ id: '3', stage: 'won', estimated_setup_cents: 900000, estimated_monthly_cents: 90000 }),
      row({ id: '4', stage: 'lost', estimated_setup_cents: 700000, estimated_monthly_cents: 70000 }),
      row({ id: '5', stage: 'new', estimated_setup_cents: 10000, estimated_monthly_cents: 1000, archived_at: '2026-01-01T00:00:00Z' }),
    ]);

    expect(value).toEqual({ count: 2, setupCents: 150000, monthlyCents: 20000 });
  });

  it('treats a lead with no estimate as zero rather than dropping it', () => {
    // An unknown value must not silently remove the deal from the count.
    expect(openPipelineValue([row({ id: '1', stage: 'new' })]))
      .toEqual({ count: 1, setupCents: 0, monthlyCents: 0 });
  });
});
