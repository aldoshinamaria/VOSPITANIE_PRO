import { createId } from "@/lib/utils";
import type {
  DocumentEventPreview,
  DocumentEventPreviewCategory,
  NormalizedDocument,
  NormalizedDocumentTable
} from "@/types/document-processing";
import type { DocumentEventPreviewExtractor } from "./contracts";

type CandidateSource = "table" | "list" | "text";

interface EventCandidate {
  title: string;
  dateText: string;
  classesText: string;
  responsibleText: string;
  sourceFragment: string;
  source: CandidateSource;
}

interface QualityAssessment {
  category: DocumentEventPreviewCategory;
  qualityScore: number;
  qualityReason: string;
}

const MIN_CONFIDENCE = 55;
const MAX_PREVIEW_EVENTS = 120;

export class RuleBasedDocumentEventPreviewExtractor implements DocumentEventPreviewExtractor {
  async extract(document: NormalizedDocument): Promise<NormalizedDocument> {
    const candidates = [
      ...extractTableCandidates(document),
      ...extractListCandidates(document),
      ...extractTextCandidates(document)
    ];
    const filteredNoise: string[] = [];
    const previews = deduplicateCandidates(candidates)
      .map((candidate) => toPreview(candidate, document, filteredNoise))
      .filter((preview): preview is DocumentEventPreview => Boolean(preview))
      .sort((left, right) => right.qualityScore - left.qualityScore || right.confidence - left.confidence)
      .slice(0, MAX_PREVIEW_EVENTS);

    return {
      ...document,
      extractedEventPreview: previews
    };
  }
}

export function createRuleBasedDocumentEventPreviewExtractor(): DocumentEventPreviewExtractor {
  return new RuleBasedDocumentEventPreviewExtractor();
}

export function migrateDocumentEventPreview(preview?: Array<Partial<DocumentEventPreview>>) {
  return Array.isArray(preview)
    ? preview.map((event) => ({
        ...event,
        ...("category" in event && "qualityScore" in event && "qualityReason" in event
          ? {}
          : assessPreviewQuality(event.title ?? "", event.sourceFragment ?? "", event.matchedSignals ?? [], event.confidence ?? 0, event.month ?? null))
      })) as DocumentEventPreview[]
    : [];
}

function extractTableCandidates(document: NormalizedDocument): EventCandidate[] {
  return document.tables.flatMap((table) => extractCandidatesFromTable(table));
}

function extractCandidatesFromTable(table: NormalizedDocumentTable): EventCandidate[] {
  const headers = normalizeHeaders(table.columnHeaders);
  const rows = table.rows.filter((row) => row.some((cell) => cell.trim()));
  const dataRows = rows.slice(0, 1).some((row) => looksLikeHeaderRow(row)) ? rows.slice(1) : rows;
  const titleIndex = findColumnIndex(headers, ["мероприят", "событ", "дела", "наименование", "тема", "форма"]);
  const dateIndex = findColumnIndex(headers, ["срок", "дата", "месяц", "период"]);
  const classesIndex = findColumnIndex(headers, ["класс", "участник", "категор", "уровень"]);
  const responsibleIndex = findColumnIndex(headers, ["ответствен", "исполнител", "организатор"]);

  return dataRows
    .map((row) => {
      const cleanRow = row.map(cleanText);
      const title = cleanText(titleIndex >= 0 ? cleanRow[titleIndex] : inferTitleFromRow(cleanRow));
      const sourceFragment = cleanRow.filter(Boolean).join(" | ");

      return {
        title,
        dateText: cleanText(dateIndex >= 0 ? cleanRow[dateIndex] : inferDateText(sourceFragment)),
        classesText: cleanText(classesIndex >= 0 ? cleanRow[classesIndex] : inferClassesText(sourceFragment)),
        responsibleText: cleanText(responsibleIndex >= 0 ? cleanRow[responsibleIndex] : inferResponsibleFromRow(cleanRow, title)),
        sourceFragment,
        source: "table" as const
      };
    })
    .filter((candidate) => candidate.title);
}

function extractListCandidates(document: NormalizedDocument): EventCandidate[] {
  return document.lists.flatMap((list) =>
    list.items.map((item) => {
      const text = cleanText(item);

      return {
        title: extractTitleFromLine(text),
        dateText: inferDateText(text),
        classesText: inferClassesText(text),
        responsibleText: inferResponsibleText(text),
        sourceFragment: text,
        source: "list" as const
      };
    })
  );
}

