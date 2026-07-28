import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CreditCard,
  FileText,
  Flag,
  Mail,
  UserRound,
} from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppProgress,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import {
  DocumentRow,
  InvoiceRow,
  ProjectStatusBadge,
} from '@/components/app/CustomerPlatformPrimitives';
import {
  useCustomerDocuments,
  useCustomerInvoices,
  useCustomerMilestones,
  useCustomerProject,
} from '@/hooks/useCustomerWorkspace';
import {
  customerMilestoneStatusLabels,
  type CustomerMilestone,
  type CustomerProject,
} from '@/lib/customerPlatform/types';
import { formatDateDe } from '@/lib/ownerFinance/exports/format';
import { cn } from '@/lib/utils';

// Customer project detail. Answers, in order: what is being delivered, which phase,
// is it on track, what happens next, who needs to act, which milestone is next, where
// the documents are, and which invoices are open.

type ProjectTab = 'overview' | 'milestones' | 'documents' | 'billing';

const TABS: { id: ProjectTab; label: string }[] = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'milestones', label: 'Meilensteine' },
  { id: 'documents', label: 'Dokumente' },
  { id: 'billing', label: 'Abrechnung' },
];

export function ProjectDetailPage() {
  return (
    <CustomerAppShell>
      <ProjectDetailContent />
    </CustomerAppShell>
  );
}

function ProjectDetailContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tab, setTab] = useState<ProjectTab>('overview');
  const { project, status, error, reload } = useCustomerProject(projectId);

  if (status === 'loading') {
    return <AppSkeleton label="Projekt wird geladen" />;
  }
  if (status === 'error') {
    return (
      <AppErrorState
        message={error ?? 'Das Projekt konnte nicht geladen werden.'}
        onRetry={() => void reload()}
      />
    );
  }

  // A project belonging to another organization, an archived project and a
  // nonexistent id are indistinguishable by design — the server returns nothing for
  // all three, and this page must not try to tell them apart either.
  if (!project) {
    return (
      <AppEmptyState
        icon={FileText}
        title="Projekt nicht verfügbar"
        description="Dieses Projekt existiert nicht oder ist für Ihr Konto nicht freigegeben. Bitte kehren Sie zur Übersicht zurück."
        action={
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Zur Übersicht
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-gray-500 transition-colors hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Übersicht
        </Link>
      </div>

      <AppPageHeader
        eyebrow={project.phase}
        title={project.title}
        description={project.business_objective}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {project.target_date ? (
              <AppStatusBadge label={`Zieltermin ${formatDateDe(project.target_date)}`} tone="neutral" />
            ) : null}
          </div>
        }
      />

      <div className="mb-8 flex flex-wrap gap-1 border-b border-gray-100" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              'relative -mb-px min-h-11 rounded-t-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400',
              tab === entry.id
                ? 'border-b-2 border-gray-950 text-gray-950'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-950',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? <OverviewTab project={project} /> : null}
      {tab === 'milestones' ? <MilestonesTab projectId={project.id} /> : null}
      {tab === 'documents' ? <DocumentsTab projectId={project.id} /> : null}
      {tab === 'billing' ? <BillingTab projectId={project.id} /> : null}
    </>
  );
}

