import { Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppButton,
  AppEmptyState,
  AppErrorState,
  AppPreviewNotice,
  AppSkeleton,
} from '@/components/app/CustomerAppPrimitives';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { resolveImplementation } from '@/lib/solutions/registry';

export function SolutionPage() {
  return (
    <CustomerAppShell>
      <SolutionGuardedContent />
    </CustomerAppShell>
  );
}

function SolutionGuardedContent() {
  const { instanceKey } = useParams<{ instanceKey: string }>();
  const { solutions, status, error, reload } = useOrganizationSolutions();

  if (status === 'loading') {
    return <AppSkeleton label="Lösung wird geladen" />;
  }
  if (status === 'error') {
    return <AppErrorState message={error ?? 'Die Lösung konnte nicht geladen werden.'} onRetry={() => void reload()} />;
  }
  if (status === 'no-organization') {
    // No active organization / membership -> never reveal solution surfaces.
    return <Navigate to="/app" replace />;
  }

  // The solution must belong to an organization the user actively belongs to. Because RLS only
  // returns solutions for organizations the user is an active member of, membership + ownership are
  // both enforced by simply looking the instance up in the loaded, access-checked list.
  const solution = solutions.find((item) => item.instance_key === instanceKey) ?? null;

  if (!solution) {
    return <AccessDenied />;
  }

  // Status gate.
  if (solution.status === 'disabled') {
    return <AccessDenied />;
  }

  const implementation = resolveImplementation(solution.implementation_key);
  const Landing = implementation.Landing;

  return (
    <div className="space-y-6">
      {solution.status === 'paused' ? (
        <AppPreviewNotice>
          Diese Lösung ist derzeit pausiert. Inhalte werden angezeigt, sind aber vorübergehend nicht aktiv.
        </AppPreviewNotice>
      ) : null}
      {solution.status === 'provisioning' ? (
        <AppPreviewNotice>
          Diese Lösung wird gerade eingerichtet. Einige Bereiche sind möglicherweise noch nicht verfügbar.
        </AppPreviewNotice>
      ) : null}
      <Suspense fallback={<AppSkeleton label="Modul wird geladen" />}>
        <Landing solution={solution} />
      </Suspense>
    </div>
  );
}

function AccessDenied() {
  return (
    <AppEmptyState
      icon={ShieldAlert}
      title="Kein Zugriff auf diese Lösung"
      description="Diese Lösung gehört nicht zu Ihrer aktiven Organisation oder ist nicht verfügbar. Direkter Aufruf über die URL wird bewusst blockiert."
      action={<AppButton to="/app">Zurück zur Übersicht</AppButton>}
    />
  );
}
