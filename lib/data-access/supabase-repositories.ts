import { mockAppState } from "@/data/mock-data";
import { migrateEventDirectionRelations, standardActivityDirections } from "@/lib/domain/activity-directions";
import { migrateEventExecutions } from "@/lib/domain/event-execution";
import type {
  EventInsert,
  EventRow,
  DocumentProcessingStateInsert,
  EducationalAssociationInsert,
  EducationalAssociationRow,
  EducationalSystemPartnerInsert,
  EducationalSystemPartnerRow,
  ExtractedEventInsert,
  ExtractedEventRow,
  ExtracurricularProgramInsert,
  ExtracurricularProgramRow,
  ImportedDocumentInsert,
  ImportedDocumentRow,
  ModuleInsert,
  ModuleRow,
  NormativeDocumentInsert,
  NormativeDocumentRow,
  PartnerInsert,
  PartnerRow,
  SchoolInsert,
  SchoolInfrastructureObjectInsert,
  SchoolInfrastructureObjectRow,
  SchoolRow,
  StaffInsert,
  SupabaseBrowserClient,
  WorkProgramInsert,
  WorkProgramRow
} from "@/lib/supabase/client";
import { createEmptyWorkProgram } from "@/lib/domain/work-program/work-program-assembler";
import { createUnknownDocumentClassification } from "@/lib/domain/document-processing/classifier";
import { migrateDocumentEventPreview } from "@/lib/domain/document-processing/event-preview-extractor";
import { migrateDocumentStructuredPreview } from "@/lib/domain/document-processing/structured-preview-extractor";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createId } from "@/lib/utils";
import type { AppState } from "@/types/app-state";
import type { EducationLevel, Priority } from "@/types/common";
import type { DocumentProcessingLogEntry, DocumentProcessingRecord } from "@/types/document-processing";
import type {
  EducationalAssociation,
  EducationalAssociationType,
  EducationalSystem,
  EducationalSystemPartner,
  EducationalSystemStatus,
  InfrastructureObjectType,
  SchoolInfrastructureObject
} from "@/types/educational-system";
import type { EventStatus, SchoolEvent } from "@/types/events";
import type { ExtraActivity, ExtraActivityStatus, ExtraActivityType } from "@/types/extra-activities";
import type {
  ExtractedEvent,
  ExtractedEventStatus,
  ImportedDocument,
  ImportedDocumentStatus,
  ImportedDocumentType
} from "@/types/imported-documents";
import type { EducationModule } from "@/types/modules";
import type {
  NormativeDocument,
  NormativeDocumentActualityStatus,
  NormativeDocumentCategory,
  NormativeDocumentLevel,
  NormativeRequirement
} from "@/types/normative-documents";
import type { SchoolInfrastructure, SchoolPassport, SocialPartner } from "@/types/school";
import type { WorkProgram } from "@/types/work-program";
import type {
  AppDataAccess,
  EventRepository,
  ExtracurricularRepository,
  ModuleRepository,
  SchoolRepository
} from "./repository-contracts";

export function createSupabaseDataAccess(client?: SupabaseBrowserClient): AppDataAccess {
  let resolvedClient: SupabaseBrowserClient;

  try {
    resolvedClient = client ?? createSupabaseBrowserClient();
  } catch (error) {
    return createUnavailableDataAccess(error);
  }

  const repository = new SupabaseAppRepository(resolvedClient);

  return createRepositoryDataAccess(repository);
}

function createRepositoryDataAccess(repository: SupabaseAppRepository): AppDataAccess {
  return {
    getState: () => repository.getState(),
    saveState: (state) => repository.saveState(state),
    reset: () => repository.reset(),
    school: createSchoolRepository(repository),
    events: createEventRepository(repository),
    modules: createModuleRepository(repository),
    extracurricular: createExtracurricularRepository(repository)
  };
}

function createUnavailableDataAccess(error: unknown): AppDataAccess {
  const repositoryError = error instanceof Error ? error : new Error("Supabase не настроен.");
  const reject = async () => {
    throw repositoryError;
  };

  return {
    getState: reject,
    saveState: reject,
    reset: reject,
    school: {
      getPassport: reject,
      savePassport: reject
    },
    events: {
      list: reject,
      saveAll: reject,
      upsert: reject,
      delete: reject
    },
    modules: {
      list: reject,
      saveAll: reject,
      upsert: reject
    },
    extracurricular: {
      list: reject,
      saveAll: reject,
      upsert: reject,
      delete: reject
    }
  };
}

class SupabaseAppRepository {
  constructor(private readonly client: SupabaseBrowserClient) {}

  async getState(): Promise<AppState> {
    const school = await this.getCurrentSchool();

    const baseState = {
      schoolPassport: await this.getPassport(school.id),
      educationModules: await this.listModules(school.id),
      activityDirections: standardActivityDirections,
      eventDirectionRelations: mockAppState.eventDirectionRelations,
      eventExecutions: mockAppState.eventExecutions,
      events: await this.listEvents(school.id),
      kpvr: mockAppState.kpvr,
      extraActivities: await this.listExtraActivities(school.id),
      educationalSystem: await this.getEducationalSystem(school.id),
      importedDocuments: await this.listImportedDocuments(school.id),
      extractedEvents: await this.listExtractedEvents(school.id),
      normativeDocuments: await this.listNormativeDocuments(school.id),
      processedDocuments: mockAppState.processedDocuments,
      documentProcessingLogs: mockAppState.documentProcessingLogs,
      workProgram: mockAppState.workProgram,
      complianceCheckHistory: mockAppState.complianceCheckHistory,
      exportDocuments: mockAppState.exportDocuments
    };

    const workProgramState = await this.getWorkProgramState(school.id, baseState);

    return {
      ...baseState,
      ...(await this.getDocumentProcessingState(school.id)),
      ...workProgramState
    };
  }

