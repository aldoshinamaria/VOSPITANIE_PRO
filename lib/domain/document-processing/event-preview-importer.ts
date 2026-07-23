import { DEFAULT_MODULE_ID } from "@/lib/domain/modules";
import { createImportedContentSignature } from "@/lib/domain/import-history";
import { createId } from "@/lib/utils";
import type { EducationLevel } from "@/types/common";
import type {
  ActivityDirection,
  DocumentEventImportBatch,
  DocumentEventImportDryRun,
  DocumentEventImportDryRunItem,
  DocumentEventImportResult,
  DocumentEventPreview,
  DocumentProcessingRecord,
  EducationModule,
  SchoolEvent
} from "@/types/domain";

const MIN_IMPORT_QUALITY_SCORE = 70;
const DEFAULT_ACADEMIC_YEAR_START = 2025;
const DEFAULT_IMPORTED_BY = "local-user";

export interface DocumentEventPreviewImporter {
  createDryRun(
    documents: DocumentProcessingRecord[],
    existingEvents: SchoolEvent[],
    context?: DocumentEventPreviewImportContext
  ): DocumentEventImportDryRun;
  importSelected(
    selectedPreviewEventIds: string[],
    documents: DocumentProcessingRecord[],
    existingEvents: SchoolEvent[],
    context?: DocumentEventPreviewImportContext
  ): DocumentEventImportResult;
}

export interface DocumentEventPreviewImportContext {
  modules?: EducationModule[];
  directions?: ActivityDirection[];
}

export function createDocumentEventPreviewImporter(): DocumentEventPreviewImporter {
  return new RuleBasedDocumentEventPreviewImporter();
}

class RuleBasedDocumentEventPreviewImporter implements DocumentEventPreviewImporter {
  createDryRun(
    documents: DocumentProcessingRecord[],
    existingEvents: SchoolEvent[]
  ): DocumentEventImportDryRun {
    const items = flattenPreviewEvents(documents).map((previewEvent) => classifyPreviewEvent(previewEvent, existingEvents));

    return buildDryRun(items);
  }

  importSelected(
    selectedPreviewEventIds: string[],
    documents: DocumentProcessingRecord[],
    existingEvents: SchoolEvent[],
    context?: DocumentEventPreviewImportContext
  ): DocumentEventImportResult {
    const selectedIds = new Set(selectedPreviewEventIds);
    const dryRunItems = flattenPreviewEvents(documents)
      .filter((previewEvent) => selectedIds.has(previewEvent.id))
      .map((previewEvent) => classifyPreviewEvent(previewEvent, existingEvents));
    const importableItems = dryRunItems.filter((item) => item.status === "IMPORTABLE");
    const batch = createImportBatch(importableItems.map((item) => item.previewEvent));
    const events = importableItems.map((item) => createSchoolEventFromPreview(item.previewEvent, batch, context));

    return {
      batch,
      events,
      importedCount: events.length,
      duplicateCount: dryRunItems.filter((item) => item.status === "DUPLICATE").length,
      incompleteCount: dryRunItems.filter((item) => item.status === "INCOMPLETE").length,
      skippedCount: dryRunItems.filter((item) => item.status === "SKIPPED").length,
      importedEventIds: events.map((event) => event.id),
      skippedPreviewEventIds: dryRunItems
        .filter((item) => item.status !== "IMPORTABLE")
        .map((item) => item.previewEvent.id)
    };
  }
}

function classifyPreviewEvent(
  previewEvent: DocumentEventPreview,
  existingEvents: SchoolEvent[]
): DocumentEventImportDryRunItem {
  if (previewEvent.sourceState === "rejected") {
    return {
      previewEvent,
      status: "SKIPPED",
      reason: "Запись отклонена пользователем в preview и не импортируется."
    };
  }

  if (previewEvent.category !== "REAL_EVENT") {
    return {
      previewEvent,
      status: "SKIPPED",
      reason: "Запись не относится к категории REAL_EVENT и не импортируется в реестр мероприятий."
    };
  }

  if (!hasValidTitle(previewEvent.title) || previewEvent.qualityScore < MIN_IMPORT_QUALITY_SCORE) {
    return {
      previewEvent,
      status: "INCOMPLETE",
      reason: "Недостаточно данных или низкая оценка качества для создания полноценной карточки мероприятия."
    };
  }

  const duplicateEvent = findDuplicateEvent(previewEvent, existingEvents);

  if (duplicateEvent) {
    return {
      previewEvent,
      status: "DUPLICATE",
      reason: "В реестре уже есть похожее мероприятие или этот preview уже импортировался.",
      duplicateEventId: duplicateEvent.id,
      duplicateEventTitle: duplicateEvent.title
    };
  }

  return {
    previewEvent,
    status: "IMPORTABLE",
    reason: "Запись распознана как реальное мероприятие и содержит достаточные данные для безопасного импорта."
  };
}

