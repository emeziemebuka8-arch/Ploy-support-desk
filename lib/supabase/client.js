"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Supabase client for browser code.
 * ---------------------------------------------------------------
 * `createBrowserClient` stores the signed-in session in cookies
 * instead of localStorage, so the Next.js server can read the same
 * session when it renders a protected page.
 *
 * Only components that run in the browser (the login form and the
 * sign-out buttons) import this file.
 */

let client;

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, anonKey } = getSupabaseConfig();
    client = createBrowserClient(url, anonKey);
  }

  return client;
}