  async saveState(state: AppState): Promise<void> {
    const school = await this.savePassport(state.schoolPassport);

    await Promise.all([
      this.replaceModules(school.id, state.educationModules),
      this.replaceEvents(school.id, state.events),
      this.replaceExtraActivities(school.id, state.extraActivities),
      this.replaceEducationalSystem(school.id, state.educationalSystem),
      this.replaceImportedDocuments(school.id, state.importedDocuments),
      this.replaceExtractedEvents(school.id, state.extractedEvents),
      this.replaceNormativeDocuments(school.id, state.normativeDocuments),
      this.saveDocumentProcessingState(school.id, state),
      this.saveWorkProgramState(school.id, state),
      this.syncStaff(school.id, state)
    ]);
  }

  async reset(): Promise<AppState> {
    const schoolId = mockAppState.schoolPassport.id;
    await Promise.all([
      this.client.from("events").delete().eq("school_id", schoolId),
      this.client.from("extracurricular_programs").delete().eq("school_id", schoolId),
      this.client.from("modules").delete().eq("school_id", schoolId),
      this.client.from("partners").delete().eq("school_id", schoolId),
      this.client.from("educational_associations").delete().eq("school_id", schoolId),
      this.client.from("school_infrastructure_objects").delete().eq("school_id", schoolId),
      this.client.from("educational_system_partners").delete().eq("school_id", schoolId),
      this.client.from("imported_documents").delete().eq("school_id", schoolId),
      this.client.from("extracted_events").delete().eq("school_id", schoolId),
      this.client.from("normative_documents").delete().eq("school_id", schoolId),
      this.client.from("document_processing_state").delete().eq("school_id", schoolId),
      this.client.from("work_programs").delete().eq("school_id", schoolId),
      this.client.from("staff").delete().eq("school_id", schoolId)
    ]);

    await this.saveState(mockAppState);
    return this.getState();
  }

  async getPassport(schoolId: string): Promise<SchoolPassport> {
    const { data: school, error: schoolError } = await this.client
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single();

    if (schoolError) {
      throw toRepositoryError("Не удалось загрузить паспорт школы", schoolError);
    }

    const { data: partners, error: partnersError } = await this.client
      .from("partners")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");

    if (partnersError) {
      throw toRepositoryError("Не удалось загрузить социальных партнеров", partnersError);
    }

    return mapSchoolRow(school, partners ?? []);
  }

  async savePassport(passport: SchoolPassport): Promise<SchoolPassport> {
    const schoolRow = mapSchoolToInsert(passport);
    const { error: schoolError } = await this.client.from("schools").upsert(schoolRow);

    if (schoolError) {
      throw toRepositoryError("Не удалось сохранить паспорт школы", schoolError);
    }

    await this.replacePartners(passport.id, passport.socialPartners);
    await this.syncStaff(passport.id, {
      ...mockAppState,
      schoolPassport: passport
    });

    return this.getPassport(passport.id);
  }

  async listEvents(schoolId: string): Promise<SchoolEvent[]> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("school_id", schoolId)
      .order("start_date", { ascending: true });

    if (error) {
      throw toRepositoryError("Не удалось загрузить мероприятия", error);
    }

