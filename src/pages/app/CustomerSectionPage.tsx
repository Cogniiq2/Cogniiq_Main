import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Circle,
  CreditCard,
  FileText,
  Headphones,
  Info,
  Lock,
  LogOut,
  Mic2,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TestTube2,
  UserPlus,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppAddButton,
  AppButton,
  AppCard,
  AppEmptyState,
  AppField,
  AppInlineEditor,
  AppLaunchChecklist,
  AppPageHeader,
  AppPreviewNotice,
  AppProgress,
  AppSaveBar,
  AppSection,
  AppSegmentedControl,
  AppSelect,
  AppStatusBadge,
  AppStepList,
  AppTextarea,
  appEase,
} from '@/components/app/CustomerAppPrimitives';
import {
  billingAreas,
  defaultLifecycleState,
  knowledgeSections,
  launchChecklist,
  lifecycleDisplays,
  onboardingStages,
  phoneRoles,
  researchPreviewSteps,
  testScenarios,
} from '@/components/app/customerPortalModel';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { cn } from '@/lib/utils';

export type CustomerSection =
  | 'onboarding'
  | 'receptionist'
  | 'knowledge'
  | 'phone'
  | 'test'
  | 'calls'
  | 'leads'
  | 'billing'
  | 'settings';

const sectionConfig: Record<CustomerSection, {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
}> = {
  onboarding: {
    title: 'Einrichtung',
    eyebrow: 'Onboarding',
    description: 'Ein ruhiger, gefuehrter Start fuer Unternehmensdaten, Ziele und die spaetere Recherche.',
    icon: Wand2,
  },
  receptionist: {
    title: 'Rezeptionist',
    eyebrow: 'Verhalten',
    description: 'Identitaet, Sprache, Tonalitaet, Aufgaben und Grenzen des spaeteren KI-Rezeptionisten.',
    icon: Headphones,
  },
  knowledge: {
    title: 'Wissen',
    eyebrow: 'Antwortgrundlage',
    description: 'Die spaetere Review-Flaeche fuer bestaetigte Geschaeftsdaten, Quellen und manuelle Korrekturen.',
    icon: BookOpen,
  },
  phone: {
    title: 'Telefon',
    eyebrow: 'Anbindung',
    description: 'Telefonrollen, Weiterleitung, Eskalation und Aktivierungsstatus klar getrennt.',
    icon: Phone,
  },
  test: {
    title: 'Test & Start',
    eyebrow: 'Qualitaet',
    description: 'Test-Szenarien und Launch-Checkliste, ohne echte Anrufe oder Go-live auszufuehren.',
    icon: TestTube2,
  },
  calls: {
    title: 'Anrufe',
    eyebrow: 'Betrieb',
    description: 'Leere, aber vorbereitete Architektur fuer spaetere echte Anrufdaten.',
    icon: Mic2,
  },
  leads: {
    title: 'Leads',
    eyebrow: 'Kontakte',
    description: 'Leere, aber vorbereitete Architektur fuer spaetere echte Leads.',
    icon: UserPlus,
  },
  billing: {
    title: 'Abrechnung',
    eyebrow: 'Konto',
    description: 'Billing-Struktur ohne Stripe-Verbindung, Preise oder erfundene Tarife.',
    icon: CreditCard,
  },
  settings: {
    title: 'Einstellungen',
    eyebrow: 'Profil',
    description: 'Echte Profilinformationen plus UI-only Bereiche fuer spaetere Konto- und Firmeneinstellungen.',
    icon: Settings,
  },
};

export function CustomerSectionPage({ section }: { section: CustomerSection }) {
  const config = sectionConfig[section];
  const Icon = config.icon;
  const lifecycle = lifecycleDisplays[defaultLifecycleState];

  return (
    <CustomerAppShell>
      <AppPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        meta={
          <div className="flex flex-wrap gap-2">
            <AppStatusBadge label={lifecycle.label} tone={lifecycle.tone} />
            <AppStatusBadge label="UI-only Phase" tone="neutral" icon={Icon} />
          </div>
        }
      />
      {renderSection(section)}
    </CustomerAppShell>
  );
}

