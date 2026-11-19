/**
 * Public Supabase settings.
 * ---------------------------------------------------------------
 * The URL and the anon (publishable) key are safe to use in the
 * browser. They identify the project; Row Level Security decides what
 * the holder may actually read or change.
 *
 * The service-role key must never appear here: it bypasses RLS.
 */

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }

  return { url, anonKey };
}
