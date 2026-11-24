import { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Send, Smartphone } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, Field, InfoBanner, Modal, Select, Textarea, radius, text, useToast,
} from '@/components/dashboard';
import { defaultSubject, renderOnboardingEmail } from '@/lib/clientOnboarding/emailTemplate';
import { newSendKey, sendOnboardingEmail } from '@/lib/clientOnboarding/api';
import type { MessageKind, OwnerOnboardingDetail } from '@/lib/clientOnboarding/types';

const KIND_TITLE: Record<MessageKind, string> = {
  invitation: 'Onboarding-Einladung senden',
  reminder: 'Erinnerung senden',
  request: 'Rückfrage per E-Mail ankündigen',
};

const SOURCE_LABEL = {
  customer: 'Kundenkontakt', member: 'Portalzugang aktiv', portal_invitation: 'Portal-Einladung offen', contact: 'Kontakt der Organisation',
} as const;
// One entry per address; the strongest access state wins.
const SOURCE_RANK = { member: 0, portal_invitation: 1, customer: 2, contact: 3 } as const;
function dedupeContacts(list: OwnerOnboardingDetail['contacts']): OwnerOnboardingDetail['contacts'] {
  const best = new Map<string, OwnerOnboardingDetail['contacts'][number]>();
  for (const c of list) {
    const prev = best.get(c.email);
    if (!prev || SOURCE_RANK[c.source] < SOURCE_RANK[prev.source]) best.set(c.email, { ...c, name: c.name ?? prev?.name ?? null });
  }
  return [...best.values()];
}

/**
 * Composer for every onboarding email. What the owner previews is rendered by the same template
 * module the Edge Function uses, so preview and sent message cannot drift apart.
 *
 * Sending is two-step: compose → confirm. The idempotency key is minted when the owner reaches
 * the confirmation step and is reused for any retry from there, so a double click or a lost
 * response can never send the same message twice.
 */
