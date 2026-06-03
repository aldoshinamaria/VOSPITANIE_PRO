import type { AppState } from "@/types/app-state";
import type { EducationModule } from "@/types/modules";
import type { ExtraActivity } from "@/types/extra-activities";
import type { SchoolEvent } from "@/types/events";
import type { SchoolPassport } from "@/types/school";

export type RepositoryResult<T> = T | Promise<T>;

export interface SchoolRepository {
  getPassport(): RepositoryResult<SchoolPassport>;
  savePassport(passport: SchoolPassport): RepositoryResult<SchoolPassport>;
}

export interface EventRepository {
  list(): RepositoryResult<SchoolEvent[]>;
  saveAll(events: SchoolEvent[]): RepositoryResult<SchoolEvent[]>;
  upsert(event: SchoolEvent): RepositoryResult<SchoolEvent>;
  delete(id: string): RepositoryResult<void>;
}

export interface ModuleRepository {
  list(): RepositoryResult<EducationModule[]>;
  saveAll(modules: EducationModule[]): RepositoryResult<EducationModule[]>;
  upsert(module: EducationModule): RepositoryResult<EducationModule>;
}

export interface ExtracurricularRepository {
  list(): RepositoryResult<ExtraActivity[]>;
  saveAll(programs: ExtraActivity[]): RepositoryResult<ExtraActivity[]>;
  upsert(program: ExtraActivity): RepositoryResult<ExtraActivity>;
  delete(id: string): RepositoryResult<void>;
}

export interface AppDataAccess {
  getState(): RepositoryResult<AppState>;
  saveState(state: AppState): RepositoryResult<void>;
  reset(): RepositoryResult<AppState>;
  school: SchoolRepository;
  events: EventRepository;
  modules: ModuleRepository;
  extracurricular: ExtracurricularRepository;
}
