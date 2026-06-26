import type { ExtractedEvent, ImportedDocument } from "@/types/imported-documents";

export interface DocumentEventExtractor {
  extract(document: ImportedDocument): Promise<ExtractedEvent[]>;
}

class MetadataOnlyDocumentEventExtractor implements DocumentEventExtractor {
  async extract(): Promise<ExtractedEvent[]> {
    return [];
  }
}

export function createDocumentEventExtractor(): DocumentEventExtractor {
  return new MetadataOnlyDocumentEventExtractor();
}
