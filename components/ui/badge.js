import { cn } from "@/lib/utils";

// A limited palette keeps statuses easy to recognise.
const tones = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

/** Small coloured label used for statuses and priorities. */
export default function Badge({ tone = "slate", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        tones[tone] || tones.slate,
        className
      )}
      {...props}
    />
  );
}
