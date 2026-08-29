# Regensburg Internal-Link Experiment — Production Readiness Review — 2026-08-29

**Status: READY FOR OWNER REVIEW. Not merged. Not deployed.**

**Source branch reviewed:** `claude/regensburg-relaunch-internal-links` (commits `5455adf`,
`a2c2883`), originally based on `origin/main` @ `27258b6`.
**This branch:** `claude/seo-regensburg-production-ready-2026-08-29`, rebased fresh from
`origin/main` @ `633a968` (includes Graphify tooling and everything else merged to `main` since
the experiment branch was cut).
**Superseded docs:** `docs/SEO-EXPERIMENT-BASELINE-2026-08-28.md` and
`docs/GSC-QUICK-WIN-FORENSICS.md` on the source branch are **not** carried forward as-is. Their
GSC figures are treated below only as historical baseline, cross-checked against the independent
overnight evidence in `docs/SEO-OVERNIGHT-SHARED-EVIDENCE-2026-08-29.md` and
`docs/SEO-OVERNIGHT-MASTER-REPORT-2026-08-29.md` (branch `claude/seo-overnight-master-2026-08-29`)
rather than re-asserted from the original branch alone.

**Explicit constraint honored:** current GSC movement is **not** treated as proof this unmerged
experiment worked. Nothing in this document claims a ranking result — the experiment has not been
deployed. This document only re-justifies the *decision to ship the code*, and defines how the
result will actually be measured once it is live.

---

## 1. Re-evaluation against the overnight evidence

The overnight SEO audit (`claude/seo-overnight-master-2026-08-29`, produced independently on
2026-08-29 against `origin/main` @ `27258b6`, i.e. before this review) inspected the Regensburg
experiment on its own merits and reached the same conclusion as the original branch, using its own
GSC pulls:

- Master report §3 (Top 20 opportunities), row 2: `website relaunch regensburg` (+variants),
  position 5.4–14.8, "Internal authority (being tested)" — *"Already isolated in
  `claude/regensburg-relaunch-internal-links` — monitor, do not duplicate."*
- Master report §6 (cannibalization map): *"Regensburg website-relaunch family ... Correct page
  already wins decisively (5.4 vs. 56.8 vs. 70.7) ... **KEEP** — working as intended, matches the
  live internal-link experiment."*
- Master report §5 (money page roadmap): *"do not add a third change to either page until their
  current experiments report."*
- Master report §10: this is explicitly one of the cases where internal authority, not external
  authority, is the limiting factor — *"not the dominant constraint for the 'correct URL wins'
  cases (Regensburg/Bayreuth relaunch pages), where positions 5–15 show on-page relevance and
  internal authority are already sufficient to compete."*
- Master report §21/§22/§23: the Regensburg experiment is carried forward into the shared 7/14/28
  monitoring plan and the 30-day growth plan as a live, undisturbed experiment — no further code
  change to the target page is recommended by that independent review either.

This is a second, independently-run analysis reaching the same targeting conclusion from its own
GSC data pull, not a re-reading of the original branch's own claims.

### Required questions, answered against this evidence

**Does `/regensburg/website-relaunch` remain the correct target URL?**
Yes. Both the original baseline and the overnight pull agree the correct page already wins
decisively over the two cannibalizing URLs for the core query (5.4 vs. 56.8 `/regensburg` vs. 70.7
`/webdesign`). No newer evidence suggests a different URL should own this query family.

**Is position ~5–15 evidence strong enough to justify stronger internal linking?**
Yes, and only for this reason: the overnight audit's own diagnosis (§10) singles out
"correct-URL-wins" pages at position 5–15 as the one class of opportunity where internal-authority
fixes are plausible, as distinct from the site's page-40+ opportunities where the constraint is
external authority and no on-page or internal-link change is expected to help. This is a narrow,
evidence-scoped justification, not a general "more links help" argument.

