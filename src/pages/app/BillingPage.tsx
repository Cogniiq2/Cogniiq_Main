import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { InvoiceRow } from '@/components/app/CustomerPlatformPrimitives';
import { useCustomerInvoices } from '@/hooks/useCustomerWorkspace';
import { formatCentsCurrencyDe } from '@/lib/ownerFinance/exports/format';

// Customer billing view. Reads a narrow projection of the existing owner invoice
// records: only invoices that have actually been ISSUED to this organization, and
// only the fields a customer should see. No internal costs, margins, expenses,
// subscriptions or tax administration data are reachable from here. Payment
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

  const summary = useMemo(() => {
    const currency = invoices[0]?.currency ?? 'EUR';
    const outstanding = invoices.reduce((total, invoice) => total + invoice.outstanding_cents, 0);
    const openCount = invoices.filter((invoice) => invoice.outstanding_cents > 0).length;
    const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length;
    return { currency, outstanding, openCount, overdueCount };
  }, [invoices]);

  const openInvoices = invoices.filter((invoice) => invoice.outstanding_cents > 0);
  const settledInvoices = invoices.filter((invoice) => invoice.outstanding_cents <= 0);

  return (
    <>
      <AppPageHeader
        eyebrow="Konto"
        title="Abrechnung"
        description="Ihre Rechnungen von Cogniiq mit Status, Fälligkeit und PDF-Download."
        meta={
          status === 'ready' && invoices.length ? (
            <div className="flex flex-wrap gap-2">
              <AppStatusBadge
                label={
                  summary.outstanding > 0
                    ? `Offen: ${formatCentsCurrencyDe(summary.outstanding, summary.currency)}`
                    : 'Keine offenen Beträge'
                }
                tone={summary.outstanding > 0 ? 'attention' : 'success'}
              />
              {summary.overdueCount > 0 ? (
                <AppStatusBadge
                  label={summary.overdueCount === 1 ? '1 überfällig' : `${summary.overdueCount} überfällig`}
                  tone="danger"
                />
              ) : null}
            </div>
          ) : undefined
        }
      />

      {status === 'loading' ? <AppSkeleton label="Rechnungen werden geladen" /> : null}

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
          <div className="space-y-8">
            {openInvoices.length ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-950">Offene Rechnungen</h2>
                <div className="space-y-3">
                  {openInvoices.map((invoice) => (
                    <InvoiceRow key={invoice.invoice_id} invoice={invoice} />
                  ))}
                </div>
              </section>
            ) : (
              <AppCard>
                <p className="text-[13px] leading-6 text-emerald-700">
                  Alle Rechnungen sind ausgeglichen. Vielen Dank für die pünktliche Zahlung.
                </p>
              </AppCard>
            )}

            {settledInvoices.length ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-950">Abgeschlossene Rechnungen</h2>
                <div className="space-y-3">
                  {settledInvoices.map((invoice) => (
                    <InvoiceRow key={invoice.invoice_id} invoice={invoice} />
                  ))}
                </div>
              </section>
            ) : null}

            <p className="text-[12px] leading-5 text-gray-400">
              Zahlungen erfolgen weiterhin per Überweisung gemäß den Angaben auf der jeweiligen Rechnung.
              Eine Online-Zahlungsfunktion ist in dieser Version bewusst nicht enthalten.
            </p>
          </div>
        )
      ) : null}
    </>
  );
}

export default BillingPage;
