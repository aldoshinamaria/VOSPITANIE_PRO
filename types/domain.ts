export type { ActivityStatus, EducationLevel, Priority } from "@/types/common";
export type { AppState } from "@/types/app-state";
export type {
  ActivityDirection,
  ActivityDirectionCategory,
  ActivityDirectionGroup,
  DirectionStatistics,
  EventDirectionRelation
} from "@/types/activity-directions";
export type {
  ActivityPlan,
  ActivityPlanExportOptions,
  ActivityPlanFilter,
  ActivityPlanGrouping,
  ActivityPlanProjection,
  ActivityPlanSection,
  ActivityPlanStatistics,
  ActivityPlanTemplate
} from "@/types/activity-plans";
export type {
  ActivityMatrix,
  ActivityMatrixAnalysis,
  ActivityMatrixBalanceIndex,
  ActivityMatrixBalanceStatus,
  ActivityMatrixCell,
  ActivityMatrixColumn,
  ActivityMatrixInput,
  ActivityMatrixMode,
  ActivityMatrixRecommendation,
  ActivityMatrixRisk,
  ActivityMatrixRiskSeverity,
  ActivityMatrixRow,
  ActivityMatrixStatusSummary
} from "@/types/activity-matrix";
export type {
  ActivityReport,
  ActivityReportExportOptions,
  ActivityReportFilter,
  ActivityReportInsight,
  ActivityReportInsightType,
  ActivityReportPeriodMode,
  ActivityReportProjection,
  ActivityReportRecommendation,
  ActivityReportRisk,
  ActivityReportRiskLevel,
  ActivityReportSection,
  ActivityReportSourceProjection,
  ActivityReportStatistics,
  ActivityReportTemplate,
  ReportAIAnalyzer,
  ReportNarrativeGenerator,
  ReportRecommendationAI
} from "@/types/activity-reports";
export type {
  InspectionAIAnalyzer,
  InspectionChecklist,
  InspectionEvidence,
  InspectionGap,
  InspectionPackage,
  InspectionPackageItem,
  InspectionPackageSection,
  InspectionReadiness,
  InspectionReadinessAI,
  InspectionRecommendation,
  InspectionRecommendationAI,
  InspectionRequirement,
  InspectionRequirementStatus,
  InspectionRisk,
  InspectionRiskLevel,
  InspectionScenario,
  InspectionScenarioId
} from "@/types/inspection-center";
export type { EducationModule } from "@/types/modules";
export type {
  DocumentAnalysisPayload,
  DocumentClassification,
  DocumentKind,
  DocumentProcessingLogEntry,
  DocumentProcessingLogLevel,
  DocumentProcessingRecord,
  DocumentProcessingStage,
  DocumentSourceType,
  DocumentValidationStatus,
  NormalizedDocument,
  NormalizedDocumentList,
  NormalizedDocumentMetadata,
  NormalizedDocumentSection,
  NormalizedDocumentTable
} from "@/types/document-processing";
export type { DemoSchoolTemplate, DemoSchoolTemplateId } from "@/types/demo-school";
export type {
  FederalDirection,
  FederalDirectionId,
  FederalKnowledgeBase,
  FederalProgramSection,
  FederalRequirement,
  FederalTargetResult,
  ComplianceCheck,
  ComplianceCheckHistory,
  ComplianceIssue,
  ComplianceOverallStatus,
  ComplianceRecommendation,
  ComplianceSeverity,
  ComplianceStatus,
  ComplianceTargetModule,
  DirectionCoverageItem,
  SectionCoverageItem,
  TargetResultCoverageItem
} from "@/types/federal-knowledge";
export type {
  EducationalAssociation,
  EducationalAssociationType,
  EducationalSystem,
  EducationalSystemPartner,
  EducationalSystemStatus,
  InfrastructureObjectType,
  SchoolInfrastructureObject
} from "@/types/educational-system";
export type { EventStatus, SchoolEvent } from "@/types/events";
export type {
  EventExecution,
  EventExecutionComment,
  EventExecutionEvidence,
  EventExecutionEvidenceType,
  EventExecutionHistory,
  EventExecutionProgress,
  EventExecutionReminder,
  EventExecutionRisk,
  EventExecutionRiskLevel,
  EventExecutionStatistics,
  EventExecutionStatus
} from "@/types/event-execution";
export type { ExportDocument } from "@/types/exports";
export type { ExtraActivity, ExtraActivityStatus, ExtraActivityType } from "@/types/extra-activities";
export type {
  ExtractedEvent,
  ExtractedEventStatus,
  ImportedDocument,
  ImportedDocumentStatus,
  ImportedDocumentType
} from "@/types/imported-documents";
export type { KpvrItem } from "@/types/kpvr";
export type {
  ComplianceStatus as NormativeComplianceStatus,
  NormativeDocument,
  NormativeDocumentActualityStatus,
  NormativeDocumentCategory,
  NormativeDocumentChange,
  NormativeDocumentComparison,
  NormativeDocumentLevel,
  NormativeRecommendation,
  NormativeRecommendationPriority,
  NormativeRequirement,
  WorkProgramComplianceResult,
  WorkProgramDiscrepancy
} from "@/types/normative-documents";
export type { SchoolInfrastructure, SchoolPassport, SocialPartner } from "@/types/school";
export type {
  SchoolReadinessArea,
  SchoolReadinessAreaId,
  SchoolReadinessCheck,
  SchoolReadinessItem,
  SchoolReadinessStatus
} from "@/types/school-readiness";
export type {
  GeneratedParagraph,
  GeneratedParagraphStatus,
  GeneratedContent,
  GenerationSource,
  SchoolCultureSection,
  SchoolCultureSubsectionId,
  WorkProgramProgress,
  WorkProgramReadinessStatus,
  WorkProgram,
  WorkProgramSection,
  WorkProgramSectionId,
  WorkProgramSource,
  WorkProgramSubsection,
  WorkProgramVersion
} from "@/types/work-program";
