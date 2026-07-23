// Central, framework-free logic for post-login routing and open-redirect prevention. Kept pure (no
// React, no Supabase) so it is unit-testable and shared by the login page, the role-landing page and
// the route guards. Authorization here is a UI convenience only — RLS remains the final security
// boundary and this module never grants access, it only decides where to send an already-known role.

export type PlatformRole = 'customer' | 'cogniiq_admin' | 'cogniiq_owner';

export interface AccessFlags {
  isPlatformAdmin: boolean;
  isPlatformOwner: boolean;
}

// The only internal route trees the app will ever redirect into. Everything else is treated as
// external/untrusted and rejected.
const INTERNAL_PREFIXES = ['/app', '/admin'] as const;

// Canonical default landing per database-backed platform role.
export const ROLE_LANDING = {
  cogniiq_owner: '/admin/finance/overview',
  cogniiq_admin: '/admin',
  customer: '/app',
} as const;

// Map a legacy `/owner/*` (and `/admin/login`) path to its canonical replacement, preserving the
// trailing segment. `/owner/clients` is the one segment that belongs to the shared CRM rather than
// finance. Non-legacy paths are returned unchanged.
export function mapLegacyPath(path: string): string {
  if (path === '/admin/login') return '/app/login';

  if (path === '/owner' || path === '/owner/') return '/admin/finance/overview';
  if (path.startsWith('/owner/')) {
    const rest = path.slice('/owner/'.length); // e.g. "taxes", "clients/123"
    if (rest === 'clients' || rest.startsWith('clients/') || rest.startsWith('clients?')) {
      return `/admin/${rest}`; // shared CRM, not finance
    }
    return `/admin/finance/${rest}`;
  }
  return path;
}

// Validate and normalize a `redirectTo` value. Returns a safe internal path or null. Rejects external
// URLs, protocol-relative `//host`, backslash tricks, control characters, and anything that is not
// under a known internal prefix. Legacy `/owner/*` paths are mapped to their canonical replacements.
export function sanitizeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (value === '') return null;

  // Must be an absolute, host-less path.
  if (!value.startsWith('/')) return null;
  // Protocol-relative ("//evil.example") or backslash / encoded-slash smuggled authority.
  if (
    value.startsWith('//') ||
    value.startsWith('/\\') ||
    value.startsWith('/%2f') || value.startsWith('/%2F') ||
    value.startsWith('/%5c') || value.startsWith('/%5C')
  ) {
    return null;
  }
  // Whitespace or backslashes anywhere are not valid in our internal paths.
  if (/\s/.test(value) || value.includes('\\')) return null;

  value = mapLegacyPath(value);

  const known = INTERNAL_PREFIXES.some((p) => value === p || value.startsWith(`${p}/`) || value.startsWith(`${p}?`));
  if (!known) return null;
  return value;
}

// Default destination for an authenticated user given their role flags.
export function defaultDestinationForRole(flags: AccessFlags): string {
  if (flags.isPlatformOwner) return ROLE_LANDING.cogniiq_owner;
  if (flags.isPlatformAdmin) return ROLE_LANDING.cogniiq_admin;
  return ROLE_LANDING.customer;
}

// Whether an authenticated user with the given flags is allowed to land on `path`. Mirrors the route
// guards: finance is owner-only, the rest of /admin is admin-or-owner, /app is any authenticated user.
export function isPathAuthorized(path: string, flags: AccessFlags): boolean {
  if (path === '/admin/finance' || path.startsWith('/admin/finance/') || path.startsWith('/admin/finance?')) {
    return flags.isPlatformOwner;
  }
  if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin?')) {
    return flags.isPlatformAdmin;
  }
  if (path === '/app' || path.startsWith('/app/') || path.startsWith('/app?')) {
    return true; // any authenticated user
  }
  return false;
}

// Resolve where to send an authenticated user after login. A valid, authorized `requested` redirect
// wins; otherwise fall back to the role's canonical landing. Unauthorized or unsafe requests never
// leak — they silently fall back.
export function resolvePostLoginDestination(requested: string | null | undefined, flags: AccessFlags): string {
  const sanitized = sanitizeRedirect(requested);
  if (sanitized && isPathAuthorized(sanitized, flags)) return sanitized;
  return defaultDestinationForRole(flags);
}
