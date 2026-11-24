import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AppButton, AppCard, AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import { text } from '@/components/dashboard/tokens';
import { MilestoneTimeline } from '@/components/app/setup/MilestoneTimeline';
import { listMyOnboardings } from '@/lib/clientOnboarding/api';
import { INTAKE_STATUS_LABEL } from '@/lib/clientOnboarding/intake';
import type { CustomerIntakeSummary } from '@/lib/clientOnboarding/types';

/**
 * Home-page entry to the guided setup. Renders nothing unless the server reports a setup this
 * person can see; a failed or missing backend is silent here (the setup page reports it).
 */
export function SetupHomeCard() {
  const [items, setItems] = useState<CustomerIntakeSummary[]>([]);
  useEffect(() => {
    let alive = true;
    void listMyOnboardings().then((r) => { if (alive && !r.error) setItems(r.data ?? []); });
    return () => { alive = false; };
  }, []);

  const item = items.find((i) => i.intake_status !== 'approved' || i.open_requests > 0) ?? null;
  if (!item) return null;

  const needsAction = item.intake_status === 'not_started' || item.intake_status === 'in_progress'
    || item.intake_status === 'changes_requested' || item.open_requests > 0;
  const title = item.open_requests > 0 ? 'Wir haben eine Rückfrage an Sie'
    : item.intake_status === 'not_started' ? 'Ihre Einrichtung kann beginnen'
    : item.intake_status === 'in_progress' ? 'Setzen Sie Ihre Einrichtung fort'
    : item.intake_status === 'changes_requested' ? 'Bitte ergänzen Sie einige Angaben'
    : 'Ihre Angaben werden geprüft';
  const href = items.length > 1 ? '/app/setup' : `/app/setup/${item.engagement_id}`;

  return (
    <AppCard className={cn(needsAction && 'border-[var(--cq-border-strong)]')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={text.eyebrow}>KI-Telefonassistent · Einrichtung</p>
          <p className={cn('mt-1', text.cardTitle)}>{title}</p>
        </div>
        <AppStatusBadge label={INTAKE_STATUS_LABEL[item.intake_status]} tone={needsAction ? 'attention' : 'working'} />
      </div>
      <div className="mt-4"><MilestoneTimeline milestones={item.milestones} orientation="horizontal" /></div>
      <div className="mt-4">
        <AppButton to={href} icon={ArrowRight} variant={needsAction ? 'primary' : 'secondary'}>
          {needsAction ? 'Zur Einrichtung' : 'Stand ansehen'}
        </AppButton>
      </div>
    </AppCard>
  );
}
