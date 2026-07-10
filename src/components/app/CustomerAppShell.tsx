import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';

export function CustomerAppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const hasMultipleOrganizations = memberships.length > 1;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/app" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold shadow-sm">
                C
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">Cogniiq</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Customer App</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 border-l border-gray-200 pl-4 md:flex">
              <Link
                to="/app"
                className="rounded-xl bg-gray-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Foundation
              </Link>
            </nav>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {hasMultipleOrganizations && (
              <select
                value={activeOrganizationId ?? ''}
                onChange={(event) => setActiveOrganizationId(event.target.value || null)}
                className="max-w-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-400"
              >
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.organization_id}>
                    {membership.organization?.name ?? 'Unnamed organization'}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <UserRound size={14} className="text-gray-400" />
              <span className="max-w-[180px] truncate text-sm font-medium text-gray-700">
                {profile?.full_name || profile?.email || user?.email}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-950"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 md:hidden"
            aria-label="Toggle app navigation"
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
            <Link
              to="/app"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl bg-gray-950 px-3.5 py-2 text-sm font-semibold text-white"
            >
              Foundation
            </Link>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">{profile?.full_name || user?.email}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <ShieldCheck size={16} className="flex-shrink-0" />
          Supabase Auth and tenant-scoped RLS are the security boundary for this app.
        </div>
        {children}
      </main>
    </div>
  );
}
