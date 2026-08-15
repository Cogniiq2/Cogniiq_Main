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

const routeChunks = window.__COGNIIQ_ROUTE_CHUNKS__;

if (routeChunks?.length && rootElement.hasChildNodes()) {
  // A failed chunk must never block the app: mount regardless, which is exactly
  // the previous behaviour (and vite:preloadError above still recovers).
  Promise.all(routeChunks.map((url) => import(/* @vite-ignore */ url).catch(() => undefined))).then(
    mount,
    mount
  );
} else {
  mount();
}