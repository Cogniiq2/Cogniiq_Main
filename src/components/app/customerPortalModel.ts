export type ReceptionistLifecycleState =
  | 'not_started'
  | 'setup_in_progress'
  | 'research_in_progress'
  | 'review_required'
  | 'ready_for_test'
  | 'ready_for_launch'
  | 'live'
  | 'paused'
  | 'error';

export type LifecycleTone = 'neutral' | 'working' | 'attention' | 'ready' | 'success' | 'paused' | 'danger';

export interface LifecycleDisplay {
  label: string;
  description: string;
  tone: LifecycleTone;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
}

export interface KnowledgeSectionConfig {
  id: string;
  title: string;
  description: string;
  emptyLabel: string;
}

export interface PhoneRoleConfig {
  id: string;
  label: string;
  description: string;
  placeholder: string;
}

export interface LaunchChecklistItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
}

export const defaultLifecycleState: ReceptionistLifecycleState = 'not_started';

export const lifecycleDisplays: Record<ReceptionistLifecycleState, LifecycleDisplay> = {
  not_started: {
    label: 'Einrichtung noch nicht begonnen',
    description: 'Der KI-Rezeptionist wartet auf die ersten Unternehmensdaten.',
    tone: 'neutral',
  },
  setup_in_progress: {
    label: 'Einrichtung läuft',
    description: 'Die Basisdaten werden vorbereitet.',
    tone: 'working',
  },
  research_in_progress: {
    label: 'Recherche vorbereitet',
    description: 'Die Recherche-Ansicht ist vorbereitet, aber noch nicht mit einem Backend-Job verbunden.',
    tone: 'working',
  },
  review_required: {
    label: 'Prüfung erforderlich',
    description: 'Gefundene Informationen müssen später bestätigt werden.',
    tone: 'attention',
  },
  ready_for_test: {
    label: 'Bereit für Test',
    description: 'Der Testmodus wird freigeschaltet, sobald echte Provisionierung existiert.',
    tone: 'ready',
  },
  ready_for_launch: {
    label: 'Bereit für Start',
    description: 'Go-live bleibt gesperrt, bis Setup, Test, Zahlung und Backend verbunden sind.',
    tone: 'ready',
  },
  live: {
    label: 'Live',
    description: 'Der KI-Rezeptionist ist aktiv.',
    tone: 'success',
  },
  paused: {
    label: 'Pausiert',
    description: 'Der KI-Rezeptionist nimmt aktuell keine Anrufe an.',
    tone: 'paused',
  },
  error: {
    label: 'Fehler',
    description: 'Eine technische Prüfung wäre erforderlich.',
    tone: 'danger',
  },
};

export const setupJourney: SetupStep[] = [
  {
    id: 'company',
    title: 'Unternehmensdaten',
    description: 'Basisdaten, Website, Ansprechpartner und bestehende Telefonnummer erfassen.',
  },
  {
    id: 'facts',
    title: 'Geschäftsinfos prüfen',
    description: 'Services, Zeiten, Preise, Regeln und Quellen später bestätigen.',
  },
  {
    id: 'receptionist',
    title: 'Rezeptionist konfigurieren',
    description: 'Rolle, Sprache, Tonalität, Grenzen und Eskalation definieren.',
  },
  {
    id: 'phone',
    title: 'Telefon einrichten',
    description: 'Bestehende Nummer, KI-Nummer, Transfer und Notfallziele sauber trennen.',
  },
  {
    id: 'test',
    title: 'Testanruf',
    description: 'Typische Szenarien prüfen, bevor der Rezeptionist live geht.',
  },
  {
    id: 'launch',
    title: 'Freigabe und Start',
    description: 'Aktivierung erst nach bestätigtem Setup, Test, Abrechnung und Provisionierung.',
  },
];

