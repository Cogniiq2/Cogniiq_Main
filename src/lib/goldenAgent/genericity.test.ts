// Golden Agent — the core stays generic.
//
// The whole business case is "customer #2 is a configuration, not a fork". That claim decays
// silently: someone adds `if (config.clientId === '…')` to fix one customer's edge case and the
// platform quietly becomes a set of bespoke agents again. These tests make that decay loud.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  TOOL_NAMES, buildKnowledgeDocuments, composeGoldenAgentPrompt, createDefaultClientConfig,
  emptyProvisionedState, generateCustomerScenarios, haemaLeipzigDevConfig, planGoldenAgent,
  testClinicConfig, validateClientConfig, toolResourceName, agentDisplayName, knowledgeResourceName,
} from './index.ts';
import type { ClientConfig } from './index.ts';

const CORE_ROOT = join(process.cwd(), 'src/lib/goldenAgent');
/** Directories whose whole purpose is to hold customer facts or to exercise them. */
const NOT_CORE = new Set(['examples']);

function coreSourceFiles(directory = CORE_ROOT): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return NOT_CORE.has(entry) ? [] : coreSourceFiles(path);
    if (!entry.endsWith('.ts') || entry.endsWith('.test.ts') || entry === 'testFakes.ts') return [];
    return [path];
  });
}

const PLAN_TARGET = { endpointUrl: 'https://x.supabase.co/functions/v1/receptionist-tools', authorization: { secret_id: 'sec_1' } };

/** A third customer, invented here and nowhere else: nothing in the core may know about it. */
function nordseeApothekeConfig(): ClientConfig {
  const base = createDefaultClientConfig({ clientId: '00000000-0000-4000-8000-0000000000aa', companyName: 'Nordsee-Apotheke Husum', timezone: 'Europe/Berlin' });
  const hours = { mon: [{ open: '08:00', close: '18:30' }], tue: [{ open: '08:00', close: '18:30' }], wed: [{ open: '08:00', close: '13:00' }], thu: [{ open: '08:00', close: '18:30' }], fri: [{ open: '08:00', close: '18:30' }], sat: [{ open: '09:00', close: '13:00' }] };
  return {
    ...base,
    spokenName: 'die Nordsee-Apotheke',
    industry: 'Apotheke',
    stage: 'dev',
    locations: [{ id: 'husum', name: 'Husum Zentrum', address: { street: 'Großstraße 12', postalCode: '25813', city: 'Husum' }, hours }],
    services: [
      { id: 'impfberatung', name: 'Impfberatung', description: 'Beratung zu Reise- und Grippeimpfungen', durationMinutes: 20, bookable: true },
      { id: 'blutdruckmessung', name: 'Blutdruckmessung', description: 'Kostenlose Messung ohne Termin', durationMinutes: 10, bookable: false },
    ],
    faqs: [{ id: 'notdienst', question: 'Haben Sie Notdienst?', answer: 'Den aktuellen Notdienstplan finden Sie an unserer Tür und unter der bundesweiten Notdienstnummer.' }],
    escalationContacts: [{ id: 'leitung', label: 'der Apothekenleitung', when: 'Rezeptfragen und Beschwerden', phone: '+4948412345' }],
  };
}

