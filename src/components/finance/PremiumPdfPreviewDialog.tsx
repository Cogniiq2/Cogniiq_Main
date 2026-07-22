// Reliable, popup-free premium-PDF preview dialog. Opens immediately with a loading state,
// generates the PDF asynchronously, then displays it in an <iframe> from a Blob URL — so the
// primary preview never depends on popup permission. Rendering errors are shown inside the
// dialog AND surfaced as a safe toast (full error only to the console, never tokens/secrets).
//
// Blob URL lifecycle: exactly one managed URL at a time; the previous one is revoked before a
// new render, and the URL is revoked on close and on unmount — but never while the iframe is
// still mounted and using it. A monotonically increasing run id guards against out-of-order
// async results and state updates after unmount.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';

import { Button, Modal, useToast } from '@/components/dashboard';
import { downloadBytes } from '@/lib/ownerFinance/exports';

export interface PremiumPdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  /** Async PDF byte producer. Invoked once each time the dialog opens. */
  render: () => Promise<Uint8Array>;
  /** Download filename, e.g. "Angebot-AN-2026-0001.pdf". */
  filename: string;
  title?: string;
  description?: string;
}

type Status = 'loading' | 'ready' | 'error';

export function PremiumPdfPreviewDialog({ open, onClose, render, filename, title = 'PDF-Vorschau', description }: PremiumPdfPreviewDialogProps) {
  const toast = useToast();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const urlRef = useRef<string | null>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const runIdRef = useRef(0);
  // Keep the latest render + toast in refs so the generation effect depends only on `open`
  // (a new parent render must not re-trigger PDF generation while the dialog is open).
  const renderRef = useRef(render);
  renderRef.current = render;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const revoke = useCallback(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  // Generate whenever the dialog transitions to open.
  useEffect(() => {
    if (!open) return;
    const myId = ++runIdRef.current;
    // Replace: drop the previous (unmounted) iframe's URL before creating a new one.
    revoke();
    bytesRef.current = null;
    setUrl(null);
    setErrorMsg(null);
    setStatus('loading');

    void (async () => {
      try {
        const bytes = await renderRef.current();
        if (myId !== runIdRef.current) return; // superseded or closed
        bytesRef.current = bytes;
        const blobUrl = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }));
        urlRef.current = blobUrl;
        setUrl(blobUrl);
        setStatus('ready');
      } catch (e: unknown) {
        if (myId !== runIdRef.current) return;
        // Full error to the console for debugging (no secrets/tokens are ever passed here).
        console.error('[PremiumPdfPreviewDialog] PDF-Vorschau konnte nicht erstellt werden:', e);
        const msg = e instanceof Error ? e.message : String(e);
        setErrorMsg(msg);
        setStatus('error');
        toastRef.current.error('PDF-Vorschau konnte nicht erstellt werden', msg);
      }
    })();
  }, [open, revoke]);

  // Revoke + reset when the dialog closes (iframe unmounts with the Modal).
  useEffect(() => {
    if (!open) { runIdRef.current++; revoke(); bytesRef.current = null; setUrl(null); }
  }, [open, revoke]);

  // Final safety net: revoke on unmount.
  useEffect(() => () => { runIdRef.current++; revoke(); }, [revoke]);

  const download = () => { if (bytesRef.current) downloadBytes(filename, bytesRef.current, 'application/pdf'); };
  // Secondary, explicit action only — the Blob URL already exists, so this is not popup-gated.
  const openInTab = () => { if (urlRef.current) window.open(urlRef.current, '_blank', 'noopener'); };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Schließen</Button>
          <Button variant="secondary" icon={ExternalLink} onClick={openInTab} disabled={status !== 'ready'}>In neuem Tab öffnen</Button>
          <Button icon={Download} onClick={download} disabled={status !== 'ready'}>PDF herunterladen</Button>
        </>
      }
    >
      <div className="min-h-[60vh]">
        {status === 'loading' ? (
          <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 size={28} className="animate-spin text-gray-400" />
            <p className="text-[13px]">Premium-Angebot wird erzeugt …</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[14px] font-semibold text-gray-900">PDF-Vorschau konnte nicht erstellt werden</p>
            <p className="max-w-md text-[13px] text-red-600">{errorMsg}</p>
            <p className="text-[12px] text-gray-400">Details finden Sie in der Browser-Konsole.</p>
          </div>
        ) : url ? (
          <iframe title="PDF-Vorschau" src={url} className="h-[74vh] w-full rounded-lg border border-gray-200 bg-gray-50" />
        ) : null}
      </div>
    </Modal>
  );
}
