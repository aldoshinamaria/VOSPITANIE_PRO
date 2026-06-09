import type { ImportedDocumentType } from "@/types/imported-documents";
import type { DocumentTextExtractor, ExtractedDocumentText, StoredDocumentFile } from "./contracts";

export class CompositeDocumentTextExtractor implements DocumentTextExtractor {
  constructor(private readonly extractors: DocumentTextExtractor[]) {}

  supports(fileType: ImportedDocumentType): boolean {
    return this.extractors.some((extractor) => extractor.supports(fileType));
  }

  async extract(file: StoredDocumentFile): Promise<ExtractedDocumentText> {
    const extractor = this.extractors.find((item) => item.supports(file.fileType));

    if (!extractor) {
      throw new Error(`Нет извлекателя текста для формата ${file.fileType}.`);
    }

    return extractor.extract(file);
  }
}

export class DocxTextExtractor implements DocumentTextExtractor {
  supports(fileType: ImportedDocumentType): boolean {
    return fileType === "docx";
  }

  async extract(file: StoredDocumentFile): Promise<ExtractedDocumentText> {
    const mammoth = await import("mammoth/mammoth.browser");
    const ooxml = await extractDocxOoxml(file.file);
    const arrayBuffer = await file.file.arrayBuffer();
    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer }),
      mammoth.convertToHtml({ arrayBuffer })
    ]);
    const html = htmlResult.value ?? "";
    const text = normalizeWhitespace(textResult.value || htmlToText(html));
    const warnings = [...textResult.messages, ...htmlResult.messages].map((message) => message.message);

    return {
      text,
      headers: [...extractMatches(html, /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi), ...ooxml.headers],
      footers: [...extractMatches(html, /<footer[^>]*>([\s\S]*?)<\/footer>/gi), ...ooxml.footers],
      rawParts: [html, ...ooxml.rawParts],
      requiresOcr: false,
      warnings,
      metadata: {
        mimeType: file.file.type,
        pageCount: undefined,
        sheetCount: undefined
      }
    };
  }
}

export class PdfTextExtractor implements DocumentTextExtractor {
  supports(fileType: ImportedDocumentType): boolean {
    return fileType === "pdf";
  }

  async extract(file: StoredDocumentFile): Promise<ExtractedDocumentText> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const bytes = new Uint8Array(await file.file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data: bytes, disableWorker: true } as Parameters<typeof pdfjs.getDocument>[0]);
    const document = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: unknown) => (typeof item === "object" && item && "str" in item ? String((item as { str: string }).str) : ""))
        .filter(Boolean)
        .join(" ");
      pageTexts.push(text);
    }

    const text = normalizeWhitespace(pageTexts.join("\n\n"));
    const requiresOcr = text.length < Math.max(40, document.numPages * 10);

    return {
      text,
      headers: [],
      footers: [],
      rawParts: pageTexts,
      requiresOcr,
      warnings: requiresOcr ? ["PDF похож на сканированный документ: текстовый слой отсутствует или слишком короткий. Требуется OCR."] : [],
      metadata: {
        mimeType: file.file.type,
        pageCount: document.numPages,
        sheetCount: undefined
      }
    };
  }
}

export class XlsxTextExtractor implements DocumentTextExtractor {
  supports(fileType: ImportedDocumentType): boolean {
    return fileType === "xlsx";
  }

  async extract(file: StoredDocumentFile): Promise<ExtractedDocumentText> {
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const sheets = await readXlsxFile(file.file);
    const sheetNames = sheets.map((sheet) => sheet.sheet);
    const rawParts: string[] = [];

    for (const sheet of sheets.slice(0, 20)) {
      const textRows = sheet.data
        .map((row) => row.map((cell) => (cell === null || typeof cell === "undefined" ? "" : String(cell))).join(" | "))
        .filter((row) => row.trim());
      rawParts.push(`# ${sheet.sheet}\n${textRows.join("\n")}`);
    }

    return {
      text: normalizeWhitespace(rawParts.join("\n\n")),
      headers: sheetNames,
      footers: [],
      rawParts,
      requiresOcr: false,
      warnings: sheetNames.length > 20 ? ["В XLSX больше 20 листов. Обработаны первые 20 листов."] : [],
      metadata: {
        mimeType: file.file.type,
        pageCount: undefined,
        sheetCount: sheetNames.length
      }
    };
  }
}

function htmlToText(html: string) {
  return html.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function extractMatches(html: string, pattern: RegExp) {
  return Array.from(html.matchAll(pattern)).map((match) => htmlToText(match[1] ?? "").trim()).filter(Boolean);
}

async function extractDocxOoxml(file: File) {
  const { unzipSync, strFromU8 } = await import("fflate");
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const headers: string[] = [];
  const footers: string[] = [];
  const rawParts: string[] = [];

  Object.entries(entries).forEach(([path, bytes]) => {
    if (!path.startsWith("word/") || !path.endsWith(".xml")) {
      return;
    }

    if (/word\/(header|footer)\d*\.xml/.test(path) || path === "word/document.xml") {
      const xml = strFromU8(bytes);
      const text = extractTextFromWordXml(xml);
      rawParts.push(xml);

      if (path.includes("header")) {
        headers.push(text);
      }

      if (path.includes("footer")) {
        footers.push(text);
      }
    }
  });

  return {
    headers: headers.filter(Boolean),
    footers: footers.filter(Boolean),
    rawParts
  };
}

function extractTextFromWordXml(xml: string) {
  return Array.from(xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
    .map((match) => decodeXml(match[1] ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}
