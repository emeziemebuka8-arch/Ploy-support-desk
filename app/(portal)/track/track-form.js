"use client";

import { useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { StatusBadge } from "@/components/tickets/status-badge";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import Button from "@/components/ui/button";

/**
 * Customer tracking form.
 *
 * It sends the ticket number and email to /api/complaints/track. The
 * server checks that both match the same complaint before returning
 * anything. The response contains only the five public fields, never
 * administrator notes or activity history.
 */
export default function TrackForm({ initialTicket }) {
  const [ticketNumber, setTicketNumber] = useState(initialTicket);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [searching, setSearching] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setComplaint(null);

    const nextErrors = {};
    if (!ticketNumber.trim()) {
      nextErrors.ticketNumber = "Please enter your ticket number.";
    }
    if (!email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSearching(true);

    try {
      const response = await fetch("/api/complaints/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: ticketNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(
          data.error ||
            "We could not find a complaint with those details. Please check and try again."
        );
        setSearching(false);
        return;
      }

      setComplaint(data.complaint);
    } catch {
      setFormError(
        "We could not check your complaint. Check your connection and try again."
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              label="Ticket Number"
              htmlFor="ticket_number"
              required
              error={errors.ticketNumber}
              hint="For example PSD-1013"
            >
              <Input
                id="ticket_number"
                value={ticketNumber}
                onChange={(event) => {
                  setTicketNumber(event.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    ticketNumber: undefined,
                  }));
                }}
                placeholder="PSD-1013"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Email Address"
              htmlFor="track_email"
              required
              error={errors.email}
              hint="The email address used when the complaint was submitted."
            >
              <Input
                id="track_email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((previous) => ({ ...previous, email: undefined }));
                }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <Button type="submit" disabled={searching} className="w-full sm:w-auto">
              <Search className="h-4 w-4" />
              {searching ? "Checking..." : "Track Complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {complaint && (
        <Card>
          <CardHeader>
            <CardTitle>Complaint Status</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Ticket Number</dt>
                <dd className="font-medium text-slate-900">
                  {complaint.ticket_number}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Subject</dt>
                <dd className="text-right font-medium text-slate-900">
                  {complaint.subject}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Current Status</dt>
                <dd>
                  <StatusBadge status={complaint.status} />
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Date Submitted</dt>
                <dd className="text-right text-slate-700">
                  {formatDateTime(complaint.created_at)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Last Updated</dt>
                <dd className="text-right text-slate-700">
                  {formatDateTime(complaint.updated_at)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