function renderSection(section: CustomerSection) {
  switch (section) {
    case 'onboarding':
      return <OnboardingExperience />;
    case 'receptionist':
      return <ReceptionistExperience />;
    case 'knowledge':
      return <KnowledgeExperience />;
    case 'phone':
      return <PhoneExperience />;
    case 'test':
      return <TestExperience />;
    case 'calls':
      return <OperationalExperience type="calls" />;
    case 'leads':
      return <OperationalExperience type="leads" />;
    case 'billing':
      return <BillingExperience />;
    case 'settings':
      return <SettingsExperience />;
  }
}

function OnboardingExperience() {
  const [stageIndex, setStageIndex] = useState(0);
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    industry: '',
    address: '',
    contactEmail: '',
    contactPerson: '',
    businessNumber: '',
    preferredBehavior: '',
  });
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const activeStage = onboardingStages[stageIndex];
  const progress = Math.round(((stageIndex + 1) / onboardingStages.length) * 100);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.045)]">
          <div className="p-6 sm:p-8">
          <div className="mb-6">
            <AppProgress value={progress} label={`Schritt ${stageIndex + 1} von ${onboardingStages.length}`} />
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{activeStage.title}</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950">{activeStage.description}</h2>
            </div>
            <AppStatusBadge label="nicht gespeichert" tone="attention" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: appEase }}
            >
          {stageIndex === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <AppField id="company-name" label="Unternehmensname" value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} placeholder="z. B. Cogniiq GmbH" />
              <AppField id="company-website" label="Website" value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://..." />
              <AppField id="company-industry" label="Branche" value={form.industry} onChange={(event) => updateField('industry', event.target.value)} placeholder="Praxis, Restaurant, Dienstleister ..." />
              <AppField id="company-address" label="Adresse" value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Strasse, PLZ, Ort" />
              <AppField id="company-contact-email" label="Kontakt-E-Mail" value={form.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} placeholder="name@unternehmen.de" />
              <AppField id="company-contact-person" label="Ansprechpartner" value={form.contactPerson} onChange={(event) => updateField('contactPerson', event.target.value)} placeholder="Vorname Nachname" />
              <AppField id="company-business-number" label="Bestehende Geschaeftsnummer" value={form.businessNumber} onChange={(event) => updateField('businessNumber', event.target.value)} placeholder="+49 ..." />
            </div>
          ) : null}

          {stageIndex === 1 ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Hauefige Fragen beantworten',
                  'Leads erfassen',
                  'Anrufe weiterleiten',
                  'Terminwuensche aufnehmen',
                  'After-hours beantworten',
                  'Mehrsprachige Anfragen vorbereiten',
                ].map((goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={cn(
                        'flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left text-sm font-semibold transition-colors',
                        active ? 'border-gray-400 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      )}
                      aria-pressed={active}
                    >
                      {active ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} className="text-gray-300" aria-hidden="true" />}
                      {goal}
                    </button>
                  );
                })}
              </div>
              <AppTextarea
                id="preferred-behavior"
                label="Gewuenschtes Verhalten"
                value={form.preferredBehavior}
                onChange={(event) => updateField('preferredBehavior', event.target.value)}
                placeholder="Kurz, freundlich, formell, mit klarer Weiterleitung bei Unsicherheit ..."
              />
            </div>
          ) : null}

          {stageIndex === 2 ? (
            <div className="space-y-4">
              <AppEmptyState
                icon={Search}
                title="Research ist noch nicht gestartet"
                description="Diese Phase zeigt spaeter echte Website-Analyse und strukturierte Geschaeftsfakten. Aktuell wird kein Timer simuliert und kein Backend-Job gestartet."
              />
              <AppStepList steps={researchPreviewSteps} currentIndex={-1} />
            </div>
          ) : null}

          {stageIndex === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {['Leistungen', 'Preise', 'Oeffnungszeiten', 'Team', 'FAQs', 'Richtlinien', 'Kontaktdaten', 'Buchungslinks'].map((item) => (
                <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">{item}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                    Wird spaeter aus echten Quellen vorgeschlagen und muss bestaetigt werden.
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {stageIndex === 4 ? (
            <div className="space-y-4">
              <AppEmptyState
                icon={Wand2}
                title="Weiter in die Detailseiten"
                description="Wissen, Rezeptionist, Telefon und Test sind vorbereitet. Dauerhafte Speicherung und Provisionierung werden erst mit Backend-Anbindung aktiv."
                action={
                  <>
                    <AppButton to="/app/knowledge" variant="secondary">Wissen oeffnen</AppButton>
                    <AppButton to="/app/receptionist" variant="secondary">Rezeptionist oeffnen</AppButton>
                    <AppButton to="/app/phone" variant="secondary">Telefon oeffnen</AppButton>
                  </>
                }
              />
            </div>
          ) : null}
            </motion.div>
          </AnimatePresence>

          {stageIndex === 0 && !form.companyName ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[12.5px] font-medium leading-5 text-amber-800">
                Empfohlen: Unternehmensname und Website zuerst ausfuellen, damit spaetere Recherche und Wissenspruefung sinnvoll starten koennen.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AppButton variant="secondary" disabled={stageIndex === 0} onClick={() => setStageIndex((index) => Math.max(0, index - 1))}>
              Zurueck
            </AppButton>
            <AppButton disabled={stageIndex === onboardingStages.length - 1} onClick={() => setStageIndex((index) => Math.min(onboardingStages.length - 1, index + 1))}>
              Weiter
            </AppButton>
          </div>
          </div>
        </div>

        <AppPreviewNotice>
          Diese Eingaben werden in dieser Vorschau noch nicht dauerhaft gespeichert. Ein Neuladen der Seite kann sie zuruecksetzen.
        </AppPreviewNotice>
      </div>

      <aside className="space-y-6">
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Setup Pfad</p>
          <div className="space-y-3">
            {onboardingStages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setStageIndex(index)}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                  stageIndex === index ? 'border-gray-300 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                )}
              >
                <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-gray-500">{stage.description}</p>
              </button>
            ))}
          </div>
        </AppCard>
      </aside>
    </div>
  );
}

