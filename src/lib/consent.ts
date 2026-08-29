// ─────────────────────────────────────────────────────────────────────────────
// Consent management — Google Consent Mode v2, BASIC implementation.
//
// Two INDEPENDENT purposes. Neither implies the other:
//   • marketing → Google Ads  (AW-…)  → ad_storage / ad_user_data / ad_personalization
//   • analytics → Google GA4  (G-…)   → analytics_storage
//
// Contract (enforced by .github/scripts/test-seo-consistency.mjs):
//   • BEFORE explicit consent: no gtag.js request, no Google request of any
//     kind, no advertising or analytics cookies, no cookieless pings. The
//     Google tag library is NEVER injected. This is Basic Consent Mode —
//     Advanced mode (which pings before consent) is deliberately NOT used.
//   • ON acceptance of a purpose: the gtag.js library is injected at most once
//     and ONLY the consented product is configured. Granting marketing never
//     configures GA4; granting analytics never configures Google Ads.
//   • Granting one purpose first and the other later works in either order:
//     the library is reused and the newly consented product is configured
//     exactly once (see `configuredProducts`).
//   • ON rejection: the Google tag library stays completely unloaded.
//   • ON later visits: the saved choice is restored before deciding to load.
//   • ON revoke: consent is updated to denied and the first-party cookies the
//     site can reach are removed for whichever purpose was withdrawn.
//
// URL passthrough is intentionally NOT enabled.
//
// Necessary site functionality never depends on either purpose.
// ─────────────────────────────────────────────────────────────────────────────

// Google Ads conversion tag id (was hard-coded in index.html before Phase 0).
const GOOGLE_ADS_ID = 'AW-17946397271';
// GA4 measurement id. Loaded ONLY under analytics consent — never in index.html.
const GA4_ID = 'G-K7BS3LKT6H';

const gtagSrc = (id: string) => `https://www.googletagmanager.com/gtag/js?id=${id}`;

export const CONSENT_STORAGE_KEY = 'cogniiq_consent_v2';
// v1 stored a single boolean that covered Google Ads ONLY. It is migrated for
// the marketing purpose; analytics consent is NEVER inferred from it, because
// the v1 banner never asked about analytics.
const LEGACY_STORAGE_KEY = 'cogniiq_consent_v1';
export const OPEN_CONSENT_EVENT = 'cogniiq:open-consent-settings';

export type ConsentStatus = 'granted' | 'denied';

export interface ConsentState {
  marketing: ConsentStatus;
  analytics: ConsentStatus;
}

export const DENIED_STATE: ConsentState = { marketing: 'denied', analytics: 'denied' };
export const GRANTED_STATE: ConsentState = { marketing: 'granted', analytics: 'granted' };

interface StoredConsent extends ConsentState {
  ts: number;
  version: 2;
}

type Listener = (state: ConsentState | null) => void;
const listeners = new Set<Listener>();
// Guards against injecting the gtag.js library more than once.
let tagLoaded = false;
// Guards against issuing gtag('config', …) twice for the same product.
const configuredProducts = new Set<string>();
let bootstrapped = false;
// Last state applied to gtag, so a purpose transition granted→denied can clean
// up the cookies for exactly that purpose.
let appliedState: ConsentState = DENIED_STATE;

// gtag helper. dataLayer.push queues commands; before the library loads these
// entries simply sit in the array and cause NO network request.
function gtag(...args: unknown[]) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

const isStatus = (v: unknown): v is ConsentStatus => v === 'granted' || v === 'denied';

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredConsent;
      if (parsed && isStatus(parsed.marketing) && isStatus(parsed.analytics)) return parsed;
    }
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null;
}

/**
 * A v1 record, migrated for the marketing purpose only. Returned separately
 * from readStored() because a migrated record is NOT a complete decision: the
 * v1 banner asked about Google Ads and nothing else, so analytics is still
 * undecided and the banner must ask for it. Marketing consent given under v1
 * stays valid and is applied immediately, so nothing is lost in the meantime.
 */
function readLegacyMarketing(): ConsentStatus | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { status?: unknown };
    if (isStatus(parsed?.status)) return parsed.status;
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null;
}

function persist(state: ConsentState) {
  try {
    const value: StoredConsent = { ...state, ts: Date.now(), version: 2 };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); consent still applies in-memory */
  }
}

/**
 * The stored decision, or null when the user has not decided yet. A migrated
 * v1 record is reported as its marketing value with analytics denied, so the
 * settings dialog shows the truth, but hasDecision() stays false so the banner
 * still asks about analytics.
 */
export function getStoredConsent(): ConsentState | null {
  const stored = readStored();
  if (stored) return { marketing: stored.marketing, analytics: stored.analytics };

  const legacyMarketing = readLegacyMarketing();
  if (legacyMarketing) return { marketing: legacyMarketing, analytics: 'denied' };

  return null;
}

