import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

if (!key) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY");
}

if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
  throw new Error(`Invalid VITE_SUPABASE_URL: ${url}`);
}

if (import.meta.env.DEV) {
  console.log("[Supabase] URL:", url);
  console.log("[Supabase] anon key exists:", Boolean(key));
  console.log("[Supabase] client initialized");
}

export const supabase = createClient(url, key);