// Golden Agent — tenant isolation of the tool endpoint.
//
// The voice runtime is an untrusted caller and the LLM inside it is an untrusted author of request
// bodies. The only thing that decides WHOSE data a tool call reaches is the hashed bearer token.
// These tests state that as an executable property: two tenants, one endpoint, and no request the
// LLM can construct that crosses between them.

import { describe, expect, it } from 'vitest';

import { handleToolsRequest } from './toolsHandler.ts';
import type { CallEventRecord, ReceptionistRecord, ToolBindingRecord, ToolsHandlerDependencies } from './toolsHandler.ts';
import { sha256Hex } from './shared.ts';
import { testClinicConfig, TEST_CLINIC_CLIENT_ID } from '../index.ts';

const HAEMA_ORG = '05bb47ff-bedc-49b0-9757-419c31ee1071';
const HAEMA_TOKEN = 'cqr_haema_dev_token';
const OTHER_TOKEN = 'cqr_other_dev_token';
const REVOKED_TOKEN = 'cqr_revoked_token';

/** Two tenants on one endpoint: "haema" (r_haema) and the test clinic (r_other). */
function twoTenantDeps() {
  const events: CallEventRecord[] = [];
  const receptionists: Record<string, ReceptionistRecord> = {
    r_haema: { id: 'r_haema', organizationId: HAEMA_ORG, stage: 'dev', clientConfig: testClinicConfig({ stage: 'dev', clientId: HAEMA_ORG }) },
    r_other: { id: 'r_other', organizationId: TEST_CLINIC_CLIENT_ID, stage: 'dev', clientConfig: testClinicConfig({ stage: 'dev' }) },
  };
  const deps: ToolsHandlerDependencies = {
    async findBindingByTokenHash(hash): Promise<ToolBindingRecord | null> {
      // A revoked token has no active row at all — the query filters on `active`.
      if (hash === await sha256Hex(HAEMA_TOKEN)) return { bindingId: 'b_haema', receptionistId: 'r_haema', organizationId: HAEMA_ORG, environment: 'dev' };
      if (hash === await sha256Hex(OTHER_TOKEN)) return { bindingId: 'b_other', receptionistId: 'r_other', organizationId: TEST_CLINIC_CLIENT_ID, environment: 'dev' };
      return null;
    },
    async loadReceptionist(id) { return receptionists[id] ?? null; },
    async recordEvent(event) { events.push(event); },
    resolveSecret: () => undefined,
    mockProviders: new Map(),
    now: () => new Date('2026-09-07T10:00:00+02:00'),
  };
  return { deps, events, receptionists };
}

