import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider';

window.addEventListener('vite:preloadError', () => {
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