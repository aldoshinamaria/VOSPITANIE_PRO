import { createActivityMatrixAnalyzer } from "@/lib/domain/activity-matrix";
import { createActivityPlanBuilder, groupRows } from "@/lib/domain/activity-plans";
import type {
  ActivityPlanProjection,
  ActivityReport,
  ActivityReportFilter,
  ActivityReportSection,
  ActivityReportTemplate,
  AppState
} from "@/types/domain";
import { createActivityReportAnalyzer } from "./analyzer";
import { createActivityReportRecommendationEngine } from "./recommendation-engine";
import { createActivityReportRiskAnalyzer } from "./risk-analyzer";
import { createActivityReportStatisticsService } from "./statistics-service";

export interface ActivityReportBuilderInput {
  state: Pick<AppState, "schoolPassport" | "events" | "activityDirections" | "eventDirectionRelations" | "educationModules" | "eventExecutions">;
  filter: ActivityReportFilter;
}

export class ActivityReportBuilder {
  private readonly planBuilder = createActivityPlanBuilder();
  private readonly matrixAnalyzer = createActivityMatrixAnalyzer();
  private readonly statisticsService = createActivityReportStatisticsService();
  private readonly riskAnalyzer = createActivityReportRiskAnalyzer();
  private readonly recommendationEngine = createActivityReportRecommendationEngine();
  private readonly analyzer = createActivityReportAnalyzer();

  build(input: ActivityReportBuilderInput): ActivityReport {
    const plan = this.planBuilder.build({
      directionId: input.filter.directionId,
      academicYear: input.state.schoolPassport.academicYear,
      state: input.state,
      filter: buildPlanFilter(input.filter),
      options: { grouping: "month" }
    });
    const filteredRows = plan.rows.filter((row) => isInsidePeriod(row.startDate, input.filter));
    const filteredPlan = {
      ...plan,
      rows: filteredRows,
      sections: groupRows(filteredRows, "month"),
      statistics: {
        ...plan.statistics,
        totalEvents: filteredRows.length
      }
    };
    const matrix = this.matrixAnalyzer.buildMatrix({
      mode: "month",
      events: filteredRows.map((row) => row.event),
      directions: input.state.activityDirections,
      relations: input.state.eventDirectionRelations,
      modules: input.state.educationModules
    });
    const statistics = this.statisticsService.calculate(filteredPlan, input.state.events, input.state.activityDirections.length, input.state.eventExecutions);
    const risks = this.riskAnalyzer.analyze(statistics, matrix.analysis);
    const recommendations = this.recommendationEngine.build({ statistics, risks, matrixAnalysis: matrix.analysis });
    const insights = this.analyzer.analyze({ statistics, matrixAnalysis: matrix.analysis, risks });
    const template = buildReportTemplate(input.filter);

    return {
      id: `activity-report-${input.filter.directionId}-${input.filter.periodMode}`,
      title: template.title,
      academicYear: input.state.schoolPassport.academicYear,
      generatedAt: new Date().toISOString(),
      filter: input.filter,
      template,
      plan: filteredPlan,
      matrixAnalysis: matrix.analysis,
      statistics,
      sections: buildReportSections(filteredRows),
      insights,
      risks,
      recommendations
    };
  }
}

export function createActivityReportBuilder() {
  return new ActivityReportBuilder();
}

export function buildActivityReportTemplates(): ActivityReportTemplate[] {
  return [
    {
      id: "deputy-director-report",
      directionId: "all",
      title: "Общий отчет заместителя директора по воспитательной работе",
      description: "Сводный отчет по всем направлениям воспитательной деятельности.",
      defaultFilter: { directionId: "all", periodMode: "academicYear" }
    }
  ];
}

function buildPlanFilter(filter: ActivityReportFilter) {
  return {
    directionId: filter.directionId,
    month: filter.periodMode === "month" && filter.month ? filter.month : "all"
  } as const;
}

function buildReportTemplate(filter: ActivityReportFilter): ActivityReportTemplate {
  return {
    id: `template-${filter.directionId}-${filter.periodMode}`,
    directionId: filter.directionId,
    title: filter.directionId === "all" ? "Общий отчет заместителя директора" : "Отчет по направлению деятельности",
    description: "Автоматический отчет по данным единого реестра мероприятий.",
    defaultFilter: filter
  };
}

function buildReportSections(rows: ActivityPlanProjection[]): ActivityReportSection[] {
  return [
    {
      id: "completed",
      title: "Проведенные мероприятия",
      description: "Мероприятия со статусом «проведено».",
      rows: rows.filter((row) => row.status === "completed").map(toReportProjection)
    },
    {
      id: "not-completed",
      title: "Не проведено или требует уточнения",
      description: "Запланированные, отмененные и просроченные мероприятия.",
      rows: rows.filter((row) => row.status !== "completed").map(toReportProjection)
    }
  ];
}

function toReportProjection(row: ActivityPlanProjection) {
  return {
    id: row.id,
    eventId: row.eventId,
    title: row.title,
    date: row.date,
    startDate: row.startDate,
    endDate: row.endDate,
    classes: row.classes,
    responsible: row.responsible,
    status: row.status,
    directionTitles: row.directionTitles,
    educationLevels: row.educationLevels,
    participantsCount: row.event.participantsCount
  };
}

function isInsidePeriod(date: string, filter: ActivityReportFilter) {
  const eventDate = new Date(`${date}T00:00:00`);

  if (!Number.isFinite(eventDate.getTime())) {
    return true;
  }

  if (filter.periodMode === "academicYear") {
    return true;
  }

  if (filter.periodMode === "month") {
    return filter.month ? eventDate.getMonth() + 1 === filter.month : true;
  }

  if (filter.periodMode === "quarter") {
    return filter.quarter ? getQuarter(eventDate.getMonth() + 1) === filter.quarter : true;
  }

  if (filter.periodMode === "halfYear") {
    return filter.halfYear ? getHalfYear(eventDate.getMonth() + 1) === filter.halfYear : true;
  }

  if (filter.periodMode === "custom") {
    const start = filter.startDate ? new Date(`${filter.startDate}T00:00:00`) : null;
    const end = filter.endDate ? new Date(`${filter.endDate}T23:59:59`) : null;

    return (!start || eventDate >= start) && (!end || eventDate <= end);
  }

  return true;
}

function getQuarter(month: number) {
  if ([9, 10, 11].includes(month)) {
    return 1;
  }

  if ([12, 1, 2].includes(month)) {
    return 2;
  }

  if ([3, 4, 5].includes(month)) {
    return 3;
  }

  return 4;
}

function getHalfYear(month: number) {
  return [9, 10, 11, 12, 1, 2].includes(month) ? 1 : 2;
}
