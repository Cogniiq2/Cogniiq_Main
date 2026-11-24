import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppButton, AppCard, AppEmptyState, AppErrorState, AppPageHeader, AppSkeleton, AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { IntakeWizard } from '@/components/app/setup/IntakeWizard';
import { MilestoneTimeline } from '@/components/app/setup/MilestoneTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { listMyOnboardings } from '@/lib/clientOnboarding/api';
import { INTAKE_STATUS_LABEL } from '@/lib/clientOnboarding/intake';
import type { CustomerIntakeSummary } from '@/lib/clientOnboarding/types';

/**
 * /app/setup and /app/setup/:engagementId — the customer's guided setup.
 * Which engagements a person may see is decided by the server (organization membership).
 */
export function SetupPage() {
  return (
    <CustomerAppShell>
      <SetupContent />
    </CustomerAppShell>
  );
}

function SetupContent() {
  const { engagementId } = useParams<{ engagementId?: string }>();
  const { isPlatformAdmin } = useAuth();
  const [items, setItems] = useState<CustomerIntakeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await listMyOnboardings();
    if (r.error) { setError(r.error.message); return; }
    setError(null);
    setItems(r.data ?? []);
  }, []);

  useEffect(() => { if (!engagementId) void load(); }, [engagementId, load]);

  const header = (
    <AppPageHeader eyebrow="Einrichtung" title="Ihr KI-Telefonassistent"
      description="Teilen Sie uns in fünf kurzen Schritten mit, wie Ihr Unternehmen arbeitet. Wir prüfen alles persönlich, bevor wir es verwenden." />
  );

  if (engagementId) return <>{header}<IntakeWizard engagementId={engagementId} /></>;
  if (error) return <>{header}<AppErrorState message={error} onRetry={() => void load()} /></>;
  if (!items) return <>{header}<AppSkeleton label="Ihre Einrichtung wird geladen" /></>;
  if (items.length === 0 && isPlatformAdmin) {
    // Cogniiq staff are not members of customer organizations, so the server shows them nothing
    // here. Say so instead of implying the customer has no setup.
    return (
      <>
        {header}
        <AppEmptyState icon={ClipboardList} title="Sie sind mit einem Cogniiq-Konto angemeldet"
          description="Die Einrichtung sehen nur Mitglieder der Kundenorganisation. Um den echten Ablauf zu prüfen, hinterlegen Sie eine eigene Test-Adresse als Kontakt des (Test-)Kunden, senden ihr die Einladung und melden sich in einem separaten Browserprofil mit diesem Testkonto an." />
      </>
    );
  }
  if (items.length === 0) {
    return (
      <>
        {header}
        <AppEmptyState icon={ClipboardList} title="Noch keine Einrichtung freigeschaltet"
          description="Sobald wir Ihr Projekt vorbereitet haben, finden Sie hier Ihren persönlichen Einrichtungsbereich. Sie erhalten dazu eine E-Mail von uns." />
      </>
    );
  }
  if (items.length === 1) return <>{header}<IntakeWizard engagementId={items[0].engagement_id} /></>;

  return (
    <>
      {header}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <AppCard key={it.engagement_id}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[14px] font-semibold text-[var(--cq-fg)]">{it.organization_name ?? it.company ?? 'Ihr Unternehmen'}</p>
              <AppStatusBadge label={INTAKE_STATUS_LABEL[it.intake_status]} tone={it.intake_status === 'changes_requested' ? 'attention' : 'neutral'} />
            </div>
            <div className="mt-4"><MilestoneTimeline milestones={it.milestones} orientation="horizontal" /></div>
            <div className="mt-4"><AppButton to={`/app/setup/${it.engagement_id}`} icon={ArrowRight}>Öffnen</AppButton></div>
          </AppCard>
        ))}
      </div>
    </>
  );
}