    return (data ?? []).map(mapEventRow);
  }

  async replaceEvents(schoolId: string, events: SchoolEvent[]): Promise<SchoolEvent[]> {
    await deleteMissingRows(this.client, "events", schoolId, events.map((event) => event.id));

    if (events.length > 0) {
      const { error } = await this.client.from("events").upsert(events.map((event) => mapEventToInsert(schoolId, event)));

      if (error) {
        throw toRepositoryError("Не удалось сохранить мероприятия", error);
      }
    }

    return this.listEvents(schoolId);
  }

  async upsertEvent(event: SchoolEvent): Promise<SchoolEvent> {
    const school = await this.getCurrentSchool();
    const { error } = await this.client.from("events").upsert(mapEventToInsert(school.id, event));

    if (error) {
      throw toRepositoryError("Не удалось сохранить мероприятие", error);
    }

    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.client.from("events").delete().eq("id", id);

    if (error) {
      throw toRepositoryError("Не удалось удалить мероприятие", error);
    }
  }

  async listModules(schoolId: string): Promise<EducationModule[]> {
    const { data, error } = await this.client.from("modules").select("*").eq("school_id", schoolId).order("title");

    if (error) {
      throw toRepositoryError("Не удалось загрузить модули воспитания", error);
    }

    return data && data.length > 0 ? data.map(mapModuleRow) : mockAppState.educationModules;
  }

  async replaceModules(schoolId: string, modules: EducationModule[]): Promise<EducationModule[]> {
    await deleteMissingRows(this.client, "modules", schoolId, modules.map((module) => module.id));

    if (modules.length > 0) {
      const { error } = await this.client.from("modules").upsert(modules.map((module) => mapModuleToInsert(schoolId, module)));

      if (error) {
        throw toRepositoryError("Не удалось сохранить модули воспитания", error);
      }
    }

    return this.listModules(schoolId);
  }

  async upsertModule(module: EducationModule): Promise<EducationModule> {
    const school = await this.getCurrentSchool();
    const { error } = await this.client.from("modules").upsert(mapModuleToInsert(school.id, module));

    if (error) {
      throw toRepositoryError("Не удалось сохранить модуль воспитания", error);
    }

    return module;
  }

  async listExtraActivities(schoolId: string): Promise<ExtraActivity[]> {
    const { data, error } = await this.client
      .from("extracurricular_programs")
      .select("*")
      .eq("school_id", schoolId)
      .order("title");

    if (error) {
      throw toRepositoryError("Не удалось загрузить внеурочную деятельность", error);
    }

    return (data ?? []).map(mapExtraActivityRow);
  }

  async replaceExtraActivities(schoolId: string, programs: ExtraActivity[]): Promise<ExtraActivity[]> {
    await deleteMissingRows(this.client, "extracurricular_programs", schoolId, programs.map((program) => program.id));

    if (programs.length > 0) {
      const { error } = await this.client
        .from("extracurricular_programs")
        .upsert(programs.map((program) => mapExtraActivityToInsert(schoolId, program)));

      if (error) {
        throw toRepositoryError("Не удалось сохранить внеурочную деятельность", error);
      }
    }

    return this.listExtraActivities(schoolId);
  }

  async upsertExtraActivity(program: ExtraActivity): Promise<ExtraActivity> {
    const school = await this.getCurrentSchool();
    const { error } = await this.client
      .from("extracurricular_programs")
      .upsert(mapExtraActivityToInsert(school.id, program));

    if (error) {
      throw toRepositoryError("Не удалось сохранить программу внеурочной деятельности", error);
    }

    return program;
  }

  async deleteExtraActivity(id: string): Promise<void> {
    const { error } = await this.client.from("extracurricular_programs").delete().eq("id", id);

    if (error) {
      throw toRepositoryError("Не удалось удалить программу внеурочной деятельности", error);
    }
  }

  async getEducationalSystem(schoolId: string): Promise<EducationalSystem> {
    const [associationsResult, infrastructureResult, partnersResult] = await Promise.all([
      this.client.from("educational_associations").select("*").eq("school_id", schoolId).order("title"),
      this.client.from("school_infrastructure_objects").select("*").eq("school_id", schoolId).order("title"),
      this.client.from("educational_system_partners").select("*").eq("school_id", schoolId).order("title")
    ]);

    if (associationsResult.error) {
      throw toRepositoryError("Не удалось загрузить воспитательные объединения", associationsResult.error);
    }

    if (infrastructureResult.error) {
      throw toRepositoryError("Не удалось загрузить инфраструктуру воспитательной системы", infrastructureResult.error);
    }

    if (partnersResult.error) {
      throw toRepositoryError("Не удалось загрузить партнеров воспитательной системы", partnersResult.error);
    }

    return {
      associations:
        associationsResult.data && associationsResult.data.length > 0
          ? associationsResult.data.map(mapEducationalAssociationRow)
          : mockAppState.educationalSystem.associations,
      infrastructureObjects:
        infrastructureResult.data && infrastructureResult.data.length > 0
          ? infrastructureResult.data.map(mapSchoolInfrastructureObjectRow)
          : mockAppState.educationalSystem.infrastructureObjects,
      partners:
        partnersResult.data && partnersResult.data.length > 0
          ? partnersResult.data.map(mapEducationalSystemPartnerRow)
          : mockAppState.educationalSystem.partners
    };
  }

  async replaceEducationalSystem(schoolId: string, system: EducationalSystem): Promise<EducationalSystem> {
    await Promise.all([
      deleteMissingRows(
        this.client,
        "educational_associations",
        schoolId,
        system.associations.map((association) => association.id)
      ),
      deleteMissingRows(
        this.client,
        "school_infrastructure_objects",
        schoolId,
        system.infrastructureObjects.map((object) => object.id)
      ),
      deleteMissingRows(
        this.client,
        "educational_system_partners",
        schoolId,
        system.partners.map((partner) => partner.id)
      )
    ]);

    const [associationsResult, infrastructureResult, partnersResult] = await Promise.all([
      system.associations.length > 0
        ? this.client
            .from("educational_associations")
            .upsert(system.associations.map((association) => mapEducationalAssociationToInsert(schoolId, association)))
        : Promise.resolve({ error: null }),
      system.infrastructureObjects.length > 0
        ? this.client
            .from("school_infrastructure_objects")
            .upsert(system.infrastructureObjects.map((object) => mapSchoolInfrastructureObjectToInsert(schoolId, object)))
        : Promise.resolve({ error: null }),
      system.partners.length > 0
        ? this.client
            .from("educational_system_partners")
            .upsert(system.partners.map((partner) => mapEducationalSystemPartnerToInsert(schoolId, partner)))
        : Promise.resolve({ error: null })
    ]);

    if (associationsResult.error) {
      throw toRepositoryError("Не удалось сохранить воспитательные объединения", associationsResult.error);
    }

    if (infrastructureResult.error) {
      throw toRepositoryError("Не удалось сохранить инфраструктуру воспитательной системы", infrastructureResult.error);
    }

    if (partnersResult.error) {
      throw toRepositoryError("Не удалось сохранить партнеров воспитательной системы", partnersResult.error);
    }

    return this.getEducationalSystem(schoolId);
  }

  async listImportedDocuments(schoolId: string): Promise<ImportedDocument[]> {
    const { data, error } = await this.client
      .from("imported_documents")
      .select("*")
      .eq("school_id", schoolId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw toRepositoryError("Не удалось загрузить импортированные документы", error);
    }

    return (data ?? []).map(mapImportedDocumentRow);
  }

  async replaceImportedDocuments(schoolId: string, documents: ImportedDocument[]): Promise<ImportedDocument[]> {
    await deleteMissingRows(
      this.client,
      "imported_documents",
      schoolId,
      documents.map((document) => document.id)
    );

    if (documents.length > 0) {
      const { error } = await this.client
        .from("imported_documents")
        .upsert(documents.map((document) => mapImportedDocumentToInsert(schoolId, document)));

      if (error) {
        throw toRepositoryError("Не удалось сохранить импортированные документы", error);
      }
    }

    return this.listImportedDocuments(schoolId);
  }

  async listExtractedEvents(schoolId: string): Promise<ExtractedEvent[]> {
    const { data, error } = await this.client
      .from("extracted_events")
      .select("*")
      .eq("school_id", schoolId)
      .order("date", { ascending: true });

    if (error) {
      throw toRepositoryError("Не удалось загрузить найденные мероприятия", error);
    }

    return (data ?? []).map(mapExtractedEventRow);
  }

  async replaceExtractedEvents(schoolId: string, events: ExtractedEvent[]): Promise<ExtractedEvent[]> {
    await deleteMissingRows(
      this.client,
      "extracted_events",
      schoolId,
      events.map((event) => event.id)
    );

    if (events.length > 0) {
      const { error } = await this.client
        .from("extracted_events")
        .upsert(events.map((event) => mapExtractedEventToInsert(schoolId, event)));

      if (error) {
        throw toRepositoryError("Не удалось сохранить найденные мероприятия", error);
      }
    }

    return this.listExtractedEvents(schoolId);
  }

  async listNormativeDocuments(schoolId: string): Promise<NormativeDocument[]> {
    const { data, error } = await this.client
      .from("normative_documents")
      .select("*")
      .eq("school_id", schoolId)
      .order("document_date", { ascending: false });

    if (error) {
      throw toRepositoryError("Не удалось загрузить нормативные документы", error);
    }

    return (data ?? []).map(mapNormativeDocumentRow);
  }

  async replaceNormativeDocuments(schoolId: string, documents: NormativeDocument[]): Promise<NormativeDocument[]> {
    await deleteMissingRows(
      this.client,
      "normative_documents",
      schoolId,
      documents.map((document) => document.id)
    );

    if (documents.length > 0) {
      const { error } = await this.client
        .from("normative_documents")
        .upsert(documents.map((document) => mapNormativeDocumentToInsert(schoolId, document)));

      if (error) {
        throw toRepositoryError("Не удалось сохранить нормативные документы", error);
      }
    }

    return this.listNormativeDocuments(schoolId);
  }

  async getDocumentProcessingState(schoolId: string): Promise<Pick<AppState, "processedDocuments" | "documentProcessingLogs">> {
    const { data, error } = await this.client
      .from("document_processing_state")
      .select("*")
      .eq("school_id", schoolId)
      .maybeSingle();

    if (error) {
      throw toRepositoryError("Не удалось загрузить состояние обработки документов", error);
    }

    if (!data) {
      return {
        processedDocuments: mockAppState.processedDocuments,
        documentProcessingLogs: mockAppState.documentProcessingLogs
      };
    }

    return {
      processedDocuments: Array.isArray(data.processed_documents)
        ? (data.processed_documents as DocumentProcessingRecord[]).map(normalizeProcessedDocument)
        : [],
      documentProcessingLogs: Array.isArray(data.logs) ? (data.logs as DocumentProcessingLogEntry[]) : []
    };
  }

  async saveDocumentProcessingState(schoolId: string, state: AppState): Promise<void> {
    const { error } = await this.client.from("document_processing_state").upsert({
      id: `${schoolId}-document-processing`,
      school_id: schoolId,
      processed_documents: state.processedDocuments,
      logs: state.documentProcessingLogs,
      updated_at: new Date().toISOString()
    } satisfies DocumentProcessingStateInsert);

    if (error) {
      throw toRepositoryError("Не удалось сохранить состояние обработки документов", error);
    }
  }

  async getWorkProgram(schoolId: string, state: AppState): Promise<WorkProgram> {
    return (await this.getWorkProgramState(schoolId, state)).workProgram;
  }

  async getWorkProgramState(
    schoolId: string,
    state: AppState
  ): Promise<Pick<AppState, "workProgram" | "complianceCheckHistory" | "activityDirections" | "eventDirectionRelations" | "eventExecutions">> {
    const { data, error } = await this.client
      .from("work_programs")
      .select("*")
      .eq("school_id", schoolId)
      .maybeSingle();

    if (error) {
      throw toRepositoryError("Не удалось загрузить рабочую программу воспитания", error);
    }

    const rawData = data?.data as (Partial<WorkProgram> & Pick<Partial<AppState>, "complianceCheckHistory" | "activityDirections" | "eventDirectionRelations" | "eventExecutions">) | null;
    const activityDirections = Array.isArray(rawData?.activityDirections) ? rawData.activityDirections : state.activityDirections;

    return {
      workProgram: data?.data ? normalizeWorkProgram(data as WorkProgramRow, state) : createEmptyWorkProgram(state),
      activityDirections,
      eventDirectionRelations: migrateEventDirectionRelations(
        state.events,
        activityDirections,
        rawData?.eventDirectionRelations
      ),
      eventExecutions: migrateEventExecutions(state.events, rawData?.eventExecutions),
      complianceCheckHistory: Array.isArray(rawData?.complianceCheckHistory)
        ? rawData.complianceCheckHistory
        : mockAppState.complianceCheckHistory
    };
  }

  async saveWorkProgram(schoolId: string, program: WorkProgram): Promise<void> {
    const { error } = await this.client.from("work_programs").upsert(mapWorkProgramToInsert(schoolId, program));

    if (error) {
      throw toRepositoryError("Не удалось сохранить рабочую программу воспитания", error);
    }
  }

  async saveWorkProgramState(schoolId: string, state: AppState): Promise<void> {
    const { error } = await this.client.from("work_programs").upsert({
      ...mapWorkProgramToInsert(schoolId, state.workProgram),
      data: {
        ...state.workProgram,
        activityDirections: state.activityDirections,
        eventDirectionRelations: state.eventDirectionRelations,
        eventExecutions: state.eventExecutions,
        complianceCheckHistory: state.complianceCheckHistory
      }
    });

    if (error) {
      throw toRepositoryError("Не удалось сохранить историю проверок рабочей программы", error);
    }
  }

  private async getCurrentSchool(): Promise<SchoolRow> {
    const { data, error } = await this.client.from("schools").select("*").order("updated_at", { ascending: false }).limit(1);

    if (error) {
      throw toRepositoryError("Не удалось подключиться к таблице schools", error);
    }

    if (data && data.length > 0) {
      await this.ensureReferenceData(data[0].id);
      return data[0];
    }

    await this.saveState(mockAppState);

    const { data: seeded, error: seededError } = await this.client
      .from("schools")
      .select("*")
      .eq("id", mockAppState.schoolPassport.id)
      .single();

    if (seededError) {
      throw toRepositoryError("Не удалось создать стартовые данные Supabase", seededError);
    }

    return seeded;
  }

  private async ensureReferenceData(schoolId: string) {
    const [{ count: modulesCount }, { count: exportsCount }] = await Promise.all([
      this.client.from("modules").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      Promise.resolve({ count: mockAppState.exportDocuments.length })
    ]);

    if (modulesCount === 0) {
      const { error } = await this.client
        .from("modules")
        .upsert(mockAppState.educationModules.map((module) => mapModuleToInsert(schoolId, module)));

      if (error) {
        throw toRepositoryError("Не удалось создать справочник модулей", error);
      }
    }

    void exportsCount;
  }

  private async replacePartners(schoolId: string, partners: SocialPartner[]) {
    await deleteMissingRows(this.client, "partners", schoolId, partners.map((partner) => partner.id));

    if (partners.length === 0) {
      return;
    }

    const { error } = await this.client
      .from("partners")
      .upsert(partners.map((partner) => mapPartnerToInsert(schoolId, partner)));

    if (error) {
      throw toRepositoryError("Не удалось сохранить социальных партнеров", error);
    }
  }

  private async syncStaff(schoolId: string, state: AppState) {
    const staff = collectStaff(schoolId, state);
    await deleteMissingRows(this.client, "staff", schoolId, staff.map((item) => item.id));

    if (staff.length === 0) {
      return;
    }

    const { error } = await this.client.from("staff").upsert(staff);

    if (error) {
      throw toRepositoryError("Не удалось обновить справочник сотрудников", error);
    }
  }
}

