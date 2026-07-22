import { useEffect, useMemo, useRef, useState } from 'react';

import { createOfferAccessToken, setOfferStatus } from '@/lib/ownerFinance/offersApi';
import { buildGreetingLine } from '@/lib/ownerFinance/greeting';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { OwnerOffer } from '@/lib/ownerFinance/types';

// Premium "Angebot versenden" dialog. Creates a secure token EXACTLY ONCE per open (never
// silently multiple active tokens), prefills the recipient greeting + email, shows the
// expiration date and destination hostname, prepares an editable subject + message, and
// offers Email / WhatsApp / native share / copy. On an actual send (or confirmed manual
// action) it advances the offer status to "sent". The production app URL is used when
// configured (VITE_PUBLIC_APP_URL); otherwise the current origin, with a preview warning.

interface SendOfferDialogProps {
  offer: OwnerOffer;
  documentId: string | null;
  validDays: number;
  sellerName: string;
  onClose: () => void;
  onSent: () => void;
}

function appBaseUrl(): { url: string; isPreview: boolean } {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '');
  if (configured) return { url: configured, isPreview: false };
  const origin = window.location.origin;
  const isPreview = /\.pages\.dev$|\.workers\.dev$|localhost|127\.0\.0\.1|preview/i.test(origin);
  return { url: origin, isPreview };
}

export function SendOfferDialog({ offer, documentId, validDays, sellerName, onClose, onSent }: SendOfferDialogProps) {
  const created = useRef(false);
  const [link, setLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(offer.recipient_email ?? '');
  const [sent, setSent] = useState(false);

  const greeting = useMemo(() => buildGreetingLine({
    salutation: offer.recipient_salutation, title: offer.recipient_title,
    firstName: offer.recipient_first_name, lastName: offer.recipient_last_name,
    greetingName: offer.recipient_greeting_name,
  }), [offer]);

  const base = useMemo(appBaseUrl, []);
  const validUntil = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + validDays); return d.toISOString().slice(0, 10);
  }, [validDays]);

  const subject = `Ihr persönliches Angebot ${offer.offer_number ?? ''} von ${sellerName || 'Cogniiq'}`.trim();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (created.current) return;
    created.current = true;
    (async () => {
      const { token, error: err } = await createOfferAccessToken(offer.id, documentId, validDays);
      if (err || !token) { setError('Der sichere Link konnte nicht erstellt werden.'); setCreating(false); return; }
      const url = `${base.url}/d/${token}`;
      setLink(url);
      setMessage(
        `${greeting},\n\nvielen Dank für das angenehme Gespräch.\n` +
        `Unter dem folgenden sicheren Link können Sie Ihr persönliches Angebot einsehen, als PDF herunterladen und direkt online annehmen:\n\n${url}\n\n` +
        `Das Angebot ist bis zum ${formatDateDe(validUntil)} gültig.\n\n` +
        `Bei Fragen stehen wir Ihnen selbstverständlich gerne zur Verfügung.\n\nBeste Grüße\n${sellerName || 'Cogniiq'}`,
      );
      setCreating(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSent = async () => {
    if (sent) return;
    if (['finalized', 'viewed'].includes(offer.status)) await setOfferStatus(offer.id, 'sent');
    setSent(true);
    onSent();
  };

  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); } catch { /* clipboard blocked */ }
    await markSent();
  };
  const mailto = link ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : '#';
  const whatsapp = link ? `https://wa.me/?text=${encodeURIComponent(message)}` : '#';
  const nativeShare = async () => {
    if (!link) return;
    if (navigator.share) { try { await navigator.share({ title: subject, text: message, url: link }); await markSent(); } catch { /* cancelled */ } }
    else await copy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Angebot versenden</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Schließen">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {creating ? (
            <div className="animate-pulse space-y-3"><div className="h-4 w-40 rounded bg-slate-100" /><div className="h-24 rounded-xl bg-slate-100" /></div>
          ) : error ? (
            <p className="text-[14px] text-red-600">{error}</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-[13px]">
                <div className="flex justify-between"><span className="text-slate-400">Angebot</span><span className="font-semibold text-slate-800">{offer.offer_number}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-slate-400">Gültig bis</span><span className="text-slate-700">{formatDateDe(validUntil)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-slate-400">Ziel</span><span className="text-slate-700">{base.url.replace(/^https?:\/\//, '')}</span></div>
              </div>
              {base.isPreview ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] text-amber-700">Achtung: Dies ist eine Vorschau-Adresse. Vor dem Versand an echte Kunden bitte die Produktions-URL konfigurieren.</p>
              ) : null}

              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-slate-500">Empfänger-E-Mail</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-slate-500">Betreff</span>
                <input value={subject} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-slate-500">Nachricht</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-slate-400" />
              </label>

              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-[12px] text-slate-500">
                <span className="truncate">{link}</span>
                <button onClick={() => void copy()} className="ml-auto shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-800">Kopieren</button>
              </div>
            </div>
          )}
        </div>

        {!creating && !error ? (
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 px-6 py-4">
            <a href={mailto} onClick={() => void markSent()} className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-[13px] font-semibold text-white hover:bg-slate-800">E-Mail</a>
            <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => void markSent()} className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-[13px] font-semibold text-slate-700 hover:border-slate-300">WhatsApp</a>
            <button onClick={() => void nativeShare()} className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] font-semibold text-slate-700 hover:border-slate-300">Teilen</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SendOfferDialog;
