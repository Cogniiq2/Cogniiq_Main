import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { AppButton } from '@/components/app/CustomerAppPrimitives';
import { listMyOnboardings } from '@/lib/clientOnboarding/api';

/**
 * Shown above the earlier self-service onboarding form when this person already has a guided,
 * reviewed setup. The old form keeps working (its data is only used as a prefill suggestion),
 * but the guided setup is where Cogniiq reads and confirms the information.
 */
export function LegacyOnboardingNotice() {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void listMyOnboardings().then((r) => {
      if (!alive || r.error || !r.data?.length) return;
      setHref(r.data.length === 1 ? `/app/setup/${r.data[0].engagement_id}` : '/app/setup');
    });
    return () => { alive = false; };
  }, []);
  if (!href) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--cq-border-strong)] bg-[var(--cq-sunken)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[var(--cq-fg)]">Ihre Einrichtung läuft jetzt über den geführten Einrichtungsbereich</p>
        <p className="mt-0.5 text-[12.5px] leading-5 text-[var(--cq-fg-muted)]">
          Dort prüfen wir Ihre Angaben persönlich. Was Sie hier bereits eingetragen haben, wird Ihnen dort als Vorschlag angezeigt.
        </p>
      </div>
      <AppButton to={href} icon={ArrowRight}>Zur Einrichtung</AppButton>
    </div>
  );
}
