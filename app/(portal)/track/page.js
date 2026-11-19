import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import TrackForm from "./track-form";

export const metadata = {
  title: "Track Complaint",
};

export default function TrackComplaintPage({ searchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Track Complaint
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your ticket number and the email address you used when you
          submitted the complaint.
        </p>
      </div>

      {/* The ticket number is read from the URL, so that part waits in a
          Suspense boundary while the heading above renders immediately. */}
      <Suspense fallback={<TrackFormSkeleton />}>
        <TrackFormLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TrackFormLoader({ searchParams }) {
  const { ticket } = await searchParams;

  // The confirmation page links here with the ticket number pre-filled.
  const initialTicket =
    typeof ticket === "string" && /^PSD-\d{1,8}$/.test(ticket) ? ticket : "";

  return <TrackForm initialTicket={initialTicket} />;
}

function TrackFormSkeleton() {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">Loading the tracking form...</p>
    </Card>
  );
}
