import { cn } from '@/lib/utils';
import { StatusBadge, text } from '@/components/dashboard';
import { SelectCard } from '@/components/services/servicePrimitives';
import { SERVICE_DEFINITIONS } from '@/lib/serviceOnboarding/catalog';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';

/**
 * "Welche Leistungen erhält dieser Kunde?" — the multi-select used when creating or editing a
 * customer.
 *
 * A customer receives one or more services simultaneously, so these are toggles, not a radio
 * group. Services that already have an onboarding workspace are locked in this control: removing
 * a service is an archival decision with consequences for existing work, and belongs on the
 * customer's service panel where the history is visible — not hidden inside a form.
 */
export function ServiceSelectionField({ value, onChange, locked = [], disabled }: {
  value: ServiceKey[];
  onChange: (next: ServiceKey[]) => void;
  /** Services already provisioned; shown as selected and not removable here. */
  locked?: ServiceKey[];
  disabled?: boolean;
}) {
  const toggle = (key: ServiceKey) => {
    if (locked.includes(key)) return;
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };

  return (
    <fieldset className="min-w-0">
      <legend className={cn('mb-1.5', text.label)}>Welche Leistungen erhält dieser Kunde?</legend>
      <p className={cn('mb-2.5', text.hint)}>
        Mehrfachauswahl möglich. Für den AI Receptionist wird beim Speichern automatisch der
        Onboarding-Workspace angelegt.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {SERVICE_DEFINITIONS.map((service) => {
          const Icon = service.icon;
          const isLocked = locked.includes(service.key);
          return (
            <SelectCard
              key={service.key}
              selected={value.includes(service.key)}
              onToggle={() => toggle(service.key)}
              disabled={disabled || isLocked}
              icon={<Icon size={15} />}
              title={service.name}
              description={service.description}
              badge={
                isLocked
                  ? <StatusBadge label="Aktiv" tone="success" />
                  : service.hasOnboarding
                    ? <StatusBadge label="Onboarding" tone="info" />
                    : undefined
              }
            />
          );
        })}
      </div>
      {locked.length > 0 ? (
        <p className={cn('mt-2', text.hint)}>
          Bereits aktive Leistungen lassen sich hier nicht entfernen. Pausieren oder archivieren
          Sie sie in der Leistungsübersicht des Kunden — die Onboarding-Historie bleibt dabei erhalten.
        </p>
      ) : null}
    </fieldset>
  );
}

export default ServiceSelectionField;
