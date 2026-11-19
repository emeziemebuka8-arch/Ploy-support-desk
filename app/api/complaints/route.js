import { createComplaint, validateComplaint } from "@/lib/complaints";

/**
 * POST /api/complaints
 * Public endpoint used by the customer complaint form.
 *
 * Everything happens on the server: validation, the ticket number, the
 * "Open" status, the source and the timestamps. The browser cannot set
 * any of those itself.
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

  // Hidden spam trap: a real form leaves this empty.
  if (typeof values.website === "string" && values.website.trim() !== "") {
    return Response.json(
      { error: "The request was rejected." },
      { status: 400 }
    );
  }

  const errors = validateComplaint(values);
  if (Object.keys(errors).length > 0) {
    return Response.json(
      {
        error: "Please correct the highlighted fields and try again.",
        errors,
      },
      { status: 400 }
    );
  }

  try {
    const complaint = await createComplaint(values);

    return Response.json(
      { ok: true, ticket_number: complaint.ticket_number },
      { status: 201 }
    );
  } catch (error) {
    // The database rejected the row or could not be reached. The customer
    // gets a short message; the real reason stays in the server log.
    console.error("Complaint submission failed:", error);

    // The database owns the submission limit, so its refusal is the
    // only place this message can come from.
    if (String(error?.message ?? "").includes("Too many complaints")) {
      return Response.json(
        {
          error:
            "Too many complaints have been submitted from this connection. Please wait a few minutes and try again.",
        },
        { status: 429 }
      );
    }

    return Response.json(
      {
        error:
          "We could not save your complaint right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
