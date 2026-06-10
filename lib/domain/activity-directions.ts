import { createId } from "@/lib/utils";
import type {
  ActivityDirection,
  ActivityDirectionCategory,
  ActivityDirectionGroup,
  DirectionStatistics,
  EducationLevel,
  EventDirectionRelation,
  SchoolEvent
} from "@/types/domain";

export const activityDirectionGroups: ActivityDirectionGroup[] = [
  {
    id: "group-prevention",
    title: "Профилактика",
    description: "Профилактическая работа и безопасность обучающихся.",
    category: "prevention"
  },
  {
    id: "group-upbringing",
    title: "Воспитание",
    description: "Направления воспитательной деятельности школы.",
    category: "upbringing"
  },
  {
    id: "group-communities",
    title: "Детские объединения",
    description: "Движения, отряды и ученическое самоуправление.",
    category: "student_community"
  },
  {
    id: "group-resources",
    title: "Ресурсы школы",
    description: "Музей, медиацентр и другие школьные ресурсы.",
    category: "school_resource"
  },
  {
    id: "group-support",
    title: "Сопровождение",
    description: "Поддержка обучающихся и работа с семьями.",
    category: "support"
  }
];

export const standardActivityDirections: ActivityDirection[] = [
  direction("direction-offense-prevention", "group-prevention", "Профилактика правонарушений", "prevention"),
  direction("direction-neglect-prevention", "group-prevention", "Профилактика безнадзорности", "prevention"),
  direction("direction-ddtt", "group-prevention", "ДДТТ", "prevention"),
  direction("direction-antiterror", "group-prevention", "Антитеррористическая безопасность", "safety"),
  direction("direction-info-security", "group-prevention", "Информационная безопасность", "safety"),
  direction("direction-healthy-life", "group-prevention", "ЗОЖ", "prevention"),
  direction("direction-patriotic", "group-upbringing", "Патриотическое воспитание", "upbringing"),
  direction("direction-civic", "group-upbringing", "Гражданское воспитание", "upbringing"),
  direction("direction-spiritual", "group-upbringing", "Духовно-нравственное воспитание", "upbringing"),
  direction("direction-ecological", "group-upbringing", "Экологическое воспитание", "upbringing"),
  direction("direction-labor", "group-upbringing", "Трудовое воспитание", "upbringing"),
  direction("direction-career", "group-upbringing", "Профориентация", "upbringing"),
  direction("direction-volunteer", "group-communities", "Волонтерская деятельность", "student_community"),
  direction("direction-parents", "group-support", "Работа с родителями", "support"),
  direction("direction-self-government", "group-communities", "Самоуправление", "student_community"),
  direction("direction-first-movement", "group-communities", "Движение Первых", "student_community"),
  direction("direction-eaglets", "group-communities", "Орлята России", "student_community"),
  direction("direction-yuid", "group-communities", "ЮИД", "student_community"),
  direction("direction-yunarmiya", "group-communities", "Юнармия", "student_community"),
  direction("direction-school-museum", "group-resources", "Школьный музей", "school_resource"),
  direction("direction-media-center", "group-resources", "Медиацентр", "school_resource"),
  direction("direction-mentoring", "group-support", "Наставничество", "support"),
  direction("direction-gifted-children", "group-support", "Одаренные дети", "support"),
  direction("direction-risk-group", "group-support", "Работа с детьми группы риска", "support")
];

export function createCustomActivityDirection(title: string): ActivityDirection {
  return {
    id: createId("activity-direction"),
    groupId: "group-support",
    title: title.trim(),
    description: "Пользовательское направление деятельности школы.",
    category: "support",
    active: true,
    custom: true
  };
}

export function createEventDirectionRelations(eventId: string, directionIds: string[]): EventDirectionRelation[] {
  return unique(directionIds).map((directionId) => ({
    id: createId("event-direction"),
    eventId,
    directionId
  }));
}

export function getDirectionIdsForEvent(eventId: string, relations: EventDirectionRelation[]) {
  return relations.filter((relation) => relation.eventId === eventId).map((relation) => relation.directionId);
}

export function getDirectionsForEvent(
  eventId: string,
  directions: ActivityDirection[],
  relations: EventDirectionRelation[]
) {
  const directionIds = new Set(getDirectionIdsForEvent(eventId, relations));

  return directions.filter((directionItem) => directionIds.has(directionItem.id));
}

export function replaceEventDirectionRelations(
  relations: EventDirectionRelation[],
  eventId: string,
  directionIds: string[]
) {
  return [
    ...relations.filter((relation) => relation.eventId !== eventId),
    ...createEventDirectionRelations(eventId, directionIds)
  ];
}

export function removeEventDirectionRelations(relations: EventDirectionRelation[], eventId: string) {
  return relations.filter((relation) => relation.eventId !== eventId);
}

export function inferDirectionIdsFromText(text: string, directions: ActivityDirection[]) {
  const normalized = normalize(text);

  return directions
    .filter((directionItem) => {
      const title = normalize(directionItem.title);
      const words = title.split(" ").filter((word) => word.length >= 3);

      return normalized.includes(title) || words.some((word) => normalized.includes(word));
    })
    .map((directionItem) => directionItem.id);
}

export function buildDirectionStatistics(
  directions: ActivityDirection[],
  relations: EventDirectionRelation[],
  events: SchoolEvent[]
): DirectionStatistics[] {
  return directions
    .map((directionItem) => {
      const eventIds = new Set(relations.filter((relation) => relation.directionId === directionItem.id).map((relation) => relation.eventId));
      const relatedEvents = events.filter((event) => eventIds.has(event.id));

      return {
        directionId: directionItem.id,
        title: directionItem.title,
        eventsCount: relatedEvents.length,
        byMonth: countByMonth(relatedEvents),
        byEducationLevel: countByEducationLevel(relatedEvents)
      };
    })
    .filter((item) => item.eventsCount > 0)
    .sort((a, b) => b.eventsCount - a.eventsCount || a.title.localeCompare(b.title, "ru"));
}

export function migrateEventDirectionRelations(
  events: SchoolEvent[],
  directions: ActivityDirection[],
  relations?: EventDirectionRelation[]
) {
  if (Array.isArray(relations) && relations.length > 0) {
    return relations;
  }

  return events.flatMap((event) => {
    const inferred = inferDirectionIdsFromText(`${event.direction} ${event.title} ${event.description}`, directions);
    const fallback = inferred.length > 0 ? inferred : [findFallbackDirectionId(event.direction, directions)];

    return createEventDirectionRelations(event.id, fallback.filter(Boolean));
  });
}

function direction(
  id: string,
  groupId: string,
  title: string,
  category: ActivityDirectionCategory
): ActivityDirection {
  return {
    id,
    groupId,
    title,
    description: title,
    category,
    active: true,
    custom: false
  };
}

function findFallbackDirectionId(title: string, directions: ActivityDirection[]) {
  return directions.find((directionItem) => normalize(directionItem.title) === normalize(title))?.id ?? directions[0]?.id ?? "";
}

function countByMonth(events: SchoolEvent[]) {
  return Array.from(new Set(events.map((event) => event.month)))
    .sort((a, b) => a - b)
    .map((month) => ({
      month,
      count: events.filter((event) => event.month === month).length
    }));
}

function countByEducationLevel(events: SchoolEvent[]) {
  const levels: EducationLevel[] = ["noo", "ooo", "soo"];

  return levels
    .map((level) => ({
      level,
      count: events.filter((event) => event.educationLevels.includes(level)).length
    }))
    .filter((item) => item.count > 0);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").trim();
}
