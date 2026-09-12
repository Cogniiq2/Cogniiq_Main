import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Behavioural contract for the consent-gated Google tag loader.
//
// The static assertions in .github/scripts/test-seo-consistency.mjs check that
// the SOURCE says the right things. These tests check that the RUNTIME does the
// right things: which gtag calls are emitted, and — the part that actually
// matters for DSGVO/TDDDG — that no Google tag request is made until the
// matching purpose is granted, and that granting one purpose never activates
// the other.
//
// The module holds load/config guards in module scope, so every test re-imports
// it via vi.resetModules() to get a clean instance.

const GA4_ID = 'G-NDN9J2G5LM';
const ADS_ID = 'AW-17946397271';
// Retired stream. Production traffic must never reach it again: it must never
// be configured, bootstrapped or pushed to the dataLayer.
const RETIRED_GA4_ID = 'G-K7BS3LKT6H';
// The cookie the retired stream left on returning visitors' browsers. It is a
// COOKIE NAME only — cleaned up on withdrawal, never configured as a stream.
const ACTIVE_GA_COOKIE = '_ga_NDN9J2G5LM';
const LEGACY_GA_COOKIE = '_ga_K7BS3LKT6H';

type GtagCall = unknown[];

function readDataLayer(): GtagCall[] {
  const w = window as unknown as { dataLayer?: GtagCall[] };
  return (w.dataLayer ?? []).map((c) => Array.from(c as ArrayLike<unknown>));
}

/** Consent calls only: ['consent', 'default'|'update', {...}] */
function consentCalls(kind: 'default' | 'update') {
  return readDataLayer()
    .filter((c) => c[0] === 'consent' && c[1] === kind)
    .map((c) => c[2] as Record<string, string>);
}

/** Product ids passed to gtag('config', id). */
function configuredIds(): string[] {
  return readDataLayer()
    .filter((c) => c[0] === 'config')
    .map((c) => String(c[1]));
}

/** Injected gtag.js <script> elements — the actual network request to Google. */
function tagScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-cogniiq-gtag="true"]'));
}

async function loadModule() {
  vi.resetModules();
  return import('./consent');
}

beforeEach(() => {
  localStorage.clear();
  (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  tagScripts().forEach((s) => s.remove());
});

afterEach(() => {
  localStorage.clear();
});

describe('consent defaults (Basic Consent Mode)', () => {
  it('denies every signal before any decision and loads no Google tag', async () => {
    const { initConsent } = await loadModule();
    initConsent();

    expect(consentCalls('default')).toHaveLength(1);
    expect(consentCalls('default')[0]).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });

    // Basic mode: nothing is requested from Google before consent.
    expect(tagScripts()).toHaveLength(0);
    expect(configuredIds()).toEqual([]);
  });

  it('does not enable url_passthrough', async () => {
    const { initConsent, grantAll } = await loadModule();
    initConsent();
    grantAll();
    const passthrough = readDataLayer().some((c) =>
      JSON.stringify(c).includes('url_passthrough'),
    );
    expect(passthrough).toBe(false);
  });
});

describe('analytics consent gates GA4 only', () => {
  it('does not load GA4 before analytics consent', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'denied', analytics: 'denied' });

    expect(tagScripts()).toHaveLength(0);
    expect(configuredIds()).not.toContain(GA4_ID);
  });

  it('loads and configures GA4 after analytics consent, without configuring Ads', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'denied', analytics: 'granted' });

    expect(tagScripts()).toHaveLength(1);
    expect(configuredIds()).toContain(GA4_ID);
    expect(configuredIds()).not.toContain(ADS_ID);

    const update = consentCalls('update').at(-1)!;
    expect(update.analytics_storage).toBe('granted');
    expect(update.ad_storage).toBe('denied');
    expect(update.ad_user_data).toBe('denied');
    expect(update.ad_personalization).toBe('denied');
  });
});

