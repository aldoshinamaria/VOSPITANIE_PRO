import type { EducationLevel } from "@/types/common";

export type FederalDirectionId =
  | "civic"
  | "patriotic"
  | "spiritual_moral"
  | "aesthetic"
  | "physical"
  | "labor"
  | "environmental"
  | "scientific_knowledge";

export interface FederalDirection {
  id: FederalDirectionId;
  title: string;
  description: string;
  keywords: string[];
  source: string;
}

export interface FederalProgramSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  presenceCriteria: string[];
  completenessCriteria: string[];
  requirementSource: string;
}

export interface FederalRequirement {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  required: boolean;
  keywords: string[];
  source: string;
}

export interface FederalTargetResult {
  id: string;
  educationLevel: EducationLevel;
  directionId: FederalDirectionId;
  text: string;
  required: boolean;
  verificationKeywords: string[];
  source: string;
}

export interface FederalKnowledgeBase {
  id: string;
  title: string;
  version: string;
  updatedAt: string;
  source: string;
  directions: FederalDirection[];
  programSections: FederalProgramSection[];
  requirements: FederalRequirement[];
  targetResults: FederalTargetResult[];
}

export type ComplianceSeverity = "critical" | "warning" | "info";

export type ComplianceStatus = "passed" | "needs_review" | "failed";

export type ComplianceOverallStatus = "compliant" | "partially_compliant" | "needs_revision";

export type ComplianceTargetModule =
  | "work-program"
  | "kpvr"
  | "educational-system"
  | "normative-documents"
  | "federal-knowledge";

export interface ComplianceIssue {
  id: string;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  description: string;
  location: string;
  whyItMatters: string;
  requirementSource: string;
  recommendation: string;
  targetModule: ComplianceTargetModule;
  targetSectionId?: string;
  targetSubsectionId?: string;
  targetUrl: string;
}

export interface ComplianceRecommendation {
  id: string;
  priority: ComplianceSeverity;
  title: string;
  description: string;
  targetLocation: string;
  sourceRequirement: string;
}

export interface SectionCoverageItem {
  sectionId: string;
  title: string;
  required: boolean;
  status: ComplianceStatus;
  score: number;
  textLength: number;
  issueCount: number;
}

export interface DirectionCoverageItem {
  directionId: FederalDirectionId;
  title: string;
  status: ComplianceStatus;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface TargetResultCoverageItem {
  educationLevel: EducationLevel;
  status: ComplianceStatus;
  score: number;
  covered: number;
  total: number;
  missingTargetResultIds: string[];
}

export interface ComplianceCheck {
  overallScore: number;
  sectionCoverage: SectionCoverageItem[];
  directionCoverage: DirectionCoverageItem[];
  targetResultCoverage: TargetResultCoverageItem[];
  issues: ComplianceIssue[];
  recommendations: ComplianceRecommendation[];
  checkedAt: string;
}

export interface ComplianceCheckHistory {
  id: string;
  checkedAt: string;
  overallScore: number;
  status: ComplianceOverallStatus;
  issueCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  snapshot: ComplianceCheck;
}
