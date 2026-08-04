import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, EyeOff, Link2, RefreshCw, Share2 } from 'lucide-react';

import {
  Button, Card, InfoBanner, PremiumCombobox, SectionHeader, StatusBadge,
} from '@/components/dashboard';
import {
  customerCategoryForOwnerDocument,
  customerDocumentCategoryLabels,
  loadOwnerCustomerProjects,
  loadOwnerProjectDocuments,
  publishOwnerDocumentToCustomer,
  setCustomerDocumentVisibility,
  type OwnerCustomerDocument,
  type OwnerCustomerProject,
} from '@/lib/customerPlatform/ownerProjectsApi';
import { customerProjectStatusLabels } from '@/lib/customerPlatform/types';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { OwnerGeneratedDocument } from '@/lib/ownerFinance/types';

// Owner-side publication control for a commercial document's canonical PDFs.
//
// WHAT THIS DOES NOT DO: it never copies, re-renders or re-uploads a PDF. Publishing
// registers a POINTER to the one canonical object in the owner-only bucket via
// publishOwnerDocumentToCustomer(); the customer downloads that exact object through
// the download Edge Function. There is never a second copy of an invoice or offer.
//
// The three actions are deliberately separate rather than one "publish" button:
//   * "Für Kundenportal registrieren" makes the document KNOWN to the portal, still
//     invisible. Safe, reversible, and the step that can fail on validation.
//   * "Für Kunden freigeben" is the moment the customer can actually see and download
//     it. That is the consequential act and it gets its own confirmation-free but
//     clearly-labelled button.
//   * "Freigabe zurücknehmen" withdraws visibility while keeping the record and its
//     audit trail. published_at latches server-side, so "was this ever visible?" stays
//     answerable.

type ActionKey = string;

interface PublishState {
  projects: OwnerCustomerProject[];
  documents: OwnerCustomerDocument[];
}

