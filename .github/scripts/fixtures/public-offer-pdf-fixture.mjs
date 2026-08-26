// The AN-2026-0009 projection, extended into the WORST realistic case for the customer PDF.
//
// Derived from PUBLIC_OFFER_PROJECTION (fixtures/public-offer-projection.mjs), which is the
// exact shape `public_offer_by_token` returns in production, so every key, type and
// null/non-null choice here is still the production one. Only the four CONTRACTUAL PROSE
// fields are lengthened, because those are precisely what the old generic renderer broke:
// its keyvalue painter drew each value as one unwrapped right-aligned line and stepped Y by
// a fixed 15pt, so long text ran off the page and the next row was painted on top of it.
//
// Recurring pricing is kept exactly as the real offer has it: 2.490,00 EUR net ONE-TIME
// plus 390,00 EUR net PER MONTH with a 12-month minimum term. The immediate headline total
// must stay the one-time figure — the term must never be multiplied into it.
import { PUBLIC_OFFER_PROJECTION } from './public-offer-projection.mjs';

/** Twelve entries, several of them long enough to wrap two or three lines each. */
const LONG_EXCLUSIONS = [
  'Vollständige Finanzzentrale und Finanzbuchhaltung einschließlich Kontenrahmen, Buchungsjournal, Offene-Posten-Verwaltung sowie sämtlicher periodischer Abschlussarbeiten',
  'Automatische Stripe- und PayPal-Abstimmung inklusive Rückbuchungen, Teilrückerstattungen, Gebührenaufteilung und Währungsdifferenzen',
  'Bankkontenabgleich sowie die automatische Zuordnung von Auszahlungen zu Bankbewegungen über PSD2-Schnittstellen oder CAMT-Importe',
  'Monatliche Finanz- und Steuerberaterberichte in abgestimmter Form',
  'DATEV- oder vergleichbare Buchhaltungsexporte einschließlich Mandanten- und Sachkontenzuordnung',
  'Erweiterte Gutscheinverwaltung mit Teil-Einlösung, Gültigkeitsregeln und Übertragbarkeit',
  'Automatisierte Behandlung fehlgeschlagener E-Mails inklusive Bounce-Klassifikation und Wiedervorlage',
  'Individuelle Neuentwicklungen außerhalb des in diesem Angebot beschriebenen Leistungsumfangs',
  'Steuer- oder Rechtsberatung jeglicher Art, insbesondere zur umsatzsteuerlichen Behandlung von Mitgliedsbeiträgen und Platzmieten',
  'Migration historischer Buchungs-, Mitglieder- oder Zahlungsdaten aus Alt- oder Drittsystemen',
  'Bereitstellung, Beschaffung oder Wartung von Hardware, Netzwerktechnik und Zutrittssystemen vor Ort',
  'Betrieb, Lizenzierung und laufende Kosten von Drittsystemen wie Zahlungsanbietern, E-Mail-Versanddiensten oder Kalenderdiensten',
];

/** Six entries, deliberately long — the field that used to be one overlapping line. */
const LONG_ASSUMPTIONS = [
  'Das Angebot basiert auf der bestehenden technischen Plattform und den aktuell vorhandenen Buchungs-, Mitglieder- und Zahlungsprozessen; die bestehenden Kernsysteme bleiben grundsätzlich erhalten und werden nicht ersetzt.',
  'Der Auftraggeber benennt eine verantwortliche Ansprechperson mit Entscheidungsbefugnis, die für Rückfragen, Freigaben und Abstimmungen innerhalb von zwei Werktagen zur Verfügung steht.',
  'Erforderliche Zugänge zu Hosting, Zahlungsanbietern, Domain- und E-Mail-Diensten werden vollständig und rechtzeitig vor Projektstart bereitgestellt.',
  'Die bestehende Datenbasis ist strukturell konsistent; eine Bereinigung fehlerhafter oder doppelter Datensätze ist nicht Bestandteil dieses Angebots.',
  'Die Abnahme erfolgt innerhalb von zehn Werktagen nach Bereitstellung der Testumgebung; ohne Rückmeldung gilt die Leistung als abgenommen.',
  'Alle genannten Beträge verstehen sich netto zuzüglich der jeweils gesetzlichen Umsatzsteuer.',
];

const LONG_PAYMENT_TERMS = 'Die einmalige Einrichtungsgebühr beträgt 2.490,00 € netto und wird zu 50 % mit Auftragserteilung und zu 50 % nach Fertigstellung und Übergabe fällig. Die laufende Betreuung beträgt 390,00 € netto pro Monat und wird erstmals im Monat der Inbetriebnahme, danach monatlich im Voraus abgerechnet. Die Mindestlaufzeit der laufenden Betreuung beträgt 12 Monate ab Inbetriebnahme und verlängert sich anschließend um jeweils einen Monat, sofern sie nicht mit einer Frist von vier Wochen zum Laufzeitende gekündigt wird. Rechnungen sind ohne Abzug innerhalb von 14 Tagen ab Rechnungsdatum zur Zahlung fällig; Aufrechnung ist nur mit unbestrittenen oder rechtskräftig festgestellten Forderungen zulässig.';

const LONG_DELIVERY_TERMS = 'Der Auftraggeber stellt die erforderlichen Informationen, Zugänge, Inhalte und Freigaben rechtzeitig und vollständig zur Verfügung. Die genannten Zeiträume verstehen sich als Arbeitszeiträume ab vollständiger Bereitstellung dieser Mitwirkungsleistungen und verschieben sich entsprechend, wenn Zuarbeiten, Freigaben oder Zugänge verzögert erfolgen. Die Übergabe erfolgt in einer bereitgestellten Testumgebung; die Produktivschaltung erfolgt nach schriftlicher Freigabe durch den Auftraggeber. Erforderliche Abstimmungen finden per Videokonferenz statt, Vor-Ort-Termine sind nicht Bestandteil dieses Angebots.';

/** The customer-facing projection under test. */
export const PDF_OFFER_PROJECTION = {
  ...PUBLIC_OFFER_PROJECTION,
  assumptions: LONG_ASSUMPTIONS.join('\n'),
  exclusions: LONG_EXCLUSIONS.join('\n'),
  payment_terms: LONG_PAYMENT_TERMS,
  delivery_terms: LONG_DELIVERY_TERMS,
};

export const EXPECTED_EXCLUSIONS = LONG_EXCLUSIONS;
export const EXPECTED_ASSUMPTIONS = LONG_ASSUMPTIONS;