function createSchoolRepository(repository: SupabaseAppRepository): SchoolRepository {
  return {
    getPassport: async () => (await repository.getState()).schoolPassport,
    savePassport: (passport) => repository.savePassport(passport)
  };
}

function createEventRepository(repository: SupabaseAppRepository): EventRepository {
  return {
    list: async () => (await repository.getState()).events,
    saveAll: async (events) => {
      const school = await repository.getState();
      return repository.replaceEvents(school.schoolPassport.id, events);
    },
    upsert: (event) => repository.upsertEvent(event),
    delete: (id) => repository.deleteEvent(id)
  };
}

function createModuleRepository(repository: SupabaseAppRepository): ModuleRepository {
  return {
    list: async () => (await repository.getState()).educationModules,
    saveAll: async (modules) => {
      const school = await repository.getState();
      return repository.replaceModules(school.schoolPassport.id, modules);
    },
    upsert: (module) => repository.upsertModule(module)
  };
}

function createExtracurricularRepository(repository: SupabaseAppRepository): ExtracurricularRepository {
  return {
    list: async () => (await repository.getState()).extraActivities,
    saveAll: async (programs) => {
      const school = await repository.getState();
      return repository.replaceExtraActivities(school.schoolPassport.id, programs);
    },
    upsert: (program) => repository.upsertExtraActivity(program),
    delete: (id) => repository.deleteExtraActivity(id)
  };
}

