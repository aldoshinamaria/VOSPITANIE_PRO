"use client";

import { Download, FileText, Printer, RotateCcw, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createActivityReportBuilder,
  createActivityReportExporter,
  getActivityReportDocxFileName
} from "@/lib/domain/activity-reports";
import { monthLabels } from "@/lib/utils";
import type { ActivityReportExportOptions, ActivityReportFilter, ActivityReportPeriodMode, ActivityReportRiskLevel } from "@/types/domain";

const periodModeLabels: Record<ActivityReportPeriodMode, string> = {
  month: "За месяц",
  quarter: "За четверть",
  halfYear: "За полугодие",
  academicYear: "За учебный год",
  custom: "Произвольный период"
};

const riskColors: Record<ActivityReportRiskLevel, string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-700"
};

const riskLabels: Record<ActivityReportRiskLevel, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий"
};

const exportOptions: ActivityReportExportOptions = {
  includeKpi: true,
  includeRisks: true,
  includeInsights: true,
  includeRecommendations: true,
  includeEvents: true
};

export default function ActivityReportsPage() {
  const { state } = useAppState();
  const activeDirections = state.activityDirections.filter((direction) => direction.active);
  const [filter, setFilter] = React.useState<ActivityReportFilter>({
    directionId: "all",
    periodMode: "academicYear",
    month: 9,
    quarter: 1,
    halfYear: 1
  });
  const [pendingExport, setPendingExport] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const builder = React.useMemo(() => createActivityReportBuilder(), []);
  const exporter = React.useMemo(() => createActivityReportExporter(), []);
  const report = React.useMemo(
    () => builder.build({ state, filter }),
    [builder, filter, state]
  );
  const highRisks = report.risks.filter((risk) => risk.level === "high").length;

  async function downloadDocx() {
    setPendingExport(true);
    setError(null);

    try {
      const blob = await exporter.toDocx(report, exportOptions);
      downloadBlob(blob, getActivityReportDocxFileName(report));
    } catch {
      setError("Не удалось сформировать DOCX-отчет. Проверьте данные и повторите экспорт.");
    } finally {
      setPendingExport(false);
    }
  }

  function resetFilter() {
    setFilter({
      directionId: "all",
      periodMode: "academicYear",
      month: 9,
      quarter: 1,
      halfYear: 1,
      startDate: "",
      endDate: ""
    });
  }

  return (
    <>
      <PageHeader
        title="Отчеты"
        description="Аналитический центр заместителя директора: выполнение, охват, риски, выводы и рекомендации по воспитательной работе."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              PDF / печать
            </Button>
            <Button onClick={downloadDocx} disabled={pendingExport}>
              <Download className="h-4 w-4" />
              {pendingExport ? "Формируется..." : "Скачать DOCX"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Мероприятий" value={report.statistics.totalEvents} icon={FileText} />
        <MetricCard title="Выполнение" value={`${report.statistics.planCompletionPercent}%`} icon={TrendingUp} />
        <MetricCard title="Охват классов" value={`${report.statistics.classCoveragePercent}%`} icon={Sparkles} />
        <MetricCard title="Высоких рисков" value={highRisks} icon={ShieldAlert} />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Параметры отчета</CardTitle>
              <CardDescription>Отчет строится из единого реестра мероприятий и не создает дублей данных.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium">
                Вид отчета
                <Select value={filter.directionId} onChange={(event) => setFilter((current) => ({ ...current, directionId: event.target.value }))}>
                  <option value="all">Общий отчет заместителя директора</option>
                  {activeDirections.map((direction) => (
                    <option key={direction.id} value={direction.id}>
                      {direction.title}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Период
                <Select value={filter.periodMode} onChange={(event) => setFilter((current) => ({ ...current, periodMode: event.target.value as ActivityReportPeriodMode }))}>
                  {Object.entries(periodModeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              {filter.periodMode === "month" ? (
                <label className="grid gap-2 text-sm font-medium">
                  Месяц
                  <Select value={String(filter.month ?? 9)} onChange={(event) => setFilter((current) => ({ ...current, month: Number(event.target.value) }))}>
                    {Object.entries(monthLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
              ) : null}
              {filter.periodMode === "quarter" ? (
                <label className="grid gap-2 text-sm font-medium">
                  Четверть
                  <Select value={String(filter.quarter ?? 1)} onChange={(event) => setFilter((current) => ({ ...current, quarter: Number(event.target.value) as 1 | 2 | 3 | 4 }))}>
                    <option value="1">I четверть</option>
                    <option value="2">II четверть</option>
                    <option value="3">III четверть</option>
                    <option value="4">IV четверть</option>
                  </Select>
                </label>
              ) : null}
              {filter.periodMode === "halfYear" ? (
                <label className="grid gap-2 text-sm font-medium">
                  Полугодие
                  <Select value={String(filter.halfYear ?? 1)} onChange={(event) => setFilter((current) => ({ ...current, halfYear: Number(event.target.value) as 1 | 2 }))}>
                    <option value="1">I полугодие</option>
                    <option value="2">II полугодие</option>
                  </Select>
                </label>
              ) : null}
              {filter.periodMode === "custom" ? (
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm font-medium">
                    Дата начала
                    <input
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      type="date"
                      value={filter.startDate ?? ""}
                      onChange={(event) => setFilter((current) => ({ ...current, startDate: event.target.value }))}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Дата окончания
                    <input
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      type="date"
                      value={filter.endDate ?? ""}
                      onChange={(event) => setFilter((current) => ({ ...current, endDate: event.target.value }))}
                    />
                  </label>
                </div>
              ) : null}
              <Button variant="outline" onClick={resetFilter}>
                <RotateCcw className="h-4 w-4" />
                Сбросить
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>KPI-блок</CardTitle>
              <CardDescription>Автоматические показатели по выбранному отчету.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <KpiLine label="Проведено" value={report.statistics.completedEvents} />
              <KpiLine label="Отменено" value={report.statistics.cancelledEvents} />
              <KpiLine label="Просрочено" value={report.statistics.overdueEvents} />
              <KpiLine label="Охват обучающихся" value={report.statistics.studentCoverage} />
              <KpiLine label="Охват направлений" value={`${report.statistics.directionCoveragePercent}%`} />
              <KpiLine label="Подтверждено" value={`${report.statistics.confirmedExecutionPercent}%`} />
              <KpiLine label="Просрочка" value={`${report.statistics.overdueExecutionPercent}%`} />
              <KpiLine label="Без ответственного" value={`${report.statistics.withoutResponsiblePercent}%`} />
              <KpiLine label="Среднее на класс" value={report.statistics.averageEventsPerClass} />
              <KpiLine label="Среднее на направление" value={report.statistics.averageEventsPerDirection} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{periodModeLabels[filter.periodMode]} · {report.academicYear} учебный год</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <SummaryBox title="Что сделано" value={`${report.statistics.completedEvents} мероприятий`} />
                <SummaryBox title="Что не сделано" value={`${report.statistics.plannedEvents + report.statistics.overdueEvents} мероприятий`} />
                <SummaryBox title="Проблемные зоны" value={`${report.risks.length} рисков`} />
              </div>

              <div className="grid gap-3">
                <SectionTitle title="Автоматические выводы" />
                {report.insights.map((insight) => (
                  <div key={insight.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{insight.title}</div>
                      <Badge variant="secondary">{insight.type}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{insight.text}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <SectionTitle title="Риски перед проверкой" />
                {report.risks.length === 0 ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    Критичных рисков не найдено.
                  </div>
                ) : (
                  report.risks.slice(0, 8).map((risk) => (
                    <div key={risk.id} className={`rounded-md border p-3 ${riskColors[risk.level]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{risk.title}</div>
                        <Badge variant="outline">{riskLabels[risk.level]}</Badge>
                      </div>
                      <div className="mt-2 text-sm">Причина: {risk.reason}</div>
                      <div className="mt-1 text-sm font-medium">Рекомендация: {risk.recommendation}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-3">
                <SectionTitle title="ТОП рекомендаций" />
                {report.recommendations.map((recommendation, index) => (
                  <div key={recommendation.id} className="rounded-md border p-3 text-sm">
                    <span className="font-semibold">{index + 1}. </span>
                    {recommendation.text}
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <SectionTitle title="Мероприятия отчета" />
                {report.sections.every((section) => section.rows.length === 0) ? (
                  <EmptyState icon={FileText} title="Мероприятия не найдены" description="Измените период или направление отчета." />
                ) : (
                  report.sections.map((section) => (
                    <div key={section.id} className="overflow-hidden rounded-md border">
                      <div className="border-b bg-slate-50 px-4 py-3">
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-muted-foreground">{section.description}</div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Мероприятие</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead>Классы</TableHead>
                            <TableHead>Ответственный</TableHead>
                            <TableHead>Участники</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.rows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="font-medium">{row.title}</TableCell>
                              <TableCell>{row.date}</TableCell>
                              <TableCell>{row.classes}</TableCell>
                              <TableCell>{row.responsible}</TableCell>
                              <TableCell>{row.participantsCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function KpiLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-semibold uppercase tracking-normal text-slate-600">{title}</div>;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
