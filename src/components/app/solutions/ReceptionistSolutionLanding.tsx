import { Headphones, Phone, Wand2 } from 'lucide-react';

import { AppButton, AppCard, AppSection, AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import type { SolutionLandingProps } from '@/lib/solutions/registry';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';

// The receptionist product UI already exists under /app/onboarding, /app/receptionist and /app/phone.
// This landing presents the solution and links into that existing, unchanged module.
export default function ReceptionistSolutionLanding({ solution }: SolutionLandingProps) {
  const status = solutionStatusDisplay(solution.status);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
                <Headphones size={20} aria-hidden="true" />
              </span>
              <AppStatusBadge label={status.label} tone={status.tone} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{solution.display_name}</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-gray-500">
              Ihr KI-Rezeptionist. Richten Sie Unternehmensdaten, Verhalten und Telefonanbindung ein.
              Gespeicherte Daten bleiben erhalten und werden hier zusammengeführt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AppButton to="/app/onboarding" icon={Wand2}>Einrichtung öffnen</AppButton>
              <AppButton to="/app/receptionist" variant="secondary" icon={Headphones}>Rezeptionist</AppButton>
              <AppButton to="/app/phone" variant="secondary" icon={Phone}>Telefon</AppButton>
            </div>
          </div>
        </div>
      </div>

      <AppSection eyebrow="Bereiche" title="Alles für den KI-Rezeptionisten">
        <div className="grid gap-3 md:grid-cols-3">
          <SolutionTile to="/app/onboarding" icon={Wand2} title="Einrichtung" text="Unternehmensdaten, Ziele und Fortschritt dauerhaft speichern." />
          <SolutionTile to="/app/receptionist" icon={Headphones} title="Rezeptionist" text="Identität, Sprache, Tonalität und Regeln festlegen." />
          <SolutionTile to="/app/phone" icon={Phone} title="Telefon" text="Nummern, Weiterleitung und Eskalation sauber trennen." />
        </div>
      </AppSection>
    </div>
  );
}

function SolutionTile({ to, icon: Icon, title, text }: { to: string; icon: typeof Wand2; title: string; text: string }) {
  return (
    <AppCard className="shadow-none">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
        <Icon size={16} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{text}</p>
      <div className="mt-4">
        <AppButton to={to} variant="text">Öffnen</AppButton>
      </div>
    </AppCard>
  );
}
