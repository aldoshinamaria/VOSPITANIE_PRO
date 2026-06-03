import { educationLevelLabels, educationLevels } from "@/lib/domain/events";
import { findModuleById } from "@/lib/domain/modules";
import { formatRuDate, monthLabels } from "@/lib/utils";
import type { EducationLevel, EducationModule, EventStatus, SchoolEvent } from "@/types/domain";

export interface KpvrPlanRow {
  id: string;
  eventId: string;
  level: EducationLevel;
  levelLabel: string;
  month: number;
  monthLabel: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  direction: string;
  classes: string;
  period: string;
  responsible: string;
  partner: string;
  participantsCount: number;
  status: EventStatus;
  startDate: string;
  endDate: string;
}

export function buildKpvrPlanRows(events: SchoolEvent[], modules: EducationModule[]) {
  return events
    .flatMap((event) =>
      event.educationLevels.map((level) => {
        const moduleTitle = findModuleById(modules, event.moduleId)?.title ?? "Модуль не выбран";

        return {
          id: `${event.id}-${level}`,
          eventId: event.id,
          level,
          levelLabel: educationLevelLabels[level],
          month: event.month,
          monthLabel: monthLabels[event.month],
          moduleId: event.moduleId,
          moduleTitle,
          title: event.title,
          direction: event.direction,
          classes: event.classes,
          period: event.endDate === event.startDate ? event.startDate : `${event.startDate} - ${event.endDate}`,
          responsible: event.responsible,
          partner: event.partner,
          participantsCount: event.participantsCount,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate
        } satisfies KpvrPlanRow;
      })
    )
    .sort(
      (a, b) =>
        getEducationLevelOrder(a.level) - getEducationLevelOrder(b.level) ||
        a.moduleTitle.localeCompare(b.moduleTitle, "ru") ||
        a.startDate.localeCompare(b.startDate)
    );
}

export function countKpvrRowsByLevel(rows: KpvrPlanRow[], level: EducationLevel) {
  return rows.filter((row) => row.level === level).length;
}

export interface KpvrDocumentGroup {
  moduleId: string;
  moduleTitle: string;
  rows: KpvrPlanRow[];
}

export interface KpvrDocument {
  level: EducationLevel;
  levelLabel: string;
  groups: KpvrDocumentGroup[];
  totalRows: number;
}

export function buildKpvrDocument(
  level: EducationLevel,
  events: SchoolEvent[],
  modules: EducationModule[]
): KpvrDocument {
  const moduleOrder = new Map(modules.map((moduleItem, index) => [moduleItem.id, index]));
  const rows = buildKpvrPlanRows(events, modules)
    .filter((row) => row.level === level)
    .sort(
      (a, b) =>
        (moduleOrder.get(a.moduleId) ?? Number.MAX_SAFE_INTEGER) -
          (moduleOrder.get(b.moduleId) ?? Number.MAX_SAFE_INTEGER) ||
        a.moduleTitle.localeCompare(b.moduleTitle, "ru") ||
        a.startDate.localeCompare(b.startDate)
    );

  const groups = rows.reduce<KpvrDocumentGroup[]>((acc, row) => {
    const lastGroup = acc.at(-1);

    if (lastGroup?.moduleId === row.moduleId) {
      lastGroup.rows.push(row);
      return acc;
    }

    acc.push({
      moduleId: row.moduleId,
      moduleTitle: row.moduleTitle,
      rows: [row]
    });

    return acc;
  }, []);

  return {
    level,
    levelLabel: educationLevelLabels[level],
    groups,
    totalRows: rows.length
  };
}

export function formatKpvrPeriod(row: Pick<KpvrPlanRow, "startDate" | "endDate">) {
  return row.endDate === row.startDate ? formatRuDate(row.startDate) : `${formatRuDate(row.startDate)} - ${formatRuDate(row.endDate)}`;
}

function getEducationLevelOrder(level: EducationLevel) {
  return educationLevels.indexOf(level);
}
