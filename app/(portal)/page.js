import Link from "next/link";
import { ArrowRight, FilePlus2, Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Customer Support",
};

/**
 * Public home page.
 * It explains the service in two sentences and gives customers the two
 * things they can do: submit a complaint or track an existing one.
 */
export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">Customer Support</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          How can we help?
        </h1>
        <p className="mt-3 max-w-xl text-base text-slate-600">
          Tell us about a problem with your Ploy account, payments or WhatsApp
          connection. We will give you a ticket number so you can check on your
          complaint at any time.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          No account is needed to submit or track a complaint.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col p-5">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <FilePlus2 className="h-5 w-5" />
          </span>
          <h2 className="text-base font-semibold text-slate-900">
            Submit a Complaint
          </h2>
          <p className="mt-1 flex-1 text-sm text-slate-500">
            Fill in a short form describing the problem. You will receive a
            ticket number straight away.
          </p>
          <Link href="/submit" className={buttonClass({ className: "mt-4" })}>
            Submit a Complaint
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card className="flex flex-col p-5">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Search className="h-5 w-5" />
          </span>
          <h2 className="text-base font-semibold text-slate-900">
            Track Complaint
          </h2>
          <p className="mt-1 flex-1 text-sm text-slate-500">
            Already submitted a complaint? Use your ticket number and email
            address to see its current status.
          </p>
          <Link
            href="/track"
            className={buttonClass({ variant: "outline", className: "mt-4" })}
          >
            Track Complaint
          </Link>
        </Card>
      </div>
    </div>
  );
}
