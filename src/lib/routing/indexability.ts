// Single source of truth for "is this route a private surface?".
//
// Extracted from App.tsx so the SEO/indexability rules are unit-testable and cannot drift between
// the robots meta manager, the structured-data gate, the canonical manager and the consent banner.
//
// Private surfaces must never be indexed and must never carry marketing structured data. The
// authentication completion surfaces (/auth/*) belong to this group: they are reachable only through
// a one-time Supabase link and must not appear in any search index.

export const DEFAULT_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

export const PRIVATE_ROBOTS = 'noindex, nofollow';

export const DOCUMENT_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Authentication completion + post-login resolution routes (/auth/confirmed, /auth/continue, ...).
// Standalone surfaces: no marketing chrome, no dashboard chrome, never indexed.
export function isAuthSurface(pathname: string): boolean {
  return isUnder(pathname, '/auth');
}

// Tokenized customer document portal (/d/:token). Private, sensitive, and additionally protected
// against archiving, snippeting and referrer leakage.
export function isDocumentSurface(pathname: string): boolean {
  return isUnder(pathname, '/d');
}

export function isPrivateSurface(pathname: string): boolean {
  return (
    isUnder(pathname, '/app') ||
    isUnder(pathname, '/admin') ||
    isUnder(pathname, '/owner') ||
    isAuthSurface(pathname)
  );
}

// A canonical URL advertises a public, indexable address. Surfaces reached only through a token or a
// one-time email link have no public address, so they must not emit one at all.
export function shouldSuppressCanonical(pathname: string): boolean {
  return isDocumentSurface(pathname) || isAuthSurface(pathname);
}

export function privateDocumentTitle(pathname: string): string {
  if (isAuthSurface(pathname)) return 'Cogniiq Konto';
  if (isUnder(pathname, '/admin')) return 'Cogniiq Admin';
  if (isUnder(pathname, '/owner')) return 'Cogniiq Owner';
  return 'Cogniiq Kundenbereich';
}
