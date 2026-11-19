import Badge from "@/components/ui/badge";
import { PRIORITY, STATUS } from "@/lib/constants";

// Status colours: Open = amber, In Progress = blue, Resolved = green.
const statusTones = {
  [STATUS.OPEN]: "amber",
  [STATUS.IN_PROGRESS]: "blue",
  [STATUS.RESOLVED]: "green",
};

export function StatusBadge({ status }) {
  return <Badge tone={statusTones[status]}>{status}</Badge>;
}

// Priority colours: High = red, Medium = amber, Low = grey.
const priorityTones = {
  [PRIORITY.HIGH]: "red",
  [PRIORITY.MEDIUM]: "amber",
  [PRIORITY.LOW]: "slate",
};

export function PriorityBadge({ priority }) {
  return <Badge tone={priorityTones[priority]}>{priority}</Badge>;
}
