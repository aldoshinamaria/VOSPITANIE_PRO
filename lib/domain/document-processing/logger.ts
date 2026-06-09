import { createId } from "@/lib/utils";
import type { DocumentProcessingLogEntry } from "@/types/document-processing";
import type { DocumentProcessingLogger } from "./contracts";

export class InMemoryDocumentProcessingLogger implements DocumentProcessingLogger {
  private readonly entries: DocumentProcessingLogEntry[] = [];

  log(entry: Omit<DocumentProcessingLogEntry, "id" | "createdAt">): DocumentProcessingLogEntry {
    const nextEntry = {
      ...entry,
      id: createId("document-log"),
      createdAt: new Date().toISOString()
    };

    this.entries.unshift(nextEntry);
    return nextEntry;
  }

  list(): DocumentProcessingLogEntry[] {
    return [...this.entries];
  }
}
