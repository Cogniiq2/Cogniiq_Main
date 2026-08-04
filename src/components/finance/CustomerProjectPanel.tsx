import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, FolderKanban, Plus, Trash2, Upload } from 'lucide-react';

import {
  Button, Card, ConfirmDialog, EmptyState, Field, InfoBanner, Modal, SectionHeader,
  Select, StatusBadge, Textarea, useToast,
} from '@/components/dashboard';
import {
  archiveCustomerDocument,
  archiveCustomerProject,
  assignInvoiceOrganization,
  createCustomerMilestone,
  createCustomerProject,
  createCustomerProjectForOrganization,
  CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES,
  CUSTOMER_UPLOAD_CATEGORIES,
  CUSTOMER_UPLOAD_MAX_BYTES,
  customerUploadContentTypeLabels,
  deleteCustomerMilestone,
  linkProjectInvoice,
  loadCustomerInvoiceCandidates,
  loadLinkedProjectInvoices,
  loadOwnerCustomerProjects,
  loadOwnerProjectDocuments,
  loadOwnerProjectMilestones,
  setCustomerDocumentVisibility,
  setCustomerProjectNextAction,
  unlinkProjectInvoice,
  updateCustomerMilestone,
  updateCustomerProject,
  uploadCustomerDocument,
  type OwnerCustomerDocument,
  type OwnerCustomerMilestone,
  type OwnerCustomerProject,
  type OwnerInvoiceCandidate,
  type OwnerLinkedInvoice,
} from '@/lib/customerPlatform/ownerProjectsApi';
import {
  customerDocumentCategoryLabels,
  customerMilestoneStatusLabels,
  customerProjectStatusLabels,
  type CustomerDocumentCategory,
  type CustomerMilestoneStatus,
  type CustomerProjectStatus,
} from '@/lib/customerPlatform/types';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { invoiceStatusText } from '@/lib/ownerFinance/customerLabels';

// Owner-side management of the CUSTOMER-VISIBLE project projection. This is the
// minimum needed to run the customer portal — deliberately NOT a second project
// management system. Internal planning stays in the CRM and the task checklist;
// everything edited here is what the customer will actually read.
//
// Two callers wire this in: the Owner Finance customer detail page (ownerCustomerId
// set, a CRM/owner_customers row exists) and the canonical /admin/clients Kundenportal
// tab (ownerCustomerId omitted — organizationId is the only tenant key, no CRM row
// required). Project creation picks the matching RPC; everything else is org-scoped
// already and needs no branching.

const STATUS_TONE: Record<CustomerProjectStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  on_track: 'success',
  attention_needed: 'warning',
  blocked: 'danger',
  completed: 'neutral',
  paused: 'neutral',
};

const MILESTONE_TONE: Record<CustomerMilestoneStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  upcoming: 'neutral',
  in_progress: 'warning',
  completed: 'success',
  delayed: 'danger',
  cancelled: 'neutral',
};

