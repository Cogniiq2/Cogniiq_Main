// REGRESSION FIXTURE — the Q2/2026 expense paste that the Schnellimport rejected in production.
//
// Every row here is shaped after one of the errors the owner actually received:
//
//   Q2EXP-2026-001  "Kunde „Elm-Haustechnik" wurde nicht gefunden"
//   Q2EXP-2026-002  "Kunde „Amazon Marketplace / VAT declared by Amazon EU S.à r.l."
//                    wurde nicht gefunden"
//   Q2EXP-2026-004  "Kunde „OpenAI Ireland Limited" wurde nicht gefunden" AND
//                   "Zahlungen (23.00) übersteigen den Rechnungsbetrag (19.33)"
//   Q2EXP-2026-028  "issue_date fehlt oder ist kein JJJJ-MM-TT"
//   Q2EXP-2026-031  the negative row the old preview totalled as a −71,97 € gross
//
// The fixture is NOT edited to make tests pass. Each row is classified on its own merits and
// the suite asserts that classification: four are valid expenses that the invoice path could
// never have accepted, and the supplier credit is BLOCKED on purpose, because the canonical
// finance model has no booking type for one (see the migration header).
export const Q2EXP_2026_EXPENSES = JSON.stringify({
  schema_version: 1,
  expenses: [
    {
      // Domestic tradesman, 19 %, unpaid. Previously died on customer resolution.
      client_import_id: 'Q2EXP-2026-001',
      vendor: { name: 'Elm-Haustechnik', country_code: 'DE' },
      supplier_invoice_number: 'EH-2026-0417',
      invoice_date: '2026-04-08',
      currency: 'EUR',
      category_key: 'office',
      lines: [
        { description: 'Sanitärarbeiten Büro', net_cents: 28500, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' },
      ],
    },
    {
      // Marketplace receipt whose vendor string carries the VAT note verbatim. It is a
      // supplier name, not a customer, and it must survive being long and punctuated.
      client_import_id: 'Q2EXP-2026-002',
      vendor: { name: 'Amazon Marketplace / VAT declared by Amazon EU S.à r.l.', country_code: 'LU' },
      supplier_invoice_number: 'AMZ-DE-2026-771244',
      invoice_date: '2026-04-11',
      currency: 'EUR',
      category_key: 'office',
      lines: [
        { description: 'Bürobedarf', net_cents: 4118, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' },
      ],
      payments: [
        { payment_date: '2026-04-11', amount_cents: 4900, method: 'card', reference: 'Kreditkarte' },
      ],
    },
    {
      // THE arithmetic regression: 19,33 net + 19 % = 3,67 VAT = 23,00 gross, settled with a
      // single 23,00 € card payment. Invoice semantics computed 0 VAT and called this an
      // overpayment against 19,33.
      client_import_id: 'Q2EXP-2026-004',
      vendor: { name: 'OpenAI Ireland Limited', country_code: 'IE', vat_id: 'IE3717981AH' },
      supplier_invoice_number: 'OAI-2026-3391',
      invoice_date: '2026-04-14',
      currency: 'EUR',
      category_key: 'ai_api',
      lines: [
        { description: 'API-Nutzung April 2026', net_cents: 1933, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' },
      ],
      payments: [
        { payment_date: '2026-04-14', amount_cents: 2300, method: 'card', reference: 'Kreditkarte' },
      ],
    },
    {
      // Carries invoice_date and NO issue_date, which is correct for an expense and was
      // exactly what the invoice parser refused.
      client_import_id: 'Q2EXP-2026-028',
      vendor: { name: 'Hetzner Online GmbH', country_code: 'DE' },
      supplier_invoice_number: 'HET-2026-559120',
      invoice_date: '2026-06-01',
      service_date: '2026-05-31',
      currency: 'EUR',
      category_key: 'cloud_hosting',
      lines: [
        { description: 'Serverhosting Mai 2026', net_cents: 6723, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' },
      ],
      payments: [
        { payment_date: '2026-06-03', amount_cents: 8000, method: 'direct_debit' },
      ],
    },
    {
      // Supplier credit. −60,48 net + 19 % = −71,97 gross, the figure the broken preview
      // reported. There is no canonical booking type for this, so it must BLOCK.
      client_import_id: 'Q2EXP-2026-031',
      vendor: { name: 'Elm-Haustechnik', country_code: 'DE' },
      supplier_invoice_number: 'EH-2026-GS-0102',
      invoice_date: '2026-06-19',
      currency: 'EUR',
      category_key: 'office',
      lines: [
        { description: 'Gutschrift Rückgabe Material', net_cents: -6048, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' },
      ],
    },
  ],
}, null, 2);
