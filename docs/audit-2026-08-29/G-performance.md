# G — Web Performance / Core Web Vitals audit

Scope: `dist/` production build at branch `claude/cogniiq-website-audit-rswgrv`.
Read-only. No repository file was modified; no rebuild was run.

## Bottom line

**Performance is not this site's binding constraint, and most of it is genuinely
well built.** Zero webfonts, zero images on marketing pages, CLS 0, a clean
consent gate, and private-app code (react-pdf, recharts, finance, admin,
club-operations) is correctly walled off behind lazy private routes.

Two things are genuinely wrong and worth fixing regardless of traffic:

1. **The prerendered HTML ships its own content hidden** (`style="opacity:0"`
   from framer-motion `initial`). `/ki-telefonassistent-arzt` and
   `/bayreuth/website-relaunch` — both live-experiment pages — render **zero
   visible text in the first viewport without JavaScript**. Measured cost:
   **LCP 2440 ms → 804 ms (−1636 ms)** on `/ki-telefonassistent-arzt`;
   **FCP 2464 ms → 896 ms (−1568 ms)** on `/kontakt`.
2. **`@supabase/supabase-js` (~211 KB raw / ~54 KB gz) is in the entry chunk**
   and `AuthProvider` boots on every public marketing page. It is 28 % of the
   entry chunk, unused by any marketing visitor, and it is the documented root
   cause of the "preload every route chunk before hydrating" machinery that
   gates hydration on 46 requests on the homepage.

Everything else is small.

---

## Summary table

| ID | Title | Conf. | Sev | Measured cost | Expected saving |
|---|---|---|---|---|---|
| G-PERF-01 | Prerendered HTML renders its own content at `opacity:0` | KNOWN | **P1** | `/ki-telefonassistent-arzt` LCP 2440 ms; `/kontakt` FCP 2464 ms; 0 visible viewport text without JS on 3 of 5 pages | −1.6 s LCP (arzt), −1.57 s FCP (kontakt) |
| G-PERF-02 | Supabase client + AuthProvider in the public critical path | KNOWN | **P1** | ~211 KB raw / ~54 KB gz of 649 KB / 190.7 KB gz entry chunk; auth storage probe fires on `/` and `/praxen` | −54 KB gz on every public page; removes the hydration-preload constraint |
| G-PERF-03 | Spline 3D hero costs 564 KB gz + a third-party scene fetch on the desktop homepage | KNOWN | P2 | desktop `/` TBT 1330 ms, LCP 3336 ms @4× CPU; `react-spline` chunk 563.9 KB gz / 1991.8 KB raw + `prod.spline.design/…/scene.splinecode` | −564 KB gz and −~1 s TBT for desktop visitors, if dropped |
| G-PERF-04 | framer-motion (~137 KB raw / ~44 KB gz) is eager in the entry chunk | KNOWN | P2 | 21 % of entry chunk; loaded on every page including `/impressum` | −44 KB gz on pages that do not animate |
| G-PERF-05 | 30 sub-3 KB lucide icon chunks preloaded on the homepage | KNOWN | P3 | 30 chunks, 13.8 KB raw total, all gated before hydration | −29 requests, ~0 KB |
| G-PERF-06 | `Lazar_Popovic.png` is 274 KB at 3000×3000 for a 176 px box | KNOWN | P3 | 273.9 KB, `/scan` only | −265 KB on `/scan` |
| G-PERF-07 | `public/_headers` sets `Cache-Control` on `/index.html` only, not the other 92 prerendered documents | LIKELY | P3 | 1 of 93 public HTML files covered | correctness, not bytes |
| G-PERF-08 | SSR `useLayoutEffect` warnings from PublicThemeManager | KNOWN | P3 (no action) | measured: no theme flash, no console error, no hydration mismatch | none — cosmetic |
| G-PERF-09 | One non-reproducing CLS = 1.000 on `/bayreuth/website-relaunch` | UNCERTAIN | P3 | 1 occurrence in 10 runs; 0.000 in the other 9 | unknown |

