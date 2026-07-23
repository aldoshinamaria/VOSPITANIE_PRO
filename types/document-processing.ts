import type { ImportedDocumentType } from "@/types/imported-documents";
import type { SchoolEvent } from "@/types/events";

export type DocumentSourceType = "import" | "normative" | "work-program" | "kpvr" | "local";

export type DocumentValidationStatus = "excellent" | "good" | "needs_review" | "invalid" | "requires_ocr";

export type DocumentPreviewSourceState = "extracted" | "manual" | "empty" | "rejected" | "edited";

export type DocumentKind =
  | "federal_work_program"
  | "federal_calendar_plan"
  | "regional_document"
  | "municipal_document"
  | "local_school_document"
  | "school_work_program"
  | "kpvr"
  | "upbringing_plan"
  | "regulation"
  | "order"
  | "extra_activity_plan"
  | "social_passport"
  | "development_program"
  | "normative_document"
  | "unknown";

export interface DocumentClassification {
  documentKind: DocumentKind;
  confidence: number;
  matchedSignals: string[];
  classifiedAt: string;
}

export type DocumentEventPreviewCategory = "REAL_EVENT" | "WORK_FORMAT" | "ACTIVITY_DIRECTION" | "NOISE";

export interface DocumentEventPreview {
  id: string;
  title: string;
  sourceState: DocumentPreviewSourceState;
  confidence: number;
  category: DocumentEventPreviewCategory;
  qualityScore: number;
  qualityReason: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  sourceType: DocumentSourceType;
  dateText: string;
  month: number | null;
  educationLevels: string[];
  classesText: string;
  responsibleText: string;
  sourceFragment: string;
  matchedSignals: string[];
}

export type DocumentEntityPreviewKind =
  | "school_data"
  | "education_module"
  | "association"
  | "social_partner"
  | "infrastructure"
  | "responsible_person"
  | "term"
  | "education_level";

export interface DocumentEntityPreview {
  id: string;
  kind: DocumentEntityPreviewKind;
  title: string;
  value: string;
  sourceState: DocumentPreviewSourceState;
  confidence: number;
  sourceDocumentId: string;
  sourceDocumentName: string;
  sourceFragment: string;
  matchedSignals: string[];
}

export interface DocumentStructuredPreview {
  schoolData: DocumentEntityPreview[];
  educationModules: DocumentEntityPreview[];
  associations: DocumentEntityPreview[];
  socialPartners: DocumentEntityPreview[];
  infrastructure: DocumentEntityPreview[];
  responsiblePersons: DocumentEntityPreview[];
  terms: DocumentEntityPreview[];
  educationLevels: DocumentEntityPreview[];
  events: DocumentEventPreview[];
}

export type DocumentEventImportStatus = "IMPORTABLE" | "DUPLICATE" | "INCOMPLETE" | "SKIPPED";

export interface DocumentEventImportBatch {
  batchId: string;
  createdAt: string;
  documentIds: string[];
  documentNames: string[];
  importedBy: string;
  previewEventCount: number;
  importableCount: number;
}

export interface DocumentEventImportDryRunItem {
  previewEvent: DocumentEventPreview;
  status: DocumentEventImportStatus;
  reason: string;
  duplicateEventId?: string;
  duplicateEventTitle?: string;
}

export interface DocumentEventImportDryRun {
  items: DocumentEventImportDryRunItem[];
  importableCount: number;
  duplicateCount: number;
  incompleteCount: number;
  skippedCount: number;
}

export interface DocumentEventImportResult {
  batch: DocumentEventImportBatch;
  events: SchoolEvent[];
  importedCount: number;
  duplicateCount: number;
  incompleteCount: number;
  skippedCount: number;
  importedEventIds: string[];
  skippedPreviewEventIds: string[];
}

export type DocumentProcessingLogLevel = "info" | "warning" | "error";

export type DocumentProcessingStage =
  | "uploaded"
  | "stored"
  | "text_extracted"
  | "structure_extracted"
  | "normalized"
  | "validated"
  | "classified"
  | "preview_extracted"
  | "prepared_for_analysis"
  | "failed";

export interface NormalizedDocumentSection {
  id: string;
  title: string;
  level: number;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface NormalizedDocumentTable {
  id: string;
  title: string;
  rows: string[][];
  columnHeaders: string[];
  sheetName?: string;
}

export interface NormalizedDocumentList {
  id: string;
  items: string[];
  ordered: boolean;
  sectionId?: string;
}

export interface NormalizedDocumentMetadata {
  pageCount?: number;
  wordCount: number;
  characterCount: number;
  sheetCount?: number;
  tableCount: number;
  listCount: number;
  headingCount: number;
  hasHeadersOrFooters: boolean;
  hasAppendices: boolean;
  requiresOcr: boolean;
  mimeType: string;
}

export interface NormalizedDocument {
  id: string;
  fileName: string;
  fileType: ImportedDocumentType;
  sourceType: DocumentSourceType;
  title: string;
  version: string;
  createdAt: string;
  text: string;
  sections: NormalizedDocumentSection[];
  tables: NormalizedDocumentTable[];
  lists: NormalizedDocumentList[];
  metadata: NormalizedDocumentMetadata;
  qualityScore: number;
  validationStatus: DocumentValidationStatus;
  warnings: string[];
  classification?: DocumentClassification;
  extractedEventPreview?: DocumentEventPreview[];
  structuredPreview?: DocumentStructuredPreview;
}

export interface DocumentProcessingLogEntry {
  id: string;
  documentId: string;
  fileName: string;
  stage: DocumentProcessingStage;
  level: DocumentProcessingLogLevel;
  message: string;
  createdAt: string;
}

export interface DocumentProcessingRecord {
  id: string;
  fileName: string;
  fileType: ImportedDocumentType;
  sourceType: DocumentSourceType;
  title: string;
  createdAt: string;
  qualityScore: number;
  validationStatus: DocumentValidationStatus;
  warnings: string[];
  textLength: number;
  sectionCount: number;
  tableCount: number;
  listCount: number;
  confirmed: boolean;
  classification: DocumentClassification;
  extractedEventPreview: DocumentEventPreview[];
  structuredPreview: DocumentStructuredPreview;
}

export interface DocumentAnalysisPayload {
  documentId: string;
  sourceType: DocumentSourceType;
  title: string;
  textPreview: string;
  sections: Array<Pick<NormalizedDocumentSection, "id" | "title" | "level" | "text">>;
  tables: Array<Pick<NormalizedDocumentTable, "id" | "title" | "columnHeaders" | "sheetName">>;
  warnings: string[];
  metadata: NormalizedDocumentMetadata;
}
