import { mockAppState } from "@/data/mock-data";
import { migrateEventDirectionRelations, standardActivityDirections } from "@/lib/domain/activity-directions";
import { migrateEventExecutions } from "@/lib/domain/event-execution";
import { createEmptyWorkProgram } from "@/lib/domain/work-program/work-program-assembler";
import { createUnknownDocumentClassification } from "@/lib/domain/document-processing/classifier";
import { migrateDocumentEventPreview } from "@/lib/domain/document-processing/event-preview-extractor";
import { migrateDocumentStructuredPreview } from "@/lib/domain/document-processing/structured-preview-extractor";
import { findModuleIdByTitle } from "@/lib/domain/modules";
import { WORK_STATE_STORAGE_KEY } from "@/lib/data-access/storage-keys";
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
import type { DocumentProcessingRecord } from "@/types/document-processing";

export interface AppRepository {
  getState(): AppState;
  saveState(state: AppState): void;
  reset(): AppState;
}

const LEGACY_STORAGE_KEY = "vospitanie-pro:app-state";
const WORK_OPERATIONAL_CLEANUP_KEY = "vospitanie-pro:work-operational-cleanup-2026-06-18";

export class LocalStorageAppRepository implements AppRepository {
  constructor(
    private readonly storageKey = LEGACY_STORAGE_KEY,
    private readonly fallbackState: AppState = mockAppState
  ) {}

  getState(): AppState {
    if (typeof window === "undefined") {
      return this.fallbackState;
    }

    const raw = window.localStorage.getItem(this.storageKey);

    if (!raw) {
      const initialState =
        this.storageKey === WORK_STATE_STORAGE_KEY ? clearWorkOperationalData(this.fallbackState) : this.fallbackState;

      this.saveState(initialState);

      if (this.storageKey === WORK_STATE_STORAGE_KEY) {
        window.localStorage.setItem(WORK_OPERATIONAL_CLEANUP_KEY, new Date().toISOString());
      }

      return initialState;
    }

    try {
      const nextState = migrateState(JSON.parse(raw) as Partial<AppState>, this.fallbackState);

      return nextState;
    } catch {
      this.saveState(this.fallbackState);
      return this.fallbackState;
    }
  }

  saveState(state: AppState) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  reset() {
    this.saveState(this.fallbackState);
    return this.fallbackState;
  }
}

export function createAppRepository(): AppRepository {
  return new LocalStorageAppRepository();
}

export function createWorkAppRepository(fallbackState: AppState): AppRepository {
  return new LocalStorageAppRepository(WORK_STATE_STORAGE_KEY, fallbackState);
}

export function createNamespacedAppRepository(storageKey: string, fallbackState: AppState): AppRepository {
  return new LocalStorageAppRepository(storageKey, fallbackState);
}

function clearWorkOperationalData(state: AppState): AppState {
  const clearedState: AppState = {
    ...state,
    events: [],
    kpvr: [],
    processedDocuments: [],
    documentProcessingLogs: [],
    extraActivities: [],
    importedDocuments: [],
    extractedEvents: [],
    eventDirectionRelations: [],
    eventExecutions: []
  };

  return {
    ...clearedState,
    workProgram: createEmptyWorkProgram(clearedState)
  };
}

