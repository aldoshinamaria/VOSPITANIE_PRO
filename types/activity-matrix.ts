import type { EducationLevel, EventStatus, SchoolEvent } from "@/types/domain";

export type ActivityMatrixMode = "month" | "quarter" | "educationLevel" | "class" | "responsible" | "module";

export type ActivityMatrixRiskSeverity = "high" | "medium" | "low";

export type ActivityMatrixBalanceStatus = "excellent" | "good" | "needs_attention" | "critical";

export interface ActivityMatrixCell {
  key: string;
  label: string;
  count: number;
  events: SchoolEvent[];
  intensity: number;
}

export interface ActivityMatrixRow {
  directionId: string;
  directionTitle: string;
  total: number;
  cells: ActivityMatrixCell[];
  isEmpty: boolean;
}

export interface ActivityMatrixColumn {
  key: string;
  label: string;
}

export interface ActivityMatrixRisk {
  id: string;
  severity: ActivityMatrixRiskSeverity;
  title: string;
  description: string;
  reason: string;
  recommendation: string;
  directionId?: string;
  columnKey?: string;
}

export interface ActivityMatrixRecommendation {
  id: string;
  text: string;
  priority: ActivityMatrixRiskSeverity;
}

export interface ActivityMatrixBalanceIndex {
  score: number;
  status: ActivityMatrixBalanceStatus;
  label: string;
  explanation: string;
}

export interface ActivityMatrixAnalysis {
  balance: ActivityMatrixBalanceIndex;
  risks: ActivityMatrixRisk[];
  recommendations: ActivityMatrixRecommendation[];
  emptyDirections: string[];
  emptyColumns: string[];
  overloadedColumns: string[];
  uncoveredEducationLevels: EducationLevel[];
  uncoveredClasses: string[];
}

export interface ActivityMatrix {
  mode: ActivityMatrixMode;
  columns: ActivityMatrixColumn[];
  rows: ActivityMatrixRow[];
  totalEvents: number;
  maxCellCount: number;
  analysis: ActivityMatrixAnalysis;
}

export interface ActivityMatrixInput {
  mode: ActivityMatrixMode;
  events: SchoolEvent[];
  directions: Array<{
    id: string;
    title: string;
    active: boolean;
  }>;
  relations: Array<{
    eventId: string;
    directionId: string;
  }>;
  modules: Array<{
    id: string;
    title: string;
  }>;
  expectedClasses?: string[];
}

export interface ActivityMatrixStatusSummary {
  status: EventStatus;
  count: number;
}
