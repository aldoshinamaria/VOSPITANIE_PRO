import type { NormalizedDocument } from "@/types/document-processing";
import type { DocumentNormalizer } from "./contracts";

export class DefaultDocumentNormalizer implements DocumentNormalizer {
  async normalize({ file, text, structure }: Parameters<DocumentNormalizer["normalize"]>[0]): Promise<NormalizedDocument> {
    const warnings = [...text.warnings, ...structure.warnings];
    const normalizedText = text.text.trim();

    return {
      id: file.id,
      fileName: file.fileName,
      fileType: file.fileType,
      sourceType: file.sourceType,
      title: structure.title,
      version: "",
      createdAt: file.createdAt,
      text: normalizedText,
      sections: structure.sections,
      tables: structure.tables,
      lists: structure.lists,
      metadata: {
        pageCount: text.metadata.pageCount,
        sheetCount: text.metadata.sheetCount,
        wordCount: countWords(normalizedText),
        characterCount: normalizedText.length,
        tableCount: structure.tables.length,
        listCount: structure.lists.length,
        headingCount: structure.sections.length,
        hasHeadersOrFooters: text.headers.length > 0 || text.footers.length > 0,
        hasAppendices: structure.sections.some((section) => /приложени[ея]|appendix/i.test(section.title)),
        requiresOcr: text.requiresOcr,
        mimeType: text.metadata.mimeType
      },
      qualityScore: 0,
      validationStatus: "needs_review",
      warnings
    };
  }
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}
