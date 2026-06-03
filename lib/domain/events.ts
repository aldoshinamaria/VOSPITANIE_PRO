import type { EducationLevel, EventStatus, Priority, SchoolEvent } from "@/types/domain";

export const educationLevels = ["noo", "ooo", "soo"] satisfies EducationLevel[];

export const educationLevelLabels: Record<EducationLevel, string> = {
  noo: "НОО",
  ooo: "ООО",
  soo: "СОО"
};

export const eventStatusLabels: Record<EventStatus, string> = {
  planned: "Планируется",
  completed: "Проведено",
  cancelled: "Отменено"
};

export const priorityLabels: Record<Priority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий"
};

export function eventBelongsToPlan(event: SchoolEvent, level: EducationLevel) {
  return event.educationLevels.includes(level);
}

export function getEventPlanLabels(event: SchoolEvent) {
  return event.educationLevels.map((level) => `План ${educationLevelLabels[level]}`);
}

export function getKpvrPlanLabels(levels: EducationLevel[]) {
  return levels.map((level) => `КПВР ${educationLevelLabels[level]}`);
}

export function inferEducationLevelsFromClasses(classes: string): EducationLevel[] {
  const classNumbers = new Set(
    Array.from(classes.matchAll(/\d{1,2}/g))
      .map((match) => Number(match[0]))
      .filter((value) => value >= 1 && value <= 11)
  );

  Array.from(classes.matchAll(/(\d{1,2})\s*[-–]\s*(\d{1,2})/g)).forEach((match) => {
    const start = Number(match[1]);
    const end = Number(match[2]);
    const from = Math.min(start, end);
    const to = Math.max(start, end);

    for (let classNumber = from; classNumber <= to; classNumber += 1) {
      if (classNumber >= 1 && classNumber <= 11) {
        classNumbers.add(classNumber);
      }
    }
  });

  const normalizedClassNumbers = Array.from(classNumbers).filter((value) => value >= 1 && value <= 11);

  const levels = new Set<EducationLevel>();

  normalizedClassNumbers.forEach((classNumber) => {
    if (classNumber <= 4) {
      levels.add("noo");
      return;
    }

    if (classNumber <= 9) {
      levels.add("ooo");
      return;
    }

    levels.add("soo");
  });

  if (levels.size === 0) {
    levels.add("ooo");
  }

  return educationLevels.filter((level) => levels.has(level));
}
