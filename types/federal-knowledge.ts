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
