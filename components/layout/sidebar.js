"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PlusCircle,
  Settings,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTickets } from "@/components/tickets-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// The only navigation links the application needs.
const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "All Tickets", icon: Ticket },
  { href: "/tickets/new", label: "New Ticket", icon: PlusCircle },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useTickets();

  function isActive(href) {
    // "/tickets" must not stay highlighted on the "New Ticket" page.
    if (href === "/tickets") {
      return pathname.startsWith("/tickets") && pathname !== "/tickets/new";
    }
    return pathname === href;
  }

  async function handleLogout() {
    // Clear the Supabase session cookies, then leave the protected area.
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo / product name */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Ploy</p>
          <p className="text-xs text-slate-500">Support Desk</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-2 text-xs text-slate-500">
          Signed in as
          <p className="truncate text-sm font-medium text-slate-700">
            {admin.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
