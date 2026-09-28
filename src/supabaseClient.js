import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase is not configured yet. Frontend placeholder mode is active."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: null,
        }),

        signInWithOtp: async () => ({
          data: null,
          error: new Error("Supabase is not configured yet."),
        }),

        verifyOtp: async () => ({
          data: null,
          error: new Error("Supabase is not configured yet."),
        }),
      },
    };

