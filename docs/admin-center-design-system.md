# Admin Center — one design language

The authenticated Cogniiq surfaces share a design system: `src/components/dashboard`
(tokens, primitives, overlays, shell). Everything visual in it comes from
`tokens.ts` — no component hard-codes a colour, radius, shadow or duration — and
it is scoped to `[data-cq-surface="dashboard"]`, so public marketing pages never
mount it.

This document records which admin surfaces use it, which do not yet, and why
that matters for what comes next.

## The divergence this addresses

Every owner and finance page already used the shared primitives. The
client-platform CRM (`/admin/clients/*`) used none of them: it carried its own
recipes in `adminUi.tsx`, in a visibly different language.

| | Dashboard system | Legacy CRM recipes |
| --- | --- | --- |
| Card | 12px radius, hairline border, no shadow | 16px radius, `0 18px 60px` drop shadow |
| Status | `StatusBadge` — 6px radius | `Pill` — fully rounded |
| Control height | 36px (`control.md`) | 44px |
| Colour | `--cq-*` tokens | hard-coded `gray-*` / `emerald-*` |
| Feedback | `useToast` (already mounted by the shell) | a second, hand-rolled notice + `setTimeout` |
| Table on mobile | card stack (`DataTable`) | an 880px table in a horizontal scroller |

Two design languages in one workspace is not a matter of taste: the owner moves
between Finance and the CRM constantly, and each switch costs a beat of
re-orientation.

## Migrated

| Page | Now uses |
| --- | --- |
| `ClientsListPage` | `PageHeader`, `Card`, `Field`, `Select`, `DataTable`, `StatusBadge`, `EmptyState`, `ErrorState`, `TableSkeleton`, `Button` |
| `AdminInvitationsPage` | `PageHeader`, `Select`, `DataTable`, `StatusBadge`, `EmptyState`, `ErrorState`, `TableSkeleton`, `Button`, `useToast` |
| `AdminSolutionsPage` | `PageHeader`, `DataTable`, `StatusBadge`, `EmptyState`, `ErrorState`, `TableSkeleton`, `Button`, `useToast` |

Beyond consistency, the migration fixed three real defects:

1. **The clients table was unusable on a phone.** An 880px-wide table in a
   horizontal scroller put the customer's name off screen as soon as the owner
   scrolled right to read a status. `DataTable` renders a card stack below `md`.
2. **Empty states could not be told apart.** "No clients at all" and "nothing
   matches your filter" showed the same sentence. They are now distinct, and the
   first offers the action that resolves it.
3. **Failures were announced as successes.** The hand-rolled notice showed
   `Fehler: …` in the same green surface used for success, and a failed resend
   still refetched, which read as if it had worked. Failures now use the error
   tone and do not refetch.

The data pipelines — search, filters, sort, invitation-action gating, solution
flattening — are byte-identical to their previous versions. Only presentation
changed. `crmPages.test.tsx` covers all of it behaviourally; these pages
previously had no tests at all, which is precisely why a purely visual refactor
of them was worth writing tests for first.

## Not migrated yet

| Page | Size | Why it is not in this change |
| --- | --- | --- |
| `ClientDetailPage` | 39 × `AdminCard`, 12 × `Pill`, 4 × `AdminField` | The largest CRM surface, and the one the future Customer 360 replaces outright. Migrating its current shape would be work thrown away; it should be rebuilt against the 360 structure instead. |
| `NewClientWizard` | 5 × `AdminCard`, 16 × `AdminField`, 4 × `AdminSelect` | A multi-step form with its own validation flow. A form migration is a behavioural change, not a visual one, and belongs in its own reviewable PR. |

`adminUi.tsx` survives for exactly these two and is documented as closed to new
use. `statusTones.ts` holds the status→tone mapping both old and new pages share:
that is domain knowledge (which lifecycle state reads as a warning), not styling,
and it must give one answer everywhere.

## What this unlocks

The eventual Customer 360 needs to present identity, projects, sold services,
delivery, work, offers, contracts, invoices, payments, recurring revenue,
documents, activity and upcoming actions — on one page, without it turning into
a wall. Every one of those sections is a header, a table, a badge, a metric, an
empty state or a loading state that the shared system already provides.

The value of this migration is that the CRM no longer has a competing answer for
any of them. The next customer-facing surface starts from one vocabulary rather
than choosing between two.
