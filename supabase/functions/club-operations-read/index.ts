// club-operations-read — the Cogniiq side of the Club Operations read gateway.
//
// SOURCE ONLY. NOT DEPLOYED by this task, and not deployable: the entitlement authorizer wired below
// is `denyAllAuthorizer`, so every caller is denied, and the rate limiter is `unconfiguredRateLimiter`
// because its thresholds are an unresolved owner decision. Both are deliberate — see the README.
//
// This file is a shell and must stay one. Cogniiq's test suite collects only `src/**/*.test.ts`, so
// anything implemented here is unreachable by a test; the behaviour lives in
// `src/lib/gateway/clubGatewayShell.ts` and is tested there. What belongs here is exactly what is
// left: reading the environment, building the dependencies, and one call.
//
// Environment (server-side only; never a VITE_* variable, and no value appears in this repository):
//   CLUB_OPS_GATEWAY_URL              origin of the upstream project — https only
//   CLUB_OPS_GATEWAY_KEY_ID           CQGW1 key id
//   CLUB_OPS_GATEWAY_SIGNING_KEY      Ed25519 private key, PKCS#8, base64url
//   CLUB_OPS_GATEWAY_ALLOWED_ORIGINS  comma-separated exact-match CORS allowlist
//   SUPABASE_URL, SUPABASE_ANON_KEY   runtime-provided; used only to verify the caller's own token
//
// There is no service-role key here: every check runs under the caller's own identity. There is no
// response-signing key and no response public key: responses are unsigned by owner decision, and
// what protects them is transport protection + application validation, not cryptographic
// end-to-end authenticity.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import {
  handleClubGatewayRequest,
  unconfiguredRateLimiter,
  type ClubGatewayShellDependencies,
} from '../../../src/lib/gateway/clubGatewayShell.ts';
import {
  createSupabaseCallerResolver,
  type CallerScopedClient,
} from '../../../src/lib/gateway/callerResolution.ts';
import { denyAllAuthorizer } from '../../../src/lib/gateway/entitlement.ts';
import {
  createClubGatewayTransport,
  importCqgw1SigningKey,
  type ClubGatewayTransport,
} from '../../../src/lib/gateway/clubGatewayTransport.ts';
import type { Cqgw1Operation } from '../../../src/lib/gateway/cqgw1.ts';
import {
  validateActivityPage,
  validateAlertPage,
  validateBookingPage,
  validateInvoicePage,
  validateMemberPage,
  validateMonthlyReportComparison,
  validateOverviewSnapshot,
  validatePaymentPage,
  validateReconciliationPage,
  validateReportSnapshot,
  validateSettingsSnapshot,
  validateVoucherPage,
} from '../../../src/solutions/club-operations/adapter/responseValidation.ts';

const GATEWAY_URL = Deno.env.get('CLUB_OPS_GATEWAY_URL') ?? '';
const GATEWAY_KEY_ID = Deno.env.get('CLUB_OPS_GATEWAY_KEY_ID') ?? '';
const GATEWAY_SIGNING_KEY = Deno.env.get('CLUB_OPS_GATEWAY_SIGNING_KEY') ?? '';
const ALLOWED_ORIGINS = (Deno.env.get('CLUB_OPS_GATEWAY_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin !== '');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

/** Step 10 of the response pipeline: the operation's own runtime validator, injected. */
const RESULT_VALIDATORS: Record<Cqgw1Operation, (value: unknown) => unknown> = {
  getOverview: validateOverviewSnapshot,
  listBookings: validateBookingPage,
  listPayments: validatePaymentPage,
  listInvoices: validateInvoicePage,
  listReconciliation: validateReconciliationPage,
  getMonthlyReport: validateMonthlyReportComparison,
  getReport: validateReportSnapshot,
  listVouchers: validateVoucherPage,
  listMembers: validateMemberPage,
  listActivity: validateActivityPage,
  listAlerts: validateAlertPage,
  getSettings: validateSettingsSnapshot,
};

/**
 * The only caller-resolution logic in this file: build a client scoped to the caller's own token.
 *
 * Every decision made with that client — validating the token through `auth.getUser()`, reading the
 * caller's own memberships under RLS, and failing closed on each abnormal outcome — lives in
 * `callerResolution.ts`, where the test suite can reach it. The publishable key is the only
 * credential in scope here; there is no service-role key in this function.
 */
const resolveCaller = createSupabaseCallerResolver(
  (authorization) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as unknown as CallerScopedClient,
);

let transport: ClubGatewayTransport | null = null;
if (GATEWAY_URL && GATEWAY_KEY_ID && GATEWAY_SIGNING_KEY && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    transport = createClubGatewayTransport({
      baseUrl: GATEWAY_URL,
      keyId: GATEWAY_KEY_ID,
      signingKey: await importCqgw1SigningKey(GATEWAY_SIGNING_KEY),
      validateResult: (operation, result) => RESULT_VALIDATORS[operation](result),
    });
  } catch {
    // A boundary that cannot sign correctly must not start signing incorrectly. The reason is not
    // logged: it would name a variable, and the reply must not.
    transport = null;
  }
}

const dependencies: ClubGatewayShellDependencies = {
  resolveCaller,
  // Deny-all until a separately reviewed, generic, database-backed authorizer exists (plan B1).
  authorize: denyAllAuthorizer,
  // Deny until the durable limiter's thresholds are an owner decision (plan B4).
  rateLimiter: unconfiguredRateLimiter,
  transport,
  allowedOrigins: ALLOWED_ORIGINS,
  // Reason codes and a correlation id only — never a payload, a header, a token or a URL.
  log: (record) => console.log(JSON.stringify(record)),
};

serve((request: Request) => handleClubGatewayRequest(request, dependencies));
