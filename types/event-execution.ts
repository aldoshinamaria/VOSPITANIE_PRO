export type EventExecutionStatus =
  | "draft"
  | "planned"
  | "assigned"
  | "in_progress"
  | "completed"
  | "confirmed"
  | "included_in_report"
  | "cancelled"
  | "overdue";

export interface EventExecutionProgress {
  percent: number;
  updatedAt: string;
}

export type EventExecutionEvidenceType = "photo" | "order" | "report" | "link" | "file";

export interface EventExecutionEvidence {
  id: string;
  eventId: string;
  type: EventExecutionEvidenceType;
  title: string;
  url: string;
  createdAt: string;
}

export interface EventExecutionComment {
  id: string;
  eventId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface EventExecutionHistory {
  id: string;
  eventId: string;
  author: string;
  changedAt: string;
  field: string;
  from: string;
  to: string;
}

export interface EventExecutionReminder {
  id: string;
  eventId: string;
  remindAt: string;
  message: string;
  completed: boolean;
}

export type EventExecutionRiskLevel = "high" | "medium" | "low";

export interface EventExecutionRisk {
  id: string;
  eventId: string;
  level: EventExecutionRiskLevel;
  title: string;
  reason: string;
  recommendation: string;
}

export interface EventExecution {
  id: string;
  eventId: string;
  status: EventExecutionStatus;
  progress: EventExecutionProgress;
  actualDate: string;
  responsible: string;
  coExecutors: string;
  confirmed: boolean;
  confirmedAt: string;
  evidence: EventExecutionEvidence[];
  comments: EventExecutionComment[];
  history: EventExecutionHistory[];
  reminders: EventExecutionReminder[];
}

export interface EventExecutionStatistics {
  total: number;
  draft: number;
  planned: number;
  assigned: number;
  inProgress: number;
  completed: number;
  confirmed: number;
  overdue: number;
  cancelled: number;
  completionPercent: number;
  confirmedPercent: number;
  overduePercent: number;
  withoutResponsiblePercent: number;
}
