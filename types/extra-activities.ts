import type { EducationLevel } from "@/types/common";

export type ExtraActivityType = "extracurricular" | "additional_education";

export type ExtraActivityStatus = "active" | "inactive";

export interface ExtraActivity {
  id: string;
  title: string;
  type: ExtraActivityType;
  area: string;
  educationLevels: EducationLevel[];
  classes: string;
  teacher: string;
  classroom: string;
  schedule: string;
  weeklyHours: number;
  totalHours: number;
  studentsCount: number;
  status: ExtraActivityStatus;
}
