import EditTicketClient from "./edit-ticket-client";

export const instant = false;

/** Server component for /tickets/[id]/edit. */
export default async function EditTicketPage({ params }) {
  const { id } = await params;
  return <EditTicketClient ticketId={id} />;
}