function extractTextCandidates(document: NormalizedDocument): EventCandidate[] {
  if (!["kpvr", "school_work_program", "federal_calendar_plan", "extra_activity_plan"].includes(document.classification?.documentKind ?? "")) {
    return [];
  }

  return document.sections
    .slice(0, 12)
    .flatMap((section) => splitTextForCandidates(section.text))
    .map(cleanText)
    .filter((line) => line.length > 10 && line.length < 260)
    .map((line) => ({
      title: extractTitleFromLine(line),
      dateText: inferDateText(line),
      classesText: inferClassesText(line),
      responsibleText: inferResponsibleText(line),
      sourceFragment: line,
      source: "text" as const
    }));
}

function toPreview(candidate: EventCandidate, document: NormalizedDocument, filteredNoise: string[]): DocumentEventPreview | null {
  const title = normalizeTitle(candidate.title);
  const sourceFragment = candidate.sourceFragment.slice(0, 420);
  const matchedSignals = collectEventSignals(`${title} ${sourceFragment}`);
  const hasNoisePattern = isNoiseCandidate(title, sourceFragment);

  if (matchedSignals.length === 0 && !looksLikeWorkFormat(title) && !looksLikeActivityDirection(title) && !hasNoisePattern) {
    filteredNoise.push(title || sourceFragment);
    return null;
  }

  const month = inferMonth(candidate.dateText || sourceFragment);
  const educationLevels = inferEducationLevels(candidate.classesText || sourceFragment);
  const confidence = calculateConfidence(candidate, matchedSignals, month, educationLevels);
  const quality = assessPreviewQuality(title, sourceFragment, matchedSignals, confidence, month, hasNoisePattern);

  if (confidence < MIN_CONFIDENCE && quality.category === "REAL_EVENT") {
    filteredNoise.push(title);
    return null;
  }

  return {
    id: createId("document-event-preview"),
    title,
    confidence,
    category: quality.category,
    qualityScore: quality.qualityScore,
    qualityReason: quality.qualityReason,
    sourceDocumentId: document.id,
    sourceDocumentName: document.fileName,
    sourceType: document.sourceType,
    dateText: candidate.dateText,
    month,
    educationLevels,
    classesText: candidate.classesText,
    responsibleText: candidate.responsibleText,
    sourceFragment,
    matchedSignals
  };
}

function assessPreviewQuality(
  title: string,
  sourceFragment: string,
  matchedSignals: string[],
  confidence: number,
  month: number | null,
  knownNoise = false
): QualityAssessment {
  const normalizedTitle = normalize(title);
  const normalizedFragment = normalize(sourceFragment);

  if (knownNoise || looksLikeNoise(normalizedTitle, normalizedFragment)) {
    return {
      category: "NOISE",
      qualityScore: 12,
      qualityReason: "Похоже на служебный фрагмент, раздел или описание процесса, а не на мероприятие."
    };
  }

  if (looksLikeActivityDirection(title)) {
    return {
      category: "ACTIVITY_DIRECTION",
      qualityScore: 34,
      qualityReason: "Описывает направление воспитательной работы, а не отдельное событие."
    };
  }

  if (looksLikeWorkFormat(title)) {
    return {
      category: "WORK_FORMAT",
      qualityScore: Math.min(55, Math.max(36, confidence - 28)),
      qualityReason: "Описывает форму организации работы, а не конкретное мероприятие с уникальным названием."
    };
  }

  if (looksLikeConcreteEvent(title, sourceFragment, matchedSignals, month)) {
    return {
      category: "REAL_EVENT",
      qualityScore: Math.min(98, Math.max(70, confidence + (month ? 4 : 0))),
      qualityReason: month
        ? "Содержит конкретное название события и срок проведения."
        : "Содержит конкретное название события или акции."
    };
  }

  return {
    category: matchedSignals.length > 0 ? "WORK_FORMAT" : "NOISE",
    qualityScore: matchedSignals.length > 0 ? 40 : 10,
    qualityReason: matchedSignals.length > 0
      ? "Есть признаки воспитательной активности, но запись выглядит общей формулировкой."
      : "Не содержит надежных признаков мероприятия."
  };
}