function createSchoolEventFromPreview(
  previewEvent: DocumentEventPreview,
  batch: DocumentEventImportBatch,
  context?: DocumentEventPreviewImportContext
): SchoolEvent {
  const startDate = buildSafeDate(previewEvent);
  const educationLevels = normalizeEducationLevels(previewEvent.educationLevels);
  const classes = previewEvent.classesText.trim() || getDefaultClasses(educationLevels);
  const moduleId = inferModuleIdFromPreview(previewEvent, context?.modules);
  const responsible = previewEvent.responsibleText.trim() || "Требуется назначить ответственного";

  const event: SchoolEvent = {
    id: createId("event"),
    title: previewEvent.title.trim(),
    description: [
      previewEvent.sourceFragment.trim(),
      "",
      `Источник: ${previewEvent.sourceDocumentName}.`,
      `Импортировано из предварительного распознавания ${batch.createdAt}.`,
      `Оценка качества: ${previewEvent.qualityScore}%. ${previewEvent.qualityReason}`
    ]
      .filter(Boolean)
      .join("\n"),
    moduleId,
    direction: "Импорт документов",
    educationLevels,
    classes,
    startDate,
    endDate: startDate,
    month: previewEvent.month ?? getMonthFromDate(startDate),
    venue: "",
    responsible,
    coExecutors: "",
    partner: "",
    associationId: "",
    infrastructureObjectId: "",
    systemPartnerId: "",
    sourceDocumentId: previewEvent.sourceDocumentId,
    sourceDocumentTitle: previewEvent.sourceDocumentName,
    sourceDocumentName: previewEvent.sourceDocumentName,
    sourcePreviewEventId: previewEvent.id,
    importBatchId: batch.batchId,
    importedAt: batch.createdAt,
    sourceType: previewEvent.sourceType,
    sourceConfidence: previewEvent.confidence,
    status: "planned",
    participantsCount: 0,
    shortReport: "Импортировано из предварительного распознавания документа. Требуется ручная проверка карточки мероприятия.",
    priority: "medium"
  };

  return {
    ...event,
    importedContentSignature: createImportedContentSignature(event)
  };
}

function inferModuleIdFromPreview(previewEvent: DocumentEventPreview, modules: EducationModule[] = []) {
  const text = normalizeTextForMatching(buildPreviewSearchText(previewEvent));
  const moduleRules: Array<{ keywords: string[]; moduleHints: string[] }> = [
    { keywords: ["классный час", "классное руководство"], moduleHints: ["класс"] },
    { keywords: ["внеуроч"], moduleHints: ["внеуроч"] },
    { keywords: ["родител", "семья", "семьи"], moduleHints: ["родител"] },
    { keywords: ["профориент", "професс", "профпроб"], moduleHints: ["профориент"] },
    { keywords: ["пдд", "ддтт", "безопасн", "профилактик", "инструктаж", "антитеррор"], moduleHints: ["профилакти", "безопас"] },
    { keywords: ["самоуправ", "совет обуч", "выборы"], moduleHints: ["самоуправ"] },
    { keywords: ["музей", "экскурс", "экспозици"], moduleHints: ["музей"] },
    { keywords: ["медиа", "газет", "сайт", "пресс"], moduleHints: ["медиа"] },
    { keywords: ["волонтер", "доброволь", "орлята", "движение первых", "юид", "юнарм"], moduleHints: ["объедин", "детск"] },
    { keywords: ["труд", "субботник", "эколог"], moduleHints: ["труд", "эколог"] },
    { keywords: ["урок", "разговоры о важном"], moduleHints: ["уроч"] }
  ];

  for (const rule of moduleRules) {
    if (!rule.keywords.some((keyword) => text.includes(keyword))) {
      continue;
    }

    const matchedModule = modules.find((moduleItem) => {
      const title = normalizeTextForMatching(moduleItem.title);

      return rule.moduleHints.some((hint) => title.includes(hint));
    });

    if (matchedModule) {
      return matchedModule.id;
    }
  }

  return modules.find((moduleItem) => moduleItem.id === DEFAULT_MODULE_ID)?.id ?? modules[0]?.id ?? DEFAULT_MODULE_ID;
}

