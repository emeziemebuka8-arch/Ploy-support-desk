import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Complaint Received",
};

/**
 * Confirmation page.
 * The ticket number arrives in the URL (?ticket=PSD-1013) from the
 * submit form. It is only used for display; the real record lives on
 * the server.
 *
 * Next.js 16 requires the `searchParams` read to sit inside a Suspense
 * boundary, otherwise it cannot prerender the rest of the page.
 */
export default function ConfirmationPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-xl">
      <Suspense fallback={<ConfirmationSkeleton />}>
        <ConfirmationContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ConfirmationContent({ searchParams }) {
  const { ticket } = await searchParams;
  const ticketNumber =
    typeof ticket === "string" && /^PSD-\d{1,8}$/.test(ticket) ? ticket : null;

  return (
    <Card className="p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        Complaint received
      </h1>

      {ticketNumber ? (
        <>
          <p className="mt-2 text-sm text-slate-600">
            Your ticket reference number is
          </p>
          <p className="mt-2 rounded-md bg-slate-100 px-4 py-3 text-xl font-semibold tracking-wide text-slate-900">
            {ticketNumber}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          Thank you. Your complaint has been recorded.
        </p>
      )}

      <p className="mt-4 text-sm text-slate-600">
        Keep your ticket number safe. You will need it, together with the email
        address you used, to check the status of your complaint.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={
            ticketNumber
              ? `/track?ticket=${encodeURIComponent(ticketNumber)}`
              : "/track"
          }
          className={buttonClass()}
        >
          Track this complaint
        </Link>
        <Link href="/" className={buttonClass({ variant: "outline" })}>
          Back to home
        </Link>
      </div>
    </Card>
  );
}

function ConfirmationSkeleton() {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm text-slate-500">Loading your ticket number...</p>
    </Card>
  );
}
