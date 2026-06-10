import type { EducationLevel } from "@/types/common";

export type ActivityDirectionCategory =
  | "prevention"
  | "safety"
  | "upbringing"
  | "student_community"
  | "school_resource"
  | "support";

export interface ActivityDirectionGroup {
  id: string;
  title: string;
  description: string;
  category: ActivityDirectionCategory;
}

export interface ActivityDirection {
  id: string;
  groupId: string;
  title: string;
  description: string;
  category: ActivityDirectionCategory;
  active: boolean;
  custom: boolean;
}

export interface EventDirectionRelation {
  id: string;
  eventId: string;
  directionId: string;
}

export interface DirectionStatistics {
  directionId: string;
  title: string;
  eventsCount: number;
  byMonth: Array<{
    month: number;
    count: number;
  }>;
  byEducationLevel: Array<{
    level: EducationLevel;
    count: number;
  }>;
}
