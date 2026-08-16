// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC LIGHT THEME — single source of truth.
//
// The marketing site is a light-first brand surface. It must render light for
// every visitor, always, no matter what the *generic* theme preference says.
//
// That preference (`cogniiq-theme`) is shared with the application: next-themes
// writes it per origin and puts the resolved theme on <html> as a class. So a
// customer who chose dark inside /app — or, while `enableSystem` was on, anyone
// whose OS simply preferred dark — got `<html class="dark">` on cogniiq.de too,
// and every public page rendered on a near-black canvas.
//
// The fix does NOT touch that key or the provider. Rewriting the stored value
// would silently change the application's appearance for the person who chose
// it, and suppressing the OS preference would change private behaviour too.
// Instead the public surface opts OUT of the theme entirely: whenever the URL is
// public, <html> carries PUBLIC_LIGHT_CLASS, and the stylesheet pins the light
// tokens there regardless of any `dark` class sitting beside it.
//
// Consequences worth stating plainly:
//   • public routes ignore `cogniiq-theme` completely — `dark`, `system` or
//     absent all render light;
//   • private routes are untouched, so an explicit dark choice still applies to
//     /app, /admin, /owner and /auth;
//   • when the public dark mode is built later it gets its own key
//     (`cogniiq-public-theme`) and opts back IN here, rather than inheriting a
//     preference the visitor never expressed about the marketing site.
// ─────────────────────────────────────────────────────────────────────────────

/** Class placed on <html> for every public URL. */
export const PUBLIC_LIGHT_CLASS = 'cq-public-light';

/**
 * Route prefixes that keep the generic theme preference.
 *
 * Mirrors isPrivateSurface() in ./indexability plus the tokenised document
 * portal (/d/:token), which also renders its own chrome. Kept as a plain string
 * list because the pre-paint inline script in index.html has to reproduce it
 * before any module is loaded; src/lib/routing/publicTheme.test.ts asserts the
 * two agree, so they cannot drift.
 */
export const THEMED_PRIVATE_PREFIXES = ['/app', '/admin', '/owner', '/auth', '/d'] as const;

/** True when the URL keeps the generic theme (i.e. is NOT a public marketing page). */
export function usesGenericTheme(pathname: string): boolean {
  return THEMED_PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** True when the URL must be pinned to the public light theme. */
export function usesPublicLightTheme(pathname: string): boolean {
  return !usesGenericTheme(pathname);
}

/**
 * The pre-paint script, as source text.
 *
 * Inlined into index.html so it runs while the document is parsing — before the
 * first paint and before React exists. Applying the class later would show the
 * dark canvas for a frame and then repaint white, which is exactly the flash
 * this is meant to prevent. It only touches <html>, an element React does not
 * own, so it cannot cause a hydration mismatch.
 */
export const PUBLIC_THEME_INLINE_SCRIPT = `(function(){try{var p=location.pathname;var q=${JSON.stringify(
  THEMED_PRIVATE_PREFIXES
)};for(var i=0;i<q.length;i++){if(p===q[i]||p.indexOf(q[i]+"/")===0)return;}var d=document.documentElement;d.classList.remove("dark");d.classList.add("${PUBLIC_LIGHT_CLASS}");d.style.colorScheme="light";}catch(e){}})();`;

// ── reactive current-path store ───────────────────────────────────────────────
// ThemeProvider is mounted outside the Router (main.tsx / entry-server.tsx), so it
// cannot call useLocation. This is the smallest bridge that lets it react to
// navigation: PublicThemeManager pushes the pathname in, the provider subscribes.
//
// It exists because the theme has to be suppressed through next-themes' own
// `forcedTheme` API rather than by deleting the class afterwards. An earlier
// attempt removed `dark` from <html> in a MutationObserver; next-themes rewrites
// the class attribute wholesale when it reapplies, the observer fired again, and
// the two locked the main thread (the page stopped responding to CDP entirely).
let currentPathname = '/';
const pathListeners = new Set<() => void>();

export function setThemePathname(pathname: string): void {
  if (pathname === currentPathname) return;
  currentPathname = pathname;
  for (const listener of pathListeners) listener();
}

export function subscribeThemePathname(listener: () => void): () => void {
  pathListeners.add(listener);
  return () => {
    pathListeners.delete(listener);
  };
}

export function getThemePathname(): string {
  return currentPathname;
}

/** Server snapshot: every prerendered document is a public route. */
export function getServerThemePathname(): string {
  return '/';
}
