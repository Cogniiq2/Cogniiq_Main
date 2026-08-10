# Dashboard shell browser QA

`shell-qa.html` + `shell-qa-entry.tsx` are a **dev-only** harness for `src/components/shell/PremiumShell.tsx`.
They are not referenced by `index.html`, not part of any route, and not included in `npm run build`
(Vite builds the single `index.html` entry) — they exist purely so a real browser can be pointed at
the shell without a Supabase session.

## Why it exists

`jsdom` has no layout engine and does not evaluate Tailwind's media queries, so the vitest suites in
`src/components/shell/PremiumShell.test.tsx` and `src/App.shell.test.tsx` can only assert structure
and the class contract. The question that actually regressed — *at 1440px, is the primary navigation
a vertical sidebar on the left, and does the content sit beside it rather than under it?* — can only
be answered by measuring real geometry.

## Running it

```bash
npm ci
node .github/scripts/qa-dashboard-shell.mjs
```

Requires a Chromium and the `playwright` package. The script auto-detects a browser under
`$PLAYWRIGHT_BROWSERS_PATH` (default `/opt/pw-browsers`); override with `PW_CHROMIUM=/path/to/chrome`,
and point `PW_MODULE` at a Playwright installation if it is not resolvable from the repo.

It starts the project's own dev server, then drives both shells (`?surface=owner` and
`?surface=customer`) at 1440×900, 1280×800, 1024×768, 834×1194 and 390×844, asserting:

- the sidebar is vertical, pinned left, and 260–280px (rail: 76–88px);
- no horizontal primary navigation bar is present at desktop or tablet widths;
- content starts after the sidebar — never underneath it;
- the document never scrolls horizontally, before or after navigating;
- the profile dropdown opens fully inside the viewport;
- keyboard focus reaches the sidebar navigation;
- the mobile drawer opens, locks body scroll, traps focus, and closes on Escape, an outside click
  and route selection, with ≥44×44px touch targets;
- reduced motion removes the shared-layout indicator animation and the navigation transitions;
- the console stays clean.

It is not wired into `.github/workflows/build.yml`: CI would have to install Playwright and a
browser, and the invariants that can be checked without a layout engine are already covered by
`npm test`.
