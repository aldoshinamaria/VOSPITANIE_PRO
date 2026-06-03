import type { EducationModule } from "@/types/domain";

export const DEFAULT_MODULE_ID = "module-osnovnye-shkolnye-dela";

export function findModuleById(modules: EducationModule[], moduleId: string) {
  return modules.find((educationModule) => educationModule.id === moduleId);
}

export function findModuleIdByTitle(modules: EducationModule[], title?: string) {
  const normalizedTitle = title?.trim().toLowerCase();

  if (!normalizedTitle) {
    return DEFAULT_MODULE_ID;
  }

  return modules.find((educationModule) => educationModule.title.toLowerCase() === normalizedTitle)?.id ?? DEFAULT_MODULE_ID;
}

export function getModuleTitle(modules: EducationModule[], moduleId: string, fallback = "Модуль не выбран") {
  return findModuleById(modules, moduleId)?.title ?? fallback;
}
