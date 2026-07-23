// Single source of truth for how the owner dashboard derives an offer's signed state.
//
// Three INDEPENDENT states must never be conflated:
//   1. accepted                — the customer accepted the offer (status or acceptance flag).
//   2. signatureCaptured       — a signature PNG was drawn and stored privately (path + hash).
//   3. signedDocumentGenerated — a downstream signed certificate/PDF was rendered (optional).
//
// The historical bug showed "Nicht unterzeichnet" whenever the signed certificate PDF had not
// yet been generated, even though a real signature PNG + SHA-256 were captured. Signature capture
// is proven by `signature_storage_path` + `signature_sha256` ALONE and must never depend on the
// downstream signed document. This module keeps that distinction explicit and testable.

import type { OwnerOfferAcceptanceSummary } from '@/lib/ownerFinance/types';

/** The subset of the acceptance summary the signed-state derivation reads. */
export type AcceptanceSignatureFields = Pick<
  OwnerOfferAcceptanceSummary,
  'accepted' | 'signature_storage_path' | 'signature_sha256' | 'signature_level'
>;

export interface OfferSignatureStateInput {
  /** Live offer lifecycle status (`owner_offers.status`). */
  status?: string | null;
  /** Curated acceptance summary (`owner_offer_acceptance_summary`); null before it loads. */
  acceptance?: AcceptanceSignatureFields | null;
  /**
   * Whether a signed certificate/document PDF has been generated downstream. This is a SEPARATE
   * state and must NEVER gate `signatureCaptured`. In the owner dashboard it is derived from the
   * generated-documents list (`render_metadata.signed === true`) — NOT from the acceptance summary.
   */
  signedDocumentAvailable?: boolean | null;
}

export type SignaturePrimaryTone = 'success' | 'warning' | 'neutral';

export interface OfferSignatureState {
  accepted: boolean;
  signatureCaptured: boolean;
  signedDocumentGenerated: boolean;
  /** Headline badge for the acceptance panel. */
  primaryLabel: string;
  primaryTone: SignaturePrimaryTone;
  /** Detail line — signature capture: "Erfasst" / "Nicht erfasst". */
  signatureStatusLabel: string;
  /** Detail line — signed certificate: "Verfügbar" / "Wird vorbereitet". */
  certificateStatusLabel: string;
}

const ACCEPTED_STATUSES: ReadonlySet<string> = new Set(['accepted', 'converted']);

/**
 * Derive the offer's signed state. Pure and deterministic — safe to unit test and to call in render.
 *
 * accepted            = status ∈ {accepted, converted}  OR  acceptance.accepted === true
 * signatureCaptured   = Boolean(signature_storage_path) AND Boolean(signature_sha256)
 * signedDocumentGen.  = Boolean(signedDocumentAvailable)   (downstream, never gates the above)
 */
export function deriveOfferSignatureState(input: OfferSignatureStateInput): OfferSignatureState {
  const status = input.status ?? null;
  const acc = input.acceptance ?? null;

  const accepted =
    (status != null && ACCEPTED_STATUSES.has(status)) || acc?.accepted === true;

  const signatureCaptured =
    Boolean(acc?.signature_storage_path) && Boolean(acc?.signature_sha256);

  const signedDocumentGenerated = Boolean(input.signedDocumentAvailable);

  let primaryLabel: string;
  let primaryTone: SignaturePrimaryTone;
  if (signatureCaptured) {
    // Signature captured — signed regardless of whether the certificate PDF exists yet.
    primaryLabel = 'Unterzeichnet';
    primaryTone = 'success';
  } else if (accepted) {
    // Accepted but no drawn signature stored (e.g. plain online acceptance / RPC fallback).
    primaryLabel = 'Angenommen, keine Unterschrift erfasst';
    primaryTone = 'warning';
  } else {
    primaryLabel = 'Nicht angenommen';
    primaryTone = 'neutral';
  }

  return {
    accepted,
    signatureCaptured,
    signedDocumentGenerated,
    primaryLabel,
    primaryTone,
    signatureStatusLabel: signatureCaptured ? 'Erfasst' : 'Nicht erfasst',
    certificateStatusLabel: signedDocumentGenerated ? 'Verfügbar' : 'Wird vorbereitet',
  };
}

