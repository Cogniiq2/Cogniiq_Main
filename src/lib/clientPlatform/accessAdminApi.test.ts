import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// The real client throws without VITE_* env vars; these assertions are about the source text.
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));

const { ACCESS_ADMIN_RPCS } = await import('./accessAdminApi');

// The owner role-management UI must reach the database ONLY through the approved SECURITY DEFINER
// RPCs. A raw table mutation from the browser would be refused by RLS anyway, but keeping the
// authorization in one place is what makes it auditable — so the boundary is asserted statically.

const SRC = resolve(process.cwd(), 'src');

function read(relative: string): string {
  return readFileSync(resolve(SRC, relative), 'utf8');
}

const API = read('lib/clientPlatform/accessAdminApi.ts');
const UI = read('pages/admin/clients/AccessRolesSection.tsx');

describe('owner role-management UI calls only approved RPCs', () => {
  it('invokes no RPC outside the approved list', () => {
    const invoked = [...API.matchAll(/supabase\.rpc\(\s*'([^']+)'/g)].map((match) => match[1]);
    expect(invoked.length).toBeGreaterThan(0);
    for (const name of invoked) {
      expect(ACCESS_ADMIN_RPCS).toContain(name as (typeof ACCESS_ADMIN_RPCS)[number]);
    }
  });

  it('covers every approved RPC exactly once', () => {
    const invoked = [...API.matchAll(/supabase\.rpc\(\s*'([^']+)'/g)].map((match) => match[1]);
    expect([...invoked].sort()).toEqual([...ACCESS_ADMIN_RPCS].sort());
  });

  it('performs no raw table read or mutation against an authorization table', () => {
    expect(API).not.toContain('supabase.from(');
    for (const table of [
      'organization_roles',
      'organization_role_capabilities',
      'organization_member_roles',
      'client_invitation_roles',
      'capabilities',
    ]) {
      expect(API).not.toContain(`from('${table}')`);
      expect(UI).not.toContain(`from('${table}')`);
    }
  });

  it('keeps the UI free of any direct Supabase access', () => {
    // The section talks to accessAdminApi only; it never holds a Supabase client itself.
    expect(UI).not.toContain('supabase.rpc');
    expect(UI).not.toContain('supabase.from');
    expect(UI).not.toContain("from '@/lib/supabase'");
  });

  it('requires an explicit confirmation before access is removed', () => {
    // Removal must not be a single unguarded click.
    expect(UI).toContain('alertdialog');
    expect(UI).toContain('Zugriff entziehen?');
    expect(UI).toContain('setConfirmRemoval');
  });

  it('has loading, empty, error, retry and success states', () => {
    expect(UI).toContain('animate-pulse');
    expect(UI).toContain('role="alert"');
    expect(UI).toContain('Erneut versuchen');
    expect(UI).toContain('role="status"');
    expect(UI).toContain('hat noch keine Mitglieder');
    expect(UI).toContain('Keine offenen Einladungen');
  });
});

describe('no per-customer conditionals anywhere in the access model', () => {
  const files = [
    'lib/portalAccess/navigation.ts',
    'lib/portalAccess/capabilities.ts',
    'lib/portalAccess/types.ts',
    'contexts/PortalAccessContext.tsx',
    'components/app/CapabilityRoute.tsx',
    'components/app/CapabilityGate.tsx',
    'lib/clientPlatform/accessAdminApi.ts',
    'pages/admin/clients/AccessRolesSection.tsx',
  ];

  it('hard-codes no email address', () => {
    for (const file of files) {
      expect(read(file)).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    }
  });

  it('hard-codes no organization UUID', () => {
    for (const file of files) {
      expect(read(file)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    }
  });

  it('never branches on an organization name', () => {
    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(/organization(\w*)\.name\s*===/i);
      expect(source).not.toMatch(/organizationName\s*===/i);
      expect(source).not.toMatch(/Heinersreuth/i);
      expect(source).not.toMatch(/Pankofer/i);
    }
  });
});
