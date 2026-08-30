# Admin Center — navigation information architecture

The Cogniiq Admin Center is becoming a business operating system, and its
navigation is the map of that business:

```
Customer → Project → Sold service / engagement → Work → Commercial → Offer / Contract → Invoice → Payment
```

This document records the target navigation, what is implemented today, and
exactly what each missing piece is waiting on. It is the companion to
`src/pages/admin/internalNavigation.ts`, which is the single source of truth in
code, and to `src/pages/admin/internalNavigation.test.ts`, which enforces the one
rule that matters most.

## The rule

**Visible navigation may only offer destinations that resolve.**

A link to a page that does not exist yet is worse than no link at all: the owner
cannot tell "not built" from "broken", and a dead entry in a rail they use every
day erodes trust in every other entry. `internalNavigation.test.ts` asserts that
every href the rail can produce has a matching route, and that the four sections
whose backends are still being built elsewhere (`/admin/home`, `/admin/leads`,
`/admin/projects`, `/admin/command`) are not linked.

The corollary: features are **hidden from navigation, never deleted**. A module
marked `hiddenFromNav` keeps its route, its page, its data and its deep links —
only the rail entry goes.

## Target architecture

```
HOME
  Command Center

CUSTOMERS
  Leads & Pipeline
  Customers
  Projects

FINANCE
  Overview
  INCOME       Invoices · Payments · Recurring · Offers
  COSTS        Expenses · Subscriptions · Assets
  ACCOUNTING   Taxes · Documents · Audit

SYSTEM
  Settings
  Account
```

Oura Analytics is **not** in the target architecture. Standalone task views are
**not** in the target architecture — task and work views become contextual to a
customer, a project or a service, and aggregate into the Command Center.

## What is implemented today

### Finance — grouped, all destinations real

The Finance module carried thirteen destinations as one flat list. That list read
as an undifferentiated wall: nothing told the owner that Rechnungen and Ausgaben
sit on opposite sides of the business. It is now grouped under the target
architecture's own headings, so the rail states the shape of the business and the
grouping will not have to be re-learned when the remaining pages arrive.

| Group | Destinations |
| --- | --- |
| *(unlabelled)* | Übersicht, Kunden & Aufgaben |
| Einnahmen | Angebote, Rechnungen, Umsatz, Laufende Verträge |
| Kosten | Ausgaben, Abos, Anlagen |
| Buchhaltung | Steuern, Dokumente, Audit |
| System | Einstellungen |

Every one of the thirteen destinations that existed before still exists, in the
same place, with the same route. A test asserts the count and each href, so a
future regrouping cannot quietly drop a page.

### Top-level modules

| Module | Rail | Notes |
| --- | --- | --- |
| Task Dashboard | visible | The **interim HOME**. Replaced by the Command Center; see below. |
| Client CRM | visible | Client-platform provisioning: organizations, solutions, invitations. |
| Finance & Steuern | visible to the owner | Owner-only in the rail, behind `PlatformOwnerRoute` **and** RLS. Hiding the item is convenience; those two are the boundary. |
| Oura Analytics | **hidden** | See below. |

## Hidden from the rail

| Surface | Route (still works) | Why |
| --- | --- | --- |
| Oura Analytics | `/admin/oura-analytics` | Personal health analytics. Not part of the business operating system, and it was occupying a top-level slot that HOME and CUSTOMERS need. Page, route and data untouched. |
| Execution OS | `/admin/execution` | A standalone execution surface with no place in the target architecture. Route untouched; it still belongs to the task module, so reaching it by URL shows the right rail. |

Both are asserted by tests: absent from the rail, present as routes.

## What is still missing, and what it waits on

| Target entry | Status | Waiting on |
| --- | --- | --- |
| HOME → Command Center | not built | The lead foundation **and** the project spine. Attention, pulse, upcoming and recent all read across leads, projects and engagements; two of those three do not exist on `main`. |
| CUSTOMERS → Leads & Pipeline | not built | The CRM lead foundation (`owner_leads` and its RPCs), in review on its own branch. Not merged, so no page may link to it. |
| CUSTOMERS → Customers | **exists**, in the wrong place | Currently `/admin/finance/customers`. It belongs under CUSTOMERS, but moving it alone would leave a one-item section and split the owner's customer work across two modules for no gain. It moves when Leads and Projects arrive to stand beside it. |
| CUSTOMERS → Projects | not built | The project/service architecture (`owner_projects` and the service-instance model), being implemented in a separate workstream. |
| FINANCE → INCOME → Payments | not built | No `/admin/finance/payments` page exists. Payments are currently reached through an invoice. A dedicated page needs a payments read model first. |
| SYSTEM → Settings | **exists**, scoped to finance | `/admin/finance/settings` is document/finance settings, not workspace settings. A top-level SYSTEM section needs a settings surface that is not finance-specific. |
| SYSTEM → Account | **exists**, as the rail footer | The account block and sign-out already live at the bottom of the rail. Whether it also needs a page is a product decision, not a navigation gap. |

## How to add a section when its backend lands

1. Add the route.
2. Add the entry to `MODULES` in `internalNavigation.ts`, in the group the target
   architecture puts it in.
3. Remove the corresponding line from the "still missing" table above.
4. `internalNavigation.test.ts` will confirm the destination resolves. If the
   section is one of the four guarded names, remove it from that guard in the
   same change — deliberately, not incidentally.

An empty group is dropped by the shell rather than rendered as an orphan
heading, so a group may be declared before all of its destinations exist.