function mapSchoolRow(row: SchoolRow, partners: PartnerRow[]): SchoolPassport {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    municipality: row.municipality,
    address: row.address,
    principal: row.principal,
    deputyDirector: row.deputy_director,
    academicYear: row.academic_year,
    studentsCount: row.students_count,
    classesCount: row.classes_count,
    infrastructure: normalizeInfrastructure(row.infrastructure),
    socialPartners: partners.map(mapPartnerRow),
    updatedAt: row.updated_at
  };
}

function mapSchoolToInsert(passport: SchoolPassport): SchoolInsert {
  return {
    id: passport.id,
    name: passport.name,
    region: passport.region,
    municipality: passport.municipality,
    address: passport.address,
    principal: passport.principal,
    deputy_director: passport.deputyDirector,
    academic_year: passport.academicYear,
    students_count: passport.studentsCount,
    classes_count: passport.classesCount,
    infrastructure: { ...passport.infrastructure },
    updated_at: new Date().toISOString()
  };
}

function mapPartnerRow(row: PartnerRow): SocialPartner {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    activity: row.activity
  };
}

function mapPartnerToInsert(schoolId: string, partner: SocialPartner): PartnerInsert {
  return {
    id: partner.id,
    school_id: schoolId,
    name: partner.name,
    type: partner.type,
    activity: partner.activity
  };
}