export const onboardingStages: SetupStep[] = [
  {
    id: 'company',
    title: 'Unternehmen',
    description: 'Die wichtigsten Stammdaten für die spätere Recherche und Einrichtung.',
  },
  {
    id: 'goals',
    title: 'Ziele',
    description: 'Was der KI-Rezeptionist später am Telefon übernehmen soll.',
  },
  {
    id: 'research',
    title: 'Research preview',
    description: 'Ein ehrlicher Platzhalter für die spätere Website-Analyse.',
  },
  {
    id: 'review',
    title: 'Review preparation',
    description: 'Welche Informationen später geprüft und korrigiert werden.',
  },
  {
    id: 'continue',
    title: 'Weiter zum Setup',
    description: 'Der Weg in Wissen, Rezeptionist, Telefon und Test.',
  },
];

export const researchPreviewSteps: SetupStep[] = [
  {
    id: 'website',
    title: 'Website erhalten',
    description: 'Wartet auf echte Speicherung der Onboarding-Daten.',
  },
  {
    id: 'pages',
    title: 'Seiten identifizieren',
    description: 'Wird verfügbar, wenn ein Research-Backend angeschlossen ist.',
  },
  {
    id: 'services',
    title: 'Leistungen analysieren',
    description: 'Noch kein Analyseauftrag gestartet.',
  },
  {
    id: 'facts',
    title: 'Geschäftsfakten strukturieren',
    description: 'Keine Daten werden simuliert.',
  },
  {
    id: 'draft',
    title: 'Rezeptionisten-Entwurf vorbereiten',
    description: 'Der Entwurf entsteht erst aus echten, bestätigten Informationen.',
  },
];

export const knowledgeSections: KnowledgeSectionConfig[] = [
  {
    id: 'profile',
    title: 'Unternehmensprofil',
    description: 'Name, Kurzbeschreibung, Positionierung und wichtige Hinweise.',
    emptyLabel: 'Noch kein Unternehmensprofil hinterlegt',
  },
  {
    id: 'locations',
    title: 'Standorte',
    description: 'Adressen, Einzugsgebiet, Parken, Barrierefreiheit und Anfahrt.',
    emptyLabel: 'Noch keine Standorte hinterlegt',
  },
  {
    id: 'hours',
    title: 'Öffnungszeiten',
    description: 'Reguläre Zeiten, Feiertage, Pausen und Ausnahmen.',
    emptyLabel: 'Noch keine Öffnungszeiten hinterlegt',
  },
  {
    id: 'services',
    title: 'Leistungen',
    description: 'Angebote, Voraussetzungen, Dauer und Buchungslogik.',
    emptyLabel: 'Noch keine Leistungen hinterlegt',
  },
  {
    id: 'prices',
    title: 'Preise',
    description: 'Nur bestätigte Preise oder klare Weiterleitungsregeln.',
    emptyLabel: 'Noch keine Preise hinterlegt',
  },
  {
    id: 'team',
    title: 'Team',
    description: 'Ansprechpartner, Rollen und erlaubte Weiterleitungen.',
    emptyLabel: 'Noch keine Teamdaten hinterlegt',
  },
  {
    id: 'faqs',
    title: 'FAQs',
    description: 'Häufige Fragen, sichere Antworten und Grenzen.',
    emptyLabel: 'Noch keine FAQs hinterlegt',
  },
  {
    id: 'policies',
    title: 'Richtlinien',
    description: 'Storno, Erstattung, Datenschutz, medizinische oder rechtliche Grenzen.',
    emptyLabel: 'Noch keine Richtlinien hinterlegt',
  },
  {
    id: 'contact',
    title: 'Kontaktdaten',
    description: 'E-Mail, Telefonnummern, Notfallkontakte und Transferziele.',
    emptyLabel: 'Noch keine Kontaktdaten hinterlegt',
  },
  {
    id: 'booking',
    title: 'Buchungslinks',
    description: 'Terminbuchung, Reservierung, Anfrageformulare und externe Systeme.',
    emptyLabel: 'Noch keine Buchungslinks hinterlegt',
  },
  {
    id: 'sources',
    title: 'Quellen',
    description: 'Website, Dokumente und manuell bestätigte Informationen.',
    emptyLabel: 'Noch keine Quellen hinterlegt',
  },
];

