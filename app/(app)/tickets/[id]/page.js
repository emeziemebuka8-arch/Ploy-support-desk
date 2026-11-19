import TicketDetailsClient from "./ticket-details-client";

export const instant = false;

/**
 * Server component for /tickets/[id].
 * It reads the dynamic `id` from the URL and hands it to the client
 * component, which reads the ticket from the data provider.
 */
export default async function TicketDetailsPage({ params }) {
  const { id } = await params;
  return <TicketDetailsClient ticketId={id} />;
}
