"use client";

import { Download, FileText, Filter, Layers3, RotateCcw } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { ResponsiveDisclosure } from "@/components/app/responsive-disclosure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildActivityPlanTemplates,
  createActivityPlanBuilder,
  createActivityPlanExporter,
  getActivityPlanDocxFileName
} from "@/lib/domain/activity-plans";
import { educationLevelLabels, educationLevels } from "@/lib/domain/events";
import { monthLabels } from "@/lib/utils";
import type { ActivityPlanExportOptions, ActivityPlanFilter, ActivityPlanGrouping, EducationLevel, EventStatus } from "@/types/domain";

const groupingLabels: Record<ActivityPlanGrouping, string> = {
  month: "По месяцам",
  quarter: "По четвертям",
  module: "По модулям",
  educationLevel: "По уровням образования",
  responsible: "По ответственным",
  direction: "По направлениям",
  none: "Без группировки"
};

const statusLabels: Record<EventStatus, string> = {
  planned: "Планируется",
  completed: "Проведено",
  cancelled: "Отменено"
};

const defaultExportOptions: ActivityPlanExportOptions = {
  includeGoal: true,
  includeTasks: true,
  includeStatus: true,
  includeDirection: true,
  grouping: "month"
};

export default function ActivityPlansPage() {
  const { state } = useAppState();
  const activeDirections = state.activityDirections.filter((direction) => direction.active);
  const templates = React.useMemo(() => buildActivityPlanTemplates(activeDirections), [activeDirections]);
  const [directionId, setDirectionId] = React.useState<string | "all">("all");
  const [grouping, setGrouping] = React.useState<ActivityPlanGrouping>("month");
  const [filter, setFilter] = React.useState<ActivityPlanFilter>({
    educationLevel: "all",
    month: "all",
    status: "all",
    moduleId: "all"
  });
  const [pendingExport, setPendingExport] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const builder = React.useMemo(() => createActivityPlanBuilder(), []);
  const exporter = React.useMemo(() => createActivityPlanExporter(), []);
  const selectedTemplate = templates.find((template) => template.directionId === directionId) ?? templates[0];
  const plan = React.useMemo(
    () =>
      builder.build({
        directionId,
        academicYear: state.schoolPassport.academicYear,
        state,
        filter,
        options: { ...defaultExportOptions, grouping }
      }),
    [builder, directionId, filter, grouping, state]
  );

  async function downloadDocx() {
    setPendingExport(true);
    setError(null);

    try {
      const blob = await exporter.toDocx(plan, { ...defaultExportOptions, grouping });
      downloadBlob(blob, getActivityPlanDocxFileName(plan));
    } catch {
      setError("Не удалось сформировать DOCX. Проверьте данные плана и повторите экспорт.");
    } finally {
      setPendingExport(false);
    }
  }

  function resetFilters() {
    setFilter({ educationLevel: "all", month: "all", status: "all", moduleId: "all" });
    setGrouping(selectedTemplate?.defaultGrouping ?? "month");
  }

  return (
    <>
      <PageHeader
        title="Планы деятельности"
        description="Универсальный движок планов: каждый план строится как проекция единого реестра мероприятий по направлениям деятельности."
        actions={
          <Button onClick={downloadDocx} disabled={pendingExport}>
            <Download className="h-4 w-4" />
            {pendingExport ? "Формируется..." : "Скачать DOCX"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Мероприятий в плане" value={plan.statistics.totalEvents} icon={FileText} />
        <MetricCard title="Выполнение" value={`${plan.statistics.completionPercent}%`} icon={Layers3} />
        <MetricCard title="Проведено" value={plan.statistics.completedEvents} icon={FileText} />
        <MetricCard title="Просрочено" value={plan.statistics.overdueEvents} icon={Filter} />
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
              <CardTitle>Направления</CardTitle>
              <CardDescription>Выберите направление, чтобы получить отдельный план без копирования мероприятий.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <DirectionButton
                title="План воспитательной работы школы"
                count={state.events.length}
                active={directionId === "all"}
                onClick={() => setDirectionId("all")}
              />
              {activeDirections.map((direction) => {
                const count = state.eventDirectionRelations.filter((relation) => relation.directionId === direction.id).length;

                return (
                  <DirectionButton
                    key={direction.id}
                    title={direction.title}
                    count={count}
                    active={directionId === direction.id}
                    onClick={() => setDirectionId(direction.id)}
                  />
                );
              })}
            </CardContent>
          </Card>

          <ResponsiveDisclosure
            title="Фильтры и группировка"
            description="Откройте, чтобы изменить проекцию плана."
          >
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium">
                Группировка
                <Select value={grouping} onChange={(event) => setGrouping(event.target.value as ActivityPlanGrouping)}>
                  {Object.entries(groupingLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Уровень образования
                <Select
                  value={filter.educationLevel ?? "all"}
                  onChange={(event) => setFilter((current) => ({ ...current, educationLevel: event.target.value as EducationLevel | "all" }))}
                >
                  <option value="all">Все уровни</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>
                      {educationLevelLabels[level]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Месяц
                <Select
                  value={String(filter.month ?? "all")}
                  onChange={(event) =>
                    setFilter((current) => ({
                      ...current,
                      month: event.target.value === "all" ? "all" : Number(event.target.value)
                    }))
                  }
                >
                  <option value="all">Все месяцы</option>
                  {Object.entries(monthLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Статус
                <Select
                  value={filter.status ?? "all"}
                  onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value as EventStatus | "all" }))}
                >
                  <option value="all">Все статусы</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Модуль воспитания
                <Select
                  value={filter.moduleId ?? "all"}
                  onChange={(event) => setFilter((current) => ({ ...current, moduleId: event.target.value }))}
                >
                  <option value="all">Все модули</option>
                  {state.educationModules.map((moduleItem) => (
                    <option key={moduleItem.id} value={moduleItem.id}>
                      {moduleItem.title}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Класс
                <input
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filter.className ?? ""}
                  placeholder="Например: 5"
                  onChange={(event) => setFilter((current) => ({ ...current, className: event.target.value }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Ответственный
                <input
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filter.responsible ?? ""}
                  placeholder="ФИО или должность"
                  onChange={(event) => setFilter((current) => ({ ...current, responsible: event.target.value }))}
                />
              </label>
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
                Сбросить фильтры
              </Button>
            </div>
          </ResponsiveDisclosure>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>
                    {plan.academicYear} учебный год. Группировка: {groupingLabels[plan.grouping].toLowerCase()}.
                  </CardDescription>
                </div>
                <Badge variant="outline">{plan.directionTitle}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-md border bg-slate-50 p-4">
                <div className="text-sm font-semibold">Цель</div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.goal}</p>
                <div className="mt-3 text-sm font-semibold">Задачи</div>
                <ul className="mt-1 grid gap-1 text-sm text-muted-foreground">
                  {plan.tasks.map((task) => (
                    <li key={task}>- {task}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {plan.statistics.byMonth.slice(0, 6).map((item) => (
                  <div key={item.month} className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">{monthLabels[item.month]}</div>
                    <div className="text-xl font-semibold">{item.count}</div>
                  </div>
                ))}
              </div>

              {plan.rows.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Мероприятия не найдены"
                  description="Измените фильтры или добавьте направления деятельности в карточках мероприятий."
                />
              ) : (
                plan.sections.map((section) => (
                  <div key={section.id} className="overflow-hidden rounded-md border">
                    <div className="border-b bg-slate-50 px-4 py-3 text-sm font-semibold">{section.title}</div>
                    <div className="grid gap-3 p-3 md:hidden">
                      {section.rows.map((row, rowIndex) => (
                        <article key={row.id} className="rounded-md border bg-white p-3">
                          <div className="text-xs font-semibold text-muted-foreground">№ {rowIndex + 1}</div>
                          <div className="mt-1 font-medium">{row.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{row.moduleTitle}</div>
                          <dl className="mt-3 grid gap-2 text-sm">
                            <MobileField label="Дата" value={row.date} />
                            <MobileField label="Классы" value={row.classes} />
                            <MobileField label="Ответственные" value={row.responsible} />
                            <MobileField label="Статус" value={statusLabels[row.status]} />
                          </dl>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {row.directionTitles.map((title) => (
                              <Badge key={title} variant="secondary">
                                {title}
                              </Badge>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>№</TableHead>
                          <TableHead>Мероприятие</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Классы</TableHead>
                          <TableHead>Ответственные</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Направление</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.rows.map((row, rowIndex) => (
                          <TableRow key={row.id}>
                            <TableCell>{rowIndex + 1}</TableCell>
                            <TableCell className="min-w-64">
                              <div className="font-medium">{row.title}</div>
                              <div className="text-xs text-muted-foreground">{row.moduleTitle}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                            <TableCell>{row.classes}</TableCell>
                            <TableCell>{row.responsible}</TableCell>
                            <TableCell>{statusLabels[row.status]}</TableCell>
                            <TableCell className="min-w-56">
                              <div className="flex flex-wrap gap-1">
                                {row.directionTitles.map((title) => (
                                  <Badge key={title} variant="secondary">
                                    {title}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function DirectionButton({
  title,
  count,
  active,
  onClick
}: {
  title: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-sky-800 bg-sky-50 p-3 text-left"
          : "rounded-md border bg-white p-3 text-left transition hover:border-sky-700 hover:bg-sky-50"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant={active ? "default" : "secondary"}>{count}</Badge>
      </div>
    </button>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
