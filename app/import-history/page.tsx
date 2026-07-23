"use client";

import { FileClock, RotateCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildImportHistory,
  createImportRollbackPreview,
  rollbackImportBatch
} from "@/lib/domain/import-history";
import type { ImportRollbackPreview } from "@/types/import-history";

export default function ImportHistoryPage() {
  const { state, updateState, isSaving } = useAppState();
  const [rollbackPreview, setRollbackPreview] = React.useState<ImportRollbackPreview | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const history = React.useMemo(() => buildImportHistory(state.events), [state.events]);
  const importedEventsCount = history.reduce((sum, batch) => sum + batch.events.length, 0);
  const modifiedEventsCount = history.reduce((sum, batch) => sum + batch.modifiedCount, 0);

  function openRollback(batchId: string) {
    setRollbackPreview(createImportRollbackPreview(state.events, batchId));
    setMessage(null);
  }

  async function confirmRollback() {
    if (!rollbackPreview || rollbackPreview.removableEventIds.length === 0) {
      return;
    }

    const removedIds = new Set(rollbackPreview.removableEventIds);
    await updateState((current) => ({
      ...current,
      events: rollbackImportBatch(current.events, rollbackPreview),
      eventDirectionRelations: current.eventDirectionRelations.filter(
        (relation) => !removedIds.has(relation.eventId)
      ),
      eventExecutions: current.eventExecutions.filter(
        (execution) => !removedIds.has(execution.eventId)
      )
    }));
    setMessage(
      `Отменено добавление ${rollbackPreview.removableEventIds.length} мероприятий. Защищено от удаления: ${rollbackPreview.protectedEventIds.length}.`
    );
    setRollbackPreview(null);
  }

  return (
    <>
      <PageHeader
        title="История импортов"
        description="Проверяйте происхождение мероприятий и безопасно отменяйте импорт. Измененные вручную карточки защищены от удаления."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Пакетов импорта" value={history.length} icon={FileClock} />
        <MetricCard title="Импортированных мероприятий" value={importedEventsCount} icon={RotateCcw} />
        <MetricCard title="Изменено после импорта" value={modifiedEventsCount} icon={ShieldAlert} />
      </div>

      {message ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {rollbackPreview ? (
        <Card className="mt-6 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle>Предварительный просмотр отмены</CardTitle>
            <CardDescription>
              Удаляются только карточки, которые не менялись после импорта. Ручные изменения автоматически сохраняются.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Summary label="Будет удалено" value={rollbackPreview.removableEventIds.length} />
              <Summary label="Останется защищено" value={rollbackPreview.protectedEventIds.length} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={isSaving || rollbackPreview.removableEventIds.length === 0}
                onClick={confirmRollback}
              >
                Подтвердить отмену
              </Button>
              <Button variant="outline" onClick={() => setRollbackPreview(null)}>
                Закрыть без изменений
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4">
        {history.length === 0 ? (
          <Card>
            <CardContent className="p-5">
              <EmptyState
                icon={FileClock}
                title="История импортов пуста"
                description="Пакет появится после подтвержденного импорта мероприятий на экране обработки документов."
              />
              <div className="mt-4 flex justify-center">
                <Button asChild>
                  <Link href="/document-processing">Открыть обработку документов</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          history.map((batch) => (
            <Card key={batch.batchId}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{batch.documentNames.join(", ") || "Документ не указан"}</CardTitle>
                    <CardDescription>
                      {formatDateTime(batch.importedAt)} · batch {batch.batchId}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="success">{batch.unchangedCount} без изменений</Badge>
                    {batch.modifiedCount > 0 ? (
                      <Badge variant="outline">{batch.modifiedCount} защищено</Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  {batch.events.map(({ event, state: eventState }) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.startDate} · {event.responsible}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={eventState === "modified" ? "outline" : "success"}>
                          {eventState === "modified" ? "Изменено после импорта" : "Без изменений"}
                        </Badge>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/events/${encodeURIComponent(event.id)}`}>Открыть карточку</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {batch.documentIds.map((documentId) => (
                    <Button key={documentId} asChild size="sm" variant="outline">
                      <Link href={`/document-processing#document-${encodeURIComponent(documentId)}`}>
                        Открыть документ-источник
                      </Link>
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => openRollback(batch.batchId)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Подготовить отмену
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function formatDateTime(value: string) {
  if (!value) {
    return "Дата импорта не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
