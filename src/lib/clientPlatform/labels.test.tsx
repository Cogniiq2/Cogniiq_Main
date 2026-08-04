import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// `adminUi` re-exports through the dashboard barrel, which reaches the Supabase client at
// import time; that module throws without VITE_* env vars. Same stub the routing tests use.
// Nothing in this file talks to Supabase — only the import graph does.
vi.mock('@/lib/supabase', () => ({ supabase: {} }));

import {
  clientLifecycleStatusLabel,
  clientLifecycleStatusLabels,
  engagementStatusLabels,
  invitationStatusLabel,
  invitationStatusLabels,
  organizationSolutionStatusLabels,
  rawCrmEnumValues,
  solutionCatalogKeyLabel,
  solutionCatalogKeyLabels,
} from './labels';
import {
  clientLifecycleStatuses,
  engagementStatuses,
  invitationStatuses,
  organizationSolutionStatuses,
  solutionCatalogKeys,
} from './types';
import { Pill, lifecycleTone, invitationTone, solutionTone } from '@/pages/admin/clients/adminUi';

// FALSIFICATION TEST — raw CRM enum values must never reach rendered UI.
//
// `lead`, `pending` and `active` were being printed straight into status pills. The stored
// values themselves are the database contract and are unchanged; what this test pins down
// is that the *rendered* text is always the German label.
//
// Reverting any call site to `label={row.account.lifecycle_status}` fails the render
// assertions below; adding a new enum member without a German label fails the coverage
// assertions.

const ROOT = resolve(__dirname, '../../..');

describe('CRM label coverage', () => {
  it('every lifecycle status has a German label', () => {
    for (const status of clientLifecycleStatuses) {
      expect(clientLifecycleStatusLabels[status], `missing label for "${status}"`).toBeTruthy();
      expect(clientLifecycleStatusLabels[status]).not.toBe(status);
    }
  });

  it('every engagement, invitation, solution status and catalog key has a German label', () => {
    for (const status of engagementStatuses) expect(engagementStatusLabels[status]).not.toBe(status);
    for (const status of invitationStatuses) expect(invitationStatusLabels[status]).not.toBe(status);
    for (const status of organizationSolutionStatuses) expect(organizationSolutionStatusLabels[status]).not.toBe(status);
    for (const key of solutionCatalogKeys) expect(solutionCatalogKeyLabels[key]).not.toBe(key);
  });

  it('no label is merely the enum value with underscores swapped for spaces', () => {
    // `catalog_key.replace(/_/g, ' ')` was the previous "humanisation" and produced
    // "ai receptionist". A label that survives this check is a real translation.
    for (const key of solutionCatalogKeys) {
      expect(solutionCatalogKeyLabels[key].toLowerCase()).not.toBe(key.replace(/_/g, ' '));
    }
  });

  it('an unknown value renders as an em dash rather than as itself', () => {
    expect(clientLifecycleStatusLabel('some_future_status')).toBe('—');
    expect(invitationStatusLabel(null)).toBe('—');
    expect(solutionCatalogKeyLabel(undefined)).toBe('—');
  });
});

describe('rendered CRM status pills contain no raw enum text', () => {
  it.each(clientLifecycleStatuses)('lifecycle "%s" renders its German label', (status) => {
    render(<Pill label={clientLifecycleStatusLabel(status)} tone={lifecycleTone[status]} />);
    expect(screen.getByText(clientLifecycleStatusLabels[status])).toBeInTheDocument();
    expect(screen.queryByText(status)).toBeNull();
  });

  it.each(invitationStatuses)('invitation "%s" renders its German label', (status) => {
    render(<Pill label={invitationStatusLabel(status)} tone={invitationTone[status]} />);
    expect(screen.getByText(invitationStatusLabels[status])).toBeInTheDocument();
    expect(screen.queryByText(status)).toBeNull();
  });

  it.each(organizationSolutionStatuses)('solution status "%s" never renders raw', (status) => {
    render(<Pill label={solutionCatalogKeyLabel('ai_receptionist')} tone={solutionTone[status]} />);
    expect(screen.queryByText(status)).toBeNull();
  });
});

