import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  }

  _supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _supabase;
}
