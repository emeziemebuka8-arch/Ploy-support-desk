import { redirect } from "next/navigation";
import { connection } from "next/server";
import AppShell from "@/components/layout/app-shell";
import { TicketsProvider } from "@/components/tickets-provider";
import { getAdminWorkspace } from "@/lib/tickets-data";

/**
 * The shell reads the current URL to highlight the active menu item, so
 * these pages are rendered per request instead of being pre-built as a
 * static shell. This is the recommended opt-out in Next.js 16.
 */
export const instant = false;

/**
 * Layout for every signed-in page.
 * The route group "(app)" keeps these URLs clean (/dashboard, /tickets)
 * while sharing one sidebar, header and data provider.
 *
 * Stage 6: the real gate. The session is read from cookies on the
 * server; a visitor without a valid session never sees the dashboard.
 * proxy.js performs the same check earlier for a faster redirect.
 */
export default async function DashboardLayout({ children }) {
  // Stop prerendering before the auth client runs. Supabase uses
  // time-based values internally, which are not allowed while Next.js
  // builds a static shell (Cache Components).
  await connection();

  // One server read supplies the admin profile, tickets and activity.
  // RLS runs with this administrator's session, so only permitted rows
  // come back. A missing session means the visitor must sign in.
  const workspace = await getAdminWorkspace();

  if (!workspace) {
    redirect("/login");
  }

  return (
    <TicketsProvider
      admin={workspace.admin}
      tickets={workspace.tickets}
      updates={workspace.updates}
    >
      <AppShell>{children}</AppShell>
    </TicketsProvider>
  );
}
