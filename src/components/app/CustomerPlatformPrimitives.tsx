import { Check, Circle, Download, FileText, Loader2, MinusCircle, Receipt, Flag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { AppStatusBadge, appFocusRing } from '@/components/app/CustomerAppPrimitives';
import { requestCustomerDocumentUrl } from '@/lib/customerPlatform/customerApi';
import type { CustomerActivityEntry, CustomerActivityKind } from '@/lib/customerPlatform/customerActivity';
import { fileTypeLabel, formatFileSizeDe } from '@/lib/customerPlatform/customerPortalModel';
import {
  customerDocumentCategoryLabels,
  customerInvoiceStatusLabels,
  customerMilestoneStatusLabels,
  customerProjectStatusLabels,
  customerProjectStatusTones,
  type CustomerDocument,
  type CustomerInvoice,
  type CustomerMilestone,
  type CustomerProjectStatus,
} from '@/lib/customerPlatform/types';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports/format';
import { cn } from '@/lib/utils';

export function ProjectStatusBadge({ status }: { status: CustomerProjectStatus }) {
  return (
    <AppStatusBadge
      label={customerProjectStatusLabels[status]}
      tone={customerProjectStatusTones[status]}
    />
  );
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  // Falls back to an em dash, never to the raw token: a customer must not read
  // `partially_paid` off their own invoice list.
  const label = customerInvoiceStatusLabels[status] ?? '—';
  const tone = status === 'paid'
    ? 'success'
    : status === 'overdue'
      ? 'danger'
      : status === 'partially_paid'
        ? 'attention'
        : 'neutral';
  return <AppStatusBadge label={label} tone={tone} />;
}

/**
 * Download control for a customer document.
 *
 * The browser holds only a document id. The signed URL is requested at click time
 * and opened immediately; it is never rendered into the DOM, kept in component
 * state after use, or logged — it is a short-lived credential, not a link.
 *
 * The only change here is feedback: the control now reports "preparing", a brief
 * success tick and a retryable failure, so a slow signed-URL round trip does not read
 * as a dead button.
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
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneTimer = useRef<number | null>(null);

  useEffect(() => () => { if (doneTimer.current) window.clearTimeout(doneTimer.current); }, []);

  const open = async () => {
    setBusy(true);
    setError(null);
    setDone(false);
    const { data: url, error: linkError } = await requestCustomerDocumentUrl(documentId);
    setBusy(false);
    if (linkError || !url) {
      setError('Der Download konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    setDone(true);
    doneTimer.current = window.setTimeout(() => setDone(false), 2200);
  };

  const Icon = busy ? Loader2 : done ? Check : Download;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold transition-colors duration-fast ease-premium disabled:opacity-60',
          appFocusRing,
          compact
            // min-h-9: "Öffnen" is the primary action of a document row, so it must stay
            // comfortably tappable on a phone.
            ? 'min-h-9 rounded-control px-2.5 text-[12px] text-gray-600 hover:bg-gray-100 hover:text-gray-950'
            : 'min-h-11 rounded-control border border-gray-200 bg-white px-4 text-[13px] text-gray-700 hover:border-gray-300 hover:text-gray-950',
          done && 'text-emerald-700',
        )}
      >
        <Icon
          size={compact ? 13 : 14}
          className={busy ? 'animate-spin motion-reduce:animate-none' : undefined}
          aria-hidden="true"
        />
        {busy ? 'Wird vorbereitet …' : done ? 'Geöffnet' : label}
      </button>
      {error ? <span className="text-[11.5px] leading-4 text-red-600">{error}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ documents */

export function DocumentRow({
  document,
  projectTitle,
  isNew = false,
}: {
  document: CustomerDocument;
  /** Resolved from data already loaded on the page; omitted when unknown. */
  projectTitle?: string | null;
  isNew?: boolean;
}) {
  const size = formatFileSizeDe(document.size_bytes);
  const type = fileTypeLabel(document.content_type);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-hairline bg-white px-4 py-3.5 transition-[border-color] duration-base ease-premium hover:border-gray-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-hairline bg-gray-50 text-[9px] font-bold text-gray-500">
          {type ?? <FileText size={15} aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-[13.5px] font-semibold leading-snug text-gray-950">
              {document.title}
            </p>
            {isNew ? (
              <span className="shrink-0 rounded-md bg-gray-950 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-white">
                Neu
              </span>
            ) : null}
          </div>
          {/* Metadata as separate spans rather than one long "·"-joined string: it wraps
              instead of overflowing at 390px. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-gray-500">
            <span>{customerDocumentCategoryLabels[document.category] ?? '—'}</span>
            {projectTitle ? <><Dot />{projectTitle}</> : null}
            <Dot />
            <span className="tabular-nums">{formatDateDe(document.uploaded_at)}</span>
            {document.version > 1 ? <><Dot /><span>Version {document.version}</span></> : null}
            {size ? <><Dot /><span className="tabular-nums">{size}</span></> : null}
          </div>
        </div>
      </div>
      <div className="shrink-0 sm:pl-3">
        <DocumentDownloadButton documentId={document.id} compact />
      </div>
    </div>
  );
}

function Dot() {
  return <span aria-hidden="true" className="text-gray-300">·</span>;
}

/* ------------------------------------------------------------------- invoices */

export function InvoiceRow({
  invoice,
  projectTitle,
}: {
  invoice: CustomerInvoice;
  projectTitle?: string | null;
}) {
  const open = invoice.outstanding_cents > 0;
  return (
    <div className="rounded-card border border-hairline bg-white px-4 py-4 transition-[border-color] duration-base ease-premium hover:border-gray-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-semibold tabular-nums text-gray-950">
              {invoice.invoice_number ?? 'Ohne Nummer'}
            </p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-gray-500">
            {projectTitle ? <><span>{projectTitle}</span><Dot /></> : null}
            <span className="tabular-nums">
              {invoice.issue_date ? `Ausgestellt ${formatDateDe(invoice.issue_date)}` : 'Ohne Rechnungsdatum'}
            </span>
            {invoice.due_date ? (
              <><Dot /><span className="tabular-nums">Fällig {formatDateDe(invoice.due_date)}</span></>
            ) : null}
          </div>
        </div>
        {/* Right-aligned, tabular, one decimal rhythm: invoice amounts should scan as a
            column even when the rows around them differ in height. */}
        <div className="shrink-0 text-right">
          <p className="text-[15px] font-semibold tabular-nums tracking-tight text-gray-950">
            {formatCentsCurrencyDe(invoice.gross_total_cents, invoice.currency)}
          </p>
          {open ? (
            <p className="mt-0.5 text-[11.5px] font-medium tabular-nums text-amber-700">
              Offen: {formatCentsCurrencyDe(invoice.outstanding_cents, invoice.currency)}
            </p>
          ) : (
            <p className="mt-0.5 text-[11.5px] text-emerald-700">Vollständig bezahlt</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-3 text-[11.5px] text-gray-500">
        <span className="tabular-nums">Netto {formatCentsCurrencyDe(invoice.net_total_cents, invoice.currency)}</span>
        <span className="tabular-nums">USt {formatCentsCurrencyDe(invoice.vat_total_cents, invoice.currency)}</span>
        <span className="ml-auto">
          {invoice.pdf_document_id ? (
            <DocumentDownloadButton documentId={invoice.pdf_document_id} label="Rechnung als PDF" compact />
          ) : (
            <span className="text-gray-400">PDF noch nicht bereitgestellt</span>
          )}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ milestones */

type MilestoneVisualState = 'completed' | 'active' | 'upcoming' | 'cancelled';

function milestoneVisualState(milestone: CustomerMilestone): MilestoneVisualState {
  if (milestone.status === 'completed') return 'completed';
  if (milestone.status === 'cancelled') return 'cancelled';
  if (milestone.status === 'in_progress' || milestone.status === 'delayed') return 'active';
  return 'upcoming';
}

const milestoneNodeClasses: Record<MilestoneVisualState, string> = {
  completed: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  active: 'border-gray-950 bg-gray-950 text-white',
  upcoming: 'border-gray-200 bg-white text-gray-300',
  cancelled: 'border-gray-200 bg-gray-50 text-gray-300',
};

/**
 * The project timeline.
 *
 * A single vertical rail at every viewport: a horizontal variant was tried and it either
 * clipped long German milestone titles or introduced a horizontal scroller, which the
 * portal must never have. Depth comes from the connector and the node treatment instead.
 *
 * Accessibility: the visual rail is decorative (`aria-hidden`), and each item carries a
 * text state ("Abgeschlossen", "In Arbeit", …) so the list reads correctly without it.
 * Entrance motion is a single short fade per item with no stagger, so reading is never
 * delayed, and it collapses entirely under prefers-reduced-motion.
 */
export function MilestoneTimeline({ milestones }: { milestones: CustomerMilestone[] }) {
  const reduceMotion = useReducedMotion();
  const ordered = [...milestones].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <ol className="relative space-y-0">
      {ordered.map((milestone, index) => {
        const state = milestoneVisualState(milestone);
        const last = index === ordered.length - 1;
        return (
          <motion.li
            key={milestone.id}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-4 pb-5 last:pb-0"
          >
            {/* connector */}
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[13px] top-7 bottom-0 w-px',
                  state === 'completed' ? 'bg-emerald-200' : 'bg-hairline',
                )}
              />
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                milestoneNodeClasses[state],
              )}
            >
              {state === 'completed' ? <Check size={13} />
                : state === 'cancelled' ? <MinusCircle size={12} />
                  : state === 'active' ? <Flag size={12} />
                    : <Circle size={7} className="fill-current" />}
            </span>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p
                  className={cn(
                    'min-w-0 break-words text-[13.5px] font-semibold leading-snug',
                    state === 'upcoming' || state === 'cancelled' ? 'text-gray-500' : 'text-gray-950',
                  )}
                >
                  {milestone.title}
                </p>
                <AppStatusBadge
                  label={customerMilestoneStatusLabels[milestone.status] ?? '—'}
                  tone={
                    milestone.status === 'completed' ? 'success'
                      : milestone.status === 'delayed' ? 'attention'
                        : milestone.status === 'in_progress' ? 'working'
                          : 'neutral'
                  }
                />
              </div>
              {milestone.description ? (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-600">{milestone.description}</p>
              ) : null}
              <p className="mt-1.5 text-[11.5px] tabular-nums text-gray-400">
                {milestone.completed_at
                  ? `Abgeschlossen am ${formatDateDe(milestone.completed_at)}`
                  : milestone.target_date
                    ? `Geplant für ${formatDateDe(milestone.target_date)}`
                    : 'Ohne festen Termin'}
              </p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------- activity */

const activityIcon: Record<CustomerActivityKind, typeof FileText> = {
  milestone_completed: Flag,
  document_published: FileText,
  invoice_issued: Receipt,
  project_updated: Circle,
};

/**
 * Recent customer-safe updates.
 *
 * Deliberately NOT titled or described as an audit log — see
 * `src/lib/customerPlatform/customerActivity.ts` for what each entry is derived from.
 */
export function CustomerActivityList({ entries }: { entries: CustomerActivityEntry[] }) {
  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-white">
      {entries.map((entry) => {
        const Icon = activityIcon[entry.kind];
        const body = (
          <>
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-gray-50 text-gray-400">
              <Icon size={13} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-[13px] font-medium leading-snug text-gray-950">
                {entry.title}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-gray-500">
                <span className="tabular-nums">{formatDateDe(entry.timestamp)}</span>
                {entry.detail ? <><Dot />{entry.detail}</> : null}
              </span>
            </span>
          </>
        );
        return (
          <li key={entry.id}>
            {entry.href ? (
              <Link
                to={entry.href}
                className={cn(
                  'flex min-h-11 items-start gap-3 px-4 py-3 transition-colors duration-fast ease-premium hover:bg-gray-50/70',
                  appFocusRing,
                )}
              >
                {body}
              </Link>
            ) : (
              <div className="flex min-h-11 items-start gap-3 px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
