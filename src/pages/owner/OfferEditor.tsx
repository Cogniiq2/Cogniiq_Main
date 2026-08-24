// Reusable full-page offer editor for BOTH /admin/finance/offers/new and
// /admin/finance/offers/:offerId/edit. Loads an existing draft (values, positions, structured
// content, recipient snapshot), edits it in place with optimistic concurrency (no duplicate
// offers), warns before leaving with unsaved changes, and shows a premium live preview built from
// the SAME document model as the PDF. Finalisieren stays a separate explicit action.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Eye, FileCheck2, Loader2, Plus, Save, Trash2 } from 'lucide-react';

import {
  Button, Card, Checkbox, ConfirmDialog, Field, IconButton, InfoBanner, PageHeader, Select,
  SectionHeader, Tabs, Textarea, useToast,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { PremiumOfferPreview } from '@/pages/owner/PremiumOfferPreview';
import { PremiumPdfPreviewDialog } from '@/components/finance/PremiumPdfPreviewDialog';
import {
  loadOffer, createOffer, updateOfferDraft, loadDocumentSettings,
  type OfferLineInput, type OfferSectionsInput,
} from '@/lib/ownerFinance/offersApi';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { loadCustomers, linkOfferCustomer } from '@/lib/ownerFinance/customersApi';
import { customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import type { OwnerCustomerListRow } from '@/lib/ownerFinance/types';
import { buildRecipientName, buildGreetingLine } from '@/lib/ownerFinance/greeting';
import { computeInvoiceLine } from '@/lib/ownerFinance/tax';
import { offerToDocument, offerLinesToDocumentItems } from '@/lib/ownerFinance/buildTransactionalDoc';
import {
  computeOfferPricing, monthlyGroup, intervalSuffix, type OfferPricing,
} from '@/lib/ownerFinance/documents/offerPricing';
import { validateOfferForFinalization, documentFilename, type EditorSection } from '@/lib/ownerFinance/documents';
import { renderPremiumPdf } from '@/lib/ownerFinance/documents/premium';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerOffer, OwnerOfferLine, OwnerDocumentSettings } from '@/lib/ownerFinance/types';

const treatments = [
  { value: 'standard', label: 'Standard 19 %' }, { value: 'reduced', label: 'Ermäßigt 7 %' },
  { value: 'zero_rated', label: 'Nullsatz 0 %' }, { value: 'exempt', label: 'Steuerfrei (§4 UStG)' },
  { value: 'reverse_charge', label: 'Reverse Charge' }, { value: 'outside_scope', label: 'Nicht steuerbar' },
];
const units = [{ value: 'Pauschal', label: 'Pauschal' }, { value: 'Stück', label: 'Stück' }, { value: 'Std.', label: 'Stunden' }, { value: 'Tag', label: 'Tage' }, { value: 'Monat', label: 'Monate' }];

function rateFor(t: string): number { return t === 'reduced' ? 700 : t === 'standard' ? 1900 : 0; }
function toCents(input: string): number | null { const p = parseAmountToCents(input); return 'error' in p ? null : p.cents; }
/** Minimum term in whole months. Blank or non-positive means "no committed term". */
function parseTerm(input: string): number | null {
  const n = Math.round(Number(input.replace(',', '.')));
  return Number.isFinite(n) && n > 0 ? n : null;
}
const rid = () => Math.random().toString(36).slice(2);

const pricingTypes = [
  { value: 'one_time', label: 'Einmalig' }, { value: 'recurring', label: 'Wiederkehrend' },
];
const billingIntervals = [{ value: 'monthly', label: 'Monatlich' }];
const billingStarts = [
  { value: '', label: '— Kein Hinweis —' },
  { value: 'commissioning', label: 'Ab Inbetriebnahme' },
  { value: 'order', label: 'Ab Auftragserteilung' },
  { value: 'go_live', label: 'Ab Go-Live' },
  { value: 'handover', label: 'Ab Übergabe' },
  { value: 'custom', label: 'Eigener Text …' },
];

interface EditorLine {
  id: string; description: string; details: string; deliverables: string; phaseLabel: string; durationLabel: string;
  quantity: string; unit: string; unitPrice: string; treatment: string; optional: boolean;
  // Recurring pricing. `unitPrice` stays the price PER BILLING INTERVAL; the minimum term is
  // a contract fact and is deliberately not expressible as quantity.
  pricingType: 'one_time' | 'recurring';
  billingInterval: 'monthly';
  minimumTerm: string;
  billingStartType: '' | 'commissioning' | 'order' | 'go_live' | 'handover' | 'custom';
  billingStartLabel: string;
}
interface TimelineRow { id: string; phase: string; title: string; duration: string; description: string }
interface PaymentRow { id: string; label: string; percentage: string }

interface EditorState {
  customerId: string;
  ownerCustomerId: string;
  recipientSource: 'crm' | 'manual';
  rcompany: string; rcontact: string; rdepartment: string; rstreet: string; rpostal: string; rcity: string; rcountry: string; remail: string; rphone: string; rvat: string;
  rsalutation: '' | 'herr' | 'frau' | 'neutral'; rtitle: string; rfirstname: string; rlastname: string; rgreeting: string;
  title: string; subtitle: string; issueDate: string; validUntil: string;
  introduction: string; executiveSummary: string; projectApproach: string; scope: string;
  assumptions: string; exclusions: string; deliveryTerms: string; paymentTerms: string; nextSteps: string; internalNotes: string;
  desiredOutcomes: string;
  timeline: TimelineRow[];
  payment: PaymentRow[];
  lines: EditorLine[];
}

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

function newLine(): EditorLine {
  return {
    id: rid(), description: '', details: '', deliverables: '', phaseLabel: '', durationLabel: '',
    quantity: '1', unit: 'Pauschal', unitPrice: '', treatment: 'standard', optional: false,
    pricingType: 'one_time', billingInterval: 'monthly', minimumTerm: '', billingStartType: '', billingStartLabel: '',
  };
}
function emptyState(validityDays: number): EditorState {
  return {
    customerId: '', ownerCustomerId: '', recipientSource: 'manual',
    rcompany: '', rcontact: '', rdepartment: '', rstreet: '', rpostal: '', rcity: '', rcountry: 'DE', remail: '', rphone: '', rvat: '',
    rsalutation: '', rtitle: '', rfirstname: '', rlastname: '', rgreeting: '',
    title: '', subtitle: '', issueDate: today(), validUntil: plusDays(validityDays || 30),
    introduction: '', executiveSummary: '', projectApproach: '', scope: '',
    assumptions: '', exclusions: '', deliveryTerms: '', paymentTerms: '14 Tage netto', nextSteps: '', internalNotes: '',
    desiredOutcomes: '', timeline: [], payment: [],
    lines: [newLine()],
  };
}

function linesFrom(offerLines: OwnerOfferLine[]): EditorLine[] {
  if (offerLines.length === 0) return [newLine()];
  return offerLines.map((l) => ({
    id: rid(), description: l.description, details: l.details ?? '', deliverables: (l.deliverables ?? []).join('\n'),
    phaseLabel: l.phase_label ?? '', durationLabel: l.duration_label ?? '',
    quantity: String(l.quantity_milli / 1000), unit: l.unit, unitPrice: (l.unit_price_cents / 100).toString().replace('.', ','),
    treatment: l.vat_treatment, optional: l.is_optional,
    // A draft written before recurring pricing existed loads as one-time — its presentation
    // is never reinterpreted on the owner's behalf.
    pricingType: l.pricing_type === 'recurring' ? 'recurring' : 'one_time',
    billingInterval: l.billing_interval ?? 'monthly',
    minimumTerm: l.minimum_term_months != null ? String(l.minimum_term_months) : '',
    billingStartType: l.billing_start_type ?? '',
    billingStartLabel: l.billing_start_label ?? '',
  }));
}

function stateFromOffer(offer: OwnerOffer, offerLines: OwnerOfferLine[]): EditorState {
  return {
    customerId: offer.organization_id ?? '',
    ownerCustomerId: offer.owner_customer_id ?? '',
    recipientSource: offer.recipient_source ?? 'manual',
    rcompany: offer.recipient_company ?? '', rcontact: offer.recipient_contact_name ?? '', rdepartment: offer.recipient_department ?? '',
    rstreet: offer.recipient_street ?? '', rpostal: offer.recipient_postal_code ?? '', rcity: offer.recipient_city ?? '',
    rcountry: offer.recipient_country_code ?? 'DE', remail: offer.recipient_email ?? '', rphone: offer.recipient_phone ?? '', rvat: offer.recipient_vat_id ?? '',
    rsalutation: offer.recipient_salutation ?? '', rtitle: offer.recipient_title ?? '', rfirstname: offer.recipient_first_name ?? '',
    rlastname: offer.recipient_last_name ?? '', rgreeting: offer.recipient_greeting_name ?? '',
    title: offer.title ?? '', subtitle: offer.subtitle ?? '', issueDate: offer.issue_date ?? today(), validUntil: offer.valid_until ?? plusDays(30),
    introduction: offer.introduction ?? '', executiveSummary: offer.executive_summary ?? '', projectApproach: offer.project_approach ?? '', scope: offer.scope ?? '',
    assumptions: offer.assumptions ?? '', exclusions: offer.exclusions ?? '', deliveryTerms: offer.delivery_terms ?? '',
    paymentTerms: offer.payment_terms ?? '', nextSteps: offer.next_steps ?? '', internalNotes: offer.internal_notes ?? '',
    desiredOutcomes: (offer.desired_outcomes ?? []).join('\n'),
    timeline: (offer.timeline ?? []).map((t) => ({ id: rid(), phase: t.phase ?? '', title: t.title ?? '', duration: t.duration ?? '', description: t.description ?? '' })),
    payment: (offer.payment_schedule ?? []).map((p) => ({ id: rid(), label: p.label, percentage: p.percentage_bp != null ? String(p.percentage_bp / 100) : '' })),
    lines: linesFrom(offerLines),
  };
}

function splitLines(text: string): string[] { return text.split(/\n+/).map((s) => s.trim()).filter(Boolean); }

/** Auto-derived recipient display name from the greeting fields (gender never inferred). */
function derivedGreetingName(state: EditorState): string {
  return buildRecipientName({
    salutation: state.rsalutation, title: state.rtitle,
    firstName: state.rfirstname, lastName: state.rlastname,
  });
}

/** Synthesize the shared TransactionalDocument from editor state for preview + validation. */
function stateToDoc(state: EditorState, settings: OwnerDocumentSettings | null, entityName: string, isDraft: boolean): { doc: ReturnType<typeof offerToDocument>; pricing: OfferPricing } {
  const lines: OwnerOfferLine[] = state.lines.map((l, i) => {
    const price = toCents(l.unitPrice) ?? 0;
    const q = Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000);
    const calc = computeInvoiceLine(q, price, rateFor(l.treatment), l.treatment as never);
    const recurring = l.pricingType === 'recurring';
    return {
      id: l.id, offer_id: 'preview', description: l.description || 'Ohne Titel', details: l.details || null,
      deliverables: splitLines(l.deliverables), phase_label: l.phaseLabel || null, duration_label: l.durationLabel || null,
      quantity_milli: q, unit: l.unit, unit_price_cents: price, net_cents: calc.netCents, vat_rate_bp: rateFor(l.treatment),
      vat_treatment: l.treatment, vat_cents: calc.vatCents, gross_cents: calc.grossCents, is_optional: l.optional, sort_order: i,
      pricing_type: recurring ? 'recurring' : 'one_time',
      billing_interval: recurring ? l.billingInterval : null,
      minimum_term_months: recurring ? (parseTerm(l.minimumTerm) ?? null) : null,
      billing_start_type: recurring && l.billingStartType ? l.billingStartType : null,
      billing_start_label: recurring && l.billingStartType === 'custom' ? (l.billingStartLabel.trim() || null) : null,
    };
  });
  // The preview totals come from the SAME calculator the PDF and the customer portal use.
  const pricing = computeOfferPricing(offerLinesToDocumentItems(lines));
  const net = pricing.oneTime.netCents;
  const vat = pricing.oneTime.vatCents;
  const monthly = monthlyGroup(pricing);
  const offer: OwnerOffer = {
    id: 'preview', business_entity_id: '', organization_id: state.customerId || null, client_account_id: null, engagement_id: null,
    offer_number: null, status: isDraft ? 'draft' : 'finalized', title: state.title, issue_date: state.issueDate, valid_until: state.validUntil,
    currency: 'EUR', introduction: state.introduction || null, scope: state.scope || null, assumptions: state.assumptions || null,
    exclusions: state.exclusions || null, payment_terms: state.paymentTerms || null, delivery_terms: state.deliveryTerms || null, internal_notes: state.internalNotes || null,
    subtitle: state.subtitle || null, executive_summary: state.executiveSummary || null, project_approach: state.projectApproach || null, next_steps: state.nextSteps || null,
    desired_outcomes: splitLines(state.desiredOutcomes),
    timeline: state.timeline.map((t) => ({ phase: t.phase, title: t.title, duration: t.duration, description: t.description })),
    payment_schedule: state.payment.map((p) => ({ label: p.label, percentage_bp: Math.round((Number(p.percentage.replace(',', '.')) || 0) * 100) })),
    template_key: 'cogniiq-premium-offer-v2', recipient_source: state.recipientSource,
    recipient_company: state.rcompany || null, recipient_contact_name: state.rcontact || null, recipient_department: state.rdepartment || null,
    recipient_street: state.rstreet || null, recipient_postal_code: state.rpostal || null, recipient_city: state.rcity || null,
    recipient_country_code: state.rcountry || null, recipient_email: state.remail || null, recipient_phone: state.rphone || null, recipient_vat_id: state.rvat || null,
    recipient_salutation: (state.rsalutation || null) as OwnerOffer['recipient_salutation'], recipient_title: state.rtitle || null,
    recipient_first_name: state.rfirstname || null, recipient_last_name: state.rlastname || null, recipient_greeting_name: state.rgreeting || null,
    // Header totals mirror the server's split: the classic columns are one-time only.
    net_total_cents: net, vat_total_cents: vat, gross_total_cents: net + vat,
    recurring_monthly_net_cents: monthly?.netCents ?? 0,
    recurring_monthly_vat_cents: monthly?.vatCents ?? 0,
    recurring_monthly_gross_cents: monthly?.grossCents ?? 0,
    finalized_version: null,
    accepted_at: null, rejected_at: null, rejection_reason: null, expired_at: null, converted_invoice_id: null, converted_at: null,
    owner_customer_id: state.ownerCustomerId || null, archived_at: null, archived_by: null,
    created_at: '', updated_at: '',
  };
  return { doc: offerToDocument(offer, lines, settings, null, entityName), pricing };
}

