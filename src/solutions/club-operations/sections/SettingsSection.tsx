// Club Operations — Einstellungen.
//
// Strictly read-only. There is no form control, no toggle and no save button anywhere in this
// section — not a disabled one either, since a greyed-out button still implies the value is
// editable here, which it is not.
//
// Values are fictional and descriptive. No URL, key, identifier, endpoint or contact address is
// displayed, and the domain type has no field capable of carrying one.
//
// Composition: configuration is reference material, so it is laid out as reference material — a
// definition list per group with the value right-aligned in a consistent column, and the permission
// matrix given the full width it needs. Read-only status is stated once at the top rather than
// implied by the absence of controls, because an absence is not something a reader notices.

import { Fragment } from 'react';
import { Check, Lock, Minus } from 'lucide-react';

import { InfoBanner } from '@/components/dashboard/primitives';
import { border, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { Panel, SectionShell } from '../components/SectionShell';
import type { SettingsSnapshot } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

export function SettingsSection({ adapter }: { adapter: ClubOperationsAdapter }) {
  const resource = useClubOperationsResource<SettingsSnapshot>(
    () => adapter.getSettings(),
    [adapter],
  );

  return (
    <SectionShell
      title="Einstellungen"
      description="Konfiguration und Rollenberechtigungen — vollständig schreibgeschützt."
      resource={resource}
      loadingLabel="Einstellungen werden geladen"
      errorTitle="Einstellungen konnten nicht geladen werden"
      loadingShape="metrics"
      notice="Diese Ansicht zeigt Beispielkonfiguration. Werte können hier nicht geändert werden."
    >
      {(settings) => (
        <div className={space.pageGap}>
          <InfoBanner tone="info" title="Nur-Lese-Ansicht">
            Die hier gezeigten Werte sind Beispieldaten und dienen der Darstellung des Aufbaus.
            Änderungen an der Konfiguration erfolgen in einer späteren Ausbaustufe und nur über eine
            serverseitig geprüfte Berechtigung.
          </InfoBanner>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {settings.groups.map((group) => (
              <Panel key={group.id} title={group.label} description={group.description}>
                <dl className="divide-y divide-[var(--cq-border-subtle)]">
                  {group.entries.map((entry) => (
                    <div key={entry.key} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <dt className={cn('shrink-0', text.eyebrow)}>{entry.label}</dt>
                        <dd className={cn('min-w-0 text-right tabular-nums', text.bodyStrong)}>
                          {entry.value}
                        </dd>
                      </div>
                      {entry.hint ? <p className={cn('mt-0.5', text.hint)}>{entry.hint}</p> : null}
                    </div>
                  ))}
                </dl>
              </Panel>
            ))}
          </div>

          {/* Roles, spelled out before the matrix. A column header alone does not say what a role is. */}
          <Panel
            title="Rollen"
            description="Welche Rollen im Vereinsbetrieb vorgesehen sind."
          >
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {settings.roles.map((role) => (
                <div
                  key={role.id}
                  className={cn('min-w-0 p-3', radius.lg, border.hairline, 'bg-[var(--cq-sunken)]')}
                >
                  <dt className={text.bodyStrong}>{role.label}</dt>
                  <dd className={cn('mt-1', text.hint)}>{role.description}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel
            title="Berechtigungen"
            description="Welche Rolle welchen Bereich einsehen und bearbeiten darf."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 720 }}>
                <caption className="sr-only">Berechtigungen je Rolle</caption>
                <thead>
                  <tr className={cn('bg-[var(--cq-surface)]', border.hairlineB)}>
                    <th scope="col" className={cn('py-2.5 pr-4', text.eyebrow)}>Berechtigung</th>
                    {settings.roles.map((role) => (
                      <th key={role.id} scope="col" className={cn('px-3 py-2.5 text-center', text.eyebrow)}>
                        {role.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settings.permissionGroups.map((group) => (
                    // Keyed Fragment: a bare <> cannot carry a key, and each group emits two rows.
                    <Fragment key={group.id}>
                      <tr>
                        <th
                          scope="colgroup"
                          colSpan={settings.roles.length + 1}
                          className={cn(
                            'bg-[var(--cq-sunken)] px-3 py-1.5 text-left',
                            border.hairlineB,
                            border.subtle,
                            text.eyebrow,
                          )}
                        >
                          {group.label}
                        </th>
                      </tr>
                      {group.permissions.map((permission) => (
                        <tr
                          key={permission.key}
                          className="border-b border-[var(--cq-border-subtle)] last:border-0"
                        >
                          <th scope="row" className="py-2.5 pr-4 text-[13px] font-normal leading-5 text-[var(--cq-fg)]">
                            {permission.label}
                          </th>
                          {settings.roles.map((role) => {
                            const granted = permission.grants[role.id] ?? false;
                            return (
                              <td key={role.id} className="px-3 py-2.5 text-center">
                                {granted ? (
                                  <Check size={14} className="mx-auto text-emerald-600" aria-label="erlaubt" />
                                ) : (
                                  <Minus size={14} className="mx-auto text-[var(--cq-fg-subtle)]" aria-label="nicht erlaubt" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <p
              className={cn(
                'mt-4 flex items-start gap-2 p-3',
                radius.lg,
                border.hairline,
                surface.card,
                text.hint,
              )}
            >
              <Lock size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Die tatsächliche Rolle wird künftig serverseitig aus der Organisationszugehörigkeit
                abgeleitet und bei jedem Zugriff erneut geprüft. Diese Tabelle beschreibt das
                vorgesehene Modell, sie erteilt keine Berechtigung.
              </span>
            </p>
          </Panel>
        </div>
      )}
    </SectionShell>
  );
}
