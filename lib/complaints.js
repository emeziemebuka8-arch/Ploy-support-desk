/**
 * Customer complaint data access.
 * ---------------------------------------------------------------
 * The public portal never writes to the database directly. These
 * functions call the two controlled database functions created in
 * supabase/02-public-functions.sql:
 *
 *   submit_complaint(...)  saves one complaint and returns PSD-####
 *   track_complaint(...)   returns only the five public fields
 *
 * Validation happens in three layers: the form, this file, and the
 * database function. Any one of them is enough to stop bad input.
 *
 * The submission limit now lives in the database (supabase/04-security.sql)
 * inside submit_complaint, so it survives restarts and cannot be bypassed
 * by calling the function directly.
 */

import { CATEGORIES } from "./constants";
import { getSupabaseServerClient } from "./supabase/server";

/** Validate the public form. Returns an object keyed by field name. */
export function validateComplaint(values) {
  const errors = {};
  const text = (value) => (typeof value === "string" ? value.trim() : "");

  if (!text(values.customer_name)) {
    errors.customer_name = "Please enter your name.";
  } else if (text(values.customer_name).length > 120) {
    errors.customer_name = "Name must be 120 characters or fewer.";
  }

  if (!text(values.customer_email)) {
    errors.customer_email = "Please enter your email address.";
  } else if (
    text(values.customer_email).length > 200 ||
    !/^\S+@\S+\.\S+$/.test(text(values.customer_email))
  ) {
    errors.customer_email = "Enter a valid email address.";
  }

  if (text(values.customer_phone).length > 40) {
    errors.customer_phone = "Phone number must be 40 characters or fewer.";
  }

  if (!text(values.subject)) {
    errors.subject = "Please enter a short subject.";
  } else if (text(values.subject).length > 200) {
    errors.subject = "Subject must be 200 characters or fewer.";
  }

  if (!text(values.description)) {
    errors.description = "Please describe the problem.";
  } else if (text(values.description).length > 5000) {
    errors.description = "Description must be 5000 characters or fewer.";
  }

  if (!CATEGORIES.some((category) => category.id === values.category_id)) {
    errors.category_id = "Please choose a category.";
  }

  return errors;
}

/**
 * Save a validated complaint.
 * The database sets the ticket number, "Open" status, "Website" source,
 * Medium priority and both timestamps. Returns { ticket_number }.
 */
export async function createComplaint(values) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("submit_complaint", {
    p_customer_name: values.customer_name.trim(),
    p_customer_email: values.customer_email.trim(),
    p_customer_phone: (values.customer_phone || "").trim(),
    p_subject: values.subject.trim(),
    p_description: values.description.trim(),
    p_category_id: values.category_id,
  });

  if (error) throw error;

  return { ticket_number: data };
}

/**
 * Find a complaint by ticket number AND email.
 * The database function returns zero rows when either value is wrong,
 * and only the fields a customer is allowed to see.
 */
export async function findPublicComplaint(ticketNumber, email) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("track_complaint", {
    p_ticket_number: ticketNumber,
    p_email: email,
  });

  if (error) throw error;

  return Array.isArray(data) ? (data[0] ?? null) : null;
}
