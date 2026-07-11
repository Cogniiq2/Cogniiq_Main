import { Link } from 'react-router-dom';
import {
  BookOpen,
  CreditCard,
  FileText,
  Headphones,
  Mic2,
  Phone,
  Settings,
  TestTube2,
  UserPlus,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import { useOrganizations } from '@/hooks/useOrganizations';

export type CustomerSection =
  | 'onboarding'
  | 'receptionist'
  | 'knowledge'
  | 'phone'
  | 'test'
  | 'calls'
  | 'leads'
  | 'billing'
  | 'settings';

const sectionConfig: Record<CustomerSection, {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  status: string;
}> = {
  onboarding: {
    title: 'Onboarding',
    eyebrow: 'Einrichtung',
    description: 'Hier wird spaeter die strukturierte Einrichtung Ihres KI-Rezeptionisten gefuehrt.',
    icon: Wand2,
    status: 'Noch nicht gestartet',
  },
  receptionist: {
    title: 'KI-Rezeptionist',
    eyebrow: 'Workspace',
    description: 'Der operative Rezeptionisten-Bereich wird angezeigt, sobald ein Workspace bereitgestellt wurde.',
    icon: Headphones,
    status: 'Wartet auf Provisionierung',
  },
  knowledge: {
    title: 'Wissensbasis',
    eyebrow: 'Antwortgrundlage',
    description: 'Noch keine Kundeninformationen hinterlegt. Inhalte werden erst angezeigt, wenn echte Daten existieren.',
    icon: BookOpen,
    status: 'Keine Daten hinterlegt',
  },
  phone: {
    title: 'Telefon',
    eyebrow: 'Anbindung',
    description: 'Telefonnummern und Weiterleitungen erscheinen hier erst nach technischer Einrichtung.',
    icon: Phone,
    status: 'Nicht verbunden',
  },
  test: {
    title: 'Testen',
    eyebrow: 'Qualitaet',
    description: 'Testlaeufe werden erst verfuegbar, wenn ein echter Rezeptionisten-Workspace existiert.',
    icon: TestTube2,
    status: 'Nicht verfuegbar',
  },
  calls: {
    title: 'Anrufe',
    eyebrow: 'Verlauf',
    description: 'Es werden keine Beispielanrufe angezeigt. Der Verlauf bleibt leer, bis echte Anrufdaten vorliegen.',
    icon: Mic2,
    status: 'Keine Anrufdaten',
  },
  leads: {
    title: 'Leads',
    eyebrow: 'Kontakte',
    description: 'Lead-Daten werden erst angezeigt, wenn echte Kontakte im System erfasst wurden.',
    icon: UserPlus,
    status: 'Keine Leads',
  },
  billing: {
    title: 'Abrechnung',
    eyebrow: 'Konto',
    description: 'Plan- und Zahlungsdaten werden hier erst angezeigt, wenn eine echte Abrechnung verbunden ist.',
    icon: CreditCard,
    status: 'Keine Abrechnungsdaten',
  },
  settings: {
    title: 'Einstellungen',
    eyebrow: 'Profil',
    description: 'Kontoeinstellungen bleiben bewusst schlank, bis weitere echte Profil- und Organisationsfelder aktiv sind.',
    icon: Settings,
    status: 'Basisprofil aktiv',
  },
};

export function CustomerSectionPage({ section }: { section: CustomerSection }) {
  const config = sectionConfig[section];
  const Icon = config.icon;
  const { memberships } = useOrganizations();

  return (
    <CustomerAppShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
            <Icon size={20} />
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{config.eyebrow}</p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{config.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">{config.description}</p>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
              <FileText size={17} />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-gray-950">Ehrlicher Leerzustand</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Dieser Bereich zeigt erst Inhalte, wenn reale Kundendaten, echte Provisionierung oder verbundene Systeme vorhanden sind.
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Status</p>
            <p className="text-sm font-semibold text-gray-950">{config.status}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {memberships.length
                ? 'Eine Organisation ist verbunden. Produktdaten werden erst nach echter Einrichtung angezeigt.'
                : 'Noch keine Organisation verbunden.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Navigation</p>
            <div className="space-y-2">
              <Link
                to="/app"
                className="block rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                Zur Uebersicht
              </Link>
              <Link
                to="/"
                className="block rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                Zur Website
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </CustomerAppShell>
  );
}