**Do the new links improve UX as well as SEO?**
Yes. Both additions are one relevant, on-topic sentence each, placed inside existing prose blocks
(the Regensburg city hub's service section, and the homepage's existing "Lokal verwurzelt, digital
vernetzt" paragraph about Regensburg). A visitor reading either page organically encounters "you
already have a site? here's the modernization option" as a natural next link — this is normal
in-context editorial linking, not a link dropped for crawler benefit alone.

**Could they create conflicting query ownership?**
No. The `deepDive` field was deliberately kept out of `CITY_LINKS` specifically to avoid two forms
of conflict the original author identified: (1) a 4th entry in `CITY_LINKS.regensburg` would break
the 3-column grid layout (a visual regression), and (2) `CITY_LINKS` is also reused in the "Weitere
Standorte" lists on `/bayreuth` and `/muenchen`, so adding to it would have changed what those
unrelated pages render. The `deepDive` field is scoped to `CITY_CONFIGS.regensburg` only and is
`undefined` for Bayreuth and München — verified below (`0` occurrences in both rendered pages).

**Are the anchors natural?**
Yes. `Relaunch der bestehenden Website` (city hub) and `bestehende Websites modernisieren`
(homepage) are both descriptive, non-exact-match German phrasing — deliberately different from the
6 pre-existing exact-match anchors (`Website Relaunch Regensburg` / `Website Relaunch`) already
pointing at the page. This avoids anchor-text over-optimization while still being unambiguous about
the destination.

**Is the change still the smallest useful intervention?**
Yes. 2 files, +42 lines, 0 deletions. The target page itself (title, meta description, H1, body
copy, schema, canonical, routing) is untouched. No other page's rendered output changes except the
two intended surfaces.

### Decision: **YES — the experiment remains justified.** Proceeding to port the implementation.

---

## 2. What was ported

Exactly the two source-code changes from `claude/regensburg-relaunch-internal-links`
(`5455adf`), cherry-picked onto current `origin/main` — no other files, no forensic/baseline
documentation carried over verbatim:

| File | Change |
|---|---|
| `src/pages/CityLandingPage.tsx` | Added optional `deepDive` field to `CityConfig`, populated for `regensburg` only, rendered under the existing service grid. |
| `src/components/LocationContent.tsx` | Added one contextual sentence with a link inside the existing "Lokal verwurzelt, digital vernetzt" homepage block. |

Anchors added (unchanged from the original experiment):

| # | Surface | Anchor text | Target |
|---|---|---|---|
| 1 | `/regensburg` city hub | `Relaunch der bestehenden Website` | `/regensburg/website-relaunch` |
| 2 | Homepage (`LocationContent`) | `bestehende Websites modernisieren` | `/regensburg/website-relaunch` |

Internal link count for the target page: 6 → 8 (unchanged from the original experiment's own
count).

**Preserved from current `main` untouched:** Graphify tooling and configuration (`chore: install
and configure graphify knowledge graph tooling`, merged to `main` after the experiment branch was
cut) and every other change merged to `main` since `27258b6`, including the client-service
onboarding system and related fixes. This branch was cut from current `origin/main`
(`633a968`), not rebased from the stale experiment branch, so nothing on `main` was reverted or
overwritten.

---

## 3. Verification (run on this branch, current `main` base)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass — 1 pre-existing `tsconfig` deprecation warning (`baseUrl`, TS5101), present identically on `main` without this change; not introduced by this diff |
| `npm run lint` | 0 errors, 24 warnings — all pre-existing, none in the two changed files |
| `npm test` | 77 files passed / 1 skipped, 2039 tests passed / 20 skipped, 0 failed |
| `npm run build` (SSR + sitemap-shape + client + prerender) | Pass — 91/91 public routes prerendered (88 indexable, 3 noindex) |
| Files changed | exactly 2 (`CityLandingPage.tsx`, `LocationContent.tsx`), +42 / −0 lines |

### Target-page and cross-page checks (against the built `dist/` output)

| Check | Result |
|---|---|
| Target page prerendered | `dist/regensburg/website-relaunch.html` generated |
| Served title | `Website Relaunch Regensburg – Modernisierung ohne Rankingverlust \| Cogniiq` — unchanged |
| Served canonical | `https://cogniiq.de/regensburg/website-relaunch` — unchanged |
| Served meta description | unchanged |
| Served robots | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` — unchanged |
| New link in `dist/regensburg.html` | present, 1 occurrence |
| New link in `dist/index.html` | present, 1 occurrence |
| `dist/bayreuth.html` | 0 occurrences of the new copy/links — unaffected |
| `dist/muenchen.html` | 0 occurrences of the new copy/links — unaffected |
| `dist/bayreuth/website-relaunch.html` title | unchanged, unaffected by this change |
| `dist/index.html` (homepage) | renders, valid title, no unrelated changes |

No unrelated files changed; no other route's rendered HTML differs.

---

## 4. Deployment measurement plan

**Do not declare this experiment successful before deployment**, and not from the first
post-deploy window either — GSC has a 2–3 day reporting lag, so the earliest a post-deploy window
can start is ~3 days after the PR merges and the change actually ships to production.

### Baseline (frozen, pre-deployment — GSC window 2026-07-31 → 2026-08-25, `sc-domain:cogniiq.de`)

Cross-checked and consistent between the original experiment's own baseline capture and the
independent overnight evidence pull.

| Query family | Target URL | Position | Impressions | Clicks | CTR |
|---|---|---|---|---|---|
| website relaunch regensburg | `/regensburg/website-relaunch` | 5.4 | 61 | 1 | 1.64% |
| homepage relaunch regensburg | `/regensburg/website-relaunch` | 14.8 | 33 | 0 | 0% |
| pagespeed optimierung regensburg | `/regensburg/website-relaunch` | 22.4 | 31 | 0 | 0% |

Cannibalization baseline (must hold or improve, not worsen, post-deploy):

| Competing URL | Position | Impressions | Clicks |
|---|---|---|---|
| `/regensburg/website-relaunch` (target) | 5.4 | 61 | 1 |
| `/webdesign` | 70.7 | 37 | 0 |
| `/regensburg` | 56.8 | 15 | 0 |

### Post-deploy checkpoints

Start no earlier than 3 days after merge/deploy, then measure full 28-day-equivalent windows at:

| Checkpoint | What to re-pull | Success signal | Falsification signal |
|---|---|---|---|
| **7 days** post-deploy | Position/impressions/clicks/CTR for the 3 query rows above; indexation status (`PASS`, canonical self-match) for the target URL | Early positional movement (not required yet — 7 days is too short for click volume to be meaningful) | Indexation regression, canonical change, or a position drop of >5 spots on any of the 3 queries |
| **14 days** post-deploy | Same metrics, full window where possible | Position holding or improving vs. baseline; competing-URL (`/webdesign`, `/regensburg`) impressions for the same query family flat or falling, not rising | If competing-URL impressions rise while target position is flat, treat as an early signal the change redirected authority the wrong way |
| **28 days** post-deploy | Same metrics, one full comparable 28-day window; re-derive the internal-link table from `dist/` to confirm no drift | Position improves from 5.4, or impressions/clicks trend up on the target with competing URLs flat/down | Per the falsifiability rule below |

### Falsifiability (carried forward from the original experiment's baseline doc, unchanged)

If after two full 28-day post-deploy windows position has **not** improved on `website relaunch
regensburg` **and** impressions on `/webdesign` / `/regensburg` for that query are unchanged, the
internal-authority hypothesis is wrong for this page — the next step is investigating external
backlink authority, not further internal-link changes to this page.

### What must NOT be treated as evidence

- Any GSC movement observed **before** this PR is merged and deployed. The branch reviewed here has
  never been live; current site behavior reflects `main` without these two files.
- Any movement in the first ~3 days after deploy (GSC reporting lag).
- Any change to `/bayreuth/website-relaunch`'s own metrics — that page is a separate, independently
  live experiment (`claude/seo-bayreuth-performance`) and must not be conflated with this one.

---

## 5. Confirmation

- No files under `src/`, `public/`, or any website surface were modified beyond the two files
  listed in §2.
- Target page (`/regensburg/website-relaunch`) itself: title, meta description, H1, body copy,
  schema, canonical, routing, URL — all unmodified.
- Bayreuth and München pages: unaffected, verified against rendered `dist/` output.
- Homepage: renders correctly, valid title, only the one intended new sentence added.
- Graphify configuration and everything else on current `main` (`633a968`) preserved untouched.
- All required checks (`typecheck`, `lint`, `test`, `build`, prerender) pass with no newly
  introduced failures.

**Final result: READY FOR OWNER REVIEW.**
