import { MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/format";

/**
 * ActivityList
 * Shows the most recent events first: status changes, notes and the
 * creation message. Each entry has a message and a date/time.
 */
export default function ActivityList({ updates }) {
  if (updates.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No activity recorded for this ticket yet.
      </p>
    );
  }

  const newestFirst = [...updates].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <ol className="space-y-4">
      {newestFirst.map((update) => (
        <li key={update.id} className="flex gap-3">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <MessageSquare className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-slate-700">{update.message}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(update.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
