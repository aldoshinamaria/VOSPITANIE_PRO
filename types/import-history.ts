import type { SchoolEvent } from "@/types/events";

export type ImportEventState = "unchanged" | "modified";

export interface ImportHistoryEvent {
  event: SchoolEvent;
  state: ImportEventState;
}

export interface ImportHistoryBatch {
  batchId: string;
  importedAt: string;
  documentIds: string[];
  documentNames: string[];
  events: ImportHistoryEvent[];
  unchangedCount: number;
  modifiedCount: number;
}

export interface ImportRollbackPreview {
  batch: ImportHistoryBatch;
  removableEventIds: string[];
  protectedEventIds: string[];
}
