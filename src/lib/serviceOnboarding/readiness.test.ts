// ─────────────────────────────────────────────────────────────────────────────
// The readiness engine decides three things the owner acts on directly: how far
// a client has come, whether they may go live, and what to do next. Every rule
// below is one the owner would notice being wrong — a 100% that hides a missing
// AVV, an N/A item quietly dragging a percentage down, or a blocked step buried
// under routine work.
//
// The engine is pure, so these are ordinary unit tests: no network, no clock,
// no component tree.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import {
  computeGoLiveGate, computeNextActions, computeReadiness, computeTaskCounts,
  fieldApplies, fieldDisplayValue, fieldHasValue, taskApplies,
} from '@/lib/serviceOnboarding/readiness';
import type {
  EngagementDetail, EngagementField, EngagementSection, EngagementTask,
  EngagementTaskStatus, ReadinessCategory,
} from '@/lib/serviceOnboarding/types';

/* ───────────────────────────────── fixtures ─────────────────────────────── */

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

function section(code: string, category: ReadinessCategory, overrides: Partial<EngagementSection> = {}): EngagementSection {
  return {
    id: nextId('sec'), engagement_id: 'eng-1', code, title: code, description: null,
    nav_group: 'discovery', readiness_category: category, healthcare_only: false,
    sort_order: 10, ...overrides,
  };
}

function task(code: string, overrides: Partial<EngagementTask> = {}): EngagementTask {
  return {
    id: nextId('task'), engagement_id: 'eng-1', template_task_id: null,
    section_code: 'legal', code, title: `Aufgabe ${code}`, description: null,
    readiness_category: 'legal', is_required: true, is_go_live_blocker: false,
    healthcare_only: false, status: 'not_started', blocker_reason: null, client_request: null,
    evidence_url: null, evidence_note: null, notes: null, reviewer: null,
    completed_by: null, completed_at: null, sort_order: 10,
    created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z', ...overrides,
  };
}

function field(code: string, overrides: Partial<EngagementField> = {}): EngagementField {
  return {
    id: nextId('field'), engagement_id: 'eng-1', template_field_id: null,
    section_code: 'legal', code, label: `Feld ${code}`, description: null,
    data_type: 'text', options: [], unit: null, placeholder: null,
    is_required: true, is_go_live_blocker: false, healthcare_only: false,
    value_text: null, value_number: null, value_bool: null, value_date: null,
    not_applicable: false, sort_order: 10, updated_by: null,
    created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z', ...overrides,
  };
}

function detail({ healthcare = false, sections = [section('legal', 'legal')], tasks = [], fields = [] }: {
  healthcare?: boolean;
  sections?: EngagementSection[];
  tasks?: EngagementTask[];
  fields?: EngagementField[];
} = {}): EngagementDetail {
  return {
    engagement: {
      id: 'eng-1', business_entity_id: 'entity-1', customer_id: 'cust-1',
      customer_service_id: 'svc-1', service_key: 'ai_receptionist',
      template_id: 'tpl-1', template_code: 'ai_receptionist_healthcare', template_version: 1,
      lifecycle_status: 'building', healthcare, integration_mode: null,
      integration_limitations: null, summary: null, go_live_target_date: null,
      went_live_at: null, monitoring_until: null, created_by: null,
      created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z',
    },
    customer: {
      id: 'cust-1', company: 'Beispielpraxis GmbH', contact_name: null,
      email: null, phone: null, city: null, status: 'active',
    },
    sections, tasks, fields, appointment_types: [], activity: [],
    go_live: { ready: true, count: 0, blockers: [] },
  };
}

/* ───────────────────────────────── readiness ────────────────────────────── */

