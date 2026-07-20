import { readFileSync } from 'node:fs';

const expectedMigration = '20260711120000_receptionist_persistence.sql';
const dryRunPath = process.argv[2] ?? 'supabase-dry-run.txt';

const output = readFileSync(dryRunPath, 'utf8');
const matches = [...output.matchAll(/\b\d{14}_[A-Za-z0-9_.-]+\.sql\b/g)].map((match) => match[0]);

if (matches.length !== 1) {
  console.error(
    `Apply mode requires exactly one pending migration filename in the dry-run output. Found ${matches.length}: ${
      matches.length ? matches.join(', ') : 'none'
    }`
  );
  process.exit(1);
}

if (matches[0] !== expectedMigration) {
  console.error(`Apply mode expected ${expectedMigration}, but dry run proposed ${matches[0]}.`);
  process.exit(1);
}

console.log(`Dry run contains exactly one pending migration: ${expectedMigration}`);
