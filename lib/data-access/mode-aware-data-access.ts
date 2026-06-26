import { createLocalStorageDataAccess } from "@/lib/data-access/local-storage-repositories";
import { createNamespacedAppRepository } from "@/lib/data-access/app-repository";
import { DEMO_STATE_STORAGE_KEY, WORK_STATE_STORAGE_KEY } from "@/lib/data-access/storage-keys";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";
import { createEmptySchoolState } from "@/lib/domain/empty-school-state";
import type { AppDataAccess } from "@/lib/data-access/repository-contracts";
import type { AppMode } from "@/types/app-mode";
import type { AppState } from "@/types/domain";

export function createModeAwareDataAccess(mode: AppMode, fallbackState?: AppState): AppDataAccess {
  const storageKey = mode === "demo" ? DEMO_STATE_STORAGE_KEY : WORK_STATE_STORAGE_KEY;
  const fallback = fallbackState ?? createEmptySchoolState();
  const modeFallback = mode === "demo" ? createDemoSchoolFactory().createDemoSchool("urban") : fallback;

  return createLocalStorageDataAccess(createNamespacedAppRepository(storageKey, modeFallback));
}
