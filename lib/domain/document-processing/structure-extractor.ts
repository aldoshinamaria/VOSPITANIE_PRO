import { createId } from "@/lib/utils";
import type {
  NormalizedDocumentList,
  NormalizedDocumentSection,
  NormalizedDocumentTable
} from "@/types/document-processing";
import type { DocumentStructureExtractor, ExtractedDocumentStructure, ExtractedDocumentText, StoredDocumentFile } from "./contracts";

export class RuleBasedDocumentStructureExtractor implements DocumentStructureExtractor {
  async extract(file: StoredDocumentFile, text: ExtractedDocumentText): Promise<ExtractedDocumentStructure> {
    const lines = text.text.split("\n").map((line) => line.trim()).filter(Boolean);
    const sections = extractSections(lines, text.text);
    const lists = extractLists(lines);
    const tables = file.fileType === "xlsx" ? extractXlsxTables(text.rawParts) : [...extractHtmlTables(text.rawParts), ...extractTextTables(lines)];
    const title = inferTitle(file.fileName, lines, text.headers);
    const hasAppendices = lines.some((line) => /приложени[ея]|appendix/i.test(line));

    return {
      title,
      sections,
      tables,
      lists,
      warnings: [
        ...(sections.length === 0 ? ["Не удалось надежно выделить разделы документа."] : []),
        ...(tables.length === 0 && file.fileType === "xlsx" ? ["В XLSX не найдено строк с табличными данными."] : []),
        ...(hasAppendices ? [] : ["Приложения не обнаружены автоматически."])
      ]
    };
  }
}

function extractSections(lines: string[], fullText: string): NormalizedDocumentSection[] {
  const headingLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => looksLikeHeading(line));

  if (headingLines.length === 0 && lines.length > 0) {
    return [
      {
        id: createId("document-section"),
        title: "Основной текст",
        level: 1,
        text: fullText,
        startOffset: 0,
        endOffset: fullText.length
      }
    ];
  }

  return headingLines.map((heading, index) => {
    const nextHeading = headingLines[index + 1];
    const sectionLines = lines.slice(heading.index + 1, nextHeading?.index ?? lines.length);
    const text = sectionLines.join("\n");
    const startOffset = fullText.indexOf(heading.line);

    return {
      id: createId("document-section"),
      title: heading.line,
      level: inferHeadingLevel(heading.line),
      text,
      startOffset: Math.max(startOffset, 0),
      endOffset: Math.max(startOffset, 0) + heading.line.length + text.length
    };
  });
}

function extractLists(lines: string[]): NormalizedDocumentList[] {
  const lists: NormalizedDocumentList[] = [];
  let current: string[] = [];
  let ordered = false;

  lines.forEach((line) => {
    const orderedMatch = /^\d+[\).]\s+/.test(line);
    const unorderedMatch = /^[-*•]\s+/.test(line);

    if (orderedMatch || unorderedMatch) {
      if (current.length === 0) {
        ordered = orderedMatch;
      }

      current.push(line.replace(/^(\d+[\).]|[-*•])\s+/, ""));
      return;
    }

    if (current.length > 0) {
      lists.push({ id: createId("document-list"), items: current, ordered });
      current = [];
    }
  });

  if (current.length > 0) {
    lists.push({ id: createId("document-list"), items: current, ordered });
  }

  return lists;
}

function extractTextTables(lines: string[]): NormalizedDocumentTable[] {
  const tableLines = lines.filter((line) => line.includes("|") || line.split(/\s{2,}/).length >= 3);

  if (tableLines.length < 2) {
    return [];
  }

  const rows = tableLines.map((line) => splitTableLine(line));

  return [
    {
      id: createId("document-table"),
      title: "Таблица из текста",
      rows,
      columnHeaders: rows[0] ?? []
    }
  ];
}

function extractHtmlTables(rawParts: string[]): NormalizedDocumentTable[] {
  return rawParts
    .filter((part) => part.includes("<table"))
    .flatMap((html) => Array.from(html.matchAll(/<table[\s\S]*?<\/table>/gi)).map((match) => match[0]))
    .map((tableHtml, index) => {
      const rows = Array.from(tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)).map((rowMatch) =>
        Array.from(rowMatch[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cellMatch) =>
          stripTags(cellMatch[1] ?? "").trim()
        )
      );

      return {
        id: createId("document-table"),
        title: `Таблица ${index + 1}`,
        rows,
        columnHeaders: rows[0] ?? []
      };
    })
    .filter((table) => table.rows.length > 0);
}

function extractXlsxTables(rawParts: string[]): NormalizedDocumentTable[] {
  return rawParts.map((part) => {
    const [sheetHeader = "Лист", ...rows] = part.split("\n");
    const parsedRows = rows.map((row) => row.split("|").map((cell) => cell.trim()));

    return {
      id: createId("document-table"),
      title: sheetHeader.replace(/^#\s*/, ""),
      sheetName: sheetHeader.replace(/^#\s*/, ""),
      rows: parsedRows,
      columnHeaders: parsedRows[0] ?? []
    };
  });
}

function splitTableLine(line: string) {
  if (line.includes("|")) {
    return line.split("|").map((cell) => cell.trim());
  }

  return line.split(/\s{2,}/).map((cell) => cell.trim());
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

function looksLikeHeading(line: string) {
  if (line.length > 120) {
    return false;
  }

  return (
    /^\d+(\.\d+)*\.?\s+[А-ЯA-Z]/.test(line) ||
    /^раздел\s+[ivx\d]+/i.test(line) ||
    /^приложение\s*/i.test(line) ||
    (line === line.toUpperCase() && line.length > 6)
  );
}

function inferHeadingLevel(line: string) {
  const numericPrefix = line.match(/^(\d+(?:\.\d+)*)/);

  if (!numericPrefix) {
    return 1;
  }

  return numericPrefix[1].split(".").length;
}

function inferTitle(fileName: string, lines: string[], headers: string[]) {
  return headers[0] || lines.find((line) => line.length > 6 && line.length < 160) || fileName.replace(/\.[^.]+$/, "");
}