function calculateConfidence(candidate: EventCandidate, matchedSignals: string[], month: number | null, educationLevels: string[]) {
  const sourceScore = candidate.source === "table" ? 58 : candidate.source === "list" ? 48 : 42;
  const signalScore = Math.min(24, matchedSignals.length * 6);
  const dateScore = month || candidate.dateText ? 10 : 0;
  const levelScore = educationLevels.length > 0 || candidate.classesText ? 5 : 0;
  const responsibleScore = candidate.responsibleText ? 5 : 0;

  return Math.min(95, sourceScore + signalScore + dateScore + levelScore + responsibleScore);
}

function collectEventSignals(value: string) {
  const normalized = normalize(value);
  const signals = [
    ["день", "день"],
    ["акция", "акция"],
    ["конкурс", "конкурс"],
    ["экскурсия", "экскурсия"],
    ["классный час", "классный час"],
    ["линейка", "линейка"],
    ["фестиваль", "фестиваль"],
    ["соревнован", "соревнование"],
    ["встреч", "встреча"],
    ["урок", "урок"],
    ["разговоры о важном", "Разговоры о важном"],
    ["георгиевская", "Георгиевская ленточка"],
    ["свеча памяти", "Свеча памяти"],
    ["блокадный хлеб", "Блокадный хлеб"],
    ["сад памяти", "Сад Памяти"],
    ["посвящение", "посвящение"],
    ["прощание", "прощание"],
    ["профилакти", "профилактика"],
    ["родительск", "родительское мероприятие"],
    ["волонтер", "волонтерская акция"],
    ["доброволь", "добровольческая акция"],
    ["рейд", "рейд"],
    ["операция", "операция"],
    ["неделя", "неделя"],
    ["декада", "декада"],
    ["месячник", "месячник"],
    ["выстав", "выставка"],
    ["викторин", "викторина"],
    ["олимпиад", "олимпиада"],
    ["форум", "форум"],
    ["слет", "слет"],
    ["праздник", "праздник"],
    ["концерт", "концерт"],
    ["проект", "проект"],
    ["мероприят", "мероприятие"]
  ];

  return signals.filter(([needle]) => normalized.includes(needle)).map(([, label]) => label);
}

function isNoiseCandidate(title: string, sourceFragment: string) {
  const normalizedTitle = normalize(title);
  const normalizedFragment = normalize(sourceFragment);

  if (title.length < 5 || title.length > 180) {
    return true;
  }

  if (/^[\d\s.,:;/-]+$/.test(title)) {
    return true;
  }

  const noisePatterns = [
    /^раздел\b/,
    /^модуль\b/,
    /^таблица\b/,
    /^приложение\b/,
    /^цель\b/,
    /^задач/,
    /^планируемые результаты/,
    /^результаты\b/,
    /^направлени[ея]\b/,
    /^содержание\b/,
    /^ответственные\b/,
    /^сроки\b/,
    /^классы\b/,
    /^уровень\b/,
    /^рабочая программа/,
    /^календарный план\b/,
    /^пояснительная записка/,
    /^норматив/,
    /^реализует\b/
  ];

  if (noisePatterns.some((pattern) => pattern.test(normalizedTitle))) {
    return true;
  }

  const structuralWords = ["цель воспитания", "целевой раздел", "содержательный раздел", "организационный раздел", "виды формы и содержание"];
  if (structuralWords.some((word) => normalizedFragment.includes(word)) && !hasConcreteEventWord(normalizedTitle)) {
    return true;
  }

  return normalizedFragment.includes("воспитательный потенциал урока") && !normalizedFragment.includes("классный час");
}

function hasConcreteEventWord(value: string) {
  return collectEventSignals(value).some((signal) => signal !== "мероприятие");
}

function looksLikeConcreteEvent(title: string, sourceFragment: string, matchedSignals: string[], month: number | null) {
  const normalizedTitle = normalize(title);
  const normalizedFragment = normalize(sourceFragment);

  return (
    month !== null ||
    /[«"].{3,120}[»"]/.test(title) ||
    /^день\s+/.test(normalizedTitle) ||
    /^международный день\s+/.test(normalizedTitle) ||
    /^всероссийск/.test(normalizedTitle) ||
    /^городск/.test(normalizedTitle) ||
    /^классный час/.test(normalizedTitle) ||
    /^урок\s+/.test(normalizedTitle) ||
    /^акция\s+/.test(normalizedTitle) ||
    normalizedFragment.includes("георгиевская") ||
    normalizedFragment.includes("свеча памяти") ||
    normalizedFragment.includes("блокадный хлеб") ||
    normalizedFragment.includes("сад памяти") ||
    normalizedFragment.includes("день знаний") ||
    matchedSignals.some((signal) =>
      ["Георгиевская ленточка", "Свеча памяти", "Блокадный хлеб", "Сад Памяти", "Разговоры о важном"].includes(signal)
    )
  );
}

