import { educationLevels } from "@/lib/domain/events";
import type {
  ActivityDirection,
  ActivityPlanProjection,
  ActivityPlanStatistics
} from "@/types/domain";

export class ActivityPlanStatisticsService {
  calculate(rows: ActivityPlanProjection[], directions: ActivityDirection[], today = new Date()): ActivityPlanStatistics {
    const completedEvents = rows.filter((row) => row.status === "completed").length;
    const plannedEvents = rows.filter((row) => row.status === "planned").length;
    const cancelledEvents = rows.filter((row) => row.status === "cancelled").length;
    const overdueEvents = rows.filter((row) => row.status === "planned" && isPast(row.endDate, today)).length;

    return {
      totalEvents: rows.length,
      completedEvents,
      plannedEvents,
      cancelledEvents,
      overdueEvents,
      completionPercent: rows.length > 0 ? Math.round((completedEvents / rows.length) * 100) : 0,
      byDirection: calculateByDirection(rows, directions),
      byMonth: calculateByMonth(rows),
      byEducationLevel: calculateByEducationLevel(rows)
    };
  }
}

export function createActivityPlanStatisticsService() {
  return new ActivityPlanStatisticsService();
}

function calculateByDirection(rows: ActivityPlanProjection[], directions: ActivityDirection[]) {
  return directions
    .map((direction) => ({
      directionId: direction.id,
      directionTitle: direction.title,
      count: rows.filter((row) => row.directionIds.includes(direction.id)).length
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.directionTitle.localeCompare(b.directionTitle, "ru"));
}

function calculateByMonth(rows: ActivityPlanProjection[]) {
  return Array.from(new Set(rows.map((row) => row.month)))
    .sort((a, b) => a - b)
    .map((month) => ({
      month,
      count: rows.filter((row) => row.month === month).length
    }));
}

function calculateByEducationLevel(rows: ActivityPlanProjection[]) {
  return educationLevels
    .map((level) => ({
      level,
      count: rows.filter((row) => row.educationLevels.includes(level)).length
    }))
    .filter((item) => item.count > 0);
}

function isPast(value: string, today: Date) {
  const end = new Date(`${value}T23:59:59`);

  return Number.isFinite(end.getTime()) && end < today;
}
