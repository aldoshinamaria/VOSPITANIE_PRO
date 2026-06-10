import assert from "node:assert/strict";

import {
  calculateEventExecutionStatistics,
  createEventExecutionRiskAnalyzer,
  migrateEventExecutions,
  updateExecutionStatus
} from "@/lib/domain/event-execution";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";

const factory = createDemoSchoolFactory();

run("migrates executions for every event", () => {
  const state = factory.createDemoSchool("urban");
  const executions = migrateEventExecutions(state.events, []);

  assert.equal(executions.length, state.events.length);
});

run("status update changes progress and history", () => {
  const state = factory.createDemoSchool("urban");
  const execution = migrateEventExecutions([state.events[0]])[0];
  const nextExecution = updateExecutionStatus(execution, "completed");

  assert.equal(nextExecution.status, "completed");
  assert.ok(nextExecution.progress.percent >= 85);
  assert.equal(nextExecution.history.length, 1);
});

run("statistics include confirmed and overdue percentages", () => {
  const state = factory.createDemoSchool("urban");
  const executions = migrateEventExecutions(state.events, state.eventExecutions).map((execution, index) =>
    index === 0 ? updateExecutionStatus(execution, "confirmed") : execution
  );
  const statistics = calculateEventExecutionStatistics(state.events, executions);

  assert.ok(statistics.total > 0);
  assert.ok(statistics.confirmedPercent > 0);
  assert.ok(statistics.completionPercent >= statistics.confirmedPercent);
});

run("risk analyzer detects missing responsible", () => {
  const state = factory.createDemoSchool("urban");
  const event = { ...state.events[0], responsible: "" };
  const risks = createEventExecutionRiskAnalyzer().analyze([event], migrateEventExecutions([event]));

  assert.ok(risks.some((risk) => risk.id.endsWith("no-responsible")));
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
