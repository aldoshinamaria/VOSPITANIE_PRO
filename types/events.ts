import type { EducationLevel, Priority } from "@/types/common";
import type { DocumentSourceType } from "@/types/document-processing";
import type { ImportedDocumentType } from "@/types/imported-documents";

export type EventStatus = "planned" | "completed" | "cancelled";

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  direction: string;
  educationLevels: EducationLevel[];
  classes: string;
  startDate: string;
  endDate: string;
  month: number;
  venue: string;
  responsible: string;
  coExecutors: string;
  partner: string;
  associationId?: string;
  infrastructureObjectId?: string;
  systemPartnerId?: string;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  sourceDocumentName?: string;
  sourceDocumentType?: ImportedDocumentType;
  sourcePreviewEventId?: string;
  importBatchId?: string;
  importedAt?: string;
  sourceType?: DocumentSourceType;
  sourceConfidence?: number;
  status: EventStatus;
  participantsCount: number;
  shortReport: string;
  priority: Priority;
}
