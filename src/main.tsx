import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider';

/**
 * Recover from a stale chunk ONCE, never in a loop.
 *
 * A deploy gives every chunk a new content hash. A browser or edge cache still holding the
 * previous HTML then asks for a filename that no longer exists, and Vite fires
 * `vite:preloadError`. Reloading fetches fresh HTML that names the current chunks, so a single
 * reload genuinely fixes that case.
 *
 * It must be guarded, though. This handler previously reloaded unconditionally, so whenever the
 * chunk stayed unavailable the page reloaded forever: it never survived long enough to paint,
 * and the customer saw a permanently blank white page instead of any error state. That is
 * exactly how a freshly emailed offer link opened to nothing — the portal never mounted, so
 * `public_offer_by_token` was never even called.
 *
 * With the marker set, a second failure falls through to DocumentRouteBoundary (and the app's
 * other boundaries), which paint a real recovery screen. The marker is per tab and expires, so
 * a genuinely new incident later in the same session can still self-heal.
 */
const PRELOAD_RELOAD_KEY = 'cogniiq:preload-reloaded-at';
const PRELOAD_RELOAD_COOLDOWN_MS = 60_000;

window.addEventListener('vite:preloadError', () => {
  let store: Storage | null = null;
  try {
    store = window.sessionStorage;
  } catch {
    store = null; // storage blocked (private mode): never risk an unguarded reload loop.
  }
  if (!store) return;

  const previous = Number(store.getItem(PRELOAD_RELOAD_KEY));
  const now = Date.now();
  if (Number.isFinite(previous) && previous > 0 && now - previous < PRELOAD_RELOAD_COOLDOWN_MS) {
    return; // already tried: let the error boundaries show a recovery screen instead.
  }
  store.setItem(PRELOAD_RELOAD_KEY, String(now));
  window.location.reload();
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

const app = (
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

declare global {
  interface Window {
    /**
     * Injected by scripts/prerender.mjs: every JS chunk whose components appear
     * in this page's prerendered HTML (the page itself plus the lazy sections
     * the server rendered inside it).
     */
    __COGNIIQ_ROUTE_CHUNKS__?: string[];
  }
}

/**
 * Pages — and the below-the-fold sections inside them — are React.lazy, so their
 * code lives in separate chunks that the prerendered HTML does not statically
 * reference. Hydrating straight away therefore begins with those Suspense
 * boundaries still dehydrated, and the first context update (Supabase publishes
 * an initial auth session within milliseconds of mount) makes React throw the
 * whole prerendered subtree away and re-render on the client — "React #421:
 * This Suspense boundary received an update before it finished hydrating".
 *
 * Loading those chunks first means every React.lazy resolves from the module
 * cache, so no boundary is dehydrated while updates are arriving. The set is
 * computed at build time from what the server actually rendered, so it never
 * includes client-only code such as the 3D hero.
 *
 * Top-level await is deliberately NOT used: the build targets browsers without
 * it, and using it fails the build outright.
 */
function mount() {
  if (rootElement!.hasChildNodes()) {
    hydrateRoot(rootElement!, app);
  } else {
    createRoot(rootElement!).render(app);
  }
}

/**
 * The chunk list, with a DOM fallback.
 *
 * The list is normally read from the inline script the prerenderer injects. A
 * host that post-processes HTML (asset optimisation, minification, injected
 * scripts) could drop or alter that inline script while leaving the
 * <link rel="modulepreload"> tags intact — and if the list is lost, hydration
 * starts with the route's boundary still dehydrated and React discards the
 * prerendered DOM (React #421). Reading the links back out of the document is a
 * second, independent source for the same information.
 */
function routeChunksToLoad(): string[] {
  const declared = window.__COGNIIQ_ROUTE_CHUNKS__;
  if (declared?.length) return declared;
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"][href]'))
    .map((link) => link.getAttribute('href'))
    .filter((href): href is string => Boolean(href));
}

const routeChunks = routeChunksToLoad();

if (routeChunks.length && rootElement.hasChildNodes()) {
  // A failed chunk must never block the app: mount regardless, which is exactly
  // the previous behaviour (and vite:preloadError above still recovers).
  Promise.all(routeChunks.map((url) => import(/* @vite-ignore */ url).catch(() => undefined))).then(
    mount,
    mount
  );
} else {
  mount();
}