// ---------------------------------------------------------------- Übersicht
function OverviewTab({ project }: { project: CustomerProject }) {
  const { milestones } = useCustomerMilestones(project.id);
  const nextMilestone = milestones.find(
    (milestone) => milestone.status === 'in_progress' || milestone.status === 'upcoming',
  );

  return (
    <div className="space-y-6">
      <AppCard>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Fortschritt</p>
        <AppProgress value={project.progress_percent} label={`${project.progress_percent}% abgeschlossen`} />
        <dl className="mt-6 grid gap-5 border-t border-gray-100 pt-5 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-gray-400">Phase</dt>
            <dd className="mt-1 font-semibold text-gray-900">{project.phase}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Start</dt>
            <dd className="mt-1 font-semibold text-gray-900">
              {project.start_date ? formatDateDe(project.start_date) : 'Noch nicht festgelegt'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Zieltermin</dt>
            <dd className="mt-1 font-semibold text-gray-900">
              {project.target_date ? formatDateDe(project.target_date) : 'Noch nicht festgelegt'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Nächster Meilenstein</dt>
            <dd className="mt-1 font-semibold text-gray-900">
              {nextMilestone ? nextMilestone.title : 'Kein offener Meilenstein'}
            </dd>
          </div>
        </dl>
      </AppCard>

      {/* Who needs to act — stated explicitly rather than left to inference. */}
      {project.next_action_summary ? (
        <div
          className={cn(
            'rounded-3xl border p-6',
            project.next_action_owner === 'customer'
              ? 'border-amber-200 bg-amber-50/70'
              : 'border-gray-100 bg-white',
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl',
                project.next_action_owner === 'customer'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600',
              )}
            >
              <CalendarClock size={16} aria-hidden="true" />
            </span>
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.2em]',
                project.next_action_owner === 'customer' ? 'text-amber-700' : 'text-gray-400',
              )}
            >
              {project.next_action_owner === 'customer' ? 'Ihre nächste Aktion' : 'Nächster Schritt bei Cogniiq'}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-950">{project.next_action_summary}</p>
          {project.next_action_due_date ? (
            <p className="mt-1.5 text-[12.5px] text-gray-600">
              Fällig am {formatDateDe(project.next_action_due_date)}
            </p>
          ) : null}
        </div>
      ) : null}

      {project.customer_safe_blocker_summary ? (
        <AppCard className="border-red-200 bg-red-50/60">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">Aktuelle Blockade</p>
          <p className="text-[13px] leading-6 text-red-800">{project.customer_safe_blocker_summary}</p>
        </AppCard>
      ) : null}

      {project.contact_display_name ? (
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Ihr Ansprechpartner</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-600">
                <UserRound size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-950">{project.contact_display_name}</p>
                {project.contact_role_label ? (
                  <p className="mt-0.5 text-[12.5px] text-gray-500">{project.contact_role_label}</p>
                ) : null}
              </div>
            </div>
            {project.contact_business_email ? (
              <a
                href={`mailto:${project.contact_business_email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                <Mail size={14} aria-hidden="true" />
                Nachricht schreiben
              </a>
            ) : null}
          </div>
        </AppCard>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Meilensteine
function MilestonesTab({ projectId }: { projectId: string }) {
  const { milestones, status, error, reload } = useCustomerMilestones(projectId);

  if (status === 'loading') return <AppSkeleton label="Meilensteine werden geladen" />;
  if (status === 'error') {
    return <AppErrorState message={error ?? 'Meilensteine konnten nicht geladen werden.'} onRetry={() => void reload()} />;
  }
  if (!milestones.length) {
    return (
      <AppEmptyState
        icon={Flag}
        title="Noch keine Meilensteine"
        description="Sobald Cogniiq Meilensteine für dieses Projekt festlegt, sehen Sie hier den geplanten Ablauf und den jeweiligen Stand."
      />
    );
  }

  return (
    <ol className="space-y-3">
      {milestones.map((milestone) => (
        <MilestoneRow key={milestone.id} milestone={milestone} />
      ))}
    </ol>
  );
}

function MilestoneRow({ milestone }: { milestone: CustomerMilestone }) {
  const done = milestone.status === 'completed';
  const tone =
    milestone.status === 'completed'
      ? 'success'
      : milestone.status === 'delayed'
        ? 'attention'
        : milestone.status === 'cancelled'
          ? 'neutral'
          : milestone.status === 'in_progress'
            ? 'working'
            : 'neutral';

  return (
    <li className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <span
        className={cn(
          'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border',
          done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-400',
        )}
      >
        {done ? <Check size={14} aria-hidden="true" /> : <Flag size={13} aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn('text-sm font-semibold', done ? 'text-gray-500' : 'text-gray-950')}>{milestone.title}</p>
          <AppStatusBadge label={customerMilestoneStatusLabels[milestone.status]} tone={tone} />
        </div>
        {milestone.description ? (
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{milestone.description}</p>
        ) : null}
        <p className="mt-2 text-[12px] text-gray-400">
          {milestone.completed_at
            ? `Abgeschlossen am ${formatDateDe(milestone.completed_at)}`
            : milestone.target_date
              ? `Geplant für ${formatDateDe(milestone.target_date)}`
              : 'Ohne festen Termin'}
        </p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- Dokumente
function DocumentsTab({ projectId }: { projectId: string }) {
  const { documents, status, error, reload } = useCustomerDocuments(projectId);

  if (status === 'loading') return <AppSkeleton label="Dokumente werden geladen" />;
  if (status === 'error') {
    return <AppErrorState message={error ?? 'Dokumente konnten nicht geladen werden.'} onRetry={() => void reload()} />;
  }
  if (!documents.length) {
    return (
      <AppEmptyState
        icon={FileText}
        title="Noch keine Dokumente"
        description="Sobald Cogniiq Unterlagen für dieses Projekt bereitstellt, können Sie sie hier öffnen und herunterladen."
      />
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentRow key={doc.id} document={doc} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Abrechnung
function BillingTab({ projectId }: { projectId: string }) {
  const { invoices, status, error, reload } = useCustomerInvoices(projectId);

  if (status === 'loading') return <AppSkeleton label="Rechnungen werden geladen" />;
  if (status === 'error') {
    return <AppErrorState message={error ?? 'Rechnungen konnten nicht geladen werden.'} onRetry={() => void reload()} />;
  }
  if (!invoices.length) {
    return (
      <AppEmptyState
        icon={CreditCard}
        title="Noch keine Rechnungen"
        description="Für dieses Projekt wurde noch keine Rechnung gestellt. Sobald eine Rechnung ausgestellt ist, erscheint sie hier."
      />
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceRow key={invoice.invoice_id} invoice={invoice} />
      ))}
    </div>
  );
}

export default ProjectDetailPage;
