import { createAppRepository, type AppRepository } from "@/lib/data-access/app-repository";
import type {
  AppDataAccess,
  EventRepository,
  ExtracurricularRepository,
  ModuleRepository,
  SchoolRepository
} from "@/lib/data-access/repository-contracts";
import type { AppState } from "@/types/app-state";

export function createLocalStorageDataAccess(repository: AppRepository = createAppRepository()): AppDataAccess {
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

function createSchoolRepository(repository: AppRepository): SchoolRepository {
  return {
    getPassport: () => repository.getState().schoolPassport,
    savePassport: (passport) => {
      savePartial(repository, { schoolPassport: passport });
      return passport;
    }
  };
}

function createEventRepository(repository: AppRepository): EventRepository {
  return {
    list: () => repository.getState().events,
    saveAll: (events) => {
      savePartial(repository, { events });
      return events;
    },
    upsert: (event) => {
      const state = repository.getState();
      const exists = state.events.some((item) => item.id === event.id);
      savePartial(repository, {
        events: exists ? state.events.map((item) => (item.id === event.id ? event : item)) : [event, ...state.events]
      });
      return event;
    },
    delete: (id) => {
      const state = repository.getState();
      savePartial(repository, { events: state.events.filter((event) => event.id !== id) });
    }
  };
}

function createModuleRepository(repository: AppRepository): ModuleRepository {
  return {
    list: () => repository.getState().educationModules,
    saveAll: (modules) => {
      savePartial(repository, { educationModules: modules });
      return modules;
    },
    upsert: (module) => {
      const state = repository.getState();
      const exists = state.educationModules.some((item) => item.id === module.id);
      savePartial(repository, {
        educationModules: exists
          ? state.educationModules.map((item) => (item.id === module.id ? module : item))
          : [module, ...state.educationModules]
      });
      return module;
    }
  };
}

function createExtracurricularRepository(repository: AppRepository): ExtracurricularRepository {
  return {
    list: () => repository.getState().extraActivities,
    saveAll: (programs) => {
      savePartial(repository, { extraActivities: programs });
      return programs;
    },
    upsert: (program) => {
      const state = repository.getState();
      const exists = state.extraActivities.some((item) => item.id === program.id);
      savePartial(repository, {
        extraActivities: exists
          ? state.extraActivities.map((item) => (item.id === program.id ? program : item))
          : [program, ...state.extraActivities]
      });
      return program;
    },
    delete: (id) => {
      const state = repository.getState();
      savePartial(repository, { extraActivities: state.extraActivities.filter((program) => program.id !== id) });
    }
  };
}

function savePartial(repository: AppRepository, patch: Partial<AppState>) {
  repository.saveState({
    ...repository.getState(),
    ...patch
  });
}
