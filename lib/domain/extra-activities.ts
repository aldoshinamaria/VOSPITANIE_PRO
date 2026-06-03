import { educationLevelLabels } from "@/lib/domain/events";
import type { EducationLevel, ExtraActivity, ExtraActivityStatus, ExtraActivityType } from "@/types/domain";

export const extraActivityTypeLabels: Record<ExtraActivityType, string> = {
  extracurricular: "Внеурочная деятельность",
  additional_education: "Дополнительное образование"
};

export const extraActivityStatusLabels: Record<ExtraActivityStatus, string> = {
  active: "Активна",
  inactive: "Неактивна"
};

export interface ExtraActivityFilters {
  level: "all" | EducationLevel;
  classNumber: string;
  teacher: string;
}

export interface ExtraActivityPlanRow {
  id: string;
  title: string;
  classes: string;
  weeklyHours: number;
  teacher: string;
}

export function filterExtraActivities(activities: ExtraActivity[], filters: ExtraActivityFilters) {
  const normalizedTeacher = filters.teacher.trim().toLowerCase();

  return activities.filter((activity) => {
    const levelMatches = filters.level === "all" || activity.educationLevels.includes(filters.level);
    const classMatches = !filters.classNumber || activityHasClass(activity, filters.classNumber);
    const teacherMatches = !normalizedTeacher || activity.teacher.toLowerCase().includes(normalizedTeacher);

    return levelMatches && classMatches && teacherMatches;
  });
}

export function calculateWeeklyHoursByLevel(activities: ExtraActivity[]) {
  return (["noo", "ooo", "soo"] satisfies EducationLevel[]).reduce(
    (acc, level) => {
      acc[level] = activities
        .filter((activity) => activity.status === "active" && activity.educationLevels.includes(level))
        .reduce((total, activity) => total + activity.weeklyHours, 0);

      return acc;
    },
    {} as Record<EducationLevel, number>
  );
}

export function calculateStudentsCoverage(activities: ExtraActivity[]) {
  return activities
    .filter((activity) => activity.status === "active")
    .reduce((total, activity) => total + activity.studentsCount, 0);
}

export function buildExtraActivityPlanRows(activities: ExtraActivity[], level?: EducationLevel) {
  return activities
    .filter((activity) => activity.status === "active" && (!level || activity.educationLevels.includes(level)))
    .sort((a, b) => a.area.localeCompare(b.area, "ru") || a.title.localeCompare(b.title, "ru"))
    .map(
      (activity): ExtraActivityPlanRow => ({
        id: activity.id,
        title: activity.title,
        classes: activity.classes,
        weeklyHours: activity.weeklyHours,
        teacher: activity.teacher
      })
    );
}

export function formatEducationLevels(levels: EducationLevel[]) {
  return levels.map((level) => educationLevelLabels[level]).join(", ");
}

export function activityHasClass(activity: Pick<ExtraActivity, "classes">, classNumber: string) {
  const target = Number(classNumber);

  if (!Number.isInteger(target) || target < 1 || target > 11) {
    return activity.classes.toLowerCase().includes(classNumber.trim().toLowerCase());
  }

  const directNumbers = Array.from(activity.classes.matchAll(/\d{1,2}/g)).map((match) => Number(match[0]));

  if (directNumbers.includes(target)) {
    return true;
  }

  return Array.from(activity.classes.matchAll(/(\d{1,2})\s*[-–]\s*(\d{1,2})/g)).some((match) => {
    const start = Number(match[1]);
    const end = Number(match[2]);

    return target >= Math.min(start, end) && target <= Math.max(start, end);
  });
}
