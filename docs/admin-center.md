# The Admin Center

The Admin Center is one business operating system, not a CRM sitting next to a finance
tool. This document records the decisions that shape it — what the navigation says, what
each surface is for, and, most importantly, the boundaries this redesign was not allowed
to cross.

## Information architecture

```
START      Command Center                       /admin
KUNDEN     Kundenstamm                          /admin/finance/customers   (owner)
           Portalzugänge                        /admin/clients
           Kundenportal › Lösungen              /admin/solutions
           Kundenportal › Einladungen           /admin/invitations
FINANZEN   Übersicht                            /admin/finance/overview    (owner)
           Einnahmen  › Angebote                /admin/finance/offers
                      › Rechnungen              /admin/finance/invoices
                      › Umsatz                  /admin/finance/revenue
                      › Laufende Verträge       /admin/finance/contracts
           Kosten     › Ausgaben                /admin/finance/expenses
                      › Abos                    /admin/finance/subscriptions
                      › Anlagen                 /admin/finance/assets
           Buchhaltung› Steuern                 /admin/finance/taxes
                      › Dokumente               /admin/finance/documents
                      › Audit                   /admin/finance/audit
           System     › Einstellungen           /admin/finance/settings
```

`src/pages/admin/internalNavigation.ts` is the single source of truth. The rail, the ⌘K
palette and the contract tests all read it, so a destination cannot exist in one and not
the others.

### Rules the navigation follows

**Nothing dead.** Every entry points at a route the router actually mounts. A link to an
empty page is worse than no link, because the owner cannot tell "not built yet" from
"broken". `internalNavigation.test.ts` fails on a rail entry with no matching route, and
`qa-admin-visual.mjs` walks every rail destination in a real browser and fails if one
does not render a page.

**Hidden is not deleted.** `hiddenFromNav` withholds a module from the rail and leaves
its route, its data and its deep links untouched. Two surfaces use it:

- **Oura Analytics** (`/admin/oura-analytics`) — personal health data, not part of the
  business operating system, and every day it sat in the rail it cost a top-level slot.
- **The standalone task / execution OS** (`/admin/tasks/*`, `/admin/execution`) — its own
  `tasks` table, unrelated to the customer tasks the business runs on. The Command Center
  surfaces the same queue contextually and links to it; ⌘K reaches it directly.

Both still work when typed, both are asserted to still work, and neither lost a row of
data.

**Owner-only is presentation, never the boundary.** Finance and the canonical customer
workspace are withheld from a non-owner's rail as a convenience. `PlatformOwnerRoute` and
RLS are what actually stop them.

### What is deliberately absent