/**
 * Whether a generated-document row represents the downstream *signed* certificate PDF. Mirrors the
 * SQL definition used by `public_offer_by_token.signed_document_available`
 * (`document_type = 'offer'` AND `render_metadata->>'signed' = 'true'`).
 */
export function isSignedCertificateDocument(doc: {
  document_type?: string | null;
  pdf_storage_path?: string | null;
  render_metadata?: Record<string, unknown> | null;
}): boolean {
  if (doc.document_type !== 'offer') return false;
  if (!doc.pdf_storage_path) return false;
  const signed = doc.render_metadata?.signed;
  return signed === true || signed === 'true';
}

// ---------------------------------------------------------------------------
// Certificate + confirmation-email status derivation for the owner dashboard.
// These combine the generated certificate document with the automation-job state so the
// dashboard shows Verfügbar / Wird vorbereitet / Fehler with the correct tone and retry.
// ---------------------------------------------------------------------------
export type AutomationDisplayState = 'available' | 'sent' | 'processing' | 'pending' | 'failed' | 'none';

export interface AutomationStatusView {
  state: AutomationDisplayState;
  label: string;
  tone: SignaturePrimaryTone | 'danger';
  /** True when the owner should be offered a retry action. */
  canRetry: boolean;
}

interface JobLike { job_type: string; status: string }

/** Find the newest job of a given type (jobs arrive oldest-first from the summary). */
export function findJob<T extends JobLike>(jobs: T[] | null | undefined, jobType: string): T | null {
  if (!jobs?.length) return null;
  for (let i = jobs.length - 1; i >= 0; i--) if (jobs[i].job_type === jobType) return jobs[i];
  return null;
}

const PENDING_JOB_STATUSES: ReadonlySet<string> = new Set(['pending', 'retrying']);
const PROCESSING_JOB_STATUSES: ReadonlySet<string> = new Set(['processing']);

/**
 * Signed-certificate status: a generated certificate document wins (Verfügbar); otherwise the
 * certificate job state drives Wird vorbereitet / Wird erstellt / Fehler. `signatureCaptured`
 * gates whether "in preparation" is even meaningful (no signature ⇒ no certificate expected).
 */
export function deriveCertificateStatus(input: {
  hasCertificateDocument: boolean;
  signatureCaptured: boolean;
  job?: { status: string } | null;
}): AutomationStatusView {
  if (input.hasCertificateDocument) {
    return { state: 'available', label: 'Verfügbar', tone: 'success', canRetry: false };
  }
  const s = input.job?.status ?? null;
  if (s === 'failed') return { state: 'failed', label: 'Fehler bei der Erstellung', tone: 'danger', canRetry: true };
  if (s && PROCESSING_JOB_STATUSES.has(s)) return { state: 'processing', label: 'Wird erstellt', tone: 'neutral', canRetry: false };
  if (s && PENDING_JOB_STATUSES.has(s)) return { state: 'pending', label: 'Wird vorbereitet', tone: 'neutral', canRetry: false };
  // No job yet. If a signature exists the certificate is still expected; otherwise it is not applicable.
  return input.signatureCaptured
    ? { state: 'pending', label: 'Wird vorbereitet', tone: 'neutral', canRetry: true }
    : { state: 'none', label: 'Nicht zutreffend', tone: 'neutral', canRetry: false };
}

/** Confirmation-email status for the owner dashboard. */
export function deriveConfirmationEmailStatus(job?: { status: string } | null): AutomationStatusView {
  const s = job?.status ?? null;
  if (s === 'sent') return { state: 'sent', label: 'Versendet', tone: 'success', canRetry: false };
  if (s === 'failed') return { state: 'failed', label: 'Fehler', tone: 'danger', canRetry: true };
  if (s && PROCESSING_JOB_STATUSES.has(s)) return { state: 'processing', label: 'Wird versendet', tone: 'neutral', canRetry: false };
  if (s && PENDING_JOB_STATUSES.has(s)) return { state: 'pending', label: 'Wartet', tone: 'neutral', canRetry: false };
  return { state: 'none', label: 'Nicht geplant', tone: 'neutral', canRetry: false };
}
