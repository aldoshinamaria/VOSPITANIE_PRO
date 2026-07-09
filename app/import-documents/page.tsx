"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  FileUp,
  Search,
  Trash2
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { FormField } from "@/components/app/form-field";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { ScenarioReadiness } from "@/components/app/scenario-readiness";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDocumentEventExtractor } from "@/lib/domain/document-event-extractor";
import {
  createExtractedEventImporter,
  type DuplicateResolution,
  type ExtractedEventImportPlan,
  type ExtractedEventImportResult
} from "@/lib/domain/extracted-event-importer";
import {
  createSchoolEventRelevanceAnalyzer,
  getRelevanceLabel,
  type RelevanceLevel,
  type SchoolEventRelevanceResult
} from "@/lib/domain/school-event-relevance-analyzer";
import { educationLevelLabels } from "@/lib/domain/events";
import { createId } from "@/lib/utils";
import type { EducationLevel } from "@/types/common";
import type {
  ExtractedEventStatus,
  ImportedDocument,
  ImportedDocumentStatus,
  ImportedDocumentType
} from "@/types/domain";

const acceptedFileTypes = ".docx,.pdf,.xlsx";

const documentTypeLabels: Record<ImportedDocumentType, string> = {
  docx: "DOCX",
  pdf: "PDF",
  xlsx: "XLSX"
};

const documentStatusLabels: Record<ImportedDocumentStatus, string> = {
  uploaded: "Загружен",
  pending: "Ожидает обработки",
  processed: "Обработан",
  error: "Ошибка"
};

const extractedStatusLabels: Record<ExtractedEventStatus, string> = {
  found: "Найдено",
  selected: "Импортировано",
  ignored: "Исключено"
};

const duplicateResolutionLabels: Record<DuplicateResolution, string> = {
  skip: "Пропустить совпадения",
  create_new: "Создать новые карточки",
  replace_existing: "Заменить существующие карточки"
};

type LevelFilter = "all" | EducationLevel;
type RelevanceFilter = "all" | RelevanceLevel;

