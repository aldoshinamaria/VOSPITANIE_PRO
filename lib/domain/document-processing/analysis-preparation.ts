import type { DocumentAnalysisPayload, NormalizedDocument } from "@/types/document-processing";
import type { DocumentAnalysisPreparation } from "./contracts";

const MAX_SECTION_TEXT_LENGTH = 4_000;
const MAX_TEXT_PREVIEW_LENGTH = 20_000;

export class DefaultDocumentAnalysisPreparation implements DocumentAnalysisPreparation {
  async prepare(document: NormalizedDocument): Promise<DocumentAnalysisPayload> {
    return {
      documentId: document.id,
      sourceType: document.sourceType,
      title: document.title,
      textPreview: document.text.slice(0, MAX_TEXT_PREVIEW_LENGTH),
      sections: document.sections.map((section) => ({
        id: section.id,
        title: section.title,
        level: section.level,
        text: section.text.slice(0, MAX_SECTION_TEXT_LENGTH)
      })),
      tables: document.tables.map((table) => ({
        id: table.id,
        title: table.title,
        columnHeaders: table.columnHeaders,
        sheetName: table.sheetName
      })),
      warnings: document.warnings,
      metadata: document.metadata
    };
  }
}
