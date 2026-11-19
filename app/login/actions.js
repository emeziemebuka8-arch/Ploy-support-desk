"use server";

import { redirect } from "next/navigation";
import { getSupabaseAuthServerClient } from "@/lib/supabase/server";

/**
 * Sign-in server action.
 * ---------------------------------------------------------------
 * The form posts the email and password to the Next.js server. This
 * action asks Supabase to check them, writes the session cookies, and
 * then redirects to the dashboard.
 *
 * Doing this on the server avoids relying on a long-running request in
 * the browser, and guarantees the cookies exist before the protected
 * layout renders.
 */

/** Turn Supabase's technical messages into something a person can act on. */
function friendlyError(message = "") {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "This account has not been confirmed yet. Confirm its email in Supabase, then try again.";
  }
  if (lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "We could not sign you in. Check your connection and try again.";
}

/** Fail instead of waiting forever if Supabase does not answer. */
function withTimeout(promise, milliseconds) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function loginAction(previousState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email address and password." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await getSupabaseAuthServerClient();

  let result;

  try {
    result = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      20000
    );
  } catch (signInFailure) {
    return {
      error:
        signInFailure?.message === "timeout"
          ? "The sign-in service took too long to answer. Check your connection and try again."
          : "We could not reach the sign-in service. Check your connection and try again.",
    };
  }

  if (result.error) {
    return { error: friendlyError(result.error.message) };
  }

  // The session cookies are now set on this response. Redirecting here
  // sends the browser straight to the protected dashboard.
  redirect("/dashboard");
}
