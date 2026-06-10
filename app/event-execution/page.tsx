"use client";

import { AlertTriangle, CheckCircle2, ClipboardCheck, LinkIcon, MessageSquare, RotateCcw, Save } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  addExecutionComment,
  addExecutionEvidence,
  calculateEventExecutionStatistics,
  createEventExecutionRiskAnalyzer,
  eventExecutionStatusLabels,
  migrateEventExecutions,
  syncEventStatusFromExecution,
  updateExecutionProgress,
  updateExecutionStatus
} from "@/lib/domain/event-execution";
import { educationLevelLabels, educationLevels } from "@/lib/domain/events";
import { formatRuDate, monthLabels } from "@/lib/utils";
import type { EducationLevel, EventExecution, EventExecutionStatus } from "@/types/domain";

type StatusFilter = "all" | EventExecutionStatus;
type LevelFilter = "all" | EducationLevel;

const riskColors = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-slate-200 bg-slate-50 text-slate-700"
};

export default function EventExecutionPage() {
  const { state, updateState, isSaving } = useAppState();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [monthFilter, setMonthFilter] = React.useState("all");
  const [directionFilter, setDirectionFilter] = React.useState("all");
  const [responsibleFilter, setResponsibleFilter] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [classFilter, setClassFilter] = React.useState("");
  const [commentDrafts, setCommentDrafts] = React.useState<Record<string, string>>({});
  const [evidenceDrafts, setEvidenceDrafts] = React.useState<Record<string, { title: string; url: string }>>({});

  const executions = React.useMemo(
    () => migrateEventExecutions(state.events, state.eventExecutions),
    [state.eventExecutions, state.events]
  );
  const executionByEventId = new Map(executions.map((execution) => [execution.eventId, execution]));
  const risks = React.useMemo(
    () => createEventExecutionRiskAnalyzer().analyze(state.events, executions),
    [executions, state.events]
  );
  const risksByEventId = risks.reduce<Map<string, typeof risks>>((acc, risk) => {
    const list = acc.get(risk.eventId) ?? [];
    list.push(risk);
    acc.set(risk.eventId, list);
    return acc;
  }, new Map());
  const statistics = calculateEventExecutionStatistics(state.events, executions);
  const filteredEvents = state.events.filter((event) => {
    const execution = executionByEventId.get(event.id);
    const matchesStatus = statusFilter === "all" || execution?.status === statusFilter;
    const matchesMonth = monthFilter === "all" || event.month === Number(monthFilter);
    const matchesDirection =
      directionFilter === "all" ||
      state.eventDirectionRelations.some((relation) => relation.eventId === event.id && relation.directionId === directionFilter);
    const matchesResponsible = !responsibleFilter.trim() || execution?.responsible.toLowerCase().includes(responsibleFilter.trim().toLowerCase());
    const matchesLevel = levelFilter === "all" || event.educationLevels.includes(levelFilter);
    const matchesClass = !classFilter.trim() || event.classes.toLowerCase().includes(classFilter.trim().toLowerCase());

    return matchesStatus && matchesMonth && matchesDirection && matchesResponsible && matchesLevel && matchesClass;
  });

  async function saveExecution(nextExecution: EventExecution) {
    await updateState((current) => {
      const currentExecutions = migrateEventExecutions(current.events, current.eventExecutions);
      const nextEvent = current.events.find((event) => event.id === nextExecution.eventId);

      return {
        ...current,
        events: nextEvent
          ? current.events.map((event) => (event.id === nextExecution.eventId ? syncEventStatusFromExecution(event, nextExecution) : event))
          : current.events,
        eventExecutions: currentExecutions.map((execution) =>
          execution.eventId === nextExecution.eventId ? nextExecution : execution
        )
      };
    });
  }

  function resetFilters() {
    setStatusFilter("all");
    setMonthFilter("all");
    setDirectionFilter("all");
    setResponsibleFilter("");
    setLevelFilter("all");
    setClassFilter("");
  }

  return (
    <>
      <PageHeader
        title="Контроль исполнения"
        description="Жизненный цикл мероприятий: планирование, исполнение, подтверждение и включение в отчетность."
      />

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        <MetricCard title="Всего" value={statistics.total} icon={ClipboardCheck} />
        <MetricCard title="Запланировано" value={statistics.planned + statistics.assigned} icon={ClipboardCheck} />
        <MetricCard title="В работе" value={statistics.inProgress} icon={ClipboardCheck} />
        <MetricCard title="Проведено" value={statistics.completed} icon={CheckCircle2} />
        <MetricCard title="Подтверждено" value={statistics.confirmed} icon={CheckCircle2} />
        <MetricCard title="Просрочено" value={statistics.overdue} icon={AlertTriangle} />
        <MetricCard title="Отменено" value={statistics.cancelled} icon={AlertTriangle} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <MetricCard title="Выполнение" value={`${statistics.completionPercent}%`} icon={ClipboardCheck} />
        <MetricCard title="Подтверждение" value={`${statistics.confirmedPercent}%`} icon={CheckCircle2} />
        <MetricCard title="Просрочка" value={`${statistics.overduePercent}%`} icon={AlertTriangle} />
        <MetricCard title="Без ответственного" value={`${statistics.withoutResponsiblePercent}%`} icon={AlertTriangle} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Фильтры контроля</CardTitle>
          <CardDescription>Фильтры не меняют мероприятия, а показывают нужный срез исполнения.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">Все статусы</option>
            {Object.entries(eventExecutionStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
            <option value="all">Все месяцы</option>
            {Object.entries(monthLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)}>
            <option value="all">Все направления</option>
            {state.activityDirections.map((direction) => (
              <option key={direction.id} value={direction.id}>
                {direction.title}
              </option>
            ))}
          </Select>
          <Select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}>
            <option value="all">Все уровни</option>
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {educationLevelLabels[level]}
              </option>
            ))}
          </Select>
          <input
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={responsibleFilter}
            placeholder="Ответственный"
            onChange={(event) => setResponsibleFilter(event.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={classFilter}
              placeholder="Класс"
              onChange={(event) => setClassFilter(event.target.value)}
            />
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4">
        {filteredEvents.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Мероприятия не найдены" description="Измените фильтры или добавьте мероприятия в реестр." />
        ) : (
          filteredEvents.map((event) => {
            const execution = executionByEventId.get(event.id) ?? migrateEventExecutions([event])[0];
            const eventRisks = risksByEventId.get(event.id) ?? [];
            const evidenceDraft = evidenceDrafts[event.id] ?? { title: "", url: "" };

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        {formatRuDate(event.startDate)}
                        {event.endDate !== event.startDate ? ` - ${formatRuDate(event.endDate)}` : ""} · {event.classes}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{eventExecutionStatusLabels[execution.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-[1fr_360px]">
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-sm font-medium">
                        Статус выполнения
                        <Select
                          value={execution.status}
                          onChange={(changeEvent) => saveExecution(updateExecutionStatus(execution, changeEvent.target.value as EventExecutionStatus))}
                          disabled={isSaving}
                        >
                          {Object.entries(eventExecutionStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Процент выполнения
                        <input
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          type="number"
                          min={0}
                          max={100}
                          value={execution.progress.percent}
                          onChange={(changeEvent) => saveExecution(updateExecutionProgress(execution, Number(changeEvent.target.value)))}
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Фактическая дата
                        <input
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          type="date"
                          value={execution.actualDate}
                          onChange={(changeEvent) =>
                            saveExecution({
                              ...execution,
                              actualDate: changeEvent.target.value
                            })
                          }
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium">
                        Ответственный
                        <input
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={execution.responsible}
                          onChange={(changeEvent) => saveExecution({ ...execution, responsible: changeEvent.target.value })}
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Соисполнители
                        <input
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={execution.coExecutors}
                          onChange={(changeEvent) => saveExecution({ ...execution, coExecutors: changeEvent.target.value })}
                        />
                      </label>
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        Комментарии
                      </div>
                      <div className="grid gap-2">
                        {execution.comments.map((comment) => (
                          <div key={comment.id} className="rounded-md bg-slate-50 p-2 text-sm">
                            <div className="text-xs text-muted-foreground">{comment.author} · {new Date(comment.createdAt).toLocaleString("ru-RU")}</div>
                            {comment.text}
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={commentDrafts[event.id] ?? ""}
                            placeholder="Добавить комментарий"
                            onChange={(changeEvent) => setCommentDrafts((current) => ({ ...current, [event.id]: changeEvent.target.value }))}
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              const text = commentDrafts[event.id]?.trim();
                              if (text) {
                                saveExecution(addExecutionComment(execution, text));
                                setCommentDrafts((current) => ({ ...current, [event.id]: "" }));
                              }
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-md border p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <LinkIcon className="h-4 w-4" />
                        Доказательства
                      </div>
                      <div className="grid gap-2">
                        {execution.evidence.map((evidence) => (
                          <a key={evidence.id} href={evidence.url} target="_blank" rel="noreferrer" className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                            {evidence.title}
                          </a>
                        ))}
                        <input
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={evidenceDraft.title}
                          placeholder="Название материала"
                          onChange={(changeEvent) => setEvidenceDrafts((current) => ({ ...current, [event.id]: { ...evidenceDraft, title: changeEvent.target.value } }))}
                        />
                        <input
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={evidenceDraft.url}
                          placeholder="Ссылка на материал"
                          onChange={(changeEvent) => setEvidenceDrafts((current) => ({ ...current, [event.id]: { ...evidenceDraft, url: changeEvent.target.value } }))}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (evidenceDraft.title.trim() && evidenceDraft.url.trim()) {
                              saveExecution(addExecutionEvidence(execution, evidenceDraft.title, evidenceDraft.url));
                              setEvidenceDrafts((current) => ({ ...current, [event.id]: { title: "", url: "" } }));
                            }
                          }}
                        >
                          Добавить материал
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="mb-2 text-sm font-semibold">Риски</div>
                      {eventRisks.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Рисков не найдено.</div>
                      ) : (
                        <div className="grid gap-2">
                          {eventRisks.map((risk) => (
                            <div key={risk.id} className={`rounded-md border p-2 text-sm ${riskColors[risk.level]}`}>
                              <div className="font-medium">{risk.title}</div>
                              <div className="mt-1 text-xs">{risk.reason}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border p-3">
                      <div className="mb-2 text-sm font-semibold">История изменений</div>
                      {execution.history.length === 0 ? (
                        <div className="text-sm text-muted-foreground">История пока пуста.</div>
                      ) : (
                        <div className="grid gap-2">
                          {execution.history.slice(-5).map((item) => (
                            <div key={item.id} className="text-xs text-muted-foreground">
                              {new Date(item.changedAt).toLocaleString("ru-RU")}: {item.field} · {item.from} → {item.to}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