export const phoneRoles: PhoneRoleConfig[] = [
  {
    id: 'public',
    label: 'Bestehende Geschäftsnummer',
    description: 'Die Nummer, die Kundinnen und Kunden heute anrufen.',
    placeholder: '+49 ...',
  },
  {
    id: 'ai',
    label: 'Zukünftige KI-Nummer',
    description: 'Die später zugewiesene Nummer für den KI-Rezeptionisten.',
    placeholder: 'Noch nicht provisioniert',
  },
  {
    id: 'transfer',
    label: 'Human transfer number',
    description: 'Zielnummer, wenn die KI an einen Menschen übergibt.',
    placeholder: '+49 ...',
  },
  {
    id: 'urgent',
    label: 'Urgent escalation number',
    description: 'Optionale Zielnummer für dringende Fälle.',
    placeholder: '+49 ...',
  },
  {
    id: 'after_hours',
    label: 'After-hours number',
    description: 'Optionales Ziel ausserhalb der Öffnungszeiten.',
    placeholder: '+49 ...',
  },
  {
    id: 'sms',
    label: 'SMS notification number',
    description: 'Optionale Nummer für spätere Benachrichtigungen.',
    placeholder: '+49 ...',
  },
];

export const testScenarios: SetupStep[] = [
  {
    id: 'hours',
    title: 'Öffnungszeiten-Frage',
    description: 'Prüft, ob der Rezeptionist nur bestätigte Zeiten nennt.',
  },
  {
    id: 'service-price',
    title: 'Leistungs- und Preisfrage',
    description: 'Prüft, ob Preise nicht erfunden werden.',
  },
  {
    id: 'lead',
    title: 'Neue Kundenanfrage',
    description: 'Prüft, welche Kontaktdaten später erfasst werden sollen.',
  },
  {
    id: 'transfer',
    title: 'Menschliche Uebergabe',
    description: 'Prüft die Transfer-Regel, ohne aktuell einen Anruf auszuführen.',
  },
  {
    id: 'after-hours',
    title: 'After-hours Frage',
    description: 'Prüft Verhalten ausserhalb der Öffnungszeiten.',
  },
  {
    id: 'unknown',
    title: 'Unbekannte Frage',
    description: 'Prüft, ob Unsicherheit korrekt behandelt wird.',
  },
];

export const launchChecklist: LaunchChecklistItem[] = [
  {
    id: 'company',
    label: 'Unternehmensdetails bestätigt',
    description: 'Stammdaten und Kontaktwege müssen geprüft sein.',
    complete: false,
  },
  {
    id: 'hours',
    label: 'Öffnungszeiten bestätigt',
    description: 'Reguläre Zeiten und Ausnahmen müssen vorliegen.',
    complete: false,
  },
  {
    id: 'services',
    label: 'Leistungen bestätigt',
    description: 'Der Rezeptionist darf nur bestätigte Leistungen nennen.',
    complete: false,
  },
  {
    id: 'behavior',
    label: 'Verhalten konfiguriert',
    description: 'Tonalität, Grenzen und Eskalationsregeln müssen feststehen.',
    complete: false,
  },
  {
    id: 'phone',
    label: 'Telefonsetup gewählt',
    description: 'KI-Nummer oder Weiterleitung muss technisch vorbereitet sein.',
    complete: false,
  },
  {
    id: 'transfer',
    label: 'Transferziel konfiguriert',
    description: 'Eine menschliche Zielnummer ist bei Bedarf erforderlich.',
    complete: false,
  },
  {
    id: 'test',
    label: 'Testanruf abgeschlossen',
    description: 'Go-live bleibt ohne echten Test gesperrt.',
    complete: false,
  },
  {
    id: 'consent',
    label: 'Rechtliche Freigabe akzeptiert',
    description: 'Einwilligung und Hinweise müssen später eingebunden werden.',
    complete: false,
  },
  {
    id: 'plan',
    label: 'Aktiver Tarif',
    description: 'Abrechnung und Provisionierung sind noch nicht verbunden.',
    complete: false,
  },
];

