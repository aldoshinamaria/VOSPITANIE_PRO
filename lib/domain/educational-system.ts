import type { SchoolEvent } from "@/types/events";
import type {
  EducationalAssociation,
  EducationalAssociationType,
  EducationalSystemPartner,
  EducationalSystemStatus,
  InfrastructureObjectType,
  SchoolInfrastructureObject
} from "@/types/educational-system";

export const associationTypeLabels: Record<EducationalAssociationType, string> = {
  volunteer_team: "Волонтерский отряд",
  school_museum: "Школьный музей",
  theater: "Театр",
  media_center: "Медиацентр",
  yuid: "ЮИД",
  yunarmiya: "Юнармия",
  eaglets_of_russia: "Орлята России",
  first_movement: "Движение Первых",
  sports_club: "Школьный спортивный клуб",
  custom: "Собственное объединение"
};

export const infrastructureObjectTypeLabels: Record<InfrastructureObjectType, string> = {
  museum: "Музей",
  media_center: "Медиацентр",
  assembly_hall: "Актовый зал",
  gym: "Спортивный зал",
  library: "Библиотека",
  child_initiatives_center: "Центр детских инициатив",
  museum_room: "Музейная комната",
  subject_classrooms: "Профильные кабинеты"
};

export const educationalSystemStatusLabels: Record<EducationalSystemStatus, string> = {
  active: "Активно",
  inactive: "Неактивно"
};

export type AssociationActivityLevel = "high" | "medium" | "low" | "inactive";

export const associationActivityLevelLabels: Record<AssociationActivityLevel, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
  inactive: "Нет активности"
};

export interface AssociationAnalytics {
  associationId: string;
  eventsCount: number;
  participantsCount: number;
  activityLevel: AssociationActivityLevel;
}

export function calculateAssociationAnalytics(
  association: EducationalAssociation,
  events: SchoolEvent[]
): AssociationAnalytics {
  const relatedEvents = events.filter((event) => event.associationId === association.id);
  const eventsCount = relatedEvents.length;
  const participantsCount =
    relatedEvents.reduce((sum, event) => sum + event.participantsCount, 0) || association.participantsCount;

  return {
    associationId: association.id,
    eventsCount,
    participantsCount,
    activityLevel: getAssociationActivityLevel(association.status, eventsCount)
  };
}

export function getAssociationActivityLevel(
  status: EducationalSystemStatus,
  eventsCount: number
): AssociationActivityLevel {
  if (status === "inactive" || eventsCount === 0) {
    return "inactive";
  }

  if (eventsCount >= 5) {
    return "high";
  }

  if (eventsCount >= 2) {
    return "medium";
  }

  return "low";
}

export function findAssociationById(associations: EducationalAssociation[], id?: string) {
  return associations.find((association) => association.id === id);
}

export function findInfrastructureObjectById(objects: SchoolInfrastructureObject[], id?: string) {
  return objects.find((object) => object.id === id);
}

export function findEducationalSystemPartnerById(partners: EducationalSystemPartner[], id?: string) {
  return partners.find((partner) => partner.id === id);
}
