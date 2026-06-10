export type InspectionScenarioId =
  | "school-self-audit"
  | "ddtt"
  | "offense-prevention"
  | "school-museum"
  | "first-movement"
  | "volunteer-team"
  | "parent-work"
  | "internal-control"
  | "municipal-monitoring";

export type InspectionRequirementStatus = "ready" | "needs_work" | "missing";

export type InspectionRiskLevel = "high" | "medium" | "low";

export interface InspectionScenario {
  id: InspectionScenarioId;
  title: string;
  description: string;
  directionId: string | "all";
  minimumEvents: number;
  requiredDocuments: string[];
}

export interface InspectionRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  status: InspectionRequirementStatus;
  source: string;
}

export interface InspectionGap {
  id: string;
  title: string;
  description: string;
  fixUrl: string;
}

export interface InspectionRisk {
  id: string;
  level: InspectionRiskLevel;
  title: string;
  reason: string;
  recommendation: string;
}

export interface InspectionRecommendation {
  id: string;
  priority: InspectionRiskLevel;
  text: string;
  targetUrl: string;
}

export interface InspectionEvidence {
  id: string;
  title: string;
  sourceType: "event" | "plan" | "report" | "matrix" | "execution" | "work-program" | "compliance" | "normative";
  sourceId: string;
  description: string;
}

export interface InspectionChecklist {
  ready: InspectionRequirement[];
  needsWork: InspectionRequirement[];
  missing: InspectionRequirement[];
}

export interface InspectionReadiness {
  scenarioId: InspectionScenarioId;
  score: number;
  status: "ready" | "partially_ready" | "not_ready";
  label: string;
  checklist: InspectionChecklist;
  gaps: InspectionGap[];
  risks: InspectionRisk[];
  recommendations: InspectionRecommendation[];
}

export interface InspectionPackageItem {
  id: string;
  title: string;
  description: string;
  sourceType: InspectionEvidence["sourceType"];
  sourceId: string;
  status: InspectionRequirementStatus;
}

export interface InspectionPackageSection {
  id: string;
  title: string;
  items: InspectionPackageItem[];
}

export interface InspectionPackage {
  id: string;
  scenario: InspectionScenario;
  title: string;
  readiness: InspectionReadiness;
  sections: InspectionPackageSection[];
  evidence: InspectionEvidence[];
  generatedAt: string;
}

export interface InspectionAIAnalyzer {
  analyze(pack: InspectionPackage): Promise<unknown>;
}

export interface InspectionRecommendationAI {
  recommend(readiness: InspectionReadiness): Promise<InspectionRecommendation[]>;
}

export interface InspectionReadinessAI {
  score(pack: InspectionPackage): Promise<InspectionReadiness>;
}