function buildPreviewSearchText(previewEvent: DocumentEventPreview) {
  return [
    previewEvent.title,
    previewEvent.sourceFragment,
    previewEvent.sourceDocumentName,
    previewEvent.responsibleText,
    previewEvent.matchedSignals.join(" ")
  ].join(" ");
}

function createImportBatch(previewEvents: DocumentEventPreview[]): DocumentEventImportBatch {
  const documentIds = uniqueValues(previewEvents.map((event) => event.sourceDocumentId));
  const documentNames = uniqueValues(previewEvents.map((event) => event.sourceDocumentName));

  return {
    batchId: createId("event-import-batch"),
    createdAt: new Date().toISOString(),
    documentIds,
    documentNames,
    importedBy: DEFAULT_IMPORTED_BY,
    previewEventCount: previewEvents.length,
    importableCount: previewEvents.length
  };
}

function findDuplicateEvent(previewEvent: DocumentEventPreview, existingEvents: SchoolEvent[]) {
  const previewId = previewEvent.id;
  const normalizedTitle = normalizeDuplicateText(previewEvent.title);

  return existingEvents.find((event) => {
    if (event.sourcePreviewEventId && event.sourcePreviewEventId === previewId) {
      return true;
    }

    return normalizeDuplicateText(event.title) === normalizedTitle;
  });
}

function buildDryRun(items: DocumentEventImportDryRunItem[]): DocumentEventImportDryRun {
  return {
    items,
    importableCount: countByStatus(items, "IMPORTABLE"),
    duplicateCount: countByStatus(items, "DUPLICATE"),
    incompleteCount: countByStatus(items, "INCOMPLETE"),
    skippedCount: countByStatus(items, "SKIPPED")
  };
}

function countByStatus(items: DocumentEventImportDryRunItem[], status: DocumentEventImportDryRunItem["status"]) {
  return items.filter((item) => item.status === status).length;
}

function flattenPreviewEvents(documents: DocumentProcessingRecord[]) {
  return documents
    .filter((document) => document.confirmed)
    .flatMap((document) => document.extractedEventPreview ?? []);
}

function hasValidTitle(title: string) {
  const normalizedTitle = normalizeDuplicateText(title);

  return normalizedTitle.length >= 4 && normalizedTitle.split(" ").length <= 18;
}

function normalizeDuplicateText(value: string) {
  return value
    .toLowerCase()
    .replace(/[«»"„“”']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeTextForMatching(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/С‘/g, "Рµ").trim();
}

function normalizeEducationLevels(levels: string[]): EducationLevel[] {
  const normalized = levels
    .map((level) => level.trim().toLowerCase())
    .map((level) => {
      if (level === "ноо" || level === "noo") {
        return "noo";
      }

      if (level === "соо" || level === "soo") {
        return "soo";
      }

      if (level === "ооо" || level === "ooo") {
        return "ooo";
      }

      return null;
    })
    .filter((level): level is EducationLevel => Boolean(level));

  return uniqueValues(normalized).length > 0 ? uniqueValues(normalized) : ["ooo"];
}

function getDefaultClasses(levels: EducationLevel[]) {
  const classRanges: Record<EducationLevel, string> = {
    noo: "1-4",
    ooo: "5-9",
    soo: "10-11"
  };

  return levels.map((level) => classRanges[level]).join(", ");
}

function buildSafeDate(previewEvent: DocumentEventPreview) {
  const parsedDate = parseDateText(previewEvent.dateText);

  if (parsedDate) {
    return parsedDate;
  }

  const month = previewEvent.month ?? 9;
  const year = month >= 9 ? DEFAULT_ACADEMIC_YEAR_START : DEFAULT_ACADEMIC_YEAR_START + 1;

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function parseDateText(dateText: string) {
  const match = dateText.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const yearValue = match[3] ? Number(match[3]) : month >= 9 ? DEFAULT_ACADEMIC_YEAR_START : DEFAULT_ACADEMIC_YEAR_START + 1;
  const year = yearValue < 100 ? 2000 + yearValue : yearValue;

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthFromDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 9 : date.getMonth() + 1;
}

function uniqueValues<T>(values: T[]) {
  return Array.from(new Set(values));
}
