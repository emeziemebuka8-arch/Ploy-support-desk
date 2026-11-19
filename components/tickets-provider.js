"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createTicket as createTicketAction,
  updateTicket as updateTicketAction,
  changeStatus as changeStatusAction,
  addNote as addNoteAction,
  deleteTicket as deleteTicketAction,
  updateProfileName as updateProfileNameAction,
} from "@/app/(app)/actions";
import { STATUS } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * TicketsProvider
 * ---------------------------------------------------------------
 * Holds the ticket list, activity history and administrator profile
 * for every protected page.
 *
 * Stage 7: the rows now come from Supabase.
 * - The first render receives them from app/(app)/layout.js, which
 *   reads the database on the server.
 * - Each action calls a server action. When it succeeds, the returned
 *   row is merged into local state so the page updates immediately.
 *
 * Stage 9: the browser also subscribes to Supabase Realtime, so rows
 * changed by someone else (for example a customer submitting the
 * public complaint form) appear without a page refresh.
 *
 * Realtime is a one-way notification: it does not replace the
 * database read. The server still supplies the first full list, and
 * the events only tell this browser what changed after that.
 */

const TicketsContext = createContext(null);

export function TicketsProvider({
  children,
  admin: initialAdmin,
  tickets: initialTickets = [],
  updates: initialUpdates = [],
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [updates, setUpdates] = useState(initialUpdates);
  const [admin, setAdmin] = useState(initialAdmin);

  function addTicket(ticket) {
    if (!ticket) return;
    setTickets((previous) => [
      ticket,
      ...previous.filter((item) => item.id !== ticket.id),
    ]);
  }

  function replaceTicket(ticket) {
    if (!ticket) return;
    setTickets((previous) =>
      previous.map((item) => (item.id === ticket.id ? ticket : item))
    );
  }

  // Realtime can deliver a row this browser already merged after a
  // server action, so check the id before appending a duplicate.
  function addUpdate(update) {
    if (!update) return;
    setUpdates((previous) =>
      previous.some((item) => item.id === update.id)
        ? previous
        : [...previous, update]
    );
  }

  function removeTicket(ticketId) {
    setTickets((previous) => previous.filter((ticket) => ticket.id !== ticketId));
    setUpdates((previous) =>
      previous.filter((update) => update.ticket_id !== ticketId)
    );
  }

  /**
   * Subscribe to database changes while the dashboard is open.
   * ------------------------------------------------------------
   * Every Supabase table can broadcast INSERT/UPDATE/DELETE events to
   * browsers that ask for them. We ask for:
   *   - every change to tickets, because a new complaint or a status
   *     change must update the list; and
   *   - new ticket_updates, because they power the activity history.
   *
   * The subscription uses the same signed-in session as the rest of
   * the app, and Row Level Security is checked for every event. A
   * signed-out visitor's subscription receives nothing.
   */
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("admin-ticket-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => addTicket(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets" },
        (payload) => replaceTicket(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tickets" },
        (payload) => removeTicket(payload.old?.id)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_updates" },
        (payload) => addUpdate(payload.new)
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime connection problem:", status);
        }
      });

    // When the dashboard closes, stop listening so the browser does not
    // keep an unused connection open.
    return () => {
      supabase.removeChannel(channel);
    };
    // The handlers only use setState functions, so one subscription is
    // enough for the life of the page.
  }, []);

  /** Create a ticket. New tickets always start as "Open". */
  async function createTicket(values) {
    const { ticket, update } = await createTicketAction(values);
    addTicket(ticket);
    addUpdate(update);
    return ticket;
  }

  /** Update the editable ticket fields. */
  async function updateTicket(ticketId, values) {
    const { ticket, update } = await updateTicketAction(ticketId, values);
    replaceTicket(ticket);
    addUpdate(update);
    return ticket;
  }

  /** Change a ticket's status and record it in the activity history. */
  async function changeStatus(ticketId, newStatus, note = "") {
    const result = await changeStatusAction(ticketId, newStatus, note);
    if (!result) return;
    replaceTicket(result.ticket);
    addUpdate(result.update);
  }

  /** Add a progress note without changing the status. */
  async function addNote(ticketId, message) {
    const { ticket, update } = await addNoteAction(ticketId, message);
    replaceTicket(ticket);
    addUpdate(update);
  }

  /** Mark a ticket as resolved, with an optional resolution note. */
  async function markAsResolved(ticketId, note = "") {
    await changeStatus(
      ticketId,
      STATUS.RESOLVED,
      note.trim() || "Ticket marked as resolved."
    );
  }

  /** Delete a ticket and its activity history. */
  async function deleteTicket(ticketId) {
    await deleteTicketAction(ticketId);
    removeTicket(ticketId);
  }

  /** Update the administrator's display name (Settings page). */
  async function updateAdminName(fullName) {
    const updated = await updateProfileNameAction(fullName);
    setAdmin((previous) => ({ ...previous, ...updated }));
    return updated;
  }

  const value = {
    tickets,
    updates,
    admin,
    createTicket,
    updateTicket,
    changeStatus,
    addNote,
    markAsResolved,
    deleteTicket,
    updateAdminName,
  };

  return (
    <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
  );
}

/** Read the ticket data and actions from any client component. */
export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error("useTickets must be used inside a TicketsProvider");
  }
  return context;
}