export function migrateState(state: Partial<AppState>, fallbackState: AppState = mockAppState): AppState {
  const migratedState = {
    ...fallbackState,
    ...state,
    schoolPassport: migrateSchoolPassport(state.schoolPassport, fallbackState),
    educationModules: migrateEducationModules(state.educationModules, fallbackState),
    activityDirections: migrateActivityDirections(state.activityDirections),
    events: Array.isArray(state.events) ? state.events.map((event) => migrateEvent(event, fallbackState)) : fallbackState.events,
    kpvr: Array.isArray(state.kpvr) ? state.kpvr.map((item) => migrateKpvrItem(item, fallbackState)) : fallbackState.kpvr,
    extraActivities: Array.isArray(state.extraActivities)
      ? state.extraActivities.map((activity, index) => migrateExtraActivity(activity, index, fallbackState))
      : fallbackState.extraActivities,
    educationalSystem: {
      associations: Array.isArray(state.educationalSystem?.associations)
        ? state.educationalSystem.associations
        : fallbackState.educationalSystem.associations,
      infrastructureObjects: Array.isArray(state.educationalSystem?.infrastructureObjects)
        ? state.educationalSystem.infrastructureObjects
        : fallbackState.educationalSystem.infrastructureObjects,
      partners: Array.isArray(state.educationalSystem?.partners)
        ? state.educationalSystem.partners
        : fallbackState.educationalSystem.partners
    },
    importedDocuments: Array.isArray(state.importedDocuments) ? state.importedDocuments : fallbackState.importedDocuments,
    extractedEvents: Array.isArray(state.extractedEvents) ? state.extractedEvents : fallbackState.extractedEvents,
    normativeDocuments: Array.isArray(state.normativeDocuments) ? state.normativeDocuments : fallbackState.normativeDocuments,
    processedDocuments: Array.isArray(state.processedDocuments)
      ? state.processedDocuments.map(migrateProcessedDocument)
      : fallbackState.processedDocuments,
    documentProcessingLogs: Array.isArray(state.documentProcessingLogs)
      ? state.documentProcessingLogs
      : fallbackState.documentProcessingLogs,
    workProgram: fallbackState.workProgram,
    complianceCheckHistory: Array.isArray(state.complianceCheckHistory) ? state.complianceCheckHistory : fallbackState.complianceCheckHistory,
    exportDocuments: migrateExportDocuments(state.exportDocuments, fallbackState)
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

function migrateProcessedDocument(document: DocumentProcessingRecord): DocumentProcessingRecord {
  return {
    ...document,
    classification: document.classification ?? createUnknownDocumentClassification(document.createdAt),
    extractedEventPreview: migrateDocumentEventPreview(document.extractedEventPreview),
    structuredPreview: migrateDocumentStructuredPreview(document.structuredPreview)
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

function migrateSchoolPassport(passport: Partial<SchoolPassport> | undefined, fallbackState: AppState): SchoolPassport {
  const partners = passport?.socialPartners;

  return {
    ...fallbackState.schoolPassport,
    ...passport,
    academicYear: passport?.academicYear ?? fallbackState.schoolPassport.academicYear,
    infrastructure: {
      ...fallbackState.schoolPassport.infrastructure,
      ...passport?.infrastructure
    },
    socialPartners: Array.isArray(partners)
      ? partners.map((partner, index) => normalizePartner(partner, index))
      : fallbackState.schoolPassport.socialPartners
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

function migrateEducationModules(modules: EducationModule[] | undefined, fallbackState: AppState) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return fallbackState.educationModules;
  }

  const existingIds = new Set(modules.map((educationModule) => educationModule.id));
  const missingStandardModules = fallbackState.educationModules.filter(
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
  },
  fallbackState: AppState
): SchoolEvent {
  const fallbackEvent = fallbackState.events[0] ?? mockAppState.events[0];
  const startDate = event.startDate ?? event.date ?? fallbackEvent.startDate;
  const moduleId = event.moduleId ?? findModuleIdByTitle(fallbackState.educationModules, event.direction);

  return {
    ...fallbackEvent,
    ...event,
    moduleId,
    description: event.description ?? "",
    direction: event.direction ?? findModuleTitle(moduleId, fallbackState),
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

function migrateKpvrItem(item: Partial<KpvrItem>, fallbackState: AppState): KpvrItem {
  const fallbackItem = fallbackState.kpvr[0] ?? mockAppState.kpvr[0];

  if (item.moduleId) {
    return {
      ...fallbackItem,
      ...item,
      moduleId: item.moduleId
    };
  }

  return {
    ...fallbackItem,
    ...item,
    moduleId: findModuleIdByTitle(fallbackState.educationModules, item.module)
  };
}

function migrateExtraActivity(activity: Partial<ExtraActivity>, index: number, fallbackState: AppState): ExtraActivity {
  const fallback = fallbackState.extraActivities[index] ?? mockAppState.extraActivities[0];

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

function migrateExportDocuments(documents: AppState["exportDocuments"] | undefined, fallbackState: AppState) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return fallbackState.exportDocuments;
  }

  const existingIds = new Set(documents.map((document) => document.id));
  const missingDocuments = fallbackState.exportDocuments.filter((document) => !existingIds.has(document.id));

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

function findModuleTitle(moduleId: string, fallbackState: AppState) {
  return fallbackState.educationModules.find((educationModule) => educationModule.id === moduleId)?.title ?? "";
}
