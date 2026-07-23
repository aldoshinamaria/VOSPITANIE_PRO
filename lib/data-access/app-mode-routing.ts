import type { AppMode } from "@/types/app-mode";

const WORK_ENTRY_ROUTES = new Set(["", "/", "/work", "/login"]);

export function resolveAppMode(pathname: string | null, storedMode: string | null): AppMode {
  if (pathname?.startsWith("/demo")) {
    return "demo";
  }

  if (WORK_ENTRY_ROUTES.has(pathname ?? "")) {
    return "work";
  }

  return storedMode === "demo" ? "demo" : "work";
}
