import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

import {
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { DocumentRow } from '@/components/app/CustomerPlatformPrimitives';
import { useCustomerDocuments } from '@/hooks/useCustomerWorkspace';
import {
  customerDocumentCategoryLabels,
  type CustomerDocumentCategory,
} from '@/lib/customerPlatform/types';
import { cn } from '@/lib/utils';

// All customer-visible documents for the active organization, including
// organization-level ones (contracts, DPAs) that belong to no single project.

export function DocumentsPage() {
  return (
    <DocumentsContent />
  );
}

function DocumentsContent() {
  // null => every visible document in the organization, not only project-scoped ones.
  const { documents, status, error, reload } = useCustomerDocuments(null);
  const [category, setCategory] = useState<CustomerDocumentCategory | 'all'>('all');

  // Only offer filters for categories that actually have documents — an empty
  // filter chip is just a dead control.
  const availableCategories = useMemo(() => {
    const present = new Set<CustomerDocumentCategory>();
    documents.forEach((doc) => present.add(doc.category));
    return Array.from(present).sort((a, b) =>
      customerDocumentCategoryLabels[a].localeCompare(customerDocumentCategoryLabels[b], 'de'),
    );
  }, [documents]);

  const visible = useMemo(
    () => (category === 'all' ? documents : documents.filter((doc) => doc.category === category)),
    [documents, category],
  );

  return (
    <>
      <AppPageHeader
        eyebrow="Unterlagen"
        title="Dokumente"
        description="Alle Unterlagen, die Cogniiq für Sie bereitgestellt hat — Angebote, Verträge, Rechnungen und Projektdokumente an einem Ort."
        meta={
          status === 'ready' && documents.length ? (
            <AppStatusBadge
              label={documents.length === 1 ? '1 Dokument' : `${documents.length} Dokumente`}
              tone="success"
            />
          ) : undefined
        }
      />

      {status === 'loading' ? <AppSkeleton label="Dokumente werden geladen" /> : null}

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
            description="Sobald Cogniiq Unterlagen für Sie freigibt, erscheinen sie hier. Sie müssen dafür keine E-Mails durchsuchen."
          />
        ) : (
          <div className="space-y-6">
            {availableCategories.length > 1 ? (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Nach Kategorie filtern">
                <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>
                  Alle ({documents.length})
                </FilterChip>
                {availableCategories.map((entry) => (
                  <FilterChip key={entry} active={category === entry} onClick={() => setCategory(entry)}>
                    {customerDocumentCategoryLabels[entry]} (
                    {documents.filter((doc) => doc.category === entry).length})
                  </FilterChip>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              {visible.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        )
      ) : null}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-9 rounded-xl border px-3.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
        active
          ? 'border-gray-950 bg-gray-950 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950',
      )}
    >
      {children}
    </button>
  );
}

export default DocumentsPage;
