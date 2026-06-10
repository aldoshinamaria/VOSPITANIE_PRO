import type { EducationLevel, EventStatus, SchoolEvent } from "@/types/domain";

export type ActivityPlanGrouping =
  | "month"
  | "quarter"
  | "module"
  | "educationLevel"
  | "responsible"
  | "direction"
  | "none";

export interface ActivityPlanFilter {
  educationLevel?: EducationLevel | "all";
  className?: string;
  month?: number | "all";
  responsible?: string;
  status?: EventStatus | "all";
  directionId?: string | "all";
  moduleId?: string | "all";
}

export interface ActivityPlanExportOptions {
  includeGoal: boolean;
  includeTasks: boolean;
  includeStatus: boolean;
  includeDirection: boolean;
  grouping: ActivityPlanGrouping;
}

export interface ActivityPlanTemplate {
  id: string;
  directionId: string | "all";
  title: string;
  shortTitle: string;
  goal: string;
  tasks: string[];
  defaultGrouping: ActivityPlanGrouping;
}

export interface ActivityPlanProjection {
  id: string;
  eventId: string;
  event: SchoolEvent;
  title: string;
  date: string;
  startDate: string;
  endDate: string;
  month: number;
  quarter: number;
  classes: string;
  responsible: string;
  status: EventStatus;
  moduleId: string;
  moduleTitle: string;
  directionIds: string[];
  directionTitles: string[];
  educationLevels: EducationLevel[];
}

export interface ActivityPlanSection {
  id: string;
  title: string;
  rows: ActivityPlanProjection[];
}

export interface ActivityPlanStatistics {
  totalEvents: number;
  completedEvents: number;
  plannedEvents: number;
  cancelledEvents: number;
  overdueEvents: number;
  completionPercent: number;
  byDirection: Array<{
    directionId: string;
    directionTitle: string;
    count: number;
  }>;
  byMonth: Array<{
    month: number;
    count: number;
  }>;
  byEducationLevel: Array<{
    level: EducationLevel;
    count: number;
  }>;
}

export interface ActivityPlan {
  id: string;
  title: string;
  academicYear: string;
  directionId: string | "all";
  directionTitle: string;
  goal: string;
  tasks: string[];
  grouping: ActivityPlanGrouping;
  filters: ActivityPlanFilter;
  sections: ActivityPlanSection[];
  rows: ActivityPlanProjection[];
  statistics: ActivityPlanStatistics;
  generatedAt: string;
}
