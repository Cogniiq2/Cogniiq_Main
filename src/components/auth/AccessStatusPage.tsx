import { AlertTriangle, CreditCard, Loader2, Lock, LogOut, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import type { CustomerAccessState } from '@/lib/customerAccess';

const statusCopy: Record<Exclude<CustomerAccessState, 'unauthenticated' | 'active' | 'mfa_required'>, {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = {
  authenticated_without_organization: {
    eyebrow: 'Zugang wartet',
    title: 'Ihr Konto ist noch keiner Organisation zugeordnet.',
    description: 'Der Kundenbereich ist ein eingeladener Workspace. Cogniiq verbindet Ihr Konto nach Provisionierung mit der richtigen Organisation.',
    icon: Lock,
  },
  pending_payment: {
    eyebrow: 'Aktivierung ausstehend',
    title: 'Zahlung oder Vertragsfreigabe fehlt noch.',
    description: 'Sobald der Service freigeschaltet ist, erscheint Ihr Client Hub automatisch mit den gebuchten Systemen.',
    icon: CreditCard,
  },
  provisioning: {
    eyebrow: 'Provisionierung',
    title: 'Ihr Workspace wird eingerichtet.',
    description: 'Die technische Freischaltung läuft kontrolliert im Backend. Es werden keine Produktdaten simuliert.',
    icon: Loader2,
  },
  past_due: {
    eyebrow: 'Zahlung offen',
    title: 'Der Zugang ist wegen offener Abrechnung eingeschränkt.',
    description: 'Bitte klären Sie die Zahlung mit Cogniiq. Danach wird der Zugriff wieder freigeschaltet.',
    icon: AlertTriangle,
  },
  suspended: {
    eyebrow: 'Zugang pausiert',
    title: 'Dieser Workspace ist vorübergehend gesperrt.',
    description: 'Sensible Produktdaten bleiben geschützt, bis Cogniiq den Zugang wieder aktiviert.',
    icon: ShieldAlert,
  },
  cancelled: {
    eyebrow: 'Zugang beendet',
    title: 'Dieser Kundenbereich ist nicht mehr aktiv.',
    description: 'Produktdaten bleiben gesperrt. Für Reaktivierung oder Export wenden Sie sich bitte an Cogniiq.',
    icon: Lock,
  },
};

export function AccessStatusPage({ state }: { state: Exclude<CustomerAccessState, 'unauthenticated' | 'active' | 'mfa_required'> }) {
  const { signOut, profile, user } = useAuth();
  const copy = statusCopy[state];
  const Icon = copy.icon;

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-10 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
        <section className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
            <Icon size={20} aria-hidden="true" />
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{copy.eyebrow}</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-gray-950">{copy.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">{copy.description}</p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Konto</p>
              <p className="mt-1 font-semibold text-gray-900">{profile?.full_name || profile?.email || user?.email || 'Angemeldet'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Support</p>
              <a className="mt-1 block font-semibold text-gray-900 hover:text-gray-600" href="mailto:info@cogniiq.de">
                info@cogniiq.de
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:info@cogniiq.de"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Support kontaktieren
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
            >
              <LogOut size={15} aria-hidden="true" />
              Abmelden
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
