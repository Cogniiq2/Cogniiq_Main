// Static privilege guards for the upstream gateway database role.
//
// The D2c spike established, by measurement, that `default_transaction_read_only = on` is an
// overridable default rather than a write barrier: with a mis-applied DML grant and a permissive RLS
// write policy, three separate client-side paths wrote real rows. The read-only property therefore
// rests on exactly two things —
//
//   1. the gateway role holding no write privilege, and
//   2. RLS carrying no policy that permits it to write.
//
// Both are properties of SQL text that a future migration could silently change. These guards read
// that text and fail the build if either is violated. They contact no database: a check that needed a
// live connection could not run in CI, and a guard that does not run is not a guard.
//
// This is a *design-time* control. It proves nothing about a deployed system, and it is not a
// substitute for reviewing the migration that eventually creates the role.

/** Role names treated as the gateway role wherever they appear. */
export const KNOWN_GATEWAY_ROLE_NAMES = [
  'cogniiq_readonly',
  'cq_readonly_spike',
] as const;

/**
 * Names that *look* like a read-only gateway role even if nobody added them to the list above.
 *
 * The D3 role does not exist yet and its final name is not settled. Matching by shape as well as by
 * name means the guard covers the role whatever it ends up being called, which is the failure mode
 * worth defending against — a new migration introducing a differently named role that nobody
 * remembered to add here.
 */
const GATEWAY_ROLE_PATTERN = /^(?:[a-z0-9_]*(?:readonly|read_only|gateway)[a-z0-9_]*)$/i;

export function isGatewayRoleName(name: string): boolean {
  const normalized = name.replace(/^"|"$/g, '').toLowerCase();
  if ((KNOWN_GATEWAY_ROLE_NAMES as readonly string[]).includes(normalized)) return true;
  return GATEWAY_ROLE_PATTERN.test(normalized);
}

export type GatewayGuardFindingKind =
  | 'dml_grant'
  | 'sequence_grant'
  | 'execute_grant'
  | 'all_privileges_grant'
  | 'default_privileges_grant'
  | 'dangerous_role_attribute'
  | 'read_only_disabled'
  | 'permissive_write_policy';

export interface GatewayGuardFinding {
  kind: GatewayGuardFindingKind;
  role: string;
  /** 1-based line number in the scanned text. */
  line: number;
  /** The offending statement, normalised to one line. Never truncated to hide it. */
  statement: string;
}

/**
 * Strip SQL comments before scanning.
 *
 * A migration that *documents* the rule ("-- never GRANT INSERT to this role") must not trip the rule
 * it is documenting. Only executable text is scanned.
 */
export function stripSqlComments(sql: string): string {
  // Block comments first, then line comments; both are replaced by a newline-preserving blank so
  // line numbers stay meaningful.
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/--[^\n]*/g, (match) => match.replace(/[^\n]/g, ' '));
}

/** Split into statements while remembering where each one started. */
function statements(sql: string): Array<{ text: string; line: number }> {
  const out: Array<{ text: string; line: number }> = [];
  let current = '';
  let startLine = 1;
  let line = 1;
  for (const character of sql) {
    if (character === '\n') line += 1;
    if (character === ';') {
      if (current.trim()) out.push({ text: current.trim(), line: startLine });
      current = '';
      startLine = line;
      continue;
    }
    if (!current.trim() && character.trim()) startLine = line;
    current += character;
  }
  if (current.trim()) out.push({ text: current.trim(), line: startLine });
  return out;
}

function normalise(statement: string): string {
  return statement.replace(/\s+/g, ' ').trim();
}

/** Every role named after a `TO` clause. */
function rolesInToClause(statement: string): string[] {
  const match = /\bto\s+([^;]+)$/i.exec(statement);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
}

const WRITE_PRIVILEGES = /\b(insert|update|delete|truncate|references|trigger)\b/i;

/**
 * Audit SQL text for privileges or policies that would let the gateway role write.
 *
 * Returns every finding rather than the first, so one review pass sees the whole problem.
 */
