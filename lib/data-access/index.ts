export { createLocalStorageDataAccess } from "@/lib/data-access/local-storage-repositories";
export { createSupabaseDataAccess } from "@/lib/data-access/supabase-repositories";
export type {
  AppDataAccess,
  EventRepository,
  ExtracurricularRepository,
  ModuleRepository,
  RepositoryResult,
  SchoolRepository
} from "@/lib/data-access/repository-contracts";
