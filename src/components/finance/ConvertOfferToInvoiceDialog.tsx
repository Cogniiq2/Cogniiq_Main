import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

import { Modal, Button, StatusBadge, useToast } from '@/components/dashboard';
import { formatCents } from '@/lib/clientPlatform/validation';
import { milestoneAmountCents } from '@/lib/ownerFinance/documents/documentModel';
import {
  convertOfferToInvoiceDraft, loadInvoicesForOffer, type OfferLinkedInvoiceRef,
} from '@/lib/ownerFinance/offersApi';
import type { OfferPaymentMilestone, OwnerOffer } from '@/lib/ownerFinance/types';

// "Rechnung aus Angebot erstellen" — lets the owner choose WHAT to invoice from the one-time
// amount, instead of the conversion silently creating a draft for the full amount while a 50/50
// payment plan sits next to it unused. Recurring positions never appear here at all: they are a
// separate billing track, excluded by the RPC regardless of what is chosen below.
//
// Deliberately no instalment-schedule engine: this does not track how much of the plan has been
// invoiced. It lists invoices already created from this offer (owner_invoices.source_offer_id) so
// a human notices "Rate 1" was already billed before choosing it again — visibility, not
// enforcement, per the explicit smallest-robust-solution instruction.

const invoiceStatusLabel: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilweise bezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};

type Choice = { kind: 'full' } | { kind: 'milestone'; index: number };

