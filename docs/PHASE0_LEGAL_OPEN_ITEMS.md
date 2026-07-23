# Phase 0 — Legal open items (INTERNAL, not published)

This note lists legal details that could **not** be verified from the repository
and were therefore **not** invented or rendered on the public pages. The public
`/impressum` and `/datenschutz` pages contain **no visible placeholders**; they
show only verified information. Please confirm the items below with your tax
advisor / lawyer, then supply the values for a follow-up commit.

## Impressum — unresolved / to confirm

1. **Legal form (Rechtsform).** The repository's `legalName` is
   `"Cogniiq – Lazar & Djordje Popovic"`. No legal form (e.g. GbR) is stated in
   the source of truth, so none is asserted on the page. → Confirm the exact
   registered legal form.
2. **USt-IdNr. (§ 27a UStG).** Not present in the repo. If a VAT ID exists it
   must be added. If the business is a Kleinunternehmer / has no VAT ID, that is
   also fine — but confirm so we know whether the field is simply omitted
   correctly. → Provide VAT ID or confirm none.
3. **Register entry (Handelsregister/Nr.).** None in repo; none shown. A GbR has
   no register entry (correct to omit). Confirm the legal form to close this.
4. **§ 18 Abs. 2 MStV content responsibility.** Currently set to the two named
   founders (Lazar Popovic, Djordje Popovic) at the company address — both are
   verified data already in the repo (founders + address). Confirm this is the
   intended responsible person(s).
5. **§ 36 VSBG (consumer arbitration).** A neutral non-participation statement is
   included ("nicht verpflichtet und nicht bereit … teilzunehmen"). For a very
   small business (≤ 10 employees) the § 36 statement is often not mandatory; the
   included statement is the safe neutral default. Confirm it reflects your
   intent, or ask us to remove it.
6. **Statute modernisation.** References updated from the obsolete **§ 5 TMG** to
   **§ 5 DDG** and TMG liability §§ to **DDG** §§ 7–10. Confirmed correct as of
   the DDG (2024). No EU Online-Dispute-Resolution (ODR) link was added — that
   platform was discontinued in July 2025.

## Address — verified, but confirm against the official record

- The **only** address value in the repository's source of truth
  (`src/lib/seo-data.ts`, and identically in `index.html` structured data) is
  **`Am Main Straße 3, 95444 Bayreuth`**. There is **no** `Am Main 3` variant
  anywhere in the repo, so there is no in-repo conflict; the pages use this
  authoritative value.
- ⚠️ The phrasing `Am Main Straße 3` is slightly unusual. Please confirm it
  matches the official Gewerbeanmeldung exactly (it could conceivably be
  `Am Main 3`, `Ammainstraße 3`, or similar). If the official record differs,
  update `src/lib/seo-data.ts` (single source — the whole site follows it).

## Datenschutz — confirm processor scope

The privacy page discloses only services that actually process personal data via
the public website / related customer workflows, each with its purpose:

- **Cloudflare** — hosting/CDN (connection data, IP). ✔ used for the public site.
- **n8n (self-hosted, n8n.cogniiq.co)** — processing/forwarding of contact, FAQ
  and demo form submissions. ✔ confirmed via `src/config/externalEndpoints.ts`.
- **Browser storage** — `cogniiq_consent_v1` (consent), `cogniiq-theme` (theme),
  `cogniiq_avail*` (session UI). ✔ technically necessary, no tracking.
- **Google Ads** — consent-gated only. ✔ confirmed via the (now removed) inline
  tag; loading moved behind consent.
- **Supabase** — authentication + customer data for the registered customer
  portal. ✔ used in `/app` workflows (not the public marketing forms).
- **Resend** — transactional emails in the offer/signature workflow. ✔.

**Deliberately NOT listed (confirm before adding):**

- **Stripe / PayPal.** These appear in the repository in the context of the Owner
  Dashboard finance/offer workflow and in *customer* systems (e.g. the SV
  Heinersreuth booking system), **not** verifiably in payment processing on the
  public `cogniiq.de` website itself. Per the instruction "list only services
  that actually process personal data through the public website or related
  customer workflows," they were **omitted** to avoid an unsupported disclosure.
  → Confirm whether the public offer portal (`/d/:token`) or any public page
  takes payments via Stripe/PayPal. If yes, we will add a scoped disclosure.

## Notes

- No absolute legal-compliance guarantee is made anywhere on the pages.
- The old footer modal claimed "keine Tracking- oder Analyse-Cookies" — this
  contradicted the Google Ads tag and has been replaced by an accurate,
  consent-based disclosure.