- **Leads & Pipeline.** There is no lead backend on `main` (PR #70/#71 are open), so the
  rail does not advertise one.
- **A Projects workspace.** The repository carries two project representations with
  conflicting semantics — `customer_projects` is documented as the customer-visible
  projection, `client_engagements` as the internal record. Electing a canonical one is a
  permanent decision that a UI pass has no business making. Project information is
  surfaced inside Customer 360 (read-only for the portal projection, deep-linked for
  engagements) and nowhere claims to be the canonical spine.

## The surfaces

| Surface | What it is for |
| --- | --- |
| **Command Center** | What today needs from the owner. Attention, pulse, upcoming, recent. |
| **Kundenstamm** | The canonical commercial customer (`owner_customers`) — who, what state, what is open. |
| **Customer 360** | One customer from every side: money, services, offers, invoices, work, history. |
| **Portalzugänge** | Organizations with a portal login. A different object from a customer, and labelled as one. |
| **Finance-Übersicht** | What happened (left) versus what is only planned (right). |
| **Rechnungen / Angebote / Ausgaben / Verträge** | One list shape: header, summary band, chips + search, sortable table, pinned actions. |

## Boundaries this work did not cross

These are invariants, not preferences.

**Customer identity.** `owner_customers` remains the canonical commercial customer.
`organizations` remains the portal tenant and `client_accounts` the portal profile. No
second customer table, no synchronisation, no automatic merging of duplicates. The
Portalzugänge page states the distinction in its subtitle rather than leaving the owner
to infer it.

**Project model.** No canonical project table was elected, no project relationship was
rewritten, and no project migration exists in this work.

**Accounting.** No tax, VAT or EÜR logic was touched. `computeTaxSnapshot`,
`owner_finance_period_summary` and `owner_tax_period_inputs` are called exactly as
before. Every figure the redesign added is a sum over rows an existing read already
returned, and the ones that could be confused are labelled apart:

- *fakturiert* — gross of issued, non-cancelled invoices
- *tatsächlich bezahlt / eingegangen* — recorded payments; the only figure meaning the
  customer paid
- *offen* — gross minus paid on genuinely open invoices, defined once in
  `lib/ownerFinance/commandCenter.ts` and shared, so two pages cannot disagree
- *Angebote in Prüfung / erwartet / vertraglich* — pipeline and contract values, which
  never enter a cash, EÜR or VAT figure

One presentational change worth naming: the invoice list's "Offene Forderungen" total now
clamps a legacy overpaid invoice at zero instead of contributing a negative. The column
beside it already did exactly that; the total simply stopped disagreeing with it. No
stored value changed.

**Invoice integrity.** Numbering, issuance, the immutable snapshot, Storno and the
payment ledger are untouched. Every mutation still goes through the existing owner-gated
RPCs — there is no new write path anywhere in this work, and no direct table write was
added.

**Production data.** No migration was applied, no row was written, no reconciliation was
run. The browser QA answers every Supabase call from invented fixtures in
`.github/scripts/lib/admin-fixtures.mjs` and never reaches a real project.

## Design system

`src/components/dashboard/` is the one authenticated design system.

- `tokens.ts` — colour, radius, elevation, type scale, motion, spacing, grid recipes.
  Nothing downstream hard-codes any of them.
- `primitives.tsx` — the atoms: button, badge, field, table, states.
- `workspace.tsx` — the page shapes: `WorkspaceHeader`, `StatBand`, `Panel`, `ListRow`,
  `Toolbar`, `SearchInput`, `FilterChips`, `SectionNav`.
- `overlays.tsx`, `toast.tsx`, `PremiumSelect.tsx`, `CommandPalette.tsx`.

`PageHeader` renders through `WorkspaceHeader`, so pages not yet individually recomposed
still share one header structure and type scale.

### Motion

Unchanged from PR #74 and still asserted by `qa-admin-shell.mjs`: 140–180ms for
interaction, 240ms for overlays, opacity and small transforms only, dashboard portals
carrying `data-cq-portal="dashboard"`, and reduced motion collapsing declared durations
to 1ms. Buttons and rows answer pointer-down with a 1px sink, which is a state rather
than an animation and therefore survives reduced motion.

### ⌘K

`CommandPalette` offers three kinds of result and is honest about all three: rail
destinations (derived from the navigation model, owner-filtered), actions that are
routes, and customers from a real `owner_list_customers` read that runs once on first
open. There is no global server search, so the palette never implies one — if the
customer read fails (a non-owner), the empty state names only what it actually searched.

## Running the QA

```bash
npm run typecheck && npm run lint && npm test && npm run build

# real Chromium, fixtured backend, no network
node .github/scripts/qa-admin-shell.mjs                       # rail geometry, motion, portals, IA
node .github/scripts/qa-admin-visual.mjs --out /tmp/after      # page composition + screenshots
node .github/scripts/qa-admin-visual.mjs --out /tmp/after --viewports all
```

The visual runner writes a PNG per surface per viewport, which is what makes a
before/after comparison across a branch possible:

```bash
git checkout main   && node .github/scripts/qa-admin-visual.mjs --out /tmp/before
git checkout <work> && node .github/scripts/qa-admin-visual.mjs --out /tmp/after
```
