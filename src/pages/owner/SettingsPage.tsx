import { useCallback, useEffect, useState } from 'react';

import { OwnerButton, OwnerCard, OwnerError, OwnerField, OwnerLoading, OwnerPageHeader, OwnerPill, OwnerSelect } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadTaxSettings, upsertTaxSettings } from '@/lib/ownerFinance/api';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerTaxSettings } from '@/lib/ownerFinance/types';

function bpToPercent(bp: number | null): string { return bp == null ? '' : (bp / 100).toString(); }
function percentToBp(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function SettingsPage() {
  const { entity, taxYear } = useOwnerEntity();
  const [settings, setSettings] = useState<OwnerTaxSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [hebesatz, setHebesatz] = useState('');
  const [vatTiming, setVatTiming] = useState('');
  const [vatFrequency, setVatFrequency] = useState('');
  const [assessmentMode, setAssessmentMode] = useState('single');
  const [churchEnabled, setChurchEnabled] = useState('false');
  const [churchRate, setChurchRate] = useState('8');
  const [otherIncome, setOtherIncome] = useState('');
  const [incomePrepay, setIncomePrepay] = useState('');
  const [tradePrepay, setTradePrepay] = useState('');
  const [reserveHorizon, setReserveHorizon] = useState('90');
  const [setupComplete, setSetupComplete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const s = await loadTaxSettings(entity.id, taxYear);
      setSettings(s);
      if (s) {
        setHebesatz(bpToPercent(s.trade_tax_hebesatz_bp));
        setVatTiming(s.vat_timing ?? '');
        setVatFrequency(s.vat_filing_frequency ?? '');
        setAssessmentMode(s.assessment_mode);
        setChurchEnabled(String(s.church_tax_enabled));
        setChurchRate(bpToPercent(s.church_tax_rate_bp) || '8');
        setOtherIncome(s.estimated_other_taxable_income_cents != null ? (s.estimated_other_taxable_income_cents / 100).toFixed(2) : '');
        setIncomePrepay((s.income_tax_prepayments_cents / 100).toFixed(2));
        setTradePrepay((s.trade_tax_prepayments_cents / 100).toFixed(2));
        setReserveHorizon(String(s.reserve_horizon_days));
        setSetupComplete(s.setup_complete);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [entity, taxYear]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!entity) return;
    setFormError(null);
    const hb = percentToBp(hebesatz);
    if (hebesatz.trim() !== '' && (hb == null || hb < 20000)) { setFormError('Hebesatz muss mindestens 200 % betragen.'); return; }
    const money = (v: string) => { const p = parseAmountToCents(v); return 'error' in p ? undefined : p.cents; };
    if (otherIncome.trim() && money(otherIncome) === undefined) { setFormError('Ungültiges anderes Einkommen.'); return; }

    setSaving(true);
    const { error: err } = await upsertTaxSettings(entity.id, taxYear, {
      trade_tax_hebesatz_bp: hb,
      vat_timing: (vatTiming || null) as OwnerTaxSettings['vat_timing'],
      vat_filing_frequency: (vatFrequency || null) as OwnerTaxSettings['vat_filing_frequency'],
      assessment_mode: assessmentMode as OwnerTaxSettings['assessment_mode'],
      church_tax_enabled: churchEnabled === 'true',
      church_tax_rate_bp: churchEnabled === 'true' ? percentToBp(churchRate) : null,
      estimated_other_taxable_income_cents: otherIncome.trim() ? money(otherIncome) ?? null : null,
      income_tax_prepayments_cents: money(incomePrepay) ?? 0,
      trade_tax_prepayments_cents: money(tradePrepay) ?? 0,
      reserve_horizon_days: Number(reserveHorizon) || 90,
      setup_complete: setupComplete,
    });
    setSaving(false);
    if (err) { setFormError(err); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    void load();
  };

  if (!entity) return <OwnerLoading label="Wird geladen" />;

  return (
    <>
      <OwnerPageHeader title="Einstellungen" description={`Geschäftseinheit und steuerliche Annahmen für ${taxYear}. Es werden keine ELSTER-Passwörter oder Zertifikate gespeichert.`} />
      {error ? <OwnerError message={error} /> : null}
      {loading ? <OwnerLoading label="Einstellungen werden geladen" /> : (
        <div className="space-y-6">
          <OwnerCard>
            <p className="mb-4 text-sm font-semibold text-white">Geschäftseinheit</p>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <ReadOnly label="Name" value={entity.display_name} />
              <ReadOnly label="Rechtsform" value="Einzelunternehmen" />
              <ReadOnly label="Tätigkeit" value="Gewerbebetrieb" />
              <ReadOnly label="Gewinnermittlung" value="EÜR" />
              <ReadOnly label="USt" value="Regelbesteuerung" />
              <ReadOnly label="Bundesland" value={entity.federal_state ?? '—'} />
            </div>
          </OwnerCard>

          <OwnerCard>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Steuerliche Annahmen {taxYear}</p>
              <OwnerPill label={setupComplete ? 'Setup vollständig' : 'Setup unvollständig'} tone={setupComplete ? 'success' : 'warning'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <OwnerField id="hebesatz" label="Gewerbesteuer-Hebesatz (%)" value={hebesatz} onChange={setHebesatz} placeholder="z. B. 490" hint="Gemeindespezifisch, min. 200 %" />
              <OwnerSelect id="vatTiming" label="USt-Modus" value={vatTiming} onChange={setVatTiming} options={[{ value: '', label: 'Unbekannt' }, { value: 'ist', label: 'Ist-Versteuerung' }, { value: 'soll', label: 'Soll-Versteuerung' }]} />
              <OwnerSelect id="vatFreq" label="USt-Voranmeldung" value={vatFrequency} onChange={setVatFrequency} options={[{ value: '', label: 'Unbekannt' }, { value: 'monthly', label: 'Monatlich' }, { value: 'quarterly', label: 'Vierteljährlich' }, { value: 'annual', label: 'Jährlich' }]} />
              <OwnerSelect id="assessment" label="Veranlagung" value={assessmentMode} onChange={setAssessmentMode} options={[{ value: 'single', label: 'Einzelveranlagung' }, { value: 'joint', label: 'Zusammenveranlagung' }]} />
              <OwnerSelect id="church" label="Kirchensteuer" value={churchEnabled} onChange={setChurchEnabled} options={[{ value: 'false', label: 'Deaktiviert' }, { value: 'true', label: 'Aktiviert' }]} />
              <OwnerField id="churchRate" label="Kirchensteuersatz (%)" value={churchRate} onChange={setChurchRate} hint="Bayern 8 %" />
              <OwnerField id="otherIncome" label="Anderes zu verst. Einkommen (€)" value={otherIncome} onChange={setOtherIncome} placeholder="ohne Cogniiq, nach Abzügen" hint="Bestimmt die ESt-Schätzung" />
              <OwnerField id="incomePrepay" label="ESt-Vorauszahlungen (€)" value={incomePrepay} onChange={setIncomePrepay} />
              <OwnerField id="tradePrepay" label="GewSt-Vorauszahlungen (€)" value={tradePrepay} onChange={setTradePrepay} />
              <OwnerField id="reserveHorizon" label="Rücklage-Horizont (Tage)" value={reserveHorizon} onChange={setReserveHorizon} />
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={setupComplete} onChange={(e) => setSetupComplete(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-transparent" />
              Setup als vollständig markieren (schaltet die vollständige Steuerschätzung frei)
            </label>
            {formError ? <p className="mt-3 text-sm text-rose-400">{formError}</p> : null}
            <div className="mt-5 flex items-center gap-3">
              <OwnerButton onClick={() => void save()} disabled={saving}>{saving ? 'Speichern…' : 'Speichern'}</OwnerButton>
              {saved ? <span className="text-sm text-emerald-300">Gespeichert.</span> : null}
              {settings ? <span className="text-[12px] text-slate-500">Zuletzt: {settings.income_tax_prepayments_cents != null ? formatCents(settings.income_tax_prepayments_cents) : '—'} ESt-VZ</span> : null}
            </div>
          </OwnerCard>
        </div>
      )}
    </>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
