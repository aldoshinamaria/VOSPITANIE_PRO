"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, FileArchive, ShieldCheck } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { createInspectionCenter, inspectionScenarios } from "@/lib/domain/inspection-center";
import type { InspectionRiskLevel, InspectionScenarioId } from "@/types/domain";

const riskColors: Record<InspectionRiskLevel, string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-700"
};

const riskLabels: Record<InspectionRiskLevel, string> = {
  high: "Высокий риск",
  medium: "Средний риск",
  low: "Низкий риск"
};

export default function InspectionCenterPage() {
  const { state } = useAppState();
  const [scenarioId, setScenarioId] = React.useState<InspectionScenarioId>("school-self-audit");
  const center = React.useMemo(() => createInspectionCenter(), []);
  const pack = React.useMemo(() => center.buildPackage(state, scenarioId), [center, scenarioId, state]);
  const readiness = pack.readiness;
  const highRisks = readiness.risks.filter((risk) => risk.level === "high").length;

  return (
    <>
      <PageHeader
        title="Центр проверок"
        description="Подготовка школы к проверкам: готовность, отсутствующие документы, неподтвержденные мероприятия, риски и срочные действия."
        actions={
          <Button asChild>
            <a href={`/document-packages?scenario=${scenarioId}`}>
              <FileArchive className="h-4 w-4" />
              Открыть пакет
            </a>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Готовность" value={`${readiness.score}%`} icon={ShieldCheck} />
        <MetricCard title="Готово" value={readiness.checklist.ready.length} icon={CheckCircle2} />
        <MetricCard title="Требует доработки" value={readiness.checklist.needsWork.length} icon={ClipboardList} />
        <MetricCard title="Высоких рисков" value={highRisks} icon={AlertTriangle} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Тип проверки</CardTitle>
            <CardDescription>Сценарии расширяются без создания отдельных сущностей пакетов.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Select value={scenarioId} onChange={(event) => setScenarioId(event.target.value as InspectionScenarioId)}>
              {inspectionScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </Select>
            <div className="rounded-md border bg-slate-50 p-3 text-sm text-muted-foreground">
              {pack.scenario.description}
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm font-semibold">Что требуется</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pack.scenario.requiredDocuments.map((document) => (
                  <Badge key={document} variant="secondary">
                    {document}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Готовность к проверке: {readiness.label}</CardTitle>
                  <CardDescription>{pack.scenario.title}</CardDescription>
                </div>
                <Badge variant="outline">{readiness.score}%</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ChecklistBlock title="Готово" items={readiness.checklist.ready.map((item) => item.title)} tone="green" />
              <ChecklistBlock title="Требует доработки" items={readiness.checklist.needsWork.map((item) => item.title)} tone="amber" />
              <ChecklistBlock title="Отсутствует" items={readiness.checklist.missing.map((item) => item.title)} tone="red" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Пробелы</CardTitle>
              <CardDescription>Что отсутствует, не заполнено, не подтверждено или требует исправления.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {readiness.gaps.length === 0 ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Пробелов не найдено.</div>
              ) : (
                readiness.gaps.map((gap) => (
                  <div key={gap.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{gap.title}</div>
                      <div className="text-sm text-muted-foreground">{gap.description}</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={gap.fixUrl}>Исправить</a>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Риски</CardTitle>
              <CardDescription>Автоматические риски перед проверкой.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {readiness.risks.map((risk) => (
                <div key={risk.id} className={`rounded-md border p-3 ${riskColors[risk.level]}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{risk.title}</div>
                    <Badge variant="outline">{riskLabels[risk.level]}</Badge>
                  </div>
                  <div className="mt-2 text-sm">Причина: {risk.reason}</div>
                  <div className="mt-1 text-sm font-medium">Рекомендация: {risk.recommendation}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Что исправить прямо сейчас</CardTitle>
              <CardDescription>Система формирует список действий по приоритету.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {readiness.recommendations.map((recommendation, index) => (
                <div key={recommendation.id} className="rounded-md border p-3 text-sm">
                  <span className="font-semibold">{index + 1}. </span>
                  {recommendation.text}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function ChecklistBlock({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" | "red" }) {
  const toneClass = tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="text-sm font-semibold">{title}</div>
      {items.length === 0 ? (
        <div className="mt-1 text-sm text-muted-foreground">Нет элементов.</div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