function ReceptionistExperience() {
  const [style, setStyle] = useState('professional');
  const [identity, setIdentity] = useState({
    name: '',
    language: 'de',
    secondLanguage: 'none',
    pronunciation: '',
    greeting: '',
  });
  const updateIdentity = (key: keyof typeof identity, value: string) => {
    setIdentity((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <AppSection eyebrow="Identitaet" title="Wie der Rezeptionist spaeter auftreten soll">
        <AppCard className="rounded-3xl">
          <div className="grid gap-4 md:grid-cols-2">
            <AppField id="receptionist-name" label="Rezeptionistenname" value={identity.name} onChange={(event) => updateIdentity('name', event.target.value)} placeholder="Noch nicht festgelegt" />
            <AppField id="voice-placeholder" label="Voice placeholder" placeholder="Noch nicht verbunden" disabled />
            <AppSelect
              id="primary-language"
              label="Hauptsprache"
              value={identity.language}
              onChange={(value) => updateIdentity('language', value)}
              options={[
                { value: 'de', label: 'Deutsch' },
                { value: 'en', label: 'Englisch' },
              ]}
            />
            <AppSelect
              id="second-language"
              label="Optionale weitere Sprache"
              value={identity.secondLanguage}
              onChange={(value) => updateIdentity('secondLanguage', value)}
              options={[
                { value: 'none', label: 'Keine weitere Sprache' },
                { value: 'en', label: 'Englisch' },
                { value: 'de', label: 'Deutsch' },
              ]}
            />
            <AppField id="pronunciation" label="Aussprache des Unternehmensnamens" value={identity.pronunciation} onChange={(event) => updateIdentity('pronunciation', event.target.value)} placeholder="Optional" />
            <AppTextarea id="greeting" label="Begruessung" value={identity.greeting} onChange={(event) => updateIdentity('greeting', event.target.value)} placeholder="Guten Tag, Sie sprechen mit ..." className="md:col-span-2" />
          </div>
        </AppCard>
      </AppSection>

      <AppSection eyebrow="Kommunikation" title="Tonalitaet und Aufgaben">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppCard className="rounded-3xl">
            <AppSegmentedControl
              label="Kommunikationsstil"
              value={style}
              onChange={setStyle}
              options={[
                { value: 'professional', label: 'Professionell', description: 'Ruhig, klar und verbindlich.' },
                { value: 'warm', label: 'Warm', description: 'Freundlich und nahbar.' },
                { value: 'concise', label: 'Knapp', description: 'Direkt, ohne lange Erklaerungen.' },
                { value: 'formal', label: 'Formell', description: 'Sehr hoeflich und distanziert.' },
              ]}
            />
          </AppCard>
          <AppCard className="rounded-3xl">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Status</p>
            <AppEmptyState
              compact
              icon={Headphones}
              title="Kein echter Assistent vorhanden"
              description="Diese Konfiguration wird noch nicht an Vapi oder ein Telefoniesystem uebergeben."
            />
          </AppCard>
        </div>
      </AppSection>

      <AppSection eyebrow="Regeln" title="Verantwortung und Grenzen">
        <div className="grid gap-4 lg:grid-cols-3">
          <RuleColumn
            title="Verantwortlichkeiten"
            items={['FAQs beantworten', 'Leads erfassen', 'Nachrichten aufnehmen', 'Anrufe weiterleiten', 'Terminwuensche sammeln', 'After-hours behandeln']}
          />
          <RuleColumn
            title="Verhalten"
            items={['Nur bestaetigte Fakten nennen', 'Bei Unsicherheit transparent bleiben', 'Bei Bedarf uebergeben', 'Keine technischen Details erfinden', 'Nach Geschaeftszeiten Regeln beachten']}
          />
          <RuleColumn
            title="Einschraenkungen"
            items={['Keine Preise erfinden', 'Keine Termine verbindlich zusagen', 'Keine Erstattungen bestaetigen', 'Keine regulierte Beratung geben', 'Keine nicht bestaetigten Leistungen nennen']}
          />
        </div>
      </AppSection>
    </div>
  );
}

function KnowledgeExperience() {
  const [activeSectionId, setActiveSectionId] = useState(knowledgeSections[0]?.id ?? 'profile');
  const activeSection = knowledgeSections.find((section) => section.id === activeSectionId) ?? knowledgeSections[0];

  if (!activeSection) return null;

  return (
    <div className="space-y-8">
      <AppSection
        eyebrow="Review"
        title="Geschaeftswissen fuer sichere Antworten"
        description="Jeder Bereich ist fuer Wert, Quelle, Vertrauen, Bestaetigung und manuelle Korrektur vorbereitet. Aktuell gibt es keine recherchierten Datensaetze."
        action={<AppAddButton>Information hinzufuegen</AppAddButton>}
      >
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.035)]">
            <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Kategorien</p>
            <div className="space-y-1">
              {knowledgeSections.map((section) => {
                const active = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      'relative w-full rounded-2xl px-3 py-3 text-left transition-colors duration-200',
                      active ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                    )}
                  >
                    <span className="block text-sm font-semibold">{section.title}</span>
                    <span className={cn('mt-1 block text-[11.5px] leading-5', active ? 'text-white/55' : 'text-gray-400')}>
                      {section.emptyLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.045)]">
            <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Review Bereich</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-950">{activeSection.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{activeSection.description}</p>
                </div>
                <AppStatusBadge label="leer" tone="neutral" />
              </div>
            </div>
            <div className="space-y-5 bg-gray-50/70 p-6 sm:p-8">
              <AppInlineEditor
                label={activeSection.emptyLabel}
                value="Noch kein Wert vorhanden"
                source="Keine Quelle"
                status="Wartet auf Daten"
              />
              <div className="grid gap-3 md:grid-cols-3">
                {['Quelle', 'Bestaetigung', 'Manuelle Korrektur'].map((label) => (
                  <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-500">Wird verfuegbar, sobald echte Daten existieren.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppSection>
      <AppSaveBar
        message="Bearbeiten, Loeschen, Freigeben und Speichern sind als UI-Muster vorbereitet, aber noch nicht mit einer Datenquelle verbunden."
        actionLabel="Speichern folgt"
      />
    </div>
  );
}

function PhoneExperience() {
  const [method, setMethod] = useState('ai-number');
  const [countryCode, setCountryCode] = useState('+49');

  return (
    <div className="space-y-8">
      <AppSection eyebrow="Methode" title="Nummern sauber trennen">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppCard>
            <AppSegmentedControl
              label="Zukuenftige Einrichtung"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'ai-number', label: 'Option A: Neue KI-Telefonnummer verwenden', description: 'Provisionierung ist in dieser Phase nicht aktiv.' },
                { value: 'forwarding', label: 'Option B: Bestehende Geschaeftsnummer weiterleiten', description: 'Weiterleitungshinweise, keine Portierung.' },
              ]}
            />
          </AppCard>
          <AppCard>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Aktivierung</p>
            <AppEmptyState
              compact
              icon={Lock}
              title="Nicht verbunden"
              description="Es wird keine Nummer gekauft, provisioniert oder verbunden."
            />
          </AppCard>
        </div>
        <div className="mt-4">
          <AppPreviewNotice>
            Diese Telefonansicht konfiguriert nur die Vorschau. Es wird keine Nummer gekauft, weitergeleitet oder aktiviert.
          </AppPreviewNotice>
        </div>
      </AppSection>

      <AppSection eyebrow="Telefonrollen" title="Jede Nummer hat eine klare Aufgabe">
        <AppCard>
          <div className="mb-5 max-w-sm">
            <AppSelect
              id="country-code"
              label="Landesvorwahl"
              value={countryCode}
              onChange={setCountryCode}
              options={[
                { value: '+49', label: 'Deutschland (+49)' },
                { value: '+43', label: 'Oesterreich (+43)' },
                { value: '+41', label: 'Schweiz (+41)' },
              ]}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {phoneRoles.map((role) => (
              <AppField
                key={role.id}
                id={`phone-${role.id}`}
                label={role.label}
                description={`${role.description} Landesvorwahl: ${countryCode}`}
                placeholder={role.placeholder}
                disabled={role.id === 'ai'}
              />
            ))}
          </div>
        </AppCard>
      </AppSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Weiterleitung</p>
          <h2 className="text-xl font-bold tracking-tight text-gray-950">Anleitung wird spaeter generiert</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Fuer Weiterleitung werden spaeter konkrete Provider-Schritte angezeigt. Aktuell bleibt dies ein Platzhalter ohne technische Ausfuehrung.
          </p>
        </AppCard>
        <AppCard>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Warnung</p>
          <h2 className="text-xl font-bold tracking-tight text-gray-950">Transfer-loop vermeiden</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Die menschliche Transfernummer darf nicht wieder auf die KI-Nummer zeigen. Diese Pruefung wird spaeter technisch erzwungen.
          </p>
        </AppCard>
      </div>
    </div>
  );
}