describe('CRM source files do not print enum values directly', () => {
  // A static sweep, because a rendering test can only cover the states the fixture happens
  // to hit. These are the exact expression shapes that leaked before.
  const CRM_FILES = [
    'src/pages/admin/clients/ClientsListPage.tsx',
    'src/pages/admin/clients/ClientDetailPage.tsx',
    'src/pages/admin/clients/AdminSolutionsPage.tsx',
    'src/pages/admin/clients/AdminInvitationsPage.tsx',
    'src/pages/admin/clients/NewClientWizard.tsx',
  ];

  const FORBIDDEN: { pattern: RegExp; what: string }[] = [
    { pattern: /label=\{[A-Za-z0-9_.]*\.lifecycle_status\}/, what: 'raw lifecycle_status in a label' },
    { pattern: /label=\{[A-Za-z0-9_.]*\.organization_role\}/, what: 'raw organization_role in a label' },
    { pattern: /label=\{[A-Za-z0-9_]+\.status\}/, what: 'raw .status in a label' },
    { pattern: /label=\{eff\}/, what: 'raw effective invitation status in a label' },
    { pattern: /catalog_key\.replace\(/, what: 'underscore-stripping instead of a translation' },
    { pattern: /\{\s*value:\s*s,\s*label:\s*s\s*\}/, what: 'select option labelled with its own enum value' },
  ];

  it.each(CRM_FILES)('%s', (file) => {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    const hits = FORBIDDEN.filter(({ pattern }) => pattern.test(source)).map(({ what }) => what);
    expect(hits, `${file}: ${hits.join('; ')}`).toEqual([]);
  });

  it('no CRM page renders a bare enum string literal as user-visible text', () => {
    // Catches `label: 'pending'` in a filter dropdown — the shape that survived the
    // component-level fixes because it never touched a status field.
    const offenders: string[] = [];
    for (const file of CRM_FILES) {
      const source = readFileSync(resolve(ROOT, file), 'utf8');
      for (const value of rawCrmEnumValues) {
        const asLabel = new RegExp(`label:\\s*['"]${value}['"]`);
        if (asLabel.test(source)) offenders.push(`${file}: label: '${value}'`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('stored enum values are untouched', () => {
  it('the label maps are keyed by the exact stored literals', () => {
    // The point of centralising presentation is that the wire format does not move. If a
    // key here ever diverges from the union in ./types, filters and payloads break silently.
    expect(Object.keys(clientLifecycleStatusLabels).sort()).toEqual([...clientLifecycleStatuses].sort());
    expect(Object.keys(invitationStatusLabels).sort()).toEqual([...invitationStatuses].sort());
    expect(Object.keys(engagementStatusLabels).sort()).toEqual([...engagementStatuses].sort());
    expect(Object.keys(organizationSolutionStatusLabels).sort()).toEqual([...organizationSolutionStatuses].sort());
    expect(Object.keys(solutionCatalogKeyLabels).sort()).toEqual([...solutionCatalogKeys].sort());
  });

  it('filter option VALUES remain the stored enum literals', () => {
    const source = readFileSync(resolve(ROOT, 'src/pages/admin/clients/ClientsListPage.tsx'), 'utf8');
    // The status filter compares against `lifecycle_status` directly, so its option values
    // must still be the raw enum even though its labels are German.
    expect(source).toContain('clientLifecycleStatuses.map((s) => ({ value: s, label: clientLifecycleStatusLabel(s) }))');
    expect(source).toContain("r.account?.lifecycle_status === statusFilter");
  });
});

// Guards the walk helper above against silently scanning nothing.
describe('sanity', () => {
  it('the CRM directory actually contains the files under test', () => {
    const dir = resolve(ROOT, 'src/pages/admin/clients');
    const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());
    expect(files.length).toBeGreaterThan(3);
    expect(relative(ROOT, dir)).toBe('src/pages/admin/clients');
  });
});
