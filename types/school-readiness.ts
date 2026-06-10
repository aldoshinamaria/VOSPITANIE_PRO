export type SchoolReadinessAreaId =
  | "school-passport"
  | "educational-system"
  | "kpvr"
  | "work-program"
  | "normative-base";

export type SchoolReadinessStatus = "ready" | "partial" | "blocked";

export interface SchoolReadinessItem {
  id: string;
  title: string;
  description: string;
  done: boolean;
  required: boolean;
  href: string;
}

export interface SchoolReadinessArea {
  id: SchoolReadinessAreaId;
  title: string;
  status: SchoolReadinessStatus;
  score: number;
  completed: SchoolReadinessItem[];
  missing: SchoolReadinessItem[];
  blockers: string[];
  href: string;
}

export interface SchoolReadinessCheck {
  overallScore: number;
  status: SchoolReadinessStatus;
  filled: SchoolReadinessArea[];
  notFilled: SchoolReadinessArea[];
  blockers: string[];
  areas: SchoolReadinessArea[];
  checkedAt: string;
}