export function ConvertOfferToInvoiceDialog({ open, offer, oneTimeNetCents, onClose, onDone }: {
  open: boolean;
  offer: OwnerOffer | null;
  /** The offer's committed one-time net total, from the same computeOfferPricing the rest of the app uses. */
  oneTimeNetCents: number;
  onClose: () => void;
  onDone: (invoiceId: string) => void;
}) {
  const toast = useToast();
  const [existing, setExisting] = useState<OfferLinkedInvoiceRef[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);

  const hasOneTime = oneTimeNetCents > 0;

  useEffect(() => {
    // A recurring-only offer stops at the graceful message below and never reaches the RPC —
    // there is nothing to check for duplicate instalments either, so skip the lookup entirely.
    if (!open || !offer || !hasOneTime) { setExisting(null); setChoice(null); return; }
    setExisting(null);
    setLoadError(null);
    setChoice(null);
    void loadInvoicesForOffer(offer.id).then(({ data, error }) => {
      if (error) { setLoadError(error); return; }
      setExisting(data);
    });
  }, [open, offer, hasOneTime]);

  if (!open || !offer) return null;

  const schedule = (offer.payment_schedule ?? []) as OfferPaymentMilestone[];

  const confirm = () => {
    if (!choice) return;
    setBusy(true);
    void (async () => {
      const milestoneIndex = choice.kind === 'milestone' ? choice.index : undefined;
      const res = await convertOfferToInvoiceDraft(offer.id, milestoneIndex);
      setBusy(false);
      if (res.error || !res.invoiceId) {
        toast.error('Umwandlung fehlgeschlagen', res.error ?? 'Unbekannt');
        return;
      }
      toast.success(
        'Rechnungsentwurf erstellt',
        res.isFullConversion
          ? 'Bitte prüfen und stellen.'
          : `${res.milestoneLabel ?? 'Rate'} als Rechnungsentwurf erstellt. Weitere Raten können später separat erstellt werden.`,
      );
      onDone(res.invoiceId);
      onClose();
    })();
  };

  // No one-time content at all (recurring-only, or every one-time line optional): stop here,
  // no RPC call, nothing persisted. The RPC itself refuses the same case as a backstop.
  if (!hasOneTime) {
    return (
      <Modal open={open} onClose={onClose} title="Rechnung aus Angebot erstellen" size="sm"
        footer={<Button variant="secondary" onClick={onClose}>Schließen</Button>}>
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle size={17} aria-hidden="true" />
          </span>
          <p className="text-[13.5px] leading-6 text-gray-600">
            Dieses Angebot enthält keine einmalige, aktuell abrechenbare Position. Wiederkehrende Positionen werden separat abgerechnet.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open} onClose={busy ? () => {} : onClose} title="Rechnung aus Angebot erstellen" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button>
        <Button onClick={confirm} loading={busy} disabled={!choice}>Rechnungsentwurf erstellen</Button>
      </>}
    >
      <div className="space-y-4">
        {existing === null && !loadError ? (
          <p className="text-[12.5px] text-gray-400">Prüfe bereits erstellte Rechnungen …</p>
        ) : null}
        {loadError ? (
          <p className="text-[12.5px] text-amber-600">Bereits erstellte Rechnungen konnten nicht geladen werden — bitte prüfen Sie die Rechnungsliste manuell, bevor Sie fortfahren.</p>
        ) : null}
        {existing && existing.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-amber-800">
              <AlertTriangle size={14} aria-hidden="true" /> Aus diesem Angebot bereits erstellte Rechnungen
            </p>
            <ul className="space-y-1.5">
              {existing.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-2 text-[12.5px] text-amber-900">
                  <span className="flex items-center gap-1.5">
                    {inv.invoice_number ?? 'Entwurf'}
                    <StatusBadge label={invoiceStatusLabel[inv.status] ?? inv.status} tone="neutral" />
                  </span>
                  <span className="tabular-nums font-medium">{formatCents(inv.net_total_cents, inv.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-amber-700">Prüfen Sie, ob die gewünschte Rate hier bereits enthalten ist, bevor Sie fortfahren.</p>
          </div>
        ) : null}

        <p className="text-[12.5px] text-gray-500">
          {schedule.length > 0
            ? 'Wählen Sie, welchen Betrag dieser Rechnungsentwurf enthalten soll. Wiederkehrende Positionen sind nie enthalten — sie werden separat gemäß ihrem Abrechnungsintervall berechnet.'
            : 'Dieser Rechnungsentwurf enthält den einmaligen Betrag des Angebots. Wiederkehrende Positionen sind nie enthalten.'}
        </p>

        <div className="space-y-2">
          {schedule.map((m, i) => {
            const amount = milestoneAmountCents(
              { label: m.label, percentageBp: m.percentage_bp ?? null, amountCents: m.amount_cents ?? null }, oneTimeNetCents,
            );
            const pctLabel = typeof m.percentage_bp === 'number' ? `${(m.percentage_bp / 100).toLocaleString('de-DE')} %` : null;
            const selected = choice?.kind === 'milestone' && choice.index === i;
            return (
              <button key={i} type="button" onClick={() => setChoice({ kind: 'milestone', index: i })}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="flex items-center gap-2 text-[13px] text-gray-800">
                  {selected ? <CheckCircle2 size={16} className="shrink-0 text-gray-900" aria-hidden="true" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300" aria-hidden="true" />}
                  <span>Rate {i + 1} — {m.label}{pctLabel ? ` — ${pctLabel}` : ''}</span>
                </span>
                <span className="shrink-0 tabular-nums text-[13px] font-semibold text-gray-900">{amount != null ? `${formatCents(amount, offer.currency)} netto` : '—'}</span>
              </button>
            );
          })}

          <button type="button" onClick={() => setChoice({ kind: 'full' })}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${choice?.kind === 'full' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className="flex items-center gap-2 text-[13px] text-gray-800">
              {choice?.kind === 'full' ? <CheckCircle2 size={16} className="shrink-0 text-gray-900" aria-hidden="true" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300" aria-hidden="true" />}
              <span>Gesamten Einmalbetrag</span>
            </span>
            <span className="shrink-0 tabular-nums text-[13px] font-semibold text-gray-900">{formatCents(oneTimeNetCents, offer.currency)} netto</span>
          </button>
        </div>

        {choice?.kind === 'full' && schedule.length > 0 ? (
          <p className="text-[11.5px] text-gray-400">Dies schließt den vollständigen einmaligen Betrag ab; das Angebot gilt danach als abgerechnet und kann nicht erneut umgewandelt werden.</p>
        ) : null}
      </div>
    </Modal>
  );
}

export default ConvertOfferToInvoiceDialog;
