import type { ImportedDocumentType } from "@/types/imported-documents";

export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;

const extensionToType: Record<string, ImportedDocumentType> = {
  docx: "docx",
  pdf: "pdf",
  xlsx: "xlsx"
};

const acceptedMimeTypes = new Set([
  "",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream"
]);

export function getSafeDocumentType(fileName: string): ImportedDocumentType | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return extensionToType[extension] ?? null;
}

export function assertSafeDocumentFile(file: File) {
  const fileType = getSafeDocumentType(file.name);

  if (!fileType) {
    throw new Error("Формат файла не поддерживается. Допустимы DOCX, PDF и XLSX.");
  }

  if (file.size === 0) {
    throw new Error("Файл пустой.");
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("Файл больше 50 МБ. Разделите документ или загрузите сокращенную версию.");
  }

  if (!acceptedMimeTypes.has(file.type)) {
    throw new Error(`MIME-тип файла не разрешен: ${file.type}.`);
  }

  return fileType;
}
