import { formatCentsCurrencyDe, formatBpPercentDe, formatDateDe } from '@/lib/ownerFinance/exports';
import type { PublicOfferProjection, PublicOfferLine } from '@/lib/ownerFinance/offersApi';

// Premium, responsive web presentation of the finalized offer. It consumes the SAME
// immutable projection that backs the finalized PDF, so the customer can never see one
// version on screen and receive a different PDF. Desktop reads as a refined document;
// mobile collapses modules into cards. Long German compound words wrap safely (no
// truncation, no horizontal overflow).

function Section({ id, kicker, title, children }: { id?: string; kicker?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-100 py-8 first:border-t-0 sm:py-10">
      {kicker ? <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{kicker}</p> : null}
      <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
      <div className="mt-4 text-[15px] leading-relaxed text-slate-600 [overflow-wrap:anywhere] hyphens-auto">{children}</div>
    </section>
  );
}

function ModuleCard({ line, index, currency, optional }: { line: PublicOfferLine; index: number; currency: string; optional?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 text-[12px] font-semibold text-white">{index}</span>
            {optional ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Optional</span> : null}
          </div>
          <h3 className="mt-2 text-[15px] font-semibold text-slate-900 [overflow-wrap:anywhere] hyphens-auto">{line.description}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="tabular-nums text-[15px] font-semibold text-slate-900">{formatCentsCurrencyDe(line.net_cents, currency)}</div>
          <div className="text-[11px] text-slate-400">netto</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-400">
        <span>{(line.quantity_milli / 1000).toLocaleString('de-DE')} {line.unit}</span>
        <span>USt {formatBpPercentDe(line.vat_rate_bp)}</span>
      </div>
    </div>
  );
}

export function PremiumOfferWebView({ offer, greeting }: { offer: PublicOfferProjection; greeting: string }) {
  const currency = offer.currency;
  const modules = offer.lines.filter((l) => !l.is_optional);
  const optional = offer.lines.filter((l) => l.is_optional);
  const outcomes = (offer.desired_outcomes ?? []).filter((o) => o && o.trim());
  const timeline = (offer.timeline ?? []).filter((t) => t.phase || t.title || t.duration || t.description);
  const schedule = (offer.payment_schedule ?? []).filter((m) => m.label);

  return (
    <div>
      {/* Hero */}
      <header className="pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{offer.seller.legal_name || 'Cogniiq'}</p>
        <p className="mt-3 text-[15px] font-medium text-slate-500">{greeting},</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 [overflow-wrap:anywhere] hyphens-auto sm:text-3xl">
          {offer.title ?? 'Ihr persönliches Angebot'}
        </h1>
        {offer.subtitle ? <p className="mt-2 text-[15px] text-slate-500 [overflow-wrap:anywhere]">{offer.subtitle}</p> : null}
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
          <div><dt className="text-slate-400">Angebot</dt><dd className="font-semibold text-slate-800">{offer.offer_number ?? '—'}</dd></div>
          <div><dt className="text-slate-400">Datum</dt><dd className="text-slate-700">{formatDateDe(offer.issue_date)}</dd></div>
          <div><dt className="text-slate-400">Gültig bis</dt><dd className="text-slate-700">{formatDateDe(offer.valid_until)}</dd></div>
          {offer.recipient?.company ? <div><dt className="text-slate-400">Für</dt><dd className="text-slate-700 [overflow-wrap:anywhere]">{offer.recipient.company}</dd></div> : null}
        </dl>
      </header>

      {offer.introduction ? (
        <Section kicker="Ausgangslage" title="Ihre Ausgangslage"><p className="whitespace-pre-line">{offer.introduction}</p></Section>
      ) : null}

      {offer.executive_summary ? (
        <Section kicker="Zielbild" title="Das Zielbild"><p className="whitespace-pre-line">{offer.executive_summary}</p></Section>
      ) : null}

      {offer.project_approach ? (
        <Section kicker="Vorgehen" title="Unser Vorgehen"><p className="whitespace-pre-line">{offer.project_approach}</p></Section>
      ) : null}

      {outcomes.length ? (
        <Section kicker="Ergebnisse" title="Was Sie damit erreichen">
          <ul className="space-y-2">
            {outcomes.map((o, i) => (
              <li key={i} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" /><span>{o}</span></li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section kicker="Leistungen" title="Ihre Projektmodule">
        <div className="grid gap-3">
          {modules.map((l, i) => <ModuleCard key={i} line={l} index={i + 1} currency={currency} />)}
        </div>
      </Section>

      {optional.length ? (
        <Section kicker="Optional" title="Optionale Erweiterungen">
          <div className="grid gap-3">
            {optional.map((l, i) => <ModuleCard key={i} line={l} index={i + 1} currency={currency} optional />)}
          </div>
        </Section>
      ) : null}

      <Section kicker="Investition" title="Ihre Investition">
        <dl className="ml-auto max-w-sm space-y-2">
          <div className="flex justify-between"><dt className="text-slate-500">Netto</dt><dd className="tabular-nums text-slate-800">{formatCentsCurrencyDe(offer.net_total_cents, currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Umsatzsteuer</dt><dd className="tabular-nums text-slate-800">{formatCentsCurrencyDe(offer.vat_total_cents, currency)}</dd></div>
          <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="font-semibold text-slate-900">Gesamt (brutto)</dt><dd className="tabular-nums text-lg font-semibold text-slate-900">{formatCentsCurrencyDe(offer.gross_total_cents, currency)}</dd></div>
        </dl>
      </Section>

      {timeline.length ? (
        <Section kicker="Zeitplan" title="Der Zeitplan">
          <ol className="space-y-4">
            {timeline.map((t, i) => (
              <li key={i} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-teal-600" />
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-slate-900">{t.title || t.phase}</span>
                  {t.duration ? <span className="text-[13px] text-slate-400">{t.duration}</span> : null}
                </div>
                {t.description ? <p className="mt-1 text-[14px] text-slate-500">{t.description}</p> : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {schedule.length ? (
        <Section kicker="Zahlung" title="Zahlungsplan">
          <ul className="space-y-2">
            {schedule.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-2 last:border-0">
                <span className="text-slate-700 [overflow-wrap:anywhere]">{m.label}{m.note ? <span className="ml-2 text-[12px] text-slate-400">{m.note}</span> : null}</span>
                <span className="shrink-0 tabular-nums text-slate-800">
                  {typeof m.percentage_bp === 'number' ? formatBpPercentDe(m.percentage_bp)
                    : typeof m.amount_cents === 'number' ? formatCentsCurrencyDe(m.amount_cents, currency) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {(offer.assumptions || offer.exclusions || offer.payment_terms || offer.delivery_terms) ? (
        <Section kicker="Rahmen" title="Annahmen & Rahmenbedingungen">
          <div className="space-y-3">
            {offer.payment_terms ? <p><span className="font-medium text-slate-700">Zahlung:</span> {offer.payment_terms}</p> : null}
            {offer.delivery_terms ? <p><span className="font-medium text-slate-700">Lieferung:</span> {offer.delivery_terms}</p> : null}
            {offer.assumptions ? <p><span className="font-medium text-slate-700">Annahmen:</span> {offer.assumptions}</p> : null}
            {offer.exclusions ? <p><span className="font-medium text-slate-700">Ausschlüsse:</span> {offer.exclusions}</p> : null}
          </div>
        </Section>
      ) : null}

      {offer.next_steps ? (
        <Section kicker="Nächste Schritte" title="So geht es weiter"><p className="whitespace-pre-line">{offer.next_steps}</p></Section>
      ) : null}
    </div>
  );
}

export default PremiumOfferWebView;
