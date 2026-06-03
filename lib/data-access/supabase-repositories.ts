import { mockAppState } from "@/data/mock-data";
import type {
  EventInsert,
  EventRow,
  ExtracurricularProgramInsert,
  ExtracurricularProgramRow,
  ModuleInsert,
  ModuleRow,
  PartnerInsert,
  PartnerRow,
  SchoolInsert,
  SchoolRow,
  StaffInsert,
  SupabaseBrowserClient
} from "@/lib/supabase/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createId } from "@/lib/utils";
import type { AppState } from "@/types/app-state";
import type { EducationLevel, Priority } from "@/types/common";
import type { EventStatus, SchoolEvent } from "@/types/events";
import type { ExtraActivity, ExtraActivityStatus, ExtraActivityType } from "@/types/extra-activities";
import type { EducationModule } from "@/types/modules";
import type { SchoolInfrastructure, SchoolPassport, SocialPartner } from "@/types/school";
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

    return {
      schoolPassport: await this.getPassport(school.id),
      educationModules: await this.listModules(school.id),
      events: await this.listEvents(school.id),
      kpvr: mockAppState.kpvr,
      extraActivities: await this.listExtraActivities(school.id),
      exportDocuments: mockAppState.exportDocuments
    };
  }

  async saveState(state: AppState): Promise<void> {
    const school = await this.savePassport(state.schoolPassport);

    await Promise.all([
      this.replaceModules(school.id, state.educationModules),
      this.replaceEvents(school.id, state.events),
      this.replaceExtraActivities(school.id, state.extraActivities),
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
    status: event.status,
    participants_count: event.participantsCount,
    short_report: event.shortReport,
    priority: event.priority
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

function normalizeEventStatus(value: string): EventStatus {
  return value === "completed" || value === "cancelled" ? value : "planned";
}

function normalizePriority(value: string): Priority {
  return value === "low" || value === "high" ? value : "medium";
}

function normalizeExtraActivityType(value: string): ExtraActivityType {
  return value === "additional_education" ? "additional_education" : "extracurricular";
}

function normalizeExtraActivityStatus(value: string): ExtraActivityStatus {
  return value === "inactive" ? "inactive" : "active";
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
  table: "events" | "extracurricular_programs" | "modules" | "partners" | "staff",
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
