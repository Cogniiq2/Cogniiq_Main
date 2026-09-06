/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OURA_CLIENT_ID?: string;
  /** "true" exposes the Private Bar payment controls. Non-secret deployment flag. */
  readonly VITE_PRIVATE_BAR_CHECKOUT_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
