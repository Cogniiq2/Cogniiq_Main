import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Card, Field, InfoBanner, SectionHeader, Select, Textarea, useToast } from '@/components/dashboard';
import { loadDocumentSettings, upsertDocumentSettings } from '@/lib/ownerFinance/offersApi';
import { formatCentsCurrencyDe } from '@/lib/ownerFinance/exports';
import type { OwnerDocumentSettings } from '@/lib/ownerFinance/types';

// "Dokumente & Rechnungsangaben" — business identity + document defaults used to render offers and
// invoices. Bank/tax identifiers are stored owner-only (RLS) and only appear on intended customer
// documents. No secrets/credentials. IBAN/BIC format is validated locally (no ownership assertion).

type Draft = Partial<Record<keyof OwnerDocumentSettings, string>>;

const FIELDS: Array<{ key: keyof OwnerDocumentSettings; label: string; group: string; hint?: string; area?: boolean }> = [
  { key: 'legal_name', label: 'Firmenname (rechtlich)', group: 'Identität' },
  { key: 'owner_name', label: 'Inhaber:in', group: 'Identität' },
  { key: 'street', label: 'Straße & Nr.', group: 'Identität' },
  { key: 'postal_code', label: 'PLZ', group: 'Identität' },
  { key: 'city', label: 'Ort', group: 'Identität' },
  { key: 'business_email', label: 'Geschäfts-E-Mail', group: 'Identität' },
  { key: 'business_phone', label: 'Telefon', group: 'Identität' },
  { key: 'website', label: 'Website', group: 'Identität' },
  { key: 'tax_number', label: 'Steuernummer', group: 'Steuer' },
  { key: 'vat_id', label: 'USt-IdNr.', group: 'Steuer' },
  { key: 'bank_account_holder', label: 'Kontoinhaber', group: 'Bank (nur Eigentümer)' },
  { key: 'iban', label: 'IBAN', group: 'Bank (nur Eigentümer)', hint: 'Formatprüfung lokal — keine Kontoinhaber-Verifikation.' },
  { key: 'bic', label: 'BIC', group: 'Bank (nur Eigentümer)' },
  { key: 'bank_name', label: 'Bank', group: 'Bank (nur Eigentümer)' },
];

const GROUPS = ['Identität', 'Steuer', 'Bank (nur Eigentümer)'];

