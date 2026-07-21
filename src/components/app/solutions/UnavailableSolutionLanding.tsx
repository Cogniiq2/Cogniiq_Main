import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

import { AppEmptyState } from '@/components/app/CustomerAppPrimitives';
import type { SolutionLandingProps } from '@/lib/solutions/registry';

// Safe fallback for unknown or not-yet-implemented implementation keys.
export default function UnavailableSolutionLanding({ solution }: SolutionLandingProps) {
  return (
    <AppEmptyState
      icon={Construction}
      title={`${solution.display_name} ist noch nicht verfügbar`}
      description="Diese Lösung ist Ihrem Konto zugeordnet, aber die passende Oberfläche ist in dieser Version noch nicht freigeschaltet. Ihr Zugang und Ihre Daten bleiben unverändert."
      action={
        <Link
          to="/app"
          className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Zurück zur Übersicht
        </Link>
      }
    />
  );
}