describe('computeReadiness', () => {
  it('counts only required, applicable items', () => {
    const result = computeReadiness(detail({
      tasks: [
        task('A', { status: 'complete', completed_at: '2026-08-02T00:00:00Z' }),
        task('B', { status: 'not_started' }),
        // Optional and untouched: must not appear in the denominator.
        task('C', { status: 'not_started', is_required: false }),
      ],
    }));
    expect(result.total).toBe(2);
    expect(result.done).toBe(1);
    expect(result.percent).toBe(50);
  });

  it('an optional item can never lower the percentage', () => {
    const done = [task('A', { status: 'complete', completed_at: '2026-08-02T00:00:00Z' })];
    const withoutOptional = computeReadiness(detail({ tasks: done }));
    const withOptional = computeReadiness(detail({
      tasks: [...done, task('OPT', { is_required: false, status: 'not_started' })],
    }));
    expect(withoutOptional.percent).toBe(100);
    expect(withOptional.percent).toBe(100);
  });

  it('excludes tasks marked NOT_APPLICABLE from the calculation entirely', () => {
    const result = computeReadiness(detail({
      tasks: [
        task('A', { status: 'complete', completed_at: '2026-08-02T00:00:00Z' }),
        task('B', { status: 'not_applicable' }),
      ],
    }));
    expect(result.total).toBe(1);
    expect(result.percent).toBe(100);
  });

  it('excludes fields marked not applicable', () => {
    const result = computeReadiness(detail({
      fields: [
        field('F1', { value_text: 'erfasst' }),
        field('F2', { not_applicable: true }),
      ],
    }));
    expect(result.total).toBe(1);
    expect(result.percent).toBe(100);
  });

  it('drops healthcare-only items for a non-healthcare client and restores them for a healthcare one', () => {
    const build = (healthcare: boolean) => computeReadiness(detail({
      healthcare,
      tasks: [
        task('GEN', { status: 'complete', completed_at: '2026-08-02T00:00:00Z' }),
        task('HC', { healthcare_only: true, status: 'not_started' }),
      ],
    }));
    expect(build(false).total).toBe(1);
    expect(build(false).percent).toBe(100);
    expect(build(true).total).toBe(2);
    expect(build(true).percent).toBe(50);
  });

  it('reports no percentage rather than 0% or 100% when nothing required applies', () => {
    const result = computeReadiness(detail({
      tasks: [task('OPT', { is_required: false })],
    }));
    expect(result.total).toBe(0);
    expect(result.percent).toBeNull();
    expect(result.categories[0].percent).toBeNull();
  });

  it('splits by category, and a field inherits its section category', () => {
    const result = computeReadiness(detail({
      sections: [section('legal', 'legal'), section('telephony', 'telephony', { sort_order: 20 })],
      tasks: [
        task('L1', { section_code: 'legal', readiness_category: 'legal', status: 'complete', completed_at: 'x' }),
        task('T1', { section_code: 'telephony', readiness_category: 'telephony' }),
      ],
      fields: [field('TF1', { section_code: 'telephony', value_text: 'gesetzt' })],
    }));
    const byKey = Object.fromEntries(result.categories.map((c) => [c.category, c]));
    expect(byKey.legal.percent).toBe(100);
    expect(byKey.telephony.total).toBe(2);
    expect(byKey.telephony.done).toBe(1);
    expect(byKey.telephony.percent).toBe(50);
  });

  it('orders categories consistently regardless of task order', () => {
    const result = computeReadiness(detail({
      sections: [section('telephony', 'telephony'), section('legal', 'legal')],
      tasks: [task('T', { section_code: 'telephony', readiness_category: 'telephony' }), task('L')],
    }));
    expect(result.categories.map((c) => c.category)).toEqual(['legal', 'telephony']);
  });
});

/* ───────────────────────────────── go-live gate ─────────────────────────── */

