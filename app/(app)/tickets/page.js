"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useTickets } from "@/components/tickets-provider";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/constants";
import { filterTickets, sortByNewest } from "@/lib/tickets";
import TicketTable from "@/components/tickets/ticket-table";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";

export default function AllTicketsPage() {
  const { tickets, deleteTicket } = useTickets();

  // Filters live in this page's state. In Stage 5 they will be passed
  // to Supabase as query filters instead of filtering in the browser.
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const visibleTickets = sortByNewest(
    filterTickets(tickets, { search, status, priority, categoryId })
  );

  const hasFilters = Boolean(search || status || priority || categoryId);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategoryId("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">All Tickets</h2>
          <p className="text-sm text-slate-500">
            Every complaint recorded in the support desk.
          </p>
        </div>
        <Link href="/tickets/new" className={buttonClass()}>
          <Plus className="h-4 w-4" />
          Create Ticket
        </Link>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket no, customer or subject"
              className="pl-9"
              aria-label="Search tickets"
            />
          </div>

          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {visibleTickets.length} of {tickets.length} tickets
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Ticket table */}
      <Card>
        <TicketTable
          tickets={visibleTickets}
          categories={CATEGORIES}
          onDelete={deleteTicket}
          emptyTitle={hasFilters ? "No matching tickets" : "No tickets yet"}
          emptyDescription={
            hasFilters
              ? "Try a different search term or clear the filters."
              : "Create your first ticket to get started."
          }
        />
      </Card>
    </div>
  );
}
