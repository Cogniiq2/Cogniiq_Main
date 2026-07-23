import { useMemo, useRef, useState } from 'react';

import { createOfferAccessToken, enqueueOfferEmail } from '@/lib/ownerFinance/offersApi';
import { deriveOfferEmailStatus } from '@/lib/ownerFinance/offerSignatureState';
import { buildGreetingLine } from '@/lib/ownerFinance/greeting';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { OwnerOffer, OwnerAutomationJobStatus } from '@/lib/ownerFinance/types';

// Premium "Angebot versenden" dialog. The PRIMARY action ("E-Mail jetzt senden") enqueues one
// durable, server-side `offer_email` job via the secure owner RPC — the worker then mints the
// fresh secure portal token and sends through Resend automatically. Opening this dialog does NOT
// create an access token, alter the offer status, enqueue a job, contact Resend, or open a local
// mail provider. There is NO `mailto:` path. The secondary WhatsApp / share / copy options are
// clearly-labelled MANUAL alternatives that mint a secure link only on explicit click, and never
// mark the offer as email-sent (only a successful automated send does that).

interface SendOfferDialogProps {
  offer: OwnerOffer;
  documentId: string | null;
  validDays: number;
  sellerName: string;
  /** Current live `offer_email` automation job (from the detail page), or null if none yet. */
  emailJob?: OwnerAutomationJobStatus | null;
  onClose: () => void;
  /** Called after a successful enqueue (and after a manual link mint) so the parent refetches. */
  onSent: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appBaseUrl(): { url: string; isPreview: boolean } {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '');
  if (configured) return { url: configured, isPreview: false };
  const origin = window.location.origin;
  const isPreview = /\.pages\.dev$|\.workers\.dev$|localhost|127\.0\.0\.1|preview/i.test(origin);
  return { url: origin, isPreview };
}

