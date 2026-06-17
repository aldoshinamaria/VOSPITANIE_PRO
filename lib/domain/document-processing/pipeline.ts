import type { AppMode } from "@/types/app-mode";
import type { DocumentSourceType } from "@/types/document-processing";
import type {
  DocumentAnalysisPreparation,
  DocumentClassifier,
  DocumentNormalizer,
  DocumentProcessingLogger,
  DocumentProcessingPipeline,
  DocumentStorageLayer,
  DocumentStructureExtractor,
  DocumentTextExtractor
} from "./contracts";
import { DefaultDocumentAnalysisPreparation } from "./analysis-preparation";
import { createRuleBasedDocumentClassifier, createUnknownDocumentClassification } from "./classifier";
import { InMemoryDocumentProcessingLogger } from "./logger";
import { DefaultDocumentNormalizer } from "./normalizer";
import { BrowserDocumentStorageLayer } from "./storage";
import { RuleBasedDocumentStructureExtractor } from "./structure-extractor";
import { CompositeDocumentTextExtractor, DocxTextExtractor, PdfTextExtractor, XlsxTextExtractor } from "./text-extractors";
import { QualityDocumentValidator } from "./validator";

export class DefaultDocumentProcessingPipeline implements DocumentProcessingPipeline {
  constructor(
    private readonly storage: DocumentStorageLayer,
    private readonly textExtractor: DocumentTextExtractor,
    private readonly structureExtractor: DocumentStructureExtractor,
    private readonly normalizer: DocumentNormalizer,
    private readonly validator: QualityDocumentValidator,
    private readonly classifier: DocumentClassifier,
    private readonly preparation: DocumentAnalysisPreparation,
    private readonly logger: DocumentProcessingLogger
  ) {}

  async process(file: File, sourceType: DocumentSourceType) {
    const processingFileName = file.name;
    let documentId = "pending";

    try {
      this.logger.log({
        documentId,
        fileName: processingFileName,
        stage: "uploaded",
        level: "info",
        message: "Файл получен для обработки."
      });

      const storedFile = await this.storage.store(file, sourceType);
      documentId = storedFile.id;
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "stored",
        level: "info",
        message: "Файл сохранен в изолированном слое хранения."
      });

      const text = await this.textExtractor.extract(storedFile);
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "text_extracted",
        level: text.requiresOcr ? "warning" : "info",
        message: text.requiresOcr ? "Текстовый слой не найден. Требуется OCR." : `Извлечено символов: ${text.text.length}.`
      });

      const structure = await this.structureExtractor.extract(storedFile, text);
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "structure_extracted",
        level: structure.sections.length > 0 ? "info" : "warning",
        message: `Разделов: ${structure.sections.length}, таблиц: ${structure.tables.length}, списков: ${structure.lists.length}.`
      });

      const normalized = await this.normalizer.normalize({ file: storedFile, text, structure });
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "normalized",
        level: "info",
        message: "Документ приведен к единой модели NormalizedDocument."
      });

      const validated = await this.validator.validate(normalized);
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "validated",
        level: validated.validationStatus === "invalid" || validated.validationStatus === "requires_ocr" ? "warning" : "info",
        message: `Качество: ${validated.validationStatus}, ${validated.qualityScore} баллов.`
      });

      const classified = await this.classifier.classify(validated);
      const classification = classified.classification ?? createUnknownDocumentClassification();
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "validated",
        level: classification.documentKind === "unknown" ? "warning" : "info",
        message: `РўРёРї РґРѕРєСѓРјРµРЅС‚Р°: ${classification.documentKind}, СѓРІРµСЂРµРЅРЅРѕСЃС‚СЊ ${classification.confidence}%.`
      });

      const analysisPayload = await this.preparation.prepare(classified);
      this.logger.log({
        documentId,
        fileName: storedFile.fileName,
        stage: "prepared_for_analysis",
        level: "info",
        message: "Данные подготовлены для будущего AI-анализа. Внешние API не вызывались."
      });

      return {
        normalizedDocument: classified,
        analysisPayload,
        logs: this.logger.list()
      };
    } catch (error) {
      this.logger.log({
        documentId,
        fileName: processingFileName,
        stage: "failed",
        level: "error",
        message: error instanceof Error ? error.message : "Неизвестная ошибка обработки документа."
      });
      throw error;
    }
  }
}

export function createDocumentProcessingPipeline(mode: AppMode = "work"): DocumentProcessingPipeline {
  return new DefaultDocumentProcessingPipeline(
    new BrowserDocumentStorageLayer(mode),
    new CompositeDocumentTextExtractor([new DocxTextExtractor(), new PdfTextExtractor(), new XlsxTextExtractor()]),
    new RuleBasedDocumentStructureExtractor(),
    new DefaultDocumentNormalizer(),
    new QualityDocumentValidator(),
    createRuleBasedDocumentClassifier(),
    new DefaultDocumentAnalysisPreparation(),
    new InMemoryDocumentProcessingLogger()
  );
}