export function CustomerPortalPublishCard({
  organizationId,
  sourceType,
  sourceLabel,
  documentTitle,
  generatedDocuments,
  hasUnsavedFinalizable,
}: {
  /** Null when the commercial document has no organization yet — publishing is impossible. */
  organizationId: string | null;
  sourceType: 'owner_offers' | 'owner_invoices';
  /** e.g. "RE-2026-0002" — used in the default customer-facing title. */
  sourceLabel: string;
  /** e.g. "Rechnung" / "Angebot" — the noun used in the default title. */
  documentTitle: string;
  generatedDocuments: OwnerGeneratedDocument[];
  /**
   * True when the owner could produce a finalized PDF right now but has not. Drives the
   * "PDF speichern first" explanation instead of an empty card.
   */
  hasUnsavedFinalizable: boolean;
}) {
  const [state, setState] = useState<PublishState>({ projects: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');

  // Only finalized PDFs that actually have stored bytes can be published. A finalized
  // row with pdf_storage_path null would create a customer document the download
  // function can never resolve, so it is not offered.
  const publishable = useMemo(
    () => generatedDocuments.filter(
      (d) => d.status === 'finalized'
        && d.pdf_storage_path
        && d.archived_at === null
        && customerCategoryForOwnerDocument(d) !== null,
    ),
    [generatedDocuments],
  );

  const load = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    const [projectsResult, documentsResult] = await Promise.all([
      loadOwnerCustomerProjects(organizationId),
      loadOwnerProjectDocuments(organizationId),
    ]);
    if (projectsResult.error || documentsResult.error) {
      setLoadError(projectsResult.error ?? documentsResult.error);
      setLoading(false);
      return;
    }
    setLoadError(null);
    setState({ projects: projectsResult.data, documents: documentsResult.data });
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void load(); }, [load]);

  // Archived projects are excluded because the database refuses them. `completed` and
  // `paused` are deliberately KEPT: a final invoice for a finished project is an
  // ordinary thing to publish, and hiding those projects would leave the owner with no
  // way to file it. The status is shown in the option label so the choice is informed.
  const activeProjects = useMemo(
    () => state.projects.filter((p) => !p.is_archived),
    [state.projects],
  );

  // Preselect the single obvious project so the common case is one click. With several,
  // nothing is preselected: silently filing a customer's invoice under an arbitrary
  // project would be a guess presented as a decision.
  useEffect(() => {
    if (!projectId && activeProjects.length === 1) setProjectId(activeProjects[0].id);
  }, [activeProjects, projectId]);

  /** The live customer pointer for a canonical PDF, if one exists. */
  const pointerFor = useCallback(
    (generatedId: string): OwnerCustomerDocument | null =>
      state.documents.find(
        (d) => d.owner_generated_document_id === generatedId && d.archived_at === null,
      ) ?? null,
    [state.documents],
  );

  const projectNameOf = useCallback(
    (id: string | null): string | null => state.projects.find((p) => p.id === id)?.title ?? null,
    [state.projects],
  );

  const run = async (key: ActionKey, fn: () => Promise<string | null>, successMessage: string) => {
    setBusy(key);
    setActionError(null);
    setActionSuccess(null);
    try {
      const error = await fn();
      if (error) { setActionError(error); return; }
      setActionSuccess(successMessage);
      await load();
    } catch (e: unknown) {
      console.error('[CustomerPortalPublishCard] action failed:', e);
      setActionError('Die Aktion ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setBusy(null);
    }
  };

  const register = (doc: OwnerGeneratedDocument) => {
    const category = customerCategoryForOwnerDocument(doc);
    if (!category || !organizationId) return;
    return run(`register-${doc.id}`, async () => {
      const { error } = await publishOwnerDocumentToCustomer({
        organizationId,
        projectId: projectId || null,
        category,
        title: `${documentTitle} ${sourceLabel}`.trim(),
        ownerGeneratedDocumentId: doc.id,
      });
      return error;
    }, 'Für das Kundenportal registriert. Noch nicht für den Kunden sichtbar.');
  };

  const release = (pointer: OwnerCustomerDocument) =>
    run(`release-${pointer.id}`, async () => {
      const { error } = await setCustomerDocumentVisibility(pointer.id, true);
      return error;
    }, 'Für den Kunden freigegeben. Das Dokument ist jetzt im Kundenportal abrufbar.');

  const revoke = (pointer: OwnerCustomerDocument) =>
    run(`revoke-${pointer.id}`, async () => {
      const { error } = await setCustomerDocumentVisibility(pointer.id, false);
      return error;
    }, 'Freigabe zurückgenommen. Das Dokument ist nicht mehr im Kundenportal abrufbar.');

  // ---- Blocking states, each with the actual next step rather than a bare notice ----

  if (!organizationId) {
    return (
      <Card className="p-6">
        <SectionHeader title="Kundenportal" />
        <InfoBanner tone="warning" title="Keine Organisation zugeordnet">
          Dieser Beleg ist noch keinem Kunden-Workspace zugeordnet, daher kann er nicht im
          Kundenportal veröffentlicht werden. Bitte zuerst die Organisation zuweisen.
        </InfoBanner>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <SectionHeader title="Kundenportal" />
        <div aria-label="Veröffentlichungsstatus wird geladen" className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="p-6">
        <SectionHeader title="Kundenportal" />
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50/60 p-3">
          <p className="text-[13px] text-red-800">
            Der Veröffentlichungsstatus konnte nicht geladen werden.
          </p>
          <Button className="mt-3" size="sm" variant="secondary" icon={RefreshCw} onClick={() => void load()}>
            Erneut versuchen
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <SectionHeader
        title="Kundenportal"
        description="Veröffentlicht wird immer das kanonische PDF selbst — es wird nie kopiert oder erneut hochgeladen."
      />

      {publishable.length === 0 ? (
        <InfoBanner tone="warning" title="Noch kein finalisiertes PDF vorhanden">
          {hasUnsavedFinalizable
            ? 'Für das Kundenportal wird ein finalisiertes PDF benötigt. Bitte zuerst „PDF speichern“ — danach kann es hier registriert und freigegeben werden.'
            : 'Für das Kundenportal wird ein finalisiertes PDF benötigt. Sobald der Beleg finalisiert und über „PDF speichern“ erzeugt wurde, erscheint er hier.'}
        </InfoBanner>
      ) : (
        <>
          {activeProjects.length === 0 ? (
            <InfoBanner tone="warning" title="Kein Kundenprojekt vorhanden">
              Ohne Projekt erscheint das Dokument im Kundenportal ohne Projektzuordnung. Ein
              Projekt können Sie unter{' '}
              <Link className="underline" to={`/admin/clients/${organizationId}`}>Kunde → Kundenportal</Link>{' '}
              anlegen.
            </InfoBanner>
          ) : (
            <div className="mb-4">
              {/*
                Searchable, and the status moves out of the label into the muted second
                line: project titles are long enough that appending "(Aufmerksamkeit
                erforderlich)" pushed the actual title out of the trigger. The option
                values and the '' sentinel are unchanged, so the register payload is too.
              */}
              <PremiumCombobox
                id="publish-project"
                label="Kundenprojekt"
                value={projectId}
                onValueChange={setProjectId}
                placeholder="Ohne Projektzuordnung"
                searchPlaceholder="Projekt suchen …"
                emptyMessage="Kein Projekt gefunden."
                options={[
                  { value: '', label: 'Ohne Projektzuordnung' },
                  ...activeProjects.map((p) => ({
                    value: p.id,
                    label: p.title,
                    description: customerProjectStatusLabels[p.status] ?? undefined,
                    keywords: [p.status],
                  })),
                ]}
                description="Bestimmt, unter welchem Projekt der Kunde das Dokument sieht. Nach der Freigabe kann das Projekt nicht mehr gewechselt werden."
              />
            </div>
          )}

          <ul className="space-y-2">
            {publishable.map((doc) => {
              const pointer = pointerFor(doc.id);
              const category = customerCategoryForOwnerDocument(doc)!;
              const registerKey = `register-${doc.id}`;
              const releaseKey = pointer ? `release-${pointer.id}` : '';
              const revokeKey = pointer ? `revoke-${pointer.id}` : '';

              return (
                <li key={doc.id} className="rounded-xl border border-hairline p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-800">
                        v{doc.version} · {customerDocumentCategoryLabels[category] ?? category}
                        {doc.document_number ? ` · ${doc.document_number}` : ''}
                      </p>
                      <p className="mt-0.5 text-[12px] text-gray-500">
                        erzeugt {formatDateDe(doc.generated_at)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {!pointer ? (
                          <StatusBadge label="Nicht registriert" tone="neutral" />
                        ) : pointer.customer_visible ? (
                          <StatusBadge label="Für Kunden freigegeben" tone="success" />
                        ) : (
                          <StatusBadge label="Registriert, nicht freigegeben" tone="warning" />
                        )}
                        {pointer ? (
                          <span className="text-[12px] text-gray-500">
                            {pointer.project_id
                              ? `Projekt: ${projectNameOf(pointer.project_id) ?? 'unbekannt'}`
                              : 'ohne Projektzuordnung'}
                            {pointer.published_at && !pointer.customer_visible
                              ? ` · zuletzt freigegeben ${formatDateDe(pointer.published_at)}`
                              : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!pointer ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Link2}
                          onClick={() => void register(doc)}
                          loading={busy === registerKey}
                          disabled={busy !== null && busy !== registerKey}
                        >
                          Für Kundenportal registrieren
                        </Button>
                      ) : pointer.customer_visible ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={EyeOff}
                          onClick={() => void revoke(pointer)}
                          loading={busy === revokeKey}
                          disabled={busy !== null && busy !== revokeKey}
                        >
                          Freigabe zurücknehmen
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            icon={Share2}
                            onClick={() => void release(pointer)}
                            loading={busy === releaseKey}
                            disabled={busy !== null && busy !== releaseKey}
                          >
                            Für Kunden freigeben
                          </Button>
                          {/* Re-registering is how a not-yet-released document is moved to
                              another project; it can never create a second pointer. */}
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={RefreshCw}
                            onClick={() => void register(doc)}
                            loading={busy === registerKey}
                            disabled={busy !== null && busy !== registerKey}
                          >
                            Projekt übernehmen
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {actionError ? (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50/60 p-3">
          <p className="text-[13px] text-red-800">{actionError}</p>
          <Button className="mt-2" size="sm" variant="secondary" icon={RefreshCw} onClick={() => void load()}>
            Status neu laden
          </Button>
        </div>
      ) : null}

      {actionSuccess ? (
        <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-[13px] text-emerald-800">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {actionSuccess}
        </p>
      ) : null}

      <p className="mt-4 text-[12px] leading-relaxed text-gray-400">
        {sourceType === 'owner_invoices'
          ? 'Freigegebene Rechnungs-PDFs erscheinen im Kundenportal unter „Abrechnung“ und werden dort über einen kurzlebigen, geprüften Download-Link ausgeliefert.'
          : 'Freigegebene Angebots-PDFs erscheinen im Kundenportal unter „Dokumente“ und werden dort über einen kurzlebigen, geprüften Download-Link ausgeliefert.'}
      </p>
    </Card>
  );
}
