import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';

import { Button, InfoBanner, Modal, StatusBadge, text, useToast } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { ServiceSelectionField } from '@/components/services/ServiceSelectionField';
import { convertLeadToCustomer } from '@/lib/ownerCrm/api';
import { missingIntegrationAnswers } from '@/lib/ownerCrm/nextActions';
import { SERVICE_BY_KEY } from '@/lib/serviceOnboarding/catalog';
import type { ConversionResult, LeadDetail } from '@/lib/ownerCrm/types';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';

/**
 * "In Kunde umwandeln".
 *
 * The server does the whole transaction; this dialog only chooses which services
 * to attach and reports what came back. Two things it deliberately does NOT do:
 *
 *   - it does not block on an unfinished pre-offer assessment. By the time a
 *     deal is won the scope is agreed; refusing to record the customer would
 *     only push the owner back into notes. It warns instead, and the same item
 *     reappears on the engagement.
 *   - it does not guard against double submission with a disabled button alone.
 *     The RPC is idempotent, so a second click lands on the same customer.
 */
export function ConvertLeadDialog({ open, onClose, detail, onConverted }: {
  open: boolean;
  onClose: () => void;
  detail: LeadDetail;
  onConverted: (result: ConversionResult) => void;
}) {
  const toast = useToast();
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setServices(detail.service_interests);
  }, [open, detail.service_interests]);

  const gateOpen = useMemo(
    () => (services.includes('ai_receptionist') ? missingIntegrationAnswers(detail.integration_check) : []),
    [services, detail.integration_check],
  );

  const alreadyConverted = detail.lead.converted_customer_id !== null;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const { result, error: err } = await convertLeadToCustomer(detail.lead.id, { services });
      if (err || !result) { setError(err ?? 'Die Umwandlung ist fehlgeschlagen.'); return; }
      toast.success(
        result.matched_existing ? 'Mit bestehendem Kunden verknüpft' : 'Kunde angelegt',
        result.services.some((s) => s.service_key === 'ai_receptionist' && s.engagement_id)
          ? 'Der AI-Receptionist-Onboarding-Workspace wurde angelegt.'
          : undefined,
      );
      onConverted(result);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="In Kunde umwandeln"
      description={`${detail.lead.display_name} wird als Kunde angelegt. Der Lead bleibt mit seiner gesamten Historie erhalten.`}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button onClick={() => void run()} loading={busy}>
            <ArrowRight size={15} aria-hidden="true" /> Umwandeln
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        {error ? <InfoBanner tone="danger" title="Nicht umgewandelt">{error}</InfoBanner> : null}

        {alreadyConverted ? (
          <InfoBanner tone="info" title="Bereits umgewandelt">
            Dieser Lead ist schon mit einem Kunden verknüpft. Ein erneutes Umwandeln legt keinen
            zweiten Kunden an — es ergänzt nur die ausgewählten Leistungen.
          </InfoBanner>
        ) : null}

        {gateOpen.length > 0 ? (
          <InfoBanner tone="warning" title="Schnittstellen-Prüfung noch nicht abgeschlossen">
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {gateOpen.map((m) => <li key={m}>{m}</li>)}
            </ul>
            <p className="mt-2">
              Die Umwandlung ist trotzdem möglich. Diese Punkte erscheinen anschließend als offene
              Aufgaben im Onboarding und blockieren dort den Go-Live.
            </p>
          </InfoBanner>
        ) : null}

        <ServiceSelectionField value={services} onChange={setServices} />

        {services.length === 0 ? (
          <p className={text.hint}>
            Ohne ausgewählte Leistung wird nur der Kundendatensatz angelegt. Leistungen lassen sich
            später jederzeit ergänzen.
          </p>
        ) : (
          <div className={cn('flex flex-wrap items-center gap-1.5', text.hint)}>
            <ShieldAlert size={13} aria-hidden="true" />
            <span>Angelegt werden:</span>
            {services.map((k) => (
              <StatusBadge
                key={k}
                label={SERVICE_BY_KEY[k]?.name ?? k}
                tone={SERVICE_BY_KEY[k]?.hasOnboarding ? 'info' : 'neutral'}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