describe('computeGoLiveGate', () => {
  it('blocks while a required blocker task is unfinished, and names it', () => {
    const gate = computeGoLiveGate(detail({
      tasks: [task('AVV', { is_go_live_blocker: true, title: 'AVV unterzeichnet' })],
    }));
    expect(gate.ready).toBe(false);
    expect(gate.count).toBe(1);
    expect(gate.blockers[0]).toMatchObject({ kind: 'task', title: 'AVV unterzeichnet' });
  });

  it('opens once every blocker is complete or not applicable', () => {
    const gate = computeGoLiveGate(detail({
      tasks: [
        task('A', { is_go_live_blocker: true, status: 'complete', completed_at: 'x' }),
        task('B', { is_go_live_blocker: true, status: 'not_applicable' }),
        // A non-blocking task left open must not hold the gate shut.
        task('C', { status: 'not_started' }),
      ],
    }));
    expect(gate.ready).toBe(true);
    expect(gate.count).toBe(0);
  });

  it('treats a missing blocker FIELD as a blocker, and a filled one as satisfied', () => {
    const missing = computeGoLiveGate(detail({
      fields: [field('AGENT_ID', { is_go_live_blocker: true, label: 'ElevenLabs Agent-ID' })],
    }));
    expect(missing.ready).toBe(false);
    expect(missing.blockers[0]).toMatchObject({ kind: 'field', title: 'ElevenLabs Agent-ID' });

    const filled = computeGoLiveGate(detail({
      fields: [field('AGENT_ID', { is_go_live_blocker: true, value_text: 'agent_abc' })],
    }));
    expect(filled.ready).toBe(true);
  });

  it('a boolean answered "false" is answered, not missing', () => {
    const gate = computeGoLiveGate(detail({
      fields: [field('REC', { is_go_live_blocker: true, data_type: 'boolean', value_bool: false })],
    }));
    expect(gate.ready).toBe(true);
  });

  it('ignores healthcare blockers for a non-healthcare client', () => {
    const tasks = [task('ART9', { is_go_live_blocker: true, healthcare_only: true })];
    expect(computeGoLiveGate(detail({ healthcare: false, tasks })).ready).toBe(true);
    expect(computeGoLiveGate(detail({ healthcare: true, tasks })).ready).toBe(false);
  });

  it('carries the blocker reason and the client request through to the blocker view', () => {
    const gate = computeGoLiveGate(detail({
      tasks: [
        task('X', { is_go_live_blocker: true, status: 'blocked', blocker_reason: 'Hersteller antwortet nicht' }),
        task('Y', { is_go_live_blocker: true, status: 'waiting_for_client', client_request: 'AVV im Original' }),
      ],
    }));
    expect(gate.blockers[0].reason).toBe('Hersteller antwortet nicht');
    expect(gate.blockers[1].client_request).toBe('AVV im Original');
  });
});

/* ───────────────────────────────── next actions ─────────────────────────── */

describe('computeNextActions', () => {
  it('puts a blocked go-live item ahead of everything else', () => {
    const actions = computeNextActions(detail({
      tasks: [
        task('ROUTINE', { status: 'not_started' }),
        task('INPROG', { status: 'in_progress' }),
        task('WAIT', { status: 'waiting_for_client', client_request: 'AVV' }),
        task('BLOCKGL', { status: 'blocked', blocker_reason: 'API-Freigabe fehlt', is_go_live_blocker: true }),
      ],
    }));
    expect(actions[0].code).toBe('BLOCKGL');
    expect(actions[0].reason).toContain('API-Freigabe fehlt');
  });

  it('follows the documented priority order end to end', () => {
    const actions = computeNextActions(detail({
      tasks: [
        task('E_REQUIRED', { status: 'not_started' }),
        task('D_INPROGRESS', { status: 'in_progress' }),
        task('C_WAITING', { status: 'waiting_for_client', client_request: 'Unterlagen' }),
        task('B_GOLIVE', { status: 'not_started', is_go_live_blocker: true }),
        task('A_BLOCKED', { status: 'blocked', blocker_reason: 'wartet auf PBX' }),
      ],
    }), 10);
    expect(actions.map((a) => a.code)).toEqual([
      'A_BLOCKED', 'B_GOLIVE', 'C_WAITING', 'D_INPROGRESS', 'E_REQUIRED',
    ]);
  });

  it('surfaces missing required fields, and ranks a blocking field with the blockers', () => {
    const actions = computeNextActions(detail({
      tasks: [task('T', { status: 'not_started' })],
      fields: [
        field('PLAIN', {}),
        field('GATE', { is_go_live_blocker: true }),
      ],
    }), 10);
    const codes = actions.map((a) => a.code);
    expect(codes.indexOf('GATE')).toBeLessThan(codes.indexOf('T'));
    expect(codes.indexOf('T')).toBeLessThan(codes.indexOf('PLAIN'));
  });

  it('never suggests completed, not-applicable, answered or inapplicable-healthcare items', () => {
    const actions = computeNextActions(detail({
      healthcare: false,
      tasks: [
        task('DONE', { status: 'complete', completed_at: 'x' }),
        task('NA', { status: 'not_applicable' }),
        task('HC', { healthcare_only: true }),
      ],
      fields: [
        field('FILLED', { value_text: 'da' }),
        field('NAF', { not_applicable: true }),
        field('OPTIONAL', { is_required: false }),
      ],
    }), 10);
    expect(actions).toHaveLength(0);
  });

  it('is stable: same input, same order', () => {
    const input = detail({
      sections: [section('legal', 'legal', { sort_order: 10 }), section('telephony', 'telephony', { sort_order: 20 })],
      tasks: [
        task('T2', { section_code: 'telephony', sort_order: 1 }),
        task('L2', { section_code: 'legal', sort_order: 2 }),
        task('L1', { section_code: 'legal', sort_order: 1 }),
      ],
    });
    const first = computeNextActions(input, 10).map((a) => a.code);
    const second = computeNextActions(input, 10).map((a) => a.code);
    expect(first).toEqual(second);
    // Section order wins over the item's own order.
    expect(first).toEqual(['L1', 'L2', 'T2']);
  });

  it('honours the limit', () => {
    const tasks = Array.from({ length: 12 }, (_, i) => task(`T${String(i).padStart(2, '0')}`));
    expect(computeNextActions(detail({ tasks }))).toHaveLength(6);
    expect(computeNextActions(detail({ tasks }), 3)).toHaveLength(3);
  });
});

