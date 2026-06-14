import assert from "node:assert/strict";

import { createActivityReportBuilder } from "@/lib/domain/activity-reports";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";

const factory = createDemoSchoolFactory();
const builder = createActivityReportBuilder();

run("empty school creates empty report with high risks", () => {
  const state = factory.createEmptySchool();
  const report = builder.build({
    state,
    filter: { directionId: "all", periodMode: "academicYear" }
  });

  assert.equal(report.statistics.totalEvents, 0);
  assert.equal(report.statistics.planCompletionPercent, 0);
  assert.ok(report.risks.some((risk) => risk.level === "high"));
});

run("demo school report calculates KPI", () => {
  const state = factory.createDemoSchool("urban");
  const report = builder.build({
    state,
    filter: { directionId: "all", periodMode: "academicYear" }
  });

  assert.ok(report.statistics.totalEvents > 0);
  assert.ok(report.statistics.directionCoveragePercent > 0);
  assert.ok(report.insights.length > 0);
  assert.ok(report.recommendations.length > 0);
});

run("report supports direction filtering", () => {
  const state = factory.createDemoSchool("volunteer");
  const direction = state.activityDirections.find((item) => item.id === "direction-volunteer");

  assert.ok(direction);

  const report = builder.build({
    state,
    filter: { directionId: direction.id, periodMode: "academicYear" }
  });

  assert.ok(report.plan.rows.every((row) => row.directionIds.includes(direction.id)));
});

run("no completed events creates reporting risk", () => {
  const state = factory.createDemoSchool("urban");
  const report = builder.build({
    state: {
      ...state,
      events: state.events.map((event) => ({ ...event, status: "planned" })),
      eventExecutions: state.eventExecutions.map((execution) => ({
        ...execution,
        status: "planned",
        progress: { ...execution.progress, percent: 25 },
        confirmed: false,
        confirmedAt: ""
      }))
    },
    filter: { directionId: "all", periodMode: "academicYear" }
  });

  assert.ok(report.risks.some((risk) => risk.id === "no-completed-events"));
});

run("month report contains only selected month", () => {
  const state = factory.createDemoSchool("urban");
  const month = state.events[0]?.month ?? 9;
  const report = builder.build({
    state,
    filter: { directionId: "all", periodMode: "month", month }
  });

  assert.ok(report.plan.rows.every((row) => row.month === month));
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
