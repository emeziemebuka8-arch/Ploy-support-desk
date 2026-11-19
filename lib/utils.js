import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Join conditional class names and resolve Tailwind conflicts.
 * This is the standard shadcn/ui `cn` helper.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
