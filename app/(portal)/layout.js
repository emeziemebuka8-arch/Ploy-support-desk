import Link from "next/link";
import { LifeBuoy } from "lucide-react";

/**
 * Layout for the public customer portal.
 * It is deliberately small: a brand header, two links and a short footer.
 * No administrator links and no account menu appear here.
 */
export default function PortalLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-slate-900">
                Ploy
              </span>
              <span className="block text-xs text-slate-500">Support</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
            <Link
              href="/track"
              className="text-slate-600 hover:text-slate-900"
            >
              Track Complaint
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
          Ploy Support Desk — no account needed to submit or track a complaint.
        </div>
      </footer>
    </div>
  );
}