function TestExperience() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AppCard>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Testen</p>
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">Testnummer noch nicht verfuegbar</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Browser-Call und Telefonnummer bleiben Platzhalter, bis ein echter Rezeptionist provisioniert ist.
          </p>
          <div className="mt-6">
            <AppButton disabled icon={Phone}>Testanruf starten</AppButton>
          </div>
        </AppCard>
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Letzter Test</p>
          <AppEmptyState
            compact
            icon={TestTube2}
            title="Noch kein Testanruf"
            description="Es werden keine Transkripte, Ergebnisse oder Fehler simuliert."
          />
        </AppCard>
      </div>

      <AppSection eyebrow="Szenarien" title="Empfohlene Testfragen">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testScenarios.map((scenario) => (
            <AppCard key={scenario.id} className="shadow-none">
              <p className="text-sm font-semibold text-gray-950">{scenario.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{scenario.description}</p>
            </AppCard>
          ))}
        </div>
      </AppSection>

      <AppSection eyebrow="Launch" title="Freigabe bleibt gesperrt">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppCard>
            <AppLaunchChecklist items={launchChecklist} />
          </AppCard>
          <AppCard>
            <AppEmptyState
              compact
              icon={Lock}
              title="Go-live nicht verfuegbar"
              description="Aktivierung wird erst nach Setup, Test, Zahlung und Backend-Provisionierung moeglich."
              action={<AppButton disabled>Live schalten</AppButton>}
            />
          </AppCard>
        </div>
      </AppSection>
      <AppPreviewNotice>
        Test und Go-live bleiben bewusst deaktiviert, bis ein echter Assistent, Telefonie, Abrechnung und Provisionierung verbunden sind.
      </AppPreviewNotice>
    </div>
  );
}

