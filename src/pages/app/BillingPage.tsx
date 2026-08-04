import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppEmptyState,
  AppErrorState,
  AppSkeleton,
} from '@/components/app/CustomerAppPrimitives';
import { InvoiceRow } from '@/components/app/CustomerPlatformPrimitives';
import { useCustomerInvoices } from '@/hooks/useCustomerWorkspace';
import { useSharedCustomerProjects } from '@/hooks/useCustomerProjectsContext';
import type { CustomerInvoice } from '@/lib/customerPlatform/types';
import { groupInvoices, summarizeInvoices } from '@/lib/customerPlatform/customerPortalModel';
import { formatCentsCurrencyDe } from '@/lib/ownerFinance/exports/format';
import { cn } from '@/lib/utils';

// The customer's financial overview.
//
// Reads the narrow customer projection of the owner invoice records: only invoices that
// have actually been ISSUED to this organization, and only the fields a customer should
// see. No internal costs, margins, expenses, subscriptions or tax administration data
// are reachable from here.
//
// NOTHING on this page recalculates money. Every figure below is either a stored cents
// value straight from `list_customer_invoices` or a SUM of stored values — no tax is
// re-derived, no rounding is re-applied, no amount is adjusted for display. Payment
// processing is deliberately not part of this release.

export function BillingPage() {
  return (
    <CustomerAppShell>
      <BillingContent />
    </CustomerAppShell>
  );
}

