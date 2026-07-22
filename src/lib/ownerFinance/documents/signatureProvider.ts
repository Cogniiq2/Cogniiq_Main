// Provider-neutral electronic signature interface. The native Cogniiq flow implements only
// 'electronic_acceptance' / 'simple_electronic_signature' (the /d/:token portal). Advanced/qualified
// signatures require an external trust-service provider — this file defines the adapter contract for
// one but DOES NOT simulate external signing. When no provider is configured, callers must surface
// "Externer Signaturdienst nicht konfiguriert" rather than faking success. Provider secrets never
// live in the frontend or in Vite env — an external provider is driven server-side (Edge Function).

export type SignatureLevel =
  | 'electronic_acceptance'
  | 'simple_electronic_signature'
  | 'advanced_provider_signature'
  | 'qualified_provider_signature';

export type SignatureProviderMode = 'disabled' | 'native_acceptance' | 'external_provider';

export interface SignatureEnvelopeRequest {
  documentId: string;
  documentVersion: number;
  sourceHash: string;
  recipientName: string;
  recipientEmail: string;
  level: SignatureLevel;
}

export interface SignatureEnvelope {
  provider: string;
  envelopeId: string;
  status: 'created' | 'sent' | 'viewed' | 'completed' | 'declined' | 'expired' | 'cancelled';
}

/** Adapter every external signature provider must implement (server-side). */
export interface ESignatureProvider {
  readonly name: string;
  createEnvelope(req: SignatureEnvelopeRequest): Promise<SignatureEnvelope>;
  getEnvelopeStatus(envelopeId: string): Promise<SignatureEnvelope>;
  cancelEnvelope(envelopeId: string): Promise<void>;
  downloadSignedDocument(envelopeId: string): Promise<Uint8Array>;
  verifyWebhook(rawBody: string, signatureHeader: string): boolean;
}

export interface SignatureConfig {
  mode: SignatureProviderMode;
  /** The maximum level this configuration may legitimately claim. */
  maxLevel: SignatureLevel;
}

/** Default: native online acceptance only. Never advertises advanced/qualified without a provider. */
export const DEFAULT_SIGNATURE_CONFIG: SignatureConfig = {
  mode: 'native_acceptance',
  maxLevel: 'simple_electronic_signature',
};

export const SIGNATURE_LEVEL_LABEL_DE: Record<SignatureLevel, string> = {
  electronic_acceptance: 'Online-Annahme',
  simple_electronic_signature: 'Einfache elektronische Signatur',
  advanced_provider_signature: 'Fortgeschrittene Signatur (externer Anbieter)',
  qualified_provider_signature: 'Qualifizierte Signatur (externer Anbieter)',
};

/** True only when the requested level is within what the current config may legitimately provide. */
export function levelSupported(config: SignatureConfig, level: SignatureLevel): boolean {
  const order: SignatureLevel[] = ['electronic_acceptance', 'simple_electronic_signature', 'advanced_provider_signature', 'qualified_provider_signature'];
  if (config.mode === 'disabled') return false;
  if (config.mode === 'native_acceptance') return order.indexOf(level) <= order.indexOf('simple_electronic_signature');
  return order.indexOf(level) <= order.indexOf(config.maxLevel);
}

export const EXTERNAL_PROVIDER_NOT_CONFIGURED = 'Externer Signaturdienst nicht konfiguriert';