function looksLikeWorkFormat(title: string) {
  const normalizedTitle = normalize(title);
  const workFormatPatterns = [
    /^организация\b/,
    /^проведение\b/,
    /^участие\b/,
    /^занятия\b/,
    /^тематические сообщения\b/,
    /^тематические мероприятия\b/,
    /^индивидуальные мероприятия\b/,
    /^комплекс мероприятий\b/,
    /^разработка и оформление\b/,
    /^благоустройство\b/,
    /^консультац/,
    /^инструктаж/,
    /^профилактические занятия\b/,
    /^мероприятия в рамках\b/,
    /^городские тематические мероприятия\b/
  ];

  return workFormatPatterns.some((pattern) => pattern.test(normalizedTitle));
}

function looksLikeActivityDirection(title: string) {
  const normalizedTitle = normalize(title);
  const directionPatterns = [
    /патриотическое воспитание/,
    /гражданское воспитание/,
    /духовно-нравственное воспитание/,
    /экологическое воспитание/,
    /трудовое воспитание/,
    /эстетическое воспитание/,
    /физическое воспитание/,
    /профориентационная работа/,
    /профилактика правонарушений/,
    /профилактика безнадзорности/,
    /профилактика ддтт/,
    /информационная безопасность/,
    /антитеррористическая безопасность/,
    /работа с родителями/,
    /самоуправление/
  ];

  return directionPatterns.some((pattern) => pattern.test(normalizedTitle)) && normalizedTitle.length < 100;
}

function looksLikeNoise(normalizedTitle: string, normalizedFragment: string) {
  return (
    normalizedTitle.includes("ответственные исполнители") ||
    normalizedTitle.includes("наименование модуля") ||
    normalizedTitle.includes("планируемые результаты") ||
    normalizedTitle.includes("основные задачи") ||
    normalizedFragment.includes("пояснительная записка")
  );
}

function deduplicateCandidates(candidates: EventCandidate[]) {
  const seen = new Set<string>();
  const result: EventCandidate[] = [];

  for (const candidate of candidates) {
    const key = normalize(`${normalizeTitle(candidate.title)} ${candidate.dateText} ${candidate.classesText}`);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(candidate);
  }

  return result;
}

function normalizeHeaders(headers: string[]) {
  return headers.map((header) => normalize(header));
}

function findColumnIndex(headers: string[], needles: string[]) {
  return headers.findIndex((header) => needles.some((needle) => header.includes(needle)));
}

function looksLikeHeaderRow(row: string[]) {
  const text = normalize(row.join(" "));
  return ["мероприят", "срок", "ответствен", "класс"].filter((word) => text.includes(word)).length >= 2;
}

function inferTitleFromRow(row: string[]) {
  const eventLike = row.find((cell) => collectEventSignals(cell).length > 0 && !isShortMetadataCell(cell));

  if (eventLike) {
    return eventLike;
  }

  return row
    .filter((cell) => !isShortMetadataCell(cell))
    .sort((left, right) => right.length - left.length)[0] ?? "";
}

function isShortMetadataCell(value: string) {
  return value.length < 5 || /^[\d\s.,:;/-]+$/.test(value) || /^(ноо|ооо|соо|1-4|5-9|10-11)$/i.test(value);
}

function extractTitleFromLine(line: string) {
  const withoutPrefix = line.replace(/^\s*(\d+[\).]|[-*•])\s*/, "");
  const calendarMatch = withoutPrefix.match(/^\d{1,2}\s+(?:сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья]|январ[ья]|феврал[ья]|март[а]?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|август[а]?)\s*:?\s*(.+)$/iu);

  if (calendarMatch) {
    return normalizeTitle(calendarMatch[1]);
  }

  const parentheticalCalendarMatch = withoutPrefix.match(/^\([^)]{4,80}\)\s*:?\s*(.+)$/u);

  if (parentheticalCalendarMatch) {
    return normalizeTitle(parentheticalCalendarMatch[1]);
  }

  return normalizeTitle(withoutPrefix.split(/\s{2,}|\|/)[0] ?? withoutPrefix);
}

