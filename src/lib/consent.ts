// ─────────────────────────────────────────────────────────────────────────────
// Consent management — Google Consent Mode v2, BASIC implementation.
//
// Contract (enforced by .github/scripts/test-seo-consistency.mjs):
//   • BEFORE explicit consent: no gtag.js request, no Google Ads request, no
//     advertising cookies, no cookieless pings. The Google tag is NEVER injected.
//   • ON acceptance: the Google Ads tag is loaded dynamically exactly once,
//     Consent Mode v2 is initialised and ad_storage / ad_user_data /
//     ad_personalization are set to 'granted'. analytics_storage stays 'denied'
//     because no analytics product (e.g. GA4 'G-…') is configured — only the
//     Google Ads conversion tag 'AW-…'.
//   • ON rejection: the Google tag stays completely unloaded.
//   • ON later visits: the saved choice is restored before deciding to load.
//   • ON revoke: consent is set to denied, first-party Google Ads cookies that
//     the site can reach are removed, and future loading is prevented.
//
// URL passthrough is intentionally NOT enabled.
// ─────────────────────────────────────────────────────────────────────────────

// Google Ads conversion tag id (was hard-coded in index.html before Phase 0).
const GOOGLE_ADS_ID = 'AW-17946397271';
const GTAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;

export const CONSENT_STORAGE_KEY = 'cogniiq_consent_v1';
export const OPEN_CONSENT_EVENT = 'cogniiq:open-consent-settings';

export type ConsentStatus = 'granted' | 'denied';

interface StoredConsent {
  status: ConsentStatus;
  ts: number;
  version: 1;
}

type Listener = (status: ConsentStatus | null) => void;
const listeners = new Set<Listener>();
let tagLoaded = false;
let bootstrapped = false;

// gtag helper. dataLayer.push queues commands; before the library loads these
// entries simply sit in the array and cause NO network request.
function gtag(...args: unknown[]) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed && (parsed.status === 'granted' || parsed.status === 'denied')) {
      return parsed;
    }
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null;
}

function persist(status: ConsentStatus) {
  try {
    const value: StoredConsent = { status, ts: Date.now(), version: 1 };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); consent still applies in-memory */
  }
}

export function getStoredConsent(): ConsentStatus | null {
  return readStored()?.status ?? null;
}

export function hasDecision(): boolean {
  return getStoredConsent() !== null;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  const status = getStoredConsent();
  listeners.forEach((l) => l(status));
}

// Loads the Google Ads tag exactly once. No-op if already loaded or if a tag
// element already exists in the DOM (guards against duplicate tags across SPA
// navigations / repeated grants).
function loadGoogleTag() {
  if (tagLoaded) return;
  if (document.querySelector(`script[data-cogniiq-gtag="true"]`)) {
    tagLoaded = true;
    return;
  }
  tagLoaded = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = GTAG_SRC;
  s.setAttribute('data-cogniiq-gtag', 'true');
  document.head.appendChild(s);

  gtag('js', new Date());
  // No url_passthrough: passthrough is intentionally disabled.
  gtag('config', GOOGLE_ADS_ID);
}

// Best-effort removal of first-party Google Ads cookies the site can reach.
// Already-transmitted data cannot be withdrawn technically from the frontend.
function removeGoogleAdCookies() {
  const names = ['_gcl_au', '_gcl_aw', '_gcl_gb', '_gcl_dc', '_gac_gb'];
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

/**
 * Called once on app start. Sets Consent Mode v2 defaults to DENIED (queued, no
 * network request) and — only if a previous 'granted' choice is stored —
 * restores it and loads the tag. Never loads the tag without a stored grant.
 */
export function initConsent() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Consent Mode v2 defaults — denied for every ad/analytics signal.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });

  const stored = readStored();
  if (stored?.status === 'granted') {
    applyGranted();
  }
  // 'denied' or null → nothing is loaded. A null decision means the banner shows.
}

function applyGranted() {
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    // analytics_storage intentionally NOT granted — no analytics product is used.
  });
  loadGoogleTag();
}

/** User clicked "Alle akzeptieren". */
export function grantConsent() {
  persist('granted');
  applyGranted();
  notify();
}

/** User clicked "Ablehnen". Keeps the Google tag completely unloaded. */
export function denyConsent() {
  persist('denied');
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  notify();
}

/**
 * User revoked a previously granted consent via "Cookie-Einstellungen".
 * Updates consent to denied, removes reachable first-party Google Ads cookies
 * and prevents future loading. A page reload fully clears the in-memory tag;
 * already-transmitted data cannot be withdrawn from the frontend.
 */
export function revokeConsent() {
  denyConsent();
  removeGoogleAdCookies();
}

/** Opens the consent settings dialog from anywhere (e.g. footer link). */
export function openConsentSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
}
