import assert from "node:assert/strict";

import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";
import { createInspectionCenter, inspectionScenarios } from "@/lib/domain/inspection-center";

const factory = createDemoSchoolFactory();
const center = createInspectionCenter();

run("empty school is not ready for self audit", () => {
  const state = factory.createEmptySchool();
  const readiness = center.analyze(state, "school-self-audit");

  assert.ok(readiness.score < 60);
  assert.ok(readiness.gaps.length > 0);
  assert.ok(readiness.risks.some((risk) => risk.level === "high"));
});

run("demo school builds inspection package", () => {
  const state = factory.createDemoSchool("urban");
  const pack = center.buildPackage(state, "school-self-audit");

  assert.ok(pack.sections.length > 0);
  assert.ok(pack.evidence.length > 0);
  assert.ok(pack.readiness.score >= 0 && pack.readiness.score <= 100);
});

run("all predefined scenarios can be analyzed", () => {
  const state = factory.createDemoSchool("volunteer");

  inspectionScenarios.forEach((scenario) => {
    const readiness = center.analyze(state, scenario.id);

    assert.ok(readiness.score >= 0 && readiness.score <= 100);
  });
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
