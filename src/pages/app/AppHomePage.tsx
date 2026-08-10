import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  LayoutGrid,
  LifeBuoy,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppProgress,
  AppSection,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import {
  DocumentRow,
  InvoiceRow,
  ProjectStatusBadge,
} from '@/components/app/CustomerPlatformPrimitives';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCustomerDocuments,
  useCustomerInvoices,
  useCustomerProjects,
} from '@/hooks/useCustomerWorkspace';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { useOrganizations } from '@/hooks/useOrganizations';
import {
  isActiveCustomerProject,
  type CustomerProject,
} from '@/lib/customerPlatform/types';
import { formatDateDe } from '@/lib/ownerFinance/exports/format';
import { resolveImplementation } from '@/lib/solutions/registry';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';

// Customer home page. Every card below is CONDITIONAL on real data existing — there
// are no decorative placeholders and nothing is simulated. When an organization has
// no project yet, the page falls back to the genuine onboarding/solution state rather
// than rendering a grid of empty shells.

export function AppHomePage() {
  return (
    <AppHomeContent />
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/** Recently delivered = published within the last 14 days. */
const RECENT_DOCUMENT_DAYS = 14;

function isRecent(isoDate: string): boolean {
  const uploaded = new Date(isoDate).getTime();
  if (Number.isNaN(uploaded)) return false;
  return Date.now() - uploaded <= RECENT_DOCUMENT_DAYS * 24 * 60 * 60 * 1000;
}

function AppHomeContent() {
  const { profile, user } = useAuth();
  const { activeOrganization } = useOrganizations();
  const { solutions, portalSettings, status, error, reload } = useOrganizationSolutions();
  const {
    projects,
    status: projectsStatus,
    error: projectsError,
    reload: reloadProjects,
  } = useCustomerProjects();
  const { documents } = useCustomerDocuments(null);
  const { invoices } = useCustomerInvoices(null);

  const name = profile?.full_name || profile?.email || user?.email || '';
  const supportContact = portalSettings?.support_contact ?? null;

  // "Active" deliberately excludes completed and paused: the home page answers
  // "what is happening now". Archived projects never reach the client at all.
  const activeProjects = projects.filter(isActiveCustomerProject);

  // A next action is only shown when the CUSTOMER owns it — this card answers
  // "does Cogniiq need something from me?", not "what is Cogniiq doing?".
  const customerActions = activeProjects.filter(
    (project) => project.next_action_owner === 'customer' && project.next_action_summary,
  );

  const recentDocuments = documents.filter((doc) => isRecent(doc.uploaded_at)).slice(0, 4);
  const openInvoices = invoices.filter((invoice) => invoice.outstanding_cents > 0);
  const contactProject = activeProjects.find((project) => project.contact_display_name);

  const workspaceLoading = status === 'loading' || projectsStatus === 'loading';

  return (
    <>
      <AppPageHeader
        eyebrow="Kundenbereich"
        title={`${greeting()}${name ? `, ${name}` : ''}.`}
        description={
          activeOrganization
            ? `Ihr Cogniiq-Portal für ${activeOrganization.name}.`
            : 'Ihr persönlicher Cogniiq-Bereich.'
        }
        meta={
          <div className="flex flex-wrap gap-2">
            <AppStatusBadge
              label={activeOrganization ? activeOrganization.name : 'Keine Organisation'}
              tone={activeOrganization ? 'success' : 'neutral'}
            />
            {projectsStatus === 'ready' && activeProjects.length ? (
              <AppStatusBadge
                label={activeProjects.length === 1 ? '1 aktives Projekt' : `${activeProjects.length} aktive Projekte`}
                tone="success"
              />
            ) : null}
          </div>
        }
      />

      {workspaceLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AppSkeleton label="Ihr Projektstand wird geladen" />
          <AppSkeleton label="Portal wird geladen" />
        </div>
      ) : null}

      {status === 'error' ? (
        <AppErrorState
          message={error ?? 'Die Portaldaten konnten nicht geladen werden.'}
          onRetry={() => void reload()}
        />
      ) : null}

      {/* A failed project request must be reported as a failure. Without this the
          page fell through to NoProjectState and told the customer their portal
          was still being set up — a factual claim about their account made on the
          strength of a request that never succeeded. */}
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
          {/* ---- Ihre nächste Aktion: only when the customer actually owns one ---- */}
          {customerActions.length ? <NextActionCard projects={customerActions} /> : null}

          {/* ---- Active projects: one real card each, never a placeholder ---- */}
          {activeProjects.length ? (
            <AppSection
              eyebrow="Projekt"
              title={activeProjects.length === 1 ? 'Ihr aktives Projekt' : 'Ihre aktiven Projekte'}
            >
              <div className="grid gap-5 xl:grid-cols-2">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </AppSection>
          ) : projectsStatus === 'ready' ? (
            // Only claim "no project yet" when the project list actually loaded.
            <NoProjectState solutions={solutions} />
          ) : null}

          {/* ---- Recently delivered documents ---- */}
          {recentDocuments.length ? (
            <AppSection
              eyebrow="Unterlagen"
              title="Zuletzt bereitgestellt"
              description="Neue Dokumente aus den letzten zwei Wochen."
            >
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <DocumentRow key={doc.id} document={doc} />
                ))}
              </div>
              <div className="mt-4">
                <AppButton to="/app/documents" variant="secondary" icon={FileText}>
                  Alle Dokumente
                </AppButton>
              </div>
            </AppSection>
          ) : null}

          {/* ---- Open invoices ---- */}
          {openInvoices.length ? (
            <AppSection eyebrow="Abrechnung" title="Offene Rechnungen">
              <div className="space-y-3">
                {openInvoices.slice(0, 3).map((invoice) => (
                  <InvoiceRow key={invoice.invoice_id} invoice={invoice} />
                ))}
              </div>
              {openInvoices.length > 3 ? (
                <div className="mt-4">
                  <AppButton to="/app/billing" variant="secondary" icon={CreditCard}>
                    Alle Rechnungen
                  </AppButton>
                </div>
              ) : null}
            </AppSection>
          ) : null}

          {/* ---- Verified Cogniiq contact ---- */}
          {contactProject ? <ContactCard project={contactProject} /> : null}

          {/* ---- Solutions: kept, but secondary to the project layer ---- */}
          {solutions.length ? (
            <AppSection eyebrow="Lösungen" title="Ihre Lösungen">
              <div className="grid gap-4 md:grid-cols-2">
                {solutions.map((solution) => (
                  <SolutionGridCard key={solution.id} solution={solution} />
                ))}
              </div>
            </AppSection>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <ShortcutCard icon={FileText} title="Dokumente" text="Alle bereitgestellten Unterlagen." to="/app/documents" />
            <ShortcutCard icon={CreditCard} title="Abrechnung" text="Rechnungen und Zahlungsstand." to="/app/billing" />
            <ShortcutCard
              icon={LifeBuoy}
              title="Support"
              text={supportContact ? `Kontakt: ${supportContact}` : 'Hilfe und Kontakt.'}
              to="/app/support"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- next action
function NextActionCard({ projects }: { projects: CustomerProject[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-7">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <CalendarClock size={16} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Ihre nächste Aktion</p>
          <p className="text-[12.5px] text-amber-800">Cogniiq wartet auf diese Rückmeldung von Ihnen.</p>
        </div>
      </div>
      <ul className="space-y-3">
        {projects.map((project) => {
          const overdue = project.next_action_due_date
            ? new Date(project.next_action_due_date).getTime() < Date.now()
            : false;
          return (
            <li
              key={project.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200/70 bg-white px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-950">{project.next_action_summary}</p>
                <p className="mt-1 text-[12px] text-gray-500">
                  {project.title}
                  {project.next_action_due_date ? (
                    <>
                      {' · '}
                      <span className={overdue ? 'font-semibold text-red-600' : undefined}>
                        {overdue ? 'Überfällig seit ' : 'Bis '}
                        {formatDateDe(project.next_action_due_date)}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <AppButton to={`/app/projects/${project.id}`} variant="secondary" icon={ArrowUpRight}>
                Zum Projekt
              </AppButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- project card
function ProjectCard({ project }: { project: CustomerProject }) {
  return (
    <Link
      to={`/app/projects/${project.id}`}
      className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.035)] transition-colors hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{project.phase}</p>
        <ProjectStatusBadge status={project.status} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-gray-950">{project.title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{project.business_objective}</p>

      <div className="mt-5">
        <AppProgress value={project.progress_percent} label={`${project.progress_percent}% abgeschlossen`} />
      </div>

      <dl className="mt-5 grid gap-3 border-t border-gray-100 pt-4 text-[12.5px] sm:grid-cols-2">
        {project.target_date ? (
          <div>
            <dt className="text-gray-400">Zieltermin</dt>
            <dd className="mt-0.5 font-semibold text-gray-800">{formatDateDe(project.target_date)}</dd>
          </div>
        ) : null}
        {project.next_action_summary ? (
          <div className="min-w-0">
            <dt className="text-gray-400">
              {project.next_action_owner === 'customer' ? 'Ihre nächste Aktion' : 'Nächster Schritt bei Cogniiq'}
            </dt>
            <dd className="mt-0.5 truncate font-semibold text-gray-800">{project.next_action_summary}</dd>
          </div>
        ) : null}
      </dl>

      {project.customer_safe_blocker_summary ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] leading-5 text-red-700">
          {project.customer_safe_blocker_summary}
        </p>
      ) : null}

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gray-950">
        Projekt öffnen
        <ArrowUpRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------- contact
function ContactCard({ project }: { project: CustomerProject }) {
  return (
    <AppSection eyebrow="Ansprechpartner" title="Ihr Kontakt bei Cogniiq">
      <AppCard>
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
    </AppSection>
  );
}

// ---------------------------------------------------------------- no project yet
function NoProjectState({ solutions }: { solutions: OrganizationSolution[] }) {
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
      description="Ihre Lösungen sind unten aufgeführt. Sobald Cogniiq ein Projekt für Sie anlegt, erscheinen Projektstand, Meilensteine und nächste Schritte an dieser Stelle."
    />
  );
}

// ---------------------------------------------------------------- solutions
function SolutionGridCard({ solution }: { solution: OrganizationSolution }) {
  const implementation = resolveImplementation(solution.implementation_key);
  const statusDisplay = solutionStatusDisplay(solution.status);
  const Icon = implementation.icon;

  return (
    <Link
      to={`/app/solutions/${solution.instance_key}`}
      className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.035)] transition-colors hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
          <Icon size={18} aria-hidden="true" />
        </span>
        <AppStatusBadge label={statusDisplay.label} tone={statusDisplay.tone} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{implementation.label}</p>
      <h3 className="mt-1 text-lg font-semibold text-gray-950">{solution.display_name}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        {implementation.available ? 'Öffnen, um diese Lösung zu verwalten.' : 'Oberfläche noch nicht verfügbar.'}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-950">
        Öffnen
        <ArrowUpRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function ShortcutCard({
  icon: Icon,
  title,
  text,
  to,
}: {
  icon: typeof LayoutGrid;
  title: string;
  text: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-none transition-colors hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
    >
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
        <Icon size={16} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{text}</p>
    </Link>
  );
}

export default AppHomePage;
