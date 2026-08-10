import { useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CircleDot,
  Flag,
  LayoutGrid,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import {
  appFocusRing,
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppSection,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import {
  CustomerActivityList,
  DocumentRow,
  InvoiceRow,
  MilestoneTimeline,
  ProjectStatusBadge,
} from '@/components/app/CustomerPlatformPrimitives';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCustomerDocuments,
  useCustomerInvoices,
  useCustomerMilestones,
} from '@/hooks/useCustomerWorkspace';
import { useSharedCustomerProjects } from '@/hooks/useCustomerProjectsContext';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { useOrganizations } from '@/hooks/useOrganizations';
import {
  buildCustomerActivity,
  isRecentlyPublished,
} from '@/lib/customerPlatform/customerActivity';
import {
  pickCogniiqNextAction,
  pickCustomerNextAction,
  pickPrimaryProject,
} from '@/lib/customerPlatform/customerPortalModel';
import {
  isActiveCustomerProject,
  type CustomerProject,
} from '@/lib/customerPlatform/types';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports/format';
import { cn } from '@/lib/utils';
import { resolveImplementation } from '@/lib/solutions/registry';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';

// The customer's executive project centre.
//
// It answers five questions in reading order — how is my project progressing, what has
// happened, what happens next, do I need to act, and what documents/invoices matter now
// — and it renders a module ONLY when real customer-safe data backs it. There are no
// placeholder tiles, no vanity charts and nothing derived from owner-side records.
//
// Modules intentionally omitted, and why, are documented at the bottom of this file.

const appCardLink = cn(
  'group rounded-card border border-hairline bg-white shadow-card',
  'transition-[border-color,box-shadow] duration-base ease-premium hover:border-gray-200 hover:shadow-card-hover',
  appFocusRing,
);

// The premium shell is mounted once by CustomerPortalBoundary for the whole /app subtree,
// so this page renders content only. Wrapping it in its own shell here would remount the
// sidebar on every navigation and duplicate the portal-access bootstrap.
export function AppHomePage() {
  return <AppHomeContent />;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/** First name only, so the greeting reads as a person speaking rather than a mail merge. */
function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return '';
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  return first.includes('@') ? '' : first;
}

function AppHomeContent() {
  const { profile } = useAuth();
  const { activeOrganization } = useOrganizations();
  const { solutions, portalSettings, status, error, reload } = useOrganizationSolutions();
  const {
    projects,
    status: projectsStatus,
    error: projectsError,
    reload: reloadProjects,
  } = useSharedCustomerProjects();
  const { documents } = useCustomerDocuments(null);
  const { invoices } = useCustomerInvoices(null);

  const name = firstNameOf(profile?.full_name) || '';
  const supportContact = portalSettings?.support_contact ?? null;

  // "Active" deliberately excludes completed and paused: this page answers "what is
  // happening now". Archived projects never reach the client at all.
  const activeProjects = useMemo(() => projects.filter(isActiveCustomerProject), [projects]);

  // The single project this page leads with. Priority: blocked, then attention needed,
  // then the nearest target date, then the most recently updated. Deterministic.
  const primaryProject = useMemo(() => pickPrimaryProject(activeProjects), [activeProjects]);
  const secondaryProjects = activeProjects.filter((project) => project.id !== primaryProject?.id);
  const completedProjects = projects.filter((project) => project.status === 'completed');

  // ONE extra request, for the primary project only — never one per project. It powers
  // the next-milestone module, the timeline and the milestone entries in the activity
  // feed; fetching milestones for every project to enrich a summary would be an N+1.
  const { milestones, status: milestonesStatus } = useCustomerMilestones(primaryProject?.id);

  const projectTitles = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects],
  );

  // Ownership is decided in one tested place, not inline — see `pickCustomerNextAction`.
  const customerAction = pickCustomerNextAction(activeProjects, primaryProject);
  const cogniiqAction = pickCogniiqNextAction(primaryProject);

  const nextMilestone = milestones
    .filter((m) => m.status === 'in_progress' || m.status === 'upcoming' || m.status === 'delayed')
    .sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;

  const recentDocuments = useMemo(
    () => [...documents]
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, 3),
    [documents],
  );

  const openInvoices = invoices.filter((invoice) => invoice.outstanding_cents > 0);
  const contactProject = primaryProject?.contact_display_name
    ? primaryProject
    : activeProjects.find((project) => project.contact_display_name) ?? null;

  const activity = useMemo(
    () => buildCustomerActivity({ projects, documents, invoices, milestones, projectTitles, limit: 5 }),
    [projects, documents, invoices, milestones, projectTitles],
  );

  const workspaceLoading = status === 'loading' || projectsStatus === 'loading';

  return (
    <>
      {/* ------------------------------------------------------ A. personal introduction */}
      <header className="mb-9">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Kundenportal</p>
        <h1 className="mt-2.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.022em] text-gray-950 sm:text-[36px]">
          {greeting()}{name ? `, ${name}` : ''}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-gray-600">
          {activeOrganization
            ? <>Der aktuelle Stand Ihrer Zusammenarbeit mit Cogniiq für <span className="font-semibold text-gray-900">{activeOrganization.name}</span>.</>
            : 'Der aktuelle Stand Ihrer Zusammenarbeit mit Cogniiq.'}
        </p>
      </header>

      {workspaceLoading ? (
        <div className="space-y-5">
          <AppSkeleton label="Ihr Projektstand wird geladen" />
          <div className="grid gap-5 lg:grid-cols-2">
            <AppSkeleton label="Unterlagen werden geladen" />
            <AppSkeleton label="Abrechnung wird geladen" />
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <AppErrorState
          message={error ?? 'Die Portaldaten konnten nicht geladen werden.'}
          onRetry={() => void reload()}
        />
      ) : null}

      {/* A failed project request must be reported as a failure — never fall through to
          "your portal is being set up", which is a factual claim about the account. */}
      {projectsStatus === 'error' && !workspaceLoading ? (
        <AppErrorState
          message={projectsError ?? 'Ihre Projekte konnten nicht geladen werden.'}
          onRetry={() => void reloadProjects()}
        />
      ) : null}

      {status === 'no-organization' ? (
        <AppEmptyState
          icon={Building2}
          title="Keine Organisation verbunden"
          description="Ihr Login ist aktiv, aber diesem Konto ist noch keine Organisation zugeordnet. Ihre Projekte und Unterlagen werden erst nach einer kontrollierten Provisionierung sichtbar."
        />
      ) : null}

      {status === 'ready' && !workspaceLoading ? (
        <div className="space-y-10">
          {/* -------------------------------------------- C. Ihre nächste Aktion */}
          {customerAction ? <NextActionBanner project={customerAction} /> : null}

          {/* -------------------------------------------- B. primary project status */}
          {primaryProject ? (
            <PrimaryProjectPanel
              project={primaryProject}
              cogniiqAction={cogniiqAction}
              nextMilestone={nextMilestone}
              milestonesStatus={milestonesStatus}
            />
          ) : projectsStatus === 'ready' ? (
            <NoProjectState solutions={solutions} completedCount={completedProjects.length} />
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
            <div className="min-w-0 space-y-10">
              {/* ------------------------------------ F. project timeline */}
              {primaryProject && milestones.length ? (
                <AppSection
                  eyebrow="Zeitplan"
                  title="Projektverlauf"
                  description={`Alle Meilensteine von „${primaryProject.title}" — abgeschlossen, in Arbeit und geplant.`}
                  action={
                    <AppButton
                      to={`/app/projects/${primaryProject.id}`}
                      variant="text"
                      icon={ArrowRight}
                      className="whitespace-nowrap"
                    >
                      Zum Projekt
                    </AppButton>
                  }
                >
                  <AppCard>
                    <MilestoneTimeline milestones={milestones} />
                  </AppCard>
                </AppSection>
              ) : null}

              {/* ------------------------------------ G. recent customer-safe updates */}
              {activity.length ? (
                <AppSection
                  eyebrow="Verlauf"
                  title="Zuletzt passiert"
                  description="Abgeschlossene Meilensteine, neue Unterlagen und ausgestellte Rechnungen — nach Datum sortiert."
                >
                  <CustomerActivityList entries={activity} />
                </AppSection>
              ) : null}

              {/* ------------------------------------ further projects */}
              {secondaryProjects.length ? (
                <AppSection
                  eyebrow="Projekte"
                  title={secondaryProjects.length === 1 ? 'Ihr weiteres Projekt' : 'Ihre weiteren Projekte'}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    {secondaryProjects.map((project) => (
                      <CompactProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </AppSection>
              ) : null}

              {completedProjects.length ? (
                <AppSection
                  eyebrow="Archiv"
                  title={completedProjects.length === 1 ? 'Abgeschlossenes Projekt' : 'Abgeschlossene Projekte'}
                  description="Abgeschlossene Projekte bleiben mit allen Unterlagen und Rechnungen zugänglich."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    {completedProjects.map((project) => (
                      <CompactProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </AppSection>
              ) : null}
            </div>

            {/* ---------------------------------------- side column */}
            <aside className="min-w-0 space-y-8">
              {/* -------------------------------------- I. billing summary */}
              <BillingSummaryPanel
                openInvoices={openInvoices}
                totalInvoices={invoices.length}
                projectTitles={projectTitles}
              />

              {/* -------------------------------------- H. recent documents */}
              {recentDocuments.length ? (
                <section aria-labelledby="home-documents-heading">
                  <div className="mb-3.5 flex items-baseline justify-between gap-3">
                    <h2 id="home-documents-heading" className="text-[15px] font-semibold tracking-tight text-gray-950">
                      Neueste Unterlagen
                    </h2>
                    <Link
                      to="/app/documents"
                      className={cn('rounded-control text-[12.5px] font-semibold text-gray-500 hover:text-gray-950', appFocusRing)}
                    >
                      Alle
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {recentDocuments.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        document={doc}
                        projectTitle={doc.project_id ? projectTitles.get(doc.project_id) ?? null : null}
                        isNew={isRecentlyPublished(doc.uploaded_at)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* -------------------------------------- J. personal contact */}
              {contactProject?.contact_display_name ? (
                <ContactPanel project={contactProject} />
              ) : supportContact ? (
                <SupportFallbackPanel supportContact={supportContact} />
              ) : null}

              {/* -------------------------------------- solutions */}
              {solutions.length ? (
                <section aria-labelledby="home-solutions-heading">
                  <div className="mb-3.5 flex items-baseline justify-between gap-3">
                    <h2 id="home-solutions-heading" className="text-[15px] font-semibold tracking-tight text-gray-950">
                      Ihre Lösungen
                    </h2>
                    <Link
                      to="/app/solutions"
                      className={cn('rounded-control text-[12.5px] font-semibold text-gray-500 hover:text-gray-950', appFocusRing)}
                    >
                      Alle
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {solutions.slice(0, 3).map((solution) => (
                      <SolutionRow key={solution.id} solution={solution} />
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ primary project */

function PrimaryProjectPanel({
  project,
  cogniiqAction,
  nextMilestone,
  milestonesStatus,
}: {
  project: CustomerProject;
  cogniiqAction: CustomerProject | null;
  nextMilestone: { title: string; target_date: string | null; status: string } | null;
  milestonesStatus: string;
}) {
  const reduceMotion = useReducedMotion();
  const progress = Math.max(0, Math.min(100, project.progress_percent));

  return (
    <section
      aria-labelledby="primary-project-heading"
      className="overflow-hidden rounded-panel border border-hairline bg-white shadow-card"
    >
      <div className="border-b border-hairline p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{project.phase}</p>
            <h2
              id="primary-project-heading"
              className="mt-2 hyphens-auto break-words text-[22px] font-semibold leading-[1.2] tracking-[-0.018em] text-gray-950 sm:text-[26px]"
            >
              {project.title}
            </h2>
            {project.business_objective ? (
              <p className="mt-2.5 max-w-2xl text-[14px] leading-[1.6] text-gray-600">
                {project.business_objective}
              </p>
            ) : null}
          </div>
          <div className="shrink-0">
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>

        {/* Premium progress: the number leads, the bar supports it. No chart. */}
        <div className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-gray-950">
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
            {/* scaleX on the compositor: the bar never reflows the panel around it. */}
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
      </div>

      {/* Blocker — customer-safe wording only, straight from the RPC field. */}
      {project.customer_safe_blocker_summary ? (
        <div className="border-b border-hairline bg-red-50/60 px-6 py-4 sm:px-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">Aktuelle Blockade</p>
          <p className="mt-1.5 text-[13px] leading-6 text-red-800">{project.customer_safe_blocker_summary}</p>
        </div>
      ) : null}

      <div className="grid divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {/* ----------------------------- D. Cogniiq arbeitet aktuell an */}
        <div className="min-w-0 px-6 py-5 sm:px-7">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <CircleDot size={12} aria-hidden="true" />
            Cogniiq arbeitet aktuell an
          </p>
          {cogniiqAction?.next_action_summary ? (
            <>
              <p className="mt-2 break-words text-[13.5px] font-semibold leading-snug text-gray-950">
                {cogniiqAction.next_action_summary}
              </p>
              {cogniiqAction.next_action_due_date ? (
                <p className="mt-1.5 text-[12px] tabular-nums text-gray-500">
                  Geplant bis {formatDateDe(cogniiqAction.next_action_due_date)}
                </p>
              ) : null}
            </>
          ) : (
            // Honest absence. The portal knows of no Cogniiq-owned next step; it does not
            // invent one, and it does not read internal tasks to fill the gap.
            <p className="mt-2 text-[13px] leading-6 text-gray-500">
              Für diesen Moment ist kein Arbeitsschritt bei Cogniiq hinterlegt.
            </p>
          )}
        </div>

        {/* ----------------------------- E. next milestone */}
        <div className="min-w-0 px-6 py-5 sm:px-7">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            <Flag size={12} aria-hidden="true" />
            Nächster Meilenstein
          </p>
          {nextMilestone ? (
            <>
              <p className="mt-2 break-words text-[13.5px] font-semibold leading-snug text-gray-950">
                {nextMilestone.title}
              </p>
              <p className="mt-1.5 text-[12px] tabular-nums text-gray-500">
                {nextMilestone.target_date
                  ? `Geplant für ${formatDateDe(nextMilestone.target_date)}`
                  : 'Ohne festen Termin'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[13px] leading-6 text-gray-500">
              {/* A claim about the project may only be made once the request succeeded. */}
              {milestonesStatus === 'ready'
                ? 'Kein offener Meilenstein.'
                : milestonesStatus === 'error'
                  ? 'Meilensteine konnten nicht geladen werden.'
                  : 'Wird geladen …'}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-gray-50/60 px-6 py-4 sm:px-7">
        <p className="text-[11.5px] tabular-nums text-gray-500">
          Zuletzt aktualisiert {formatDateDe(project.updated_at)}
        </p>
        <AppButton to={`/app/projects/${project.id}`} variant="secondary" icon={ArrowRight}>
          Projekt öffnen
        </AppButton>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- next action */

function NextActionBanner({ project }: { project: CustomerProject }) {
  const overdue = project.next_action_due_date
    ? new Date(project.next_action_due_date).getTime() < Date.now()
    : false;

  return (
    <section
      aria-labelledby="next-action-heading"
      className={cn(
        'overflow-hidden rounded-panel border p-6 sm:p-7',
        overdue ? 'border-red-200 bg-red-50/70' : 'border-amber-200 bg-amber-50/70',
      )}
    >
      {/* Stacked below sm: at 390px the button previously sat beside the text and squeezed
          it to ~150px, which broke "Schnittstellenfreigabe" across two lines mid-word. */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p
            id="next-action-heading"
            className={cn(
              'flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]',
              overdue ? 'text-red-700' : 'text-amber-700',
            )}
          >
            <CalendarClock size={13} aria-hidden="true" />
            Ihre nächste Aktion
          </p>
          <p className="mt-2.5 hyphens-auto break-words text-[17px] font-semibold leading-snug tracking-[-0.01em] text-gray-950">
            {project.next_action_summary}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12.5px] text-gray-600">
            <span>{project.title}</span>
            {project.next_action_due_date ? (
              // The separator travels WITH the date: on a narrow column it was wrapping
              // onto its own line and reading as a stray bullet.
              <span className="whitespace-nowrap">
                <span aria-hidden="true" className="mr-2 text-gray-400">·</span>
                <span className={cn('font-semibold tabular-nums', overdue ? 'text-red-700' : 'text-amber-800')}>
                  {overdue ? 'Überfällig seit ' : 'Fällig am '}
                  {formatDateDe(project.next_action_due_date)}
                </span>
              </span>
            ) : null}
          </p>
          <p className="mt-2.5 text-[12.5px] leading-5 text-gray-600">
            Cogniiq wartet auf diese Rückmeldung von Ihnen, um weiterzuarbeiten.
          </p>
        </div>
        <AppButton to={`/app/projects/${project.id}`} icon={ArrowRight} className="w-full sm:w-auto">
          Zum Projekt
        </AppButton>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- billing */

function BillingSummaryPanel({
  openInvoices,
  totalInvoices,
  projectTitles,
}: {
  openInvoices: Array<import('@/lib/customerPlatform/types').CustomerInvoice>;
  totalInvoices: number;
  projectTitles: Map<string, string>;
}) {
  // Never render a billing module for an organization that has never been invoiced.
  if (!totalInvoices) return null;

  const currency = openInvoices[0]?.currency ?? 'EUR';
  const outstanding = openInvoices.reduce((sum, invoice) => sum + invoice.outstanding_cents, 0);

  return (
    <section aria-labelledby="home-billing-heading">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 id="home-billing-heading" className="text-[15px] font-semibold tracking-tight text-gray-950">
          Abrechnung
        </h2>
        <Link
          to="/app/billing"
          className={cn('rounded-control text-[12.5px] font-semibold text-gray-500 hover:text-gray-950', appFocusRing)}
        >
          Alle
        </Link>
      </div>

      {openInvoices.length ? (
        <div className="space-y-2.5">
          <div className="rounded-card border border-amber-200 bg-amber-50/70 px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Offener Betrag</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-tight text-gray-950">
              {formatCentsCurrencyDe(outstanding, currency)}
            </p>
            <p className="mt-0.5 text-[11.5px] text-amber-800">
              {openInvoices.length === 1 ? '1 offene Rechnung' : `${openInvoices.length} offene Rechnungen`}
            </p>
          </div>
          {openInvoices.slice(0, 2).map((invoice) => (
            <InvoiceRow
              key={invoice.invoice_id}
              invoice={invoice}
              projectTitle={invoice.project_id ? projectTitles.get(invoice.project_id) ?? null : null}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-emerald-200 bg-emerald-50/60 px-4 py-4">
          <p className="text-[13px] font-semibold text-emerald-800">Alle Rechnungen ausgeglichen</p>
          <p className="mt-1 text-[12px] leading-5 text-emerald-700">
            Zurzeit ist kein Betrag offen. Vielen Dank für die pünktliche Zahlung.
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- contact */

function ContactPanel({ project }: { project: CustomerProject }) {
  return (
    <section aria-labelledby="home-contact-heading">
      <h2 id="home-contact-heading" className="mb-3.5 text-[15px] font-semibold tracking-tight text-gray-950">
        Ihr Ansprechpartner
      </h2>
      <div className="rounded-card border border-hairline bg-white p-5 shadow-card">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-hairline bg-gray-50 text-gray-500">
            <UserRound size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-[14px] font-semibold leading-snug text-gray-950">
              {project.contact_display_name}
            </p>
            {project.contact_role_label ? (
              <p className="mt-0.5 text-[12.5px] text-gray-500">{project.contact_role_label}</p>
            ) : null}
          </div>
        </div>
        {project.contact_business_email ? (
          <a
            href={`mailto:${project.contact_business_email}`}
            className={cn(
              'mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700',
              'transition-colors duration-fast ease-premium hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
              appFocusRing,
            )}
          >
            <Mail size={14} aria-hidden="true" />
            Nachricht schreiben
          </a>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Shown only when no VERIFIED per-project contact exists but the organization has a
 * configured support address. It is labelled as the support channel, never dressed up
 * as a named personal contact.
 */
function SupportFallbackPanel({ supportContact }: { supportContact: string }) {
  return (
    <section aria-labelledby="home-support-heading">
      <h2 id="home-support-heading" className="mb-3.5 text-[15px] font-semibold tracking-tight text-gray-950">
        Ihr Draht zu Cogniiq
      </h2>
      <div className="rounded-card border border-hairline bg-white p-5 shadow-card">
        <p className="text-[13px] leading-6 text-gray-600">
          Für dieses Projekt ist noch kein persönlicher Ansprechpartner hinterlegt. Ihre Anfragen
          erreichen uns über den Support.
        </p>
        <a
          href={`mailto:${supportContact}`}
          className={cn(
            'mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700',
            'transition-colors duration-fast ease-premium hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
            appFocusRing,
          )}
        >
          <Mail size={14} aria-hidden="true" />
          {supportContact}
        </a>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- other projects */

function CompactProjectCard({ project }: { project: CustomerProject }) {
  const progress = Math.max(0, Math.min(100, project.progress_percent));
  return (
    <Link to={`/app/projects/${project.id}`} className={cn(appCardLink, 'flex flex-col p-5')}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{project.phase}</p>
        <ProjectStatusBadge status={project.status} />
      </div>
      <h3 className="break-words text-[15px] font-semibold leading-snug tracking-tight text-gray-950">
        {project.title}
      </h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gray-950" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-gray-600">{progress}%</span>
      </div>
      {project.target_date ? (
        <p className="mt-3 text-[11.5px] tabular-nums text-gray-500">
          Zieltermin {formatDateDe(project.target_date)}
        </p>
      ) : null}
      <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-gray-950">
        Öffnen
        <ArrowUpRight
          size={14}
          className="transition-transform duration-fast ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ empty state */

function NoProjectState({
  solutions,
  completedCount,
}: {
  solutions: OrganizationSolution[];
  completedCount: number;
}) {
  if (completedCount > 0) {
    return (
      <AppEmptyState
        icon={Flag}
        title="Kein laufendes Projekt"
        description="Ihre bisherigen Projekte sind abgeschlossen. Alle Unterlagen und Rechnungen bleiben weiterhin zugänglich — sprechen Sie uns an, wenn ein neues Vorhaben ansteht."
        action={<AppButton to="/app/support" variant="secondary">Cogniiq kontaktieren</AppButton>}
      />
    );
  }
  if (solutions.length === 0) {
    return (
      <AppEmptyState
        icon={Sparkles}
        title="Ihr Portal wird vorbereitet"
        description="Ihre Organisation ist verbunden. Sobald Cogniiq Ihr Projekt oder eine Lösung freischaltet, sehen Sie hier Status, nächste Schritte und Unterlagen."
      />
    );
  }
  return (
    <AppEmptyState
      icon={LayoutGrid}
      title="Noch kein Projekt freigeschaltet"
      description="Ihre Lösungen sind bereits verbunden. Sobald Cogniiq ein Projekt für Sie anlegt, erscheinen Projektstand, Meilensteine und nächste Schritte an dieser Stelle."
      action={<AppButton to="/app/solutions" variant="secondary" icon={ArrowRight}>Zu Ihren Lösungen</AppButton>}
    />
  );
}

/* -------------------------------------------------------------------- solutions */

function SolutionRow({ solution }: { solution: OrganizationSolution }) {
  const implementation = resolveImplementation(solution.implementation_key);
  const statusDisplay = solutionStatusDisplay(solution.status);
  const Icon = implementation.icon;

  return (
    <Link
      to={`/app/solutions/${solution.instance_key}`}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-card border border-hairline bg-white px-4 py-3',
        'transition-[border-color] duration-base ease-premium hover:border-gray-200',
        appFocusRing,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-hairline bg-gray-50 text-gray-500">
        <Icon size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-gray-950">{solution.display_name}</span>
        <span className="block truncate text-[11.5px] text-gray-500">{implementation.label}</span>
      </span>
      <AppStatusBadge label={statusDisplay.label} tone={statusDisplay.tone} />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Modules deliberately NOT built, because no customer-safe field backs them:
//
//  - a per-project "Cogniiq works on" list beyond `next_action_summary`. The only other
//    source is internal owner tasks, which the customer must never see.
//  - response-time or SLA copy on the contact panel. No such value exists in any
//    customer RPC, so inventing "meldet sich innerhalb von 24 Stunden" would be a
//    promise the product cannot keep.
//  - usage metrics on the solution rows. `organization_solutions` carries status and
//    config only; there is no call/lead volume the customer RPCs expose.
// ---------------------------------------------------------------------------

export default AppHomePage;
