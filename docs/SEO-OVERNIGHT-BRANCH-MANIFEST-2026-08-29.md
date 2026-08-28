# SEO Overnight Branch Manifest — 2026-08-29

All base SHAs below are `origin/main` @ `27258b60ddfc8a98e91a63816d0c6badf9132207` unless noted.
`main` was not modified. No branch listed here was merged.

---

## `claude/seo-overnight-master-2026-08-29` (coordinator branch)

- **Base SHA:** `27258b6`
- **Commit SHA:** (this session's documentation commit — see `git log -1` on this branch after
  the coordinator commit step)
- **Purpose:** Overnight SEO audit coordination — shared evidence, master report, backlog, this
  manifest. No application code changes.
- **Changed files:**
  - `docs/SEO-OVERNIGHT-SHARED-EVIDENCE-2026-08-29.md` (new)
  - `docs/SEO-OVERNIGHT-MASTER-REPORT-2026-08-29.md` (new)
  - `docs/SEO-MASTER-BACKLOG.md` (new)
  - `docs/SEO-OVERNIGHT-BRANCH-MANIFEST-2026-08-29.md` (new, this file)
- **Tests:** n/a (documentation only)
- **Build status:** n/a (documentation only)
- **Risk:** None — no application code touched.
- **Recommendation:** REVIEW. This is documentation for the owner to read; nothing to merge in the
  code sense, though the docs themselves may be worth keeping in `main` at the owner's discretion.

---

## `claude/seo-bayreuth-performance` (implemented this session)

- **Base SHA:** `27258b6`
- **Commit SHA:** `a77faba`
- **Purpose:** Align `/bayreuth/website-relaunch`'s title (both the prerendered manifest entry and
  the page's own hydrated config) with proven "website performance bayreuth" search demand
  (position 7.0–7.2, 49 impr, +729% period-over-period, 0 clicks, Lighthouse 95/100 confirming the
  page is genuinely fast).
- **Changed files:**
  - `src/lib/routing/publicRoutes.ts` (1 line — title only)
  - `src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx` (1 line — title only)
- **Tests:** `npm run typecheck` clean. `npm run lint` — 0 errors, 24 pre-existing warnings
  (unrelated). `npm test` — 78 test files, 2,057 passed / 1 skipped (pre-existing skip, unrelated).
- **Build status:** `npm run build` succeeded — 91/91 routes prerendered; new title verified
  present in `dist/bayreuth/website-relaunch.html`; sibling pages (Regensburg, München relaunch
  pages, homepage) confirmed unchanged.
- **Risk:** Low. 2-line diff, single page, fully reversible (revert the title strings).
- **Recommendation:** REVIEW (owner reads the experiment writeup in master report §4) then MONITOR
  per its measurement plan (7/14/28-day GSC checkpoints) before any merge decision. Not flagged
  DO NOT MERGE, but merging before the measurement window completes would defeat the point of
  running it as a measured experiment.

---

## `claude/regensburg-relaunch-internal-links` (pre-existing, inspected only — not recreated,
not merged, not modified)

- **Base SHA:** `27258b6` (confirmed via `git merge-base origin/main
  origin/claude/regensburg-relaunch-internal-links`)
- **Commit SHAs:** `5455adf` ("SEO: strengthen Regensburg relaunch internal linking"), `a2c2883`
  ("docs: add GSC quick-win forensic analysis")
- **Purpose:** Internal-link experiment strengthening `/regensburg/website-relaunch`'s internal
  authority, plus its own baseline/forensics documentation.
- **Changed files (per `git diff --stat origin/main...origin/claude/regensburg-relaunch-internal-links`):**
  - `docs/GSC-QUICK-WIN-FORENSICS.md` (new, 217 lines)
  - `docs/SEO-EXPERIMENT-BASELINE-2026-08-28.md` (new, 306 lines)
  - `src/components/LocationContent.tsx` (+10 lines)
  - `src/pages/CityLandingPage.tsx` (+32 lines)
- **Tests:** Not re-run this session (branch was inspected via `git show`/`git diff` only, per
  instructions not to recreate or duplicate this work).
- **Build status:** Not re-run this session.
- **Risk:** Not re-assessed this session — this branch was already completed prior to tonight's
  run.
- **Recommendation:** MONITOR — its own baseline document defines its measurement plan; this
  session's evidence (shared evidence §7d) confirms `/regensburg/website-relaunch` is already the
  clear winner of its query family (position 5.4 vs. 56.8/70.7 for competing internal URLs),
  consistent with the experiment working as intended. Continue observing per its own checkpoints;
  do not merge until its measurement window completes.

---

## `claude/ga4-consent-mode` (pre-existing, reviewed this session — not recreated, not merged,
not modified)

- **Base SHA:** `27258b6`
- **Commit SHA:** `aa5fa52`
- **Purpose:** Consent-gated GA4 analytics (Measurement ID `G-K7BS3LKT6H`) with Consent Mode v2,
  independent analytics/marketing toggles, revoke path with cookie cleanup, and updated
  Datenschutzerklärung.
- **Changed files (per `git diff --stat origin/main...origin/claude/ga4-consent-mode`):**
  - `.github/scripts/test-seo-consistency.mjs` (+85 lines)
  - `src/components/ConsentBanner.tsx` (+141/-? lines, net growth)
  - `src/lib/consent.test.ts` (new, 263 lines)
  - `src/lib/consent.ts` (+243 lines net, includes rewrites)
  - `src/lib/legal-content.tsx` (+72 lines)
  - `src/pages/legal/DatenschutzPage.tsx` (2 lines)
  - Total: 6 files, +695/-111 lines
- **Tests:** Reviewed this session via an isolated `git worktree` (removed after review, coordinator
  working tree untouched). `npx vitest run` on `consent.test.ts`: **14/14 passed**.
  `.github/scripts/test-seo-consistency.mjs`: all ~50 GA4/consent-specific static assertions
  passed; script then crashed on an unrelated `.bolt/config.json` path-join bug after those
  assertions completed (logged as backlog item BL-10, not a GA4 defect).
- **Build status:** `npm run typecheck` clean on the branch.
- **Risk:** Low-medium (privacy/consent product surface — reviewed clean, but merging analytics
  infrastructure is a product decision).
- **Recommendation:** **NEEDS DECISION** (owner). Technically clean and ready per this session's
  review (9/9 required properties verified true, no critical defect — see master report §14), but
  merging is explicitly left to the owner per the task's hard safety boundaries, not because any
  defect was found.

---

## Summary table

| Branch | Base | Commit(s) | Status | Recommendation |
|---|---|---|---|---|
| `claude/seo-overnight-master-2026-08-29` | `27258b6` | (this session) | Docs only | REVIEW |
| `claude/seo-bayreuth-performance` | `27258b6` | `a77faba` | Implemented, verified, pushed | REVIEW → MONITOR before merge |
| `claude/regensburg-relaunch-internal-links` | `27258b6` | `5455adf`, `a2c2883` | Pre-existing, inspected only | MONITOR (already running) |
| `claude/ga4-consent-mode` | `27258b6` | `aa5fa52` | Pre-existing, reviewed clean | NEEDS DECISION (owner) |

`main` remains at `27258b6` throughout this session. No branch was merged. No force-push was used.
