"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAuthServerClient } from "@/lib/supabase/server";

/**
 * Ticket server actions.
 * ---------------------------------------------------------------
 * Every change goes through the Next.js server, which talks to Supabase
 * with the administrator's session cookies. RLS then checks that the
 * request really comes from a signed-in administrator, and the
 * service-role key is never needed.
 *
 * Each action returns the rows it wrote so the client can update its
 * list immediately without reloading the page.
 */

const TICKET_FIELDS = [
  "customer_name",
  "customer_email",
  "customer_phone",
  "subject",
  "description",
  "category_id",
  "priority",
  "source",
];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Keep only the fields an administrator is allowed to edit. */
function cleanTicketValues(values = {}) {
  const clean = {};

  for (const field of TICKET_FIELDS) {
    clean[field] = cleanText(values[field]);
  }

  return clean;
}

/** Turn Supabase/Postgres errors into something a person can act on. */
function friendlyError(error) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  if (text.includes("row-level security") || text.includes("permission denied")) {
    return "You do not have permission to change this ticket.";
  }
  if (text.includes("duplicate key")) {
    return "That ticket already exists.";
  }
  if (text.includes("violates") || text.includes("invalid input")) {
    return "Some of the details are not valid. Please check the form and try again.";
  }

  return "The change could not be saved. Please try again.";
}

/** Confirm there is a signed-in administrator and read their name. */
async function requireAdmin() {
  const supabase = await getSupabaseAuthServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You are signed out. Please sign in again.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Administrator";

  return { supabase, user, fullName };
}

/** Make the next server render of each page read fresh rows. */
function refreshPages(ticketId) {
  for (const path of ["/dashboard", "/tickets", "/reports", "/settings"]) {
    revalidatePath(path);
  }

  if (ticketId) {
    revalidatePath(`/tickets/${ticketId}`);
  }
}

/** Write one row into the ticket's activity history. */
async function addActivity(
  supabase,
  ticketId,
  userId,
  { message, oldStatus = null, newStatus = null }
) {
  const { data, error } = await supabase
    .from("ticket_updates")
    .insert({
      ticket_id: ticketId,
      message,
      old_status: oldStatus,
      new_status: newStatus,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(friendlyError(error));
  }

  return data;
}

/** Create a ticket. The database supplies the PSD- number. */
export async function createTicket(values) {
  const { supabase, user, fullName } = await requireAdmin();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      ...cleanTicketValues(values),
      status: "Open",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(friendlyError(error));
  }

  const update = await addActivity(supabase, ticket.id, user.id, {
    message: `Ticket created by ${fullName}.`,
    newStatus: "Open",
  });

  refreshPages(ticket.id);

  return { ticket, update };
}

/** Update the editable customer and complaint fields. */
export async function updateTicket(ticketId, values) {
  const { supabase, user } = await requireAdmin();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update(cleanTicketValues(values))
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    throw new Error(friendlyError(error));
  }

  const update = await addActivity(supabase, ticketId, user.id, {
    message: "Ticket details were updated.",
  });

  refreshPages(ticketId);

  return { ticket, update };
}

/** Change the status and record the old and new value. */
export async function changeStatus(ticketId, newStatus, note = "") {
  const { supabase, user } = await requireAdmin();

  const { data: existing, error: readError } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", ticketId)
    .single();

  if (readError) {
    throw new Error(friendlyError(readError));
  }

  if (existing.status === newStatus) {
    return null;
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({ status: newStatus })
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    throw new Error(friendlyError(error));
  }

  const message =
    cleanText(note) ||
    `Status changed from ${existing.status} to ${newStatus}.`;

  const update = await addActivity(supabase, ticketId, user.id, {
    message,
    oldStatus: existing.status,
    newStatus,
  });

  refreshPages(ticketId);

  return { ticket, update };
}

/** Add a progress note without changing the status. */
export async function addNote(ticketId, message) {
  const text = cleanText(message);

  if (!text) {
    throw new Error("Please write a note before saving.");
  }

  const { supabase, user } = await requireAdmin();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    throw new Error(friendlyError(error));
  }

  const update = await addActivity(supabase, ticketId, user.id, {
    message: text,
  });

  refreshPages(ticketId);

  return { ticket, update };
}

/** Delete a ticket. Its activity rows are removed by the database. */
export async function deleteTicket(ticketId) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

  if (error) {
    throw new Error(friendlyError(error));
  }

  refreshPages(ticketId);

  return { id: ticketId };
}

/** Save the administrator's display name to their profile. */
export async function updateProfileName(fullName) {
  const name = cleanText(fullName);

  if (!name) {
    throw new Error("Please enter your name.");
  }

  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name })
    .eq("id", user.id);

  if (error) {
    throw new Error(friendlyError(error));
  }

  // Keep the Auth metadata in sync so the name survives a profile
  // problem and matches what the layout falls back to.
  await supabase.auth.updateUser({ data: { full_name: name } });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    id: user.id,
    full_name: name,
    email: user.email ?? "",
    created_at: user.created_at,
  };
}