/** True only when BOTH purposes have been explicitly decided under v2. */
export function hasDecision(): boolean {
  return readStored() !== null;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  const state = getStoredConsent();
  listeners.forEach((l) => l(state));
}

// Injects the shared gtag.js library exactly once, and only when at least one
// purpose is granted. No-op if already loaded or if a tag element exists in the
// DOM (guards against duplicates across SPA navigations / repeated grants).
// The src id only bootstraps the library; each product is activated by its own
// gtag('config', …) call in configureProduct().
function ensureLibraryLoaded(state: ConsentState) {
  if (tagLoaded) return;
  if (document.querySelector(`script[data-cogniiq-gtag="true"]`)) {
    tagLoaded = true;
    return;
  }
  tagLoaded = true;

  const bootstrapId = state.analytics === 'granted' ? GA4_ID : GOOGLE_ADS_ID;
  const s = document.createElement('script');
  s.async = true;
  s.src = gtagSrc(bootstrapId);
  s.setAttribute('data-cogniiq-gtag', 'true');
  document.head.appendChild(s);

  gtag('js', new Date());
}

// Configures one product at most once, so granting the second purpose later
// never re-configures the first.
function configureProduct(id: string) {
  if (configuredProducts.has(id)) return;
  configuredProducts.add(id);
  // No url_passthrough: passthrough is intentionally disabled.
  gtag('config', id);
}

// Best-effort removal of the first-party cookies the site can reach for one
// purpose. Already-transmitted data cannot be withdrawn from the frontend.
function removeCookies(names: string[]) {
  const host = window.location.hostname;
  // Try the exact host and the registrable-domain form (".cogniiq.de").
  const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

const AD_COOKIES = ['_gcl_au', '_gcl_aw', '_gcl_gb', '_gcl_dc', '_gac_gb'];
// GA4 writes _ga plus a per-stream _ga_<STREAM_ID> cookie.
const ANALYTICS_COOKIES = ['_ga', `_ga_${GA4_ID.replace(/^G-/, '')}`, '_gid'];

function removeGoogleAdCookies() {
  removeCookies(AD_COOKIES);
}

function removeAnalyticsCookies() {
  removeCookies(ANALYTICS_COOKIES);
}

/**
 * Called once on app start. Sets Consent Mode v2 defaults to DENIED (queued, no
 * network request) and restores a previously stored choice. Never loads the
 * Google tag library without a stored grant for at least one purpose.
 */
export function initConsent() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Consent Mode v2 defaults — denied for every ad AND analytics signal.
  // Basic mode: nothing is sent to Google until a purpose is granted.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });

  // Restores a v2 decision, or a v1 record migrated for marketing only.
  const restored = getStoredConsent();
  if (restored) applyState(restored);
  // null → nothing is loaded. A null decision means the banner shows.
}

/**
 * Single point where consent reaches gtag. Each signal is bound to its own
 * purpose, and each product is configured only under its own purpose.
 */
function applyState(state: ConsentState) {
  gtag('consent', 'update', {
    ad_storage: state.marketing,
    ad_user_data: state.marketing,
    ad_personalization: state.marketing,
    analytics_storage: state.analytics,
  });

  // Clean up cookies for any purpose that just transitioned granted → denied.
  if (appliedState.marketing === 'granted' && state.marketing === 'denied') removeGoogleAdCookies();
  if (appliedState.analytics === 'granted' && state.analytics === 'denied') removeAnalyticsCookies();
  appliedState = state;

  // Neither purpose granted → the library is never injected.
  if (state.marketing === 'denied' && state.analytics === 'denied') return;

  ensureLibraryLoaded(state);
  if (state.marketing === 'granted') configureProduct(GOOGLE_ADS_ID);
  if (state.analytics === 'granted') configureProduct(GA4_ID);
}

/**
 * Saves and applies an explicit per-purpose choice ("Auswahl speichern").
 * Either purpose may be granted or denied independently, in any order and
 * across separate visits.
 */
export function setConsent(next: ConsentState) {
  persist(next);
  applyState(next);
  notify();
}

/** User clicked "Alle akzeptieren" — the banner names both purposes. */
export function grantAll() {
  setConsent(GRANTED_STATE);
}

/** User clicked "Ablehnen". Keeps the Google tag library completely unloaded. */
export function denyAll() {
  setConsent(DENIED_STATE);
}

/**
 * User revoked previously granted consent via "Cookie-Einstellungen".
 * Sets both purposes to denied and removes the reachable first-party cookies
 * for whichever purposes were active. A page reload fully clears the in-memory
 * tag; already-transmitted data cannot be withdrawn from the frontend.
 */
export function revokeConsent() {
  setConsent(DENIED_STATE);
  // Unconditional sweep — covers cookies left by an earlier session whose
  // grant this page load never applied.
  removeGoogleAdCookies();
  removeAnalyticsCookies();
}

/** Opens the consent settings dialog from anywhere (e.g. footer link). */
export function openConsentSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
}
