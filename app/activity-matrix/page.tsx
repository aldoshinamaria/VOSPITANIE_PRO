"use client";

import { AlertTriangle, BarChart3, CheckCircle2, Grid3X3, ListChecks, RotateCcw } from "lucide-react";
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
import { createActivityMatrixAnalyzer, getActivityMatrixRiskLabel } from "@/lib/domain/activity-matrix";
import { educationLevelLabels } from "@/lib/domain/events";
import { formatRuDate } from "@/lib/utils";
import type { ActivityMatrixCell, ActivityMatrixMode, ActivityMatrixRow } from "@/types/domain";

const modeLabels: Record<ActivityMatrixMode, string> = {
  month: "По месяцам",
  quarter: "По четвертям",
  educationLevel: "По уровням образования",
  class: "По классам",
  responsible: "По ответственным",
  module: "По модулям воспитания"
};

const balanceColors = {
  excellent: "border-emerald-200 bg-emerald-50 text-emerald-800",
  good: "border-sky-200 bg-sky-50 text-sky-800",
  needs_attention: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-800"
};

const riskColors = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-700"
};

export default function ActivityMatrixPage() {
  const { state } = useAppState();
  const [mode, setMode] = React.useState<ActivityMatrixMode>("month");
  const [selectedCell, setSelectedCell] = React.useState<{
    row: ActivityMatrixRow;
    cell: ActivityMatrixCell;
  } | null>(null);
  const analyzer = React.useMemo(() => createActivityMatrixAnalyzer(), []);
  const matrix = React.useMemo(
    () =>
      analyzer.buildMatrix({
        mode,
        events: state.events,
        directions: state.activityDirections,
        relations: state.eventDirectionRelations,
        modules: state.educationModules
      }),
    [analyzer, mode, state.activityDirections, state.educationModules, state.eventDirectionRelations, state.events]
  );
  const highRisks = matrix.analysis.risks.filter((risk) => risk.severity === "high").length;
  const coveredDirections = matrix.rows.filter((row) => row.total > 0).length;
  const goodDirections = matrix.rows
    .filter((row) => row.total >= 3)
    .map((row) => row.directionTitle)
    .slice(0, 6);

  React.useEffect(() => {
    setSelectedCell(null);
  }, [mode]);

  return (
    <>
      <PageHeader
        title="Матрица воспитательной деятельности"
        description="Управленческий экран для поиска пробелов, перегрузок и неохваченных направлений в воспитательной работе школы."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Баланс" value={`${matrix.analysis.balance.score}%`} icon={BarChart3} />
        <MetricCard title="Закрыто направлений" value={`${coveredDirections}/${matrix.rows.length}`} icon={Grid3X3} />
        <MetricCard title="Высоких рисков" value={highRisks} icon={AlertTriangle} />
        <MetricCard title="Мероприятий" value={matrix.totalEvents} icon={ListChecks} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Тепловая карта активности</CardTitle>
                  <CardDescription>
                    Чем насыщеннее ячейка, тем больше мероприятий. Клик по ячейке показывает список событий.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={mode} onChange={(event) => setMode(event.target.value as ActivityMatrixMode)}>
                    {Object.entries(modeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Button variant="outline" onClick={() => setSelectedCell(null)}>
                    <RotateCcw className="h-4 w-4" />
                    Сброс
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-64">Направление</TableHead>
                    {matrix.columns.map((column) => (
                      <TableHead key={column.key} className="min-w-28 text-center">
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Итого</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.rows.map((row) => (
                    <TableRow key={row.directionId} className={row.isEmpty ? "bg-red-50/40" : undefined}>
                      <TableCell>
                        <div className="font-medium">{row.directionTitle}</div>
                        {row.isEmpty ? <div className="text-xs text-red-700">Пустое направление</div> : null}
                      </TableCell>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.key} className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCell({ row, cell })}
                            className={[
                              "h-12 w-full rounded-md border text-sm font-semibold transition hover:border-sky-700",
                              getHeatClass(cell.intensity, cell.count),
                              selectedCell?.row.directionId === row.directionId && selectedCell.cell.key === cell.key
                                ? "ring-2 ring-sky-800"
                                : ""
                            ].join(" ")}
                          >
                            {cell.count}
                          </button>
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{row.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedCell ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCell.row.directionTitle}: {selectedCell.cell.label}
                </CardTitle>
                <CardDescription>Мероприятий в ячейке: {selectedCell.cell.count}</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCell.cell.events.length === 0 ? (
                  <EmptyState
                    icon={Grid3X3}
                    title="В этой ячейке нет мероприятий"
                    description="Добавьте мероприятие в реестр или привяжите существующее мероприятие к этому направлению."
                  />
                ) : (
                  <div className="grid gap-2">
                    {selectedCell.cell.events.map((event) => (
                      <div key={event.id} className="rounded-md border p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatRuDate(event.startDate)}
                              {event.endDate !== event.startDate ? ` - ${formatRuDate(event.endDate)}` : ""} · {event.classes}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">Ответственный: {event.responsible}</div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {event.educationLevels.map((level) => (
                              <Badge key={level} variant="outline">
                                {educationLevelLabels[level]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-4">
          <Card className={`border ${balanceColors[matrix.analysis.balance.status]}`}>
            <CardHeader>
              <CardTitle>Баланс воспитательной работы</CardTitle>
              <CardDescription className="text-inherit">{matrix.analysis.balance.explanation}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">{matrix.analysis.balance.score}%</div>
              <div className="mt-2 text-sm font-medium">{matrix.analysis.balance.label}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Риски воспитательной работы</CardTitle>
              <CardDescription>Автоматически найденные пробелы, перегрузки и неохваченные сегменты.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {matrix.analysis.risks.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Критичных рисков не найдено.
                </div>
              ) : (
                matrix.analysis.risks.slice(0, 8).map((risk) => (
                  <div key={risk.id} className={`rounded-md border p-3 ${riskColors[risk.severity]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{risk.title}</div>
                      <Badge variant="outline">{getActivityMatrixRiskLabel(risk.severity)}</Badge>
                    </div>
                    <div className="mt-2 text-sm">{risk.description}</div>
                    <div className="mt-2 text-xs">Причина: {risk.reason}</div>
                    <div className="mt-1 text-xs font-medium">Рекомендация: {risk.recommendation}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ТОП-10 рекомендаций</CardTitle>
              <CardDescription>Приоритетные действия для выравнивания воспитательной работы.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {matrix.analysis.recommendations.length === 0 ? (
                <div className="text-sm text-muted-foreground">Рекомендации появятся после добавления мероприятий и направлений.</div>
              ) : (
                matrix.analysis.recommendations.map((recommendation, index) => (
                  <div key={recommendation.id} className="rounded-md border p-3 text-sm">
                    <span className="font-semibold">{index + 1}. </span>
                    {recommendation.text}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Сильные зоны</CardTitle>
              <CardDescription>Направления с устойчивым наполнением.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {goodDirections.length === 0 ? (
                <span className="text-sm text-muted-foreground">Пока нет направлений с 3 и более мероприятиями.</span>
              ) : (
                goodDirections.map((title) => (
                  <Badge key={title} variant="secondary">
                    {title}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function getHeatClass(intensity: number, count: number) {
  if (count === 0) {
    return "border-slate-200 bg-white text-slate-400";
  }

  if (intensity >= 75) {
    return "border-sky-900 bg-sky-900 text-white";
  }

  if (intensity >= 50) {
    return "border-sky-700 bg-sky-700 text-white";
  }

  if (intensity >= 25) {
    return "border-sky-300 bg-sky-100 text-sky-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-900";
}
