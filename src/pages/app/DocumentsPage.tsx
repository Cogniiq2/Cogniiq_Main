import { useMemo, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  appFocusRing,
  AppEmptyState,
  AppErrorState,
  AppSkeleton,
} from '@/components/app/CustomerAppPrimitives';
import { DocumentRow } from '@/components/app/CustomerPlatformPrimitives';
import { PremiumSelect } from '@/components/dashboard/premiumControls';
import { useCustomerDocuments } from '@/hooks/useCustomerWorkspace';
import { useSharedCustomerProjects } from '@/hooks/useCustomerProjectsContext';
import { isRecentlyPublished, RECENT_DOCUMENT_DAYS } from '@/lib/customerPlatform/customerActivity';
import {
  customerDocumentCategoryLabels,
  type CustomerDocumentCategory,
} from '@/lib/customerPlatform/types';
import { filterDocuments } from '@/lib/customerPlatform/customerPortalModel';
import { cn } from '@/lib/utils';

// The customer's document workspace.
//
// Every visible document for the active organization, including organization-level ones
// (contracts, DPAs) that belong to no single project. Search, category and project
// filters are CLIENT-SIDE over the single `list_customer_documents` response that the
// page already holds — no extra request, no server-side search endpoint invented.
//
// Download security is unchanged: a fresh signed URL is minted by the Edge Function at
// click time and opened immediately; it is never rendered into the DOM. There is no
// upload path on the customer side.

export function DocumentsPage() {
  return (
    <CustomerAppShell>
      <DocumentsContent />
    </CustomerAppShell>
  );
}

const ALL = 'all';

