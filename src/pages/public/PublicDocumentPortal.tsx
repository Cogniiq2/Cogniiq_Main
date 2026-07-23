import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchPublicOffer, respondPublicOffer, acceptOfferWithSignature, type PublicOfferProjection } from '@/lib/ownerFinance/offersApi';
import { formatCentsCurrencyDe, formatDateDe, formatDateDeFromInstant } from '@/lib/ownerFinance/exports';
import { buildGreetingLine, buildThanksLine } from '@/lib/ownerFinance/greeting';
import { WelcomeSequence } from '@/components/finance/WelcomeSequence';
import { PremiumOfferWebView } from '@/components/finance/PremiumOfferWebView';
import { SignaturePad, type SignaturePadHandle } from '@/components/finance/SignaturePad';

// Standalone, tokenized customer document portal (/d/:token). No marketing/dashboard
// chrome, no auth. Owns the full viewport. The raw token never grants access by resource
// id — a valid token returns a CURATED projection built from the IMMUTABLE finalized
// snapshot, so the on-screen offer always matches the PDF. Acceptance is an
// "Online-Annahme mit einfacher elektronischer Signatur" — never labelled qualified or
// advanced. The token is never logged, stored, or sent to analytics.

const TERMS_VERSION = 'annahme-v1';

type FailureKind = 'invalid' | 'expired' | 'revoked' | 'cancelled' | 'network' | 'generic';

function mapLoadError(message: string): FailureKind {
  const m = message.toLowerCase();
  if (m.includes('revoked') || m.includes('widerruf')) return 'revoked';
  if (m.includes('expired') || m.includes('abgelaufen')) return 'expired';
  if (m.includes('invalid token') || m.includes('ungültig')) return 'invalid';
  if (m.includes('unavailable') || m.includes('cancel')) return 'cancelled';
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to')) return 'network';
  return 'generic';
}

const FAILURE_COPY: Record<FailureKind, { title: string; body: string }> = {
  invalid: { title: 'Link nicht gültig', body: 'Dieser Link ist ungültig. Bitte prüfen Sie die Adresse oder fordern Sie einen neuen Link an.' },
  expired: { title: 'Link abgelaufen', body: 'Die Gültigkeit dieses Links ist abgelaufen. Wir senden Ihnen gerne einen neuen zu.' },
  revoked: { title: 'Link widerrufen', body: 'Dieser Link wurde deaktiviert. Bitte kontaktieren Sie uns für einen aktuellen Zugang.' },
  cancelled: { title: 'Angebot nicht verfügbar', body: 'Dieses Angebot steht derzeit nicht zur Verfügung. Bitte kontaktieren Sie uns.' },
  network: { title: 'Verbindung unterbrochen', body: 'Die Verbindung wurde unterbrochen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.' },
  generic: { title: 'Dokument nicht verfügbar', body: 'Das Dokument konnte nicht geladen werden. Bitte versuchen Sie es später erneut.' },
};

