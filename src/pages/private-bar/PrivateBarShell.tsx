import { useEffect, type ReactNode } from 'react';

// The design system is injected as a <style> element rather than imported as a
// build asset. Vite would emit a lazy route's CSS as a separate stylesheet that
// the prerendered document does not link, so the page would paint unstyled
// until its JavaScript arrived — the exact opposite of what this surface is
// for. `?inline` keeps the authored .css file while placing its text into the
// prerendered HTML, so the first paint is already correct and no Cogniiq route
// pays a single byte for it.
import privateBarCss from './private-bar.css?inline';

const IVORY = '#f7f4ee';

/**
 * The Private Bar's own document shell.
 *
 * Rendered OUTSIDE PublicLayout (see src/App.tsx), so no Cogniiq navigation,
 * footer, consent banner, structured data or branding exists anywhere in this
 * tree. Everything visible on this surface is defined in this directory.
 */
export function PrivateBarShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    // The prerendered document already carries this exact title; this restores it
    // after a client-side navigation between the bar and its return surfaces.
    document.title = title;

    // The canvas behind the app root (overscroll on iOS, the area beyond the
    // last section) must be the bar's ivory, not the marketing site's white.
    // Restored on unmount so leaving the surface leaves nothing behind.
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = IVORY;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [title]);

  return (
    <div className="pb-root">
      {/*
        dangerouslySetInnerHTML, not a text child, and that is load-bearing.
        React ESCAPES a text child during server rendering, so `font-family:
        "Iowan Old Style"` was serialised into the prerendered document as
        `font-family: &quot;Iowan Old Style&quot;` — invalid CSS, so the display
        font stack silently died — and the escaped server text then failed to
        match the raw client text, producing a hydration mismatch (React #425)
        that took the route's Suspense boundary with it (#422). Raw HTML is
        emitted verbatim on both sides. The content is a build-time constant
        from this directory: no user input reaches it.
      */}
      <style dangerouslySetInnerHTML={{ __html: privateBarCss }} />
      {children}
    </div>
  );
}
