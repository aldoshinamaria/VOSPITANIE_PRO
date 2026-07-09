"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, FileSearch, GraduationCap, School, Wand2 } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { ScenarioReadiness } from "@/components/app/scenario-readiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createEventDirectionRelations, inferDirectionIdsFromText } from "@/lib/domain/activity-directions";
import { createDocumentEventPreviewImporter } from "@/lib/domain/document-processing/event-preview-importer";
import { buildKpvrDocument, formatKpvrPeriod } from "@/lib/domain/kpvr";
import { cn } from "@/lib/utils";
import type { DocumentEventImportResult, EducationLevel } from "@/types/domain";

const kpvrTabs: Array<{
  level: EducationLevel;
  title: string;
}> = [
  { level: "noo", title: "КПВР НОО" },
  { level: "ooo", title: "КПВР ООО" },
  { level: "soo", title: "КПВР СОО" }
];

export default function KpvrPage() {
  const { state, updateState, isSaving } = useAppState();
  const [activeLevel, setActiveLevel] = useState<EducationLevel>("noo");
  const [selectedPreviewEventIds, setSelectedPreviewEventIds] = useState<string[]>([]);
  const [assemblyReport, setAssemblyReport] = useState<DocumentEventImportResult | null>(null);
  const eventPreviewImporter = useMemo(() => createDocumentEventPreviewImporter(), []);

  const documents = useMemo(
    () => ({
      noo: buildKpvrDocument("noo", state.events, state.educationModules),
      ooo: buildKpvrDocument("ooo", state.events, state.educationModules),
      soo: buildKpvrDocument("soo", state.events, state.educationModules)
    }),
    [state.educationModules, state.events]
  );

  const activeDocument = documents[activeLevel];
  const confirmedDocuments = useMemo(
    () => state.processedDocuments.filter((document) => document.confirmed && (document.extractedEventPreview?.length ?? 0) > 0),
    [state.processedDocuments]
  );
  const assemblyDryRun = useMemo(
    () => eventPreviewImporter.createDryRun(confirmedDocuments, state.events),
    [confirmedDocuments, eventPreviewImporter, state.events]
  );
  const importableItems = assemblyDryRun.items.filter((item) => item.status === "IMPORTABLE");
  const totalPreviewEvents = confirmedDocuments.reduce((total, document) => total + (document.extractedEventPreview?.length ?? 0), 0);

  function selectAllImportable() {
    setSelectedPreviewEventIds(importableItems.map((item) => item.previewEvent.id));
  }

  function togglePreviewEvent(id: string) {
    setSelectedPreviewEventIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function applySelectedPreviewEvents() {
    if (selectedPreviewEventIds.length === 0) {
      return;
    }

    let nextReport: DocumentEventImportResult | null = null;

    await updateState((current) => {
      const currentConfirmedDocuments = current.processedDocuments.filter(
        (document) => document.confirmed && (document.extractedEventPreview?.length ?? 0) > 0
      );
      const result = eventPreviewImporter.importSelected(selectedPreviewEventIds, currentConfirmedDocuments, current.events, {
        modules: current.educationModules,
        directions: current.activityDirections
      });
      const eventDirectionRelations = result.events.flatMap((event) => {
        const inferredDirectionIds = inferDirectionIdsFromText(
          `${event.direction} ${event.title} ${event.description}`,
          current.activityDirections
        );

        return createEventDirectionRelations(
          event.id,
          (inferredDirectionIds.length > 0 ? inferredDirectionIds : [current.activityDirections[0]?.id ?? ""]).filter(Boolean)
        );
      });

      nextReport = result;

      if (result.events.length === 0) {
        return current;
      }

      return {
        ...current,
        events: [...result.events, ...current.events],
        eventDirectionRelations: [...eventDirectionRelations, ...current.eventDirectionRelations]
      };
    });

    setAssemblyReport(nextReport);
    setSelectedPreviewEventIds([]);
  }

  return (
    <>
      <PageHeader
        title="КПВР"
        description="Предпросмотр календарного плана воспитательной работы формируется из реестра мероприятий по выбранному уровню образования."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="План НОО" value={documents.noo.totalRows} icon={School} />
        <MetricCard title="План ООО" value={documents.ooo.totalRows} icon={GraduationCap} />
        <MetricCard title="План СОО" value={documents.soo.totalRows} icon={ClipboardList} />
      </div>

      <div className="mt-6">
        <ScenarioReadiness state={state} />
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-sky-700" />
                Мастер сборки единого КТПВР
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl">
                Использует подтвержденные результаты анализа документов. Мероприятия добавляются в рабочий реестр только после dry-run,
                выбора пользователем и нажатия кнопки применения.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/document-processing">
                <FileSearch className="h-4 w-4" />
                Загрузка и анализ документов
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md border bg-white p-3">
              <div className="text-xs text-slate-500">Подтверждено документов</div>
              <div className="mt-1 text-2xl font-semibold">{confirmedDocuments.length}</div>
            </div>
            <div className="rounded-md border bg-white p-3">
              <div className="text-xs text-slate-500">Найдено записей</div>
              <div className="mt-1 text-2xl font-semibold">{totalPreviewEvents}</div>
            </div>
            <div className="rounded-md border bg-white p-3">
              <div className="text-xs text-slate-500">Можно добавить</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-700">{assemblyDryRun.importableCount}</div>
            </div>
            <div className="rounded-md border bg-white p-3">
              <div className="text-xs text-slate-500">Дубли / неполные / шум</div>
              <div className="mt-1 text-2xl font-semibold text-amber-700">
                {assemblyDryRun.duplicateCount + assemblyDryRun.incompleteCount + assemblyDryRun.skippedCount}
              </div>
            </div>
          </div>

          {confirmedDocuments.length === 0 ? (
            <div className="rounded-md border border-dashed bg-white p-4 text-sm text-slate-600">
              Сначала загрузите документы на странице анализа, проверьте preview и нажмите «Подтвердить результат анализа». После этого
              здесь появится список мероприятий для сборки единого КТПВР.
            </div>
          ) : importableItems.length === 0 ? (
            <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
              В подтвержденных документах пока нет новых REAL_EVENT с качеством 70% и выше. Дубли и сомнительные записи не добавляются
              автоматически.
            </div>
          ) : (
            <div className="rounded-md border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
                <div className="text-sm font-medium">
                  Выбрано: {selectedPreviewEventIds.length} из {importableItems.length}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={selectAllImportable}>
                    Выбрать все подходящие
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedPreviewEventIds([])}>
                    Снять выбор
                  </Button>
                  <Button type="button" onClick={applySelectedPreviewEvents} disabled={selectedPreviewEventIds.length === 0 || isSaving}>
                    <CheckCircle2 className="h-4 w-4" />
                    Добавить выбранные в реестр
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {importableItems.slice(0, 12).map((item) => (
                  <label key={item.previewEvent.id} className="flex cursor-pointer gap-3 p-3 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={selectedPreviewEventIds.includes(item.previewEvent.id)}
                      onChange={() => togglePreviewEvent(item.previewEvent.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-950">{item.previewEvent.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {item.previewEvent.sourceDocumentName} · качество {item.previewEvent.qualityScore}% · уровень{" "}
                        {item.previewEvent.educationLevels.join(", ") || "не указан"} · месяц {item.previewEvent.month ?? "не указан"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {importableItems.length > 12 ? (
                <div className="border-t p-3 text-xs text-slate-500">Показаны первые 12 записей. Кнопка «Выбрать все» применяет весь список.</div>
              ) : null}
            </div>
          )}

          {assemblyReport ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Добавлено мероприятий: {assemblyReport.importedCount}. Пропущено:{" "}
              {assemblyReport.duplicateCount + assemblyReport.incompleteCount + assemblyReport.skippedCount}. Теперь они участвуют в КПВР и
              планах деятельности через общий реестр мероприятий.{" "}
              <Link href="/events" className="font-semibold underline">
                Открыть мероприятия
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Генератор КПВР</CardTitle>
          <CardDescription>
            Выберите уровень образования. Мероприятия с несколькими уровнями отображаются в каждом соответствующем плане.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Уровни КПВР">
            {kpvrTabs.map((tab) => (
              <Button
                key={tab.level}
                type="button"
                variant={activeLevel === tab.level ? "default" : "outline"}
                className={cn("min-w-28", activeLevel === tab.level && "shadow-sm")}
                onClick={() => setActiveLevel(tab.level)}
                role="tab"
                aria-selected={activeLevel === tab.level}
              >
                {tab.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Предпросмотр документа</CardTitle>
          <CardDescription>{activeDocument.totalRows} мероприятий в выбранном плане</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <article className="bg-white px-4 py-6 text-slate-950 md:px-8">
            <header className="mx-auto max-w-5xl text-center">
              <p className="text-sm font-semibold uppercase tracking-normal text-slate-600">{activeDocument.levelLabel}</p>
              <h2 className="mt-2 text-xl font-semibold">
                Календарный план воспитательной работы на {state.schoolPassport.academicYear} учебный год
              </h2>
              <div className="mt-4 space-y-1 text-sm text-slate-700">
                <p>2018–2027 гг. — Десятилетие детства в Российской Федерации</p>
                <p>2022–2031 гг. — Десятилетие науки и технологий</p>
              </div>
            </header>

            <div className="mt-8 grid gap-3 md:hidden">
              {activeDocument.groups.length === 0 ? (
                <div className="rounded-md border bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Для выбранного уровня образования пока нет мероприятий. Добавьте мероприятие в реестре и укажите этот уровень.
                </div>
              ) : (
                activeDocument.groups.map((group, groupIndex) => {
                  const startNumber =
                    activeDocument.groups.slice(0, groupIndex).reduce((total, currentGroup) => total + currentGroup.rows.length, 0) + 1;

                  return (
                    <section key={group.moduleId} className="rounded-md border bg-white">
                      <div className="border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                        Модуль: {group.moduleTitle}
                      </div>
                      <div className="grid gap-3 p-3">
                        {group.rows.map((row, index) => (
                          <article key={row.id} className="rounded-md border p-3">
                            <div className="text-xs font-semibold text-slate-500">№ {startNumber + index}</div>
                            <div className="mt-1 font-medium text-slate-950">{row.title}</div>
                            <dl className="mt-3 grid gap-2 text-sm">
                              <MobileField label="Классы" value={row.classes} />
                              <MobileField label="Сроки" value={formatKpvrPeriod(row)} />
                              <MobileField label="Ответственные" value={row.responsible} />
                            </dl>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </div>

            <div className="mt-8 hidden overflow-x-auto rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="w-16 text-center text-slate-900">№</TableHead>
                    <TableHead className="min-w-80 text-slate-900">Дела, события, мероприятия</TableHead>
                    <TableHead className="w-32 text-slate-900">Классы</TableHead>
                    <TableHead className="w-52 text-slate-900">Сроки</TableHead>
                    <TableHead className="min-w-56 text-slate-900">Ответственные</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDocument.groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-slate-500">
                        Для выбранного уровня образования пока нет мероприятий. Добавьте мероприятие в реестре и укажите этот уровень.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeDocument.groups.map((group, groupIndex) => {
                      const startNumber =
                        activeDocument.groups.slice(0, groupIndex).reduce((total, currentGroup) => total + currentGroup.rows.length, 0) + 1;

                      return <KpvrModuleRows key={group.moduleId} group={group} startNumber={startNumber} />;
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </article>
        </CardContent>
      </Card>
    </>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}

function KpvrModuleRows({
  group,
  startNumber
}: {
  group: ReturnType<typeof buildKpvrDocument>["groups"][number];
  startNumber: number;
}) {
  return (
    <>
      <TableRow className="bg-slate-50">
        <TableCell colSpan={5} className="font-semibold text-slate-900">
          Модуль: {group.moduleTitle}
        </TableCell>
      </TableRow>
      {group.rows.map((row, index) => (
        <TableRow key={row.id}>
          <TableCell className="text-center align-top">{startNumber + index}</TableCell>
          <TableCell className="align-top font-medium">{row.title}</TableCell>
          <TableCell className="align-top">{row.classes}</TableCell>
          <TableCell className="align-top">{formatKpvrPeriod(row)}</TableCell>
          <TableCell className="align-top">{row.responsible}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