/* ───────────────────────────────── helpers ──────────────────────────────── */

describe('applicability and value helpers', () => {
  const statuses: EngagementTaskStatus[] = ['not_started', 'in_progress', 'waiting_for_client', 'blocked', 'complete'];

  it('taskApplies is false only for not_applicable or an out-of-scope healthcare task', () => {
    for (const status of statuses) expect(taskApplies(task('X', { status }), false)).toBe(true);
    expect(taskApplies(task('X', { status: 'not_applicable' }), true)).toBe(false);
    expect(taskApplies(task('X', { healthcare_only: true }), false)).toBe(false);
    expect(taskApplies(task('X', { healthcare_only: true }), true)).toBe(true);
  });

  it('fieldApplies mirrors the same two rules', () => {
    expect(fieldApplies(field('X'), false)).toBe(true);
    expect(fieldApplies(field('X', { not_applicable: true }), false)).toBe(false);
    expect(fieldApplies(field('X', { healthcare_only: true }), false)).toBe(false);
  });

  it('fieldHasValue accepts every typed column, including boolean false and zero', () => {
    expect(fieldHasValue(field('X'))).toBe(false);
    expect(fieldHasValue(field('X', { value_text: 'a' }))).toBe(true);
    expect(fieldHasValue(field('X', { value_number: 0 }))).toBe(true);
    expect(fieldHasValue(field('X', { value_bool: false }))).toBe(true);
    expect(fieldHasValue(field('X', { value_date: '2026-09-01' }))).toBe(true);
  });

  it('fieldDisplayValue resolves a select to its label and appends units', () => {
    expect(fieldDisplayValue(field('X'))).toBeNull();
    expect(fieldDisplayValue(field('X', { value_bool: false }))).toBe('Nein');
    expect(fieldDisplayValue(field('X', { value_number: 250, unit: 'ms' }))).toBe('250 ms');
    expect(fieldDisplayValue(field('X', {
      data_type: 'select', options: [{ value: 'eu', label: 'EU' }], value_text: 'eu',
    }))).toBe('EU');
    // An unknown stored value is shown verbatim rather than silently blanked.
    expect(fieldDisplayValue(field('X', {
      data_type: 'select', options: [{ value: 'eu', label: 'EU' }], value_text: 'apac',
    }))).toBe('apac');
  });
});

describe('computeTaskCounts', () => {
  it('counts by status and keeps inapplicable healthcare tasks out of the totals', () => {
    const counts = computeTaskCounts(detail({
      healthcare: false,
      tasks: [
        task('A', { status: 'not_started' }),
        task('B', { status: 'in_progress' }),
        task('C', { status: 'waiting_for_client', client_request: 'x' }),
        task('D', { status: 'blocked', blocker_reason: 'x' }),
        task('E', { status: 'complete', completed_at: 'x' }),
        task('F', { status: 'not_applicable' }),
        task('G', { healthcare_only: true }),
      ],
    }));
    expect(counts).toEqual({
      open: 1, inProgress: 1, waitingForClient: 1, blocked: 1,
      complete: 1, notApplicable: 1, applicable: 5,
    });
  });
});
