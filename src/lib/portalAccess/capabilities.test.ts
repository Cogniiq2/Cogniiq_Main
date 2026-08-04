import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  BASELINE_CAPABILITIES,
  KNOWN_CAPABILITIES,
  SPORTS_CLUB_ROLE_PRESETS,
  SVH_CAPABILITIES,
  isKnownCapability,
} from './capabilities';

// The frontend vocabulary and the database catalog must not drift: a capability the UI gates on but
// the database never grants would silently deny, and one the database grants but the UI does not
// know would fail closed and look broken.
const MIGRATION = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260804120000_reusable_capability_authorization.sql'),
  'utf8'
);

describe('capability vocabulary', () => {
  it('matches the database catalog exactly', () => {
    const inMigration = new Set(
      [...MIGRATION.matchAll(/\('((?:portal|svh)\.[a-z_.]+)',\s+'/g)].map((match) => match[1])
    );
    expect([...inMigration].sort()).toEqual([...KNOWN_CAPABILITIES].sort());
  });

  it('is namespaced and globally unique', () => {
    expect(new Set(KNOWN_CAPABILITIES).size).toBe(KNOWN_CAPABILITIES.length);
    for (const key of KNOWN_CAPABILITIES) {
      expect(key).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    }
  });

  it('fails closed for an unknown key', () => {
    expect(isKnownCapability('portal.overview.view')).toBe(true);
    expect(isKnownCapability('portal.overview')).toBe(false);
    expect(isKnownCapability('svh.finance.destroy')).toBe(false);
    expect(isKnownCapability('')).toBe(false);
  });

  it('mirrors the database baseline, which is what preserves existing customer access', () => {
    const sqlBaseline = MIGRATION.split('portal_baseline_capability_keys()')[1]
      .split('$$')[1];
    for (const key of BASELINE_CAPABILITIES) {
      expect(sqlBaseline).toContain(`'${key}'`);
    }
    expect(BASELINE_CAPABILITIES).toHaveLength(6);
  });
});

describe('SVH role presets', () => {
  it('defines exactly the six required roles', () => {
    expect(SPORTS_CLUB_ROLE_PRESETS.map((preset) => preset.label)).toEqual([
      'Vorstand',
      'Mitgliederverwaltung',
      'Kassenwart',
      'Buchungsverwaltung',
      'Anlagenverwaltung',
      'Lesender Administrator',
    ]);
  });

  it('grants every preset the general portal baseline', () => {
    for (const preset of SPORTS_CLUB_ROLE_PRESETS) {
      for (const key of BASELINE_CAPABILITIES) {
        expect(preset.capabilities).toContain(key);
      }
    }
  });

  it('gives Vorstand the complete SVH capability set', () => {
    const vorstand = SPORTS_CLUB_ROLE_PRESETS[0];
    for (const key of SVH_CAPABILITIES) {
      expect(vorstand.capabilities).toContain(key);
    }
  });

  it('gives Lesender Administrator no manage capability at all', () => {
    const readOnly = SPORTS_CLUB_ROLE_PRESETS.find((p) => p.roleKey === 'lesender_administrator');
    expect(readOnly).toBeDefined();
    const managing = readOnly!.capabilities.filter(
      (key) => key.includes('.manage') || key.includes('_assign') || key.includes('_review')
    );
    expect(managing).toEqual([]);
  });

  it('keeps every preset scoped to capabilities that actually exist', () => {
    for (const preset of SPORTS_CLUB_ROLE_PRESETS) {
      for (const key of preset.capabilities) {
        expect(isKnownCapability(key)).toBe(true);
      }
      // Deduplicated: a preset must not list the same capability twice.
      expect(new Set(preset.capabilities).size).toBe(preset.capabilities.length);
    }
  });

  it('matches the role keys the migration fixture creates', () => {
    for (const preset of SPORTS_CLUB_ROLE_PRESETS) {
      expect(MIGRATION).toContain(`'${preset.roleKey}'`);
    }
  });

  it('separates duties: no non-Vorstand preset can both manage finance and manage members', () => {
    for (const preset of SPORTS_CLUB_ROLE_PRESETS.slice(1)) {
      const both =
        preset.capabilities.includes('svh.finance.manage') &&
        preset.capabilities.includes('svh.members.manage');
      expect(both).toBe(false);
    }
  });
});

describe('coarse organization role is untouched', () => {
  it('adds no SVH-specific value to the organization_role enum', () => {
    // The enum must stay owner/admin/member/viewer.
    expect(MIGRATION).not.toMatch(/alter type public\.organization_role/i);
    expect(MIGRATION).not.toMatch(/add value/i);
  });

  it('never rewrites organization_members.role', () => {
    expect(MIGRATION).not.toMatch(/update\s+public\.organization_members\s+set\s+role/i);
  });
});
