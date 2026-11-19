import { findPublicComplaint } from "@/lib/complaints";

/**
 * POST /api/complaints/track
 * The customer sends a ticket number and email address. The server only
 * answers when both match the same complaint, and only returns the five
 * public fields.
 */
export async function POST(request) {
  let values;

  try {
    values = await request.json();
  } catch {
    return Response.json(
      { error: "The request could not be read. Please try again." },
      { status: 400 }
    );
  }

  const ticketNumber =
    typeof values.ticketNumber === "string" ? values.ticketNumber.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim() : "";

  if (!ticketNumber || !email) {
    return Response.json(
      { error: "Please enter your ticket number and email address." },
      { status: 400 }
    );
  }

  let complaint;

  try {
    complaint = await findPublicComplaint(ticketNumber, email);
  } catch (error) {
    console.error("Complaint tracking failed:", error);

    return Response.json(
      {
        error:
          "We could not check your complaint right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }

  // The same message is used for an unknown ticket and a wrong email, so
  // nobody can use this endpoint to discover other customers' tickets.
  if (!complaint) {
    return Response.json(
      {
        error:
          "We could not find a complaint with those details. Check your ticket number and email address and try again.",
      },
      { status: 404 }
    );
  }

  return Response.json({ complaint });
}
