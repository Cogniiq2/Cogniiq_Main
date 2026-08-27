import {
  READINESS_CATEGORY_ORDER, readinessCategoryLabel,
} from '@/lib/serviceOnboarding/catalog';
import type {
  EngagementDetail, EngagementField, EngagementSection, EngagementTask,
  GoLiveBlocker, GoLiveGate, ReadinessCategory,
} from '@/lib/serviceOnboarding/types';

/**
 * The readiness, blocker and next-action engine.
 *
 * Deterministic and pure: same input, same output, no dates, no randomness, no network. It is
 * the single place these numbers are produced — no page computes a percentage of its own.
 *
 * Three rules govern everything below:
 *
 *   1. APPLICABILITY. A healthcare-only item does not apply to a non-healthcare engagement.
 *      A task set to NOT_APPLICABLE and a field marked not_applicable do not apply either.
 *      Non-applicable items are removed from the calculation entirely — they never depress a
 *      percentage and they are never blockers.
 *
 *   2. OPTIONAL ITEMS NEVER COUNT AGAINST READINESS. Only required, applicable items form the
 *      denominator. An untouched optional metric cannot make a client look less ready than it is.
 *
 *   3. NO FAKED PRECISION. A category with no applicable required items has no percentage at
 *      all (`total === 0`), and is rendered as "—" rather than as 0% or 100%.
 *
 * These are the same rules `owner_engagement_go_live_blockers()` enforces in SQL. The server is
 * the authority for whether a go-live may proceed; this module is what the owner reads.
 */

/* ------------------------------------------------------------------ Applicability */

export function taskApplies(task: EngagementTask, healthcare: boolean): boolean {
  if (task.healthcare_only && !healthcare) return false;
  return task.status !== 'not_applicable';
}

export function fieldApplies(field: EngagementField, healthcare: boolean): boolean {
  if (field.healthcare_only && !healthcare) return false;
  return !field.not_applicable;
}

export function sectionApplies(section: EngagementSection, healthcare: boolean): boolean {
  return !section.healthcare_only || healthcare;
}

/** A field counts as answered when any of its typed value columns is set. `false` is an answer. */
export function fieldHasValue(field: EngagementField): boolean {
  return field.value_text !== null
    || field.value_number !== null
    || field.value_bool !== null
    || field.value_date !== null;
}

/** Human-readable value for read-only display. Returns null when the field is unanswered. */
export function fieldDisplayValue(field: EngagementField): string | null {
  if (field.value_bool !== null) return field.value_bool ? 'Ja' : 'Nein';
  if (field.value_number !== null) {
    return field.unit ? `${field.value_number} ${field.unit}` : String(field.value_number);
  }
  if (field.value_date !== null) return field.value_date;
  if (field.value_text !== null) {
    const option = field.options.find((o) => o.value === field.value_text);
    return option ? option.label : field.value_text;
  }
  return null;
}

/* ------------------------------------------------------------------ Readiness */

export interface CategoryReadiness {
  category: ReadinessCategory;
  label: string;
  /** Applicable required items in this category. Zero means "no percentage exists". */
  total: number;
  done: number;
  /** Null when `total === 0` — deliberately not 0 and not 100. */
  percent: number | null;
  blockerCount: number;
}

export interface ReadinessResult {
  /** Null when the engagement has no applicable required items at all. */
  percent: number | null;
  total: number;
  done: number;
  categories: CategoryReadiness[];
  blockerCount: number;
}

interface Counter { total: number; done: number; blockers: number }

function emptyCounter(): Counter { return { total: 0, done: 0, blockers: 0 }; }

/**
 * Fields inherit their readiness category from the section they belong to; only tasks carry
 * their own (a task may deliberately be counted under a different category than its section).
 */
function sectionCategoryMap(sections: EngagementSection[]): Map<string, ReadinessCategory> {
  return new Map(sections.map((s) => [s.code, s.readiness_category]));
}

