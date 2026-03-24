import { createClient } from '@supabase/supabase-js';

// Used in Server Components for SSR initial data fetch
export function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
