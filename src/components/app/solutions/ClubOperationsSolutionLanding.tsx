// Club Operations, hosted inside the Cogniiq customer portal.
//
// This file is the whole of the integration. Everything it needs already existed:
//
//   * `SolutionPage` has resolved the instance against the organization's RLS-filtered solution
//     list before this component is constructed, so reaching it at all is proof of membership.
//   * `ClubOperationsModule` was written to render inside a host shell — no sidebar, no account
//     menu, no organization switcher of its own — so it drops into `CustomerAppShell` unchanged.
//   * `/app/solutions/:instanceKey/*` already carries a splat, so the module's sections map onto
//     real URLs without a route table change.
//
// What this adds is the join: URL segment ↔ module section, and the choice of adapter. Nothing in
// the module's own logic, formatting, aggregation or error vocabulary is touched.

import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AppPreviewNotice } from '@/components/app/CustomerAppPrimitives';
import { createClubOperationsBrowserTransport } from '@/lib/gateway/clubOperationsBrowserTransport';
import { resolveClubOperationsDataSource } from '@/lib/solutions/clubOperationsDataSource';
import { sectionFromSplat } from '@/lib/solutions/clubOperationsSection';
import type { SolutionLandingProps } from '@/lib/solutions/registry';
import { ClubOperationsModule } from '@/solutions/club-operations/ClubOperationsModule';
import type { ClubOperationsAdapter } from '@/solutions/club-operations/adapter/ClubOperationsAdapter';
import { createFixtureAdapter } from '@/solutions/club-operations/adapter/fixtureAdapter';
import { createTransportAdapter } from '@/solutions/club-operations/adapter/transportAdapter';
import {
  defaultClubOperationsSection,
  type ClubOperationsSectionId,
} from '@/solutions/club-operations/navigation';

export default function ClubOperationsSolutionLanding({ solution }: SolutionLandingProps) {
  const navigate = useNavigate();
  const params = useParams();
  const active = sectionFromSplat(params['*']);

  const dataSource = resolveClubOperationsDataSource(solution.config);

  // Rebuilt only when the instance or its data source changes. The module treats the adapter as an
  // effect dependency, so a new object on every render would refetch every section forever.
  const adapter = useMemo<ClubOperationsAdapter>(
    () =>
      dataSource === 'demo'
        ? createFixtureAdapter()
        : createTransportAdapter({
            transport: createClubOperationsBrowserTransport(),
            id: `gateway:${solution.id}`,
          }),
    [dataSource, solution.id],
  );

  const handleSectionChange = useCallback(
    (next: ClubOperationsSectionId) => {
      const suffix = next === defaultClubOperationsSection ? '' : `/${next}`;
      navigate(`/app/solutions/${solution.instance_key}${suffix}`);
    },
    [navigate, solution.instance_key],
  );

  return (
    <div className="space-y-4">
      {dataSource === 'demo' ? (
        <AppPreviewNotice>
          Dieser Bereich zeigt derzeit Beispieldaten zur Ansicht der Oberfläche. Es handelt sich
          nicht um Ihre echten Betriebszahlen. Sobald die Datenanbindung freigeschaltet ist,
          erscheinen hier automatisch Ihre tatsächlichen Werte.
        </AppPreviewNotice>
      ) : null}
      <ClubOperationsModule
        adapter={adapter}
        section={active}
        onSectionChange={handleSectionChange}
      />
    </div>
  );
}