function mapModuleRow(row: ModuleRow): EducationModule {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    active: row.active
  };
}

function mapModuleToInsert(schoolId: string, module: EducationModule): ModuleInsert {
  return {
    id: module.id,
    school_id: schoolId,
    title: module.title,
    description: module.description,
    active: module.active
  };
}

function mapEventRow(row: EventRow): SchoolEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    moduleId: row.module_id,
    direction: row.direction,
    educationLevels: normalizeEducationLevels(row.education_levels),
    classes: row.classes,
    startDate: row.start_date,
    endDate: row.end_date,
    month: row.month,
    venue: row.venue,
    responsible: row.responsible,
    coExecutors: row.co_executors,
    partner: row.partner,
    associationId: row.association_id || "",
    infrastructureObjectId: row.infrastructure_object_id || "",
    systemPartnerId: row.system_partner_id || "",
    sourceDocumentId: row.source_document_id || "",
    sourceDocumentTitle: row.source_document_title || "",
    sourceDocumentType: row.source_document_type ? normalizeImportedDocumentType(row.source_document_type) : undefined,
    status: normalizeEventStatus(row.status),
    participantsCount: row.participants_count,
    shortReport: row.short_report,
    priority: normalizePriority(row.priority)
  };
}

function mapEventToInsert(schoolId: string, event: SchoolEvent): EventInsert {
  return {
    id: event.id,
    school_id: schoolId,
    title: event.title,
    description: event.description,
    module_id: event.moduleId,
    direction: event.direction,
    education_levels: event.educationLevels,
    classes: event.classes,
    start_date: event.startDate,
    end_date: event.endDate,
    month: event.month,
    venue: event.venue,
    responsible: event.responsible,
    co_executors: event.coExecutors,
    partner: event.partner,
    association_id: event.associationId ?? "",
    infrastructure_object_id: event.infrastructureObjectId ?? "",
    system_partner_id: event.systemPartnerId ?? "",
    source_document_id: event.sourceDocumentId ?? "",
    source_document_title: event.sourceDocumentTitle ?? "",
    source_document_type: event.sourceDocumentType ?? "",
    status: event.status,
    participants_count: event.participantsCount,
    short_report: event.shortReport,
    priority: event.priority
  };
}

function mapEducationalAssociationRow(row: EducationalAssociationRow): EducationalAssociation {
  return {
    id: row.id,
    type: normalizeAssociationType(row.type),
    title: row.title,
    description: row.description,
    leader: row.leader,
    participantsCount: row.participants_count,
    classes: row.classes,
    photoUrl: row.photo_url,
    status: normalizeEducationalSystemStatus(row.status)
  };
}

function mapEducationalAssociationToInsert(
  schoolId: string,
  association: EducationalAssociation
): EducationalAssociationInsert {
  return {
    id: association.id,
    school_id: schoolId,
    type: association.type,
    title: association.title,
    description: association.description,
    leader: association.leader,
    participants_count: association.participantsCount,
    classes: association.classes,
    photo_url: association.photoUrl,
    status: association.status
  };
}

function mapSchoolInfrastructureObjectRow(row: SchoolInfrastructureObjectRow): SchoolInfrastructureObject {
  return {
    id: row.id,
    type: normalizeInfrastructureObjectType(row.type),
    title: row.title,
    description: row.description,
    responsible: row.responsible
  };
}

function mapSchoolInfrastructureObjectToInsert(
  schoolId: string,
  object: SchoolInfrastructureObject
): SchoolInfrastructureObjectInsert {
  return {
    id: object.id,
    school_id: schoolId,
    type: object.type,
    title: object.title,
    description: object.description,
    responsible: object.responsible
  };
}

function mapImportedDocumentRow(row: ImportedDocumentRow): ImportedDocument {
  return {
    id: row.id,
    title: row.title,
    type: normalizeImportedDocumentType(row.type),
    uploadedAt: row.uploaded_at,
    sizeBytes: row.size_bytes,
    status: normalizeImportedDocumentStatus(row.status)
  };
}

function mapImportedDocumentToInsert(schoolId: string, document: ImportedDocument): ImportedDocumentInsert {
  return {
    id: document.id,
    school_id: schoolId,
    title: document.title,
    type: document.type,
    uploaded_at: document.uploadedAt,
    size_bytes: document.sizeBytes,
    status: document.status
  };
}

