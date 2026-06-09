import type { NormalizedDocument } from "@/types/document-processing";
import type { DocumentValidator } from "./contracts";

export class QualityDocumentValidator implements DocumentValidator {
  async validate(document: NormalizedDocument): Promise<NormalizedDocument> {
    const warnings = [...document.warnings];
    let score = 100;

    if (document.metadata.requiresOcr) {
      return {
        ...document,
        qualityScore: 20,
        validationStatus: "requires_ocr",
        warnings: unique([...warnings, "Документ требует OCR и не должен анализироваться как текстовый."])
      };
    }

    if (!document.text.trim()) {
      return {
        ...document,
        qualityScore: 0,
        validationStatus: "invalid",
        warnings: unique([...warnings, "Документ пустой или текст не извлечен."])
      };
    }

    if (document.text.length < 300) {
      score -= 35;
      warnings.push("Извлеченный текст слишком короткий для надежного анализа.");
    }

    if (document.sections.length === 0) {
      score -= 25;
      warnings.push("Не обнаружена структура разделов.");
    }

    if (document.fileType === "xlsx" && document.tables.length === 0) {
      score -= 35;
      warnings.push("В XLSX не обнаружены таблицы.");
    }

    if (document.metadata.pageCount && document.metadata.pageCount > 500) {
      score -= 20;
      warnings.push("PDF содержит больше 500 страниц. Для анализа рекомендуется разделить документ.");
    }

    if (document.metadata.sheetCount && document.metadata.sheetCount > 20) {
      score -= 20;
      warnings.push("XLSX содержит больше 20 листов. Обработаны первые 20 листов.");
    }

    const qualityScore = Math.max(0, Math.min(100, score));

    return {
      ...document,
      qualityScore,
      validationStatus:
        qualityScore >= 90 ? "excellent" : qualityScore >= 70 ? "good" : qualityScore >= 35 ? "needs_review" : "invalid",
      warnings: unique(warnings)
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
