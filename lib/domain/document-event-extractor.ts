import type { ExtractedEvent, ImportedDocument } from "@/types/imported-documents";

export interface DocumentEventExtractor {
  extract(document: ImportedDocument): Promise<ExtractedEvent[]>;
}

class MetadataOnlyDocumentEventExtractor implements DocumentEventExtractor {
  async extract(document: ImportedDocument): Promise<ExtractedEvent[]> {
    return document.extractedEvents ?? [];
  }
}

export function createDocumentEventExtractor(): DocumentEventExtractor {
  return new MetadataOnlyDocumentEventExtractor();
}
