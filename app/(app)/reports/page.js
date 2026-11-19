"use client";

import { CheckCircle2, Clock, Inbox, Ticket } from "lucide-react";
import { useTickets } from "@/components/tickets-provider";
import { CATEGORIES, STATUS } from "@/lib/constants";
import { countByCategory, getTicketStats } from "@/lib/tickets";
import StatCard from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Bar colours match the status badges used elsewhere.
const statusBars = [
  { label: STATUS.OPEN, key: "open", colour: "bg-amber-500" },
  { label: STATUS.IN_PROGRESS, key: "inProgress", colour: "bg-blue-500" },
  { label: STATUS.RESOLVED, key: "resolved", colour: "bg-emerald-500" },
];

export default function ReportsPage() {
  const { tickets } = useTickets();
  const stats = getTicketStats(tickets);
  const categoryCounts = countByCategory(tickets, CATEGORIES);

  // The largest category sets the scale for the category bars.
  const largestCategory = Math.max(
    1,
    ...categoryCounts.map((category) => category.count)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">
          A simple summary of all recorded complaints.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Complaints" value={stats.total} icon={Ticket} />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} />
        <StatCard label="Open" value={stats.open} icon={Inbox} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Complaints by status — deliberately a simple CSS bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusBars.map((bar) => {
              const count = stats[bar.key];
              const percent =
                stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);

              return (
                <div key={bar.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {bar.label}
                    </span>
                    <span className="text-slate-500">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${bar.colour}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {stats.total === 0 && (
              <p className="text-sm text-slate-500">
                No complaints recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Complaints by category */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryCounts.map((category) => (
              <div key={category.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {category.name}
                  </span>
                  <span className="text-slate-500">{category.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(category.count / largestCategory) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* The same numbers in a simple table, useful for a printed report */}
      <Card>
        <CardHeader>
          <CardTitle>Category Summary</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {categoryCounts.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {category.description}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {category.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
