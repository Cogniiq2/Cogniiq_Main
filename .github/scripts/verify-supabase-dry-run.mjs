import { readFileSync } from 'node:fs';

const expectedMigration = '20260711120000_receptionist_persistence.sql';
const dryRunPath = process.argv[2] ?? 'supabase-dry-run.txt';

const output = readFileSync(dryRunPath, 'utf8');
const matches = [...output.matchAll(/\b\d{14}_[A-Za-z0-9_.-]+\.sql\b/g)].map((match) => match[0]);
const uniqueMatches = [...new Set(matches)];

if (uniqueMatches.length !== 1) {
  console.error(
    `Apply mode requires exactly one pending migration. Found ${uniqueMatches.length}: ${
      uniqueMatches.length ? uniqueMatches.join(', ') : 'none'
    }`
  );
  process.exit(1);
}

if (uniqueMatches[0] !== expectedMigration) {
  console.error(`Apply mode expected ${expectedMigration}, but dry run proposed ${uniqueMatches[0]}.`);
  process.exit(1);
}

console.log(`Dry run contains exactly one pending migration: ${expectedMigration}`);
