import { getSupabaseAuthServerClient } from "./supabase/server";

/**
 * Load everything the protected app needs for its first render.
 * ---------------------------------------------------------------
 * This runs on the server with the administrator's session cookies, so
 * Row Level Security (RLS) sees a signed-in user and returns the rows.
 * The rows are passed into TicketsProvider, which means the dashboard
 * never flashes mock or empty data while a browser request runs.
 */
export async function getAdminWorkspace() {
  const supabase = await getSupabaseAuthServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [profileResult, ticketsResult, updatesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("tickets").select("*").order("created_at", { ascending: false }),
    supabase
      .from("ticket_updates")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  if (ticketsResult.error) {
    console.error("Could not load tickets:", ticketsResult.error.message);
  }
  if (updatesResult.error) {
    console.error("Could not load ticket activity:", updatesResult.error.message);
  }

  const profile = profileResult.data;

  return {
    admin: {
      id: user.id,
      full_name:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Administrator",
      email: profile?.email || user.email || "",
      created_at: profile?.created_at || user.created_at,
    },
    tickets: ticketsResult.data ?? [],
    updates: updatesResult.data ?? [],
  };
}