function DocumentsContent() {
  // null => every visible document in the organization, not only project-scoped ones.
  const { documents, status, error, reload } = useCustomerDocuments(null);
  // Reads the shell's already-loaded project list: this is what turns a bare project id
  // on a document into the customer's own project NAME, at no request cost.
  const { projects } = useSharedCustomerProjects();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CustomerDocumentCategory | typeof ALL>(ALL);
  const [projectId, setProjectId] = useState<string>(ALL);

  const projectTitles = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects],
  );

  const availableCategories = useMemo(() => {
    const present = new Set<CustomerDocumentCategory>();
    documents.forEach((doc) => present.add(doc.category));
    return Array.from(present).sort((a, b) =>
      (customerDocumentCategoryLabels[a] ?? '').localeCompare(customerDocumentCategoryLabels[b] ?? '', 'de'),
    );
  }, [documents]);

  // Only projects that actually have a document get a filter entry — an option that can
  // only ever produce an empty result is a dead control.
  const availableProjects = useMemo(() => {
    const present = new Set<string>();
    documents.forEach((doc) => { if (doc.project_id) present.add(doc.project_id); });
    return Array.from(present)
      .map((id) => ({ id, title: projectTitles.get(id) ?? 'Weiteres Projekt' }))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'));
  }, [documents, projectTitles]);

  const hasOrganizationLevelDocuments = documents.some((doc) => !doc.project_id);

  const visible = useMemo(
    () => filterDocuments(documents, { query, category, projectId }),
    [documents, query, category, projectId],
  );

  const sorted = useMemo(
    () => [...visible].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()),
    [visible],
  );

  const filtersActive = query.trim() !== '' || category !== ALL || projectId !== ALL;
  const showFilters = documents.length > 3 || availableCategories.length > 1;

  const resetFilters = () => { setQuery(''); setCategory(ALL); setProjectId(ALL); };

  return (
    <>
      <header className="mb-8 border-b border-hairline pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Unterlagen</p>
        <h1 className="mt-2.5 text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-gray-950 sm:text-[34px]">
          Dokumentencenter
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-gray-600">
          Angebote, Verträge, Rechnungen und Projektunterlagen an einem Ort — immer in der
          aktuellen Fassung. Sie müssen dafür keine E-Mails durchsuchen.
        </p>
      </header>

      {status === 'loading' ? (
        <div className="space-y-3">
          <AppSkeleton label="Dokumente werden geladen" />
          <AppSkeleton label="Dokumente werden geladen" />
        </div>
      ) : null}

      {status === 'error' ? (
        <AppErrorState
          message={error ?? 'Die Dokumente konnten nicht geladen werden.'}
          onRetry={() => void reload()}
        />
      ) : null}

      {status === 'no-organization' ? (
        <AppEmptyState
          icon={FileText}
          title="Keine Organisation verbunden"
          description="Diesem Konto ist noch keine Organisation zugeordnet. Sobald Ihr Zugang eingerichtet ist, finden Sie hier Ihre Unterlagen."
        />
      ) : null}

      {status === 'ready' ? (
        documents.length === 0 ? (
          <AppEmptyState
            icon={FileText}
            title="Noch keine Dokumente"
            description="Sobald Cogniiq Unterlagen für Sie freigibt, erscheinen sie hier — mit Kategorie, Projektbezug und Datum, jederzeit abrufbar."
          />
        ) : (
          <div className="space-y-6">
            {showFilters ? (
              <div className="rounded-card border border-hairline bg-white p-4 shadow-card">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
                  <label className="relative block" htmlFor="document-search">
                    <span className="sr-only">Dokumente durchsuchen</span>
                    <Search
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="document-search"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Nach Titel suchen …"
                      className={cn(
                        'h-11 w-full rounded-control border border-gray-200 bg-white pl-10 pr-3.5 text-sm text-gray-900',
                        'outline-none transition-colors duration-fast ease-premium placeholder:text-gray-400',
                        'hover:border-gray-300 focus:border-gray-400',
                        appFocusRing,
                      )}
                    />
                  </label>

                  <PremiumSelect
                    id="document-category-filter"
                    ariaLabel="Nach Kategorie filtern"
                    value={category}
                    onValueChange={(value) => setCategory(value as CustomerDocumentCategory | typeof ALL)}
                    options={[
                      { value: ALL, label: 'Alle Kategorien' },
                      ...availableCategories.map((entry) => ({
                        value: entry,
                        label: customerDocumentCategoryLabels[entry] ?? '—',
                      })),
                    ]}
                    triggerClassName="h-11 w-full text-sm"
                  />

                  {availableProjects.length ? (
                    <PremiumSelect
                      id="document-project-filter"
                      ariaLabel="Nach Projekt filtern"
                      value={projectId}
                      onValueChange={setProjectId}
                      options={[
                        { value: ALL, label: 'Alle Projekte' },
                        ...availableProjects.map((project) => ({ value: project.id, label: project.title })),
                        ...(hasOrganizationLevelDocuments
                          ? [{ value: 'none', label: 'Ohne Projektbezug' }]
                          : []),
                      ]}
                      triggerClassName="h-11 w-full text-sm"
                    />
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
                  <p className="text-[12.5px] tabular-nums text-gray-600">
                    {sorted.length === documents.length
                      ? `${documents.length} ${documents.length === 1 ? 'Dokument' : 'Dokumente'}`
                      : `${sorted.length} von ${documents.length} ${documents.length === 1 ? 'Dokument' : 'Dokumenten'}`}
                  </p>
                  {filtersActive ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-[12.5px] font-semibold text-gray-500',
                        'transition-colors duration-fast ease-premium hover:bg-gray-100 hover:text-gray-950',
                        appFocusRing,
                      )}
                    >
                      <X size={13} aria-hidden="true" />
                      Filter zurücksetzen
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-[12.5px] tabular-nums text-gray-600">
                {documents.length === 1 ? '1 Dokument' : `${documents.length} Dokumente`}
              </p>
            )}

            {sorted.length ? (
              <div className="space-y-2.5">
                {sorted.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    projectTitle={doc.project_id ? projectTitles.get(doc.project_id) ?? null : null}
                    isNew={isRecentlyPublished(doc.uploaded_at)}
                  />
                ))}
              </div>
            ) : (
              <AppEmptyState
                compact
                icon={Search}
                title="Keine Treffer"
                description="Zu dieser Auswahl gibt es kein Dokument. Setzen Sie die Filter zurück, um wieder alle Unterlagen zu sehen."
              />
            )}

            <p className="text-[11.5px] leading-5 text-gray-400">
              „Neu" markiert Unterlagen, die innerhalb der letzten {RECENT_DOCUMENT_DAYS} Tage
              bereitgestellt wurden. Downloads werden bei jedem Klick neu und zeitlich begrenzt
              freigegeben.
            </p>
          </div>
        )
      ) : null}
    </>
  );
}

export default DocumentsPage;