describe('the generic core knows no customer', () => {
  it('mentions no customer name anywhere outside the examples directory', () => {
    // Every customer-identifying token that exists in this repository's example configs.
    const forbidden = [/haema/i, /plasmaspende/i, /leipzig/i, /nordsee-apotheke/i, /husum/i];
    const offenders: string[] = [];
    for (const file of coreSourceFiles()) {
      // Re-exporting an example config from the barrel is the point of the barrel; the ban is on
      // customer facts and customer branching living in core LOGIC.
      const source = readFileSync(file, 'utf8').split('\n').filter((line) => !/from '\.\/examples\//.test(line)).join('\n');
      for (const pattern of forbidden) {
        if (pattern.test(source)) offenders.push(`${file.replace(CORE_ROOT, '')} matches ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('branches on no client id anywhere in the core', () => {
    // A clientId comparison is how per-customer behaviour sneaks in. Reading the id (for names,
    // tenancy, ownership checks) is fine; comparing it to a literal is not.
    const offenders: string[] = [];
    for (const file of coreSourceFiles()) {
      const source = readFileSync(file, 'utf8');
      // `clientId === '…'` / `clientId !== "…"` / switch on a literal id.
      // `typeof x !== 'string'` is a type guard, not a per-customer branch, so comparisons against
      // a typeof name are allowed; comparisons against any other literal are not.
      const idComparison = /\b(clientId|organizationId)\s*[!=]==?\s*['"`]([^'"`]*)['"`]/g;
      for (const match of source.matchAll(idComparison)) {
        if (['string', 'number', 'boolean', 'object', 'undefined', 'function', 'symbol', 'bigint'].includes(match[2])) continue;
        offenders.push(`${file.replace(CORE_ROOT, '')}: ${match[1]} compared to the literal "${match[2]}"`);
      }
      // A bare uuid literal in the core is almost always a customer id.
      const uuids = source.match(/['"`][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"`]/gi) ?? [];
      if (uuids.length > 0) offenders.push(`${file.replace(CORE_ROOT, '')}: hardcoded uuid ${uuids[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('holds no credential-shaped literal', () => {
    const offenders: string[] = [];
    for (const file of coreSourceFiles()) {
      const source = readFileSync(file, 'utf8');
      // A real ElevenLabs key, a Supabase service key or one of our own tool tokens.
      if (/\bsk_[A-Za-z0-9]{16,}/.test(source)) offenders.push(`${file.replace(CORE_ROOT, '')}: looks like an API key`);
      if (/\bey[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(source)) offenders.push(`${file.replace(CORE_ROOT, '')}: looks like a JWT`);
      if (/\bcqr_[0-9a-f]{32,}/.test(source)) offenders.push(`${file.replace(CORE_ROOT, '')}: looks like a tool token`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('a new customer is onboarded by configuration alone', () => {
  const config = nordseeApothekeConfig();

  it('validates, composes a prompt, generates knowledge, scenarios and a full plan', () => {
    const validation = validateClientConfig(config);
    expect(validation.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(validation.config).not.toBeNull();

    const prompt = composeGoldenAgentPrompt(config);
    expect(prompt.systemPrompt).toContain('Nordsee-Apotheke Husum');
    expect(prompt.systemPrompt).toContain('Impfberatung');
    // No trace of another customer leaked in through the universal rules.
    expect(prompt.systemPrompt).not.toMatch(/haema|plasmaspende|praxis musterstadt/i);

    expect(buildKnowledgeDocuments(config).length).toBeGreaterThan(0);
    expect(generateCustomerScenarios(config).length).toBeGreaterThan(0);

    const plan = planGoldenAgent({ config, state: emptyProvisionedState(), toolTarget: PLAN_TARGET, stage: 'dev' });
    expect(plan.steps.filter((s) => s.kind === 'create_tool')).toHaveLength(TOOL_NAMES.length);
    expect(plan.steps.some((s) => s.kind === 'create_agent')).toBe(true);
    expect(plan.agentName).toBe('Cogniiq · Nordsee-Apotheke Husum · DEV');
  });

  it('produces resource names that cannot collide with another customer or stage', () => {
    const other = testClinicConfig({ stage: 'dev' });
    for (const tool of TOOL_NAMES) {
      expect(toolResourceName(config, tool)).not.toBe(toolResourceName(other, tool));
      // The LLM-visible prefix is still the universal name.
      expect(toolResourceName(config, tool).startsWith(tool)).toBe(true);
      expect(toolResourceName(config, tool).length).toBeLessThanOrEqual(64);
    }
    expect(agentDisplayName(config, 'dev')).not.toBe(agentDisplayName(config, 'staging'));
    expect(knowledgeResourceName(config, 'dev', 'X')).not.toBe(knowledgeResourceName(config, 'staging', 'X'));
    expect(knowledgeResourceName(config, 'dev', 'X')).not.toBe(knowledgeResourceName(other, 'dev', 'X'));
  });
});

describe('configuration in, deterministic output', () => {
  const configs: Array<[string, ClientConfig]> = [
    ['test clinic', testClinicConfig({ stage: 'dev' })],
    ['haema DEV example', haemaLeipzigDevConfig()],
    ['nordsee apotheke', nordseeApothekeConfig()],
  ];

  it.each(configs)('%s: the same config always composes the same prompt and plan', (_name, config) => {
    const first = composeGoldenAgentPrompt(config);
    const second = composeGoldenAgentPrompt(config);
    expect(second.systemPrompt).toBe(first.systemPrompt);
    expect(second.firstMessage).toBe(first.firstMessage);
    expect(second.version).toBe(first.version);
    expect(second.length).toBe(first.length);

    const planOnce = planGoldenAgent({ config, state: emptyProvisionedState(), toolTarget: PLAN_TARGET, stage: 'dev' });
    const planTwice = planGoldenAgent({ config, state: emptyProvisionedState(), toolTarget: PLAN_TARGET, stage: 'dev' });
    expect(JSON.stringify(planTwice.steps)).toBe(JSON.stringify(planOnce.steps));
    expect(JSON.stringify(buildKnowledgeDocuments(config))).toBe(JSON.stringify(buildKnowledgeDocuments(config)));
    expect(generateCustomerScenarios(config).map((s) => s.id)).toEqual(generateCustomerScenarios(config).map((s) => s.id));
  });

  it('the Haema DEV example is a valid config that stays on the mock provider', () => {
    const config = haemaLeipzigDevConfig();
    const validation = validateClientConfig(config);
    expect(validation.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(config.stage).toBe('dev');
    expect(config.bookingIntegration.provider).toBe('mock');

    // A DEV config on the mock is deliberately NOT valid for live: the validator is the gate.
    const asLive = validateClientConfig({ ...config, stage: 'live' });
    expect(asLive.config).toBeNull();

    // And the plan says so out loud rather than leaving the operator to notice.
    const plan = planGoldenAgent({ config, state: emptyProvisionedState(), toolTarget: PLAN_TARGET, stage: 'dev' });
    expect(plan.warnings).toContain('Booking provider is the in-memory mock: bookings are not real.');
  });
});
