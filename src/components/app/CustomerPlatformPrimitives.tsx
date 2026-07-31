import { Download, FileText } from 'lucide-react';
import { useState } from 'react';

import { AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import { requestCustomerDocumentUrl } from '@/lib/customerPlatform/customerApi';
import {
  customerDocumentCategoryLabels,
  customerInvoiceStatusLabels,
  customerProjectStatusLabels,
  customerProjectStatusTones,
  type CustomerDocument,
  type CustomerInvoice,
  type CustomerProjectStatus,
} from '@/lib/customerPlatform/types';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports/format';

export function ProjectStatusBadge({ status }: { status: CustomerProjectStatus }) {
  return (
    <AppStatusBadge
      label={customerProjectStatusLabels[status]}
      tone={customerProjectStatusTones[status]}
    />
  );
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const label = customerInvoiceStatusLabels[status] ?? status;
  const tone = status === 'paid'
    ? 'success'
    : status === 'overdue'
      ? 'danger'
      : status === 'partially_paid'
        ? 'attention'
        : 'neutral';
  return <AppStatusBadge label={label} tone={tone} />;
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Download control for a customer document.
 *
 * The browser holds only a document id. The signed URL is requested at click time
 * and opened immediately; it is never rendered into the DOM, kept in component
 * state after use, or logged — it is a short-lived credential, not a link.
 */
export function DocumentDownloadButton({
  documentId,
  label = 'Öffnen',
  compact = false,
}: {
  documentId: string;
  label?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    const { data: url, error: linkError } = await requestCustomerDocumentUrl(documentId);
    setBusy(false);
    if (linkError || !url) {
      setError('Der Download konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        className={
          compact
            // min-h-8: "Öffnen" is the primary action of a document row, so it
            // must stay comfortably tappable on a phone. Measured at 26px before
            // this, which is below a usable touch target at 375px.
            ? 'inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'
            : 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2'
        }
      >
        <Download size={compact ? 13 : 14} aria-hidden="true" />
        {busy ? 'Wird vorbereitet …' : label}
      </button>
      {error ? <span className="text-[11.5px] leading-4 text-red-600">{error}</span> : null}
    </span>
  );
}

export function DocumentRow({ document }: { document: CustomerDocument }) {
  const size = formatFileSize(document.size_bytes);
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
          <FileText size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-950">{document.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-gray-500">
            {customerDocumentCategoryLabels[document.category]}
            {document.version > 1 ? ` · Version ${document.version}` : ''}
            {` · ${formatDateDe(document.uploaded_at)}`}
            {size ? ` · ${size}` : ''}
          </p>
        </div>
      </div>
      <DocumentDownloadButton documentId={document.id} compact />
    </div>
  );
}

export function InvoiceRow({ invoice }: { invoice: CustomerInvoice }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-950">
              {invoice.invoice_number ?? 'Ohne Nummer'}
            </p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-[12px] text-gray-500">
            {invoice.issue_date ? `Ausgestellt am ${formatDateDe(invoice.issue_date)}` : 'Ohne Rechnungsdatum'}
            {invoice.due_date ? ` · Fällig am ${formatDateDe(invoice.due_date)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular-nums text-sm font-semibold text-gray-950">
            {formatCentsCurrencyDe(invoice.gross_total_cents, invoice.currency)}
          </p>
          {invoice.outstanding_cents > 0 ? (
            <p className="mt-0.5 tabular-nums text-[12px] text-gray-500">
              Offen: {formatCentsCurrencyDe(invoice.outstanding_cents, invoice.currency)}
            </p>
          ) : (
            <p className="mt-0.5 text-[12px] text-emerald-700">Vollständig bezahlt</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 text-[12px] text-gray-500">
        <span className="tabular-nums">
          Netto {formatCentsCurrencyDe(invoice.net_total_cents, invoice.currency)}
        </span>
        <span className="tabular-nums">
          USt {formatCentsCurrencyDe(invoice.vat_total_cents, invoice.currency)}
        </span>
        {invoice.pdf_document_id ? (
          <DocumentDownloadButton documentId={invoice.pdf_document_id} label="Rechnung als PDF" compact />
        ) : (
          <span className="text-gray-400">PDF noch nicht bereitgestellt</span>
        )}
      </div>
    </div>
  );
}