export function CustomerProjectPanel({
  ownerCustomerId,
  organizationId,
  clientAccountId,
}: {
  /**
   * Present only when this panel is reached via the Owner Finance CRM customer
   * detail page. Absent from the canonical /admin/clients Kundenportal tab, which
   * has no owner_customers row and must never gain one as a side effect of this
   * panel — project creation there goes through the organization-scoped RPC instead.
   */
  ownerCustomerId?: string | null;
  /** Null when the CRM customer has not been provisioned into a portal organization yet. */
  organizationId: string | null;
  /** Used to find invoices created before portal provisioning (organization_id still null). */
  clientAccountId: string | null;
}) {
  const toast = useToast();
  const [projects, setProjects] = useState<OwnerCustomerProject[]>([]);
  const [documents, setDocuments] = useState<OwnerCustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerCustomerProject | null>(null);

  // The full-list loading skeleton replaces every ProjectRow, which would silently
  // collapse any row the owner had expanded (e.g. right after uploading into it, just
  // before they need to click "Freigeben"). Only the INITIAL load shows the skeleton;
  // a reload after a mutation swaps the data in place and keeps rows expanded.
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    if (!hasLoadedOnce.current) setLoading(true);
    const [projectResult, documentResult] = await Promise.all([
      loadOwnerCustomerProjects(organizationId),
      loadOwnerProjectDocuments(organizationId),
    ]);
    setProjects(projectResult.data.filter((project) => !project.is_archived));
    setDocuments(documentResult.data);
    setLoading(false);
    hasLoadedOnce.current = true;
  }, [organizationId]);

  useEffect(() => { void load(); }, [load]);

  // A customer-visible project must be tenant-scoped, which requires a linked
  // organization. Rather than failing at save time, the action is disabled with a
  // clear explanation and a pointer to the actual prerequisite.
  if (!organizationId) {
    return (
      <Card className="p-5">
        <SectionHeader
          title="Kundenprojekt"
          description="Der im Kundenportal sichtbare Projektstand."
        />
        <InfoBanner tone="warning" title="Kein Portalzugang vorhanden">
          Für diesen Kunden ist noch keine Organisation verknüpft. Ein kundensichtbares Projekt kann
          erst angelegt werden, wenn der Kunde über eine Einladung für das Portal freigeschaltet wurde.
        </InfoBanner>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionHeader
        title="Kundenprojekt"
        description="Wird dem Kunden im Portal angezeigt. Interne Notizen, Budgets und Aufgaben bleiben hier außen vor."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={Upload}
              onClick={() => setUploadOpen(true)}
              disabled={projects.length === 0}
            >
              Dokument hochladen
            </Button>
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>Projekt anlegen</Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-[13px] text-gray-400">Projekte werden geladen …</p>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Noch kein kundensichtbares Projekt"
          description="Legen Sie ein Projekt an, damit der Kunde Status, nächste Schritte und Meilensteine im Portal sieht. Ein Dokumenten-Upload setzt ein Projekt voraus."
        />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              documents={documents.filter((doc) => doc.project_id === project.id)}
              clientAccountId={clientAccountId}
              onEdit={() => setEditing(project)}
              onChanged={() => void load()}
            />
          ))}
        </div>
      )}

      {createOpen ? (
        <CreateProjectDialog
          ownerCustomerId={ownerCustomerId ?? null}
          organizationId={organizationId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); void load(); toast.success('Projekt angelegt', 'Der Kunde sieht das Projekt jetzt im Portal.'); }}
        />
      ) : null}

      {editing ? (
        <EditProjectDialog
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); toast.success('Projekt aktualisiert', 'Die Änderungen sind im Kundenportal sichtbar.'); }}
        />
      ) : null}

      {uploadOpen ? (
        <UploadDocumentDialog
          organizationId={organizationId}
          projects={projects}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            setUploadOpen(false);
            void load();
            toast.success(
              'Dokument hochgeladen',
              'Das Dokument ist noch nicht für den Kunden sichtbar. Geben Sie es über „Freigeben“ frei.',
            );
          }}
        />
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------- project row
function ProjectRow({
  project,
  documents,
  clientAccountId,
  onEdit,
  onChanged,
}: {
  project: OwnerCustomerProject;
  documents: OwnerCustomerDocument[];
  clientAccountId: string | null;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const confirmArchive = async () => {
    const { error } = await archiveCustomerProject(project.id);
    setArchiveOpen(false);
    if (error) { toast.error('Archivieren fehlgeschlagen', error); return; }
    toast.success('Projekt archiviert', 'Das Projekt ist im Kundenportal nicht mehr sichtbar.');
    onChanged();
  };

  return (
    <div className="rounded-card border border-gray-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[14px] font-semibold text-gray-950">{project.title}</h4>
            <StatusBadge
              label={customerProjectStatusLabels[project.status]}
              tone={STATUS_TONE[project.status]}
            />
          </div>
          <p className="mt-1 text-[12.5px] text-gray-500 [overflow-wrap:anywhere]">{project.business_objective}</p>
          <p className="mt-1 text-[12px] text-gray-400">
            Phase {project.phase} · {project.progress_percent}%
            {project.target_date ? ` · Ziel ${formatDateDe(project.target_date)}` : ''}
          </p>
          {project.next_action_summary ? (
            <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-[12.5px] text-gray-700">
              <span className="font-semibold">
                {project.next_action_owner === 'customer' ? 'Kunde: ' : 'Cogniiq: '}
              </span>
              {project.next_action_summary}
              {project.next_action_due_date ? ` (bis ${formatDateDe(project.next_action_due_date)})` : ''}
            </p>
          ) : null}
        </div>
        {/* "Meilensteine & Dokumente" is 238px on its own; refusing to shrink pushed the
            Kundenportal tab 28px past a 390px viewport. Wraps instead of overflowing. */}
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button variant="secondary" onClick={onEdit}>Bearbeiten</Button>
          <Button variant="ghost" onClick={() => setExpanded((open) => !open)}>
            {expanded ? 'Weniger' : 'Meilensteine & Dokumente'}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-5 border-t border-hairline pt-4">
          <MilestoneEditor projectId={project.id} />
          <DocumentVisibilityList documents={documents} onChanged={onChanged} />
          <InvoiceLinkingSection
            projectId={project.id}
            organizationId={project.organization_id}
            clientAccountId={clientAccountId}
          />
          <div>
            <Button variant="ghost" onClick={() => setArchiveOpen(true)}>Projekt archivieren</Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => void confirmArchive()}
        title="Projekt archivieren?"
        message="Das Projekt verschwindet aus dem Kundenportal. Dokumente und Rechnungen bleiben unverändert erhalten."
        confirmLabel="Archivieren"
      />
    </div>
  );
}

