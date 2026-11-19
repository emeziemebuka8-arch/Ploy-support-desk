"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTickets } from "@/components/tickets-provider";
import TicketForm from "@/components/tickets/ticket-form";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EditTicketClient({ ticketId }) {
  const router = useRouter();
  const { tickets, updateTicket } = useTickets();

  const ticket = tickets.find((item) => item.id === ticketId);

  if (!ticket) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-slate-900">Ticket not found</p>
        <p className="mt-1 text-sm text-slate-500">
          This ticket may have been deleted.
        </p>
        <Link
          href="/tickets"
          className={buttonClass({ variant: "outline", className: "mt-4" })}
        >
          Back to All Tickets
        </Link>
      </Card>
    );
  }

  async function handleSave(values) {
    await updateTicket(ticket.id, values);
    router.push(`/tickets/${ticket.id}`);
  }

  // Only the fields the form manages are passed in.
  // Status is changed separately on the details page.
  const initialValues = {
    customer_name: ticket.customer_name,
    customer_email: ticket.customer_email || "",
    customer_phone: ticket.customer_phone || "",
    subject: ticket.subject,
    description: ticket.description,
    category_id: ticket.category_id,
    priority: ticket.priority,
    source: ticket.source,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Edit Ticket</h2>
        <p className="text-sm text-slate-500">
          {ticket.ticket_number} — update the complaint information.
        </p>
      </div>

      <TicketForm
        initialValues={initialValues}
        onSubmit={handleSave}
        submitLabel="Save Changes"
        cancelHref={`/tickets/${ticket.id}`}
      />
    </div>
  );
}
