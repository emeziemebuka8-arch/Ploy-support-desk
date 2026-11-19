"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useTickets } from "@/components/tickets-provider";
import TicketForm from "@/components/tickets/ticket-form";

export default function NewTicketPage() {
  const router = useRouter();
  const { createTicket } = useTickets();
  const [createdTicket, setCreatedTicket] = useState(null);

  async function handleCreate(values) {
    const ticket = await createTicket(values);
    setCreatedTicket(ticket);

    // Show the success message briefly, then open the new ticket so the
    // administrator can immediately add a note or change the status.
    setTimeout(() => router.push(`/tickets/${ticket.id}`), 800);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">New Ticket</h2>
        <p className="text-sm text-slate-500">
          Record a complaint reported through WhatsApp, email or phone.
        </p>
      </div>

      {createdTicket && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Ticket {createdTicket.ticket_number} was created. Opening the ticket...
        </div>
      )}

      <TicketForm
        onSubmit={handleCreate}
        submitLabel="Create Ticket"
        cancelHref="/tickets"
      />
    </div>
  );
}