export function SendOfferDialog({ offer, documentId, validDays, sellerName, emailJob, onClose, onSent }: SendOfferDialogProps) {
  const [email, setEmail] = useState(offer.recipient_email ?? '');
  const [emailTouched, setEmailTouched] = useState(false);

  // Editable subject + message. NEITHER contains the raw secure link — the worker mints a fresh
  // token and inserts the exact secure link automatically at send time.
  const greeting = useMemo(() => buildGreetingLine({
    salutation: offer.recipient_salutation, title: offer.recipient_title,
    firstName: offer.recipient_first_name, lastName: offer.recipient_last_name,
    greetingName: offer.recipient_greeting_name,
  }), [offer]);

  const base = useMemo(appBaseUrl, []);
  const validUntil = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + validDays); return d.toISOString().slice(0, 10);
  }, [validDays]);

  const [subject, setSubject] = useState(`Ihr persönliches Angebot ${offer.offer_number ?? ''} von ${sellerName || 'Cogniiq'}`.trim());
  const [message, setMessage] = useState(
    `${greeting},\n\nvielen Dank für das angenehme Gespräch.\n` +
    `Unter dem folgenden sicheren Link können Sie Ihr persönliches Angebot einsehen, als PDF herunterladen und direkt online annehmen.\n\n` +
    `Das Angebot ist bis zum ${formatDateDe(validUntil)} gültig.\n\n` +
    `Bei Fragen stehen wir Ihnen selbstverständlich gerne zur Verfügung.\n\nBeste Grüße\n${sellerName || 'Cogniiq'}`,
  );

  // Primary send (enqueue) state. A ref guards against double-submit before React re-renders.
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [enqueueError, setEnqueueError] = useState<string | null>(null);
  const [result, setResult] = useState<{ jobId: string | null; status: string | null } | null>(null);

  // Manual secure-link state (minted ONLY on explicit click, never on open).
  const [link, setLink] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const liveStatus = deriveOfferEmailStatus(result?.status ? { status: result.status } : emailJob ?? null);

  const submit = async () => {
    if (submittingRef.current) return;          // prevent double-click submissions
    if (!emailValid) { setEmailTouched(true); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setEnqueueError(null);
    try {
      const { jobId, status, error } = await enqueueOfferEmail({
        offerId: offer.id, recipientEmail: email.trim(), subject: subject.trim(), message,
      });
      if (error) { setEnqueueError('Die E-Mail konnte nicht eingeplant werden.'); return; }
      setResult({ jobId, status });
      onSent();                                  // trigger owner-detail refetch
    } catch {
      setEnqueueError('Die E-Mail konnte nicht eingeplant werden.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Mint the secure link on demand for the MANUAL alternatives (copy / WhatsApp / share). This
  // never sets the offer's email-sent status and never enqueues an offer_email job.
  const ensureLink = async (): Promise<string | null> => {
    if (link) return link;
    setLinkBusy(true); setLinkError(null);
    const { token, error } = await createOfferAccessToken(offer.id, documentId, validDays);
    setLinkBusy(false);
    if (error || !token) { setLinkError('Der sichere Link konnte nicht erstellt werden.'); return null; }
    const url = `${base.url}/d/${token}`;
    setLink(url);
    onSent();                                    // refresh (a new link/token was created)
    return url;
  };

  const copyLink = async () => {
    const url = await ensureLink();
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* clipboard blocked */ }
  };
  const shareWhatsApp = async () => {
    const url = await ensureLink();
    if (!url) return;
    const text = `${message}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };
  const nativeShare = async () => {
    const url = await ensureLink();
    if (!url) return;
    if (navigator.share) { try { await navigator.share({ title: subject, text: message, url }); } catch { /* cancelled */ } }
    else await copyLink();
  };

  const statusToneClass = (tone: string) =>
    tone === 'success' ? 'bg-emerald-50 text-emerald-700'
      : tone === 'danger' ? 'bg-red-50 text-red-700'
        : 'bg-slate-100 text-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Angebot versenden</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Schließen">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-[13px]">
              <div className="flex justify-between"><span className="text-slate-400">Angebot</span><span className="font-semibold text-slate-800">{offer.offer_number}</span></div>
              <div className="mt-1 flex justify-between"><span className="text-slate-400">Gültig bis</span><span className="text-slate-700">{formatDateDe(validUntil)}</span></div>
              <div className="mt-1 flex items-center justify-between"><span className="text-slate-400">E-Mail-Versand</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${statusToneClass(liveStatus.tone)}`}>{liveStatus.label}</span>
              </div>
            </div>

            {base.isPreview ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-700">Achtung: Dies ist eine Vorschau-Adresse. Vor dem Versand an echte Kunden bitte die Produktions-URL konfigurieren.</p>
            ) : null}

            {result ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-[13px]">
                <p className="font-semibold text-emerald-800">E-Mail wurde zur sicheren Verarbeitung eingeplant</p>
                <p className="mt-1 text-emerald-700/90">Die E-Mail wird automatisch über den Server versendet. Aktueller Status: <span className="font-medium">{liveStatus.label}</span>.</p>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-slate-500">Empfänger-E-Mail</span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} type="email"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-slate-400 ${emailTouched && !emailValid ? 'border-red-300' : 'border-slate-200'}`} />
                  {emailTouched && !emailValid ? <span className="mt-1 block text-[12px] text-red-600">Bitte eine gültige E-Mail-Adresse eingeben.</span> : null}
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-slate-500">Betreff</span>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-slate-500">Nachricht</span>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-slate-400" />
                  <span className="mt-1 block text-[12px] text-slate-400">Der sichere Angebots-Link wird beim automatischen Versand serverseitig erzeugt und eingefügt.</span>
                </label>
              </>
            )}

            {enqueueError ? <p className="text-[13px] text-red-600">{enqueueError}</p> : null}

            {/* Manual alternatives — clearly separated from the automated send. */}
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Manuelle Alternativen</p>
              <p className="mt-1 text-[12px] text-slate-500">Erstellt bei Klick einen sicheren Link. Diese Optionen versenden keine E-Mail und ändern den Versandstatus nicht.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={() => void copyLink()} disabled={linkBusy}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-[13px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60">
                  {copied ? 'Kopiert ✓' : 'Link kopieren'}
                </button>
                <button onClick={() => void shareWhatsApp()} disabled={linkBusy}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-[13px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60">WhatsApp</button>
                <button onClick={() => void nativeShare()} disabled={linkBusy}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-[13px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60">Teilen</button>
              </div>
              {link ? <p className="mt-2 truncate text-[12px] text-slate-400">{link}</p> : null}
              {linkError ? <p className="mt-2 text-[12px] text-red-600">{linkError}</p> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          {liveStatus.state === 'failed' && !result ? (
            <button onClick={() => void submit()} disabled={submitting}
              className="w-full rounded-xl bg-red-600 px-3 py-3 text-center text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {submitting ? 'Wird eingeplant…' : 'Erneut versuchen'}
            </button>
          ) : result ? (
            <button onClick={onClose} className="w-full rounded-xl bg-slate-900 px-3 py-3 text-center text-[14px] font-semibold text-white hover:bg-slate-800">Schließen</button>
          ) : (
            <button onClick={() => void submit()} disabled={submitting || !emailValid}
              className="w-full rounded-xl bg-slate-900 px-3 py-3 text-center text-[14px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {submitting ? 'Wird eingeplant…' : 'E-Mail jetzt senden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendOfferDialog;
