"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Inbox, Trash2 } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import { formatDate } from "@/lib/format";
import { getCategoryName } from "@/lib/tickets";
import Button, { buttonClass } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * TicketTable
 * Used by the dashboard (compact version) and the All Tickets page.
 *
 * Props:
 * - tickets: the rows to show
 * - categories: needed to display the category name
 * - showCategory: hide the category column on the dashboard
 * - onDelete: when provided, a delete button is shown for each row
 */
export default function TicketTable({
  tickets,
  categories,
  showCategory = true,
  onDelete,
  emptyTitle = "No tickets found",
  emptyDescription = "Tickets you create will appear here.",
}) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (failure) {
      setDeleteError(
        failure?.message || "The ticket could not be deleted. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <Inbox className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
        <p className="text-sm text-slate-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              {showCategory && (
                <th className="px-4 py-3 font-medium">Category</th>
              )}
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                  {ticket.ticket_number}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {ticket.customer_name}
                </td>
                <td className="max-w-[260px] truncate px-4 py-3 text-slate-700">
                  {ticket.subject}
                </td>
                {showCategory && (
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {getCategoryName(categories, ticket.category_id)}
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {ticket.source}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {formatDate(ticket.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className={buttonClass({
                        variant: "ghost",
                        size: "sm",
                        className: "text-blue-600 hover:text-blue-700",
                      })}
                      title="View ticket"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDelete(ticket)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete ticket"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">
                          Delete {ticket.ticket_number}
                        </span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setPendingDelete(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Delete this ticket?</DialogTitle>
          <DialogDescription>
            {pendingDelete?.ticket_number} — {pendingDelete?.subject}. This will
            permanently remove the ticket and its activity history.
          </DialogDescription>
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
