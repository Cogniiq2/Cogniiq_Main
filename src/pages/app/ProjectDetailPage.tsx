import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarClock,
  CircleDot,
  CreditCard,
  FileText,
  Flag,
  Mail,
  UserRound,
} from 'lucide-react';

import {
  appFocusRing,
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppSkeleton,
} from '@/components/app/CustomerAppPrimitives';
import {
  DocumentRow,
  InvoiceRow,
  MilestoneTimeline,
  ProjectStatusBadge,
} from '@/components/app/CustomerPlatformPrimitives';
import {
  useCustomerDocuments,
  useCustomerInvoices,
  useCustomerMilestones,
  useCustomerProject,
} from '@/hooks/useCustomerWorkspace';
import { isRecentlyPublished } from '@/lib/customerPlatform/customerActivity';
import {
  customerProjectTabHashes,
  tabFromHash,
  type CustomerProjectTab,
} from '@/lib/customerPlatform/customerPortalModel';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports/format';
import { useMotionPresets } from '@/lib/motion';
import type { CustomerMilestone, CustomerProject } from '@/lib/customerPlatform/types';
import { cn } from '@/lib/utils';

// The customer's project command view.
//
// One page answers everything about one project: what is being delivered, which phase,
// whether it is on track, who must act next, which milestone is next, the full timeline,
// the documents and the invoices. The four sections are separated so the page stays
// readable, but they all belong to the SAME project — a customer never has to leave to
// understand it.
//
// Route behaviour and the not-found privacy protection are unchanged: a project that
// belongs to another organization, one that is archived and one that does not exist are
// indistinguishable, because the server returns nothing for all three.

type ProjectTab = CustomerProjectTab;

const TABS: { id: ProjectTab; label: string; hash: string }[] = [
  { id: 'overview', label: 'Übersicht', hash: customerProjectTabHashes.overview },
  { id: 'milestones', label: 'Meilensteine', hash: customerProjectTabHashes.milestones },
  { id: 'documents', label: 'Dokumente', hash: customerProjectTabHashes.documents },
  { id: 'billing', label: 'Abrechnung', hash: customerProjectTabHashes.billing },
];

// The premium shell is mounted once by CustomerPortalBoundary for the whole /app subtree,
// so this page renders content only. Wrapping it in its own shell here would remount the
// sidebar on every navigation and duplicate the portal-access bootstrap.
export function ProjectDetailPage() {
  return <ProjectDetailContent />;
}

function ProjectDetailContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const motionPresets = useMotionPresets();
  const [tab, setTab] = useState<ProjectTab>(() => tabFromHash(location.hash));
  const { project, status, error, reload } = useCustomerProject(projectId);

  // Keep the section and the URL in step, so a section can be linked to and the browser
  // back button moves between sections rather than off the project.
  useEffect(() => { setTab(tabFromHash(location.hash)); }, [location.hash]);

  const selectTab = (next: ProjectTab) => {
    setTab(next);
    const hash = TABS.find((entry) => entry.id === next)?.hash ?? '';
    navigate({ hash }, { replace: true });
  };

  if (status === 'loading') {
    return (
      <div className="space-y-5">
        <AppSkeleton label="Projekt wird geladen" />
        <AppSkeleton label="Projektdetails werden geladen" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <AppErrorState
        message={error ?? 'Das Projekt konnte nicht geladen werden.'}
        onRetry={() => void reload()}
      />
    );
  }

  if (!project) {
    return (
      <AppEmptyState
        icon={FileText}
        title="Projekt nicht verfügbar"
        description="Dieses Projekt existiert nicht oder ist für Ihr Konto nicht freigegeben. Bitte kehren Sie zur Übersicht zurück."
        action={<AppButton to="/app" icon={ArrowLeft}>Zur Übersicht</AppButton>}
      />
    );
  }

  return (
    <>
      <div className="mb-5">
        <Link
          to="/app"
          className={cn(
            'inline-flex min-h-9 items-center gap-1.5 rounded-control text-[12.5px] font-semibold text-gray-500',
            'transition-colors duration-fast ease-premium hover:text-gray-950',
            appFocusRing,
          )}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Übersicht
        </Link>
      </div>

      <ProjectIdentityHeader project={project} />

      {/* Section switch. An animated underline rather than four boxed buttons: this is one
          project seen from four angles, not four destinations. */}
      <div className="mb-8 mt-8 overflow-x-auto border-b border-hairline">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Projektbereiche">
          {TABS.map((entry) => {
            const active = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(entry.id)}
                className={cn(
                  'relative min-h-11 whitespace-nowrap rounded-t-control px-3.5 text-[13.5px] font-semibold',
                  'transition-colors duration-fast ease-premium',
                  active ? 'text-gray-950' : 'text-gray-500 hover:text-gray-950',
                  appFocusRing,
                )}
              >
                {entry.label}
                {active ? (
                  <motion.span
                    layoutId="customer-project-tab"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gray-950"
                    transition={motionPresets.indicator}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'overview' ? <OverviewSection project={project} /> : null}
      {tab === 'milestones' ? <MilestonesSection projectId={project.id} /> : null}
      {tab === 'documents' ? <DocumentsSection projectId={project.id} projectTitle={project.title} /> : null}
      {tab === 'billing' ? <BillingSection projectId={project.id} projectTitle={project.title} /> : null}
    </>
  );
}

/* ------------------------------------------------------------------ identity header */

function ProjectIdentityHeader({ project }: { project: CustomerProject }) {
  const reduceMotion = useReducedMotion();
  const progress = Math.max(0, Math.min(100, project.progress_percent));

  return (
    <header className="rounded-panel border border-hairline bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{project.phase}</p>
          <h1 className="mt-2 hyphens-auto break-words text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-950 sm:text-[32px]">
            {project.title}
          </h1>
          {project.business_objective ? (
            <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.65] text-gray-600">
              {project.business_objective}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-gray-950">
              {progress}
            </span>
            <span className="text-[15px] font-semibold text-gray-400">%</span>
            <span className="ml-1 text-[13px] text-gray-500">abgeschlossen</span>
          </div>
          {project.target_date ? (
            <p className="text-right text-[12.5px] text-gray-500">
              Zieltermin
              <span className="ml-1.5 font-semibold tabular-nums text-gray-900">
                {formatDateDe(project.target_date)}
              </span>
            </p>
          ) : null}
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Projektfortschritt ${progress}%`}
        >
          <motion.div
            className={cn(
              'h-full w-full origin-left rounded-full',
              project.status === 'blocked' ? 'bg-red-500'
                : project.status === 'attention_needed' ? 'bg-amber-500'
                  : 'bg-gray-950',
            )}
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------- Übersicht */

function OverviewSection({ project }: { project: CustomerProject }) {
  const { milestones, status: milestonesStatus } = useCustomerMilestones(project.id);
  const nextMilestone = useMemo(
    () => [...milestones]
      .filter((m) => m.status === 'in_progress' || m.status === 'upcoming' || m.status === 'delayed')
      .sort((a, b) => a.sort_order - b.sort_order)[0] ?? null,
    [milestones],
  );
  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Who must act — stated, never left to inference. */}
      {project.next_action_summary ? (
        <NextActionPanel project={project} />
      ) : null}

      {project.customer_safe_blocker_summary ? (
        <div className="rounded-panel border border-red-200 bg-red-50/60 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">Aktuelle Blockade</p>
          <p className="mt-2 text-[13.5px] leading-6 text-red-800">{project.customer_safe_blocker_summary}</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <AppCard>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <Flag size={12} aria-hidden="true" />
            Nächster Meilenstein
          </p>
          {nextMilestone ? (
            <>
              <p className="mt-2.5 break-words text-[14px] font-semibold leading-snug text-gray-950">
                {nextMilestone.title}
              </p>
              {nextMilestone.description ? (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-600">{nextMilestone.description}</p>
              ) : null}
              <p className="mt-2 text-[12px] tabular-nums text-gray-500">
                {nextMilestone.target_date
                  ? `Geplant für ${formatDateDe(nextMilestone.target_date)}`
                  : 'Ohne festen Termin'}
              </p>
              {/* The milestone's place in the whole plan, not just its own date. */}
              {milestonesStatus === 'ready' ? (
                <p className="mt-3 border-t border-hairline pt-3 text-[11.5px] tabular-nums text-gray-500">
                  {completedCount} von {milestones.length} Meilensteinen abgeschlossen
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2.5 text-[13px] leading-6 text-gray-500">
              {milestonesStatus === 'ready'
                ? 'Kein offener Meilenstein.'
                : milestonesStatus === 'error'
                  ? 'Meilensteine konnten nicht geladen werden.'
                  : 'Wird geladen …'}
            </p>
          )}
        </AppCard>

        <AppCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Eckdaten</p>
          <dl className="mt-3.5 space-y-3 text-[13px]">
            <DataRow label="Phase" value={project.phase} />
            <DataRow
              label="Start"
              value={project.start_date ? formatDateDe(project.start_date) : 'Noch nicht festgelegt'}
            />
            <DataRow
              label="Zieltermin"
              value={project.target_date ? formatDateDe(project.target_date) : 'Noch nicht festgelegt'}
            />
            <DataRow label="Zuletzt aktualisiert" value={formatDateDe(project.updated_at)} />
          </dl>
        </AppCard>
      </div>

      {/* A preview of the plan, with the full timeline one click away. */}
      {milestones.length ? (
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Projektverlauf</p>
          <MilestoneTimeline milestones={milestones.slice(0, 4)} />
          {milestones.length > 4 ? (
            <p className="mt-4 border-t border-hairline pt-4 text-[12.5px] text-gray-500">
              {milestones.length - 4} weitere Meilensteine im Bereich „Meilensteine".
            </p>
          ) : null}
        </AppCard>
      ) : null}

      {project.contact_display_name ? (
        <AppCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Ihr Ansprechpartner</p>
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-hairline bg-gray-50 text-gray-500">
                <UserRound size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="break-words text-[14px] font-semibold text-gray-950">{project.contact_display_name}</p>
                {project.contact_role_label ? (
                  <p className="mt-0.5 text-[12.5px] text-gray-500">{project.contact_role_label}</p>
                ) : null}
              </div>
            </div>
            {project.contact_business_email ? (
              <a
                href={`mailto:${project.contact_business_email}`}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-control border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700',
                  'transition-colors duration-fast ease-premium hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
                  appFocusRing,
                )}
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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold tabular-nums text-gray-900">{value}</dd>
    </div>
  );
}

function NextActionPanel({ project }: { project: CustomerProject }) {
  const ownedByCustomer = project.next_action_owner === 'customer';
  const overdue = ownedByCustomer && project.next_action_due_date
    ? new Date(project.next_action_due_date).getTime() < Date.now()
    : false;

  return (
    <section
      className={cn(
        'rounded-panel border p-6',
        overdue ? 'border-red-200 bg-red-50/70'
          : ownedByCustomer ? 'border-amber-200 bg-amber-50/70'
            : 'border-hairline bg-white shadow-card',
      )}
    >
      <p
        className={cn(
          'flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]',
          overdue ? 'text-red-700' : ownedByCustomer ? 'text-amber-700' : 'text-gray-500',
        )}
      >
        {ownedByCustomer ? <CalendarClock size={13} aria-hidden="true" /> : <CircleDot size={13} aria-hidden="true" />}
        {ownedByCustomer ? 'Ihre nächste Aktion' : 'Cogniiq arbeitet aktuell an'}
      </p>
      <p className="mt-2.5 break-words text-[16px] font-semibold leading-snug tracking-[-0.01em] text-gray-950">
        {project.next_action_summary}
      </p>
      {project.next_action_due_date ? (
        <p
          className={cn(
            'mt-2 text-[12.5px] font-semibold tabular-nums',
            overdue ? 'text-red-700' : ownedByCustomer ? 'text-amber-800' : 'text-gray-600',
          )}
        >
          {overdue ? 'Überfällig seit ' : ownedByCustomer ? 'Fällig am ' : 'Geplant bis '}
          {formatDateDe(project.next_action_due_date)}
        </p>
      ) : null}
      <p className="mt-2.5 text-[12.5px] leading-5 text-gray-600">
        {ownedByCustomer
          ? 'Cogniiq wartet auf diese Rückmeldung von Ihnen, um weiterzuarbeiten.'
          : 'Dieser Schritt liegt bei Cogniiq. Sie müssen dafür nichts tun.'}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------- Meilensteine */

function MilestonesSection({ projectId }: { projectId: string }) {
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
    <div className="space-y-5">
      <MilestoneSummary milestones={milestones} />
      <AppCard>
        <MilestoneTimeline milestones={milestones} />
      </AppCard>
    </div>
  );
}

function MilestoneSummary({ milestones }: { milestones: CustomerMilestone[] }) {
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
  const delayed = milestones.filter((m) => m.status === 'delayed').length;
  const total = milestones.filter((m) => m.status !== 'cancelled').length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryTile label="Gesamt" value={String(total)} />
      <SummaryTile label="Abgeschlossen" value={String(completed)} tone="success" />
      <SummaryTile label="In Arbeit" value={String(inProgress)} />
      <SummaryTile label="Verzögert" value={String(delayed)} tone={delayed > 0 ? 'attention' : undefined} />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'attention';
}) {
  return (
    <div
      className={cn(
        'rounded-card border px-4 py-3.5',
        tone === 'success' ? 'border-emerald-200 bg-emerald-50/60'
          : tone === 'attention' ? 'border-amber-200 bg-amber-50/60'
            : 'border-hairline bg-white',
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 text-[22px] font-semibold leading-none tabular-nums tracking-tight text-gray-950">{value}</p>
    </div>
  );
}

/* ----------------------------------------------------------------------- Dokumente */

function DocumentsSection({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
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
        action={<AppButton to="/app/documents" variant="secondary">Alle Unterlagen ansehen</AppButton>}
      />
    );
  }

  const sorted = [...documents].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime(),
  );

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-gray-500">
        {sorted.length === 1 ? '1 Dokument' : `${sorted.length} Dokumente`} zu diesem Projekt.
      </p>
      <div className="space-y-2.5">
        {sorted.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            projectTitle={projectTitle}
            isNew={isRecentlyPublished(doc.uploaded_at)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- Abrechnung */

function BillingSection({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
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

  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstanding_cents, 0);
  const currency = invoices[0]?.currency ?? 'EUR';

  return (
    <div className="space-y-5">
      <div
        className={cn(
          'rounded-card border px-5 py-4',
          outstanding > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60',
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
          Offener Betrag in diesem Projekt
        </p>
        <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-gray-950">
          {formatCentsCurrencyDe(outstanding, currency)}
        </p>
      </div>
      <div className="space-y-2.5">
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.invoice_id} invoice={invoice} projectTitle={projectTitle} />
        ))}
      </div>
    </div>
  );
}

export default ProjectDetailPage;
