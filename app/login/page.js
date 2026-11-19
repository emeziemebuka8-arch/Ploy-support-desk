import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSupabaseAuthServerClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

// Reading the session cookie makes this page dynamic; render it per request.
export const instant = false;

/**
 * Login page (server side).
 * If an administrator is already signed in, there is no reason to show
 * the form again, so they go straight to the dashboard.
 */
export default async function LoginPage() {
  // The session is per-request data, so this page must not be prerendered.
  await connection();

  const supabase = await getSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
