"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

/**
 * AppShell
 * ---------------------------------------------------------------
 * The dashboard layout shared by every signed-in page:
 * - a fixed sidebar on desktop
 * - a slide-in drawer on mobile
 * - a header with the page title and administrator profile
 */
export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // The mobile menu closes itself through the Sidebar's onNavigate
  // callback whenever a link is clicked.
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white shadow-lg">
            {/* The close button sits on top of the sidebar's logo row. */}
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-2 top-4 z-10 rounded-md p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