describe('marketing consent gates Google Ads only', () => {
  it('configures Ads after marketing consent, without configuring GA4', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'granted', analytics: 'denied' });

    expect(tagScripts()).toHaveLength(1);
    expect(configuredIds()).toContain(ADS_ID);
    expect(configuredIds()).not.toContain(GA4_ID);

    const update = consentCalls('update').at(-1)!;
    expect(update.ad_storage).toBe('granted');
    expect(update.ad_user_data).toBe('granted');
    expect(update.ad_personalization).toBe('granted');
    expect(update.analytics_storage).toBe('denied');
  });
});

describe('purposes can be granted in either order', () => {
  it('marketing first, analytics later — library loaded once, each product configured once', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'granted', analytics: 'denied' });
    setConsent({ marketing: 'granted', analytics: 'granted' });

    expect(tagScripts()).toHaveLength(1);
    expect(configuredIds().filter((id) => id === ADS_ID)).toHaveLength(1);
    expect(configuredIds().filter((id) => id === GA4_ID)).toHaveLength(1);
  });

  it('analytics first, marketing later — library loaded once, each product configured once', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'denied', analytics: 'granted' });
    setConsent({ marketing: 'granted', analytics: 'granted' });

    expect(tagScripts()).toHaveLength(1);
    expect(configuredIds().filter((id) => id === GA4_ID)).toHaveLength(1);
    expect(configuredIds().filter((id) => id === ADS_ID)).toHaveLength(1);
  });

  it('repeated identical grants never duplicate the library or the config calls', async () => {
    const { initConsent, grantAll } = await loadModule();
    initConsent();
    grantAll();
    grantAll();
    grantAll();

    expect(tagScripts()).toHaveLength(1);
    expect(configuredIds().filter((id) => id === GA4_ID)).toHaveLength(1);
    expect(configuredIds().filter((id) => id === ADS_ID)).toHaveLength(1);
  });
});

describe('reject and revoke', () => {
  it('reject-all stores a decision, loads nothing and denies every signal', async () => {
    const { initConsent, denyAll, hasDecision, getStoredConsent } = await loadModule();
    initConsent();
    denyAll();

    expect(hasDecision()).toBe(true);
    expect(getStoredConsent()).toEqual({ marketing: 'denied', analytics: 'denied' });
    expect(tagScripts()).toHaveLength(0);
    expect(configuredIds()).toEqual([]);
    expect(consentCalls('update').at(-1)).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });

  it('revoke after grant sets every signal back to denied', async () => {
    const { initConsent, grantAll, revokeConsent, getStoredConsent } = await loadModule();
    initConsent();
    grantAll();
    revokeConsent();

    expect(getStoredConsent()).toEqual({ marketing: 'denied', analytics: 'denied' });
    expect(consentCalls('update').at(-1)).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });

  it('withdrawing analytics alone keeps marketing granted', async () => {
    const { initConsent, grantAll, setConsent } = await loadModule();
    initConsent();
    grantAll();
    setConsent({ marketing: 'granted', analytics: 'denied' });

    const update = consentCalls('update').at(-1)!;
    expect(update.analytics_storage).toBe('denied');
    expect(update.ad_storage).toBe('granted');
  });
});

describe('v1 → v2 migration', () => {
  it('carries marketing over but never infers analytics consent', async () => {
    localStorage.setItem(
      'cogniiq_consent_v1',
      JSON.stringify({ status: 'granted', ts: Date.now(), version: 1 }),
    );

    const { initConsent, getStoredConsent, hasDecision } = await loadModule();
    initConsent();

    // Marketing consent survives; analytics is denied and still undecided, so
    // the banner asks again instead of silently enabling GA4.
    expect(getStoredConsent()).toEqual({ marketing: 'granted', analytics: 'denied' });
    expect(hasDecision()).toBe(false);
    expect(configuredIds()).toContain(ADS_ID);
    expect(configuredIds()).not.toContain(GA4_ID);
  });

  it('a v1 rejection stays a rejection and loads nothing', async () => {
    localStorage.setItem(
      'cogniiq_consent_v1',
      JSON.stringify({ status: 'denied', ts: Date.now(), version: 1 }),
    );

    const { initConsent, getStoredConsent } = await loadModule();
    initConsent();

    expect(getStoredConsent()).toEqual({ marketing: 'denied', analytics: 'denied' });
    expect(tagScripts()).toHaveLength(0);
  });
});

