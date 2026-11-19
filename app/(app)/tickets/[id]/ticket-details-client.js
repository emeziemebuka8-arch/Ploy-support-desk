"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Send,
  AlertCircle,
} from "lucide-react";
import { useTickets } from "@/components/tickets-provider";
import { CATEGORIES, STATUSES, STATUS } from "@/lib/constants";
import { formatDateTime, formatDate } from "@/lib/format";
import { getCategoryName } from "@/lib/tickets";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import ActivityList from "@/components/tickets/activity-list";
import Button, { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";

export default function TicketDetailsClient({ ticketId }) {
  const { tickets } = useTickets();
  const ticket = tickets.find((item) => item.id === ticketId);

  if (!ticket) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-slate-900">Ticket not found</p>
        <p className="mt-1 text-sm text-slate-500">
          This ticket may have been deleted.
        </p>
        <Link
          href="/tickets"
          className={buttonClass({ variant: "outline", className: "mt-4" })}
        >
          Back to All Tickets
        </Link>
      </Card>
    );
  }

  // Keying the view by ticket id resets its forms when another ticket opens.
  return <TicketDetails key={ticket.id} ticket={ticket} />;
}

function TicketDetails({ ticket }) {
  const { updates, admin, changeStatus, addNote, markAsResolved } =
    useTickets();

  // `null` means "show the ticket's current status". Once the
  // administrator picks a different option, that choice is stored here.
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ticketUpdates = updates.filter(
    (update) => update.ticket_id === ticket.id
  );
  const isResolved = ticket.status === STATUS.RESOLVED;
  const statusValue = selectedStatus ?? ticket.status;
  const statusChanged = statusValue !== ticket.status;

  function showNotice(message) {
    setNotice(message);
    setError("");
  }

  async function handleStatusUpdate(event) {
    event.preventDefault();
    if (!statusChanged || saving) return;

    setSaving(true);
    setError("");

    try {
      await changeStatus(ticket.id, statusValue, statusNote);
      setStatusNote("");
      setSelectedStatus(null);
      showNotice(`Status changed to ${statusValue}.`);
    } catch (failure) {
      setError(failure?.message || "The status could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    if (!note.trim()) {
      setError("Please write a note before saving.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await addNote(ticket.id, note);
      setNote("");
      showNotice("Note added to the activity history.");
    } catch (failure) {
      setError(failure?.message || "The note could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve() {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await markAsResolved(ticket.id);
      setSelectedStatus(null);
      showNotice("Ticket marked as resolved.");
    } catch (failure) {
      setError(failure?.message || "The ticket could not be resolved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Tickets
      </Link>

      {/* Ticket heading and main actions */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              {ticket.ticket_number}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {ticket.subject}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-sm text-slate-500">
                Created {formatDate(ticket.created_at)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href={`/tickets/${ticket.id}/edit`}
              className={buttonClass({ variant: "outline" })}
            >
              <Pencil className="h-4 w-4" />
              Edit Ticket
            </Link>
            <Button onClick={handleResolve} disabled={isResolved || saving}>
              <CheckCircle2 className="h-4 w-4" />
              Mark as Resolved
            </Button>
          </div>
        </div>
      </Card>

      {/* Success / error messages */}
      {notice && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Complaint description */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Add a note */}
          <Card>
            <CardHeader>
              <CardTitle>Add a Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-3">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. Called the customer and confirmed the issue is fixed."
                  aria-label="Progress note"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    <Send className="h-4 w-4" />
                    Add Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Activity history */}
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList updates={ticketUpdates} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Customer details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Name" value={ticket.customer_name} />
              <DetailRow label="Email" value={ticket.customer_email} />
              <DetailRow label="Phone" value={ticket.customer_phone} />
            </CardContent>
          </Card>

          {/* Ticket information */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Ticket Number" value={ticket.ticket_number} />
              <DetailRow
                label="Category"
                value={getCategoryName(CATEGORIES, ticket.category_id)}
              />
              <DetailRow label="Source" value={ticket.source} />
              <DetailRow label="Created By" value={admin.full_name} />
              <DetailRow
                label="Date Created"
                value={formatDateTime(ticket.created_at)}
              />
              <DetailRow
                label="Last Updated"
                value={formatDateTime(ticket.updated_at)}
              />
            </CardContent>
          </Card>

          {/* Change status */}
          <Card>
            <CardHeader>
              <CardTitle>Change Status</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <Select
                  value={statusValue}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  aria-label="Ticket status"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
                <Textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Reason for the change (optional)"
                  className="min-h-20"
                  aria-label="Status change note"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!statusChanged || saving}
                >
                  {saving ? "Saving..." : "Update Status"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** One label/value row inside the detail cards. */
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">
        {value || "—"}
      </span>
    </div>
  );
}
