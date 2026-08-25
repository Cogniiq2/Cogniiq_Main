// Premium offer HTML live preview. Consumes the SAME deterministic PremiumSource model as the
// @react-pdf engine (buildPremiumSource), so the on-screen preview and the printed PDF can never
// drift apart in content — only in visual medium. Read-only; no business logic of its own.

import { buildPremiumSource } from '@/lib/ownerFinance/documents/premium';
import type { TransactionalDocument } from '@/lib/ownerFinance/documents';
import type { TextBlock } from '@/lib/ownerFinance/documents/listFields';

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-1 space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-[12.5px] text-gray-600"><span className="text-[color:var(--accent)]">•</span><span>{it}</span></li>
      ))}
    </ul>
  );
}

function Para({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((p, i) => <p key={i} className="mb-2 text-[12.5px] leading-relaxed text-gray-600">{p.split(/\n/).join(' ')}</p>)}</>;
}

// A list-capable field: bullet rows when the owner entered one entry per line, prose otherwise.
// The decision comes from buildPremiumSource, so this preview and the PDF always agree.
function Block({ block }: { block: TextBlock }) {
  return block.kind === 'list' ? <Bullets items={block.items} /> : <Para text={block.text} />;
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center gap-2">
      <span className="h-3.5 w-[3px] rounded-sm bg-[color:var(--accent)]" />
      <h3 className="text-[13px] font-bold tracking-tight text-gray-900">{children}</h3>
    </div>
  );
}