// ---------------------------------------------------------------- milestones
function MilestoneEditor({ projectId }: { projectId: string }) {
  const toast = useToast();
  const [milestones, setMilestones] = useState<OwnerCustomerMilestone[]>([]);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await loadOwnerProjectMilestones(projectId);
    setMilestones(data);
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await createCustomerMilestone({
      projectId,
      title: title.trim(),
      description: null,
      targetDate: targetDate || null,
      sortOrder: milestones.length,
    });
    setBusy(false);
    if (error) { toast.error('Meilenstein konnte nicht angelegt werden', error); return; }
    setTitle(''); setTargetDate('');
    await load();
  };

  const changeStatus = async (milestone: OwnerCustomerMilestone, status: CustomerMilestoneStatus) => {
    // completed_at is derived server-side from the status, never sent from here.
    const { error } = await updateCustomerMilestone({
      milestoneId: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status,
      targetDate: milestone.target_date,
      sortOrder: milestone.sort_order,
    });
    if (error) { toast.error('Status konnte nicht geändert werden', error); return; }
    await load();
  };

  const remove = async (milestoneId: string) => {
    const { error } = await deleteCustomerMilestone(milestoneId);
    if (error) { toast.error('Meilenstein konnte nicht gelöscht werden', error); return; }
    await load();
  };

  return (
    <div>
      <h5 className="mb-3 text-[13px] font-semibold text-gray-950">Meilensteine</h5>
      {milestones.length === 0 ? (
        <p className="mb-3 text-[12.5px] text-gray-400">Noch keine Meilensteine.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex flex-col gap-2 rounded-xl border border-hairline px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              {/* flex-1 only applies from sm: up — at narrow widths this stacks in its own
                  row instead of sharing a flex-wrap line with the controls below, which
                  previously squeezed a flex-basis:0% item to a near-zero width column
                  (one character per line) whenever the controls alone exceeded the row. */}
              <span className="min-w-0 text-[13px] text-gray-800 [overflow-wrap:anywhere] sm:flex-1">
                {milestone.title}
                {milestone.target_date ? (
                  <span className="text-gray-400"> · {formatDateDe(milestone.target_date)}</span>
                ) : null}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={customerMilestoneStatusLabels[milestone.status]}
                  tone={MILESTONE_TONE[milestone.status]}
                />
                <Select
                  id={`milestone-status-${milestone.id}`}
                  value={milestone.status}
                  onChange={(value) => void changeStatus(milestone, value as CustomerMilestoneStatus)}
                  options={Object.entries(customerMilestoneStatusLabels).map(([value, label]) => ({ value, label }))}
                />
                <Button variant="ghost" icon={Trash2} onClick={() => void remove(milestone.id)}>Löschen</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
        <Field id={`milestone-title-${projectId}`} value={title} onChange={setTitle} placeholder="Neuer Meilenstein" />
        <Field id={`milestone-date-${projectId}`} type="date" value={targetDate} onChange={setTargetDate} />
        <Button icon={Plus} onClick={() => void add()} disabled={busy || !title.trim()}>Hinzufügen</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- documents
function DocumentVisibilityList({
  documents,
  onChanged,
}: {
  documents: OwnerCustomerDocument[];
  onChanged: () => void;
}) {
  const toast = useToast();

  const toggle = async (doc: OwnerCustomerDocument) => {
    const { error } = await setCustomerDocumentVisibility(doc.id, !doc.customer_visible);
    if (error) { toast.error('Sichtbarkeit konnte nicht geändert werden', error); return; }
    toast.success(
      doc.customer_visible ? 'Nicht mehr sichtbar' : 'Für den Kunden freigegeben',
      doc.customer_visible
        ? 'Das Dokument ist im Kundenportal nicht mehr abrufbar.'
        : 'Das Dokument ist jetzt im Kundenportal abrufbar.',
    );
    onChanged();
  };

  const archive = async (doc: OwnerCustomerDocument) => {
    const { error } = await archiveCustomerDocument(doc.id);
    if (error) { toast.error('Archivieren fehlgeschlagen', error); return; }
    onChanged();
  };

  const active = documents.filter((doc) => !doc.archived_at);

  return (
    <div>
      <h5 className="mb-3 text-[13px] font-semibold text-gray-950">Dokumente</h5>
      {active.length === 0 ? (
        <p className="text-[12.5px] text-gray-400">
          Noch keine Dokumente für dieses Projekt. Angebote, Annahmebestätigungen und Rechnungen
          werden aus dem jeweiligen Beleg heraus veröffentlicht.
        </p>
      ) : (
        <ul className="space-y-2">
          {active.map((doc) => (
            <li key={doc.id} className="flex flex-col gap-2 rounded-xl border border-hairline px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 text-[13px] text-gray-800 [overflow-wrap:anywhere] sm:flex-1">
                {doc.title}
                <span className="text-gray-400"> · {customerDocumentCategoryLabels[doc.category]}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={doc.customer_visible ? 'Sichtbar' : 'Nicht freigegeben'}
                  tone={doc.customer_visible ? 'success' : 'neutral'}
                />
                <Button
                  variant="ghost"
                  icon={doc.customer_visible ? EyeOff : Eye}
                  onClick={() => void toggle(doc)}
                >
                  {doc.customer_visible ? 'Verbergen' : 'Freigeben'}
                </Button>
                <Button variant="ghost" onClick={() => void archive(doc)}>Archivieren</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- invoices
function InvoiceLinkingSection({
  projectId,
  organizationId,
  clientAccountId,
}: {
  projectId: string;
  organizationId: string;
  clientAccountId: string | null;
}) {
  const toast = useToast();
  const [linked, setLinked] = useState<OwnerLinkedInvoice[]>([]);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<OwnerInvoiceCandidate[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadLinked = useCallback(async () => {
    const { data } = await loadLinkedProjectInvoices(projectId);
    setLinked(data);
  }, [projectId]);

  useEffect(() => { void loadLinked(); }, [loadLinked]);

  const openSearch = async () => {
    setSearching(true);
    const { data, error } = await loadCustomerInvoiceCandidates({ clientAccountId, organizationId });
    if (error) { toast.error('Rechnungen konnten nicht geladen werden', error); setSearching(false); return; }
    const linkedIds = new Set(linked.map((invoice) => invoice.invoice_id));
    setCandidates(data.filter((candidate) => !linkedIds.has(candidate.id)));
  };

  const link = async (invoiceId: string) => {
    setBusyId(invoiceId);
    const { error } = await linkProjectInvoice(projectId, invoiceId);
    setBusyId(null);
    if (error) { toast.error('Verknüpfen fehlgeschlagen', error); return; }
    toast.success('Rechnung verknüpft', 'Die Rechnung ist jetzt Teil dieses Projekts.');
    setCandidates(null);
    setSearching(false);
    await loadLinked();
  };

  // The real fix path for the null-organization gap: assign the missing
  // organization, then link in the same step. Never offered for an invoice that
  // already belongs to a DIFFERENT organization — that path has no fix button at
  // all, only an explanation, because reassigning it would be a data hazard.
  const assignAndLink = async (invoiceId: string) => {
    setBusyId(invoiceId);
    const { error: assignError } = await assignInvoiceOrganization(invoiceId, organizationId);
    if (assignError) { setBusyId(null); toast.error('Organisation konnte nicht zugewiesen werden', assignError); return; }
    const { error: linkError } = await linkProjectInvoice(projectId, invoiceId);
    setBusyId(null);
    if (linkError) { toast.error('Verknüpfen fehlgeschlagen', linkError); return; }
    toast.success('Organisation zugewiesen und verknüpft', 'Die Rechnung ist jetzt Teil dieses Projekts.');
    setCandidates(null);
    setSearching(false);
    await loadLinked();
  };

  const unlink = async (invoiceId: string) => {
    setBusyId(invoiceId);
    const { error } = await unlinkProjectInvoice(projectId, invoiceId);
    setBusyId(null);
    if (error) { toast.error('Trennen fehlgeschlagen', error); return; }
    await loadLinked();
  };

  return (
    <div>
      <h5 className="mb-3 text-[13px] font-semibold text-gray-950">Rechnungen</h5>

      {linked.length === 0 ? (
        <p className="mb-3 text-[12.5px] text-gray-400">Noch keine Rechnung mit diesem Projekt verknüpft.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {linked.map((invoice) => (
            <li key={invoice.invoice_id} className="flex flex-col gap-2 rounded-xl border border-hairline px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 text-[13px] text-gray-800 sm:flex-1">
                {invoice.invoice_number ?? 'Ohne Nummer'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={invoiceStatusText(invoice.status)} tone="neutral" />
                <Button
                  variant="ghost"
                  disabled={busyId === invoice.invoice_id}
                  onClick={() => void unlink(invoice.invoice_id)}
                >
                  Trennen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!searching ? (
        <Button variant="secondary" icon={Plus} onClick={() => void openSearch()}>Rechnung verknüpfen</Button>
      ) : (
        <div className="rounded-xl border border-gray-200 p-3">
          {candidates === null ? (
            <p className="text-[12.5px] text-gray-400">Rechnungen werden geladen …</p>
          ) : candidates.length === 0 ? (
            <p className="text-[12.5px] text-gray-400">Keine weiteren Rechnungen für diesen Kunden gefunden.</p>
          ) : (
            <ul className="space-y-2">
              {candidates.map((candidate) => (
                <InvoiceCandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  organizationId={organizationId}
                  busy={busyId === candidate.id}
                  onLink={() => void link(candidate.id)}
                  onAssignAndLink={() => void assignAndLink(candidate.id)}
                />
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Button variant="ghost" onClick={() => { setSearching(false); setCandidates(null); }}>Schließen</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceCandidateRow({
  candidate,
  organizationId,
  busy,
  onLink,
  onAssignAndLink,
}: {
  candidate: OwnerInvoiceCandidate;
  organizationId: string;
  busy: boolean;
  onLink: () => void;
  onAssignAndLink: () => void;
}) {
  const label = candidate.invoice_number ?? 'Ohne Nummer';

  // Case 1: already this project's organization — a normal link.
  if (candidate.organization_id === organizationId) {
    return (
      <li className="flex flex-col gap-2 rounded-xl border border-hairline px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 text-[13px] text-gray-800 sm:flex-1">{label} · {candidate.status}</span>
        <Button variant="secondary" disabled={busy} onClick={onLink}>Verknüpfen</Button>
      </li>
    );
  }

  // Case 2: no organization yet — the real, guarded fix path.
  if (candidate.organization_id === null) {
    return (
      <li className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
        <p className="text-[13px] text-gray-800">{label} · {candidate.status}</p>
        <p className="mt-1 text-[12px] leading-5 text-amber-800">
          Diese Rechnung ist keiner Organisation zugeordnet und kann daher nicht verknüpft oder für den
          Kunden freigegeben werden. Weisen Sie sie zuerst dieser Organisation zu.
        </p>
        <div className="mt-2">
          <Button variant="secondary" disabled={busy} onClick={onAssignAndLink}>
            Organisation zuweisen und verknüpfen
          </Button>
        </div>
      </li>
    );
  }

  // Case 3: belongs to a DIFFERENT organization — blocked, no fix offered here.
  return (
    <li className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 opacity-80">
      <p className="text-[13px] text-gray-600">{label} · {candidate.status}</p>
      <p className="mt-1 text-[12px] leading-5 text-gray-500">
        Diese Rechnung gehört zu einer anderen Organisation und kann diesem Kunden nicht zugewiesen werden.
      </p>
    </li>
  );
}

// ---------------------------------------------------------------- dialogs
function CreateProjectDialog({
  ownerCustomerId,
  organizationId,
  onClose,
  onCreated,
}: {
  /** When set, creates through the owner_customers-scoped RPC (Owner Finance page). */
  ownerCustomerId: string | null;
  /** Always required as a fallback: the organization-scoped RPC (Kundenportal tab). */
  organizationId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [phase, setPhase] = useState('Konzept');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !objective.trim() || !phase.trim()) return;
    setBusy(true);
    const { error } = ownerCustomerId
      ? await createCustomerProject({
        ownerCustomerId,
        title: title.trim(),
        businessObjective: objective.trim(),
        phase: phase.trim(),
      })
      : await createCustomerProjectForOrganization({
        organizationId,
        title: title.trim(),
        businessObjective: objective.trim(),
        phase: phase.trim(),
      });
    setBusy(false);
    if (error) { toast.error('Projekt konnte nicht angelegt werden', error); return; }
    onCreated();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Kundenprojekt anlegen"
      description="Diese Angaben sieht der Kunde im Portal. Formulieren Sie sie in Kundensprache."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => void submit()} disabled={busy || !title.trim() || !objective.trim()}>
            Anlegen
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field id="cp-title" label="Projekttitel" value={title} onChange={setTitle} required
          placeholder="z. B. Telefonassistent Rollout" />
        <Textarea id="cp-objective" label="Geschäftsziel" value={objective} onChange={setObjective}
          placeholder="Was erreicht der Kunde damit? Ein Satz in Kundensprache."
          hint="Wird dem Kunden direkt unter dem Projekttitel angezeigt." />
        <Field id="cp-phase" label="Phase" value={phase} onChange={setPhase} required
          placeholder="z. B. Konzept, Umsetzung, Test, Go-Live" />
      </div>
    </Modal>
  );
}

function EditProjectDialog({
  project,
  onClose,
  onSaved,
}: {
  project: OwnerCustomerProject;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(project.title);
  const [objective, setObjective] = useState(project.business_objective);
  const [phase, setPhase] = useState(project.phase);
  const [status, setStatus] = useState<CustomerProjectStatus>(project.status);
  const [progress, setProgress] = useState(String(project.progress_percent));
  const [startDate, setStartDate] = useState(project.start_date ?? '');
  const [targetDate, setTargetDate] = useState(project.target_date ?? '');
  const [blocker, setBlocker] = useState(project.customer_safe_blocker_summary ?? '');
  const [contactRole, setContactRole] = useState(project.contact_role_label ?? '');
  const [contactEmail, setContactEmail] = useState(project.contact_business_email ?? '');
  const [actionSummary, setActionSummary] = useState(project.next_action_summary ?? '');
  const [actionOwner, setActionOwner] = useState<'customer' | 'cogniiq'>(project.next_action_owner ?? 'cogniiq');
  const [actionDue, setActionDue] = useState(project.next_action_due_date ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await updateCustomerProject({
      projectId: project.id,
      title: title.trim(),
      businessObjective: objective.trim(),
      phase: phase.trim(),
      status,
      progressPercent: Math.max(0, Math.min(100, Number(progress) || 0)),
      startDate: startDate || null,
      targetDate: targetDate || null,
      blockerSummary: blocker.trim() || null,
      // The contact profile itself is set elsewhere; the role label and business
      // address are curated here and are what the customer actually sees.
      contactProfileId: project.contact_profile_id,
      contactRoleLabel: contactRole.trim() || null,
      contactBusinessEmail: contactEmail.trim() || null,
    });
    if (error) { setBusy(false); toast.error('Speichern fehlgeschlagen', error); return; }

    const summary = actionSummary.trim();
    const { error: actionError } = await setCustomerProjectNextAction({
      projectId: project.id,
      summary: summary || null,
      owner: summary ? actionOwner : null,
      dueDate: summary ? (actionDue || null) : null,
    });
    setBusy(false);
    if (actionError) { toast.error('Nächste Aktion konnte nicht gespeichert werden', actionError); return; }
    onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Kundenprojekt bearbeiten"
      description="Alle Felder sind für den Kunden sichtbar."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => void submit()} disabled={busy || !title.trim() || !objective.trim()}>Speichern</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field id="ep-title" label="Projekttitel" value={title} onChange={setTitle} required />
        <Textarea id="ep-objective" label="Geschäftsziel" value={objective} onChange={setObjective} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ep-phase" label="Phase" value={phase} onChange={setPhase} required />
          <Select id="ep-status" label="Status" value={status}
            onChange={(value) => setStatus(value as CustomerProjectStatus)}
            options={Object.entries(customerProjectStatusLabels).map(([value, label]) => ({ value, label }))} />
          <Field id="ep-progress" label="Fortschritt (%)" type="number" min="0" step="5"
            value={progress} onChange={setProgress} />
          <Field id="ep-start" label="Startdatum" type="date" value={startDate} onChange={setStartDate} />
          <Field id="ep-target" label="Zieltermin" type="date" value={targetDate} onChange={setTargetDate} />
        </div>

        <Textarea id="ep-blocker" label="Blockade (kundensicher)" value={blocker} onChange={setBlocker}
          hint="Nur kundensichere Formulierungen. Interne Ursachen, Namen oder Kosten gehören nicht hierher." />

        <div className="rounded-card border border-gray-200 p-4">
          <h5 className="mb-3 text-[13px] font-semibold text-gray-950">Nächste Aktion</h5>
          <div className="space-y-3">
            <Field id="ep-action" label="Beschreibung" value={actionSummary} onChange={setActionSummary}
              placeholder="z. B. Bitte Logo als Vektordatei bereitstellen"
              hint="Leer lassen, wenn aktuell keine Aktion ansteht. Verantwortung und Frist werden dann ebenfalls entfernt." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select id="ep-action-owner" label="Verantwortung" value={actionOwner}
                onChange={(value) => setActionOwner(value as 'customer' | 'cogniiq')}
                disabled={!actionSummary.trim()}
                options={[
                  { value: 'customer', label: 'Kunde' },
                  { value: 'cogniiq', label: 'Cogniiq' },
                ]} />
              <Field id="ep-action-due" label="Frist" type="date" value={actionDue} onChange={setActionDue}
                disabled={!actionSummary.trim()} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ep-contact-role" label="Rolle des Ansprechpartners" value={contactRole} onChange={setContactRole}
            placeholder="z. B. Ihr Ansprechpartner" />
          <Field id="ep-contact-email" label="Geschäftliche Kontaktadresse" type="email"
            value={contactEmail} onChange={setContactEmail}
            hint="Bewusst separat gepflegt — die private Profil-E-Mail wird nie automatisch angezeigt." />
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- upload
const ALLOWED_TYPES_HINT = CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES
  .map((type) => customerUploadContentTypeLabels[type] ?? type)
  .join(', ');
const MAX_SIZE_MIB = Math.round(CUSTOMER_UPLOAD_MAX_BYTES / (1024 * 1024));

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a customer document through the ONE controlled server-side flow
 * (uploadCustomerDocument -> Edge Function). This dialog never touches Storage
 * directly. Project, category, title and file are all required; the uploaded
 * document always starts unpublished — making it visible to the customer is the
 * separate, explicit "Freigeben" action in the document list below.
 */
function UploadDocumentDialog({
  organizationId,
  projects,
  onClose,
  onUploaded,
}: {
  organizationId: string;
  projects: OwnerCustomerProject[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [category, setCategory] = useState<CustomerDocumentCategory>(CUSTOMER_UPLOAD_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeAllowed = !file || (CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES as readonly string[]).includes(file.type);
  const sizeAllowed = !file || file.size <= CUSTOMER_UPLOAD_MAX_BYTES;
  const fileError = file && !typeAllowed
    ? `Dateityp „${file.type || 'unbekannt'}“ wird nicht unterstützt. Erlaubt: ${ALLOWED_TYPES_HINT}.`
    : file && !sizeAllowed
      ? `Die Datei ist ${formatBytes(file.size)} groß. Erlaubt sind maximal ${MAX_SIZE_MIB} MB.`
      : null;

  const canSubmit = Boolean(projectId) && Boolean(category) && title.trim().length > 0
    && Boolean(file) && typeAllowed && sizeAllowed && !busy;

  const submit = async () => {
    if (!file || !projectId) return;
    setBusy(true);
    setError(null);
    const { error: uploadError } = await uploadCustomerDocument({
      organizationId,
      projectId,
      category,
      title: title.trim(),
      file,
    });
    setBusy(false);
    if (uploadError) { setError(uploadError); return; }
    onUploaded();
  };

  const clearFile = () => { setFile(null); setFileInputKey((k) => k + 1); };

  return (
    <Modal
      open
      onClose={onClose}
      title="Dokument hochladen"
      description="Der Upload läuft ausschließlich über den kontrollierten Server-Prozess. Das Dokument ist danach noch NICHT für den Kunden sichtbar."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => void submit()} disabled={!canSubmit}>
            {busy ? 'Wird hochgeladen …' : error ? 'Erneut versuchen' : 'Hochladen'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <InfoBanner tone="danger" title="Upload fehlgeschlagen">
            {error}
          </InfoBanner>
        ) : null}

        <Select
          id="doc-project"
          label="Projekt"
          required
          value={projectId}
          onChange={setProjectId}
          disabled={busy}
          options={projects.map((project) => ({ value: project.id, label: project.title }))}
        />
        <Select
          id="doc-category"
          label="Kategorie"
          required
          value={category}
          onChange={(value) => setCategory(value as CustomerDocumentCategory)}
          disabled={busy}
          options={CUSTOMER_UPLOAD_CATEGORIES.map((value) => ({
            value,
            label: customerDocumentCategoryLabels[value],
          }))}
          hint="Angebote, Annahmebestätigungen und Rechnungen werden nicht hier hochgeladen, sondern aus dem jeweiligen Beleg veröffentlicht."
        />
        <Field id="doc-title" label="Titel" required value={title} onChange={setTitle} disabled={busy}
          placeholder="z. B. Projektkonzept v1" />

        <div>
          <label htmlFor="doc-file" className="mb-1.5 block text-[12px] font-semibold text-gray-600">
            Datei <span className="text-red-500">*</span>
          </label>
          <input
            key={fileInputKey}
            id="doc-file"
            type="file"
            disabled={busy}
            accept={CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES.join(',')}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-[13px] text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-950 file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-white hover:file:bg-gray-800"
          />
          {file ? (
            <p className="mt-1 flex items-center gap-2 text-[11.5px] text-gray-500">
              {file.name} · {formatBytes(file.size)}
              <button type="button" onClick={clearFile} className="font-semibold text-gray-600 underline">Entfernen</button>
            </p>
          ) : null}
          {fileError ? (
            <p className="mt-1 text-[12px] text-red-600">{fileError}</p>
          ) : (
            <p className="mt-1 text-[11.5px] text-gray-400">
              Erlaubte Dateitypen: {ALLOWED_TYPES_HINT}. Maximale Größe: {MAX_SIZE_MIB} MB.
            </p>
          )}
        </div>

        <InfoBanner tone="info" title="Noch nicht sichtbar für den Kunden">
          Hochgeladene Dokumente starten unveröffentlicht. Geben Sie das Dokument danach in der Liste
          explizit über „Freigeben“ frei.
        </InfoBanner>
      </div>
    </Modal>
  );
}
