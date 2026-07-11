import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';

export function AppHomePage() {
  const { profile, user } = useAuth();
  const { memberships } = useOrganizations();

  return (
    <CustomerAppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Kundenbereich</p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Ihr sicherer Cogniiq Zugang ist aktiv.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">
            Hier entstehen die geschuetzten Werkzeuge fuer Onboarding, KI-Rezeptionist, Wissensbasis und Konto.
            Inhalte erscheinen erst, wenn echte Kundendaten und echte Systeme verbunden sind.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatusTile icon={UserRound} label="Profil" value={profile ? 'Bereit' : 'Wird geladen'} />
            <StatusTile icon={Building2} label="Organisation" value={memberships.length ? `${memberships.length} aktiv` : 'Keine'} />
            <StatusTile icon={ShieldCheck} label="Rolle" value={profile?.platform_role ?? 'Wird geladen'} />
          </div>

          {memberships.length === 0 && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
                <Sparkles size={17} />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-gray-950">Noch kein KI-Rezeptionisten Workspace</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Eine normale Anmeldung erstellt noch keine Organisation und keine Produktdaten. Der Workspace wird
                erst nach ausdruecklicher Cogniiq Provisionierung aktiviert.
              </p>
              <Link
                to="/app/onboarding"
                className="mt-5 inline-flex rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-100"
              >
                Onboarding ansehen
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Profil</p>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-gray-400">Name</dt>
                <dd className="mt-1 font-medium text-gray-900">{profile?.full_name || 'Nicht gesetzt'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-400">E-Mail</dt>
                <dd className="mt-1 break-words font-medium text-gray-900">{profile?.email ?? user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-400">Rolle</dt>
                <dd className="mt-1 font-medium text-gray-900">{profile?.platform_role ?? 'Wird geladen'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Organisationen</p>
            {memberships.length ? (
              <div className="space-y-3">
                {memberships.map((membership) => (
                  <div key={membership.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{membership.organization?.name ?? 'Unbenannte Organisation'}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {membership.role} - {membership.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-gray-500">Noch keine Organisationsmitgliedschaft provisioniert.</p>
            )}
          </div>
        </aside>
      </div>
    </CustomerAppShell>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
        <Icon size={16} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
    </div>
  );
}