export function PublicDocumentPortal() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<PublicOfferProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [done, setDone] = useState<null | 'accepted' | 'rejected'>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [submitVia, setSubmitVia] = useState<'edge' | 'rpc' | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFailure(null);
    const { offer: o, error } = await fetchPublicOffer(token);
    if (error) { setFailure(mapLoadError(error)); }
    else {
      setOffer(o);
      if (o?.accepted) setDone('accepted');
      else if (o?.rejected) setDone('rejected');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  // Title = offer number after load (private surface: robots/referrer set in App).
  useEffect(() => {
    if (offer?.offer_number) document.title = `Angebot ${offer.offer_number} · Cogniiq`;
  }, [offer?.offer_number]);

  const greeting = useMemo(() => buildGreetingLine(offer?.recipient ?? {}), [offer?.recipient]);
  const thanks = useMemo(() => buildThanksLine(offer?.recipient ?? {}), [offer?.recipient]);

  const downloadPdf = async () => {
    if (!offer) return;
    const { renderTransactionalPdf, TRANSACTIONAL_TEMPLATE_VERSION } = await import('@/lib/ownerFinance/documents');
    const seller = offer.seller;
    const bytes = await renderTransactionalPdf({
      kind: 'offer', language: 'de', documentNumber: offer.offer_number, title: offer.title,
      seller: { name: seller.legal_name, addressLines: [seller.street ?? '', [seller.postal_code, seller.city].filter(Boolean).join(' ')].filter(Boolean), email: seller.email, vatId: seller.vat_id },
      recipient: { name: offer.recipient?.company ?? '', addressLines: [] },
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

  // ---- loading / failure -------------------------------------------------
  if (loading) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-6 py-16">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-8 w-64 rounded bg-slate-100" />
          <div className="h-40 rounded-2xl bg-slate-100" />
        </div>
      </Shell>
    );
  }
  if (failure || !offer) {
    const copy = FAILURE_COPY[failure ?? 'generic'];
    return (
      <Shell>
        <div className="flex min-h-[100dvh] items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">!</div>
            <h1 className="text-lg font-semibold text-slate-900">{copy.title}</h1>
            <p className="mt-2 text-[14px] text-slate-500">{copy.body}</p>
            {failure === 'network' ? (
              <button onClick={() => void load()} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Erneut versuchen</button>
            ) : null}
          </div>
        </div>
      </Shell>
    );
  }

  const expired = offer.expired && !done;
  const secondaryLine = 'Gemeinsam gestalten wir die nächste Stufe Ihrer digitalen Infrastruktur.';

  return (
    <Shell>
      {showWelcome && !done ? (
        <WelcomeSequence
          greeting={greeting}
          primaryLine="Ihr persönliches Angebot von Cogniiq ist bereit."
          secondaryLine={secondaryLine}
          onDone={() => setShowWelcome(false)}
        />
      ) : null}

      <div className="mx-auto w-full max-w-[1240px] px-4 pb-40 pt-8 sm:px-6 lg:pb-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-10">
          {/* Main proposal content */}
          <main className="min-w-0">
            {done === 'accepted' ? (
              <SuccessPanel offer={offer} thanks={thanks} onDownload={() => void downloadPdf()} via={submitVia} />
            ) : (
              <PremiumOfferWebView offer={offer} greeting={greeting} />
            )}
          </main>

          {/* Decision panel (desktop, sticky in flow — never fixed over the document) */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <DecisionPanel
                offer={offer} done={done} expired={expired}
                onAccept={() => setAcceptOpen(true)} onReject={() => setRejectOpen(true)}
                onDownload={() => void downloadPdf()}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky action bar (safe-area aware; hidden after a decision) */}
      {!done && !expired ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur lg:hidden"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">Gesamt</div>
              <div className="truncate text-[15px] font-semibold text-slate-900">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</div>
            </div>
            <button onClick={() => setAcceptOpen(true)}
              className="min-h-[44px] shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white active:bg-slate-800">
              Angebot annehmen
            </button>
          </div>
        </div>
      ) : null}

      {acceptOpen ? (
        <AcceptFlow
          offer={offer}
          onClose={() => setAcceptOpen(false)}
          onDone={(via) => { setSubmitVia(via); setDone('accepted'); setAcceptOpen(false); }}
        />
      ) : null}

      {rejectOpen ? (
        <RejectFlow offer={offer} token={token!} onClose={() => setRejectOpen(false)} onDone={() => { setDone('rejected'); setRejectOpen(false); }} />
      ) : null}

      <footer className="mx-auto max-w-[1240px] px-6 pb-10 text-center text-[11px] text-slate-400">
        Bereitgestellt über Cogniiq · Online-Annahme mit einfacher elektronischer Signatur · Sicherer, persönlicher Zugang.
      </footer>
    </Shell>
  );
}

// -------------------------------------------------------------------------- Decision panel
function DecisionPanel({ offer, done, expired, onAccept, onReject, onDownload }: {
  offer: PublicOfferProjection; done: null | 'accepted' | 'rejected'; expired: boolean;
  onAccept: () => void; onReject: () => void; onDownload: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Angebot {offer.offer_number}</p>
      <div className="mt-3 text-[13px] text-slate-500">Gültig bis {formatDateDe(offer.valid_until)}</div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="text-[12px] text-slate-400">Gesamt (brutto)</div>
        <div className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
        <span aria-hidden>🔒</span> Sicheres, persönliches Dokument
      </div>

      {done === 'accepted' ? (
        <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">Angenommen</div>
      ) : done === 'rejected' ? (
        <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-[13px] font-medium text-slate-600">Abgelehnt</div>
      ) : expired ? (
        <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">Gültigkeit abgelaufen</div>
      ) : (
        <div className="mt-5 space-y-2">
          <button onClick={onAccept} className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Angebot annehmen</button>
          <button onClick={onReject} className="w-full rounded-xl px-5 py-2.5 text-[13px] font-medium text-slate-400 hover:text-slate-700">Frage stellen oder ablehnen</button>
        </div>
      )}

      <button onClick={onDownload} className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-semibold text-slate-600 hover:border-slate-300">PDF herunterladen</button>
    </div>
  );
}