export default function ImportDocumentsPage() {
  const { state, updateState, isSaving } = useAppState();
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pendingExtractionId, setPendingExtractionId] = React.useState<string | null>(null);
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [relevanceFilter, setRelevanceFilter] = React.useState<RelevanceFilter>("all");
  const [search, setSearch] = React.useState("");
  const [selectedExtractedIds, setSelectedExtractedIds] = React.useState<string[]>([]);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [duplicateResolution, setDuplicateResolution] = React.useState<DuplicateResolution>("skip");
  const [importReport, setImportReport] = React.useState<ExtractedEventImportResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const extractor = React.useMemo(() => createDocumentEventExtractor(), []);
  const importer = React.useMemo(() => createExtractedEventImporter(), []);
  const relevanceAnalyzer = React.useMemo(() => createSchoolEventRelevanceAnalyzer(), []);

  const documents = state.importedDocuments;
  const extractedEvents = state.extractedEvents;
  const relevanceById = React.useMemo(
    () =>
      new Map(
        extractedEvents.map((event) => [event.id, relevanceAnalyzer.analyze(event, state)])
      ),
    [extractedEvents, relevanceAnalyzer, state]
  );
  const selectedExtractedEvents = extractedEvents.filter((event) => selectedExtractedIds.includes(event.id));
  const importPlan = React.useMemo(
    () => importer.createPlan(selectedExtractedEvents, state.events),
    [importer, selectedExtractedEvents, state.events]
  );
  const totalSize = documents.reduce((sum, document) => sum + document.sizeBytes, 0);
  const filteredExtractedEvents = extractedEvents.filter((event) => {
    const matchesLevel = levelFilter === "all" || event.educationLevel === levelFilter;
    const relevance = relevanceById.get(event.id);
    const matchesRelevance = relevanceFilter === "all" || relevance?.relevanceLevel === relevanceFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.module.toLowerCase().includes(query) ||
      event.responsible.toLowerCase().includes(query);

    return matchesLevel && matchesRelevance && matchesSearch;
  });

  async function handleFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const unsupportedFile = selectedFiles.find((file) => !getDocumentType(file.name));

    if (unsupportedFile) {
      setError(`Файл «${unsupportedFile.name}» не поддерживается. Можно загрузить только DOCX, PDF или XLSX.`);
      resetInput();
      return;
    }

    const now = new Date().toISOString();
    const nextDocuments: ImportedDocument[] = selectedFiles.map((file) => ({
      id: createId("import"),
      title: file.name,
      type: getDocumentType(file.name) as ImportedDocumentType,
      uploadedAt: now,
      sizeBytes: file.size,
      status: "uploaded"
    }));

    try {
      await updateState((current) => ({
        ...current,
        importedDocuments: [...nextDocuments, ...current.importedDocuments]
      }));
      setError(null);
      setImportReport(null);
      setMessage(`Добавлено файлов: ${nextDocuments.length}. Для просмотра событий нажмите «Найти мероприятия».`);
    } catch {
      setMessage(null);
    } finally {
      resetInput();
    }
  }

  async function removeDocument(id: string) {
    try {
      await updateState((current) => ({
        ...current,
        importedDocuments: current.importedDocuments.filter((document) => document.id !== id),
        extractedEvents: current.extractedEvents.filter((event) => event.sourceDocumentId !== id)
      }));
      setSelectedExtractedIds((current) =>
        current.filter((selectedId) =>
          state.extractedEvents.some((event) => event.id === selectedId && event.sourceDocumentId !== id)
        )
      );
      setConfirmationOpen(false);
      setImportReport(null);
      setMessage("Файл и связанные найденные мероприятия удалены из списка импорта.");
      setError(null);
    } catch {
      setMessage(null);
    }
  }

  async function extractEvents(document: ImportedDocument) {
    setPendingExtractionId(document.id);
    setError(null);
    setMessage(null);
    setImportReport(null);

    try {
      const nextExtractedEvents = await extractor.extract(document);

      await updateState((current) => ({
        ...current,
        importedDocuments: current.importedDocuments.map((item) =>
          item.id === document.id ? { ...item, status: "processed" } : item
        ),
        extractedEvents: [
          ...nextExtractedEvents,
          ...current.extractedEvents.filter((event) => event.sourceDocumentId !== document.id)
        ]
      }));

      const autoSelectedIds = nextExtractedEvents
        .filter((event) => relevanceAnalyzer.analyze(event, state).relevanceLevel === "high")
        .map((event) => event.id);

      setSelectedExtractedIds(autoSelectedIds);
      setConfirmationOpen(false);
      setMessage(
        `Найдено мероприятий: ${nextExtractedEvents.length}. Автоматически отмечено с высокой релевантностью: ${autoSelectedIds.length}.`
      );
    } catch {
      await updateState((current) => ({
        ...current,
        importedDocuments: current.importedDocuments.map((item) =>
          item.id === document.id ? { ...item, status: "error" } : item
        )
      }));
      setError("Не удалось найти мероприятия в документе.");
    } finally {
      setPendingExtractionId(null);
    }
  }

  async function importSelectedEvents() {
    if (selectedExtractedIds.length === 0) {
      return;
    }

    let nextReport: ExtractedEventImportResult | null = null;

    try {
      await updateState((current) => {
        const selectedEvents = current.extractedEvents.filter((event) => selectedExtractedIds.includes(event.id));
        const result = importer.importEvents(
          selectedEvents,
          current.events,
          current.educationModules,
          current.importedDocuments,
          { duplicateResolution }
        );

        nextReport = result;

        return {
          ...current,
          events: result.events,
          extractedEvents: current.extractedEvents.map((event) =>
            selectedExtractedIds.includes(event.id)
              ? {
                  ...event,
                  status: result.skippedExtractedIds.includes(event.id) ? "ignored" : "selected"
                }
              : event
          )
        };
      });

      setImportReport(nextReport);
      setSelectedExtractedIds([]);
      setConfirmationOpen(false);
      setError(null);
      setMessage("Импорт завершен. КПВР НОО, ООО и СОО обновляются автоматически из общего реестра мероприятий.");
    } catch {
      setImportReport(null);
      setMessage(null);
      setError("Не удалось импортировать выбранные мероприятия.");
    }
  }

  function toggleExtractedEvent(id: string) {
    setImportReport(null);
    setSelectedExtractedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleAllFiltered() {
    const filteredIds = filteredExtractedEvents.map((event) => event.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedExtractedIds.includes(id));

    setImportReport(null);
    setSelectedExtractedIds((current) =>
      allSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...current, ...filteredIds]))
    );
  }

  function selectRecommendedEvents(includeMedium = false) {
    const recommendedIds = extractedEvents
      .filter((event) => {
        const relevance = relevanceById.get(event.id);
        return relevance?.relevanceLevel === "high" || (includeMedium && relevance?.relevanceLevel === "medium");
      })
      .map((event) => event.id);

    setImportReport(null);
    setSelectedExtractedIds(recommendedIds);
  }

  function removeLowRelevanceFromSelection() {
    setImportReport(null);
    setSelectedExtractedIds((current) =>
      current.filter((id) => relevanceById.get(id)?.relevanceLevel !== "low")
    );
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Импорт документов"
        description="Загрузка DOCX, PDF и XLSX, поиск мероприятий и импорт проверенных событий в основной реестр."
      />

      <Card className="mb-6 border-sky-200 bg-sky-50">
        <CardContent className="flex flex-col gap-3 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
          <div>
            Этот раздел предназначен для сценария «файл → найденные мероприятия → импорт в реестр».
            Для общего анализа структуры документа используйте основной документный экран.
          </div>
          <Button asChild variant="outline">
            <Link href="/document-processing">Открыть общий анализ документов</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Файлов" value={documents.length} icon={FileText} />
        <MetricCard title="Общий размер" value={formatFileSize(totalSize)} icon={FileUp} />
        <MetricCard title="Найдено мероприятий" value={extractedEvents.length} icon={CheckSquare} />
        <MetricCard title="Поддерживаются" value="DOCX / PDF / XLSX" icon={FileSpreadsheet} />
      </div>

      <div className="mt-6">
        <ScenarioReadiness state={state} />
      </div>

      {message ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {importReport ? <ImportReport report={importReport} /> : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Загрузить документы</CardTitle>
          <CardDescription>
            Файлы не анализируются автоматически. После загрузки нажмите «Найти мероприятия» у нужного документа.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-slate-50 px-6 py-8 text-center transition-colors hover:bg-slate-100">
            <FileUp className="h-8 w-8 text-slate-500" />
            <span className="mt-3 text-sm font-medium">Выберите DOCX, PDF или XLSX</span>
            <span className="mt-1 text-xs text-muted-foreground">Можно выбрать несколько файлов одновременно</span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={acceptedFileTypes}
              className="sr-only"
              disabled={isSaving}
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Загруженные файлы</CardTitle>
          <CardDescription>Список документов, подготовленных для просмотра и поиска мероприятий.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="Документы не загружены"
                description="Добавьте DOCX, PDF или XLSX, чтобы зафиксировать их в списке импорта."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Дата загрузки</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Статус обработки</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => {
                  const isPending = pendingExtractionId === document.id;

                  return (
                    <TableRow key={document.id}>
                      <TableCell className="min-w-72 font-medium">{document.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{documentTypeLabels[document.type]}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(document.uploadedAt)}</TableCell>
                      <TableCell>{formatFileSize(document.sizeBytes)}</TableCell>
                      <TableCell>
                        <Badge variant={document.status === "processed" ? "success" : "secondary"}>
                          {documentStatusLabels[document.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSaving || Boolean(pendingExtractionId)}
                            onClick={() => extractEvents(document)}
                          >
                            {isPending ? "Поиск..." : "Найти мероприятия"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSaving || Boolean(pendingExtractionId)}
                            onClick={() => removeDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Удалить файл из списка</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Найденные мероприятия</CardTitle>
          <CardDescription>
            Найденные мероприятия. Отметьте события, проверьте предупреждения и импортируйте их в основной реестр.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[180px_220px_1fr_auto_auto]">
            <Select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}>
              <option value="all">Все уровни</option>
              <option value="noo">НОО</option>
              <option value="ooo">ООО</option>
              <option value="soo">СОО</option>
            </Select>
            <Select
              value={relevanceFilter}
              onChange={(event) => setRelevanceFilter(event.target.value as RelevanceFilter)}
            >
              <option value="all">Все рекомендации</option>
              <option value="high">Высокая релевантность</option>
              <option value="medium">Средняя релевантность</option>
              <option value="low">Низкая релевантность</option>
            </Select>
            <FormField
              label="Поиск"
              value={search}
              placeholder="Название, модуль, ответственный"
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button className="lg:mt-7" variant="outline" onClick={toggleAllFiltered}>
              <Search className="h-4 w-4" />
              Выбрать найденные
            </Button>
            <Button
              className="lg:mt-7"
              disabled={selectedExtractedIds.length === 0 || isSaving}
              onClick={() => setConfirmationOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Импортировать выбранные
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => selectRecommendedEvents(false)}>
              Выбрать рекомендуемые
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => selectRecommendedEvents(true)}>
              Рекомендуемые + возможные
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={removeLowRelevanceFromSelection}>
              Снять нерекомендуемые
            </Button>
          </div>

          {selectedExtractedIds.length > 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Выбрано мероприятий: {selectedExtractedIds.length}. Перед импортом система покажет уровни образования,
              модули и возможные совпадения с уже существующими карточками.
            </div>
          ) : null}

          {confirmationOpen ? (
            <ImportConfirmation
              plan={importPlan}
              relevanceResults={selectedExtractedEvents.map((event) => ({
                eventTitle: event.title,
                result: relevanceById.get(event.id) ?? relevanceAnalyzer.analyze(event, state)
              }))}
              duplicateResolution={duplicateResolution}
              isSaving={isSaving}
              onDuplicateResolutionChange={setDuplicateResolution}
              onCancel={() => setConfirmationOpen(false)}
              onConfirm={importSelectedEvents}
            />
          ) : null}

          {filteredExtractedEvents.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Найденные мероприятия отсутствуют"
              description="Загрузите документ и нажмите «Найти мероприятия», чтобы увидеть найденные события."
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Выбор</TableHead>
                    <TableHead>Название мероприятия</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Уровень образования</TableHead>
                    <TableHead>Модуль</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead>Релевантность</TableHead>
                    <TableHead>Балл</TableHead>
                    <TableHead>Причина рекомендации</TableHead>
                    <TableHead>Предупреждения</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Уверенность распознавания</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExtractedEvents.map((event) => {
                    const sourceDocument = documents.find((document) => document.id === event.sourceDocumentId);
                    const relevance = relevanceById.get(event.id) ?? relevanceAnalyzer.analyze(event, state);

                    return (
                      <TableRow key={event.id} className={getRelevanceRowClassName(relevance.relevanceLevel)}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedExtractedIds.includes(event.id)}
                            onChange={() => toggleExtractedEvent(event.id)}
                            className="h-4 w-4 rounded border-slate-300 accent-sky-800"
                          />
                        </TableCell>
                        <TableCell className="min-w-72">
                          <div className="font-medium">{event.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{event.description}</div>
                        </TableCell>
                        <TableCell>{formatDate(event.date)}</TableCell>
                        <TableCell>{educationLevelLabels[event.educationLevel]}</TableCell>
                        <TableCell>{event.module}</TableCell>
                        <TableCell className="min-w-56">
                          <div>{sourceDocument?.title ?? "Документ удален"}</div>
                          <div className="text-xs text-muted-foreground">{documentTypeLabels[event.sourceType]}</div>
                        </TableCell>
                        <TableCell className="min-w-44">
                          <Badge variant={getRelevanceBadgeVariant(relevance.relevanceLevel)}>
                            {getRelevanceLabel(relevance.relevanceLevel)}
                          </Badge>
                        </TableCell>
                        <TableCell>{relevance.relevanceScore}</TableCell>
                        <TableCell className="min-w-64 text-sm">
                          {relevance.reasons.length > 0 ? relevance.reasons[0] : "Требуется ручная проверка."}
                        </TableCell>
                        <TableCell className="min-w-64 text-sm text-amber-800">
                          {relevance.warnings.length > 0 ? relevance.warnings.join(" ") : "Нет"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.status === "selected" ? "success" : "outline"}>
                            {extractedStatusLabels[event.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{Math.round(event.confidence * 100)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ImportConfirmation({
  plan,
  relevanceResults,
  duplicateResolution,
  isSaving,
  onDuplicateResolutionChange,
  onCancel,
  onConfirm
}: {
  plan: ExtractedEventImportPlan;
  relevanceResults: Array<{ eventTitle: string; result: SchoolEventRelevanceResult }>;
  duplicateResolution: DuplicateResolution;
  isSaving: boolean;
  onDuplicateResolutionChange: (value: DuplicateResolution) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="grid flex-1 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-amber-950">Подтверждение импорта</h3>
            <p className="mt-1 text-sm text-amber-900">
              Будет импортировано выбранных мероприятий: {plan.selectedEvents.length}.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryBlock title="Уровни образования" values={plan.levels.map((level) => educationLevelLabels[level])} />
            <SummaryBlock title="Предполагаемые модули" values={plan.modules} />
            <SummaryBlock
              title="Возможные дубли"
              values={[plan.duplicateCandidates.length > 0 ? `${plan.duplicateCandidates.length}` : "Не обнаружены"]}
            />
          </div>

          {relevanceResults.some((item) => item.result.warnings.length > 0 || item.result.relevanceLevel === "low") ? (
            <div className="rounded-md border border-amber-300 bg-white p-3">
              <div className="text-sm font-medium text-amber-950">Предупреждения по релевантности</div>
              <div className="mt-2 grid gap-2 text-sm text-amber-900">
                {relevanceResults
                  .filter((item) => item.result.warnings.length > 0 || item.result.relevanceLevel === "low")
                  .map((item) => (
                    <div key={item.eventTitle} className="rounded border border-amber-100 bg-amber-50 px-3 py-2">
                      <div className="font-medium">
                        {item.eventTitle}: {getRelevanceLabel(item.result.relevanceLevel)}, {item.result.relevanceScore} баллов
                      </div>
                      <div className="mt-1">
                        {item.result.warnings.length > 0
                          ? item.result.warnings.join(" ")
                          : "Низкая релевантность: проверьте необходимость импорта вручную."}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {plan.duplicateCandidates.length > 0 ? (
            <div className="rounded-md border border-amber-300 bg-white p-3">
              <div className="text-sm font-medium text-amber-950">Обнаружено возможное совпадение</div>
              <div className="mt-2 grid gap-2 text-sm text-amber-900">
                {plan.duplicateCandidates.map((candidate) => (
                  <div key={candidate.extractedEvent.id} className="rounded border border-amber-100 bg-amber-50 px-3 py-2">
                    «{candidate.extractedEvent.title}» похоже на «{candidate.existingEvent.title}» (
                    {Math.round(candidate.similarity * 100)}%).
                  </div>
                ))}
              </div>
              <label className="mt-3 block text-sm font-medium text-amber-950">Что сделать с совпадениями</label>
              <Select
                className="mt-2 bg-white"
                value={duplicateResolution}
                onChange={(event) => onDuplicateResolutionChange(event.target.value as DuplicateResolution)}
              >
                <option value="skip">{duplicateResolutionLabels.skip}</option>
                <option value="create_new">{duplicateResolutionLabels.create_new}</option>
                <option value="replace_existing">{duplicateResolutionLabels.replace_existing}</option>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} onClick={onConfirm}>
              Импортировать выбранные
            </Button>
            <Button variant="outline" disabled={isSaving} onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-md border border-amber-200 bg-white px-3 py-2">
      <div className="text-xs font-medium uppercase text-amber-700">{title}</div>
      <div className="mt-1 text-sm text-amber-950">{values.length > 0 ? values.join(", ") : "Не определено"}</div>
    </div>
  );
}

function ImportReport({ report }: { report: ExtractedEventImportResult }) {
  return (
    <div className="mt-5 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div className="font-semibold">Отчет об импорте</div>
      <div className="mt-2 grid gap-1 sm:grid-cols-4">
        <div>Импортировано: {report.imported}</div>
        <div>Пропущено: {report.skipped}</div>
        <div>Дубли: {report.duplicates}</div>
        <div>Заменено: {report.replaced}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/events">Проверить реестр</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/kpvr">Открыть КПВР</Link>
        </Button>
      </div>
    </div>
  );
}

function getRelevanceBadgeVariant(level: RelevanceLevel) {
  const variants = {
    high: "success",
    medium: "warning",
    low: "secondary"
  } as const;

  return variants[level];
}

function getRelevanceRowClassName(level: RelevanceLevel) {
  const classNames: Record<RelevanceLevel, string> = {
    high: "bg-emerald-50/50",
    medium: "bg-amber-50/40",
    low: "bg-slate-50 text-slate-700"
  };

  return classNames[level];
}

function getDocumentType(fileName: string): ImportedDocumentType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "docx" || extension === "pdf" || extension === "xlsx") {
    return extension;
  }

  return null;
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} Б`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} КБ`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} МБ`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}