export function computeReadiness(detail: EngagementDetail): ReadinessResult {
  const healthcare = detail.engagement.healthcare;
  const byCategory = new Map<ReadinessCategory, Counter>();
  const bump = (category: ReadinessCategory): Counter => {
    let counter = byCategory.get(category);
    if (!counter) { counter = emptyCounter(); byCategory.set(category, counter); }
    return counter;
  };

  for (const task of detail.tasks) {
    if (!taskApplies(task, healthcare)) continue;
    const counter = bump(task.readiness_category);
    if (task.is_go_live_blocker && task.status !== 'complete') counter.blockers += 1;
    if (!task.is_required) continue;
    counter.total += 1;
    if (task.status === 'complete') counter.done += 1;
  }

  const categoryOf = sectionCategoryMap(detail.sections);
  for (const field of detail.fields) {
    if (!fieldApplies(field, healthcare)) continue;
    const category = categoryOf.get(field.section_code);
    if (!category) continue;
    const counter = bump(category);
    const answered = fieldHasValue(field);
    if (field.is_go_live_blocker && !answered) counter.blockers += 1;
    if (!field.is_required) continue;
    counter.total += 1;
    if (answered) counter.done += 1;
  }

  const categories: CategoryReadiness[] = READINESS_CATEGORY_ORDER
    .filter((category) => byCategory.has(category))
    .map((category) => {
      const counter = byCategory.get(category) ?? emptyCounter();
      return {
        category,
        label: readinessCategoryLabel[category],
        total: counter.total,
        done: counter.done,
        percent: counter.total === 0 ? null : Math.round((counter.done / counter.total) * 100),
        blockerCount: counter.blockers,
      };
    });

  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const done = categories.reduce((sum, c) => sum + c.done, 0);
  const blockerCount = categories.reduce((sum, c) => sum + c.blockerCount, 0);

  return {
    percent: total === 0 ? null : Math.round((done / total) * 100),
    total,
    done,
    categories,
    blockerCount,
  };
}

/* ------------------------------------------------------------------ Go-live gate */

/**
 * The same gate `owner_engagement_go_live_blockers()` computes in SQL, so the workspace can show
 * WHY a client may not go live without a second round trip. The server still decides: a status
 * transition into ready/live/monitoring is refused there, not here.
 */
export function computeGoLiveGate(detail: EngagementDetail): GoLiveGate {
  const healthcare = detail.engagement.healthcare;
  const blockers: GoLiveBlocker[] = [];

  for (const task of detail.tasks) {
    if (!task.is_go_live_blocker) continue;
    if (task.status === 'complete' || task.status === 'not_applicable') continue;
    if (task.healthcare_only && !healthcare) continue;
    blockers.push({
      kind: 'task',
      id: task.id,
      code: task.code,
      title: task.title,
      category: task.readiness_category,
      section_code: task.section_code,
      status: task.status,
      reason: task.blocker_reason,
      client_request: task.client_request,
    });
  }

  for (const field of detail.fields) {
    if (!field.is_go_live_blocker) continue;
    if (field.not_applicable) continue;
    if (field.healthcare_only && !healthcare) continue;
    if (fieldHasValue(field)) continue;
    blockers.push({
      kind: 'field',
      id: field.id,
      code: field.code,
      title: field.label,
      category: null,
      section_code: field.section_code,
      status: 'missing',
      reason: null,
      client_request: null,
    });
  }

  return { ready: blockers.length === 0, count: blockers.length, blockers };
}

/* ------------------------------------------------------------------ Next actions */

export type NextActionKind = 'task' | 'field';

export interface NextAction {
  kind: NextActionKind;
  /** Task id or field id — enough to navigate straight to it. */
  id: string;
  code: string;
  title: string;
  sectionCode: string;
  /** Short German reason this surfaced, e.g. "Blockiert" or "Wartet auf Kunde". */
  reason: string;
  isGoLiveBlocker: boolean;
  /** Lower sorts first. Exposed so the ordering is assertable in tests. */
  priority: number;
}

/**
 * Priority bands. Deterministic rules, not an opaque model:
 *
 *    0  a blocked task that also blocks go-live
 *   10  any other blocked task
 *   20  an unresolved go-live blocker (task or missing field)
 *   30  waiting for the client
 *   40  already in progress
 *   50  a required task not started yet
 *   60  a required field still empty
 *
 * Ties break by the section's position, then the item's own sort order, then its code — so the
 * list is stable across reloads and never reshuffles under the owner's cursor.
 */
const PRIORITY = {
  blockedGoLive: 0,
  blocked: 10,
  goLiveBlocker: 20,
  waitingForClient: 30,
  inProgress: 40,
  requiredTask: 50,
  requiredField: 60,
} as const;

