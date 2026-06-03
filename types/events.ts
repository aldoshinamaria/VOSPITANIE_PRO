import type { EducationLevel, Priority } from "@/types/common";

export type EventStatus = "planned" | "completed" | "cancelled";

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  direction: string;
  educationLevels: EducationLevel[];
  classes: string;
  startDate: string;
  endDate: string;
  month: number;
  venue: string;
  responsible: string;
  coExecutors: string;
  partner: string;
  status: EventStatus;
  participantsCount: number;
  shortReport: string;
  priority: Priority;
}
