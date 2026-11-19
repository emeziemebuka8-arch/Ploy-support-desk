/**
 * Shared option lists.
 * Keeping them in one file means the forms, filters, badges and
 * (later) database values always use exactly the same wording.
 */

export const STATUS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export const STATUSES = Object.values(STATUS);

export const PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITIES = Object.values(PRIORITY);

// Every complaint records where it came from. "Website" is set
// automatically by the public complaint form.
export const SOURCES = [
  "Website",
  "WhatsApp",
  "Email",
  "Phone Call",
  "Other",
];

// Categories will come from the Supabase `categories` table in Stage 3.
// For now they live here so the mock data and forms share one source.
export const CATEGORIES = [
  {
    id: "cat-technical",
    name: "Technical Issues",
    description: "Bugs, errors and features that are not working.",
  },
  {
    id: "cat-account",
    name: "Account Access",
    description: "Login, password and account access problems.",
  },
  {
    id: "cat-whatsapp",
    name: "WhatsApp Connection",
    description: "WhatsApp disconnections and connection issues.",
  },
  {
    id: "cat-billing",
    name: "Billing and Payments",
    description: "Payment failures, refunds and subscription questions.",
  },
  {
    id: "cat-invoicing",
    name: "Invoicing",
    description: "Invoice requests, corrections and receipts.",
  },
  {
    id: "cat-general",
    name: "General Enquiries",
    description: "Questions that do not belong to another category.",
  },
];
