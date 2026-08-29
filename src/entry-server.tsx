// ─────────────────────────────────────────────────────────────────────────────
// SSR / prerender entry point.
//
// Built by `npm run build:ssr` into dist-ssr/ (a temporary directory that is
// NEVER the client dist), then consumed by scripts/prerender.mjs and
// scripts/generate-sitemap.mjs.
//
// This module is also the TypeScript -> Node boundary for the route manifest.
// Node .mjs scripts must not import an uncompiled .ts file and we refuse to add
// a runtime transpiler to paper over that, so the manifest is re-exported here
// and reaches Node through the compiled SSR bundle Vite produces anyway. One
// compiler (Vite/esbuild, already in the build), one artifact, no new
// dependency. .github/scripts/test-prerender-output.mjs asserts the re-export
// actually arrives in dist-ssr.
// ─────────────────────────────────────────────────────────────────────────────
import { StrictMode, type ReactElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Writable } from 'node:stream';

import { AppShell } from './App';
import { ThemeProvider } from './components/theme-provider';

// Re-exported for the Node build scripts. See the header note above.
export {
  PUBLIC_ROUTES,
  INDEXABLE_ROUTES,
  SITE_ORIGIN,
  DEFAULT_ROUTE_ROBOTS,
  NOINDEX_ROUTE_ROBOTS,
  canonicalFor,
  routeFor,
} from './lib/routing/publicRoutes';

export interface RenderResult {
  html: string;
}

/**
 * Render one public route to complete HTML.
 *
 * Uses renderToPipeableStream + onAllReady rather than renderToString because
 * every page in the route table is a React.lazy() component: renderToString
 * cannot resolve lazy boundaries, onAllReady waits for all of them and only
 * then emits the finished markup.
 *
 * Rejects — never resolves partially — on render error, on a rejected lazy
 * import, on a shell error, or when `timeoutMs` elapses. The caller turns any
 * rejection into a failed build, so a half-rendered page can never be written.
 */
export function render(url: string, timeoutMs = 30_000): Promise<RenderResult> {
  return renderElement(
    <StrictMode>
      <ThemeProvider>
        <StaticRouter location={url}>
          <AppShell />
        </StaticRouter>
      </ThemeProvider>
    </StrictMode>,
    url,
    timeoutMs
  );
}

/**
 * The streaming/timeout/abort machinery, separated from the app tree purely so
 * the failure paths can be tested with a tree that is guaranteed to hang.
 * Production callers use `render` above.
 */
export function renderElement(
  element: ReactElement,
  label: string,
  timeoutMs = 30_000
): Promise<RenderResult> {
  return new Promise<RenderResult>((resolve, reject) => {
    // One mutable holder rather than several `let`s: `onAllReady` can fire
    // before `renderToPipeableStream` returns, so the stream controls have to be
    // reachable from a callback that may run before they exist.
    const state: {
      settled: boolean;
      html: string;
      controls?: ReturnType<typeof renderToPipeableStream>;
      readyBeforeControls: boolean;
    } = { settled: false, html: '', readyBeforeControls: false };

    const finish = (fn: () => void) => {
      if (state.settled) return;
      state.settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => {
        state.controls?.abort();
        reject(new Error(`Prerender timed out after ${timeoutMs}ms for ${label}`));
      });
    }, timeoutMs);

    // Collected as Buffers and decoded once, at the end: decoding each chunk on its
    // own would corrupt any multi-byte character split across a chunk boundary.
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    });

    sink.on('error', (error) => finish(() => reject(error)));

    const pipeOut = () => {
      sink.on('finish', () =>
        finish(() => {
          // react-dom 18.3.1 encodes SSR output into a fixed-size view with
          // TextEncoder.encodeInto. When a multi-byte character lands exactly on
          // that view's boundary it emits a stray NUL immediately before the
          // character, which then ships inside customer-facing prerendered copy
          // ("Die vier S\u0000\u00e4ulen"). Measured across a full build: every NUL
          // sat directly before a multi-byte lead byte and no text was lost, so
          // dropping NULs restores the intended string exactly. A NUL is never
          // legitimate in this HTML. Which pages were hit shifted with any content
          // change, because it depends only on byte offsets.
          state.html = Buffer.concat(chunks).toString('utf8').split('\u0000').join('');
          resolve({ html: state.html });
        })
      );
      state.controls!.pipe(sink);
    };

    state.controls = renderToPipeableStream(element, {
      // Can fire synchronously — before `renderToPipeableStream` has returned —
      // for a tree with no pending lazy boundary, so readiness and piping are
      // decoupled rather than piped straight from this callback.
      onAllReady() {
        if (state.controls) pipeOut();
        else state.readyBeforeControls = true;
      },
      onShellError(error) {
        finish(() => reject(error instanceof Error ? error : new Error(String(error))));
      },
      onError(error) {
        // Any error during rendering fails the whole build. React would
        // otherwise recover silently and emit a page with a hole in it.
        finish(() => reject(error instanceof Error ? error : new Error(String(error))));
      },
    });

    if (state.readyBeforeControls && !state.settled) pipeOut();
  });
}