export function OnboardingComposer({
  open, onClose, detail, kind, requestId, requestQuestion, defaultRecipient, onSent,
}: {
  open: boolean;
  onClose: () => void;
  detail: OwnerOnboardingDetail;
  kind: MessageKind;
  requestId?: string | null;
  requestQuestion?: string | null;
  defaultRecipient?: string | null;
  onSent: () => void;
}) {
  const toast = useToast();
  const company = detail.organization?.name ?? detail.customer.company ?? '';
  const contacts = useMemo(() => dedupeContacts(detail.contacts), [detail.contacts]);
  const [recipient, setRecipient] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [subject, setSubject] = useState('');
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [intro, setIntro] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [format, setFormat] = useState<'html' | 'text'>('html');
  const [step, setStep] = useState<'compose' | 'confirm'>('compose');
  const [busy, setBusy] = useState<'test' | 'send' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sendKey = useRef<string | null>(null);

  // Reset whenever the composer is (re)opened.
  useEffect(() => {
    if (!open) return;
    const initial = defaultRecipient ?? contacts[0]?.email ?? '';
    setRecipient(initial);
    setName(contacts.find((c) => c.email === initial)?.name ?? detail.customer.contact_name ?? '');
    setLanguage('de');
    setSubjectTouched(false);
    setSubject(defaultSubject(kind, 'de', company));
    setIntro('');
    setStep('compose');
    setError(null);
    setBusy(null);
    sendKey.current = null;
  }, [open, kind, defaultRecipient, contacts, company, detail.customer.contact_name]);

  useEffect(() => {
    if (!subjectTouched) setSubject(defaultSubject(kind, language, company));
  }, [language, kind, company, subjectTouched]);

  const portalBase = typeof window !== 'undefined' ? window.location.origin : 'https://cogniiq.de';
  const preview = useMemo(() => renderOnboardingEmail({
    kind, language, recipientName: name || null, company, intro: intro || null,
    ctaUrl: `${portalBase}/app/setup`, portalUrl: `${portalBase}/app`,
    requestQuestion: requestQuestion ?? null,
    sender: { legalName: detail.sender?.legal_name ?? null, email: detail.sender?.email ?? null, phone: detail.sender?.phone ?? null },
  }), [kind, language, name, company, intro, portalBase, requestQuestion, detail.sender]);

  const recipientOptions = contacts.map((c) => ({
    value: c.email, label: c.email, description: [c.name, SOURCE_LABEL[c.source]].filter(Boolean).join(' · '),
  }));
  const isMember = contacts.some((c) => c.email === recipient && c.source === 'member');
  const subjectOk = subject.trim().length >= 3 && subject.length <= 200;
  const canProceed = Boolean(recipient) && subjectOk && intro.length <= 2000;

  async function send(isTest: boolean) {
    setError(null);
    setBusy(isTest ? 'test' : 'send');
    const key = isTest ? newSendKey() : (sendKey.current ??= newSendKey());
    const outcome = await sendOnboardingEmail({
      engagementId: detail.engagement_id, kind, recipientEmail: isTest ? null : recipient,
      recipientName: name.trim() || null, language, subject: subject.trim(), intro: intro.trim() || null,
      isTest, requestId: requestId ?? null, idempotencyKey: key,
    });
    setBusy(null);
    if (!outcome.ok) {
      if (outcome.replay && outcome.status === 'sending') {
        setError('Diese Nachricht wird bereits versendet. Bitte prüfen Sie gleich den Verlauf.');
      } else {
        setError(outcome.error ?? 'Die Nachricht wurde nicht versendet.');
      }
      // A definite failure gets a fresh key for the next attempt; an unclear outcome keeps it.
      if (!isTest && outcome.status === 'failed') sendKey.current = null;
      onSent();
      return;
    }
    if (outcome.recordingWarning) toast.toast({ tone: 'warning', title: outcome.recordingWarning });
    if (isTest) {
      toast.success('Test-E-Mail an Ihre eigene Adresse übergeben', 'Der E-Mail-Anbieter hat die Nachricht angenommen.');
      onSent();
      return;
    }
    toast.success('Vom E-Mail-Anbieter angenommen', `An ${recipient}. Eine Zustellung wird nicht nachverfolgt.`);
    sendKey.current = null;
    onSent();
    onClose();
  }

  const footer = step === 'compose' ? (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <Button variant="secondary" loading={busy === 'test'} disabled={!subjectOk || busy !== null} onClick={() => send(true)}>
          Test an mich senden
        </Button>
        <Button disabled={!canProceed || busy !== null} onClick={() => { setError(null); setStep('confirm'); }}>
          Weiter zur Bestätigung
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button variant="ghost" disabled={busy !== null} onClick={() => setStep('compose')}>Zurück</Button>
      <Button icon={Send} loading={busy === 'send'} disabled={busy !== null} onClick={() => send(false)}>Jetzt senden</Button>
    </div>
  );

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} size="lg" title={KIND_TITLE[kind]}
      description={step === 'compose'
        ? 'Personalisieren Sie die Nachricht. Die Vorschau zeigt exakt die E-Mail, die versendet wird.'
        : 'Bitte prüfen Sie Empfänger und Inhalt. Erst mit „Jetzt senden“ wird die E-Mail versendet.'}
      footer={footer}>
      {error ? <div className="mb-4"><InfoBanner tone="danger" title="Nicht versendet">{error}</InfoBanner></div> : null}

      {step === 'confirm' ? (
        <dl className="space-y-3">
          <ConfirmRow label="Empfänger" value={name ? `${name} <${recipient}>` : recipient} />
          <ConfirmRow label="Betreff" value={subject} />
          <ConfirmRow label="Sprache" value={language === 'de' ? 'Deutsch' : 'Englisch'} />
          <ConfirmRow label="Zugang" value={kind === 'invitation'
            ? (isMember ? 'Hat bereits einen Portalzugang – der Link führt zur Anmeldung.'
              : 'Portal-Einladung (Rolle „Mitglied“) gilt 30 Tage. Ein bestehendes Konto wird weiterverwendet, nie neu angelegt.')
            : 'Link zur Anmeldung im Kundenportal.'} />
          {kind === 'invitation' && !isMember ? (
            <ConfirmRow label="Link in der E-Mail" value="Der Aktivierungslink selbst ist nur kurz gültig (Supabase-Einstellung, die genaue Ablaufzeit sehen Sie nach dem Senden im Verlauf). Läuft er ab, bleibt die Einladung bestehen und Sie senden einfach einen neuen Link." />
          ) : null}
          {requestQuestion ? <ConfirmRow label="Rückfrage" value={requestQuestion} /> : null}
          <p className={cn('pt-1', text.hint)}>
            Nach dem Senden sehen Sie nur, ob der E-Mail-Anbieter die Nachricht angenommen hat. Zustellung, Öffnen oder Lesen
            werden nicht erfasst.
          </p>
        </dl>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div className="space-y-4">
            {recipientOptions.length > 0 ? (
              <Select id="ob-recipient" label="Empfänger" value={recipient} options={recipientOptions}
                onChange={(v) => { setRecipient(v); const c = contacts.find((x) => x.email === v); if (c?.name) setName(c.name); }} />
            ) : (
              <InfoBanner tone="warning" title="Kein Kontakt hinterlegt">
                Hinterlegen Sie beim Kunden eine E-Mail-Adresse. Empfänger sind aus Sicherheitsgründen auf die Kontakte dieses Kunden beschränkt.
              </InfoBanner>
            )}
            <Field id="ob-name" label="Anrede-Name" value={name} onChange={setName} placeholder="z. B. Frau Dr. Muster"
              hint="Erscheint in der Begrüßung. Leer lassen für „Guten Tag,“." />
            <div>
              <p className={cn('mb-1.5', text.label)}>Sprache</p>
              <Segmented value={language} onChange={(v) => setLanguage(v as 'de' | 'en')}
                options={[{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }]} />
            </div>
            <Field id="ob-subject" label="Betreff" value={subject} required
              onChange={(v) => { setSubjectTouched(true); setSubject(v); }}
              error={subjectOk ? undefined : '3 bis 200 Zeichen.'} />
            <Textarea id="ob-intro" label="Persönliche Einleitung (optional)" value={intro} onChange={setIntro} rows={5}
              hint={`Ersetzt den Standardtext. Leerzeile = neuer Absatz. ${intro.length}/2000`} />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Segmented value={device} onChange={(v) => setDevice(v as 'desktop' | 'mobile')}
                options={[{ value: 'desktop', label: 'Desktop', icon: Monitor }, { value: 'mobile', label: 'Mobil', icon: Smartphone }]} />
              <Segmented value={format} onChange={(v) => setFormat(v as 'html' | 'text')}
                options={[{ value: 'html', label: 'HTML' }, { value: 'text', label: 'Nur Text' }]} />
            </div>
            <div className={cn('flex justify-center overflow-hidden border border-[var(--cq-border)] bg-[var(--cq-sunken)] p-3', radius.lg)}>
              {format === 'html' ? (
                <iframe
                  title="E-Mail-Vorschau"
                  // No scripts, no same-origin: the preview can never act on the page.
                  sandbox=""
                  srcDoc={preview.html}
                  className={cn('h-[480px] bg-white transition-[width] duration-200', radius.md, device === 'mobile' ? 'w-[360px]' : 'w-full')}
                />
              ) : (
                <pre className={cn('h-[480px] w-full overflow-auto whitespace-pre-wrap bg-white p-4 font-mono text-[12px] leading-5 text-zinc-800', radius.md)}>
                  {preview.text}
                </pre>
              )}
            </div>
            <p className={cn('mt-2', text.hint)}>
              In der Vorschau führt die Schaltfläche zum Portal. Beim echten Versand erzeugt der Server einen persönlichen Zugangslink.
              Die Test-E-Mail geht an Ihre Inhaber-Adresse und zeigt nur die Nachricht: Mit einem Cogniiq-Konto sehen Sie im Portal
              nicht die Kundenansicht. Den echten Ablauf prüfen Sie mit einer eigenen Test-Adresse, die Sie beim Kunden als Kontakt
              hinterlegen (Kunden → Kontakte), idealerweise bei einem Testkunden.
              Kein Tracking-Pixel, keine Klickverfolgung.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]">
      <dt className={text.label}>{label}</dt>
      <dd className={cn('break-words', text.bodyStrong)}>{value}</dd>
    </div>
  );
}

export function Segmented({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string; icon?: typeof Monitor }>;
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex border border-[var(--cq-border)] bg-[var(--cq-sunken)] p-0.5', radius.md)}>
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.value)}
            className={cn('inline-flex h-7 items-center gap-1.5 px-2.5 text-[12px] font-medium transition-colors', radius.sm,
              active ? 'bg-[var(--cq-surface)] text-[var(--cq-fg)] shadow-sm' : 'text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]')}>
            {Icon ? <Icon size={13} aria-hidden="true" /> : null}{o.label}
          </button>
        );
      })}
    </div>
  );
}

