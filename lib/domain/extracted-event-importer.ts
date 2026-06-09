import { findModuleIdByTitle } from "@/lib/domain/modules";
import { createId } from "@/lib/utils";
import type { EducationLevel } from "@/types/common";
import type { EducationModule, ExtractedEvent, ImportedDocument, SchoolEvent } from "@/types/domain";

export type DuplicateResolution = "skip" | "create_new" | "replace_existing";

export interface DuplicateCandidate {
  extractedEvent: ExtractedEvent;
  existingEvent: SchoolEvent;
  similarity: number;
}

export interface ExtractedEventImportPlan {
  selectedEvents: ExtractedEvent[];
  levels: EducationLevel[];
  modules: string[];
  duplicateCandidates: DuplicateCandidate[];
}

export interface ExtractedEventImportOptions {
  duplicateResolution: DuplicateResolution;
}

export interface ExtractedEventImportResult {
  events: SchoolEvent[];
  imported: number;
  skipped: number;
  duplicates: number;
  replaced: number;
  createdEventIds: string[];
  updatedEventIds: string[];
  skippedExtractedIds: string[];
}

export interface ExtractedEventImporter {
  createPlan(extractedEvents: ExtractedEvent[], existingEvents: SchoolEvent[]): ExtractedEventImportPlan;
  importEvents(
    extractedEvents: ExtractedEvent[],
    existingEvents: SchoolEvent[],
    modules: EducationModule[],
    documents: ImportedDocument[],
    options: ExtractedEventImportOptions
  ): ExtractedEventImportResult;
}

export function createExtractedEventImporter(): ExtractedEventImporter {
  return new DefaultExtractedEventImporter();
}

class DefaultExtractedEventImporter implements ExtractedEventImporter {
  createPlan(extractedEvents: ExtractedEvent[], existingEvents: SchoolEvent[]): ExtractedEventImportPlan {
    return {
      selectedEvents: extractedEvents,
      levels: uniqueValues(extractedEvents.map((event) => event.educationLevel)),
      modules: uniqueValues(extractedEvents.map((event) => event.module).filter(Boolean)),
      duplicateCandidates: findDuplicateCandidates(extractedEvents, existingEvents)
    };
  }

  importEvents(
    extractedEvents: ExtractedEvent[],
    existingEvents: SchoolEvent[],
    modules: EducationModule[],
    documents: ImportedDocument[],
    options: ExtractedEventImportOptions
  ): ExtractedEventImportResult {
    const duplicateCandidates = findDuplicateCandidates(extractedEvents, existingEvents);
    const duplicateByExtractedId = new Map(duplicateCandidates.map((candidate) => [candidate.extractedEvent.id, candidate]));
    const createdEventIds: string[] = [];
    const updatedEventIds: string[] = [];
    const skippedExtractedIds: string[] = [];
    const nextEvents = [...existingEvents];

    let imported = 0;
    let skipped = 0;
    let replaced = 0;

    for (const extractedEvent of extractedEvents) {
      const duplicate = duplicateByExtractedId.get(extractedEvent.id);

      if (duplicate && options.duplicateResolution === "skip") {
        skipped += 1;
        skippedExtractedIds.push(extractedEvent.id);
        continue;
      }

      const sourceDocument = documents.find((document) => document.id === extractedEvent.sourceDocumentId);
      const replacementId = duplicate?.existingEvent.id;
      const event = createSchoolEventFromExtractedEvent(
        extractedEvent,
        modules,
        sourceDocument,
        duplicate && options.duplicateResolution === "replace_existing" ? replacementId : undefined
      );

      if (duplicate && options.duplicateResolution === "replace_existing") {
        const existingIndex = nextEvents.findIndex((item) => item.id === duplicate.existingEvent.id);

        if (existingIndex >= 0) {
          nextEvents[existingIndex] = event;
          updatedEventIds.push(event.id);
          imported += 1;
          replaced += 1;
          continue;
        }
      }

      nextEvents.unshift(event);
      createdEventIds.push(event.id);
      imported += 1;
    }

    return {
      events: nextEvents,
      imported,
      skipped,
      duplicates: duplicateCandidates.length,
      replaced,
      createdEventIds,
      updatedEventIds,
      skippedExtractedIds
    };
  }
}

function createSchoolEventFromExtractedEvent(
  extractedEvent: ExtractedEvent,
  modules: EducationModule[],
  sourceDocument?: ImportedDocument,
  id = createId("event")
): SchoolEvent {
  const sourceTitle = sourceDocument?.title ?? "документ удален";
  const confidence = Math.round(extractedEvent.confidence * 100);

  return {
    id,
    title: extractedEvent.title,
    description: `${extractedEvent.description}\n\nИсточник документа: ${sourceTitle}. Уверенность распознавания: ${confidence}%.`,
    moduleId: findModuleIdByTitle(modules, extractedEvent.module),
    direction: extractedEvent.module || "Импорт документов",
    educationLevels: [extractedEvent.educationLevel],
    classes: getDefaultClasses(extractedEvent.educationLevel),
    startDate: extractedEvent.date,
    endDate: extractedEvent.date,
    month: extractedEvent.month,
    venue: "",
    responsible: extractedEvent.responsible,
    coExecutors: "",
    partner: sourceTitle,
    sourceDocumentId: extractedEvent.sourceDocumentId,
    sourceDocumentTitle: sourceTitle,
    sourceDocumentType: extractedEvent.sourceType,
    status: "planned",
    participantsCount: 0,
    shortReport: `Импортировано из документа "${sourceTitle}". Требуется проверка карточки мероприятия.`,
    priority: "medium"
  };
}

function findDuplicateCandidates(extractedEvents: ExtractedEvent[], existingEvents: SchoolEvent[]) {
  const candidates: DuplicateCandidate[] = [];

  for (const extractedEvent of extractedEvents) {
    const bestMatch = existingEvents
      .map((existingEvent) => ({
        extractedEvent,
        existingEvent,
        similarity: calculateDuplicateSimilarity(extractedEvent, existingEvent)
      }))
      .filter((candidate) => candidate.similarity >= 0.72)
      .sort((left, right) => right.similarity - left.similarity)[0];

    if (bestMatch) {
      candidates.push(bestMatch);
    }
  }

  return candidates;
}

function calculateDuplicateSimilarity(extractedEvent: ExtractedEvent, existingEvent: SchoolEvent) {
  const titleSimilarity = calculateTitleSimilarity(extractedEvent.title, existingEvent.title);
  const sameDate = extractedEvent.date === existingEvent.startDate || extractedEvent.date === existingEvent.endDate;
  const sameLevel = existingEvent.educationLevels.includes(extractedEvent.educationLevel);

  let score = titleSimilarity;

  if (sameDate) {
    score += 0.18;
  }

  if (sameLevel) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

function calculateTitleSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return 0.86;
  }

  const leftTokens = new Set(normalizedLeft.split(" "));
  const rightTokens = new Set(normalizedRight.split(" "));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return union === 0 ? 0 : intersection / union;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getDefaultClasses(level: EducationLevel) {
  const classesByLevel: Record<EducationLevel, string> = {
    noo: "1-4",
    ooo: "5-9",
    soo: "10-11"
  };

  return classesByLevel[level];
}

function uniqueValues<T>(values: T[]) {
  return Array.from(new Set(values));
}
