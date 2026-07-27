# Phase 0 — Legal details (INTERNAL, not published)

Status after the operator's corrections. The public `/impressum` and
`/datenschutz` pages contain **no visible placeholders** and only verified
information. All previously open items have been resolved by the operator.

## Verified operator record (single source of truth)

Rendered on `/impressum` and used as the data controller on `/datenschutz`:

```
Cogniiq
Inhaber: Lazar Popovic
Am Main 3
95444 Bayreuth
Deutschland
```

- **Legal form:** sole proprietorship (Einzelunternehmen), Inhaber Lazar Popovic.
  `BUSINESS_INFO.legalName` and the Organization/LocalBusiness structured data
  now read **"Cogniiq, Inhaber Lazar Popovic"** (previously the inconsistent
  "Cogniiq – Lazar & Djordje Popovic").
- **Address:** **Am Main 3, 95444 Bayreuth** — corrected from the earlier
  street-name variant everywhere (source of truth `src/lib/seo-data.ts`, plus the
  static structured data in `index.html`).
- **VAT:** the business is **VAT-liable** and does **not** use the reduced-VAT
  small-business scheme under § 19 UStG. **USt-IdNr. gemäß § 27a UStG:
  DE460292419** is shown on the Impressum.
- **Personal Steuer-ID:** confidential — **never** stored or rendered anywhere in
  the repository.
- **§ 18 Abs. 2 MStV** content responsibility: **Lazar Popovic, Am Main 3,
  95444 Bayreuth** (single responsible person).
- **§ 36 VSBG:** neutral non-participation statement retained.
- **Statutes:** § 5 DDG (not the obsolete § 5 TMG); no discontinued EU-ODR link.

## Datenschutz — confirmed processor scope

Only services that actually process personal data via the public website /
related customer workflows are disclosed, each with its purpose:

- **Cloudflare** — hosting/CDN (connection data, IP). ✔ public site.
- **n8n (self-hosted, n8n.cogniiq.co)** — processing/forwarding of contact, FAQ
  and demo form submissions. ✔ confirmed via `src/config/externalEndpoints.ts`.
- **Browser storage** — `cogniiq_consent_v1` (consent), `cogniiq-theme` (theme),
  `cogniiq_avail*` (session UI). ✔ technically necessary, no tracking.
- **Google Ads** — consent-gated only (Consent Mode v2, Basic). ✔.
- **Supabase** — authentication + customer data for the registered customer
  portal. ✔ `/app` workflows (not the public marketing forms).
- **Resend** — transactional emails in the offer/signature workflow. ✔.

**Stripe / PayPal:** confirmed by the operator as **not used on the public
website** → deliberately **not** listed as processors.

## Guarantees

- No absolute legal-compliance guarantee is made on the pages.
- The reduced-VAT small-business label (§ 19 UStG) is not referenced anywhere
  (the business is VAT-liable).
- The personal Steuer-ID appears nowhere.
- These invariants are enforced by `.github/scripts/test-seo-consistency.mjs`.
