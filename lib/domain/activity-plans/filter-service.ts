import type {
  ActivityDirection,
  ActivityPlanFilter,
  ActivityPlanProjection,
  EducationModule,
  EventDirectionRelation,
  SchoolEvent
} from "@/types/domain";
import { findModuleById } from "@/lib/domain/modules";
import { formatRuDate } from "@/lib/utils";

export class ActivityPlanFilterService {
  buildProjections(input: {
    events: SchoolEvent[];
    directions: ActivityDirection[];
    relations: EventDirectionRelation[];
    modules: EducationModule[];
    filter: ActivityPlanFilter;
  }): ActivityPlanProjection[] {
    const directionById = new Map(input.directions.map((direction) => [direction.id, direction]));
    const relationsByEvent = input.relations.reduce<Map<string, EventDirectionRelation[]>>((acc, relation) => {
      const list = acc.get(relation.eventId) ?? [];
      list.push(relation);
      acc.set(relation.eventId, list);
      return acc;
    }, new Map());

    return input.events
      .map((event) => {
        const eventRelations = relationsByEvent.get(event.id) ?? [];
        const directionIds = eventRelations.map((relation) => relation.directionId);
        const directionTitles = directionIds
          .map((directionId) => directionById.get(directionId)?.title)
          .filter((title): title is string => Boolean(title));
        const moduleTitle = findModuleById(input.modules, event.moduleId)?.title ?? "Модуль не выбран";

        return {
          id: `projection-${event.id}`,
          eventId: event.id,
          event,
          title: event.title,
          date: formatPlanPeriod(event.startDate, event.endDate),
          startDate: event.startDate,
          endDate: event.endDate,
          month: event.month,
          quarter: getQuarter(event.month),
          classes: event.classes,
          responsible: event.responsible,
          status: event.status,
          moduleId: event.moduleId,
          moduleTitle,
          directionIds,
          directionTitles,
          educationLevels: event.educationLevels
        } satisfies ActivityPlanProjection;
      })
      .filter((row) => this.matchesFilter(row, input.filter))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ru"));
  }

  matchesFilter(row: ActivityPlanProjection, filter: ActivityPlanFilter) {
    const directionId = filter.directionId ?? "all";
    const moduleId = filter.moduleId ?? "all";
    const educationLevel = filter.educationLevel ?? "all";
    const month = filter.month ?? "all";
    const status = filter.status ?? "all";
    const className = filter.className?.trim().toLowerCase() ?? "";
    const responsible = filter.responsible?.trim().toLowerCase() ?? "";

    return (
      (directionId === "all" || row.directionIds.includes(directionId)) &&
      (moduleId === "all" || row.moduleId === moduleId) &&
      (educationLevel === "all" || row.educationLevels.includes(educationLevel)) &&
      (month === "all" || row.month === month) &&
      (status === "all" || row.status === status) &&
      (!className || row.classes.toLowerCase().includes(className)) &&
      (!responsible || row.responsible.toLowerCase().includes(responsible))
    );
  }
}

export function createActivityPlanFilterService() {
  return new ActivityPlanFilterService();
}

export function formatPlanPeriod(startDate: string, endDate: string) {
  return startDate === endDate ? formatRuDate(startDate) : `${formatRuDate(startDate)} - ${formatRuDate(endDate)}`;
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
