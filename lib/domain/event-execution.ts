import { createId } from "@/lib/utils";
import type {
  EventExecution,
  EventExecutionComment,
  EventExecutionEvidence,
  EventExecutionRisk,
  EventExecutionStatistics,
  EventExecutionStatus,
  SchoolEvent
} from "@/types/domain";

const systemAuthor = "Система";

export const eventExecutionStatusLabels: Record<EventExecutionStatus, string> = {
  draft: "Черновик",
  planned: "Запланировано",
  assigned: "Назначены ответственные",
  in_progress: "В работе",
  completed: "Проведено",
  confirmed: "Подтверждено",
  included_in_report: "Включено в отчетность",
  cancelled: "Отменено",
  overdue: "Просрочено"
};

export function migrateEventExecutions(events: SchoolEvent[], executions?: EventExecution[]) {
  const existing = Array.isArray(executions) ? executions : [];
  const byEventId = new Map(existing.map((execution) => [execution.eventId, execution]));

  return events.map((event) => normalizeEventExecution(event, byEventId.get(event.id)));
}

export function normalizeEventExecution(event: SchoolEvent, execution?: Partial<EventExecution>): EventExecution {
  const status = execution?.status ?? inferExecutionStatus(event);
  const percent = execution?.progress?.percent ?? inferProgress(status);

  return {
    id: execution?.id ?? `execution-${event.id}`,
    eventId: event.id,
    status,
    progress: {
      percent,
      updatedAt: execution?.progress?.updatedAt ?? new Date().toISOString()
    },
    actualDate: execution?.actualDate ?? (event.status === "completed" ? event.endDate : ""),
    responsible: execution?.responsible ?? event.responsible,
    coExecutors: execution?.coExecutors ?? event.coExecutors,
    confirmed: execution?.confirmed ?? (status === "confirmed" || status === "included_in_report"),
    confirmedAt: execution?.confirmedAt ?? "",
    evidence: execution?.evidence ?? [],
    comments: execution?.comments ?? [],
    history: execution?.history ?? [],
    reminders: execution?.reminders ?? []
  };
}

export function syncEventStatusFromExecution(event: SchoolEvent, execution: EventExecution): SchoolEvent {
  return {
    ...event,
    status: execution.status === "cancelled" ? "cancelled" : execution.status === "completed" || execution.status === "confirmed" || execution.status === "included_in_report" ? "completed" : "planned",
    responsible: execution.responsible,
    coExecutors: execution.coExecutors,
    shortReport: execution.comments.at(-1)?.text ?? event.shortReport
  };
}

export class EventExecutionRiskAnalyzer {
  analyze(events: SchoolEvent[], executions: EventExecution[]): EventExecutionRisk[] {
    const executionByEventId = new Map(executions.map((execution) => [execution.eventId, execution]));

    return events.flatMap((event) => {
      const execution = normalizeEventExecution(event, executionByEventId.get(event.id));
      const risks: EventExecutionRisk[] = [];

      if (isOverdue(event, execution)) {
        risks.push(risk(event.id, "overdue", "high", "Мероприятие просрочено", "Срок окончания прошел, статус исполнения не закрыт.", "Провести мероприятие, перенести срок или указать причину отмены."));
      }

      if (!execution.responsible.trim()) {
        risks.push(risk(event.id, "no-responsible", "high", "Нет ответственного", "У мероприятия не указан ответственный за исполнение.", "Назначить ответственного и соисполнителей."));
      }

      if (execution.status === "completed" && !execution.confirmed) {
        risks.push(risk(event.id, "not-confirmed", "medium", "Проведение не подтверждено", "Мероприятие отмечено как проведенное, но не подтверждено.", "Проверить результат и подтвердить проведение."));
      }

      if ((execution.status === "completed" || execution.status === "confirmed") && !event.shortReport.trim() && execution.comments.length === 0) {
        risks.push(risk(event.id, "no-results", "medium", "Нет результата", "Не заполнен краткий отчет или комментарий по итогам.", "Добавить краткий результат мероприятия."));
      }

      if ((execution.status === "completed" || execution.status === "confirmed") && execution.evidence.length === 0) {
        risks.push(risk(event.id, "no-evidence", "low", "Нет доказательств", "Не добавлены ссылки или материалы проведения.", "Добавить ссылку, отчет, приказ или фотоотчет."));
      }

      return risks;
    });
  }
}

export function createEventExecutionRiskAnalyzer() {
  return new EventExecutionRiskAnalyzer();
}

