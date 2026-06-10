import { educationLevelLabels } from "@/lib/domain/events";
import { monthLabels } from "@/lib/utils";
import type {
  ActivityDirection,
  ActivityPlan,
  ActivityPlanExportOptions,
  ActivityPlanFilter,
  ActivityPlanGrouping,
  ActivityPlanProjection,
  ActivityPlanSection,
  AppState
} from "@/types/domain";
import { ActivityPlanFilterService, createActivityPlanFilterService } from "./filter-service";
import { ActivityPlanStatisticsService, createActivityPlanStatisticsService } from "./statistics-service";
import { buildActivityPlanTemplates, findActivityPlanTemplate } from "./templates";

export interface ActivityPlanBuilderInput {
  directionId: string | "all";
  academicYear: string;
  state: Pick<
    AppState,
    "activityDirections" | "eventDirectionRelations" | "events" | "educationModules"
  >;
  filter?: ActivityPlanFilter;
  options?: Partial<ActivityPlanExportOptions>;
}

export class ActivityPlanBuilder {
  constructor(
    private readonly filterService: ActivityPlanFilterService = createActivityPlanFilterService(),
    private readonly statisticsService: ActivityPlanStatisticsService = createActivityPlanStatisticsService()
  ) {}

  build(input: ActivityPlanBuilderInput): ActivityPlan {
    const templates = buildActivityPlanTemplates(input.state.activityDirections);
    const template = findActivityPlanTemplate(templates, input.directionId);
    const grouping = input.options?.grouping ?? template.defaultGrouping;
    const filter: ActivityPlanFilter = {
      ...(input.filter ?? {}),
      directionId: input.directionId === "all" ? input.filter?.directionId ?? "all" : input.directionId
    };
    const rows = this.filterService.buildProjections({
      events: input.state.events,
      directions: input.state.activityDirections,
      relations: input.state.eventDirectionRelations,
      modules: input.state.educationModules,
      filter
    });
    const directionTitle = getDirectionTitle(input.directionId, input.state.activityDirections);

    return {
      id: `activity-plan-${input.directionId}`,
      title: template.title,
      academicYear: input.academicYear,
      directionId: input.directionId,
      directionTitle,
      goal: template.goal,
      tasks: template.tasks,
      grouping,
      filters: filter,
      sections: groupRows(rows, grouping),
      rows,
      statistics: this.statisticsService.calculate(rows, input.state.activityDirections),
      generatedAt: new Date().toISOString()
    };
  }
}

export function createActivityPlanBuilder() {
  return new ActivityPlanBuilder();
}

export function groupRows(rows: ActivityPlanProjection[], grouping: ActivityPlanGrouping): ActivityPlanSection[] {
  if (grouping === "none") {
    return [{ id: "section-all", title: "Все мероприятия", rows }];
  }

  const groups = rows.reduce<Map<string, ActivityPlanProjection[]>>((acc, row) => {
    const key = getGroupKey(row, grouping);
    const list = acc.get(key) ?? [];
    list.push(row);
    acc.set(key, list);
    return acc;
  }, new Map());

  return Array.from(groups.entries())
    .map(([title, groupRowsList]) => ({
      id: `section-${grouping}-${slugify(title)}`,
      title,
      rows: groupRowsList.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ru"))
    }))
    .sort((a, b) => compareSections(a.title, b.title, grouping));
}

function getDirectionTitle(directionId: string | "all", directions: ActivityDirection[]) {
  if (directionId === "all") {
    return "Все направления";
  }

  return directions.find((direction) => direction.id === directionId)?.title ?? "Направление не выбрано";
}

function getGroupKey(row: ActivityPlanProjection, grouping: ActivityPlanGrouping) {
  if (grouping === "month") {
    return monthLabels[row.month] ?? `Месяц ${row.month}`;
  }

  if (grouping === "quarter") {
    return `${row.quarter} четверть`;
  }

  if (grouping === "module") {
    return row.moduleTitle;
  }

  if (grouping === "educationLevel") {
    return row.educationLevels.map((level) => educationLevelLabels[level]).join(", ");
  }

  if (grouping === "responsible") {
    return row.responsible || "Ответственный не указан";
  }

  if (grouping === "direction") {
    return row.directionTitles.join(", ") || "Направление не указано";
  }

  return "Все мероприятия";
}

function compareSections(left: string, right: string, grouping: ActivityPlanGrouping) {
  if (grouping === "month") {
    return getMonthOrder(left) - getMonthOrder(right);
  }

  if (grouping === "quarter") {
    return Number(left.slice(0, 1)) - Number(right.slice(0, 1));
  }

  return left.localeCompare(right, "ru");
}

function getMonthOrder(title: string) {
  const entry = Object.entries(monthLabels).find(([, label]) => label === title);

  return entry ? Number(entry[0]) : Number.MAX_SAFE_INTEGER;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "");
}
