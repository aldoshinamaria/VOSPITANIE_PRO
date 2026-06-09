import type { EducationModule } from "@/types/modules";
import type { DocumentProcessingLogEntry, DocumentProcessingRecord } from "@/types/document-processing";
import type { EducationalSystem } from "@/types/educational-system";
import type { ExportDocument } from "@/types/exports";
import type { ExtraActivity } from "@/types/extra-activities";
import type { ExtractedEvent, ImportedDocument } from "@/types/imported-documents";
import type { KpvrItem } from "@/types/kpvr";
import type { NormativeDocument } from "@/types/normative-documents";
import type { SchoolEvent } from "@/types/events";
import type { SchoolPassport } from "@/types/school";
import type { WorkProgram } from "@/types/work-program";

export interface AppState {
  schoolPassport: SchoolPassport;
  educationModules: EducationModule[];
  events: SchoolEvent[];
  kpvr: KpvrItem[];
  extraActivities: ExtraActivity[];
  educationalSystem: EducationalSystem;
  importedDocuments: ImportedDocument[];
  extractedEvents: ExtractedEvent[];
  normativeDocuments: NormativeDocument[];
  processedDocuments: DocumentProcessingRecord[];
  documentProcessingLogs: DocumentProcessingLogEntry[];
  workProgram: WorkProgram;
  exportDocuments: ExportDocument[];
}