---

## Methodology and its limits (read this before trusting a number)

- `dist/` was served by a local Node static server on `127.0.0.1:4179` with
  gzip level 9 on text responses (script:
  `scratchpad/srv.cjs`). Cache-Control was `no-store`, so every run is a cold
  first visit.
- Playwright + bundled Chromium, mobile profile 390×844 @3× DPR, `isMobile`,
  CDP `Network.emulateNetworkConditions` at 150 ms RTT / 1.6 Mbps down, and
  `Emulation.setCPUThrottlingRate` 4× — approximately Lighthouse's "Slow 4G,
  mid-tier mobile". LCP/CLS/longtask via `PerformanceObserver` with
  `buffered:true`; TBT = Σ(longtask − 50 ms).
- **This is lab, on localhost, with no CDN, no HTTP/2, no Brotli, no TLS.**
  Treat every absolute number as a *relative* comparison between pages and
  between A/B variants, not as field data. Real-world numbers will be better on
  the network side (Brotli, HTTP/2 multiplexing, edge caching) and roughly the
  same on the CPU side.
- Outbound HTTPS is proxied and returned 403 for `prod.spline.design` and for
  `cogniiq.de` itself, so: the `.splinecode` scene file's byte size could **not**
  be measured, and live response headers could **not** be verified. Both are
  flagged as such below.
- Scripts used, for reproduction:
  `scratchpad/cwv.mjs`, `opacity-ab.mjs`, `nojs.mjs`, `hydr.mjs`, `desk.mjs`,
  `theme.mjs`, `cls2.mjs`.

### Measured Core Web Vitals (mobile, 4× CPU, 1.6 Mbps / 150 ms, cold)

| Route | LCP | FCP | CLS | TBT | JS reqs | JS transfer (gz) | JS parsed (raw) | Hydrated at |
|---|---|---|---|---|---|---|---|---|
| `/` | 2708 ms | 868 ms | 0.000 | 689 ms | 46 | 256.6 KB | 829.3 KB | 2161 ms |
| `/ki-telefonassistent-arzt` | 2336 ms | 968 ms | 0.000 | 305 ms | 8 | 216.5 KB | 730.6 KB | — |
| `/bayreuth/website-relaunch` | 1908 ms | 888 ms | 0.000 | 215 ms | 11 | 211.3 KB | — | — |
| `/praxen` | 1952 ms | 896 ms | 0.000 | 313 ms | 8 | 217.0 KB | 730.6 KB | 1672 ms |
| `/kontakt` | 2408 ms | **2408 ms** | 0.000 | 402 ms | 16 | 239.5 KB | — | — |
| `/` **desktop** 1366×768, 4× CPU, unthrottled network | 3336 ms | — | 0.011 | **1330 ms** | 53 total | + 563.9 KB gz Spline | — | — |

Consistent with the prior Lighthouse 95/mobile on `/bayreuth/website-relaunch`.
Note `/kontakt`: **FCP equals LCP at 2408 ms** — the page paints *nothing at all*
for 2.4 s. That is finding G-PERF-01.

### Bundle reality check

Entry chunk `dist/assets/index-d3iIfW66.js` — **649.0 KB raw / 190.7 KB gz**,
loaded by all 93 prerendered documents. Its static import closure is exactly one
chunk (measured from `dist/.vite/manifest.json`: `isEntry` = `index.html`, no
static `imports`), so this is the whole unconditional critical path.

Composition, measured by locating library markers by byte offset in the minified
file and gzipping each span in isolation:

| Span | Raw | gz | Needed by a marketing visitor? |
|---|---|---|---|
| react + react-dom + scheduler | 149.4 KB | 48.8 KB | yes |
| react-router | 45.9 KB | 17.4 KB | yes |
| framer-motion | 136.7 KB | 43.8 KB | only for animation |
| **@supabase/supabase-js** | **210.9 KB** | **54.4 KB** | **no** |
| app code + lucide core + consent + SEO | 105.9 KB | 28.5 KB | yes |

