import type { AppMode } from "@/types/app-mode";

export const APP_MODE_STORAGE_KEY = "vospitanie-pro:mode";
export const DEMO_STATE_STORAGE_KEY = "vospitanie-pro:demo-state";
export const WORK_STATE_STORAGE_KEY = "vospitanie-pro:work-state";
export const DEMO_LOADED_AT_STORAGE_KEY = "vospitanie-pro:demo-loaded-at";
export const WORK_BACKUP_STORAGE_KEY = "vospitanie-pro:work-backup";

export function getStateStorageKey(mode: AppMode) {
  return mode === "demo" ? DEMO_STATE_STORAGE_KEY : WORK_STATE_STORAGE_KEY;
}