function BillingContent() {
  const { invoices, status, error, reload } = useCustomerInvoices(null);
  const { projects } = useSharedCustomerProjects();

  const projectTitles = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects],
  );

  const groups = useMemo(() => groupInvoices(invoices), [invoices]);
  const summary = useMemo(() => summarizeInvoices(invoices), [invoices]);

  return (
    <>
      <header className="mb-8 border-b border-hairline pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Konto</p>
        <h1 className="mt-2.5 text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-gray-950 sm:text-[34px]">
          Abrechnung
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-gray-600">
          Alle Rechnungen von Cogniiq an Ihre Organisation — mit Status, Fälligkeit und
          PDF-Download.
        </p>
      </header>

      {status === 'loading' ? (
        <div className="space-y-3">
          <AppSkeleton label="Rechnungen werden geladen" />
          <AppSkeleton label="Rechnungen werden geladen" />
        </div>
      ) : null}

      {status === 'error' ? (
        <AppErrorState
          message={error ?? 'Die Rechnungen konnten nicht geladen werden.'}
          onRetry={() => void reload()}
        />
      ) : null}

      {status === 'no-organization' ? (
        <AppEmptyState
          icon={CreditCard}
          title="Keine Organisation verbunden"
          description="Diesem Konto ist noch keine Organisation zugeordnet. Rechnungen erscheinen hier, sobald Ihr Zugang eingerichtet ist."
        />
      ) : null}

      {status === 'ready' ? (
        invoices.length === 0 ? (
          <AppEmptyState
            icon={CreditCard}
            title="Noch keine Rechnungen"
            description="Für Ihre Organisation wurde noch keine Rechnung ausgestellt. Sobald eine Rechnung an Sie geht, finden Sie sie hier inklusive PDF."
          />
        ) : (
          <div className="space-y-9">
            {/* -------------------------------------------------- summary */}
            <section aria-labelledby="billing-summary-heading">
              <h2 id="billing-summary-heading" className="sr-only">Übersicht</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryTile
                  label="Offener Betrag"
                  value={formatCentsCurrencyDe(summary.outstanding, summary.currency)}
                  hint={
                    summary.openCount === 0 ? 'Nichts offen'
                      : summary.openCount === 1 ? '1 Rechnung' : `${summary.openCount} Rechnungen`
                  }
                  tone={summary.outstanding > 0 ? 'attention' : 'success'}
                />
                <SummaryTile
                  label="Davon überfällig"
                  value={formatCentsCurrencyDe(summary.overdue, summary.currency)}
                  hint={
                    summary.overdueCount === 0 ? 'Keine Überfälligkeit'
                      : summary.overdueCount === 1 ? '1 Rechnung' : `${summary.overdueCount} Rechnungen`
                  }
                  tone={summary.overdue > 0 ? 'danger' : 'neutral'}
                />
                <SummaryTile
                  label="Bereits beglichen"
                  value={formatCentsCurrencyDe(summary.paid, summary.currency)}
                  hint={
                    summary.settledCount === 1 ? '1 Rechnung' : `${summary.settledCount} Rechnungen`
                  }
                  tone="neutral"
                />
              </div>
            </section>

            <InvoiceGroup
              title="Überfällig"
              description="Diese Rechnungen sind über das Fälligkeitsdatum hinaus offen."
              invoices={groups.overdue}
              projectTitles={projectTitles}
              tone="danger"
            />
            <InvoiceGroup
              title="Offen"
              description="Ausgestellt und noch nicht vollständig ausgeglichen."
              invoices={groups.open}
              projectTitles={projectTitles}
              tone="attention"
            />
            <InvoiceGroup
              title="Beglichen"
              description="Vollständig bezahlte Rechnungen — dauerhaft abrufbar."
              invoices={groups.settled}
              projectTitles={projectTitles}
            />

            {groups.overdue.length === 0 && groups.open.length === 0 ? (
              <div className="rounded-card border border-emerald-200 bg-emerald-50/60 px-5 py-4">
                <p className="text-[13.5px] font-semibold text-emerald-800">Alle Rechnungen sind ausgeglichen.</p>
                <p className="mt-1 text-[12.5px] leading-5 text-emerald-700">
                  Zurzeit ist kein Betrag offen. Vielen Dank für die pünktliche Zahlung.
                </p>
              </div>
            ) : null}

            <p className="border-t border-hairline pt-5 text-[11.5px] leading-5 text-gray-400">
              Zahlungen erfolgen weiterhin per Überweisung gemäß den Angaben auf der jeweiligen
              Rechnung. Eine Online-Zahlungsfunktion ist in dieser Version bewusst nicht enthalten.
              Maßgeblich sind immer die Beträge auf dem Rechnungs-PDF.
            </p>
          </div>
        )
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------- pieces */

const summaryToneClasses = {
  neutral: 'border-hairline bg-white',
  success: 'border-emerald-200 bg-emerald-50/60',
  attention: 'border-amber-200 bg-amber-50/60',
  danger: 'border-red-200 bg-red-50/60',
} as const;

function SummaryTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: keyof typeof summaryToneClasses;
}) {
  return (
    <div className={cn('rounded-card border px-5 py-4 shadow-card', summaryToneClasses[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      {/* tabular-nums + tight tracking: three amounts of different length still line up
          as a row of figures rather than three unrelated headlines. */}
      <p className="mt-1.5 text-[22px] font-semibold leading-none tabular-nums tracking-[-0.02em] text-gray-950">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] text-gray-500">{hint}</p>
    </div>
  );
}

const groupDotClasses = {
  danger: 'bg-red-500',
  attention: 'bg-amber-500',
  neutral: 'bg-gray-300',
} as const;

function InvoiceGroup({
  title,
  description,
  invoices,
  projectTitles,
  tone = 'neutral',
}: {
  title: string;
  description: string;
  invoices: CustomerInvoice[];
  projectTitles: Map<string, string>;
  tone?: keyof typeof groupDotClasses;
}) {
  // A group with no invoice is not rendered at all — an empty "Überfällig" heading is
  // noise that makes an ordinary account look like it has a problem.
  if (!invoices.length) return null;

  return (
    <section aria-labelledby={`invoice-group-${tone}-${invoices.length}`}>
      <div className="mb-4">
        <h2
          id={`invoice-group-${tone}-${invoices.length}`}
          className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] text-gray-950"
        >
          <span className={cn('h-2 w-2 rounded-full', groupDotClasses[tone])} aria-hidden="true" />
          {title}
          <span className="text-[13px] font-medium tabular-nums text-gray-400">({invoices.length})</span>
        </h2>
        <p className="mt-1.5 text-[12.5px] text-gray-500">{description}</p>
      </div>
      <div className="space-y-2.5">
        {invoices.map((invoice) => (
          <InvoiceRow
            key={invoice.invoice_id}
            invoice={invoice}
            projectTitle={invoice.project_id ? projectTitles.get(invoice.project_id) ?? null : null}
          />
        ))}
      </div>
    </section>
  );
}

export default BillingPage;