function buildPayload(state: EditorState, entityId: string): { header: Record<string, unknown>; lines: OfferLineInput[]; sections: OfferSectionsInput } {
  const header: Record<string, unknown> = {
    business_entity_id: entityId, organization_id: state.customerId || null,
    title: state.title.trim(), subtitle: state.subtitle.trim() || null, issue_date: state.issueDate || null, valid_until: state.validUntil || null,
    introduction: state.introduction.trim() || null, executive_summary: state.executiveSummary.trim() || null,
    project_approach: state.projectApproach.trim() || null, scope: state.scope.trim() || null, next_steps: state.nextSteps.trim() || null,
    assumptions: state.assumptions.trim() || null, exclusions: state.exclusions.trim() || null, delivery_terms: state.deliveryTerms.trim() || null,
    payment_terms: state.paymentTerms.trim() || null, internal_notes: state.internalNotes.trim() || null,
    template_key: 'cogniiq-premium-offer-v2', recipient_source: state.recipientSource,
    recipient_company: state.rcompany.trim() || null, recipient_contact_name: state.rcontact.trim() || null, recipient_department: state.rdepartment.trim() || null,
    recipient_street: state.rstreet.trim() || null, recipient_postal_code: state.rpostal.trim() || null, recipient_city: state.rcity.trim() || null,
    recipient_country_code: state.rcountry.trim() || null, recipient_email: state.remail.trim() || null, recipient_phone: state.rphone.trim() || null, recipient_vat_id: state.rvat.trim() || null,
    recipient_salutation: state.rsalutation || null, recipient_title: state.rtitle.trim() || null,
    recipient_first_name: state.rfirstname.trim() || null, recipient_last_name: state.rlastname.trim() || null,
    // Freeze an explicit greeting name; fall back to the auto-derived one so the snapshot always has it.
    recipient_greeting_name: state.rgreeting.trim() || derivedGreetingName(state) || null,
  };
  const lines: OfferLineInput[] = state.lines
    .map((l, i) => ({
      description: l.description.trim(), details: l.details.trim() || null, deliverables: splitLines(l.deliverables),
      phase_label: l.phaseLabel.trim() || null, duration_label: l.durationLabel.trim() || null,
      quantity_milli: Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000), unit: l.unit,
      unit_price_cents: toCents(l.unitPrice) ?? 0, vat_rate_bp: rateFor(l.treatment), vat_treatment: l.treatment, is_optional: l.optional, sort_order: i,
      // Recurring metadata is only sent for recurring lines; the RPC drops it otherwise, so a
      // position switched back to "Einmalig" can never keep a stale minimum term.
      pricing_type: l.pricingType,
      billing_interval: l.pricingType === 'recurring' ? l.billingInterval : null,
      minimum_term_months: l.pricingType === 'recurring' ? (parseTerm(l.minimumTerm) ?? null) : null,
      billing_start_type: l.pricingType === 'recurring' && l.billingStartType ? l.billingStartType : null,
      billing_start_label: l.pricingType === 'recurring' && l.billingStartType === 'custom' ? (l.billingStartLabel.trim() || null) : null,
    }))
    .filter((l) => l.description.length > 0);
  const sections: OfferSectionsInput = {
    desired_outcomes: splitLines(state.desiredOutcomes),
    timeline: state.timeline.filter((t) => t.title.trim() || t.phase.trim()).map((t) => ({ phase: t.phase.trim(), title: t.title.trim(), duration: t.duration.trim(), description: t.description.trim() })),
    payment_schedule: state.payment.filter((p) => p.label.trim()).map((p) => ({ label: p.label.trim(), percentage_bp: Math.round((Number(p.percentage.replace(',', '.')) || 0) * 100) })),
  };
  return { header, lines, sections };
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
const sectionAnchor: Record<EditorSection, string> = {
  seller: 'sec-seller', recipient: 'sec-recipient', summary: 'sec-summary', positions: 'sec-positions',
  terms: 'sec-terms', schedule: 'sec-schedule', dates: 'sec-meta', meta: 'sec-meta',
};

