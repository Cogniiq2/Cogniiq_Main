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
