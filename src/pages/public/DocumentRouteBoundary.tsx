// Failure containment for the tokenized customer document route (/d/:token).
//
// Why this exists, concretely: a customer opened a freshly emailed offer link and got a
// completely blank white page. The offer, the token and the backend projection were all
// healthy — `public_offer_by_token` was never even called. The route's lazy chunk failed to
// load (a deploy had changed every asset hash, so a browser or edge cache still holding the
// previous app-shell.html requested a chunk filename that no longer existed), React re-threw
// the rejected dynamic import, and with no error boundary above the Suspense the entire React
// root unmounted — leaving an empty <div id="root">.
//
// Two separate defects produced that outcome and both are fixed here:
//   1. Nothing caught the failure, so the customer saw nothing at all.
//   2. The app-wide Suspense fallback renders null, so even the healthy path shows a blank
//      screen while the chunk is in flight. This route now has a visible loading state.
//
// Scope is deliberately narrow. This wraps ONLY the public document experience — it must not
// become an app-wide net that swallows real errors on other surfaces.
//
// Token safety: the URL of this route contains the customer's secret token. Nothing here may
// render or log it, so every string that reaches the console is scrubbed first.

import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Chunk/dynamic-import failures, across browsers. These are recoverable by refetching. */
const CHUNK_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk \d+ failed/i;

/** True for a failed lazy chunk — the customer is told a new version is available. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? '');
  return CHUNK_ERROR.test(message);
}

/**
 * Remove the secret token from any text before it reaches the console.
 * The token is the path segment after /d/, and may also appear inside a referrer or stack frame.
 */
export function scrubToken(text: string): string {
  return text.replace(/\/d\/[^/\s"')]+/g, '/d/[token]');
}

/** A visible loading state for the document route (the app-wide fallback renders nothing). */
export function DocumentRouteFallback() {
  return (
    <div
      className="w-full overflow-x-hidden bg-[#f8f8f5] text-slate-900"
      style={{ minHeight: '100dvh' }}
      role="status"
      aria-live="polite"
      aria-label="Angebot wird geladen"
    >
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-6 py-16">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-8 w-64 rounded bg-slate-100" />
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
      <span className="sr-only">Ihr Angebot wird geladen …</span>
    </div>
  );
}

function RecoveryScreen({ stale, onReload }: { stale: boolean; onReload: () => void }) {
  return (
    <div className="w-full overflow-x-hidden bg-[#f8f8f5] text-slate-900" style={{ minHeight: '100dvh' }}>
      <div className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">!</div>
          <h1 className="text-lg font-semibold text-slate-900">
            {stale ? 'Neue Version verfügbar' : 'Anzeige unterbrochen'}
          </h1>
          <p className="mt-2 text-[14px] text-slate-500">
            {stale
              ? 'Ihr Angebot konnte nicht vollständig geladen werden, weil zwischenzeitlich eine neue Version veröffentlicht wurde. Ein Neuladen behebt das.'
              : 'Ihr Angebot konnte nicht angezeigt werden. Bitte laden Sie die Seite neu — Ihr Link bleibt gültig.'}
          </p>
          <button
            type="button"
            onClick={onReload}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Erneut laden
          </button>
          <p className="mt-4 text-[12px] text-slate-400">
            Bleibt das Problem bestehen, antworten Sie einfach auf die E-Mail mit Ihrem Angebot.
          </p>
        </div>
      </div>
    </div>
  );
}

interface Props { children: ReactNode }
interface State { hasError: boolean; stale: boolean }

export class DocumentRouteBoundary extends Component<Props, State> {
  state: State = { hasError: false, stale: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, stale: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Scrubbed: the route URL and the failing chunk URL must never carry the token into logs.
    console.error(
      '[DocumentRoute]',
      scrubToken(`${error.name}: ${error.message}`),
      scrubToken(info.componentStack ?? ''),
    );
  }

  // Recovery is deliberately MANUAL. An automatic reload was tried and rejected: when the
  // chunk stays unavailable the boundary re-catches immediately and the page reload-loops
  // (measured: 160 catches in 9 s), which is worse for the customer than the blank page it
  // replaces. One explicit button always paints, never loops, and a real reload fetches fresh
  // HTML — which is exactly what resolves a stale chunk.
  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <RecoveryScreen stale={this.state.stale} onReload={this.handleReload} />;
    }
    return this.props.children;
  }
}

export default DocumentRouteBoundary;