describe('stored decisions are restored on a later visit', () => {
  it('re-applies an analytics-only grant without re-asking', async () => {
    const first = await loadModule();
    first.initConsent();
    first.setConsent({ marketing: 'denied', analytics: 'granted' });

    // Simulate a fresh page load: same storage, clean module + DOM.
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
    tagScripts().forEach((s) => s.remove());

    const second = await loadModule();
    second.initConsent();

    expect(second.hasDecision()).toBe(true);
    expect(configuredIds()).toContain(GA4_ID);
    expect(configuredIds()).not.toContain(ADS_ID);
  });
});

describe('GA4 stream identity and cookie cleanup', () => {
  /** Captures every `document.cookie = …` write instead of letting jsdom apply it. */
  function captureCookieWrites() {
    const writes: string[] = [];
    const spy = vi.spyOn(document, 'cookie', 'set').mockImplementation((value: string) => {
      writes.push(value);
    });
    return { writes, restore: () => spy.mockRestore() };
  }

  it('bootstraps and configures the production stream, never the retired one', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'denied', analytics: 'granted' });

    expect(configuredIds()).toContain(GA4_ID);
    expect(configuredIds()).not.toContain(RETIRED_GA4_ID);

    const src = tagScripts()[0]?.src ?? '';
    expect(src).toContain(GA4_ID);
    expect(src).not.toContain(RETIRED_GA4_ID);
    expect(JSON.stringify(readDataLayer())).not.toContain(RETIRED_GA4_ID);
  });

  it('clears the per-stream GA cookie of the ACTIVE stream when analytics is withdrawn', async () => {
    const { initConsent, setConsent } = await loadModule();
    initConsent();
    setConsent({ marketing: 'granted', analytics: 'granted' });

    const { writes, restore } = captureCookieWrites();
    // Withdraw analytics only; marketing stays granted.
    setConsent({ marketing: 'granted', analytics: 'denied' });
    restore();

    const cleared = writes.map((w) => w.split('=')[0]);
    expect(cleared).toContain('_ga');
    expect(cleared).toContain('_gid');
    // Active stream cookie, derived from the single-source-of-truth GA4_ID.
    expect(cleared).toContain(ACTIVE_GA_COOKIE);
    expect(ACTIVE_GA_COOKIE).toBe(`_ga_${GA4_ID.replace(/^G-/, '')}`);
    // Historical cookie from the retired stream is swept too, so a returning
    // visitor keeps no stale analytics cookie after withdrawing consent.
    expect(cleared).toContain(LEGACY_GA_COOKIE);
    // Analytics-only withdrawal must not touch advertising cookies.
    expect(cleared).not.toContain('_gcl_au');
    expect(cleared).not.toContain('_gcl_aw');
    expect(cleared).not.toContain('_gac_gb');
    // Every write must be an expiry, never a cookie being set.
    for (const w of writes) expect(w).toContain('expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('revoke clears both the advertising and the active-stream analytics cookies', async () => {
    const { initConsent, grantAll, revokeConsent } = await loadModule();
    initConsent();
    grantAll();

    const { writes, restore } = captureCookieWrites();
    revokeConsent();
    restore();

    const cleared = writes.map((w) => w.split('=')[0]);
    expect(cleared).toContain('_gcl_au');
    expect(cleared).toContain('_ga');
    expect(cleared).toContain('_gid');
    expect(cleared).toContain(ACTIVE_GA_COOKIE);
    expect(cleared).toContain(LEGACY_GA_COOKIE);
  });

  it('sweeping the legacy cookie never configures or pings the retired stream', async () => {
    const { initConsent, grantAll, revokeConsent } = await loadModule();
    initConsent();
    grantAll();
    revokeConsent();

    // The legacy entry is a cookie name, not a measurement id: it must never
    // reach gtag as a config target or as any dataLayer payload.
    expect(configuredIds()).not.toContain(RETIRED_GA4_ID);
    expect(JSON.stringify(readDataLayer())).not.toContain(RETIRED_GA4_ID);
    expect(tagScripts().map((t) => t.src).join(' ')).not.toContain(RETIRED_GA4_ID);
  });
});