Largest chunks in `dist/assets` overall (all private/lazy, none preloaded by any
public HTML — verified by `grep -rl <chunk> --include=*.html dist/`, which
returns nothing for every one of them):

```
708.7 KB gz  physics-ChHD2_fM.js                  (Spline runtime)
563.9 KB gz  react-spline-Cte_gOum.js             (Spline runtime)
479.0 KB gz  react-pdf.browser-DDWMDFHP.js        (private: offers/PDF)
190.7 KB gz  index-d3iIfW66.js                    (ENTRY — every page)
108.7 KB gz  FinanceModule-DINPiEeX.js            (private: /admin, /owner)
105.4 KB gz  AreaChart-D0PIlsjG.js                (recharts — private)
 50.4 KB gz  ClubOperationsSolutionLanding-…js    (private: /app/solutions/*)
 48.6 KB gz  opentype-U-0Y99ve.js                 (Spline runtime)
 35.2 KB gz  CityServiceRoute-C8ITNdpa.js         (public, lazy, 9 URLs only)
 26.9 KB gz  index-bqqSgRja.css                   (the only stylesheet)
```

---

## Findings

### G-PERF-01 — The prerendered HTML renders its own content at `opacity:0`
**KNOWN · P1**

Every `<motion.*>` with `initial={{ opacity: 0 }}` (or `whileInView`)
server-renders with the initial style baked into the static markup. Counted in
the built output:

```
dist/index.html                        132 × opacity:0
dist/ki-telefonassistent-arzt.html      73 × opacity:0
dist/bayreuth/website-relaunch.html     49 × opacity:0
dist/kontakt.html                       41 × opacity:0
dist/praxen.html                        14 × opacity:0
```
e.g. `dist/kontakt.html`: `style="opacity:0;transform:translateY(100px)"`.

Source: 180 occurrences of `initial={{ opacity: 0` across `src/**/*.tsx`;
the site header itself is one of them — `src/components/Navigation.tsx:184,196,226`.

**Evidence that this is not cosmetic.** With `javaScriptEnabled: false`
(`scratchpad/nojs.mjs`), counting leaf elements in the first 844 px whose
effective opacity is > 0.01:

| Route | elements at opacity 0 | visible leaf text in first viewport |
|---|---|---|
| `/` | 187 | `Digitale Systeme, die Unternehmen führen.` (H1 only) |
| `/kontakt` | 41 | **none** |
| `/ki-telefonassistent-arzt` | 73 | **none** |
| `/bayreuth/website-relaunch` | 49 | **none** |
| `/praxen` | 19 | `Home`, `Für Praxen` (breadcrumb only) |

The header text (`COGNIIQ`, `Leistungen`, `Standorte`, `Über uns`,
`Kundenlogin`) is at `opacity:0` in the static HTML of every page.

**A/B measurement** (`scratchpad/opacity-ab.mjs`) — identical runs, except the
document response is rewritten in flight to strip `opacity:0` and
`transform:translateY(...)` from the SSR markup:

| Route | as built | initial-hide removed | Δ |
|---|---|---|---|
| `/ki-telefonassistent-arzt` | LCP 2440 ms | **LCP 804 ms** | **−1636 ms** |
| `/kontakt` | FCP 2464 ms | **FCP 896 ms** | **−1568 ms** |
| `/bayreuth/website-relaunch` | LCP 2060 ms | LCP 1768 ms | −292 ms |
| `/praxen` | LCP 2332 ms | LCP 2304 ms | −28 ms |
| `/` | LCP 3020 ms | LCP 3116 ms | +96 ms (no effect) |

(The stripped variant also removes `translateY`, which is why the stripped
`/bayreuth` run shows CLS 1.0 — that is an artifact of the crude rewrite, not of
the proposed fix.)

