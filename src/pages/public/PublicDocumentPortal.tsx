import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchPublicOffer, respondPublicOffer, type PublicOfferProjection } from '@/lib/ownerFinance/offersApi';
import { formatCentsCurrencyDe, formatBpPercentDe, formatDateDe } from '@/lib/ownerFinance/exports';

// Minimal, secure, branded public document portal at /d/:token. The raw offer id never grants
// access — only a valid token (verified server-side by SHA-256 hash) returns a CURATED projection
// (no internal notes, ids or storage paths). The offer PDF is rendered client-side from the same
// projection, so no anonymous access to the private bucket is required. Acceptance is an
// "Online-Annahme / einfache elektronische Signatur" — never labelled qualified or advanced.

const TERMS_VERSION = 'annahme-v1';

export function PublicDocumentPortal() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<PublicOfferProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'accept' | 'reject'>('view');
  const [signerName, setSignerName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | 'accepted' | 'rejected'>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const { offer: o, error: err } = await fetchPublicOffer(token);
    if (err) setError(err); else { setOffer(o); if (o?.accepted) setDone('accepted'); else if (o?.rejected) setDone('rejected'); }
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const downloadPdf = async () => {
    if (!offer) return;
    // Build a transactional document from the public projection and render client-side.
    const { renderTransactionalPdf } = await import('@/lib/ownerFinance/documents');
    const { TRANSACTIONAL_TEMPLATE_VERSION } = await import('@/lib/ownerFinance/documents');
    const seller = offer.seller;
    const bytes = await renderTransactionalPdf({
      kind: 'offer', language: 'de', documentNumber: offer.offer_number, title: offer.title,
      seller: { name: seller.legal_name, addressLines: [seller.street ?? '', [seller.postal_code, seller.city].filter(Boolean).join(' ')].filter(Boolean), email: seller.email, vatId: seller.vat_id },
      recipient: { name: '', addressLines: [] },
      issueDate: offer.issue_date, validUntil: offer.valid_until, serviceDate: null, currency: offer.currency,
      introduction: offer.introduction, scope: offer.scope, assumptions: offer.assumptions, exclusions: offer.exclusions,
      lines: offer.lines.map((l) => ({ description: l.description, quantityMilli: l.quantity_milli, unit: l.unit, unitPriceCents: l.unit_price_cents, vatRateBp: l.vat_rate_bp, vatTreatment: l.vat_treatment, netCents: l.net_cents, vatCents: l.vat_cents, grossCents: l.gross_cents, isOptional: l.is_optional })),
      netTotalCents: offer.net_total_cents, vatTotalCents: offer.vat_total_cents, grossTotalCents: offer.gross_total_cents,
      paymentTerms: offer.payment_terms, deliveryTerms: offer.delivery_terms, isDraft: false, templateVersion: TRANSACTIONAL_TEMPLATE_VERSION,
    });
    const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `Angebot-${offer.offer_number ?? 'Cogniiq'}.pdf`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const submit = async (decision: 'accepted' | 'rejected') => {
    if (!token) return;
    setFormError(null);
    if (decision === 'accepted') {
      if (!signerName.trim()) { setFormError('Bitte geben Sie Ihren Namen an.'); return; }
      if (!agreed) { setFormError('Bitte bestätigen Sie die Annahme des angezeigten Angebots.'); return; }
    }
    setSubmitting(true);
    const { result, error: err } = await respondPublicOffer({ token, decision, signerName: signerName.trim(), signerCompany: company.trim(), signerEmail: email.trim(), termsVersion: TERMS_VERSION, comment: comment.trim() || undefined });
    setSubmitting(false);
    if (err) { setFormError(err); return; }
    void result;
    setDone(decision);
  };

  const expired = useMemo(() => offer?.expired ?? false, [offer]);

  if (loading) return <Shell><div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-gray-100" /><div className="h-40 rounded-xl bg-gray-100" /></div></Shell>;
  if (error || !offer) return <Shell><div className="rounded-2xl border border-red-100 bg-red-50/60 p-6 text-center"><p className="font-semibold text-red-700">Dokument nicht verfügbar</p><p className="mt-1 text-sm text-red-600">{error ?? 'Der Link ist ungültig, abgelaufen oder wurde widerrufen.'}</p></div></Shell>;

  return (
    <Shell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{offer.seller.legal_name || 'Cogniiq'}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">Angebot {offer.offer_number ?? ''}</h1>
          {offer.title ? <p className="mt-0.5 text-gray-600">{offer.title}</p> : null}
        </div>
        <button onClick={() => void downloadPdf()} className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300">PDF herunterladen</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-gray-500">
        <span>Datum: {formatDateDe(offer.issue_date)}</span>
        <span>Gültig bis: {formatDateDe(offer.valid_until)}</span>
        <span>Betrag: <span className="font-semibold text-gray-900">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</span></span>
      </div>

      {offer.introduction ? <p className="mb-5 whitespace-pre-line text-[14px] leading-relaxed text-gray-700">{offer.introduction}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50/70 text-left text-[11px] font-bold uppercase tracking-wide text-gray-400"><th className="px-4 py-2.5">Beschreibung</th><th className="px-4 py-2.5 text-right">Menge</th><th className="px-4 py-2.5 text-right">Einzelpreis</th><th className="px-4 py-2.5 text-right">USt</th><th className="px-4 py-2.5 text-right">Netto</th></tr></thead>
          <tbody>{offer.lines.map((l, i) => (
            <tr key={i} className="border-t border-gray-50"><td className="px-4 py-2.5 text-gray-800">{l.description}{l.is_optional ? <span className="ml-2 text-[11px] text-gray-400">optional</span> : null}</td><td className="px-4 py-2.5 text-right tabular-nums text-gray-500">{(l.quantity_milli / 1000).toLocaleString('de-DE')} {l.unit}</td><td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{formatCentsCurrencyDe(l.unit_price_cents, offer.currency)}</td><td className="px-4 py-2.5 text-right tabular-nums text-gray-500">{formatBpPercentDe(l.vat_rate_bp)}</td><td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900">{formatCentsCurrencyDe(l.net_cents, offer.currency)}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-gray-500">Netto</dt><dd className="tabular-nums">{formatCentsCurrencyDe(offer.net_total_cents, offer.currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums">{formatCentsCurrencyDe(offer.vat_total_cents, offer.currency)}</dd></div>
        <div className="flex justify-between border-t border-gray-100 pt-1.5"><dt className="font-semibold text-gray-950">Gesamt</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</dd></div>
      </dl>

      {(offer.payment_terms || offer.delivery_terms || offer.assumptions || offer.exclusions) ? (
        <div className="mt-6 space-y-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-[13px] text-gray-600">
          {offer.payment_terms ? <p><span className="font-medium text-gray-700">Zahlung:</span> {offer.payment_terms}</p> : null}
          {offer.delivery_terms ? <p><span className="font-medium text-gray-700">Lieferung:</span> {offer.delivery_terms}</p> : null}
          {offer.assumptions ? <p><span className="font-medium text-gray-700">Annahmen:</span> {offer.assumptions}</p> : null}
          {offer.exclusions ? <p><span className="font-medium text-gray-700">Ausschlüsse:</span> {offer.exclusions}</p> : null}
        </div>
      ) : null}

      <div className="mt-8">
        {done === 'accepted' ? (
          <Banner tone="success" title="Angebot angenommen" body="Vielen Dank. Ihre Annahme wurde erfasst und der Anbieter wurde informiert." />
        ) : done === 'rejected' ? (
          <Banner tone="neutral" title="Angebot abgelehnt" body="Ihre Rückmeldung wurde erfasst." />
        ) : expired ? (
          <Banner tone="warning" title="Angebot abgelaufen" body="Die Gültigkeit dieses Angebots ist abgelaufen. Bitte kontaktieren Sie den Anbieter." />
        ) : mode === 'view' ? (
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setMode('accept')} className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">Angebot annehmen</button>
            <button onClick={() => setMode('reject')} className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300">Ablehnen</button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-950">{mode === 'accept' ? 'Angebot annehmen' : 'Angebot ablehnen'}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Ihr Name" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Firma (optional)" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail (optional)" className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2" />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Kommentar (optional)" rows={2} className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2" />
            </div>
            {mode === 'accept' ? (
              <label className="mt-3 flex items-start gap-2 text-[13px] text-gray-600">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                <span>Ich nehme das angezeigte Angebot {offer.offer_number ?? ''} verbindlich an (Online-Annahme / einfache elektronische Signatur).</span>
              </label>
            ) : null}
            {formError ? <p className="mt-3 text-[13px] text-red-600">{formError}</p> : null}
            <div className="mt-4 flex gap-3">
              <button disabled={submitting} onClick={() => void submit(mode === 'accept' ? 'accepted' : 'rejected')} className="rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">{submitting ? 'Wird gesendet…' : mode === 'accept' ? 'Verbindlich annehmen' : 'Ablehnen'}</button>
              <button onClick={() => setMode('view')} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-950">Zurück</button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-[11px] text-gray-400">Bereitgestellt über Cogniiq · Online-Annahme, keine qualifizierte elektronische Signatur.</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f4] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.05)] sm:p-9">{children}</div>
    </div>
  );
}

function Banner({ tone, title, body }: { tone: 'success' | 'warning' | 'neutral'; title: string; body: string }) {
  const cls = tone === 'success' ? 'border-emerald-100 bg-emerald-50/60 text-emerald-800' : tone === 'warning' ? 'border-amber-100 bg-amber-50/60 text-amber-800' : 'border-gray-100 bg-gray-50 text-gray-700';
  return <div className={`rounded-2xl border p-5 ${cls}`}><p className="font-semibold">{title}</p><p className="mt-1 text-sm opacity-90">{body}</p></div>;
}

export default PublicDocumentPortal;
