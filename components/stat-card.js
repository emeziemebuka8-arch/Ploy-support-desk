import { Card } from "@/components/ui/card";

/** One of the four simple numbers shown at the top of the dashboard. */
export default function StatCard({ label, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
          {Icon && <Icon className="h-4 w-4" />}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </Card>
  );
}