**Blast radius.** All 93 prerendered documents. Worst on the two live-experiment
pages measured and on `/kontakt`, the conversion page.

**Why it matters beyond LCP.** If the entry chunk fails or is slow, the visitor
sees a blank page rather than degraded content — the exact failure mode
`src/main.tsx:14–24` was written to recover from. Google does execute JS and
these pages are indexed, so I am **not** claiming an indexing impact; that is
UNCERTAIN and should not be asserted.

**Proposed fix.** Make the server render the *final* state and let the animation
run only after hydration. Options, cheapest first:
(a) gate `initial` on a `hasHydrated` flag so SSR emits `initial={false}`;
(b) replace above-the-fold entrance animations with a CSS `@keyframes` that
    starts from `opacity:1` for `prefers-reduced-motion` and non-JS, or with
    `animation-fill-mode: backwards` so the pre-animation state is never
    serialised;
(c) at minimum, exempt the header and the first viewport of each page template.
**Expected saving:** −1.6 s LCP on `/ki-telefonassistent-arzt`, −1.57 s FCP on
`/kontakt`, and content that survives a JS failure.
**Risk:** medium — touches 180 call sites; a partial fix limited to the header +
hero of each template captures most of the win at low risk. Purely visual/CSS,
no copy change.
**Live-experiment overlap:** touches `/ki-telefonassistent-arzt` and
`/bayreuth/website-relaunch`, but changes **no** title, H1, canonical, meta or
anchor text — only when the existing text becomes visible. It should be safe to
ship, but coordinate: it will improve those pages' CWV mid-experiment.

---

### G-PERF-02 — Supabase client and AuthProvider are in the public critical path
**KNOWN · P1**

`src/App.tsx:16` statically imports `AuthProvider`; `src/App.tsx:690` wraps the
**entire** router — public marketing routes included — in it.
`src/contexts/AuthContext.tsx:267–274` calls `supabase.auth.getSession()` and
registers `supabase.auth.onAuthStateChange()` on mount.
`src/lib/supabase.ts:24` calls `createClient` at module scope.

Because the import is static, the library lands in the entry chunk. Verified
directly in the built file — these are library internals, not strings:

```
dist/assets/index-d3iIfW66.js  offset 451953:  `gotrue-js/${$w}`
dist/assets/index-d3iIfW66.js  offset 443657:  `storage-js/${iR}`
dist/assets/index-d3iIfW66.js  offset 370586:  realtime-js
dist/assets/index-d3iIfW66.js  offset ~452000: "Multiple GoTrueClient instances detected…"
```

Span 340 000–556 000 = **210.9 KB raw / 54.4 KB gz — 28 % of the entry chunk.**

Runtime confirmation on public pages (`scratchpad/hydr.mjs`, instrumenting
`localStorage.setItem`): loading `/` and `/praxen` both write an
`lswt-…` key — auth-js's storage-availability probe. So the auth client really
does initialise for an anonymous marketing visitor. No network request to
`*.supabase.co` was made (0 external requests on both pages), so the cost is
bytes + parse + init, not a round trip.