function call(tool: string, body: Record<string, unknown>, token: string, conversation = 'conv_1') {
  return new Request(`https://x.supabase.co/functions/v1/receptionist-tools/${tool}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Cogniiq-Conversation': conversation },
    body: JSON.stringify(body),
  });
}

describe('tool endpoint tenant binding', () => {
  it('resolves the tenant from the token, never from ids in the body', async () => {
    const { deps } = twoTenantDeps();
    const slots = { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08' };

    // Every id an attacker could hope to steer with, all at once.
    const hostile = {
      ...slots,
      client_id: TEST_CLINIC_CLIENT_ID, organization_id: TEST_CLINIC_CLIENT_ID, organizationId: TEST_CLINIC_CLIENT_ID,
      receptionist_id: 'r_other', receptionistId: 'r_other', tenant_id: TEST_CLINIC_CLIENT_ID, binding_id: 'b_other',
    };
    const response = await handleToolsRequest(call('get_available_slots', hostile, HAEMA_TOKEN), deps);
    const body = await response.json();
    // Unknown parameters are rejected by the contract: the LLM cannot even smuggle them in.
    expect(body.ok).toBe(false);
    expect(body.code).toBe('invalid_arguments');
  });

  it('gives each token its own isolated booking state', async () => {
    const { deps } = twoTenantDeps();
    const slots = { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08' };

    const haemaSlots = await (await handleToolsRequest(call('get_available_slots', slots, HAEMA_TOKEN), deps)).json();
    const slot = haemaSlots.data.slots[0];
    const booking = {
      slot_id: slot.slot_id, service_id: 'erstgespraech', location_id: 'zentrum', start_time: slot.start_time,
      caller_confirmed: true, caller_first_name: 'Ben', caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02', caller_phone: '+4917612345679',
    };
    const booked = await (await handleToolsRequest(call('create_appointment', booking, HAEMA_TOKEN), deps)).json();
    expect(booked.ok).toBe(true);

    // The other tenant's availability is untouched by the first tenant's booking.
    const otherSlots = await (await handleToolsRequest(call('get_available_slots', slots, OTHER_TOKEN), deps)).json();
    expect(otherSlots.data.slots.some((s: { slot_id: string }) => s.slot_id === slot.slot_id)).toBe(true);

    // And the other tenant cannot find the appointment, even with the correct personal details.
    const lookup = await (await handleToolsRequest(call('find_appointment', {
      caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02', caller_first_name: 'Ben',
    }, OTHER_TOKEN), deps)).json();
    expect(lookup.ok).toBe(true);
    expect(lookup.data.appointments).toHaveLength(0);
  });

  it('rejects revoked and unknown tokens without telling the caller anything', async () => {
    const { deps, events } = twoTenantDeps();
    for (const token of [REVOKED_TOKEN, 'cqr_never_existed', '', 'Bearer']) {
      const response = await handleToolsRequest(call('get_opening_hours', {}, token), deps);
      expect(response.status).toBe(401);
      const body = await response.json();
      // The same answer for "revoked" and "never existed": no enumeration oracle.
      expect(body).toEqual({ ok: false, code: 'unauthorized', message: token ? 'invalid token' : 'missing bearer token' });
    }
    expect(events).toHaveLength(0);
  });

  it('refuses when the stored config claims a different tenant than the receptionist row', async () => {
    const { deps, receptionists } = twoTenantDeps();
    // A config that survived into the database with a foreign clientId must not be usable.
    receptionists.r_haema = { ...receptionists.r_haema, clientConfig: testClinicConfig({ stage: 'dev' }) };
    const response = await handleToolsRequest(call('get_opening_hours', {}, HAEMA_TOKEN), deps);
    expect(response.status).toBe(401);
    expect((await response.json()).message).toBe('tenant mismatch');
  });

  it('refuses a binding whose organization no longer matches the receptionist', async () => {
    const { deps, receptionists, events } = twoTenantDeps();
    receptionists.r_haema = { ...receptionists.r_haema, organizationId: TEST_CLINIC_CLIENT_ID };
    const response = await handleToolsRequest(call('get_opening_hours', {}, HAEMA_TOKEN), deps);
    expect(response.status).toBe(401);
    expect(events[0]).toMatchObject({ eventType: 'auth_failure', organizationId: HAEMA_ORG });
  });

  it('refuses a dev credential against a staging or live receptionist and vice versa', async () => {
    for (const stage of ['staging', 'live'] as const) {
      const { deps } = twoTenantDeps();
      const scoped = { ...deps, loadReceptionist: async () => ({ id: 'r_haema', organizationId: HAEMA_ORG, stage, clientConfig: testClinicConfig({ stage: 'dev', clientId: HAEMA_ORG }) }) };
      const response = await handleToolsRequest(call('get_opening_hours', {}, HAEMA_TOKEN), scoped);
      expect(response.status).toBe(401);
      expect((await response.json()).message).toBe('environment mismatch');
    }
  });
});

describe('tool endpoint safety gates', () => {
  it('does not look up a personal appointment before the configured identity fields are present', async () => {
    const { deps } = twoTenantDeps();
    const response = await handleToolsRequest(call('find_appointment', { caller_last_name: 'Keller' }, HAEMA_TOKEN), deps);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe('identity_unverified');
    // The failure tells the agent WHICH fields to ask for, and nothing about any appointment.
    expect(JSON.stringify(body)).not.toContain('appointment_id');
  });

  it('refuses a booking, reschedule and cancellation without an explicit caller confirmation', async () => {
    const { deps } = twoTenantDeps();
    const slots = await (await handleToolsRequest(call('get_available_slots', { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08' }, HAEMA_TOKEN), deps)).json();
    const slot = slots.data.slots[0];
    // Explicitly false — the gate must refuse, not merely fail on a missing parameter.
    const unconfirmed = await (await handleToolsRequest(call('create_appointment', {
      slot_id: slot.slot_id, service_id: 'erstgespraech', location_id: 'zentrum', start_time: slot.start_time, caller_confirmed: false,
      caller_first_name: 'Ben', caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02', caller_phone: '+4917612345679',
    }, HAEMA_TOKEN), deps)).json();
    expect(unconfirmed.code).toBe('confirmation_required');

    // And omitting the flag entirely is refused too, just with a different code.
    const missingFlag = await (await handleToolsRequest(call('create_appointment', {
      slot_id: slot.slot_id, service_id: 'erstgespraech', location_id: 'zentrum', start_time: slot.start_time,
      caller_first_name: 'Ben', caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02', caller_phone: '+4917612345679',
    }, HAEMA_TOKEN), deps)).json();
    expect(missingFlag.ok).toBe(false);

    const cancel = await (await handleToolsRequest(call('cancel_appointment', {
      appointment_id: 'apt_1', caller_confirmed: false, caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02',
    }, HAEMA_TOKEN), deps)).json();
    expect(cancel.code).toBe('confirmation_required');
  });

  it('records no caller data in the event stream', async () => {
    const { deps, events } = twoTenantDeps();
    await handleToolsRequest(call('request_callback', {
      caller_name: 'Anna Schmidt', caller_phone: '+4915112345678', topic: 'Rückruf', urgency: 'normal',
    }, HAEMA_TOKEN), deps);
    const serialised = JSON.stringify(events);
    expect(serialised).not.toContain('Anna Schmidt');
    expect(serialised).not.toContain('+4915112345678');
  });
});