export function DocumentSettingsSection({ entityId, entityName }: { entityId: string; entityName: string }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await loadDocumentSettings(entityId);
      if (s) {
        const d: Draft = {};
        (Object.keys(s) as Array<keyof OwnerDocumentSettings>).forEach((k) => { const v = s[k]; if (v != null) d[k] = String(v); });
        setDraft(d);
      }
    } catch { /* first-time: no row yet */ }
    finally { setLoading(false); }
  }, [entityId]);

  useEffect(() => { void load(); }, [load]);

  const set = (k: keyof OwnerDocumentSettings, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const patch: Record<string, unknown> = {};
    (Object.keys(draft) as Array<keyof OwnerDocumentSettings>).forEach((k) => { patch[k] = draft[k] ?? null; });
    if (draft.default_payment_terms_days) patch.default_payment_terms_days = Number(draft.default_payment_terms_days);
    if (draft.default_offer_validity_days) patch.default_offer_validity_days = Number(draft.default_offer_validity_days);
    if (draft.default_invoice_due_days) patch.default_invoice_due_days = Number(draft.default_invoice_due_days);
    // Automation toggles are stored as real booleans (checkbox drafts are 'true'/'false' strings).
    ([
      'auto_create_invoice_on_acceptance', 'auto_issue_invoice_on_acceptance', 'auto_send_invoice_on_acceptance',
      'auto_generate_signed_certificate_on_acceptance', 'auto_send_signed_confirmation_on_acceptance',
    ] as const)
      .forEach((k) => { if (draft[k] != null) patch[k] = draft[k] === 'true'; });
    const { error } = await upsertDocumentSettings(entityId, patch);
    setSaving(false);
    if (error) { toast.error('Speichern fehlgeschlagen', error); return; }
    toast.success('Dokumenteinstellungen gespeichert');
    void load();
  };

  const previewSeller = useMemo(() => [draft.legal_name || entityName, draft.street, [draft.postal_code, draft.city].filter(Boolean).join(' ')].filter(Boolean), [draft, entityName]);

  if (loading) return <Card><div className="h-24 animate-pulse rounded-xl bg-gray-100" /></Card>;

  return (
    <Card>
      <SectionHeader title="Dokumente & Rechnungsangaben" description="Für Angebots- und Rechnungs-PDFs. Bank-/Steuerangaben sind nur für Eigentümer sichtbar und erscheinen ausschließlich auf den vorgesehenen Kundendokumenten." />
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">{group}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.filter((f) => f.group === group).map((f) => (
                <Field key={f.key} id={f.key} label={f.label} value={draft[f.key] ?? ''} onChange={(v) => set(f.key, v)} hint={f.hint} />
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Standardwerte</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="default_payment_terms_days" label="Zahlungsziel (Tage)" value={draft.default_payment_terms_days ?? '14'} onChange={(v) => set('default_payment_terms_days', v)} inputMode="numeric" />
            <Field id="default_offer_validity_days" label="Angebotsgültigkeit (Tage)" value={draft.default_offer_validity_days ?? '30'} onChange={(v) => set('default_offer_validity_days', v)} inputMode="numeric" />
            <Field id="offer_number_prefix" label="Angebotsnummer-Präfix" value={draft.offer_number_prefix ?? 'AN'} onChange={(v) => set('offer_number_prefix', v)} />
            <Field id="invoice_number_prefix" label="Rechnungsnummer-Präfix" value={draft.invoice_number_prefix ?? 'RE'} onChange={(v) => set('invoice_number_prefix', v)} />
            <Select id="document_language" label="Dokumentsprache" value={draft.document_language ?? 'de'} onChange={(v) => set('document_language', v)} options={[{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'Englisch' }]} />
          </div>
          <div className="mt-4 grid gap-4">
            <Textarea id="default_offer_intro" label="Standard-Einleitung (Angebot)" value={draft.default_offer_intro ?? ''} onChange={(v) => set('default_offer_intro', v)} rows={2} />
            <Textarea id="default_invoice_footer" label="Standard-Fußzeile (Rechnung)" value={draft.default_invoice_footer ?? ''} onChange={(v) => set('default_invoice_footer', v)} rows={2} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Automatik bei Annahme</p>
          <p className="mb-3 text-[12px] text-gray-500">Steuern Sie, was nach einer verbindlichen Kundenannahme automatisch geschieht. Ausstellen und Versand sind aus Sicherheitsgründen erst nach bewusster Aktivierung aktiv.</p>
          <div className="space-y-2.5">
            {([
              { key: 'auto_generate_signed_certificate_on_acceptance', label: 'Unterschriebene Annahmebestätigung automatisch erzeugen', def: true, hint: 'Empfohlen — erstellt einen dauerhaften, rechtssicheren PDF-Nachweis der Annahme mit der erfassten Unterschrift.' },
              { key: 'auto_send_signed_confirmation_on_acceptance', label: 'Bestätigungs-E-Mail automatisch an den Kunden senden', def: true, hint: 'Empfohlen — sendet dem Kunden eine professionelle Bestätigung mit angehängter Annahmebestätigung.' },
              { key: 'auto_create_invoice_on_acceptance', label: 'Rechnungsentwurf automatisch erstellen', def: true, hint: null },
              { key: 'auto_issue_invoice_on_acceptance', label: 'Rechnung automatisch ausstellen', def: false, hint: 'Aus Sicherheitsgründen standardmäßig deaktiviert.' },
              { key: 'auto_send_invoice_on_acceptance', label: 'Rechnung automatisch versenden', def: false, hint: 'Aus Sicherheitsgründen standardmäßig deaktiviert. Nur nach bewusster Aktivierung.' },
            ] as const).map((row) => (
              <label key={row.key} className="flex items-start gap-3 text-[13px] text-gray-700">
                <input type="checkbox"
                  checked={(draft[row.key] ?? String(row.def)) === 'true'}
                  onChange={(e) => set(row.key, String(e.target.checked))}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                <span>
                  {row.label}
                  {row.hint ? <span className="block text-[11px] text-gray-400">{row.hint}</span> : null}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id="default_invoice_due_days" label="Rechnungs-Fälligkeit (Tage)" value={draft.default_invoice_due_days ?? '14'} onChange={(v) => set('default_invoice_due_days', v)} inputMode="numeric" />
            <Field id="invoice_email_subject_template" label="Rechnungs-E-Mail Betreff (optional)" value={draft.invoice_email_subject_template ?? ''} onChange={(v) => set('invoice_email_subject_template', v)} />
            <Field id="confirmation_email_subject_template" label="Bestätigungs-E-Mail Betreff (optional)" value={draft.confirmation_email_subject_template ?? ''} onChange={(v) => set('confirmation_email_subject_template', v)} hint="Platzhalter: {{offer_number}}, {{recipient_name}}, {{gross_total}}" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Dokumentvorschau (Absender)</p>
          <div className="text-[13px] leading-relaxed text-gray-700">
            {previewSeller.map((l, i) => <p key={i} className={i === 0 ? 'font-semibold text-gray-950' : ''}>{l}</p>)}
            {draft.vat_id ? <p className="mt-1 text-gray-500">USt-IdNr. {draft.vat_id}</p> : null}
            {draft.iban ? <p className="text-gray-500">IBAN {draft.iban} · Beispielbetrag {formatCentsCurrencyDe(123456)}</p> : null}
          </div>
        </div>

        <InfoBanner tone="info" title="Keine Rechtszusicherung">Vollständig ausgefüllte Felder bedeuten keine rechtliche oder steuerliche Vollständigkeit. Bitte fachlich prüfen.</InfoBanner>
        <div className="flex justify-end"><Button onClick={() => void save()} loading={saving}>Dokumenteinstellungen speichern</Button></div>
      </div>
    </Card>
  );
}
