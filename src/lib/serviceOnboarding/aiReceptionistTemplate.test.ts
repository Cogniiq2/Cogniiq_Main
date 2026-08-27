// ─────────────────────────────────────────────────────────────────────────────
// The AI Receptionist template is the thing the owner actually relies on: if a
// task references a section that does not exist, a go-live gate is missing, or a
// healthcare-only obligation is applied to a bakery, the workspace lies to them.
//
// The seed is plain SQL, so it is parsed here and checked as data. These tests
// also guard the rules the prompt for this system set out and that are easy to
// erode later: monitoring work must not depress pre-launch readiness, the
// recording decision must stay an explicit field rather than a hard-coded truth,
// and no real customer may appear in a migration.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  CANONICAL_PHASES, NAV_GROUP_ORDER, PHASE_BY_SECTION, READINESS_CATEGORY_ORDER,
} from '@/lib/serviceOnboarding/catalog';

const SQL = readFileSync('supabase/migrations/20260830121000_ai_receptionist_template_v1.sql', 'utf8')
  .replace(/\r\n/g, '\n');

/** The three VALUES blocks, isolated so a task regex can never match a field row. */
function valuesBlock(afterMarker: string): string {
  const start = SQL.indexOf(afterMarker);
  expect(start, afterMarker).toBeGreaterThan(-1);
  const from = SQL.indexOf('from (values', start);
  const to = SQL.indexOf('\n) as ', from);
  expect(to).toBeGreaterThan(from);
  return SQL.slice(from, to);
}

interface Section {
  code: string; title: string; navGroup: string; category: string;
  healthcareOnly: boolean; sortOrder: number;
}
interface Task {
  sectionCode: string; code: string; title: string;
  required: boolean; blocker: boolean; healthcareOnly: boolean;
}
interface Field extends Task { label: string; dataType: string }

const SECTIONS: Section[] = [...valuesBlock('-- Sections.').matchAll(
  /^\s*\('(\w+)',\s*'([^']*)',\s*'([^']*)',\s*'(\w+)',\s*'(\w+)',\s*(true|false),\s*(\d+)\),?\s*$/gm,
)].map((m) => ({
  code: m[1], title: m[2], navGroup: m[4], category: m[5],
  healthcareOnly: m[6] === 'true', sortOrder: Number(m[7]),
}));

const FIELDS: Field[] = [...valuesBlock('-- Structured fields').matchAll(
  /^\s*\('(\w+)','([A-Z]+-F\d+)','([^']*)','[^']*','(\w+)',.*,(true|false),(true|false),(true|false)\),?\s*$/gm,
)].map((m) => ({
  sectionCode: m[1], code: m[2], title: m[3], label: m[3], dataType: m[4],
  required: m[5] === 'true', blocker: m[6] === 'true', healthcareOnly: m[7] === 'true',
}));

const TASKS: Task[] = [...valuesBlock('-- Tasks (ACTIONS').matchAll(
  /^\s*\('(\w+)','([A-Z]+-\d+)','([^']*)','[^']*',(true|false),(true|false),(true|false)\),?\s*$/gm,
)].map((m) => ({
  sectionCode: m[1], code: m[2], title: m[3],
  required: m[4] === 'true', blocker: m[5] === 'true', healthcareOnly: m[6] === 'true',
}));

const sectionCodes = new Set(SECTIONS.map((s) => s.code));
const byCode = <T extends { code: string }>(rows: T[]) => new Map(rows.map((r) => [r.code, r]));
const TASK_BY_CODE = byCode(TASKS);
const FIELD_BY_CODE = byCode(FIELDS);

/* ───────────────────────────── parse sanity ─────────────────────────────── */

