"use client";

import { Download, FileArchive, Printer, Search } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  InspectionExporter,
  createInspectionCenter,
  getInspectionPackageDocxFileName,
  inspectionScenarios
} from "@/lib/domain/inspection-center";
import type { InspectionScenarioId } from "@/types/domain";

export default function DocumentPackagesPage() {
  const { state } = useAppState();
  const initialScenario = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("scenario") : null;
  const [scenarioId, setScenarioId] = React.useState<InspectionScenarioId>((initialScenario as InspectionScenarioId) || "school-self-audit");
  const [showSources, setShowSources] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const center = React.useMemo(() => createInspectionCenter(), []);
  const pack = React.useMemo(() => center.buildPackage(state, scenarioId), [center, scenarioId, state]);
  const totalItems = pack.sections.reduce((sum, section) => sum + section.items.length, 0);
  const readyItems = pack.sections.reduce((sum, section) => sum + section.items.filter((item) => item.status === "ready").length, 0);

  async function downloadDocx() {
    setPending(true);
    setError(null);

    try {
      const blob = await new InspectionExporter().toDocx(pack);
      downloadBlob(blob, getInspectionPackageDocxFileName(pack));
    } catch {
      setError("Не удалось сформировать DOCX-пакет. Проверьте данные и повторите экспорт.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Пакеты документов"
        description="Автоматическая сборка пакета проверки из планов, отчетов, матрицы, рисков и подтверждающих данных."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              PDF / печать
            </Button>
            <Button onClick={downloadDocx} disabled={pending}>
              <Download className="h-4 w-4" />
              {pending ? "Формируется..." : "Скачать DOCX"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Готовность" value={`${pack.readiness.score}%`} icon={FileArchive} />
        <MetricCard title="Разделов" value={pack.sections.length} icon={FileArchive} />
        <MetricCard title="Элементов" value={`${readyItems}/${totalItems}`} icon={FileArchive} />
        <MetricCard title="Источников" value={pack.evidence.length} icon={Search} />
      </div>

      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Параметры пакета</CardTitle>
            <CardDescription>Пакет пересобирается из текущих данных системы.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Select value={scenarioId} onChange={(event) => setScenarioId(event.target.value as InspectionScenarioId)}>
              {inspectionScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => setShowSources((current) => !current)}>
              {showSources ? "Скрыть источники" : "Показать источники данных"}
            </Button>
            <div className="rounded-md border bg-slate-50 p-3 text-sm">
              <div className="font-medium">{pack.scenario.title}</div>
              <div className="mt-1 text-muted-foreground">{pack.scenario.description}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{pack.title}</CardTitle>
                  <CardDescription>Готовность: {pack.readiness.score}% · {pack.readiness.label}</CardDescription>
                </div>
                <Badge variant="outline">{pack.scenario.id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {pack.sections.map((section) => (
                <div key={section.id} className="overflow-hidden rounded-md border">
                  <div className="border-b bg-slate-50 px-4 py-3 font-semibold">{section.title}</div>
                  <div className="grid gap-2 p-4">
                    {section.items.map((item) => (
                      <div key={item.id} className="rounded-md border p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                          <Badge variant={item.status === "ready" ? "default" : "outline"}>{statusLabel(item.status)}</Badge>
                        </div>
                        {showSources ? (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Источник: {item.sourceType} · {item.sourceId}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {showSources ? (
            <Card>
              <CardHeader>
                <CardTitle>Трассировка источников</CardTitle>
                <CardDescription>Из каких мероприятий, отчетов, планов и направлений собран пакет.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {pack.evidence.map((evidence) => (
                  <div key={evidence.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{evidence.title}</div>
                    <div className="mt-1 text-muted-foreground">{evidence.description}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{evidence.sourceType} · {evidence.sourceId}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function statusLabel(status: string) {
  if (status === "ready") return "Готово";
  if (status === "needs_work") return "Требует доработки";
  return "Отсутствует";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
