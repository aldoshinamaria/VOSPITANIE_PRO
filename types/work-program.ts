export type WorkProgramSectionId =
  | "target"
  | "content"
  | "organizational"
  | "school-culture"
  | "kpvr"
  | "appendices";

export type SchoolCultureSubsectionId =
  | "school-profile"
  | "educational-environment"
  | "associations"
  | "traditions"
  | "partnership"
  | "students-profile";

export type GeneratedParagraphStatus = "generated" | "edited" | "added" | "removed";

export type WorkProgramReadinessStatus = "ready" | "needs_data" | "needs_review";

export interface WorkProgramSource {
  id: string;
  type:
    | "school-passport"
    | "educational-association"
    | "infrastructure"
    | "partner"
    | "event"
    | "kpvr"
    | "extra-activity"
    | "module"
    | "staff"
    | "template";
  title: string;
}

export type GenerationSource = WorkProgramSource;

export interface GeneratedParagraph {
  id: string;
  text: string;
  originalText: string;
  sources: WorkProgramSource[];
  status: GeneratedParagraphStatus;
}

export interface GeneratedContent extends GeneratedParagraph {
  readiness: WorkProgramReadinessStatus;
}

export interface WorkProgramProgress {
  percent: number;
  status: WorkProgramReadinessStatus;
  missingData: string[];
  reviewNotes: string[];
}

export interface SchoolCultureSection {
  id: "school-culture";
  title: string;
  subsections: Array<{
    id: SchoolCultureSubsectionId;
    title: string;
    paragraphs: GeneratedParagraph[];
  }>;
}

export interface WorkProgramSubsection {
  id: string;
  title: string;
  generatedContent: GeneratedContent[];
  progress: WorkProgramProgress;
  sources: WorkProgramSource[];
}

export interface WorkProgramSection {
  id: WorkProgramSectionId;
  title: string;
  status: "planned" | "generated";
  progress: WorkProgramProgress;
  subsections: WorkProgramSubsection[];
  sources: WorkProgramSource[];
  versions: WorkProgramVersion[];
}

export interface WorkProgramVersion {
  id: string;
  title: string;
  createdAt: string;
  sectionId: WorkProgramSectionId;
  section?: SchoolCultureSection;
  subsections?: WorkProgramSubsection[];
  progress?: WorkProgramProgress;
  sourceSummary: string[];
  changeSummary: string;
}

export interface WorkProgram {
  id: string;
  title: string;
  academicYear: string;
  sections: WorkProgramSection[];
  schoolCulture: SchoolCultureSection;
  progress: WorkProgramProgress;
  versions: WorkProgramVersion[];
  sectionVersions: Partial<Record<WorkProgramSectionId, WorkProgramVersion[]>>;
  updatedAt: string;
}
