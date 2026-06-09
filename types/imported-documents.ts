import type { EducationLevel } from "@/types/common";

export type ImportedDocumentType = "docx" | "pdf" | "xlsx";

export type ImportedDocumentStatus = "uploaded" | "pending" | "processed" | "error";

export type ExtractedEventStatus = "found" | "selected" | "ignored";

export interface ImportedDocument {
  id: string;
  title: string;
  type: ImportedDocumentType;
  uploadedAt: string;
  sizeBytes: number;
  status: ImportedDocumentStatus;
}

export interface ExtractedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  month: number;
  educationLevel: EducationLevel;
  module: string;
  responsible: string;
  sourceDocumentId: string;
  sourceType: ImportedDocumentType;
  confidence: number;
  status: ExtractedEventStatus;
}
