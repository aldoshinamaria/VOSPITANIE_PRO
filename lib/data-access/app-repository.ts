import { mockAppState } from "@/data/mock-data";
import { migrateEventDirectionRelations, standardActivityDirections } from "@/lib/domain/activity-directions";
import { migrateEventExecutions } from "@/lib/domain/event-execution";
import { createEmptyWorkProgram } from "@/lib/domain/work-program/work-program-assembler";
import { findModuleIdByTitle } from "@/lib/domain/modules";
import type {
  AppState,
  EducationLevel,
  EducationModule,
  EventStatus,
  ExtraActivity,
  KpvrItem,
  SchoolEvent,
  SchoolPassport,
  SocialPartner,
  WorkProgram
} from "@/types/domain";

export interface AppRepository {
  getState(): AppState;
  saveState(state: AppState): void;
  reset(): AppState;
}

const STORAGE_KEY = "vospitanie-pro:app-state";

export class LocalStorageAppRepository implements AppRepository {
  getState(): AppState {
    if (typeof window === "undefined") {
      return mockAppState;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      this.saveState(mockAppState);
      return mockAppState;
    }

    try {
      return migrateState(JSON.parse(raw) as Partial<AppState>);
    } catch {
      this.saveState(mockAppState);
      return mockAppState;
    }
  }

  saveState(state: AppState) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  reset() {
    this.saveState(mockAppState);
    return mockAppState;
  }
}

export function createAppRepository(): AppRepository {
  return new LocalStorageAppRepository();
}

function migrateState(state: Partial<AppState>): AppState {
  const migratedState = {
    ...mockAppState,
    ...state,
    schoolPassport: migrateSchoolPassport(state.schoolPassport),
    educationModules: migrateEducationModules(state.educationModules),
    activityDirections: migrateActivityDirections(state.activityDirections),
    events: Array.isArray(state.events) ? state.events.map(migrateEvent) : mockAppState.events,
    kpvr: Array.isArray(state.kpvr) ? state.kpvr.map(migrateKpvrItem) : mockAppState.kpvr,
    extraActivities: Array.isArray(state.extraActivities)
      ? state.extraActivities.map(migrateExtraActivity)
      : mockAppState.extraActivities,
    educationalSystem: {
      associations: Array.isArray(state.educationalSystem?.associations)
        ? state.educationalSystem.associations
        : mockAppState.educationalSystem.associations,
      infrastructureObjects: Array.isArray(state.educationalSystem?.infrastructureObjects)
        ? state.educationalSystem.infrastructureObjects
        : mockAppState.educationalSystem.infrastructureObjects,
      partners: Array.isArray(state.educationalSystem?.partners)
        ? state.educationalSystem.partners
        : mockAppState.educationalSystem.partners
    },
    importedDocuments: Array.isArray(state.importedDocuments) ? state.importedDocuments : mockAppState.importedDocuments,
    extractedEvents: Array.isArray(state.extractedEvents) ? state.extractedEvents : mockAppState.extractedEvents,
    normativeDocuments: Array.isArray(state.normativeDocuments) ? state.normativeDocuments : mockAppState.normativeDocuments,
    processedDocuments: Array.isArray(state.processedDocuments) ? state.processedDocuments : mockAppState.processedDocuments,
    documentProcessingLogs: Array.isArray(state.documentProcessingLogs)
      ? state.documentProcessingLogs
      : mockAppState.documentProcessingLogs,
    workProgram: mockAppState.workProgram,
    complianceCheckHistory: Array.isArray(state.complianceCheckHistory) ? state.complianceCheckHistory : mockAppState.complianceCheckHistory,
    exportDocuments: migrateExportDocuments(state.exportDocuments)
  };

  return {
    ...migratedState,
    eventDirectionRelations: migrateEventDirectionRelations(
      migratedState.events,
      migratedState.activityDirections,
      state.eventDirectionRelations
    ),
    eventExecutions: migrateEventExecutions(migratedState.events, state.eventExecutions),
    workProgram: isCurrentWorkProgram(state.workProgram)
      ? state.workProgram
      : createEmptyWorkProgram(migratedState as AppState)
  };
}

function migrateActivityDirections(directions?: AppState["activityDirections"]) {
  if (!Array.isArray(directions) || directions.length === 0) {
    return standardActivityDirections;
  }

  const existingIds = new Set(directions.map((direction) => direction.id));
  const missingStandardDirections = standardActivityDirections.filter((direction) => !existingIds.has(direction.id));

  return [...directions, ...missingStandardDirections];
}

function isCurrentWorkProgram(program?: Partial<WorkProgram>): program is WorkProgram {
  return Boolean(
    program?.schoolCulture &&
      program.progress &&
      Array.isArray(program.sections) &&
      program.sections.every((section) => Array.isArray(section.subsections)) &&
      program.sectionVersions
  );
}