// -------------------------------------------------------------------------- Success
function SuccessPanel({ offer, thanks, onDownload, via }: { offer: PublicOfferProjection; thanks: string; onDownload: () => void; via: 'edge' | 'rpc' | null }) {
  const [checked, setChecked] = useState(false);
  useEffect(() => { const t = setTimeout(() => setChecked(true), 120); return () => clearTimeout(t); }, []);
  return (
    <div className="py-8">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-500 ${checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{thanks}</h1>
          <p className="mt-1 text-[15px] text-slate-500">Ihre Annahme wurde sicher übermittelt.</p>
        </div>
      </div>
      <p className="mt-4 max-w-lg text-[15px] text-slate-500">Wir freuen uns auf die gemeinsame Umsetzung.</p>

      <dl className="mt-6 grid max-w-md gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-[14px]">
        <div className="flex justify-between"><dt className="text-slate-400">Angebot</dt><dd className="font-semibold text-slate-800">{offer.offer_number}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-400">Angenommen am</dt><dd className="text-slate-700">{formatDateDeFromInstant(offer.accepted_at ?? new Date().toISOString())}</dd></div>
        {offer.accepted_signer_name ? <div className="flex justify-between"><dt className="text-slate-400">Unterschrieben von</dt><dd className="text-slate-700">{offer.accepted_signer_name}</dd></div> : null}
        <div className="flex justify-between"><dt className="text-slate-400">Betrag</dt><dd className="tabular-nums font-semibold text-slate-900">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</dd></div>
      </dl>

      <p className="mt-4 max-w-md text-[13px] text-slate-400">
        {via === 'edge'
          ? 'Ihre unterschriebene Bestätigung und die Rechnungsunterlagen werden vorbereitet.'
          : 'Ihre Unterlagen werden vorbereitet. Sie erhalten Ihre Bestätigung in Kürze.'}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onDownload} className="rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-semibold text-slate-700 hover:border-slate-300">Bestätigung herunterladen</button>
        {offer.seller.email ? (
          <a href={`mailto:${offer.seller.email}`} className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-500 hover:text-slate-900">Fragen? Kontakt aufnehmen</a>
        ) : null}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------- Accept 3-step flow
function AcceptFlow({ offer, onClose, onDone }: {
  offer: PublicOfferProjection; onClose: () => void; onDone: (via: 'edge' | 'rpc') => void;
}) {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [signerName, setSignerName] = useState(offer.recipient?.contact_name ?? '');
  const [company, setCompany] = useState(offer.recipient?.company ?? '');
  const [email, setEmail] = useState(offer.recipient?.email ?? '');
  const [role, setRole] = useState('');
  const [comment, setComment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  const emailValid = /.+@.+\..+/.test(email.trim());

  const next = async () => {
    setError(null);
    if (step === 1) {
      if (!signerName.trim()) { setError('Bitte geben Sie Ihren vollständigen Namen an.'); return; }
      if (!emailValid) { setError('Bitte geben Sie eine gültige E-Mail-Adresse für die Bestätigung an.'); return; }
      setStep(2); return;
    }
    if (step === 2) {
      if (padRef.current?.isEmpty()) { setError('Bitte unterschreiben Sie im Feld.'); return; }
      const sig = await padRef.current?.export();
      if (!sig) { setError('Die Unterschrift konnte nicht verarbeitet werden. Bitte erneut unterschreiben.'); return; }
      setSignaturePreview(sig.dataUrl);
      setStep(3); return;
    }
  };

  const submit = async () => {
    if (!token || !signaturePreview) return;
    if (!agreed) { setError('Bitte bestätigen Sie die verbindliche Annahme.'); return; }
    setSubmitting(true); setError(null);
    const { via, error } = await acceptOfferWithSignature({
      token, signerName: signerName.trim(), signerCompany: company.trim(), signerEmail: email.trim(),
      signerRole: role.trim() || undefined, comment: comment.trim() || undefined,
      termsVersion: TERMS_VERSION, signaturePngDataUrl: signaturePreview,
    });
    setSubmitting(false);
    if (error) { setError('Die Annahme konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.'); return; }
    onDone(via);
  };

  const legalText = `Ich bestätige, dass ich berechtigt bin, dieses Angebot für das angegebene Unternehmen anzunehmen. Mit meiner Unterschrift und dem Absenden nehme ich das Angebot ${offer.offer_number ?? ''} verbindlich an.`;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Header + stepper */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 text-[12px] font-medium">
            {(['Angaben', 'Unterschrift', 'Annahme'] as const).map((label, i) => (
              <span key={label} className={`flex items-center gap-1 ${step === i + 1 ? 'text-slate-900' : 'text-slate-300'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= i + 1 ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Schließen">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Offer being accepted — always visible */}
          <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-400">Angebot</span><span className="font-semibold text-slate-800">{offer.offer_number}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-slate-400">Betrag</span><span className="tabular-nums font-semibold text-slate-900">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-slate-400">Gültig bis</span><span className="text-slate-700">{formatDateDe(offer.valid_until)}</span></div>
            {offer.recipient?.company ? <div className="mt-1 flex justify-between"><span className="text-slate-400">Unternehmen</span><span className="text-slate-700 [overflow-wrap:anywhere]">{offer.recipient.company}</span></div> : null}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Angaben bestätigen</h2>
              <Field label="Vollständiger Name" required><input value={signerName} onChange={(e) => setSignerName(e.target.value)} className={inputCls} /></Field>
              <Field label="Unternehmen"><input value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} /></Field>
              <Field label="E-Mail (für die Bestätigung)" required><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
              <Field label="Funktion / Rolle (optional)"><input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} /></Field>
              <Field label="Kommentar (optional)"><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={inputCls} /></Field>
            </div>
          ) : step === 2 ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">Unterschreiben</h2>
              <p className="text-[13px] text-slate-500">Mit Finger, Maus oder Trackpad im Feld unterschreiben. Auf dem Smartphone oder Tablet können Sie mit dem Finger unterschreiben.</p>
              <SignaturePad ref={padRef} onInkChange={setHasInk} />
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Verbindlich annehmen</h2>
              <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                <div className="text-[13px]">
                  <div className="text-slate-400">Angebot</div><div className="font-semibold text-slate-800">{offer.offer_number}</div>
                  <div className="mt-2 text-slate-400">Betrag</div><div className="tabular-nums font-semibold text-slate-900">{formatCentsCurrencyDe(offer.gross_total_cents, offer.currency)}</div>
                  <div className="mt-2 text-slate-400">Name</div><div className="text-slate-800">{signerName}</div>
                </div>
                {signaturePreview ? <img src={signaturePreview} alt="Unterschrift" className="h-20 w-40 rounded-lg border border-slate-100 object-contain" /> : null}
              </div>
              <label className="flex items-start gap-2 text-[13px] text-slate-600">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                <span>{legalText}</span>
              </label>
              <p className="text-[12px] text-slate-400">Klassifizierung: Online-Annahme mit einfacher elektronischer Signatur.</p>
            </div>
          )}

          {error ? <p className="mt-4 text-[13px] text-red-600">{error}</p> : null}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as 1 | 2 | 3))}
            className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-400 hover:text-slate-900">
            {step === 1 ? 'Abbrechen' : 'Zurück'}
          </button>
          {step < 3 ? (
            <button onClick={() => void next()} disabled={step === 2 && !hasInk}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40">Weiter</button>
          ) : (
            <button onClick={() => void submit()} disabled={submitting || !agreed}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {submitting ? 'Annahme wird sicher übermittelt …' : 'Verbindlich annehmen und übermitteln'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------- Reject / question flow
function RejectFlow({ offer, token, onClose, onDone }: { offer: PublicOfferProjection; token: string; onClose: () => void; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reject = async () => {
    setSubmitting(true); setError(null);
    const { error } = await respondPublicOffer({ token, decision: 'rejected', signerName: '', signerCompany: '', signerEmail: '', termsVersion: TERMS_VERSION, comment: comment.trim() || undefined });
    setSubmitting(false);
    if (error) { setError('Ihre Rückmeldung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'); return; }
    onDone();
  };

  const mailto = offer.seller.email
    ? `mailto:${offer.seller.email}?subject=${encodeURIComponent('Rückfrage zu Angebot ' + (offer.offer_number ?? ''))}&body=${encodeURIComponent(comment)}`
    : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Frage stellen oder ablehnen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Schließen">✕</button>
        </div>
        <p className="mt-2 text-[13px] text-slate-500">Sie können uns eine Rückfrage senden, eine Änderung anfragen oder das Angebot ablehnen. Ein Grund hilft uns weiter, ist aber nicht erforderlich.</p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Ihre Nachricht (optional)" className={`mt-3 ${inputCls}`} />
        {error ? <p className="mt-3 text-[13px] text-red-600">{error}</p> : null}
        <div className="mt-4 flex flex-col gap-2">
          {mailto ? <a href={mailto} className="rounded-xl bg-slate-900 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800">Rückfrage senden</a> : null}
          <button onClick={() => void reject()} disabled={submitting} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 hover:border-slate-300 disabled:opacity-50">
            {submitting ? 'Wird gesendet …' : 'Angebot ablehnen'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-slate-500">{label}{required ? <span className="text-red-500"> *</span> : null}</span>
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-hidden bg-[#f8f8f5] text-slate-900" style={{ minHeight: '100dvh' }}>
      {children}
    </div>
  );
}

export default PublicDocumentPortal;