function mapExtractedEventRow(row: ExtractedEventRow): ExtractedEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    month: row.month,
    educationLevel: normalizeEducationLevel(row.education_level),
    module: row.module,
    responsible: row.responsible,
    sourceDocumentId: row.source_document_id,
    sourceType: normalizeImportedDocumentType(row.source_type),
    confidence: row.confidence,
    status: normalizeExtractedEventStatus(row.status)
  };
}

function normalizeProcessedDocument(document: DocumentProcessingRecord): DocumentProcessingRecord {
  return {
    ...document,
    classification: document.classification ?? createUnknownDocumentClassification(document.createdAt),
    extractedEventPreview: migrateDocumentEventPreview(document.extractedEventPreview),
    structuredPreview: migrateDocumentStructuredPreview(document.structuredPreview)
  };
}

function mapExtractedEventToInsert(schoolId: string, event: ExtractedEvent): ExtractedEventInsert {
  return {
    id: event.id,
    school_id: schoolId,
    title: event.title,
    description: event.description,
    date: event.date,
    month: event.month,
    education_level: event.educationLevel,
    module: event.module,
    responsible: event.responsible,
    source_document_id: event.sourceDocumentId,
    source_type: event.sourceType,
    confidence: event.confidence,
    status: event.status
  };
}

function mapEducationalSystemPartnerRow(row: EducationalSystemPartnerRow): EducationalSystemPartner {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    cooperationDescription: row.cooperation_description,
    contactPerson: row.contact_person
  };
}

function mapEducationalSystemPartnerToInsert(
  schoolId: string,
  partner: EducationalSystemPartner
): EducationalSystemPartnerInsert {
  return {
    id: partner.id,
    school_id: schoolId,
    title: partner.title,
    type: partner.type,
    cooperation_description: partner.cooperationDescription,
    contact_person: partner.contactPerson
  };
}

function mapNormativeDocumentRow(row: NormativeDocumentRow): NormativeDocument {
  return {
    id: row.id,
    title: row.title,
    category: normalizeNormativeDocumentCategory(row.category),
    level: normalizeNormativeDocumentLevel(row.level),
    documentDate: row.document_date,
    version: row.version,
    source: row.source,
    actualityStatus: normalizeNormativeDocumentActualityStatus(row.actuality_status),
    uploadedAt: row.uploaded_at,
    fileName: row.file_name,
    fileType: row.file_type,
    sizeBytes: row.size_bytes,
    requirements: Array.isArray(row.requirements) ? (row.requirements as NormativeRequirement[]) : []
  };
}

function mapNormativeDocumentToInsert(schoolId: string, document: NormativeDocument): NormativeDocumentInsert {
  return {
    id: document.id,
    school_id: schoolId,
    title: document.title,
    category: document.category,
    level: document.level,
    document_date: document.documentDate,
    version: document.version,
    source: document.source,
    actuality_status: document.actualityStatus,
    uploaded_at: document.uploadedAt,
    file_name: document.fileName,
    file_type: document.fileType,
    size_bytes: document.sizeBytes,
    requirements: document.requirements
  };
}

function normalizeWorkProgram(row: WorkProgramRow, state: AppState): WorkProgram {
  const data = row.data as Partial<WorkProgram> | null;
  const generated = createEmptyWorkProgram(state);

  if (
    !data?.schoolCulture ||
    !Array.isArray(data.versions) ||
    !data.progress ||
    !Array.isArray(data.sections) ||
    !data.sections.every((section) => Array.isArray(section.subsections))
  ) {
    return generated;
  }

  return {
    ...generated,
    ...data,
    academicYear: data.academicYear ?? state.schoolPassport.academicYear,
    progress: data.progress ?? generated.progress,
    sections: data.sections ?? generated.sections,
    sectionVersions: data.sectionVersions ?? generated.sectionVersions,
    updatedAt: row.updated_at ?? data.updatedAt ?? new Date().toISOString()
  };
}

function mapWorkProgramToInsert(schoolId: string, program: WorkProgram): WorkProgramInsert {
  return {
    id: program.id,
    school_id: schoolId,
    data: program,
    updated_at: new Date().toISOString()
  };
}

function mapExtraActivityRow(row: ExtracurricularProgramRow): ExtraActivity {
  return {
    id: row.id,
    title: row.title,
    type: normalizeExtraActivityType(row.type),
    area: row.area,
    educationLevels: normalizeEducationLevels(row.education_levels),
    classes: row.classes,
    teacher: row.teacher,
    classroom: row.classroom,
    schedule: row.schedule,
    weeklyHours: row.weekly_hours,
    totalHours: row.total_hours,
    studentsCount: row.students_count,
    status: normalizeExtraActivityStatus(row.status)
  };
}

function mapExtraActivityToInsert(schoolId: string, program: ExtraActivity): ExtracurricularProgramInsert {
  return {
    id: program.id,
    school_id: schoolId,
    title: program.title,
    type: program.type,
    area: program.area,
    education_levels: program.educationLevels,
    classes: program.classes,
    teacher: program.teacher,
    classroom: program.classroom,
    schedule: program.schedule,
    weekly_hours: program.weeklyHours,
    total_hours: program.totalHours,
    students_count: program.studentsCount,
    status: program.status
  };
}

function normalizeInfrastructure(value: Record<string, boolean>): SchoolInfrastructure {
  return {
    ...mockAppState.schoolPassport.infrastructure,
    ...value
  };
}