function migrateSchoolPassport(passport?: Partial<SchoolPassport>): SchoolPassport {
  const partners = passport?.socialPartners;

  return {
    ...mockAppState.schoolPassport,
    ...passport,
    academicYear: passport?.academicYear ?? mockAppState.schoolPassport.academicYear,
    infrastructure: {
      ...mockAppState.schoolPassport.infrastructure,
      ...passport?.infrastructure
    },
    socialPartners: Array.isArray(partners)
      ? partners.map((partner, index) => normalizePartner(partner, index))
      : mockAppState.schoolPassport.socialPartners
  };
}

function normalizePartner(partner: SocialPartner | string, index: number): SocialPartner {
  if (typeof partner === "string") {
    return {
      id: `partner-${index + 1}`,
      name: partner,
      type: "",
      activity: ""
    };
  }

  return {
    id: partner.id || `partner-${index + 1}`,
    name: partner.name || "",
    type: partner.type || "",
    activity: partner.activity || ""
  };
}

function migrateEducationModules(modules?: EducationModule[]) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return mockAppState.educationModules;
  }

  const existingIds = new Set(modules.map((educationModule) => educationModule.id));
  const missingStandardModules = mockAppState.educationModules.filter(
    (educationModule) => !existingIds.has(educationModule.id)
  );

  return [...modules, ...missingStandardModules];
}

function migrateEvent(
  event: Partial<SchoolEvent> & {
    date?: string;
    participants?: string;
    direction?: string;
    status?: string;
  }
): SchoolEvent {
  const startDate = event.startDate ?? event.date ?? mockAppState.events[0].startDate;
  const moduleId = event.moduleId ?? findModuleIdByTitle(mockAppState.educationModules, event.direction);

  return {
    ...mockAppState.events[0],
    ...event,
    moduleId,
    description: event.description ?? "",
    direction: event.direction ?? findModuleTitle(moduleId),
    educationLevels: normalizeEducationLevels(event.educationLevels),
    classes: event.classes ?? event.participants ?? "",
    startDate,
    endDate: event.endDate ?? startDate,
    month: getMonthFromDate(startDate),
    venue: event.venue ?? "",
    coExecutors: event.coExecutors ?? "",
    partner: event.partner ?? "",
    associationId: event.associationId ?? "",
    infrastructureObjectId: event.infrastructureObjectId ?? "",
    systemPartnerId: event.systemPartnerId ?? "",
    status: normalizeEventStatus(event.status),
    participantsCount: event.participantsCount ?? parseParticipantsCount(event.participants),
    shortReport: event.shortReport ?? ""
  };
}

function migrateKpvrItem(item: Partial<KpvrItem>): KpvrItem {
  if (item.moduleId) {
    return {
      ...mockAppState.kpvr[0],
      ...item,
      moduleId: item.moduleId
    };
  }

  return {
    ...mockAppState.kpvr[0],
    ...item,
    moduleId: findModuleIdByTitle(mockAppState.educationModules, item.module)
  };
}

function migrateExtraActivity(activity: Partial<ExtraActivity>, index: number): ExtraActivity {
  const fallback = mockAppState.extraActivities[index] ?? mockAppState.extraActivities[0];

  return {
    ...fallback,
    ...activity,
    type: activity.type ?? fallback.type,
    educationLevels: normalizeEducationLevels(activity.educationLevels),
    classes: activity.classes ?? fallback.classes,
    classroom: activity.classroom ?? fallback.classroom,
    weeklyHours: activity.weeklyHours ?? fallback.weeklyHours,
    totalHours: activity.totalHours ?? fallback.totalHours,
    studentsCount: activity.studentsCount ?? fallback.studentsCount,
    status: activity.status ?? fallback.status
  };
}

function migrateExportDocuments(documents?: AppState["exportDocuments"]) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return mockAppState.exportDocuments;
  }

  const existingIds = new Set(documents.map((document) => document.id));
  const missingDocuments = mockAppState.exportDocuments.filter((document) => !existingIds.has(document.id));

  return [...documents, ...missingDocuments].map((document) => ({
    ...document,
    format: "docx" as const
  }));
}

function normalizeEducationLevels(levels?: EducationLevel[]) {
  return Array.isArray(levels) && levels.length > 0 ? levels : (["ooo"] satisfies EducationLevel[]);
}

function normalizeEventStatus(status?: string): EventStatus {
  if (status === "completed") {
    return "completed";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return "planned";
}

function parseParticipantsCount(participants?: string) {
  const match = participants?.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function getMonthFromDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 1 : date.getMonth() + 1;
}

function findModuleTitle(moduleId: string) {
  return mockAppState.educationModules.find((educationModule) => educationModule.id === moduleId)?.title ?? "";
}
