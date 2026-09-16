# BoLaGio project portrait — preview handoff

Owner brief: 2026-09-16. Base main: d0f2083bf0ca533ebc55447a69969780d585aa07.
Route: /kundenprojekte. Branch: claude/bolagio-kunden-projekte-preview.

## Scope

One additive page. Existing pages, global styling, navigation, footer, desktop/mobile heroes and Spline remain unchanged. Access the new page by its direct preview URL for now. The retired /referenzen and /bewertungen redirects remain intact. The new route is prerendered but noindex and excluded from the sitemap.

Confirmed by the owner: BoLaGio GmbH, premium hospitality in Bayreuth; three apartments in preparation at Opernstraße 3 am Sternplatz; planned Açaí health bar and expansion. Guest website and finance/guest/task automation platform are under development. The owner wants this held in preview until BoLaGio is finished.

## Editorial decisions

- Label “Kunden & Projekte”, not reviews without reviews.
- Curated public projects, without an unsupported “last 30 days” counter/filter.
- No fabricated testimonial, price, savings, rating, customer list or launch date.
- Operations illustration explicitly depicts planned architecture, not an actual dashboard.
- No copied guest records or operational data. No API calls from the new page.
- Reviews render only with an explicit publication flag, approval date, author and quote; the initial list is empty.
- The price/value of the project is conveyed by its scope and clear presentation, not an invented contract amount.

## Before release

1. Supply approved screenshots of the real guest website and finance/operations dashboard; replace the concept visual with those once appropriate.
2. Verify the actual integrated booking source, persistence, guest matching, task creation and financial reconciliation. Update each scope statement to match the delivered system.
3. Obtain the exact approved customer testimonial and confirm attribution and any owner/family relationship disclosure. Never repurpose accommodation reviews as Cogniiq reviews.
4. Confirm the café/apartment opening status. Keep upcoming projects distinct.
5. Owner approves publication only when BoLaGio is ready. Then remove the preview notice, deliberately decide indexability/sitemap inclusion and add navigation links in a separate reviewed release change.
6. Re-run required gates and compare against then-current main. Do not auto-merge or enable auto-merge.

## SEO note

No existing page metadata, copy, links or frozen experiment baselines changed. New route only. Once navigation is added in a later release, record the launch date and internal-link change in the SEO ledger.

## Local validation

- Node 22.22.2 production build: 91 prerendered routes; sitemap remains 87 URLs.
- Typecheck passes; lint has no errors and 34 existing warnings.
- Full Node 22 test run: 111 files passed; 2,766 tests passed, one skipped.
- Protected experiment fingerprints/inbound counts remain unchanged; no baseline regenerated.
- Prerender-output and SEO-consistency scripts pass.
- Real browser: 320, 390 and 1440 widths, no horizontal overflow or page errors; hydrated robots remain noindex. Desktop and mobile screenshots inspected locally.
- Hydration script extended to include this real noindex route. Canonical presence is now tested independently from indexing, while existing 404 assertions are preserved.
- Graphify update could not run: executable is not installed in this environment. No graph output was committed.
