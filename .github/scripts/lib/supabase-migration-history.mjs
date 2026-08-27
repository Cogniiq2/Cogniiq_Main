// Parser for `supabase migration list` output.
//
// This replaces the inline awk program the workflow used to carry. The semantics are ported
// exactly — including the leading-pipe column shift and digit normalisation — but as a
// dependency-free module it can be unit-tested against fixtures instead of only ever being
// exercised against production.
//
// The CLI prints a table whose exact borders vary by version:
//
//     Local          | Remote         | Time (UTC)
//     20260826120000 | 20260826120000 | 2026-08-26 12:00:00
//
// or, with borders:
//
//     | Local            | Remote           | Time (UTC)          |
//     |------------------|------------------|---------------------|
//     | 20260826120000   | 20260826120000   | 2026-08-26 12:00:00 |
//
// A row with a leading pipe has an empty field before it, so Local/Remote sit one column
// further right. Everything else is identical.

/** Keep only digits: strips backticks, spaces and table borders the CLI may add. */
export function normalizeMigrationVersion(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

/**
 * Parse the table into { local, remote } version pairs.
 *
 * Header and separator rows normalise to empty strings and are dropped, so callers never
 * have to special-case them. A line that is not a table row simply yields nothing.
 */
export function parseMigrationHistory(output) {
  const rows = [];

  for (const line of String(output ?? '').split(/\r?\n/)) {
    const fields = line.split('|');
    const leadingPipe = /^[ \t]*\|/.test(line);
    const local = normalizeMigrationVersion(leadingPipe ? fields[1] : fields[0]);
    const remote = normalizeMigrationVersion(leadingPipe ? fields[2] : fields[1]);

    // A 14-digit version is the only thing worth keeping; "Local"/"Remote"/"----" all
    // normalise to '' and a timestamp column never reaches these two positions.
    const keepLocal = /^\d{14}$/.test(local) ? local : '';
    const keepRemote = /^\d{14}$/.test(remote) ? remote : '';
    if (!keepLocal && !keepRemote) continue;

    rows.push({ local: keepLocal, remote: keepRemote });
  }

  return rows;
}

/** Versions the REMOTE database reports as applied. */
export function remoteVersions(output) {
  return new Set(parseMigrationHistory(output).map((r) => r.remote).filter(Boolean));
}

/** Versions present in the local migrations directory, as the CLI sees it. */
export function localVersions(output) {
  return new Set(parseMigrationHistory(output).map((r) => r.local).filter(Boolean));
}

/**
 * Is `target` applied remotely AND matched by an identically-numbered local file?
 *
 * `ok` requires BOTH columns to hold the same version. A remote-only row means the database
 * has something the branch does not; a local-only row means the push did not land. Neither
 * is success, and neither may be reported as success — that distinction is the whole point
 * of this check, because a server-generated substitute timestamp shows up exactly here.
 */
export function hasSyncedTarget(output, target) {
  const wanted = normalizeMigrationVersion(target);
  let foundLocal = false;
  let foundSynced = false;

  for (const row of parseMigrationHistory(output)) {
    if (row.local !== wanted) continue;
    foundLocal = true;
    if (row.remote === wanted) foundSynced = true;
  }

  return { foundLocal, foundSynced, ok: foundSynced };
}

/** Human-readable reason a target is not synced, for failure output. */
export function describeSyncFailure(output, target) {
  const wanted = normalizeMigrationVersion(target);
  const rows = parseMigrationHistory(output);
  const row = rows.find((r) => r.local === wanted);

  if (!row) {
    const remoteOnly = rows.find((r) => r.remote === wanted);
    return remoteOnly
      ? `Migration ${wanted} is applied remotely but has no matching Local row.`
      : `Migration ${wanted} was not found in the Local column.`;
  }
  return row.remote
    ? `Migration ${wanted} was found in the Local column, but the Remote column was ${row.remote}.`
    : `Migration ${wanted} was found in the Local column, but the Remote column was blank or missing.`;
}
