import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Modal, Button, useToast } from '@/components/dashboard';
import { deleteOfferDraft } from '@/lib/ownerFinance/offersApi';
import { archiveOffer } from '@/lib/ownerFinance/customersApi';
import type { OwnerOffer } from '@/lib/ownerFinance/types';

// Context-aware "delete or archive" dialog. Drafts are permanently deleted; every non-draft offer
// is archived (never deleted), and accepted offers are explicitly labelled so the owner knows the
// signed evidence is preserved. The action taken is decided by the offer's status, not the user.

type Mode = 'delete_draft' | 'archive' | 'archive_accepted';

function modeFor(offer: Pick<OwnerOffer, 'status'>): Mode {
  if (offer.status === 'draft') return 'delete_draft';
  if (offer.status === 'accepted' || offer.status === 'converted') return 'archive_accepted';
  return 'archive';
}

const COPY: Record<Mode, { title: string; body: string; confirm: string; danger: boolean }> = {
  delete_draft: {
    title: 'Entwurf löschen',
    body: 'Dieser Angebotsentwurf wird endgültig gelöscht. Da er noch nicht finalisiert wurde, gibt es keine rechtlich relevanten Nachweise. Dies kann nicht rückgängig gemacht werden.',
    confirm: 'Endgültig löschen', danger: true,
  },
  archive: {
    title: 'Angebot archivieren',
    body: 'Dieses Angebot wird archiviert und aus der aktiven Ansicht entfernt. Der rechtliche Angebotsstatus bleibt unverändert. Sie finden das Angebot jederzeit über den Filter „Archiviert" und können es wiederherstellen.',
    confirm: 'Angebot archivieren', danger: false,
  },
  archive_accepted: {
    title: 'Angenommenes Angebot archivieren',
    body: 'Nur archivieren — die signierte Annahme, alle Angebotsversionen, erzeugten Dokumente und die private Unterschriftsdatei bleiben vollständig erhalten. Angenommene Angebote werden niemals gelöscht. Der rechtliche Status bleibt unverändert.',
    confirm: 'Nur archivieren', danger: false,
  },
};

export function OfferArchiveDialog({ open, offer, onClose, onDone }: {
  open: boolean;
  offer: OwnerOffer | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!offer) return null;
  const mode = modeFor(offer);
  const copy = COPY[mode];

  const run = async () => {
    setBusy(true);
    const { error } = mode === 'delete_draft' ? await deleteOfferDraft(offer.id) : await archiveOffer(offer.id);
    setBusy(false);
    if (error) {
      toast.error(mode === 'delete_draft' ? 'Löschen fehlgeschlagen' : 'Archivieren fehlgeschlagen', 'Bitte versuchen Sie es erneut.');
      return;
    }
    toast.success(mode === 'delete_draft' ? 'Entwurf gelöscht' : 'Angebot archiviert',
      mode === 'delete_draft' ? 'Der Entwurf wurde entfernt.' : 'Das Angebot wurde archiviert.');
    onDone();
    onClose();
  };

  return (
    <Modal
      open={open} onClose={busy ? () => {} : onClose} title={copy.title} size="sm"
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button variant={copy.danger ? 'danger' : 'primary'} onClick={() => void run()} loading={busy}>{copy.confirm}</Button></>}
    >
      <div className="flex gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${copy.danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
          <AlertTriangle size={17} aria-hidden="true" />
        </span>
        <div className="text-[13.5px] leading-6 text-gray-600">
          <p className="mb-1 font-medium text-gray-800">{offer.offer_number ?? 'Entwurf'}{offer.title ? ` · ${offer.title}` : ''}</p>
          {copy.body}
        </div>
      </div>
    </Modal>
  );
}

export default OfferArchiveDialog;