export function PremiumOfferPreview({ doc }: { doc: TransactionalDocument }) {
  const src = buildPremiumSource(doc);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm" style={{ ['--accent' as string]: src.accent }}>
      {/* Cover */}
      <div className="relative border-b border-gray-100 p-7">
        {src.isDraft ? <span className="absolute right-6 top-6 rounded border px-2 py-1 text-[9px] font-semibold tracking-[0.2em]" style={{ borderColor: src.accent, color: src.accent }}>{src.draftBadge}</span> : null}
        <div className="text-[15px] font-bold text-gray-900">{src.seller.legalName}</div>
        <div className="mt-2 h-[3px] w-12 rounded" style={{ backgroundColor: src.accent }} />
        <div className="mt-8 text-[10px] uppercase tracking-[0.25em] text-gray-400">{src.kindLabel}{src.documentNumber ? ` · ${src.documentNumber}` : src.isDraft ? ' · Entwurf' : ''}</div>
        <h2 className="mt-2 text-[22px] font-bold leading-tight text-gray-900">{src.title}</h2>
        {src.subtitle ? <p className="mt-1.5 text-[13px] text-gray-500">{src.subtitle}</p> : null}
        {src.valueProposition ? <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-gray-600">{src.valueProposition}</p> : null}
        <div className="mt-6 flex flex-wrap gap-x-12 gap-y-3">
          <div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400">Für</div>
            <div className="mt-0.5 text-[12.5px] font-medium text-gray-900">{src.recipient.company}</div>
            {src.recipient.contactName ? <div className="text-[11px] text-gray-500">{src.recipient.contactName}{src.recipient.department ? ` · ${src.recipient.department}` : ''}</div> : null}
            {src.recipient.addressLines.map((l, i) => <div key={i} className="text-[11px] text-gray-500">{l}</div>)}
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400">{src.dates.issueLabel}</div>
            <div className="mt-0.5 text-[12.5px] text-gray-900">{src.dates.issue}</div>
            {src.dates.valid ? <><div className="mt-2 text-[9px] uppercase tracking-[0.15em] text-gray-400">{src.dates.validLabel}</div><div className="text-[12.5px] text-gray-900">{src.dates.valid}</div></> : null}
          </div>
        </div>
      </div>

      <div className="p-7">
        {(src.introduction || src.projectApproach || src.executiveSummary || src.desiredOutcomes.length) ? (
          <section>
            <Head>Ausgangslage &amp; Zielbild</Head>
            {src.introduction ? <><div className="text-[11.5px] font-semibold text-gray-800">Ausgangslage</div><Para text={src.introduction} /></> : null}
            {src.projectApproach ? <><div className="mt-2 text-[11.5px] font-semibold text-gray-800">Zielbild &amp; Vorgehen</div><Para text={src.projectApproach} /></> : null}
            {src.executiveSummary ? <><div className="mt-2 text-[11.5px] font-semibold text-gray-800">Executive Summary</div><Para text={src.executiveSummary} /></> : null}
            {src.desiredOutcomes.length ? <><div className="mt-2 text-[11.5px] font-semibold text-gray-800">Erwartete Ergebnisse</div><Bullets items={src.desiredOutcomes} /></> : null}
          </section>
        ) : null}

        {src.modules.length ? (
          <section>
            <Head>Projektmodule</Head>
            <div className="space-y-3">
              {src.modules.map((m) => (
                <div key={m.index} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: src.accent }}>Modul {m.index}</div>
                      <div className="text-[13px] font-bold text-gray-900">{m.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] uppercase tracking-wide text-gray-400">Netto</div>
                      {/* Recurring positions show the per-interval price, never the term total. */}
                      <div className="text-[13px] font-bold text-gray-900 tabular-nums">{m.netLabel}{m.recurring ? <span className="ml-1 text-[11px] font-semibold text-gray-500">{m.recurring.suffix}</span> : null}</div>
                    </div>
                  </div>
                  {m.details ? <p className="mt-1.5 text-[11.5px] leading-relaxed text-gray-600">{m.details}</p> : null}
                  <Bullets items={m.deliverables} />
                  {m.recurring ? (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-gray-400">
                      {m.recurring.minimumTermLabel ? <span>Mindestlaufzeit: <span className="text-gray-700">{m.recurring.minimumTermLabel}</span></span> : null}
                      <span>Abrechnung: <span className="text-gray-700">{m.recurring.intervalAdverb}</span></span>
                      {m.recurring.billingStartLabel ? <span>Beginn: <span className="text-gray-700">{m.recurring.billingStartLabel}</span></span> : null}
                    </div>
                  ) : null}
                  {(m.phaseLabel || m.durationLabel) ? (
                    <div className="mt-2 flex gap-4 text-[10.5px] text-gray-400">
                      {m.phaseLabel ? <span>Phase: <span className="text-gray-700">{m.phaseLabel}</span></span> : null}
                      {m.durationLabel ? <span>Dauer: <span className="text-gray-700">{m.durationLabel}</span></span> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {src.optionalModules.length ? (
          <section>
            <Head>Optionale Zusatzmodule</Head>
            <div className="space-y-2">
              {src.optionalModules.map((m) => (
                <div key={m.index} className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-4 py-2.5">
                  <span className="text-[12px] text-gray-700">{m.title}</span>
                  <span className="text-[12px] font-medium text-gray-500 tabular-nums">{m.netLabel}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* One-time investment and ongoing commitment are two separate headline figures. The
            first-term contract value stays visually secondary. */}
        <section>
          <Head>Investitionsübersicht</Head>
          <div className="space-y-2.5">
            {src.investment.oneTime ? (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {src.investment.isSplit ? <div className="border-b border-gray-100 px-4 pt-2.5 text-[9px] uppercase tracking-[0.12em] pb-1.5" style={{ color: src.accent }}>Einmalige Investition</div> : null}
                <div className="flex justify-between px-4 py-2 text-[12px]"><span className="text-gray-500">Nettosumme</span><span className="tabular-nums">{src.investment.oneTime.netLabel}</span></div>
                {src.investment.oneTime.vatRows.map((r, i) => (
                  <div key={i} className="flex justify-between border-t border-gray-100 px-4 py-2 text-[12px]"><span className="text-gray-500">{r.label} · Netto {r.net}</span><span className="tabular-nums">{r.vat}</span></div>
                ))}
                <div className="flex justify-between border-t border-gray-100 px-4 py-2 text-[12px]"><span className="text-gray-500">Umsatzsteuer gesamt</span><span className="tabular-nums">{src.investment.oneTime.vatTotalLabel}</span></div>
                <div className="flex justify-between bg-gray-50 px-4 py-3"><span className="text-[12.5px] font-bold text-gray-900">{src.investment.isSplit ? 'Einmalige Investition (brutto)' : 'Gesamtinvestition (brutto)'}</span><span className="text-[15px] font-bold text-gray-900 tabular-nums">{src.investment.oneTime.grossLabel}</span></div>
              </div>
            ) : null}

            {src.investment.recurring.map((r, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-100">
                <div className="border-b border-gray-100 px-4 pt-2.5 pb-1.5 text-[9px] uppercase tracking-[0.12em]" style={{ color: src.accent }}>Laufende Betreuung</div>
                <div className="flex justify-between px-4 py-2 text-[12px]"><span className="text-gray-500">Netto {r.suffix}</span><span className="tabular-nums">{r.netLabel} {r.suffix}</span></div>
                {r.vatRows.map((v, j) => (
                  <div key={j} className="flex justify-between border-t border-gray-100 px-4 py-2 text-[12px]"><span className="text-gray-500">{v.label} · Netto {v.net}</span><span className="tabular-nums">{v.vat}</span></div>
                ))}
                <div className="flex justify-between bg-gray-50 px-4 py-3"><span className="text-[12.5px] font-bold text-gray-900">Laufende Betreuung (brutto)</span><span className="text-[15px] font-bold text-gray-900 tabular-nums">{r.grossLabel} {r.suffix}</span></div>
                <div className="border-t border-gray-100 px-4 py-2 text-[10.5px] text-gray-400">
                  Abrechnung: <span className="text-gray-700">{r.intervalAdverb}</span>
                  {r.minimumTermLabel ? <> · Mindestlaufzeit: <span className="text-gray-700">{r.minimumTermLabel}</span></> : null}
                  {r.billingStartLabel ? <> · Beginn: <span className="text-gray-700">{r.billingStartLabel}</span></> : null}
                </div>
              </div>
            ))}

            {src.investment.minimumTermTotalNetLabel ? (
              <p className="px-1 text-[10.5px] leading-relaxed text-gray-400">
                Gesamtwert während der ersten Mindestlaufzeit: <span className="text-gray-600">{src.investment.minimumTermTotalNetLabel} netto</span>
                {src.investment.minimumTermTotalGrossLabel ? ` (${src.investment.minimumTermTotalGrossLabel} brutto)` : ''}. Nicht sofort fällig — die laufenden Leistungen werden gemäß ihrem Abrechnungsintervall berechnet.
              </p>
            ) : null}
          </div>
        </section>

        {src.timeline.length ? (
          <section>
            <Head>Zeitplan &amp; Zusammenarbeit</Head>
            <div className="space-y-2.5">
              {src.timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-24 shrink-0"><div className="text-[10.5px] font-bold" style={{ color: src.accent }}>{t.phase}</div>{t.duration ? <div className="text-[9.5px] text-gray-400">{t.duration}</div> : null}</div>
                  <div><div className="text-[12px] font-semibold text-gray-900">{t.title}</div>{t.description ? <div className="text-[11px] text-gray-600">{t.description}</div> : null}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {src.payment.rows.length ? (
          <section>
            <Head>Zahlungsplan</Head>
            {src.payment.scopeNote ? <p className="mb-2 text-[11px] leading-relaxed text-gray-500">{src.payment.scopeNote}</p> : null}
            <div>
              {src.payment.rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 py-2">
                  <div><div className="text-[12px] text-gray-800">{r.label}</div>{r.note ? <div className="text-[10px] text-gray-400">{r.note}</div> : null}</div>
                  <div className="flex items-center gap-3">{r.amountLabel ? <span className="text-[11px] text-gray-400 tabular-nums">{r.amountLabel}</span> : null}<span className="text-[13px] font-bold tabular-nums" style={{ color: src.accent }}>{r.right}</span></div>
                </div>
              ))}
            </div>
            {!src.payment.balanced ? <p className="mt-2 text-[11px] text-amber-600">Hinweis: Die Prozentsätze ergeben nicht 100 %.</p> : null}
          </section>
        ) : null}

        {(src.assumptions || src.exclusions) ? (
          <section>
            <Head>Annahmen &amp; Ausschlüsse</Head>
            <div className="grid gap-5 sm:grid-cols-2">
              {src.assumptions ? <div><div className="text-[11.5px] font-semibold text-gray-800">Annahmen</div><Block block={src.assumptions} /></div> : null}
              {src.exclusions ? <div><div className="text-[11.5px] font-semibold text-gray-800">Nicht enthalten</div><Block block={src.exclusions} /></div> : null}
            </div>
          </section>
        ) : null}

        {(src.closing || src.nextSteps) ? (
          <section>
            <Head>Nächste Schritte</Head>
            {src.closing ? <p className="mb-3 text-[12px] leading-relaxed text-gray-600">{src.closing}</p> : null}
            <div className="rounded-lg border-l-[3px] bg-gray-50 p-3" style={{ borderColor: src.accent }}>
              <div className="text-[11.5px] font-bold text-gray-900">Nächster Schritt</div>
              <div className="text-[12px] text-gray-600">{src.nextSteps ?? 'Nach Ihrer Online-Annahme stimmen wir gemeinsam den Projektstart ab.'}</div>
            </div>
          </section>
        ) : null}

        {src.footer ? <p className="mt-6 border-t border-gray-100 pt-3 text-[9.5px] text-gray-400">{src.footer}</p> : null}
      </div>
    </div>
  );
}
