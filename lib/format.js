/**
 * Format a date as "16 Nov 2026".
 * Returns a dash when the value is missing so tables stay tidy.
 */
export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Format a date and time as "16 Nov 2026, 09:15".
 * Used on the ticket details page and in the activity history.
 */
export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
