import { educationLevels } from "@/lib/domain/events";
import { calculateEventExecutionStatistics, migrateEventExecutions } from "@/lib/domain/event-execution";
import type { ActivityPlan, ActivityReportStatistics, EventExecution, SchoolEvent } from "@/types/domain";

const expectedClasses = Array.from({ length: 11 }, (_, index) => String(index + 1));

export class ActivityReportStatisticsService {
  calculate(plan: ActivityPlan, allEvents: SchoolEvent[], totalDirections: number, executions: EventExecution[] = []): ActivityReportStatistics {
    const rows = plan.rows;
    const rowEvents = rows.map((row) => row.event);
    const rowExecutions = migrateEventExecutions(rowEvents, executions);
    const executionStatistics = calculateEventExecutionStatistics(rowEvents, rowExecutions);
    const completedEvents = executionStatistics.completed;
    const cancelledEvents = executionStatistics.cancelled;
    const plannedEvents = executionStatistics.planned + executionStatistics.assigned + executionStatistics.inProgress;
    const overdueEvents = executionStatistics.overdue;
    const coveredClasses = Array.from(new Set(rows.flatMap((row) => extractClassNumbers(row.classes)))).sort((a, b) => Number(a) - Number(b));
    const uncoveredClasses = expectedClasses.filter((className) => !coveredClasses.includes(className));
    const coveredDirections = new Set(rows.flatMap((row) => row.directionIds)).size;
    const participants = rows.reduce((sum, row) => sum + row.event.participantsCount, 0);

    return {
      totalEvents: rows.length,
      completedEvents,
      cancelledEvents,
      plannedEvents,
      overdueEvents,
      classCoveragePercent: Math.round((coveredClasses.length / expectedClasses.length) * 100),
      coveredClasses,
      uncoveredClasses,
      studentCoverage: participants,
      directionCoveragePercent: totalDirections > 0 ? Math.round((coveredDirections / totalDirections) * 100) : 0,
      coveredDirections,
      totalDirections,
      planCompletionPercent: rows.length > 0 ? Math.round((completedEvents / rows.length) * 100) : 0,
      confirmedExecutionPercent: executionStatistics.confirmedPercent,
      overdueExecutionPercent: executionStatistics.overduePercent,
      withoutResponsiblePercent: executionStatistics.withoutResponsiblePercent,
      averageEventsPerClass: coveredClasses.length > 0 ? round(rows.length / coveredClasses.length) : 0,
      averageEventsPerDirection: totalDirections > 0 ? round(allEvents.length / totalDirections) : 0
    };
  }
}

export function createActivityReportStatisticsService() {
  return new ActivityReportStatisticsService();
}

export function extractClassNumbers(value: string) {
  const matches = value.match(/\d{1,2}/g) ?? [];

  return Array.from(new Set(matches.filter((item) => Number(item) >= 1 && Number(item) <= 11)));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function countCoveredEducationLevels(events: SchoolEvent[]) {
  return educationLevels.filter((level) => events.some((event) => event.educationLevels.includes(level))).length;
}
