import assert from "node:assert/strict";

import { buildWorkProgramVersionDiff } from "@/lib/domain/work-program/work-program-version-diff";
import type { WorkProgramSection, WorkProgramVersion } from "@/types/domain";

const paragraph = (id: string, text: string) => ({
  id,
  text,
  originalText: text,
  sources: [],
  status: "generated" as const,
  readiness: "ready" as const
});

const section: WorkProgramSection = {
  id: "target",
  title: "Целевой раздел",
  status: "generated",
  progress: { percent: 100, status: "ready", missingData: [], reviewNotes: [] },
  sources: [],
  versions: [],
  subsections: [
    {
      id: "purpose",
      title: "Цель",
      generatedContent: [paragraph("same", "Без изменений"), paragraph("changed", "Новый текст"), paragraph("added", "Добавлено")],
      progress: { percent: 100, status: "ready", missingData: [], reviewNotes: [] },
      sources: []
    }
  ]
};

const version: WorkProgramVersion = {
  id: "version-1",
  title: "Версия 1",
  createdAt: "2026-07-23T00:00:00.000Z",
  sectionId: "target",
  changeSummary: "Тест",
  sourceSummary: [],
  subsections: [
    {
      ...section.subsections[0],
      generatedContent: [paragraph("same", "Без изменений"), paragraph("changed", "Старый текст"), paragraph("removed", "Удалено")]
    }
  ]
};

const diff = buildWorkProgramVersionDiff(version, section);

assert.equal(diff.find((item) => item.id === "same")?.status, "unchanged");
assert.equal(diff.find((item) => item.id === "changed")?.status, "changed");
assert.equal(diff.find((item) => item.id === "added")?.status, "added");
assert.equal(diff.find((item) => item.id === "removed")?.status, "removed");
assert.equal(diff.find((item) => item.id === "changed")?.previousText, "Старый текст");
assert.equal(diff.find((item) => item.id === "changed")?.currentText, "Новый текст");

console.log("work-program-version-diff.test.ts: ok");
