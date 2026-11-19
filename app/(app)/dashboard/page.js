"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Inbox, Plus, Ticket } from "lucide-react";
import { useTickets } from "@/components/tickets-provider";
import { CATEGORIES } from "@/lib/constants";
import { getTicketStats, sortByNewest } from "@/lib/tickets";
import StatCard from "@/components/stat-card";
import TicketTable from "@/components/tickets/ticket-table";
import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { tickets } = useTickets();

  // All four numbers come from the same ticket list, so they always agree.
  const stats = getTicketStats(tickets);
  const recentTickets = sortByNewest(tickets).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page heading and main action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">
            A quick summary of customer complaints.
          </p>
        </div>
        <Link href="/tickets/new" className={buttonClass()}>
          <Plus className="h-4 w-4" />
          Create Ticket
        </Link>
      </div>

      {/* Four simple statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tickets" value={stats.total} icon={Ticket} />
        <StatCard label="Open Tickets" value={stats.open} icon={Inbox} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} />
        <StatCard
          label="Resolved Tickets"
          value={stats.resolved}
          icon={CheckCircle2}
        />
      </div>

      {/* Five most recent tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tickets</CardTitle>
          <Link
            href="/tickets"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </CardHeader>
        <TicketTable
          tickets={recentTickets}
          categories={CATEGORIES}
          showCategory={false}
        />
      </Card>
    </div>
  );
}
