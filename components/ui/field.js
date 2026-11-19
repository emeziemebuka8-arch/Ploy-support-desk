import { cn } from "@/lib/utils";

// One shared style for every form control keeps forms consistent.
const fieldStyles =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

export function Input({ className, ...props }) {
  return <input className={cn(fieldStyles, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(fieldStyles, "min-h-28 resize-y", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(fieldStyles, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

/** Label plus an optional error message, used by the ticket form. */
export function Field({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
