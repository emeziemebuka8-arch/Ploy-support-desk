"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useTickets } from "@/components/tickets-provider";

/** Work out the page title from the current URL. */
function getPageTitle(pathname) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/tickets") return "All Tickets";
  if (pathname === "/tickets/new") return "New Ticket";
  if (pathname.endsWith("/edit")) return "Edit Ticket";
  if (pathname.startsWith("/tickets/")) return "Ticket Details";
  return "Ploy Support Desk";
}

/** First letter of the administrator's name, used in the avatar. */
function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Header({ onOpenMenu }) {
  const pathname = usePathname();
  const { admin } = useTickets();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button — the sidebar is hidden on small screens */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-semibold text-slate-900">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{admin.full_name}</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {getInitials(admin.full_name)}
        </span>
      </div>
    </header>
  );
}
