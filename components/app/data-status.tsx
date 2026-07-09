"use client";

import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataStatus() {
  const { isLoading, isSaving, error, clearError } = useAppState();

  if (!isLoading && !isSaving && !error) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-5 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm",
        error ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-700 shadow-sm"
      )}
      role={error ? "alert" : "status"}
    >
      <div className="flex min-w-0 items-start gap-3">
        {error ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
        ) : isLoading || isSaving ? (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-500" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        )}
        <div>
          <div className="font-medium">
            {error ? "Ошибка сохранения" : isLoading ? "Загрузка данных из браузера" : "Сохранение в браузере"}
          </div>
          <div className={cn("mt-1", error ? "text-red-800" : "text-slate-500")}>
            {error ?? "Данные сохраняются в хранилище этого браузера. Можно продолжать работу после завершения операции."}
          </div>
        </div>
      </div>
      {error ? (
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearError}>
          <X className="h-4 w-4" />
          <span className="sr-only">Закрыть ошибку</span>
        </Button>
      ) : null}
    </div>
  );
}