describe('seed parsing', () => {
  it('found the whole template', () => {
    // Exact, not "at least": template v1 is snapshotted into every engagement instantiated
    // from it, so its content is frozen. Changing these numbers means changing v1 after
    // release, which must be a deliberate act rather than a silent drift. New content belongs
    // in a version 2. The disposable-database suite asserts the same three numbers against a
    // real Postgres, so the parser and the database cannot disagree.
    expect(SECTIONS).toHaveLength(20);
    expect(TASKS).toHaveLength(171);
    expect(FIELDS).toHaveLength(132);
  });

  it('declares the template with an explicit code and version', () => {
    expect(SQL).toContain("values ('ai_receptionist', 'ai_receptionist_healthcare', 1,");
    expect(SQL).toContain('on conflict (code, version) do update');
  });

  it('is deterministic and re-runnable: everything upserts on a stable key', () => {
    expect(SQL).toContain('on conflict (template_id, code) do update set');
    // Ordering is derived from the code, not from insert order.
    expect(SQL).toContain("(substring(t.code from '[0-9]+$'))::int");
    expect(SQL).toContain("(substring(f.code from '[0-9]+$'))::int");
  });
});

/* ───────────────────── the canonical 16-phase process ───────────────────── */

/*
  The template stores 20 sections, but the business process it encodes has 16 phases. That is a
  subdivision, not a different process — and the difference is exactly the kind of thing that
  erodes silently. These tests hold the two together in both directions: no phase may vanish
  from the template, and no section may appear that does not belong to a phase.
*/
describe('canonical phase model', () => {
  it('defines exactly sixteen phases, numbered 1..16 in order', () => {
    expect(CANONICAL_PHASES).toHaveLength(16);
    expect(CANONICAL_PHASES.map((p) => p.number)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    );
  });

  it('every canonical phase is represented by at least one section that exists in the seed', () => {
    for (const phase of CANONICAL_PHASES) {
      expect(phase.sections.length, `phase ${phase.number} has no sections`).toBeGreaterThan(0);
      for (const code of phase.sections) {
        expect(sectionCodes, `phase ${phase.number} (${phase.title}) references missing section ${code}`)
          .toContain(code);
      }
    }
  });

  it('every seeded section belongs to exactly one canonical phase — no orphan process steps', () => {
    for (const section of SECTIONS) {
      expect(PHASE_BY_SECTION[section.code], `section ${section.code} belongs to no canonical phase`)
        .toBeDefined();
    }
    const mapped = CANONICAL_PHASES.flatMap((p) => p.sections);
    expect(new Set(mapped).size, 'a section is claimed by two phases').toBe(mapped.length);
    expect(mapped.sort()).toEqual([...sectionCodes].sort());
  });

  it('accounts for the section count as 16 phases plus four documented splits', () => {
    const split = CANONICAL_PHASES.filter((p) => p.sections.length > 1);
    expect(split).toHaveLength(4);
    // A split without a stated reason is how a subdivision quietly becomes a new phase.
    for (const phase of split) {
      expect(phase.splitRationale, `phase ${phase.number} is split without a rationale`).toBeTruthy();
    }
    expect(SECTIONS).toHaveLength(
      CANONICAL_PHASES.length + split.reduce((n, p) => n + p.sections.length - 1, 0),
    );
  });

  it('orders the workspace by delivery flow, not by phase number', () => {
    /*
      `sort_order` is DISPLAY order inside a navigation group, not lifecycle order, and the two
      deliberately differ. The commercial half of phase 13 sorts first because it appears in the
      Overview tab; compliance (phases 3–4) sorts before integration (phase 2) because that is
      the order the work is actually done in. Asserting sort_order == phase number would be
      asserting a coincidence.

      What must hold is that the workspace never presents the end of the process before the
      beginning: the launch and post-launch areas come last.
    */
    // The parsed navGroup is a plain string; NAV_GROUP_ORDER is the typed vocabulary. The
    // membership check above ("every section uses a known navigation area") is what makes the
    // widening safe here.
    const navPosition = (code: string) => (NAV_GROUP_ORDER as readonly string[]).indexOf(
      SECTIONS.find((s) => s.code === code)!.navGroup,
    );
    const lastNav = Math.max(...['golive', 'deployment', 'monitoring', 'maintenance'].map(navPosition));
    const firstNav = Math.min(...['profile', 'scope', 'workflow', 'identity'].map(navPosition));
    expect(firstNav).toBeLessThan(lastNav);

    // Go-Live and Monitoring are the final two navigation areas, in that order.
    expect(NAV_GROUP_ORDER.slice(-2)).toEqual(['golive', 'monitoring']);
    expect(navPosition('deployment')).toBe(NAV_GROUP_ORDER.indexOf('golive'));
    expect(navPosition('maintenance')).toBe(NAV_GROUP_ORDER.indexOf('monitoring'));
  });

  it('gives every section a distinct display position, so the order is deterministic', () => {
    const orders = SECTIONS.map((s) => s.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('every phase carries real work — none is a heading with nothing under it', () => {
    for (const phase of CANONICAL_PHASES) {
      const items = [...TASKS, ...FIELDS].filter((i) => phase.sections.includes(i.sectionCode));
      expect(items.length, `phase ${phase.number} (${phase.title}) is empty`).toBeGreaterThan(0);
    }
  });

  it('routes every phase into the navigation and the readiness model', () => {
    for (const phase of CANONICAL_PHASES) {
      for (const code of phase.sections) {
        const section = SECTIONS.find((s) => s.code === code)!;
        expect(NAV_GROUP_ORDER, `${code} nav group`).toContain(section.navGroup);
        expect(READINESS_CATEGORY_ORDER, `${code} readiness category`).toContain(section.category);
      }
    }
  });

  it('the go-live gate spans both halves of phase 13', () => {
    // Commercial approval and technical readiness both block launch; losing either half would
    // let a client go live on a handshake or without a rollback plan.
    const phase13 = CANONICAL_PHASES.find((p) => p.number === 13)!;
    for (const code of phase13.sections) {
      const blockers = [...TASKS, ...FIELDS].filter((i) => i.sectionCode === code && i.blocker);
      expect(blockers.length, `${code} contributes no go-live blocker`).toBeGreaterThan(0);
    }
  });
});

/* ───────────────────────────── referential integrity ────────────────────── */

describe('structure', () => {
  it('every section uses a known navigation area and readiness category', () => {
    for (const section of SECTIONS) {
      expect(NAV_GROUP_ORDER, section.code).toContain(section.navGroup);
      expect(READINESS_CATEGORY_ORDER, section.code).toContain(section.category);
    }
  });

  it('folds twenty phases into the nine navigation areas the workspace shows', () => {
    const groups = new Set(SECTIONS.map((s) => s.navGroup));
    // 'overview' has its own dashboards and needs no phase of its own beyond commercial.
    expect(groups.size).toBeLessThanOrEqual(NAV_GROUP_ORDER.length);
    expect(groups.size).toBeGreaterThanOrEqual(8);
  });

  it('covers every readiness category, so no category is a permanent blank', () => {
    const covered = new Set(SECTIONS.map((s) => s.category));
    for (const category of READINESS_CATEGORY_ORDER) {
      expect(covered, category).toContain(category);
    }
  });

  it('every task and field points at a section that exists', () => {
    for (const task of TASKS) expect(sectionCodes, task.code).toContain(task.sectionCode);
    for (const field of FIELDS) expect(sectionCodes, field.code).toContain(field.sectionCode);
  });

  it('uses unique, stable machine codes throughout', () => {
    expect(TASK_BY_CODE.size).toBe(TASKS.length);
    expect(FIELD_BY_CODE.size).toBe(FIELDS.length);
    expect(new Set(SECTIONS.map((s) => s.code)).size).toBe(SECTIONS.length);
    expect(new Set(SECTIONS.map((s) => s.sortOrder)).size).toBe(SECTIONS.length);
  });

  it('gives every code a recognisable prefix and a numeric suffix', () => {
    // <PREFIX>-<NNN> for a task, <PREFIX>-F<NNN> for a field. The prefix is the section's
    // shorthand (KB, LEG, TEL …), so a code read aloud in a call still says where it lives.
    for (const task of TASKS) expect(task.code, task.code).toMatch(/^[A-Z]{2,4}-\d{3}$/);
    for (const field of FIELDS) expect(field.code, field.code).toMatch(/^[A-Z]{2,4}-F\d{3}$/);
  });

  it('only uses field types the editor can render', () => {
    const supported = ['text', 'textarea', 'number', 'boolean', 'select', 'date', 'url', 'phone'];
    for (const field of FIELDS) expect(supported, field.code).toContain(field.dataType);
  });
});

/* ───────────────────────────── go-live gates ────────────────────────────── */

describe('go-live gates', () => {
  const blockerCodes = new Set([
    ...TASKS.filter((t) => t.blocker).map((t) => t.code),
    ...FIELDS.filter((f) => f.blocker).map((f) => f.code),
  ]);

  it('gates the commercial and scope agreement', () => {
    expect(blockerCodes).toContain('COM-001'); // Vertrag unterzeichnet
    expect(blockerCodes).toContain('COM-002'); // Leistungsumfang freigegeben
  });

  it('gates the data protection agreement and the AI disclosure', () => {
    expect(blockerCodes).toContain('LEG-002'); // AVV unterzeichnet
    expect(blockerCodes).toContain('LEG-008'); // KI-Hinweis freigegeben
    expect(blockerCodes).toContain('LEG-009'); // KI-Hinweis implementiert
    expect(blockerCodes).toContain('LEG-F007'); // freigegebener Wortlaut
  });

  it('gates telephony failover — an unreachable assistant must never reach production', () => {
    expect(blockerCodes).toContain('TEL-011'); // Failover getestet
    expect(blockerCodes).toContain('TEL-F009'); // Failover-Ziel
    for (const code of ['TEL-006', 'TEL-007', 'TEL-008', 'TEL-009']) {
      expect(blockerCodes, code).toContain(code);
    }
  });

  it('gates every client approval category from the UAT phase', () => {
    const approvals = TASKS.filter((t) => t.sectionCode === 'uat' && t.title.startsWith('Freigabe:'));
    expect(approvals.length).toBe(8);
    for (const approval of approvals) expect(approval.blocker, approval.code).toBe(true);
  });

  it('gates identity, tenant isolation and the emergency path', () => {
    expect(blockerCodes).toContain('IDN-001'); // Identifikationsregeln
    expect(blockerCodes).toContain('IDN-002'); // Rufnummer ist kein Identitätsnachweis
    expect(blockerCodes).toContain('BCK-001'); // Mandant isoliert
    expect(blockerCodes).toContain('BCK-008'); // Idempotenz
    expect(blockerCodes).toContain('TST-042'); // Notfall
    expect(blockerCodes).toContain('WFL-F004'); // Notfallprozedur
  });

  it('gates the integration classification and the rollback plan', () => {
    expect(blockerCodes).toContain('INT-001');
    expect(blockerCodes).toContain('INT-005'); // Einschränkungen dokumentiert
    expect(blockerCodes).toContain('GOL-001'); // Rollback
    expect(blockerCodes).toContain('GOL-F002'); // Produktive Zugangsdaten (Status)
  });

  it('gates the agent and knowledge-base identifiers', () => {
    expect(blockerCodes).toContain('AGT-F004'); // ElevenLabs Agent-ID
    expect(blockerCodes).toContain('KB-F002'); // Knowledge-Base-ID
    expect(blockerCodes).toContain('KB-005'); // keine dynamischen Daten als statische Fakten
  });

  it('never marks an optional item as a go-live blocker', () => {
    for (const task of TASKS) {
      if (task.blocker) expect(task.required, task.code).toBe(true);
    }
    for (const field of FIELDS) {
      if (field.blocker) expect(field.required, field.code).toBe(true);
    }
  });
});

/* ───────────────────────────── healthcare applicability ─────────────────── */

describe('healthcare applicability', () => {
  it('marks the health-data obligations healthcare-only rather than applying them to everyone', () => {
    for (const code of ['LEG-005', 'LEG-006', 'PRV-001', 'PRV-002']) {
      expect(TASK_BY_CODE.get(code)?.healthcareOnly, code).toBe(true);
    }
    for (const code of ['LEG-F009', 'LEG-F010', 'SFW-F001', 'PRV-F002']) {
      expect(FIELD_BY_CODE.get(code)?.healthcareOnly, code).toBe(true);
    }
  });

  it('never hard-codes that a DSFA is required — the assessment RESULT is a field', () => {
    const dpia = FIELD_BY_CODE.get('LEG-F003');
    expect(dpia?.dataType).toBe('select');
    expect(SQL).toContain('"value":"not_required"');
    expect(SQL).toContain('"value":"pending"');
    // The assessment task applies to every client; only its outcome varies.
    expect(TASK_BY_CODE.get('LEG-010')?.healthcareOnly).toBe(false);
  });

  it('keeps the call-recording decision explicit instead of silently defaulting', () => {
    const recording = FIELD_BY_CODE.get('LEG-F005');
    expect(recording?.dataType).toBe('boolean');
    expect(recording?.required).toBe(true);
    // The default-off intent is written down, and a reasoned decision is compulsory.
    expect(SQL).toContain('die bewusste Voreinstellung AUS');
    expect(FIELD_BY_CODE.get('LEG-F006')?.required).toBe(true);
    expect(TASK_BY_CODE.get('LEG-007')?.blocker).toBe(true);
  });

  it('leaves the general-business path free of healthcare gates', () => {
    const generalBlockers = TASKS.filter((t) => t.blocker && !t.healthcareOnly);
    expect(generalBlockers.length).toBeGreaterThan(40);
  });
});

/* ───────────────────────────── readiness fairness ───────────────────────── */

describe('readiness fairness', () => {
  it('makes post-launch monitoring and maintenance optional, so they never depress pre-launch readiness', () => {
    const post = TASKS.filter((t) => t.sectionCode === 'monitoring' || t.sectionCode === 'maintenance');
    expect(post.length).toBeGreaterThan(15);
    for (const task of post) {
      expect(task.required, task.code).toBe(false);
      expect(task.blocker, task.code).toBe(false);
    }
  });

  it('leaves every performance metric optional until it has actually been measured', () => {
    const metrics = FIELDS.filter((f) => f.sectionCode === 'performance');
    expect(metrics.length).toBe(11);
    for (const metric of metrics) {
      expect(metric.required, metric.code).toBe(false);
      expect(metric.dataType, metric.code).toBe('number');
    }
    for (const task of TASKS.filter((t) => t.sectionCode === 'performance')) {
      expect(task.required, task.code).toBe(false);
    }
  });

  it('seeds no value for any field — nothing is pre-filled with an invented answer', () => {
    expect(SQL).not.toMatch(/insert into public\.owner_engagement_fields/);
    expect(SQL).not.toMatch(/value_text|value_number|value_bool|value_date/);
  });
});

/* ───────────────────────────── test suite coverage ──────────────────────── */

describe('test suite coverage', () => {
  const tests = TASKS.filter((t) => t.sectionCode === 'testing');

  it('carries the full reusable call-test checklist', () => {
    expect(tests.length).toBeGreaterThanOrEqual(45);
  });

  it('covers identity and security abuse cases, and gates all of them', () => {
    const security = ['TST-016', 'TST-017', 'TST-018', 'TST-019', 'TST-020', 'TST-021', 'TST-022', 'TST-023', 'TST-024'];
    for (const code of security) {
      expect(TASK_BY_CODE.get(code)?.blocker, code).toBe(true);
    }
  });

  it('covers German speech-recognition quality and caller-safety behaviour', () => {
    const titles = tests.map((t) => t.title).join(' | ');
    for (const topic of ['Nachnamen', 'Geburtsdaten', 'Akzent', 'Hintergrundgeräusche', 'Notfall', 'Prompt Injection']) {
      expect(titles, topic).toContain(topic);
    }
  });
});

/* ───────────────────────────── safety ───────────────────────────────────── */

describe('migration safety', () => {
  it('creates no customer and references no customer id', () => {
    expect(SQL).not.toMatch(/insert into public\.owner_customers/i);
    expect(SQL).not.toMatch(/insert into public\.owner_customer_services/i);
    expect(SQL).not.toMatch(/insert into public\.owner_service_engagements/i);
    // No hard-coded production UUIDs.
    expect(SQL).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it('contains no real customer or personal data', () => {
    for (const forbidden of ['Thomas', 'Heinersreuth', 'Pankofer']) {
      expect(SQL.toLowerCase(), forbidden).not.toContain(forbidden.toLowerCase());
    }
  });

  it('stores no secret, only a credential status vocabulary', () => {
    expect(SQL).toContain('Nur der STATUS wird gespeichert');
    expect(SQL).not.toMatch(/\b(sk_live|api[_-]?key\s*[:=]|bearer\s+[A-Za-z0-9])/i);
  });
});
