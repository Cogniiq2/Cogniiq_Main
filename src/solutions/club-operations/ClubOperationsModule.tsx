// Club Operations — module shell.
//
// Renders *inside* whatever authenticated Cogniiq shell hosts it. It provides no page chrome of its
// own — no sidebar, no account menu, no organisation switcher — because those belong to the
// surrounding shell and duplicating them would produce a second navigation system competing with the
// customer portal's. What it does own is the module's own header: which dataset, which period, how
// fresh, how healthy, and the internal navigation.
//
// Reachability: nothing in the production route tree imports this file. The solution registry
// continues to resolve `club_operations` to the shared unavailable fallback, so the module cannot
// be reached by guessing a URL. It is wired up in a later phase, together with the authenticated
// server-side gateway that will supply its data.

import { useCallback, useMemo, useState } from 'react';

import { space } from '@/components/dashboard/tokens';

import type { ClubOperationsAdapter } from './adapter/ClubOperationsAdapter';
import { ModuleHeader } from './components/ModuleHeader';
import { ModuleNav } from './components/ModuleNav';
import {
  clubOperationsNavGroups,
  defaultClubOperationsSection,
  type ClubOperationsSectionId,
} from './navigation';
import { overviewPeriodLabels } from './labels';
import { ActivitySection } from './sections/ActivitySection';
import { AlertsSection } from './sections/AlertsSection';
import { BookingsSection } from './sections/BookingsSection';
import { InvoicesSection } from './sections/InvoicesSection';
import { MembersSection } from './sections/MembersSection';
import { MonthlyReportsSection } from './sections/MonthlyReportsSection';
import { OverviewSection } from './sections/OverviewSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { ReconciliationSection } from './sections/ReconciliationSection';
import { ReportsSection } from './sections/ReportsSection';
import { SettingsSection } from './sections/SettingsSection';
import { VouchersSection } from './sections/VouchersSection';
import type { AttentionTarget, OverviewPeriod, OverviewSnapshot } from './types';
import { useClubOperationsResource } from './useClubOperationsResource';

export interface ClubOperationsModuleProps {
  adapter: ClubOperationsAdapter;
  /** Controlled section, for hosts that map sections onto their own routing. */
  section?: ClubOperationsSectionId;
  onSectionChange?: (section: ClubOperationsSectionId) => void;
  initialSection?: ClubOperationsSectionId;
}

/**
 * A pending drill-down.
 *
 * `nonce` exists so that opening the same target twice still re-seeds the section. Without it the
 * second click on an attention row would be a no-op if the reader had since changed the filters.
 */
interface Focus {
  section: ClubOperationsSectionId;
  filter: Record<string, string>;
  nonce: number;
}

export function ClubOperationsModule({
  adapter,
  section,
  onSectionChange,
  initialSection = defaultClubOperationsSection,
}: ClubOperationsModuleProps) {
  const [uncontrolled, setUncontrolled] = useState<ClubOperationsSectionId>(initialSection);
  const active = section ?? uncontrolled;

  const [period, setPeriod] = useState<OverviewPeriod>('month');
  const [focus, setFocus] = useState<Focus | null>(null);

  // Fetched once here rather than inside the overview section, so the header's health summary and
  // the overview's attention list are the same object. Two fetches could disagree; one cannot.
  const overview = useClubOperationsResource<OverviewSnapshot>(
    () => adapter.getOverview({ period }),
    [adapter, period],
  );
  const snapshot = overview.data;

  const selectSection = useCallback(
    (next: ClubOperationsSectionId) => {
      if (section === undefined) setUncontrolled(next);
      onSectionChange?.(next);
    },
    [section, onSectionChange],
  );

  /** Open a section with a filter already applied, from the attention model or a metric card. */
  const openTarget = useCallback(
    (target: AttentionTarget) => {
      setFocus((previous) => ({
        section: target.section,
        filter: target.filter ?? {},
        nonce: (previous?.nonce ?? 0) + 1,
      }));
      selectSection(target.section);
    },
    [selectSection],
  );

  // A seeded query only applies to the section it was aimed at, and only until the reader navigates
  // somewhere else of their own accord.
  const seeded = focus?.section === active ? focus : null;
  const seededQuery = seeded?.filter;
  const sectionKey = `${active}#${seeded?.nonce ?? 0}`;

  /**
   * Counts worth carrying on the navigation itself. Derived from the same snapshot as everything
   * else, so a badge can never claim a number the section it points at would not show.
   */
  const badges = useMemo(() => {
    if (!snapshot) return undefined;
    return {
      alerts: snapshot.openAlerts.reduce((total, entry) => total + entry.count, 0),
      reconciliation: snapshot.reconciliation.openReview,
      invoices: snapshot.invoices.overdue,
    } satisfies Partial<Record<ClubOperationsSectionId, number>>;
  }, [snapshot]);

  return (
    <div className={space.pageGap}>
      <ModuleHeader
        bounds={snapshot?.bounds ?? null}
        periodLabel={overviewPeriodLabels[period]}
        dataAsOf={snapshot?.dataAsOf ?? '2026-03-31'}
        health={snapshot?.health ?? null}
        nav={<ModuleNav active={active} onSelect={selectSection} badges={badges} />}
      />

      <p className="sr-only" aria-live="polite">
        {sectionLabel(active)}
      </p>

      <div key={sectionKey}>
        {active === 'overview' ? (
          <OverviewSection
            resource={overview}
            period={period}
            onPeriodChange={setPeriod}
            onOpenTarget={openTarget}
          />
        ) : null}
        {active === 'bookings' ? <BookingsSection adapter={adapter} /> : null}
        {active === 'alerts' ? <AlertsSection adapter={adapter} seededQuery={seededQuery} /> : null}
        {active === 'payments' ? <PaymentsSection adapter={adapter} seededQuery={seededQuery} /> : null}
        {active === 'invoices' ? <InvoicesSection adapter={adapter} seededQuery={seededQuery} /> : null}
        {active === 'reconciliation' ? (
          <ReconciliationSection adapter={adapter} seededQuery={seededQuery} />
        ) : null}
        {active === 'vouchers' ? <VouchersSection adapter={adapter} seededQuery={seededQuery} /> : null}
        {active === 'reports' ? <ReportsSection adapter={adapter} /> : null}
        {active === 'monthly-reports' ? <MonthlyReportsSection adapter={adapter} /> : null}
        {active === 'activity' ? <ActivitySection adapter={adapter} seededQuery={seededQuery} /> : null}
        {active === 'members' ? <MembersSection adapter={adapter} seededQuery={seededQuery} /> : null}
        {active === 'settings' ? <SettingsSection adapter={adapter} /> : null}
      </div>
    </div>
  );
}

function sectionLabel(id: ClubOperationsSectionId): string {
  for (const group of clubOperationsNavGroups) {
    const item = group.items.find((candidate) => candidate.id === id);
    if (item) return `${item.label} — ${item.description}`;
  }
  return '';
}
