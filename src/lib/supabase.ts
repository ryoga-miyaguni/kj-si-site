import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** .env.local に値が入っていなければ false。その場合は mock.json で動く */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
