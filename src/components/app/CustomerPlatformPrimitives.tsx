import { Download, FileText } from 'lucide-react';
import { useState } from 'react';

import { AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import { border, control, focusRing, interactive, radius, surface, text as dashText } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';
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
        aria-busy={busy || undefined}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium disabled:opacity-50',
          radius.md, interactive.transition, focusRing,
          compact
            // min-h-8: "Öffnen" is the primary action of a document row, so it
            // must stay comfortably tappable on a phone. Measured at 26px before
            // this, which is below a usable touch target at 375px.
            ? 'min-h-8 px-2.5 py-1 text-[12px] text-[var(--cq-fg-muted)] hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]'
            : cn(control.lg, border.hairline, 'bg-[var(--cq-surface)] text-[13px] text-[var(--cq-fg)] hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]')
        )}
      >
        <Download size={compact ? 13 : 14} aria-hidden="true" />
        {busy ? 'Wird vorbereitet …' : label}
      </button>
      {error ? <span className="text-[11.5px] leading-4 text-red-600" role="alert">{error}</span> : null}
    </span>
  );
}

export function DocumentRow({ document }: { document: CustomerDocument }) {
  const size = formatFileSize(document.size_bytes);
  return (
    <div className={cn('flex items-center justify-between gap-4 px-4 py-3', surface.card)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[var(--cq-sunken)] text-[var(--cq-fg-subtle)]', radius.md)}>
          <FileText size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={cn('truncate', dashText.bodyStrong)}>{document.title}</p>
          <p className={cn('mt-0.5 truncate', dashText.hint)}>
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
    <div className={cn('px-4 py-3.5', surface.card)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={dashText.bodyStrong}>
              {invoice.invoice_number ?? 'Ohne Nummer'}
            </p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className={cn('mt-1', dashText.hint)}>
            {invoice.issue_date ? `Ausgestellt am ${formatDateDe(invoice.issue_date)}` : 'Ohne Rechnungsdatum'}
            {invoice.due_date ? ` · Fällig am ${formatDateDe(invoice.due_date)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className={cn('tabular-nums', dashText.bodyStrong)}>
            {formatCentsCurrencyDe(invoice.gross_total_cents, invoice.currency)}
          </p>
          {invoice.outstanding_cents > 0 ? (
            <p className={cn('mt-0.5 tabular-nums', dashText.hint)}>
              Offen: {formatCentsCurrencyDe(invoice.outstanding_cents, invoice.currency)}
            </p>
          ) : (
            <p className="mt-0.5 text-[11.5px] leading-4 text-emerald-700">Vollständig bezahlt</p>
          )}
        </div>
      </div>
      <div className={cn('mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 pt-3', border.hairlineT, dashText.hint)}>
        <span className="tabular-nums">
          Netto {formatCentsCurrencyDe(invoice.net_total_cents, invoice.currency)}
        </span>
        <span className="tabular-nums">
          USt {formatCentsCurrencyDe(invoice.vat_total_cents, invoice.currency)}
        </span>
        {invoice.pdf_document_id ? (
          <DocumentDownloadButton documentId={invoice.pdf_document_id} label="Rechnung als PDF" compact />
        ) : (
          <span>PDF noch nicht bereitgestellt</span>
        )}
      </div>
    </div>
  );
}