function normalizeTitle(value: string) {
  return cleanText(value)
    .replace(/^\d+[\).]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferDateText(value: string) {
  const match = value.match(/\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?\b|\b\d{1,2}\s*[-–]\s*\d{1,2}[./]\d{1,2}\b|\b(?:сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья]|январ[ья]|феврал[ья]|март[а]?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|август[а]?)\b/iu);
  return cleanText(match?.[0] ?? "");
}

function inferClassesText(value: string) {
  const match = value.match(/\b(?:[1-9]|1[01])\s*[-–]\s*(?:[1-9]|1[01])\s*(?:класс(?:ы|ов)?|кл\.)?\b|\b(?:[1-9]|1[01])\s*(?:класс(?:ы|ов)?|кл\.)\b|\b(?:НОО|ООО|СОО)\b/u);
  return cleanText(match?.[0] ?? "");
}

function inferResponsibleText(value: string) {
  const match = value.match(/(?:ответственн(?:ый|ые)?|исполнител(?:ь|и)?|организатор(?:ы)?):?\s*([^|.;\n]{5,120})/iu);
  return cleanText(match?.[1] ?? "");
}

function inferEducationLevels(value: string) {
  const normalized = normalize(value);
  const levels = new Set<string>();

  if (normalized.includes("ноо") || /\b[1-4]\s*(?:класс|кл\.)/.test(normalized) || /\b1\s*[-–]\s*4\b/.test(normalized)) {
    levels.add("НОО");
  }

  if (normalized.includes("ооо") || /\b[5-9]\s*(?:класс|кл\.)/.test(normalized) || /\b5\s*[-–]\s*9\b/.test(normalized)) {
    levels.add("ООО");
  }

  if (normalized.includes("соо") || /\b(?:10|11)\s*(?:класс|кл\.)/.test(normalized) || /\b10\s*[-–]\s*11\b/.test(normalized)) {
    levels.add("СОО");
  }

  return Array.from(levels);
}

function inferMonth(value: string) {
  const normalized = normalize(value);
  const monthEntries: Array<[number, string[]]> = [
    [1, ["январ"]],
    [2, ["феврал"]],
    [3, ["март"]],
    [4, ["апрел"]],
    [5, ["май", "мая"]],
    [6, ["июн"]],
    [7, ["июл"]],
    [8, ["август"]],
    [9, ["сентябр"]],
    [10, ["октябр"]],
    [11, ["ноябр"]],
    [12, ["декабр"]]
  ];
  const numericRangeDate = normalized.match(/\b\d{1,2}\s*[-–]\s*\d{1,2}[./](\d{1,2})\b/);
  const numericDate = normalized.match(/\b\d{1,2}[./](\d{1,2})(?:[./]\d{2,4})?\b/);

  if (numericRangeDate) {
    const month = Number(numericRangeDate[1]);
    return month >= 1 && month <= 12 ? month : null;
  }

  if (numericDate) {
    const month = Number(numericDate[1]);
    return month >= 1 && month <= 12 ? month : null;
  }

  return monthEntries.find(([, variants]) => variants.some((variant) => normalized.includes(variant)))?.[0] ?? null;
}

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function inferResponsibleFromRow(row: string[], title: string) {
  const titleIndex = row.findIndex((cell) => cell === title);
  const candidates = row.filter((cell, index) => {
    if (index === titleIndex || !cell || cell === title) {
      return false;
    }

    if (inferDateText(cell) || inferClassesText(cell)) {
      return false;
    }

    return /(руководител|педагог|классн|директор|советник|зам\.?|организатор|психолог|библиотек|учител|шмо|парламент|отряд)/iu.test(cell);
  });

  return candidates[candidates.length - 1] ?? "";
}

function splitTextForCandidates(text: string) {
  const lines = text.split("\n").map(cleanText).filter(Boolean);
  const sourceText = lines.length > 0 ? lines.join("\n") : text;

  return sourceText
    .replace(/\s+-\s+/g, "\n- ")
    .split(/\n+|;\s+|(?<=[.!?])\s+(?=[А-ЯЁA-Z])/u)
    .map(cleanText)
    .filter(Boolean);
}

function normalize(value: string) {
  return cleanText(value).toLowerCase().replace(/ё/g, "е");
}