function normalizeEducationLevels(value: string[]): EducationLevel[] {
  const allowed = new Set<EducationLevel>(["noo", "ooo", "soo"]);
  const levels = value.filter((item): item is EducationLevel => allowed.has(item as EducationLevel));

  return levels.length > 0 ? levels : ["ooo"];
}

function normalizeEducationLevel(value: string): EducationLevel {
  return value === "noo" || value === "soo" ? value : "ooo";
}

function normalizeEventStatus(value: string): EventStatus {
  return value === "completed" || value === "cancelled" ? value : "planned";
}

function normalizePriority(value: string): Priority {
  return value === "low" || value === "high" ? value : "medium";
}

function normalizeAssociationType(value: string): EducationalAssociationType {
  const allowed = new Set<EducationalAssociationType>([
    "volunteer_team",
    "school_museum",
    "theater",
    "media_center",
    "yuid",
    "yunarmiya",
    "eaglets_of_russia",
    "first_movement",
    "sports_club",
    "custom"
  ]);

  return allowed.has(value as EducationalAssociationType) ? (value as EducationalAssociationType) : "custom";
}

function normalizeInfrastructureObjectType(value: string): InfrastructureObjectType {
  const allowed = new Set<InfrastructureObjectType>([
    "museum",
    "media_center",
    "assembly_hall",
    "gym",
    "library",
    "child_initiatives_center",
    "museum_room",
    "subject_classrooms"
  ]);

  return allowed.has(value as InfrastructureObjectType) ? (value as InfrastructureObjectType) : "subject_classrooms";
}

function normalizeEducationalSystemStatus(value: string): EducationalSystemStatus {
  return value === "inactive" ? "inactive" : "active";
}

function normalizeImportedDocumentType(value: string): ImportedDocumentType {
  if (value === "pdf" || value === "xlsx") {
    return value;
  }

  return "docx";
}

function normalizeImportedDocumentStatus(value: string): ImportedDocumentStatus {
  if (value === "pending" || value === "processed" || value === "error") {
    return value;
  }

  return "uploaded";
}

function normalizeExtractedEventStatus(value: string): ExtractedEventStatus {
  if (value === "selected" || value === "ignored") {
    return value;
  }

  return "found";
}

function normalizeExtraActivityType(value: string): ExtraActivityType {
  return value === "additional_education" ? "additional_education" : "extracurricular";
}

function normalizeExtraActivityStatus(value: string): ExtraActivityStatus {
  return value === "inactive" ? "inactive" : "active";
}

function normalizeNormativeDocumentCategory(value: string): NormativeDocumentCategory {
  if (
    value === "federal_work_program" ||
    value === "federal_calendar_plan" ||
    value === "regional_document" ||
    value === "municipal_document" ||
    value === "local_school_document"
  ) {
    return value;
  }

  return "local_school_document";
}

function normalizeNormativeDocumentLevel(value: string): NormativeDocumentLevel {
  if (value === "federal" || value === "regional" || value === "municipal" || value === "local") {
    return value;
  }

  return "local";
}

function normalizeNormativeDocumentActualityStatus(value: string): NormativeDocumentActualityStatus {
  if (value === "current" || value === "outdated") {
    return value;
  }

  return "needs_review";
}

function collectStaff(schoolId: string, state: AppState): StaffInsert[] {
  const staffByName = new Map<string, StaffInsert>();
  const addStaff = (fullName: string, role: string) => {
    const name = fullName.trim();

    if (!name) {
      return;
    }

    const key = name.toLowerCase();
    const current = staffByName.get(key);

    staffByName.set(key, {
      id: current?.id ?? createId("staff"),
      school_id: schoolId,
      full_name: name,
      role: current ? `${current.role}; ${role}` : role
    });
  };

  addStaff(state.schoolPassport.principal, "director");
  addStaff(state.schoolPassport.deputyDirector, "deputy_director");
  state.events.forEach((event) => {
    addStaff(event.responsible, "event_responsible");
    event.coExecutors.split(",").forEach((executor) => addStaff(executor, "event_co_executor"));
  });
  state.extraActivities.forEach((program) => addStaff(program.teacher, "teacher"));

  return Array.from(staffByName.values());
}

async function deleteMissingRows(
  client: SupabaseBrowserClient,
  table:
    | "events"
    | "extracurricular_programs"
    | "modules"
    | "partners"
    | "staff"
    | "educational_associations"
    | "school_infrastructure_objects"
    | "educational_system_partners"
    | "imported_documents"
    | "extracted_events"
    | "normative_documents",
  schoolId: string,
  nextIds: string[]
) {
  const { data, error } = await client.from(table).select("id").eq("school_id", schoolId);

  if (error) {
    throw toRepositoryError(`Не удалось проверить таблицу ${table}`, error);
  }

  const nextIdSet = new Set(nextIds);
  const idsToDelete = (data ?? []).map((row) => row.id).filter((id) => !nextIdSet.has(id));

  await Promise.all(
    idsToDelete.map(async (id) => {
      const { error: deleteError } = await client.from(table).delete().eq("id", id);

      if (deleteError) {
        throw toRepositoryError(`Не удалось удалить запись из таблицы ${table}`, deleteError);
      }
    })
  );
}

function toRepositoryError(message: string, error: { message?: string }) {
  return new Error(`${message}: ${error.message ?? "неизвестная ошибка Supabase"}`);
}
