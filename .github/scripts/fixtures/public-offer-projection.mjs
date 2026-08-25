// The exact shape `public_offer_by_token` returns in production today, captured from the live
// function (inside a rolled-back transaction, so no real offer was touched) and then sanitised:
// company, contact and e-mail are test values. Every KEY, type and null/non-null choice is the
// production one — including the recurring fields added by 20260825064048_offer_recurring_pricing
// and the newline-separated "Nicht enthalten" list that the customer-facing renderer must split.
//
// Used by test-public-document-portal.mjs, which fulfils the RPC with this payload in a real
// browser so the portal is exercised against the real schema rather than an invented fixture.

export const PUBLIC_OFFER_PROJECTION = {
  offer_number: 'AN-2026-0009',
  title: 'SV Heinersreuth – Admin',
  subtitle: 'Zentrale Verwaltung für Buchungen, Mitglieder und den laufenden Padel- und Tennisbetrieb',
  status: 'sent',
  issue_date: '2026-08-25',
  valid_until: '2026-09-07',
  currency: 'EUR',
  introduction: 'Der Verein verfügt bereits über eine digitale Buchungs- und Zahlungsplattform.\n\nDas Paket „Admin“ erweitert das bestehende System um einen geschützten internen Verwaltungsbereich.',
  executive_summary: 'Mit „Admin“ erhält der Verein die operative Grundlage für die interne Verwaltung seiner digitalen Plattform.',
  project_approach: 'Ziel ist eine zentrale, geschützte Verwaltungsoberfläche.\n\nCogniiq erweitert die bestehende Plattform um die erforderlichen Verwaltungsfunktionen.',
  next_steps: 'Nach Annahme des Angebots beginnt Cogniiq mit der technischen Abstimmung und Projektplanung.',
  scope: null,
  // One paragraph -> must stay PROSE.
  assumptions: 'Das Angebot basiert auf der bestehenden technischen Plattform und den aktuell vorhandenen Buchungs-, Mitglieder- und Zahlungsprozessen. Die bestehenden Kernsysteme bleiben grundsätzlich erhalten.',
  // Ten newline-separated entries -> must render as ten separate bullet rows.
  exclusions: [
    'Vollständige Finanzzentrale und Finanzbuchhaltung',
    'Automatische Stripe- und PayPal-Abstimmung',
    'Bankkontenabgleich',
    'Automatische Zuordnung von Auszahlungen zu Bankbewegungen',
    'Monatliche Finanz- und Steuerberaterberichte',
    'DATEV- oder vergleichbare Buchhaltungsexporte',
    'Erweiterte Gutscheinverwaltung',
    'Automatisierte Behandlung fehlgeschlagener E-Mails',
    'Individuelle Neuentwicklungen außerhalb des beschriebenen Leistungsumfangs',
    'Steuer- oder Rechtsberatung',
  ].join('\n'),
  payment_terms: 'Die einmalige Einrichtungsgebühr beträgt 2.490,00 € netto. 50 % werden mit Auftragserteilung fällig, 50 % nach Übergabe. Die laufende Betreuung beträgt 390,00 € netto pro Monat. Die Mindestlaufzeit beträgt 12 Monate ab Inbetriebnahme.',
  delivery_terms: 'Der Auftraggeber stellt die erforderlichen Informationen, Zugänge und Freigaben rechtzeitig zur Verfügung.',
  desired_outcomes: [
    'Zentrale interne Verwaltungsoberfläche',
    'Schneller Zugriff auf Buchungen und Buchungsdetails',
    'Administrative Durchführung von Stornierungen',
  ],
  timeline: [
    { phase: 'Projektstart & technische Abstimmung', title: '', duration: '1 Tag', description: '' },
    { phase: 'Tests, Freigabe & Übergabe', title: '', duration: '2 Tage', description: '' },
  ],
  payment_schedule: [
    { label: 'Bei Auftragserteilung / Projektstart', percentage_bp: 5000 },
    { label: 'Nach Fertigstellung und Übergabe', percentage_bp: 5000 },
  ],
  net_total_cents: 249000,
  vat_total_cents: 47310,
  gross_total_cents: 296310,
  recurring_monthly_net_cents: 39000,
  recurring_monthly_vat_cents: 7410,
  recurring_monthly_gross_cents: 46410,
  lines: [
    {
      description: 'Admin-Dashboard & Verwaltungsoberfläche',
      details: 'Einrichtung und Integration eines geschützten internen Admin-Bereichs.',
      deliverables: ['Geschützter Admin-Zugang', 'Zentrale Dashboard-Übersicht', 'Buchungsübersicht'],
      phase_label: 'Einrichtung', duration_label: 'ca. 1 Woche',
      quantity_milli: 1000, unit: 'Pauschal', unit_price_cents: 249000,
      vat_rate_bp: 1900, vat_treatment: 'standard',
      net_cents: 249000, vat_cents: 47310, gross_cents: 296310, is_optional: false,
      pricing_type: 'one_time', billing_interval: null,
      minimum_term_months: null, billing_start_type: null, billing_start_label: null,
    },
    {
      description: 'Laufende Betreuung & Betrieb',
      details: 'Technische Betreuung, Wartung und Unterstützung nach Inbetriebnahme.',
      deliverables: ['Technische Wartung', 'Fehlerbehebung', 'Sicherheits- und Stabilitätsupdates'],
      phase_label: 'Laufender Betrieb', duration_label: null,
      quantity_milli: 1000, unit: 'Monat', unit_price_cents: 39000,
      vat_rate_bp: 1900, vat_treatment: 'standard',
      net_cents: 39000, vat_cents: 7410, gross_cents: 46410, is_optional: false,
      pricing_type: 'recurring', billing_interval: 'monthly',
      minimum_term_months: 12, billing_start_type: null, billing_start_label: null,
    },
  ],
  recipient: {
    company: 'Testverein Musterstadt e.V.', contact_name: 'Alex Muster', city: 'Musterstadt',
    email: 'alex.muster@example.test', salutation: null, title: null,
    first_name: null, last_name: null, greeting_name: null,
  },
  seller: {
    legal_name: 'Cogniiq', street: 'Am Main 3', postal_code: '95444', city: 'Bayreuth',
    country_code: 'DE', email: 'info@cogniiq.de', website: 'https://cogniiq.de', vat_id: 'DE460292419',
  },
  template_version: 'cogniiq-premium-offer-v2',
  accepted: false, rejected: false, expired: false,
  has_pdf: false, document_version: null,
  accepted_signer_name: null, accepted_at: null, signed_document_available: false,
};

/** A legacy, pre-recurring finalized offer: no recurring keys at all, prose exclusions. */
export const LEGACY_OFFER_PROJECTION = {
  ...PUBLIC_OFFER_PROJECTION,
  offer_number: 'AN-2026-0001',
  title: 'Historisches Angebot',
  assumptions: null,
  exclusions: 'Nicht enthalten sind Hardware und laufende Lizenzkosten für Drittsysteme.',
  recurring_monthly_net_cents: undefined,
  recurring_monthly_vat_cents: undefined,
  recurring_monthly_gross_cents: undefined,
  lines: [{ ...PUBLIC_OFFER_PROJECTION.lines[0], pricing_type: undefined, billing_interval: undefined }],
};
