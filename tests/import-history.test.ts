import assert from "node:assert/strict";

import {
  buildImportHistory,
  createImportedContentSignature,
  createImportRollbackPreview,
  rollbackImportBatch
} from "@/lib/domain/import-history";
import type { SchoolEvent } from "@/types/events";

function event(id: string, title: string, batchId?: string): SchoolEvent {
  const value: SchoolEvent = {
    id,
    title,
    description: "Описание",
    moduleId: "module-1",
    direction: "Гражданское воспитание",
    educationLevels: ["ooo"],
    classes: "5-9",
    startDate: "2026-09-18",
    endDate: "2026-09-18",
    month: 9,
    venue: "",
    responsible: "Советник директора",
    coExecutors: "",
    partner: "",
    sourceDocumentId: batchId ? "document-1" : undefined,
    sourceDocumentName: batchId ? "КПВР.docx" : undefined,
    sourcePreviewEventId: batchId ? `preview-${id}` : undefined,
    importBatchId: batchId,
    importedAt: batchId ? "2026-07-23T10:00:00.000Z" : undefined,
    sourceType: batchId ? "import" : undefined,
    sourceConfidence: batchId ? 90 : undefined,
    status: "planned",
    participantsCount: 0,
    shortReport: "",
    priority: "medium"
  };

  return batchId
    ? { ...value, importedContentSignature: createImportedContentSignature(value) }
    : value;
}

run("history groups imported events and ignores manually created events", () => {
  const history = buildImportHistory([
    event("event-1", "Первое", "batch-1"),
    event("event-2", "Второе", "batch-1"),
    event("event-3", "Ручное")
  ]);

  assert.equal(history.length, 1);
  assert.equal(history[0].events.length, 2);
  assert.deepEqual(history[0].documentNames, ["КПВР.docx"]);
});

run("manual changes are detected and protected from rollback", () => {
  const unchanged = event("event-1", "Первое", "batch-1");
  const modified = { ...event("event-2", "Второе", "batch-1"), title: "Исправленное название" };
  const preview = createImportRollbackPreview([unchanged, modified], "batch-1");

  assert.ok(preview);
  assert.deepEqual(preview.removableEventIds, ["event-1"]);
  assert.deepEqual(preview.protectedEventIds, ["event-2"]);
});

run("rollback removes only unchanged imported events", () => {
  const unchanged = event("event-1", "Первое", "batch-1");
  const modified = { ...event("event-2", "Второе", "batch-1"), responsible: "Новый ответственный" };
  const manual = event("event-3", "Ручное");
  const preview = createImportRollbackPreview([unchanged, modified, manual], "batch-1");

  assert.ok(preview);
  const result = rollbackImportBatch([unchanged, modified, manual], preview);

  assert.deepEqual(result.map((item) => item.id), ["event-2", "event-3"]);
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