export function calculateEventExecutionStatistics(events: SchoolEvent[], executions: EventExecution[]): EventExecutionStatistics {
  const normalized = migrateEventExecutions(events, executions);
  const total = normalized.length;
  const completed = normalized.filter((execution) => ["completed", "confirmed", "included_in_report"].includes(execution.status)).length;
  const confirmed = normalized.filter((execution) => execution.confirmed || execution.status === "confirmed" || execution.status === "included_in_report").length;
  const overdue = normalized.filter((execution) => execution.status === "overdue").length;
  const withoutResponsible = normalized.filter((execution) => !execution.responsible.trim()).length;

  return {
    total,
    draft: countStatus(normalized, "draft"),
    planned: countStatus(normalized, "planned"),
    assigned: countStatus(normalized, "assigned"),
    inProgress: countStatus(normalized, "in_progress"),
    completed,
    confirmed,
    overdue,
    cancelled: countStatus(normalized, "cancelled"),
    completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    confirmedPercent: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    overduePercent: total > 0 ? Math.round((overdue / total) * 100) : 0,
    withoutResponsiblePercent: total > 0 ? Math.round((withoutResponsible / total) * 100) : 0
  };
}

export function updateExecutionStatus(execution: EventExecution, status: EventExecutionStatus, author = systemAuthor): EventExecution {
  const nextExecution = {
    ...execution,
    status,
    progress: {
      percent: Math.max(execution.progress.percent, inferProgress(status)),
      updatedAt: new Date().toISOString()
    },
    confirmed: status === "confirmed" || status === "included_in_report" ? true : execution.confirmed,
    confirmedAt: status === "confirmed" || status === "included_in_report" ? new Date().toISOString() : execution.confirmedAt,
    history: [
      ...execution.history,
      {
        id: createId("execution-history"),
        eventId: execution.eventId,
        author,
        changedAt: new Date().toISOString(),
        field: "status",
        from: eventExecutionStatusLabels[execution.status],
        to: eventExecutionStatusLabels[status]
      }
    ]
  };

  return nextExecution;
}

export function updateExecutionProgress(execution: EventExecution, percent: number, author = systemAuthor): EventExecution {
  const nextPercent = Math.max(0, Math.min(100, Math.round(percent)));

  return {
    ...execution,
    progress: {
      percent: nextPercent,
      updatedAt: new Date().toISOString()
    },
    history: [
      ...execution.history,
      {
        id: createId("execution-history"),
        eventId: execution.eventId,
        author,
        changedAt: new Date().toISOString(),
        field: "progress",
        from: String(execution.progress.percent),
        to: String(nextPercent)
      }
    ]
  };
}

export function addExecutionComment(execution: EventExecution, text: string, author = "Заместитель директора"): EventExecution {
  const comment: EventExecutionComment = {
    id: createId("execution-comment"),
    eventId: execution.eventId,
    author,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  return {
    ...execution,
    comments: [...execution.comments, comment],
    history: [
      ...execution.history,
      {
        id: createId("execution-history"),
        eventId: execution.eventId,
        author,
        changedAt: comment.createdAt,
        field: "comment",
        from: "",
        to: comment.text
      }
    ]
  };
}

export function addExecutionEvidence(execution: EventExecution, title: string, url: string): EventExecution {
  const evidence: EventExecutionEvidence = {
    id: createId("execution-evidence"),
    eventId: execution.eventId,
    type: "link",
    title: title.trim(),
    url: url.trim(),
    createdAt: new Date().toISOString()
  };

  return {
    ...execution,
    evidence: [...execution.evidence, evidence]
  };
}

function inferExecutionStatus(event: SchoolEvent): EventExecutionStatus {
  if (event.status === "cancelled") {
    return "cancelled";
  }

  if (event.status === "completed") {
    return "completed";
  }

  return isPast(event.endDate) ? "overdue" : event.responsible ? "assigned" : "planned";
}

function inferProgress(status: EventExecutionStatus) {
  if (status === "draft") return 0;
  if (status === "planned") return 10;
  if (status === "assigned") return 25;
  if (status === "in_progress") return 50;
  if (status === "completed") return 85;
  if (status === "confirmed") return 95;
  if (status === "included_in_report") return 100;
  if (status === "cancelled") return 0;
  return 0;
}

function isOverdue(event: SchoolEvent, execution: EventExecution) {
  return !["completed", "confirmed", "included_in_report", "cancelled"].includes(execution.status) && isPast(event.endDate);
}

function isPast(value: string) {
  const date = new Date(`${value}T23:59:59`);

  return Number.isFinite(date.getTime()) && date < new Date();
}

function risk(eventId: string, code: string, level: EventExecutionRisk["level"], title: string, reason: string, recommendation: string): EventExecutionRisk {
  return {
    id: `${eventId}-${code}`,
    eventId,
    level,
    title,
    reason,
    recommendation
  };
}

function countStatus(executions: EventExecution[], status: EventExecutionStatus) {
  return executions.filter((execution) => execution.status === status).length;
}
