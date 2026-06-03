import { Badge } from "@/components/ui/badge";
import { eventStatusLabels, priorityLabels } from "@/lib/domain/events";
import type { ActivityStatus, EventStatus, Priority } from "@/types/domain";

const statusLabels: Record<ActivityStatus, string> = {
  planned: "Запланировано",
  in_progress: "В работе",
  completed: "Завершено"
};

export function StatusBadge({ status }: { status: ActivityStatus }) {
  const variant = status === "completed" ? "success" : status === "in_progress" ? "warning" : "secondary";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variant = priority === "high" ? "warning" : "outline";

  return <Badge variant={variant}>{priorityLabels[priority]}</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const variant = status === "completed" ? "success" : status === "cancelled" ? "secondary" : "warning";

  return <Badge variant={variant}>{eventStatusLabels[status]}</Badge>;
}
