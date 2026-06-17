import type {
  DocumentAnalysisPayload,
  DocumentProcessingLogEntry,
  DocumentSourceType,
  NormalizedDocument,
  NormalizedDocumentList,
  NormalizedDocumentMetadata,
  NormalizedDocumentSection,
  NormalizedDocumentTable
} from "@/types/document-processing";
import type { ImportedDocumentType } from "@/types/imported-documents";

export interface StoredDocumentFile {
  id: string;
  file: File;
  fileName: string;
  fileType: ImportedDocumentType;
  sourceType: DocumentSourceType;
  createdAt: string;
}

export interface ExtractedDocumentText {
  text: string;
  headers: string[];
  footers: string[];
  rawParts: string[];
  requiresOcr: boolean;
  warnings: string[];
  metadata: Pick<NormalizedDocumentMetadata, "pageCount" | "sheetCount" | "mimeType">;
}

export interface ExtractedDocumentStructure {
  title: string;
  sections: NormalizedDocumentSection[];
  tables: NormalizedDocumentTable[];
  lists: NormalizedDocumentList[];
  warnings: string[];
}

export interface DocumentStorageLayer {
  store(file: File, sourceType: DocumentSourceType): Promise<StoredDocumentFile>;
  get(id: string): Promise<StoredDocumentFile | null>;
  remove(id: string): Promise<void>;
}

export interface DocumentTextExtractor {
  supports(fileType: ImportedDocumentType): boolean;
  extract(file: StoredDocumentFile): Promise<ExtractedDocumentText>;
}

export interface DocumentStructureExtractor {
  extract(file: StoredDocumentFile, text: ExtractedDocumentText): Promise<ExtractedDocumentStructure>;
}

export interface DocumentNormalizer {
  normalize(input: {
    file: StoredDocumentFile;
    text: ExtractedDocumentText;
    structure: ExtractedDocumentStructure;
  }): Promise<NormalizedDocument>;
}

export interface DocumentValidator {
  validate(document: NormalizedDocument): Promise<NormalizedDocument>;
}

export interface DocumentClassifier {
  classify(document: NormalizedDocument): Promise<NormalizedDocument>;
}

export interface DocumentEventPreviewExtractor {
  extract(document: NormalizedDocument): Promise<NormalizedDocument>;
}

export interface DocumentAnalysisPreparation {
  prepare(document: NormalizedDocument): Promise<DocumentAnalysisPayload>;
}

export interface DocumentProcessingLogger {
  log(entry: Omit<DocumentProcessingLogEntry, "id" | "createdAt">): DocumentProcessingLogEntry;
  list(): DocumentProcessingLogEntry[];
}

export interface DocumentProcessingPipeline {
  process(file: File, sourceType: DocumentSourceType): Promise<{
    normalizedDocument: NormalizedDocument;
    analysisPayload: DocumentAnalysisPayload;
    logs: DocumentProcessingLogEntry[];
  }>;
}

export interface DocumentAIAnalyzer {
  analyze(payload: DocumentAnalysisPayload): Promise<unknown>;
}

export interface NormativeAIAnalyzer {
  analyzeNormativeDocument(payload: DocumentAnalysisPayload): Promise<unknown>;
}

export interface WorkProgramAIAnalyzer {
  analyzeWorkProgram(payload: DocumentAnalysisPayload): Promise<unknown>;
}

export interface EventAIAnalyzer {
  extractEvents(payload: DocumentAnalysisPayload): Promise<unknown>;
}
