import type { SchoolEvent } from "@/types/events";
import type { ImportHistoryBatch, ImportRollbackPreview } from "@/types/import-history";

const SIGNATURE_FIELDS: Array<keyof SchoolEvent> = [
  "title",
  "description",
  "moduleId",
  "direction",
  "educationLevels",
  "classes",
  "startDate",
  "endDate",
  "month",
  "venue",
  "responsible",
  "coExecutors",
  "partner",
  "associationId",
  "infrastructureObjectId",
  "systemPartnerId",
  "status",
  "participantsCount",
  "shortReport",
  "priority"
];

export function createImportedContentSignature(event: SchoolEvent) {
  return JSON.stringify(
    SIGNATURE_FIELDS.reduce<Record<string, unknown>>((snapshot, field) => {
      snapshot[field] = event[field];
      return snapshot;
    }, {})
  );
}

export function isImportedEventModified(event: SchoolEvent) {
  if (!event.importedContentSignature) {
    return true;
  }

  return createImportedContentSignature(event) !== event.importedContentSignature;
}

export function buildImportHistory(events: SchoolEvent[]): ImportHistoryBatch[] {
  const batches = new Map<string, SchoolEvent[]>();

  events.forEach((event) => {
    if (!event.importBatchId) {
      return;
    }

    batches.set(event.importBatchId, [...(batches.get(event.importBatchId) ?? []), event]);
  });

  return Array.from(batches.entries())
    .map(([batchId, batchEvents]) => {
      const historyEvents = batchEvents.map((event) => ({
        event,
        state: isImportedEventModified(event) ? "modified" as const : "unchanged" as const
      }));

      return {
        batchId,
        importedAt: batchEvents.map((event) => event.importedAt ?? "").sort().at(-1) ?? "",
        documentIds: unique(batchEvents.map((event) => event.sourceDocumentId).filter(isString)),
        documentNames: unique(
          batchEvents
            .map((event) => event.sourceDocumentName ?? event.sourceDocumentTitle)
            .filter(isString)
        ),
        events: historyEvents,
        unchangedCount: historyEvents.filter((item) => item.state === "unchanged").length,
        modifiedCount: historyEvents.filter((item) => item.state === "modified").length
      };
    })
    .sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}

export function createImportRollbackPreview(events: SchoolEvent[], batchId: string): ImportRollbackPreview | null {
  const batch = buildImportHistory(events).find((item) => item.batchId === batchId);

  if (!batch) {
    return null;
  }

  return {
    batch,
    removableEventIds: batch.events.filter((item) => item.state === "unchanged").map((item) => item.event.id),
    protectedEventIds: batch.events.filter((item) => item.state === "modified").map((item) => item.event.id)
  };
}

export function rollbackImportBatch(events: SchoolEvent[], preview: ImportRollbackPreview) {
  const removableIds = new Set(preview.removableEventIds);

  return events.filter((event) => !removableIds.has(event.id));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}
