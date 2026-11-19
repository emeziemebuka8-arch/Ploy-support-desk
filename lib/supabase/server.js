import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Supabase clients for server code.
 * ---------------------------------------------------------------
 * Two clients are needed for two different jobs:
 *
 * 1. getSupabaseServerClient() is a plain client with no session. The
 *    public complaint routes use it to call submit_complaint and
 *    track_complaint. It is never used for administrator data.
 *
 * 2. getSupabaseAuthServerClient() reads the signed-in administrator's
 *    session from cookies. The protected layout and login page use it
 *    to find out who is signed in.
 *
 * Both use the PUBLIC anon key. The service-role key is not used
 * anywhere in this project.
 */

let publicClient;

export function getSupabaseServerClient() {
  if (!publicClient) {
    const { url, anonKey } = getSupabaseConfig();

    publicClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return publicClient;
}

export async function getSupabaseAuthServerClient() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // A Server Component is not allowed to change cookies. This is
          // expected: proxy.js refreshes the session and writes the new
          // cookies on the response instead.
        }
      },
    },
  });
}