export function computeNextActions(detail: EngagementDetail, limit = 6): NextAction[] {
  const healthcare = detail.engagement.healthcare;
  const sectionOrder = new Map(detail.sections.map((s) => [s.code, s.sort_order]));
  const orderOf = (code: string) => sectionOrder.get(code) ?? 9_999;

  interface Candidate extends NextAction { sectionOrder: number; itemOrder: number }
  const candidates: Candidate[] = [];

  for (const task of detail.tasks) {
    if (!taskApplies(task, healthcare)) continue;
    if (task.status === 'complete') continue;

    let priority: number | null = null;
    let reason = '';
    if (task.status === 'blocked') {
      priority = task.is_go_live_blocker ? PRIORITY.blockedGoLive : PRIORITY.blocked;
      reason = task.blocker_reason ? `Blockiert: ${task.blocker_reason}` : 'Blockiert';
    } else if (task.status === 'waiting_for_client') {
      priority = PRIORITY.waitingForClient;
      reason = task.client_request ? `Wartet auf Kunde: ${task.client_request}` : 'Wartet auf Kunde';
    } else if (task.is_go_live_blocker) {
      priority = PRIORITY.goLiveBlocker;
      reason = task.status === 'in_progress' ? 'Go-Live-Blocker, in Arbeit' : 'Go-Live-Blocker';
    } else if (task.status === 'in_progress') {
      priority = PRIORITY.inProgress;
      reason = 'In Arbeit';
    } else if (task.is_required) {
      priority = PRIORITY.requiredTask;
      reason = 'Erforderlich';
    }
    if (priority === null) continue;

    candidates.push({
      kind: 'task', id: task.id, code: task.code, title: task.title,
      sectionCode: task.section_code, reason, isGoLiveBlocker: task.is_go_live_blocker,
      priority, sectionOrder: orderOf(task.section_code), itemOrder: task.sort_order,
    });
  }

  for (const field of detail.fields) {
    if (!fieldApplies(field, healthcare)) continue;
    if (fieldHasValue(field)) continue;
    if (!field.is_required && !field.is_go_live_blocker) continue;

    candidates.push({
      kind: 'field', id: field.id, code: field.code, title: field.label,
      sectionCode: field.section_code,
      reason: field.is_go_live_blocker ? 'Go-Live-Blocker: Angabe fehlt' : 'Angabe fehlt',
      isGoLiveBlocker: field.is_go_live_blocker,
      priority: field.is_go_live_blocker ? PRIORITY.goLiveBlocker : PRIORITY.requiredField,
      sectionOrder: orderOf(field.section_code), itemOrder: field.sort_order,
    });
  }

  candidates.sort((a, b) =>
    a.priority - b.priority
    || a.sectionOrder - b.sectionOrder
    || a.itemOrder - b.itemOrder
    || a.code.localeCompare(b.code));

  // The sort keys are internal; the caller gets the action itself.
  return candidates.slice(0, limit).map((candidate) => ({
    kind: candidate.kind,
    id: candidate.id,
    code: candidate.code,
    title: candidate.title,
    sectionCode: candidate.sectionCode,
    reason: candidate.reason,
    isGoLiveBlocker: candidate.isGoLiveBlocker,
    priority: candidate.priority,
  }));
}

/* ------------------------------------------------------------------ Counts for the header */

export interface EngagementCounts {
  open: number;
  inProgress: number;
  waitingForClient: number;
  blocked: number;
  complete: number;
  notApplicable: number;
  /** Applicable tasks only — a non-healthcare client's healthcare tasks are not counted. */
  applicable: number;
}

export function computeTaskCounts(detail: EngagementDetail): EngagementCounts {
  const healthcare = detail.engagement.healthcare;
  const counts: EngagementCounts = {
    open: 0, inProgress: 0, waitingForClient: 0, blocked: 0,
    complete: 0, notApplicable: 0, applicable: 0,
  };
  for (const task of detail.tasks) {
    if (task.healthcare_only && !healthcare) continue;
    if (task.status === 'not_applicable') { counts.notApplicable += 1; continue; }
    counts.applicable += 1;
    if (task.status === 'not_started') counts.open += 1;
    else if (task.status === 'in_progress') counts.inProgress += 1;
    else if (task.status === 'waiting_for_client') counts.waitingForClient += 1;
    else if (task.status === 'blocked') counts.blocked += 1;
    else if (task.status === 'complete') counts.complete += 1;
  }
  return counts;
}
