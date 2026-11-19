/**
 * Small, pure helper functions for working with tickets.
 * They contain no React code, which makes them easy to read,
 * test and reuse in every page.
 */

import { STATUS } from "./constants";

/** Count tickets by status for the dashboard and reports page. */
export function getTicketStats(tickets) {
  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === STATUS.OPEN).length,
    inProgress: tickets.filter((ticket) => ticket.status === STATUS.IN_PROGRESS)
      .length,
    resolved: tickets.filter((ticket) => ticket.status === STATUS.RESOLVED)
      .length,
  };
}

/** Turn a category id into a readable category name. */
export function getCategoryName(categories, categoryId) {
  const category = categories.find((item) => item.id === categoryId);
  return category ? category.name : "Uncategorised";
}

/** Newest tickets first. */
export function sortByNewest(tickets) {
  return [...tickets].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

/**
 * Search and filter tickets on the "All Tickets" page.
 * An empty filter value means "no filter".
 */
export function filterTickets(tickets, { search = "", status = "", priority = "", categoryId = "" }) {
  const term = search.trim().toLowerCase();

  return tickets.filter((ticket) => {
    const matchesSearch =
      !term ||
      ticket.ticket_number.toLowerCase().includes(term) ||
      ticket.customer_name.toLowerCase().includes(term) ||
      ticket.subject.toLowerCase().includes(term);

    const matchesStatus = !status || ticket.status === status;
    const matchesPriority = !priority || ticket.priority === priority;
    const matchesCategory = !categoryId || ticket.category_id === categoryId;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
}

/** Count how many tickets belong to each category (for the reports page). */
export function countByCategory(tickets, categories) {
  return categories.map((category) => ({
    ...category,
    count: tickets.filter((ticket) => ticket.category_id === category.id).length,
  }));
}
