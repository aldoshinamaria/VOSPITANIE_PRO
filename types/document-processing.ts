import type { ImportedDocumentType } from "@/types/imported-documents";

export type DocumentSourceType = "import" | "normative" | "work-program" | "kpvr" | "local";

export type DocumentValidationStatus = "excellent" | "good" | "needs_review" | "invalid" | "requires_ocr";

export type DocumentKind =
  | "federal_work_program"
  | "federal_calendar_plan"
  | "regional_document"
  | "municipal_document"
  | "local_school_document"
  | "school_work_program"
  | "kpvr"
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

export type DocumentProcessingLogLevel = "info" | "warning" | "error";

export type DocumentProcessingStage =
  | "uploaded"
  | "stored"
  | "text_extracted"
  | "structure_extracted"
  | "normalized"
  | "validated"
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
