"use client";

import { ArrowLeft, CalendarDays, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { EventStatusBadge, PriorityBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findModuleById } from "@/lib/domain/modules";
import { isImportedEventModified } from "@/lib/domain/import-history";

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const { state, isLoading } = useAppState();
  const event = state.events.find((item) => item.id === params.id);

  if (!event && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={CalendarDays}
            title="Мероприятие не найдено"
            description="Карточка могла быть удалена или отменена вместе с пакетом импорта."
          />
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/events">Вернуться в реестр</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!event) {
    return null;
  }

  const moduleItem = findModuleById(state.educationModules, event.moduleId);
  const modifiedAfterImport = event.importBatchId ? isImportedEventModified(event) : false;

  return (
    <>
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/events">
          <ArrowLeft className="h-4 w-4" />
          Назад к реестру
        </Link>
      </Button>
      <PageHeader title={event.title} description="Карточка мероприятия и происхождение данных" />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={event.status} />
              <PriorityBadge priority={event.priority} />
              {event.importBatchId ? <Badge variant="outline">Импортировано</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Section title="Описание">{event.description || "Описание не заполнено"}</Section>
            <div className="grid gap-4 sm:grid-cols-2">
              <Value label="Период" value={`${event.startDate} — ${event.endDate}`} />
              <Value label="Классы" value={event.classes} />
              <Value label="Ответственный" value={event.responsible} />
              <Value label="Место" value={event.venue || "Не указано"} />
              <Value label="Модуль" value={moduleItem?.title ?? "Не найден"} />
              <Value label="Направление" value={event.direction} />
            </div>
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Источник
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {event.sourceDocumentId ? (
                <>
                  <Value label="Документ" value={event.sourceDocumentName ?? event.sourceDocumentTitle ?? "Документ"} />
                  <Value label="Уверенность" value={event.sourceConfidence === undefined ? "Не указана" : `${event.sourceConfidence}%`} />
                  <Value label="Дата импорта" value={event.importedAt ? formatDateTime(event.importedAt) : "Не указана"} />
                  <Badge variant={modifiedAfterImport ? "outline" : "success"}>
                    {modifiedAfterImport ? "Изменено после импорта" : "Соответствует импортированному снимку"}
                  </Badge>
                  <Button asChild variant="outline">
                    <Link href={`/document-processing#document-${encodeURIComponent(event.sourceDocumentId)}`}>
                      Открыть документ
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-muted-foreground">Создано вручную, документ-источник отсутствует.</div>
              )}
            </CardContent>
          </Card>

          {event.importBatchId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Аудит импорта
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <Value label="Batch" value={event.importBatchId} />
                <Button asChild variant="outline">
                  <Link href="/import-history">Открыть историю импортов</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