function OperationalExperience({ type }: { type: 'calls' | 'leads' }) {
  const isCalls = type === 'calls';
  const title = isCalls ? 'Anrufarchitektur' : 'Leadarchitektur';
  const emptyTitle = isCalls ? 'Noch keine Anrufe' : 'Noch keine Leads';
  const emptyDescription = isCalls
    ? 'Der Verlauf bleibt leer, bis echte Anrufdaten aus dem Telefoniesystem eintreffen.'
    : 'Diese Seite zeigt erst Kontakte, wenn echte Leads durch den Rezeptionisten erfasst wurden.';
  const futureFields = isCalls
    ? ['Zeitpunkt', 'Dauer', 'Anrufer', 'Ergebnis', 'Zusammenfassung', 'Transkript', 'Tags', 'Transferstatus', 'Lead erstellt', 'Aufzeichnung']
    : ['Name', 'Telefon', 'E-Mail', 'Anliegen', 'Leistung', 'Dringlichkeit', 'Status', 'Notizen', 'Quellanruf', 'Erstellt am'];

  return (
    <div className="space-y-8">
      <AppCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{title}</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950">{emptyTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">{emptyDescription}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Suchen</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" aria-hidden="true" />
              <input
                disabled
                placeholder="Suche folgt"
                className="h-11 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-400 outline-none"
              />
            </label>
            <AppButton variant="secondary" disabled icon={SlidersHorizontal}>Filter</AppButton>
          </div>
        </div>
      </AppCard>
      <AppPreviewNotice>
        Suche, Filter und Detailfelder sind nur als Struktur vorbereitet. Es werden keine Anruf- oder Lead-Daten erfunden.
      </AppPreviewNotice>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <AppCard>
          <AppEmptyState icon={isCalls ? Mic2 : UserPlus} title={emptyTitle} description={emptyDescription} compact />
        </AppCard>
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Spaetere Detailansicht</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {futureFields.map((field) => (
              <div key={field} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[12px] font-semibold text-gray-700">{field}</p>
                <p className="mt-1 text-[11px] text-gray-400">Wartet auf echte Daten</p>
              </div>
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

function BillingExperience() {
  return (
    <div className="space-y-8">
      <AppEmptyState
        icon={CreditCard}
        title="Noch kein aktiver Tarif zugewiesen"
        description="Stripe, Zahlungsdaten, Preise und Rechnungen sind in dieser Phase nicht verbunden. Es werden keine Paketpreise hart codiert."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {billingAreas.map((area) => (
          <AppCard key={area.id} className="shadow-none">
            <p className="text-sm font-semibold text-gray-950">{area.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{area.description}</p>
          </AppCard>
        ))}
      </div>
    </div>
  );
}

function SettingsExperience() {
  const { profile, user, signOut } = useAuth();
  const { activeOrganization } = useOrganizations();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <AppSection eyebrow="Account" title="Profil">
          <AppCard>
            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField label="Name" value={profile?.full_name || 'Nicht gesetzt'} />
              <ReadOnlyField label="E-Mail" value={profile?.email ?? user?.email ?? 'Nicht verfuegbar'} />
              <ReadOnlyField label="Telefon" value={profile?.phone || 'Nicht gesetzt'} />
              <ReadOnlyField label="Rolle" value={profile?.platform_role ?? 'Wird geladen'} />
            </div>
          </AppCard>
        </AppSection>

        <AppSection eyebrow="Organisation" title="Unternehmen">
          <AppCard>
            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField label="Organisation" value={activeOrganization?.name ?? 'Keine Organisation verbunden'} />
              <ReadOnlyField label="Status" value={activeOrganization?.status ?? 'Nicht provisioniert'} />
            </div>
          </AppCard>
        </AppSection>

        <AppSection eyebrow="Optionen" title="Weitere Einstellungen">
          <div className="grid gap-4 md:grid-cols-2">
            <SettingsTile icon={Info} title="Benachrichtigungen" text="UI vorbereitet, noch keine Mutation." />
            <SettingsTile icon={ShieldCheck} title="Sicherheit" text="Auth ist aktiv, weitere Einstellungen folgen." />
            <SettingsTile icon={FileText} title="Datenschutz und Daten" text="Export und Loeschung sind noch nicht verbunden." />
            <SettingsTile icon={Settings} title="Sprache" text="Sprachwechsel ist noch UI-only." />
          </div>
        </AppSection>
      </div>

      <aside className="space-y-6">
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Sitzung</p>
          <AppButton variant="secondary" icon={LogOut} onClick={() => void signOut()}>
            Abmelden
          </AppButton>
        </AppCard>
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Account-Loeschung</p>
          <AppEmptyState
            compact
            icon={AlertCircle}
            title="Nicht direkt ausfuehrbar"
            description="Eine Loeschanfrage muss spaeter als gesicherter Prozess umgesetzt werden."
          />
        </AppCard>
      </aside>
    </div>
  );
}

function RuleColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white/75 p-6 transition-colors duration-200 hover:border-gray-200">
      <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[13px] leading-relaxed text-gray-500">
            <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SettingsTile({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <AppCard className="shadow-none">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
        <Icon size={16} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{text}</p>
    </AppCard>
  );
}
