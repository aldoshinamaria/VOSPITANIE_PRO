import type { ActivityMatrixAnalysis, ActivityPlan, ActivityPlanProjection, EducationLevel, EventStatus } from "@/types/domain";

export type ActivityReportPeriodMode = "month" | "quarter" | "halfYear" | "academicYear" | "custom";

export type ActivityReportRiskLevel = "high" | "medium" | "low";

export type ActivityReportInsightType = "strength" | "problem" | "trend" | "conclusion" | "recommendation";

export interface ActivityReportFilter {
  directionId: string | "all";
  periodMode: ActivityReportPeriodMode;
  month?: number;
  quarter?: 1 | 2 | 3 | 4;
  halfYear?: 1 | 2;
  startDate?: string;
  endDate?: string;
}

export interface ActivityReportExportOptions {
  includeKpi: boolean;
  includeRisks: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  includeEvents: boolean;
}

export interface ActivityReportTemplate {
  id: string;
  directionId: string | "all";
  title: string;
  description: string;
  defaultFilter: ActivityReportFilter;
}

export interface ActivityReportProjection {
  id: string;
  eventId: string;
  title: string;
  date: string;
  startDate: string;
  endDate: string;
  classes: string;
  responsible: string;
  status: EventStatus;
  directionTitles: string[];
  educationLevels: EducationLevel[];
  participantsCount: number;
}

export interface ActivityReportSection {
  id: string;
  title: string;
  description: string;
  rows: ActivityReportProjection[];
}

export interface ActivityReportStatistics {
  totalEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  plannedEvents: number;
  overdueEvents: number;
  classCoveragePercent: number;
  coveredClasses: string[];
  uncoveredClasses: string[];
  studentCoverage: number;
  directionCoveragePercent: number;
  coveredDirections: number;
  totalDirections: number;
  planCompletionPercent: number;
  confirmedExecutionPercent: number;
  overdueExecutionPercent: number;
  withoutResponsiblePercent: number;
  averageEventsPerClass: number;
  averageEventsPerDirection: number;
}

export interface ActivityReportInsight {
  id: string;
  type: ActivityReportInsightType;
  title: string;
  text: string;
}

export interface ActivityReportRisk {
  id: string;
  level: ActivityReportRiskLevel;
  title: string;
  reason: string;
  recommendation: string;
}

export interface ActivityReportRecommendation {
  id: string;
  priority: ActivityReportRiskLevel;
  text: string;
}

export interface ActivityReport {
  id: string;
  title: string;
  academicYear: string;
  generatedAt: string;
  filter: ActivityReportFilter;
  template: ActivityReportTemplate;
  plan: ActivityPlan;
  matrixAnalysis: ActivityMatrixAnalysis;
  statistics: ActivityReportStatistics;
  sections: ActivityReportSection[];
  insights: ActivityReportInsight[];
  risks: ActivityReportRisk[];
  recommendations: ActivityReportRecommendation[];
}

export interface ReportAIAnalyzer {
  analyze(report: ActivityReport): Promise<unknown>;
}

export interface ReportNarrativeGenerator {
  generate(report: ActivityReport): Promise<string>;
}

export interface ReportRecommendationAI {
  recommend(report: ActivityReport): Promise<ActivityReportRecommendation[]>;
}

export type ActivityReportSourceProjection = ActivityPlanProjection;