export function auditGatewayRoleSql(sql: string): GatewayGuardFinding[] {
  const findings: GatewayGuardFinding[] = [];
  const scanned = stripSqlComments(sql);

  for (const { text, line } of statements(scanned)) {
    const statement = normalise(text);

    // ── GRANT … TO <gateway role> ────────────────────────────────────────────
    if (/^grant\b/i.test(statement)) {
      const roles = rolesInToClause(statement).filter(isGatewayRoleName);
      if (roles.length > 0) {
        const privileges = statement.slice(0, statement.toLowerCase().indexOf(' to '));
        for (const role of roles) {
          if (/\ball\s+privileges\b/i.test(privileges) || /^grant\s+all\b/i.test(privileges)) {
            findings.push({ kind: 'all_privileges_grant', role, line, statement });
          } else if (/\bon\s+sequence\b/i.test(statement) || /\ball\s+sequences\b/i.test(statement)) {
            findings.push({ kind: 'sequence_grant', role, line, statement });
          } else if (WRITE_PRIVILEGES.test(privileges)) {
            findings.push({ kind: 'dml_grant', role, line, statement });
          } else if (/\bexecute\b/i.test(privileges)) {
            findings.push({ kind: 'execute_grant', role, line, statement });
          }
        }
      }
    }

    // ── ALTER DEFAULT PRIVILEGES … GRANT … TO <gateway role> ─────────────────
    if (/^alter\s+default\s+privileges\b/i.test(statement)) {
      for (const role of rolesInToClause(statement).filter(isGatewayRoleName)) {
        findings.push({ kind: 'default_privileges_grant', role, line, statement });
      }
    }

    // ── Role attributes that would defeat the model outright ─────────────────
    const roleStatement = /^(?:create|alter)\s+role\s+("?[a-z0-9_]+"?)/i.exec(statement);
    if (roleStatement && isGatewayRoleName(roleStatement[1])) {
      const role = roleStatement[1];
      if (/\b(?<!no)(superuser|bypassrls|createrole|createdb|replication)\b/i.test(statement)) {
        findings.push({ kind: 'dangerous_role_attribute', role, line, statement });
      }
      if (/default_transaction_read_only\s*=?\s*(off|false)/i.test(statement)) {
        findings.push({ kind: 'read_only_disabled', role, line, statement });
      }
    }

    // ── CREATE POLICY … FOR INSERT|UPDATE|DELETE|ALL … TO <gateway role> ─────
    if (/^create\s+policy\b/i.test(statement)) {
      const forClause = /\bfor\s+(all|insert|update|delete|select)\b/i.exec(statement);
      const action = (forClause?.[1] ?? 'all').toLowerCase();
      const policyRoles = /\bto\s+([a-z0-9_",\s]+?)\s+(?:using|with\s+check)\b/i.exec(statement);
      const roles = policyRoles
        ? policyRoles[1].split(',').map((entry) => entry.trim()).filter(Boolean)
        : [];
      if (action !== 'select' && roles.some(isGatewayRoleName)) {
        for (const role of roles.filter(isGatewayRoleName)) {
          findings.push({ kind: 'permissive_write_policy', role, line, statement });
        }
      }
    }
  }

  return findings;
}

/**
 * The constraints the owner accepted at the close of D2, held in one place so the contract document
 * and the code cannot drift apart. The accompanying test asserts the document still states them.
 */
export const D3_ACCEPTANCE_CONSTRAINTS = {
  /** Above peak concurrency, per the D2c criterion-6 measurement. */
  connectionLimit: 24,
  /** Server connections Supavisor may open for the role. */
  supavisorPoolSize: 4,
  /** Server-enforced, cancels the statement rather than the client abandoning it. */
  statementTimeout: '2s',
  /** Transaction mode. */
  supavisorPort: 6543,
  /** Prepared statements are unavailable in transaction mode. */
  preparedStatements: false,
  /**
   * The module-scoped client stalled under 20 concurrent invocations in the spike; the per-request
   * client did not. D3 starts with the pattern that was measured to work.
   */
  clientPattern: 'per-request',
  /** Ed25519 verified in Deno 2.9.5 and in the local edge runtime. No HMAC fallback. */
  signatureAlgorithm: 'Ed25519',
} as const;