**The second-order cost is larger than the bytes.** `vite.config.ts:20–28` and
`src/main.tsx:71–87` both document the chain explicitly: because Supabase
"publishes an initial auth session within milliseconds of mount", React would
discard the prerendered DOM (React #421) unless every lazy chunk the server
rendered is already in the module cache. So `src/main.tsx:117–123` **blocks
`mount()` on `Promise.all` of every modulepreloaded chunk**. On the homepage
that is 45 chunks / 46 JS requests, and hydration was measured at 2161 ms.
Remove Supabase from the public tree and that constraint largely disappears.

**Blast radius.** Every public page; 54 KB gz + init on ~9 458 impressions/28 d
of visitors who can never log in.

**Proposed fix.** Mount `AuthProvider` only on the private surfaces. The route
prefixes are already enumerated in two places — `scripts/lib/route-chunks.mjs:147`
(`const PRIVATE = ['/app','/admin','/owner','/auth','/d']`) and the inline theme
script in `index.html` — so the predicate exists. Either (a) move `AuthProvider`
inside the private route subtree, or (b) keep it top-level but make it render
children directly and lazily import the Supabase-backed implementation when
`isPrivateSurface(pathname)`.
**Expected saving:** −54.4 KB gz / −211 KB raw parse on every public page
(≈ 28 % of the entry chunk), plus the removal of the preload-before-hydrate gate.
**Risk:** medium. `/d/*` (tokenised document portal) and `/auth` must keep it;
`ConsentBannerGate`, `PublicThemeManager`, `CanonicalManager` sit as siblings
inside `AuthProvider` at `src/App.tsx:691–696` and must not lose their position
in the tree. Needs the existing hydration tests to pass.
**Live-experiment overlap:** none — no markup or metadata change.

---

### G-PERF-03 — Spline 3D hero: 564 KB gz plus a third-party scene fetch, desktop homepage only
**KNOWN · P2**

Measured on a 1366×768 desktop context with WebGL available
(`scratchpad/desk.mjs`): loading `/` requests
`splite-DTDbG5ql.js` → `react-spline-Cte_gOum.js` (**563.9 KB gz / 1991.8 KB
raw**) → `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`
(`src/components/hero/DesktopHero.tsx:107–108`) — the only external request the
whole site makes. Desktop `/` measured **TBT 1330 ms, LCP 3336 ms** at 4× CPU,
against 689 ms / 2708 ms on mobile where the hero never loads.

The Spline runtime additionally splits into `physics` (708.7 KB gz),
`opentype` (48.6 KB gz), `gaussian-splat-compression` (22.6), `boolean` (19.2),
`navmesh` (10.5) and `howler` (8.0). **Those were not requested in my run** —
the scene fetch returns 403 through this environment's proxy, so the runtime
never got far enough to pull them. Whether a real visitor downloads some or all
of that further ~810 KB gz is **UNCERTAIN and unmeasured here**; the
`.splinecode` file's own size is likewise unmeasured for the same reason.

**Credit where due:** the gating is already careful and better than most.
`src/components/HeroSection.tsx:10–36` renders `MobileHero` on the server and
promotes to `DesktopHero` only via `matchMedia('(min-width: 1024px)')` after
mount, deliberately avoiding a hydration mismatch;
`src/components/hero/DesktopHero.tsx:66–80` probes for a real WebGL context,
`:82–85` honours `prefers-reduced-motion`, `:96–105` honours `Save-Data` and
`effectiveType` 2g/slow-2g, and `:180+` preconnects only at the moment it commits.
The panel is `aria-hidden`. Mobile visitors pay nothing.

**So the question is not "is it loaded badly" — it is "is a decorative 3D scene
worth ~564 KB gz and ~1.3 s of desktop main-thread time on the homepage of a
B2B agency whose buyers are on desktop."** That is a business call, not a bug.
**Proposed fix (if the answer is no):** replace the scene with a static
poster (WebP/AVIF, ≤ 60 KB) or a CSS/SVG animation. **Expected saving:**
−563.9 KB gz, −~1 s desktop TBT, one fewer third-party origin, and the removal
of the only external dependency in the site's rendering path.
**Risk:** low technically; it is a visual-identity decision.
**Live-experiment overlap:** none (`/` is not under experiment).

---

### G-PERF-04 — framer-motion is eager in the entry chunk
**KNOWN · P2**

`~136.7 KB raw / 43.8 KB gz`, located at offset ~239 805 in
`dist/assets/index-d3iIfW66.js` (marker: `framerAppearId`, `visualElement`
renderer). It ships on `/impressum`, `/datenschutz` and every other page whether
or not that page animates.

It is genuinely used on most marketing pages, so this is not dead weight — but
it is the second-largest optional item in the unconditional path, and
G-PERF-01's fix (CSS entrance animations above the fold) would reduce the
dependency on it.

**Proposed fix.** Not "remove framer-motion" — that is a large refactor for a
site with 12 clicks/28 d. Instead: if G-PERF-01 is solved with CSS, revisit
whether legal/utility pages can be framer-free, and let Rollup split it out.
**Expected saving:** up to −43.8 KB gz on pages that end up not needing it.
**Risk:** medium-high (broad refactor). **Recommend deferring** until G-PERF-01
and G-PERF-02 are done.

---

### G-PERF-05 — Icon chunking is correct but over-granular
**KNOWN · P3**

Icons are **properly tree-shaken** — this is a pass, not a failure. Evidence from
the built chunks (not source): each lucide icon is its own chunk of 293–728
bytes (`check-BBPrm3FW.js` 293 B, `chevron-right-zuZpwTAZ.js` 298 B,
`dumbbell-aDLs9Uur.js` 728 B, …), and only `createLucideIcon`'s factory plus the
ISC licence banner sit in the entry chunk at offset ~308 865. No barrel import,
no whole-set bundle. `@heroicons` is not used at all.

The cost is request count, not bytes: `dist/index.html` preloads **30 chunks
under 3 KB totalling 13 767 bytes raw**, and `src/main.tsx:117–123` makes
hydration wait for all of them.

`vite.config.ts` has no `manualChunks` — this is Rollup's default shared-chunk
splitting.
**Proposed fix.** A `build.rollupOptions.output.manualChunks` rule folding
`node_modules/lucide-react/**` into one `icons` chunk.
**Expected saving:** 30 requests → 1 on the homepage; ~0 KB. Worth ~1 RTT of
queueing on a real HTTP/2 connection — small, but it is a two-line change and it
does not get worse as the site grows.
**Risk:** low. **Live-experiment overlap:** none.

---

### G-PERF-06 — `Lazar_Popovic.png`: 274 KB, 3000×3000, for a 176 px box
**KNOWN · P3**

`public/Lazar_Popovic.png` — 273.9 KB, measured 3000 × 3000 px (PNG IHDR).
It is the only asset in the repo over 200 KB. Used at
`src/pages/ScanPage.tsx:371`:

```
<img src="/Lazar_Popovic.png" alt="Cogniiq Kontakt QR Code" … />
```

inside `w-44 h-44 sm:w-48 sm:h-48` — a **176–192 CSS px** box. That is a
~16× linear oversupply. `/scan` is a lazy route (`src/App.tsx:398,652`) and is
not linked from the marketing nav, so blast radius is small.

Note also the `alt` text says "QR Code" while the filename is a person's name —
flagging as a possible content defect for whoever owns copy/a11y, not for me to
change.

`public/favicon.png` and `public/logo.png` are both 512×512 / 25.0 KB — larger
than needed for a favicon, but cached and irrelevant to CWV.

**Proposed fix.** Export at 384 px WebP/AVIF. **Expected saving:** ~265 KB on
`/scan`. **Risk:** none.

---

### G-PERF-07 — `public/_headers` sets `Cache-Control` on only 1 of 93 public documents
**LIKELY · P3**

`public/_headers` sets `Cache-Control: no-cache, must-revalidate` on every
private surface and on `/index.html` — and the file's own comment block argues at
length why *every* HTML shell must revalidate, because a stale document naming
deleted chunk hashes is exactly what produces the blank page `src/main.tsx`
guards against.

But `/praxen.html`, `/kontakt.html`, `/bayreuth/website-relaunch.html` and the
other 89 prerendered public documents have no rule. They fall through to the
host's default. I could **not verify the live behaviour** — `curl -I
https://cogniiq.de/` returns 403 through this environment's proxy — so this is
LIKELY, not KNOWN. Cloudflare Pages' default for HTML is already revalidating,
in which case this is a documentation/consistency gap rather than a live bug.

The same caveat applies in the other direction to `/assets/*`, which the comment
deliberately leaves out so it keeps "long-lived caching" from the host default.
Worth one command to confirm both:
`curl -sI https://cogniiq.de/praxen; curl -sI https://cogniiq.de/assets/index-<hash>.js | grep -i cache-control`

**Proposed fix (if the check shows a gap).** Add a `/*.html` / `/*` HTML rule
mirroring `/index.html`, and an explicit
`/assets/* → Cache-Control: public, max-age=31536000, immutable`.
**Risk:** low, but verify first — an over-broad `/*` rule could remove asset
caching. **Live-experiment overlap:** none.

---

### G-PERF-08 — The SSR `useLayoutEffect` warnings are cosmetic
**KNOWN · P3 — no action recommended**

The warning comes from `PublicThemeManager` at `src/App.tsx:112–129`, which uses
`useLayoutEffect` to stamp `cq-public-light` on `<html>`.

I tested for the failure modes it could indicate (`scratchpad/theme.mjs`): a
mobile context with OS `colorScheme: 'dark'`, run twice — once clean, once with
`localStorage['cogniiq-theme'] = 'dark'` pre-seeded.

```
seed=null  className history: ["cq-public-light light|light", "cq-public-light light|light"]
seed=dark  className history: ["cq-public-light light|light", "cq-public-light light|light"]
           final: "cq-public-light light", colorScheme light, body bg rgb(250,250,250)
           console errors/warnings: []
```

`dark` is never applied, not even for one frame, because the render-blocking
inline script at the top of `dist/index.html` (`d.classList.add("cq-public-light")`)
runs before the first paint. Zero console errors means **no React #418/#423
hydration mismatch and no #421** either. Measured CLS on that page is 0.000.

**Conclusion: cosmetic prerender-time log noise, not a theme flash and not a
hydration mismatch.** It is worth silencing only to keep the build log readable
(the usual `const useIsomorphicLayoutEffect = typeof window !== 'undefined' ?
useLayoutEffect : useEffect`), and even that is optional.

---

### G-PERF-09 — One non-reproducing CLS = 1.000 on `/bayreuth/website-relaunch`
**UNCERTAIN · P3**

The first measurement run recorded a single layout shift of value **1.000** at
t = 2142 ms attributed to a `DIV.relative` on `/bayreuth/website-relaunch`.
I could not reproduce it: 8 consecutive repeat runs at 390×844 gave
`cls=0.000` every time, and 412×823 and 1280×800 gave 0.000 and 0.012.
The one run in which it recurred was the variant where my test harness had
stripped `transform:translateY` from the document, which is a harness artifact.

Reporting it because a full-viewport shift is severe if real, but I have **no
evidence it is real** and it should not be treated as a defect on this basis.
If the page is instrumented in the field (GA4 is now live), a real CLS value
will settle this in weeks without any code change.

---

## What is already fast and needs no work

These were checked and are genuinely fine. Recommending changes here would be
manufacturing work.

- **Fonts — nothing to do.** The site loads **zero webfonts**. No `@font-face`
  in `dist/assets/index-bqqSgRja.css`, no `fonts.googleapis.com` or
  `fonts.gstatic.com` link in any of the 93 HTML files (the only matches are an
  HTML comment explaining why the preconnects were removed). Everything uses the
  system stack `ui-sans-serif, system-ui, sans-serif, …`. So: no FOUT, no FOIT,
  no font-driven CLS, no `font-display` decision to make, no subsetting to do.
  The two `DejaVuSans*.ttf` in `dist/assets` belong to `@react-pdf/renderer` and
  are never requested by a browser on a marketing page. **This is better than
  most sites manage.**
- **Images on marketing pages — nothing to do.** `grep -c '<img'` returns **0**
  for `dist/index.html`, `dist/praxen.html`, `dist/ki-telefonassistent-arzt.html`,
  `dist/kontakt.html` and `dist/bayreuth/website-relaunch.html`. There is no LCP
  image to preload, no lazy-loading to add, no AVIF/WebP conversion to do, and
  no image-driven CLS. Every LCP element measured is text.
- **Private-app code is properly walled off.** `react-pdf.browser` (479 KB gz),
  `AreaChart`/recharts (105 KB gz), `FinanceModule` (109 KB gz),
  `ClubOperationsSolutionLanding` (50 KB gz), `OuraAnalyticsPage`,
  `CustomerAppShell`: `grep -rl` across all 93 `dist/**/*.html` returns **no
  match** for any of them. None is preloaded by, or statically reachable from, a
  public page. `ClubOperationsModule` is confirmed to live under
  `/app/solutions/:instanceKey/*` (`src/solutions/club-operations/ClubOperationsModule.tsx:9`).
  Aside from G-PERF-02, the public/private split is clean.
- **CLS is 0.** 0.000 on all five routes on mobile, 0.011 on the desktop
  homepage. No image or font is causing shift because there are none.
- **Icon tree-shaking is exemplary** (see G-PERF-05) — per-icon chunks of a few
  hundred bytes, no barrel import, no `@heroicons` at all.
- **GA4 / consent (PR #50) is correct.** No `<script>` referencing
  `googletagmanager.com` exists in any built HTML — the only mention in
  `dist/index.html:6` is a comment saying so. The URL is constructed at runtime
  in `src/lib/consent.ts:34` and injected only via `ensureLibraryLoaded()`
  (`:156–169`), which `applyState()` (`:238–256`) reaches only after a purpose is
  granted; `:251` returns early when neither is. Measured: loading `/` and
  `/praxen` produced **0 external requests** and no Google cookie. Consent Mode
  v2 Basic, correctly implemented — Advanced (which pings pre-consent) is
  deliberately not used. The banner is rendered by `ConsentBannerGate`
  (`src/App.tsx:696`) after hydration and contributed **0.000 CLS** in every run.
- **CSS is a single 26.9 KB gz / 171.8 KB raw stylesheet**, render-blocking once,
  no `@import` chain. Fine.
- **Route-level code splitting is real and the preload sets are correct.**
  Every page is `lazyNamed(() => import(...))` (`src/App.tsx:138+`). The build's
  "93 lazy, 0 already in the entry chunk" is accurate — the entry chunk's static
  closure really is one file. Preloads are derived from what the SSR renderer
  *actually* executed (`scripts/lib/route-chunks.mjs:118–143` intersects the SSR
  manifest's `dynamicImports` with the modules the prerender loader observed), so
  they are not over-preloading: `/bayreuth/website-relaunch` preloads 10 chunks,
  `/praxen` 6, `/kontakt` 14, `/` 45 — proportional to what each page renders.
  The 404 fallback logic (`:153–170`) is thoughtfully handled.
  The one caveat is the hydration gate described in G-PERF-02: for a
  first-time visitor on `/`, "93 lazy routes" does **not** mean a small critical
  path — it means 190.7 KB gz of entry chunk **plus** 45 preloaded chunks that
  must all resolve before `mount()` runs (measured hydration at 2161 ms).
- **Stale-chunk recovery is well engineered** (`src/main.tsx:28–44`) — one
  guarded reload with a 60 s cooldown and a DOM fallback for the chunk list, with
  the failure mode it fixes documented. Do not touch it.

## Recommended order

1. **G-PERF-02** (Supabase out of the public path) — biggest single byte win,
   removes an architectural constraint, zero markup change, no experiment risk.
2. **G-PERF-01** (SSR-hidden content) — biggest user-visible win (−1.6 s LCP on
   an experiment page, −1.57 s FCP on `/kontakt`); start with the header and each
   template's first viewport.
3. **G-PERF-07** — run the two `curl` commands first; act only if there is a gap.
4. **G-PERF-05**, **G-PERF-06** — cheap, low-risk tidying.
5. **G-PERF-03** — a design decision, not an engineering one; raise it, don't
   unilaterally fix it.
6. **G-PERF-04**, **G-PERF-08**, **G-PERF-09** — defer / no action.
