// ─────────────────────────────────────────────────────────────────────────────
// Private Bar deployment configuration — CLIENT SIDE ONLY.
//
// This module reads Vite build-time environment variables and must therefore
// never be imported by anything under functions/ (the Pages Functions bundle
// has no `import.meta.env`). ./catalog.ts and ./pricing.ts stay framework-free
// precisely so they can be shared with the server; this file cannot be.
//
// ── PAYMENT ENABLEMENT ──────────────────────────────────────────────────────
// Whether checkout is exposed is a DEPLOYMENT decision, not a source-code edit.
//
//   VITE_PRIVATE_BAR_CHECKOUT_ENABLED   "true" exposes the payment controls.
//                                       Non-secret build flag, set per
//                                       Cloudflare Pages environment. Absent or
//                                       anything other than "true" => disabled.
//
// This flag governs the UI only, and is NOT a security boundary. The server
// fails closed independently: functions/api/private-bar/* return
// 503 `not_configured` unless every server-side variable below is present, so
// even a wrongly enabled frontend cannot produce a checkout.
//
//   N8N_PRIVATE_BAR_CHECKOUT_URL   n8n webhook that creates a checkout session
//   N8N_PRIVATE_BAR_STATUS_URL     n8n webhook that reports order status
//   PRIVATE_BAR_SHARED_SECRET      HMAC-SHA256 key for Function -> n8n requests
//
// Those three are Cloudflare Pages **secrets**. They are never prefixed VITE_,
// never read here, and can never reach the client bundle.
// ─────────────────────────────────────────────────────────────────────────────

/** True only for the exact string "true". Any other value keeps checkout hidden. */
export const CHECKOUT_UI_ENABLED: boolean =
  import.meta.env.VITE_PRIVATE_BAR_CHECKOUT_ENABLED === 'true';

/**
 * The apartment this deployment serves. Centralised so a second apartment is a
 * data change, not a rebuild. The value is echoed to the server, which accepts
 * it only if it is in its own allowlist.
 */
export const APARTMENT = {
  id: 'bolagio-apartment-1',
  /** Not rendered anywhere yet — the guest-facing name is still to be confirmed. */
  displayName: null as string | null,
} as const;
