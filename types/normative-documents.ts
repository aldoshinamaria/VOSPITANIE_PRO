export type NormativeDocumentLevel = "federal" | "regional" | "municipal" | "local";

export type NormativeDocumentCategory =
  | "federal_work_program"
  | "federal_calendar_plan"
  | "regional_document"
  | "municipal_document"
  | "local_school_document";

export type NormativeDocumentActualityStatus = "current" | "needs_review" | "outdated";

export type ComplianceStatus = "compliant" | "needs_update" | "has_discrepancies";

export type NormativeChangeType = "added" | "removed" | "changed";

export type NormativeRecommendationPriority = "high" | "medium" | "low";

export interface NormativeRequirement {
  id: string;
  title: string;
  section: string;
  description: string;
  sourceDocumentId: string;
}

export interface NormativeDocument {
  id: string;
  title: string;
  category: NormativeDocumentCategory;
  level: NormativeDocumentLevel;
  documentDate: string;
  version: string;
  source: string;
  actualityStatus: NormativeDocumentActualityStatus;
  uploadedAt: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  requirements: NormativeRequirement[];
}

export interface NormativeDocumentChange {
  id: string;
  type: NormativeChangeType;
  section: string;
  title: string;
  description: string;
  sourceDocumentId: string;
}

export interface NormativeDocumentComparison {
  documentAId: string;
  documentBId: string;
  added: NormativeDocumentChange[];
  removed: NormativeDocumentChange[];
  changed: NormativeDocumentChange[];
}

export interface WorkProgramDiscrepancy {
  id: string;
  section: string;
  title: string;
  description: string;
  sourceDocumentId: string;
  sourceTitle: string;
  status: ComplianceStatus;
}

export interface NormativeRecommendation {
  id: string;
  priority: NormativeRecommendationPriority;
  title: string;
  description: string;
  targetSection: string;
  sourceDocumentId: string;
}

export interface WorkProgramComplianceResult {
  status: ComplianceStatus;
  checkedAt: string;
  discrepancies: WorkProgramDiscrepancy[];
  recommendations: NormativeRecommendation[];
}