export function OfferEditor() {
  const { offerId } = useParams<{ offerId: string }>();
  const isNew = !offerId;
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<EditorState | null>(null);
  const [settings, setSettings] = useState<OwnerDocumentSettings | null>(null);
  const [customers, setCustomers] = useState<Array<{ organizationId: string; legalName: string | null; name: string; contact: string | null; email: string | null; phone: string | null; address: string | null }>>([]);
  const [ownerCustomers, setOwnerCustomers] = useState<OwnerCustomerListRow[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [mobileTab, setMobileTab] = useState('edit');
  const [previewOpen, setPreviewOpen] = useState(false);
  const currentOfferId = useRef<string | null>(offerId ?? null);
  const expectedUpdatedAt = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [settingsRow, clients, ownerCusts] = await Promise.all([
        loadDocumentSettings(entity.id).catch(() => null),
        loadAdminClients().catch(() => []),
        loadCustomers(entity.id).catch(() => [] as OwnerCustomerListRow[]),
      ]);
      setSettings(settingsRow);
      setOwnerCustomers(ownerCusts);
      setCustomers(clients.map((c) => ({
        organizationId: c.organizationId, legalName: c.account?.legal_name ?? null, name: c.organizationName,
        contact: c.account?.primary_contact_name ?? null, email: c.account?.primary_email ?? null,
        phone: c.account?.phone ?? null, address: c.account?.address ?? null,
      })));
      if (offerId) {
        const res = await loadOffer(offerId);
        if (!res) { setError('Angebot nicht gefunden'); return; }
        if (res.offer.status !== 'draft') { setError('Nur Entwürfe können bearbeitet werden. Finalisierte Angebote ändern Sie über eine Revision.'); return; }
        currentOfferId.current = res.offer.id;
        expectedUpdatedAt.current = res.offer.updated_at;
        setState(stateFromOffer(res.offer, res.lines));
      } else {
        setState(emptyState(settingsRow?.default_offer_validity_days ?? 30));
      }
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity, offerId]);

  useEffect(() => { void load(); }, [load]);

  // Warn before leaving with unsaved changes (browser + refresh).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const patch = useCallback((p: Partial<EditorState>) => { setState((s) => (s ? { ...s, ...p } : s)); setDirty(true); setSaveState('idle'); }, []);
  const patchLine = useCallback((id: string, p: Partial<EditorLine>) => {
    setState((s) => (s ? { ...s, lines: s.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) } : s)); setDirty(true); setSaveState('idle');
  }, []);

  const doc = useMemo(() => (state ? stateToDoc(state, settings, entity?.display_name ?? 'Cogniiq', true) : null), [state, settings, entity]);
  const validation = useMemo(() => (doc ? validateOfferForFinalization(doc.doc) : null), [doc]);
  const renderPreview = useCallback(() => renderPremiumPdf(doc!.doc), [doc]);

  const applyCustomer = (organizationId: string) => {
    const c = customers.find((x) => x.organizationId === organizationId);
    if (!c) { patch({ customerId: '' }); return; }
    const addr = (c.address ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
    patch({
      customerId: organizationId, recipientSource: 'crm',
      rcompany: c.legalName ?? c.name, rcontact: c.contact ?? '', remail: c.email ?? '', rphone: c.phone ?? '',
      rstreet: addr[0] ?? '', rcity: addr[1] ?? '',
    });
  };

  const persist = async (): Promise<string | null> => {
    if (!state || !entity) return null;
    if (!state.title.trim()) { toast.error('Titel fehlt', 'Bitte geben Sie einen Angebotstitel ein.'); return null; }
    const { header, lines, sections } = buildPayload(state, entity.id);
    if (lines.filter((l) => !l.is_optional).length === 0) { toast.error('Position fehlt', 'Mindestens eine nicht-optionale Position ist erforderlich.'); return null; }
    setSaveState('saving');
    if (isNew && !currentOfferId.current) {
      const { id, error: err } = await createOffer(header, lines, sections);
      if (err || !id) { setSaveState('error'); toast.error('Speichern fehlgeschlagen', err ?? 'Unbekannt'); return null; }
      currentOfferId.current = id;
      // Re-read to capture updated_at for subsequent optimistic edits.
      const res = await loadOffer(id);
      expectedUpdatedAt.current = res?.offer.updated_at ?? null;
      await maybeLinkOwnerCustomer(id);
      setSaveState('saved'); setDirty(false);
      return id;
    }
    const oid = currentOfferId.current!;
    const { updatedAt, error: err } = await updateOfferDraft({ offerId: oid, expectedUpdatedAt: expectedUpdatedAt.current ?? '', header, lines, sections });
    if (err) {
      setSaveState('error');
      if (/stale|concurrent/i.test(err)) toast.error('Konflikt', 'Das Angebot wurde zwischenzeitlich geändert. Bitte neu laden.');
      else toast.error('Speichern fehlgeschlagen', err);
      return null;
    }
    expectedUpdatedAt.current = updatedAt;
    await maybeLinkOwnerCustomer(oid);
    setSaveState('saved'); setDirty(false);
    return oid;
  };

  // Best-effort link of the offer to the chosen owner customer. A link failure never blocks saving
  // the offer itself; the owner can re-link from the customer workspace.
  const maybeLinkOwnerCustomer = async (offerId: string) => {
    if (!state?.ownerCustomerId) return;
    await linkOfferCustomer(offerId, state.ownerCustomerId);
  };

  const save = async () => { const id = await persist(); if (id) toast.success('Gespeichert'); };
  // Save, then open the reliable in-app PDF preview dialog (same component as the detail page).
  const saveAndPreview = async () => { const id = await persist(); if (id) { toast.success('Gespeichert'); setPreviewOpen(true); } };
  const finalize = async () => {
    const id = await persist();
    if (!id) return;
    navigate(`/admin/finance/offers/${id}?finalize=1`);
  };

  const leave = useCallback(() => {
    navigate(currentOfferId.current ? `/admin/finance/offers/${currentOfferId.current}` : '/admin/finance/offers');
  }, [navigate]);

  /*
    window.confirm() rendered a raw browser dialog in the middle of the design
    system and could not describe what is at stake. The app's own ConfirmDialog
    does both, and keeps the destructive styling consistent with every other
    discard in the dashboard.
  */
  const back = () => {
    if (dirty) { setLeaveOpen(true); return; }
    leave();
  };

  if (loading) return <div className="space-y-4"><div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" /><div className="h-64 animate-pulse rounded-2xl bg-gray-100" /></div>;
  if (error) return <InfoBanner tone="warning" title="Angebot kann nicht bearbeitet werden">{error}</InfoBanner>;
  if (!state || !doc || !validation) return null;

  const saveBadge = saveState === 'saving' ? <span className="inline-flex items-center gap-1 text-[12px] text-gray-500"><Loader2 size={13} className="animate-spin" /> Speichern…</span>
    : saveState === 'saved' ? <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600"><Check size={13} /> Gespeichert</span>
    : saveState === 'error' ? <span className="text-[12px] text-red-600">Fehler beim Speichern</span>
    : dirty ? <span className="text-[12px] text-amber-600">Ungespeicherte Änderungen</span> : null;

  const editor = (
    <div className="space-y-5">
      <PreflightCard validation={validation} />

      <Card className="p-5" id={sectionAnchor.meta}>
        <SectionHeader title="Rahmendaten" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Angebotstitel" value={state.title} onChange={(v) => patch({ title: v })} required placeholder="Digitalisierung der Auftragsabwicklung" />
          <Field id="subtitle" label="Untertitel" value={state.subtitle} onChange={(v) => patch({ subtitle: v })} placeholder="Ein integriertes Betriebssystem …" />
          <Field id="issue" label="Angebotsdatum" type="date" value={state.issueDate} onChange={(v) => patch({ issueDate: v })} required />
          <Field id="valid" label="Gültig bis" type="date" value={state.validUntil} onChange={(v) => patch({ validUntil: v })} required />
        </div>
      </Card>

      <Card className="p-5" id={sectionAnchor.recipient}>
        <SectionHeader title="Empfänger" description="CRM-Kunde übernehmen oder angebotsspezifisch überschreiben. CRM-Daten werden nie überschrieben." />
        <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Select id="owner-customer" label="Kunde (Kundenverwaltung)" value={state.ownerCustomerId}
              onChange={(v) => patch({ ownerCustomerId: v })}
              hint={'Ordnet das Angebot einem Kunden in „Kunden & Aufgaben“ zu.'}
              options={[{ value: '', label: '— Kein Kunde zugeordnet —' }, ...ownerCustomers.map((c) => ({ value: c.id, label: customerDisplayName(c) }))]} />
            <Button variant="secondary" icon={Plus} onClick={() => setCustomerDialogOpen(true)}>Neuen Kunden anlegen</Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="customer" label="CRM-Kunde" value={state.customerId} onChange={applyCustomer}
            options={[{ value: '', label: '— Kein CRM-Kunde —' }, ...customers.map((c) => ({ value: c.organizationId, label: c.name }))]} />
          <Field id="rcompany" label="Firma (rechtlich)" value={state.rcompany} onChange={(v) => patch({ rcompany: v, recipientSource: 'manual' })} required />
          <Select id="rsalutation" label="Anrede" value={state.rsalutation} onChange={(v) => patch({ rsalutation: v as EditorState['rsalutation'], recipientSource: 'manual' })}
            options={[{ value: '', label: '— Neutral —' }, { value: 'herr', label: 'Herr' }, { value: 'frau', label: 'Frau' }, { value: 'neutral', label: 'Neutral' }]} />
          <Field id="rtitle" label="Titel (optional, z. B. Dr.)" value={state.rtitle} onChange={(v) => patch({ rtitle: v, recipientSource: 'manual' })} />
          <Field id="rfirstname" label="Vorname" value={state.rfirstname} onChange={(v) => patch({ rfirstname: v, recipientSource: 'manual' })} />
          <Field id="rlastname" label="Nachname" value={state.rlastname} onChange={(v) => patch({ rlastname: v, recipientSource: 'manual' })} />
          <Field id="rcontact" label="Ansprechpartner" value={state.rcontact} onChange={(v) => patch({ rcontact: v, recipientSource: 'manual' })} />
          <Field id="rdept" label="Abteilung" value={state.rdepartment} onChange={(v) => patch({ rdepartment: v, recipientSource: 'manual' })} />
          <Field id="rstreet" label="Straße" value={state.rstreet} onChange={(v) => patch({ rstreet: v, recipientSource: 'manual' })} />
          <div className="grid grid-cols-2 gap-3">
            <Field id="rpostal" label="PLZ" value={state.rpostal} onChange={(v) => patch({ rpostal: v, recipientSource: 'manual' })} />
            <Field id="rcity" label="Ort" value={state.rcity} onChange={(v) => patch({ rcity: v, recipientSource: 'manual' })} />
          </div>
          <Field id="remail" label="E-Mail" value={state.remail} onChange={(v) => patch({ remail: v, recipientSource: 'manual' })} />
          <Field id="rphone" label="Telefon" value={state.rphone} onChange={(v) => patch({ rphone: v, recipientSource: 'manual' })} />
          <Field id="rvat" label="USt-IdNr. (optional)" value={state.rvat} onChange={(v) => patch({ rvat: v, recipientSource: 'manual' })} />
          <Field id="rcountry" label="Land" value={state.rcountry} onChange={(v) => patch({ rcountry: v, recipientSource: 'manual' })} />
        </div>
        <p className="mt-3 text-[12px] text-slate-500">Begrüßung im Kundenportal: <span className="font-medium text-slate-700">„{buildGreetingLine({ salutation: state.rsalutation, title: state.rtitle, firstName: state.rfirstname, lastName: state.rlastname, greetingName: state.rgreeting })}“</span></p>
        {(!state.rstreet || !state.rcity) ? <p className="mt-1 text-[12px] text-amber-600">Postanschrift unvollständig — für die Finalisierung erforderlich.</p> : null}
      </Card>

      <Card className="p-5" id={sectionAnchor.summary}>
        <SectionHeader title="Inhalt & Zielbild" />
        <div className="space-y-4">
          <Textarea id="intro" label="Ausgangslage / Einleitung" value={state.introduction} onChange={(v) => patch({ introduction: v })} rows={4} />
          <Textarea id="approach" label="Zielbild & Vorgehen" value={state.projectApproach} onChange={(v) => patch({ projectApproach: v })} rows={3} />
          <Textarea id="exec" label="Executive Summary" value={state.executiveSummary} onChange={(v) => patch({ executiveSummary: v })} rows={3} />
          <Textarea id="outcomes" label="Erwartete Ergebnisse (eine je Zeile)" value={state.desiredOutcomes} onChange={(v) => patch({ desiredOutcomes: v })} rows={4} hint="Wird als Aufzählung dargestellt." />
        </div>
      </Card>

      <Card className="p-5" id={sectionAnchor.positions}>
        <SectionHeader title="Projektmodule / Positionen" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => patch({ lines: [...state.lines, newLine()] })}>Modul</Button>} />
        <div className="space-y-4">
          {state.lines.map((l, idx) => {
            const price = toCents(l.unitPrice); const q = Number(l.quantity.replace(',', '.')) || 0;
            const calc = price != null ? computeInvoiceLine(Math.round(q * 1000), price, rateFor(l.treatment), l.treatment as never) : null;
            const isRecurring = l.pricingType === 'recurring';
            const term = isRecurring ? parseTerm(l.minimumTerm) : null;
            return (
              <div key={l.id} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Modul {idx + 1}{l.optional ? ' · optional' : ''}</span>
                  {state.lines.length > 1 ? <IconButton icon={Trash2} label="Entfernen" variant="ghost" onClick={() => patch({ lines: state.lines.filter((x) => x.id !== l.id) })} /> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-12"><Field id={`d-${l.id}`} label="Titel (kurz)" value={l.description} onChange={(v) => patchLine(l.id, { description: v })} /></div>
                  <div className="sm:col-span-12"><Textarea id={`det-${l.id}`} label="Beschreibung" value={l.details} onChange={(v) => patchLine(l.id, { details: v })} rows={2} /></div>
                  <div className="sm:col-span-12"><Textarea id={`del-${l.id}`} label="Leistungen (eine je Zeile)" value={l.deliverables} onChange={(v) => patchLine(l.id, { deliverables: v })} rows={3} /></div>
                  <div className="sm:col-span-3"><Field id={`ph-${l.id}`} label="Phase" value={l.phaseLabel} onChange={(v) => patchLine(l.id, { phaseLabel: v })} /></div>
                  <div className="sm:col-span-3"><Field id={`du-${l.id}`} label="Dauer" value={l.durationLabel} onChange={(v) => patchLine(l.id, { durationLabel: v })} /></div>
                  <div className="sm:col-span-3"><Select id={`pt-${l.id}`} label="Preisart" value={l.pricingType} onChange={(v) => patchLine(l.id, { pricingType: v as EditorLine['pricingType'] })} options={pricingTypes} /></div>
                  <div className="sm:col-span-2"><Field id={`q-${l.id}`} label="Menge" value={l.quantity} onChange={(v) => patchLine(l.id, { quantity: v })} inputMode="decimal" /></div>
                  <div className="sm:col-span-2">
                    {isRecurring
                      ? <Select id={`bi-${l.id}`} label="Intervall" value={l.billingInterval} onChange={(v) => patchLine(l.id, { billingInterval: v as EditorLine['billingInterval'] })} options={billingIntervals} />
                      : <Select id={`u-${l.id}`} label="Einheit" value={l.unit} onChange={(v) => patchLine(l.id, { unit: v })} options={units} />}
                  </div>
                  <div className="sm:col-span-2"><Field id={`p-${l.id}`} label={isRecurring ? 'Netto je Intervall' : 'Netto'} prefix="€" value={l.unitPrice} onChange={(v) => patchLine(l.id, { unitPrice: v })} inputMode="decimal" placeholder={isRecurring ? '290,00' : '10000,00'} /></div>
                  {isRecurring ? (
                    <>
                      <div className="sm:col-span-3"><Field id={`mt-${l.id}`} label="Mindestlaufzeit (Monate)" value={l.minimumTerm} onChange={(v) => patchLine(l.id, { minimumTerm: v })} inputMode="numeric" placeholder="12" /></div>
                      <div className="sm:col-span-4"><Select id={`bs-${l.id}`} label="Abrechnungsbeginn" value={l.billingStartType} onChange={(v) => patchLine(l.id, { billingStartType: v as EditorLine['billingStartType'] })} options={billingStarts} /></div>
                      {l.billingStartType === 'custom' ? (
                        <div className="sm:col-span-4"><Field id={`bsl-${l.id}`} label="Beginn (eigener Text)" value={l.billingStartLabel} onChange={(v) => patchLine(l.id, { billingStartLabel: v })} placeholder="ab Abnahme Phase 2" /></div>
                      ) : null}
                    </>
                  ) : null}
                  <div className="sm:col-span-8"><Select id={`t-${l.id}`} label="USt-Behandlung" value={l.treatment} onChange={(v) => patchLine(l.id, { treatment: v })} options={treatments} /></div>
                  <div className="sm:col-span-4 flex items-end pb-2"><Checkbox id={`o-${l.id}`} label="Optional (nicht in Summe)" checked={l.optional} onChange={(v) => patchLine(l.id, { optional: v })} /></div>
                </div>
                {calc ? (
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-gray-500">
                    <span>Netto <span className="font-semibold tabular-nums text-gray-700">{formatCents(calc.netCents)}{isRecurring ? ` ${intervalSuffix(l.billingInterval)}` : ''}</span></span>
                    <span>Brutto <span className="font-semibold tabular-nums text-gray-900">{formatCents(calc.grossCents)}{isRecurring ? ` ${intervalSuffix(l.billingInterval)}` : ''}</span></span>
                    {/* Nachrichtlich: the minimum term never changes the per-interval price. */}
                    {isRecurring && term ? <span className="text-gray-400">Wert über {term} Monate <span className="tabular-nums">{formatCents(calc.netCents * term)} netto</span></span> : null}
                  </div>
                ) : null}
                {idx > 0 || idx < state.lines.length - 1 ? (
                  <div className="mt-2 flex gap-2">
                    <button className="text-[11px] text-gray-400 hover:text-gray-700 disabled:opacity-30" disabled={idx === 0} onClick={() => { const a = [...state.lines]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; patch({ lines: a }); }}>↑ nach oben</button>
                    <button className="text-[11px] text-gray-400 hover:text-gray-700 disabled:opacity-30" disabled={idx === state.lines.length - 1} onClick={() => { const a = [...state.lines]; [a[idx + 1], a[idx]] = [a[idx], a[idx + 1]]; patch({ lines: a }); }}>↓ nach unten</button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {/* The commercial summary the customer will see: what is paid once, what is paid per
            interval, and — deliberately small — what the first minimum term adds up to. */}
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm">
          {doc.pricing.hasOneTime || !doc.pricing.hasRecurring ? (
            <dl className="space-y-1.5">
              {doc.pricing.hasRecurring ? <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Einmalige Investition</div> : null}
              <div className="flex justify-between"><dt className="text-gray-500">Netto (ohne optionale)</dt><dd className="tabular-nums">{formatCents(doc.pricing.oneTime.netCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums">{formatCents(doc.pricing.oneTime.vatCents)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5"><dt className="font-semibold text-gray-950">{doc.pricing.hasRecurring ? 'Einmalig brutto' : 'Gesamt brutto'}</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(doc.pricing.oneTime.grossCents)}</dd></div>
            </dl>
          ) : null}
          {doc.pricing.recurring.map((g, i) => (
            <dl key={i} className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Laufende Betreuung</div>
              <div className="flex justify-between"><dt className="text-gray-500">Netto {intervalSuffix(g.interval)}</dt><dd className="tabular-nums">{formatCents(g.netCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums">{formatCents(g.vatCents)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5"><dt className="font-semibold text-gray-950">Brutto {intervalSuffix(g.interval)}</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(g.grossCents)}</dd></div>
              {g.minimumTermMonths ? <div className="flex justify-between text-[12px] text-gray-400"><dt>Mindestlaufzeit {g.minimumTermMonths} Monate</dt><dd className="tabular-nums">{formatCents(g.minimumTerm.netCents)} netto</dd></div> : null}
            </dl>
          ))}
          {doc.pricing.recurring.some((g) => g.minimumTerm.netCents > 0) ? (
            <p className="text-[12px] leading-relaxed text-gray-400">
              Gesamtwert während der ersten Mindestlaufzeit: {formatCents(doc.pricing.minimumTermTotal.netCents)} netto — nachrichtlich, nicht sofort fällig.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="p-5" id={sectionAnchor.schedule}>
        <SectionHeader title="Zeitplan & Zahlungsplan" />
        <div className="mb-3 text-[12px] font-semibold text-gray-600">Projektphasen</div>
        <div className="space-y-2">
          {state.timeline.map((t) => (
            <div key={t.id} className="grid grid-cols-12 gap-2">
              <div className="col-span-3"><Field id={`tp-${t.id}`} label="" value={t.phase} onChange={(v) => patch({ timeline: state.timeline.map((x) => x.id === t.id ? { ...x, phase: v } : x) })} placeholder="Phase 1" /></div>
              <div className="col-span-5"><Field id={`tt-${t.id}`} label="" value={t.title} onChange={(v) => patch({ timeline: state.timeline.map((x) => x.id === t.id ? { ...x, title: v } : x) })} placeholder="Analyse" /></div>
              <div className="col-span-3"><Field id={`td-${t.id}`} label="" value={t.duration} onChange={(v) => patch({ timeline: state.timeline.map((x) => x.id === t.id ? { ...x, duration: v } : x) })} placeholder="3 Wochen" /></div>
              <div className="col-span-1 flex items-center"><IconButton icon={Trash2} label="Entfernen" variant="ghost" onClick={() => patch({ timeline: state.timeline.filter((x) => x.id !== t.id) })} /></div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => patch({ timeline: [...state.timeline, { id: rid(), phase: '', title: '', duration: '', description: '' }] })}>Phase</Button>

        <div className="mb-1 mt-5 text-[12px] font-semibold text-gray-600">Zahlungsplan (Prozent)</div>
        <p className="mb-3 text-[11.5px] text-gray-400">
          {doc.pricing.hasRecurring
            ? 'Die Prozentsätze gelten ausschließlich für die einmalige Projektinvestition. Wiederkehrende Positionen werden gemäß ihrem Abrechnungsintervall separat berechnet.'
            : 'Die Prozentsätze gelten für die einmalige Projektinvestition.'}
        </p>
        <div className="space-y-2">
          {state.payment.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-2">
              <div className="col-span-8"><Field id={`pl-${p.id}`} label="" value={p.label} onChange={(v) => patch({ payment: state.payment.map((x) => x.id === p.id ? { ...x, label: v } : x) })} placeholder="Bei Auftragserteilung" /></div>
              <div className="col-span-3"><Field id={`pp-${p.id}`} label="" value={p.percentage} onChange={(v) => patch({ payment: state.payment.map((x) => x.id === p.id ? { ...x, percentage: v } : x) })} inputMode="decimal" prefix="%" placeholder="30" /></div>
              <div className="col-span-1 flex items-center"><IconButton icon={Trash2} label="Entfernen" variant="ghost" onClick={() => patch({ payment: state.payment.filter((x) => x.id !== p.id) })} /></div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => patch({ payment: [...state.payment, { id: rid(), label: '', percentage: '' }] })}>Rate</Button>
        {state.payment.length > 0 ? (
          <p className={`mt-2 text-[12px] ${state.payment.reduce((s, p) => s + (Number(p.percentage.replace(',', '.')) || 0), 0) === 100 ? 'text-gray-400' : 'text-amber-600'}`}>
            Summe: {state.payment.reduce((s, p) => s + (Number(p.percentage.replace(',', '.')) || 0), 0)} % (muss 100 % ergeben)
          </p>
        ) : null}
      </Card>

      <Card className="p-5" id={sectionAnchor.terms}>
        <SectionHeader title="Bedingungen & Abschluss" />
        <div className="space-y-4">
          <Field id="pt" label="Zahlungsbedingungen" value={state.paymentTerms} onChange={(v) => patch({ paymentTerms: v })} />
          <Textarea id="delivery" label="Liefer- & Mitwirkungsbedingungen" value={state.deliveryTerms} onChange={(v) => patch({ deliveryTerms: v })} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea id="assum" label="Annahmen" value={state.assumptions} onChange={(v) => patch({ assumptions: v })} rows={3} />
            <Textarea id="excl" label="Nicht enthalten / Ausschlüsse" value={state.exclusions} onChange={(v) => patch({ exclusions: v })} rows={3} />
          </div>
          <Textarea id="next" label="Nächster Schritt (Abschluss)" value={state.nextSteps} onChange={(v) => patch({ nextSteps: v })} rows={2} />
          <Textarea id="notes" label="Interne Notizen (nicht im Dokument)" value={state.internalNotes} onChange={(v) => patch({ internalNotes: v })} rows={2} />
        </div>
      </Card>
    </div>
  );

  const preview = <div className="lg:sticky lg:top-4"><PremiumOfferPreview doc={doc.doc} /></div>;

  return (
    <>
      <button onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-950"><ArrowLeft size={15} /> Zurück</button>
      <PageHeader
        title={isNew ? 'Neues Angebot' : 'Angebot bearbeiten'}
        description={isNew ? 'Als Entwurf speichern; finalisieren Sie anschließend.' : 'Änderungen werden am selben Entwurf gespeichert.'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {saveBadge}
            <Button size="sm" variant="secondary" onClick={back}>Zurück</Button>
            <Button size="sm" variant="secondary" icon={Eye} onClick={saveAndPreview} loading={saveState === 'saving'}>Speichern & Vorschau</Button>
            <Button size="sm" icon={Save} onClick={save} loading={saveState === 'saving'}>Speichern</Button>
            <Button size="sm" icon={FileCheck2} onClick={finalize} disabled={!validation.canFinalize} title={validation.canFinalize ? undefined : 'Pflichtangaben fehlen'}>Finalisieren</Button>
          </div>
        }
      />

      <div className="mb-4 lg:hidden">
        <Tabs value={mobileTab} onChange={setMobileTab} tabs={[{ value: 'edit', label: 'Bearbeiten' }, { value: 'preview', label: 'Vorschau' }]} />
      </div>

      {/* Desktop: editor + preview columns. Mobile: one column via tabs. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={mobileTab === 'edit' ? '' : 'hidden lg:block'}>{editor}</div>
        <div className={mobileTab === 'preview' ? '' : 'hidden lg:block'}>{preview}</div>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        tone="danger"
        title="Änderungen verwerfen?"
        confirmLabel="Verwerfen und verlassen"
        cancelLabel="Weiter bearbeiten"
        message="Es gibt ungespeicherte Änderungen an diesem Angebot. Beim Verlassen gehen sie verloren."
        onConfirm={() => { setLeaveOpen(false); leave(); }}
      />

      <PremiumPdfPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        render={renderPreview}
        filename={documentFilename(doc.doc)}
        title="Vorschau (Entwurf)"
        description="Gespeicherter Entwurf — Premium-PDF-Vorschau."
      />

      {entity ? (
        <CustomerFormDialog
          open={customerDialogOpen}
          onClose={() => setCustomerDialogOpen(false)}
          entityId={entity.id}
          defaults={{
            company: state.rcompany, contact_name: state.rcontact, email: state.remail, phone: state.rphone,
            street: state.rstreet, postal_code: state.rpostal, city: state.rcity,
          }}
          onSaved={(id) => { patch({ ownerCustomerId: id }); if (entity) void loadCustomers(entity.id).then(setOwnerCustomers).catch(() => {}); }}
        />
      ) : null}
    </>
  );
}

function PreflightCard({ validation }: { validation: ReturnType<typeof validateOfferForFinalization> }) {
  const blocking = validation.items.filter((i) => i.blocking);
  const done = blocking.filter((i) => i.ok).length;
  return (
    <Card className="p-5">
      <SectionHeader title="Finalisierungs-Check" description={`${done}/${blocking.length} Pflichtangaben erfüllt`} />
      <ul className="space-y-1.5">
        {blocking.map((i) => (
          <li key={i.key} className="flex items-center gap-2 text-[13px]">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${i.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.ok ? '✓' : '!'}</span>
            {i.ok ? <span className="text-gray-500">{i.label}</span> : (
              <button className="text-gray-800 underline decoration-dotted hover:text-gray-950" onClick={() => { const el = document.getElementById(sectionAnchor[i.section ?? 'meta']); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{i.label}</button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
