import { useCallback, useEffect, useState } from 'react';

import {
  Button, Card, Checkbox, ErrorState, Field, KpiSkeletonGrid, PageHeader, SectionHeader, Select,
  StatusBadge, useToast,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadTaxSettings, upsertTaxSettings } from '@/lib/ownerFinance/api';
import { parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerTaxSettings } from '@/lib/ownerFinance/types';

function bpToPercent(bp: number | null): string { return bp == null ? '' : (bp / 100).toString(); }
function percentToBp(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function SettingsPage() {
  const { entity, taxYear, reload: reloadEntity } = useOwnerEntity();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (err) { setFormError(err); toast.error('Speichern fehlgeschlagen', err); return; }
    toast.success('Einstellungen gespeichert', 'Steuerannahmen aktualisiert.');
    void load();
    void reloadEntity();
  };

  if (!entity) return <KpiSkeletonGrid />;

  return (
    <>
      <PageHeader title="Einstellungen" description={`Geschäftseinheit und steuerliche Annahmen für ${taxYear}. Es werden keine ELSTER-Passwörter oder Zertifikate gespeichert.`} />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {loading ? (
        <div className="space-y-6"><KpiSkeletonGrid /><KpiSkeletonGrid count={3} /></div>
      ) : (
        <div className="space-y-6">
          <Card>
            <SectionHeader title="Geschäftseinheit" description="Feste Rahmendaten dieses Einzelunternehmens." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ReadOnly label="Name" value={entity.display_name} />
              <ReadOnly label="Rechtsform" value="Einzelunternehmen" />
              <ReadOnly label="Tätigkeit" value="Gewerbebetrieb" />
              <ReadOnly label="Gewinnermittlung" value="EÜR" />
              <ReadOnly label="USt" value="Regelbesteuerung" />
              <ReadOnly label="Bundesland" value={entity.federal_state ?? '—'} />
            </div>
          </Card>

          <Card>
            <SectionHeader
              title={`Steuerliche Annahmen ${taxYear}`}
              description="Diese Eingaben steuern die Steuerschätzungen im Kontrollzentrum."
              action={<StatusBadge label={setupComplete ? 'Setup vollständig' : 'Setup unvollständig'} tone={setupComplete ? 'success' : 'warning'} />}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field id="hebesatz" label="Gewerbesteuer-Hebesatz (%)" value={hebesatz} onChange={setHebesatz} placeholder="z. B. 490" hint="Gemeindespezifisch, min. 200 %" inputMode="decimal" />
              <Select id="vatTiming" label="USt-Modus" value={vatTiming} onChange={setVatTiming} options={[{ value: '', label: 'Unbekannt' }, { value: 'ist', label: 'Ist-Versteuerung' }, { value: 'soll', label: 'Soll-Versteuerung' }]} />
              <Select id="vatFreq" label="USt-Voranmeldung" value={vatFrequency} onChange={setVatFrequency} options={[{ value: '', label: 'Unbekannt' }, { value: 'monthly', label: 'Monatlich' }, { value: 'quarterly', label: 'Vierteljährlich' }, { value: 'annual', label: 'Jährlich' }]} />
              <Select id="assessment" label="Veranlagung" value={assessmentMode} onChange={setAssessmentMode} options={[{ value: 'single', label: 'Einzelveranlagung' }, { value: 'joint', label: 'Zusammenveranlagung' }]} />
              <Select id="church" label="Kirchensteuer" value={churchEnabled} onChange={setChurchEnabled} options={[{ value: 'false', label: 'Deaktiviert' }, { value: 'true', label: 'Aktiviert' }]} />
              <Field id="churchRate" label="Kirchensteuersatz (%)" value={churchRate} onChange={setChurchRate} hint="Bayern 8 %" inputMode="decimal" disabled={churchEnabled !== 'true'} />
              <Field id="otherIncome" label="Anderes zu verst. Einkommen (€)" value={otherIncome} onChange={setOtherIncome} placeholder="ohne Cogniiq, nach Abzügen" hint="Bestimmt die ESt-Schätzung" inputMode="decimal" />
              <Field id="incomePrepay" label="ESt-Vorauszahlungen (€)" value={incomePrepay} onChange={setIncomePrepay} inputMode="decimal" />
              <Field id="tradePrepay" label="GewSt-Vorauszahlungen (€)" value={tradePrepay} onChange={setTradePrepay} inputMode="decimal" />
              <Field id="reserveHorizon" label="Rücklage-Horizont (Tage)" value={reserveHorizon} onChange={setReserveHorizon} inputMode="numeric" />
            </div>
            <div className="mt-4">
              <Checkbox id="setupComplete" checked={setupComplete} onChange={setSetupComplete} label="Setup als vollständig markieren" hint="Schaltet die vollständige Steuerschätzung frei." />
            </div>
            {formError ? <p className="mt-3 text-[13px] text-red-600">{formError}</p> : null}
            <div className="mt-5">
              <Button onClick={() => void save()} loading={saving}>Speichern</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-950">{value}</p>
    </div>
  );
}
