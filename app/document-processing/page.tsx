"use client";

import { CheckCircle2, FileSearch, FileUp, Pencil, ShieldAlert, TimerReset, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { FieldLabel } from "@/components/app/form-field";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createUnknownDocumentClassification } from "@/lib/domain/document-processing/classifier";
import { createDocumentEventPreviewImporter } from "@/lib/domain/document-processing/event-preview-importer";
import { createDocumentProcessingPipeline } from "@/lib/domain/document-processing/pipeline";
import { createEventDirectionRelations, inferDirectionIdsFromText } from "@/lib/domain/activity-directions";
import type {
  DocumentClassification,
  DocumentEntityPreview,
  DocumentEntityPreviewKind,
  DocumentEventImportDryRun,
  DocumentEventImportDryRunItem,
  DocumentEventImportResult,
  DocumentEventImportStatus,
  DocumentEventPreview,
  DocumentKind,
  DocumentPreviewSourceState,
  DocumentProcessingLogEntry,
  DocumentProcessingRecord,
  DocumentSourceType,
  DocumentStructuredPreview,
  DocumentValidationStatus,
  NormalizedDocument
} from "@/types/document-processing";

const sourceTypeLabels: Record<DocumentSourceType, string> = {
  import: "Импорт документов",
  normative: "Нормативный центр",
  "work-program": "Рабочая программа",
  kpvr: "КПВР",
  local: "Локальный документ"
};

const validationLabels: Record<DocumentValidationStatus, string> = {
  excellent: "Отлично",
  good: "Хорошо",
  needs_review: "Требует проверки",
  invalid: "Не подходит",
  requires_ocr: "Требуется OCR"
};

const documentKindLabels: Record<DocumentKind, string> = {
  federal_work_program: "Федеральная рабочая программа воспитания",
  federal_calendar_plan: "Федеральный календарный план",
  regional_document: "Региональный документ",
  municipal_document: "Муниципальный документ",
  local_school_document: "Локальный документ школы",
  school_work_program: "Рабочая программа школы",
  kpvr: "КПВР",
  upbringing_plan: "План ВР",
  regulation: "Положение",
  order: "Приказ",
  extra_activity_plan: "План внеурочной деятельности",
  social_passport: "Социальный паспорт",
  development_program: "Программа развития",
  normative_document: "Нормативный документ",
  unknown: "Не определен"
};

const sourceStateLabels: Record<DocumentPreviewSourceState, string> = {
  extracted: "Найдено",
  manual: "Введено вручную",
  empty: "Не найдено",
  rejected: "Отклонено",
  edited: "Изменено"
};

const importStatusLabels: Record<DocumentEventImportStatus, string> = {
  IMPORTABLE: "Будет добавлено",
  DUPLICATE: "Дубли",
  INCOMPLETE: "Неполные",
  SKIPPED: "Пропущено"
};

const entityGroups: Array<{
  key: Exclude<keyof DocumentStructuredPreview, "events">;
  title: string;
  kind: DocumentEntityPreviewKind;
  emptyTitle: string;
}> = [
  { key: "schoolData", title: "Паспорт школы", kind: "school_data", emptyTitle: "Поле паспорта школы" },
  { key: "educationModules", title: "Модули воспитания", kind: "education_module", emptyTitle: "Модуль воспитания" },
  { key: "associations", title: "Объединения", kind: "association", emptyTitle: "Объединение" },
  { key: "socialPartners", title: "Социальные партнеры", kind: "social_partner", emptyTitle: "Социальный партнер" },
  { key: "infrastructure", title: "Инфраструктура", kind: "infrastructure", emptyTitle: "Объект инфраструктуры" },
  { key: "responsiblePersons", title: "Ответственные", kind: "responsible_person", emptyTitle: "Ответственный" },
  { key: "educationLevels", title: "Уровни образования", kind: "education_level", emptyTitle: "Уровень образования" }
];

export default function DocumentProcessingPage() {
  const { mode, state, updateState, isSaving } = useAppState();
  const pipeline = React.useMemo(() => createDocumentProcessingPipeline(mode), [mode]);
  const eventPreviewImporter = React.useMemo(() => createDocumentEventPreviewImporter(), []);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [sourceType, setSourceType] = React.useState<DocumentSourceType>("import");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<NormalizedDocument | null>(null);
  const [draftPreview, setDraftPreview] = React.useState<DocumentStructuredPreview | null>(null);
  const [applyDocumentId, setApplyDocumentId] = React.useState<string | null>(null);
  const [dryRun, setDryRun] = React.useState<DocumentEventImportDryRun | null>(null);
  const [selectedPreviewEventIds, setSelectedPreviewEventIds] = React.useState<string[]>([]);
  const [importReport, setImportReport] = React.useState<DocumentEventImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMessage(null);
    resetApplyState();

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const result = await pipeline.process(file, sourceType);
      const preview = createEditablePreview(result.normalizedDocument);
      const normalizedDocument = { ...result.normalizedDocument, structuredPreview: preview };
      const record = toProcessingRecord(normalizedDocument);

      setSelectedDocument(normalizedDocument);
      setDraftPreview(preview);
      await updateState((current) => ({
        ...current,
        processedDocuments: [record, ...current.processedDocuments.filter((item) => item.id !== record.id)],
        documentProcessingLogs: [...result.logs, ...current.documentProcessingLogs].slice(0, 200)
      }));
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : "Не удалось обработать документ.");
    } finally {
      setIsProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function confirmDocument(id: string, preview?: DocumentStructuredPreview) {
    await updateState((current) => ({
      ...current,
      processedDocuments: current.processedDocuments.map((document) =>
        document.id === id
          ? {
              ...document,
              structuredPreview: preview ?? document.structuredPreview,
              extractedEventPreview: preview?.events ?? document.extractedEventPreview,
              confirmed: true
            }
          : document
      )
    }));
    resetApplyState();
    setMessage("Результат анализа подтвержден. Мероприятия можно применить в рабочий реестр после dry-run.");
  }

  function resetApplyState() {
    setApplyDocumentId(null);
    setDryRun(null);
    setSelectedPreviewEventIds([]);
    setImportReport(null);
  }

  function openApplyFlow(document: DocumentProcessingRecord) {
    const nextDryRun = eventPreviewImporter.createDryRun([document], state.events);

    setApplyDocumentId(document.id);
    setDryRun(nextDryRun);
    setImportReport(null);
    setSelectedPreviewEventIds(
      nextDryRun.items
        .filter((item) => item.status === "IMPORTABLE")
        .map((item) => item.previewEvent.id)
    );
  }

  function togglePreviewEvent(id: string) {
    setSelectedPreviewEventIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function setAllImportableSelected(items: DocumentEventImportDryRunItem[], selected: boolean) {
    setSelectedPreviewEventIds(
      selected ? items.filter((item) => item.status === "IMPORTABLE").map((item) => item.previewEvent.id) : []
    );
  }

  async function applySelectedEvents() {
    if (!applyDocumentId || selectedPreviewEventIds.length === 0) {
      return;
    }

    let nextReport: DocumentEventImportResult | null = null;
    let nextDryRun: DocumentEventImportDryRun | null = null;

    await updateState((current) => {
      const document = current.processedDocuments.find((item) => item.id === applyDocumentId);

      if (!document) {
        return current;
      }

      const previewCount = document.extractedEventPreview?.length ?? 0;
      const result = eventPreviewImporter.importSelected(selectedPreviewEventIds, [document], current.events, {
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
      nextDryRun = eventPreviewImporter.createDryRun([document], [...result.events, ...current.events]);

      console.info("[document-processing] event import diagnostics", {
        previewCount,
        selectedCount: selectedPreviewEventIds.length,
        importerEventCount: result.events.length,
        previousEventsCount: current.events.length,
        nextEventsCount: current.events.length + result.events.length
      });

      if (result.events.length === 0) {
        return current;
      }

      return {
        ...current,
        events: [...result.events, ...current.events],
        eventDirectionRelations: [...eventDirectionRelations, ...current.eventDirectionRelations]
      };
    });

    const report = nextReport as DocumentEventImportResult | null;
    const refreshedDryRun = nextDryRun as DocumentEventImportDryRun | null;

    if (report) {
      setImportReport(report);
      setDryRun(refreshedDryRun);
      setSelectedPreviewEventIds([]);
      setMessage(
        `Добавлено мероприятий: ${report.importedCount}. Пропущено: ${
          report.duplicateCount + report.incompleteCount + report.skippedCount
        }.`
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Загрузка и анализ документов"
        description="Загрузите рабочую программу, КПВР, планы, приказы или положения. Система найдет данные, покажет их для проверки, а вы сможете исправить и подтвердить результат"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Обработано" value={state.processedDocuments.length} icon={FileSearch} />
        <MetricCard title="Классифицировано" value={state.processedDocuments.filter((document) => document.classification.documentKind !== "unknown").length} icon={CheckCircle2} />
        <MetricCard title="Требуют проверки" value={state.processedDocuments.filter((document) => document.validationStatus === "needs_review").length} icon={ShieldAlert} />
        <MetricCard title="Записей журнала" value={state.documentProcessingLogs.length} icon={TimerReset} />
      </div>

      {error ? <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {message ? <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <CardContent className="flex flex-col gap-3 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
          <div>
            Этот экран показывает анализ, классификацию и редактируемый preview. Если нужен старый поток извлечения мероприятий с импортом
            в реестр, откройте отдельный раздел импорта.
          </div>
          <Button asChild variant="outline">
            <Link href="/import-documents">Открыть импорт мероприятий</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Загрузить документ</CardTitle>
          <CardDescription>
            Поддерживаются DOCX, текстовый PDF и XLSX. Данные сохраняются только как проверяемый preview и не попадают в паспорт школы, мероприятия, КПВР или другие рабочие разделы.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <label className="grid gap-2 text-sm font-medium">
            <FieldLabel label="Источник документа" />
            <Select value={sourceType} onChange={(event) => setSourceType(event.target.value as DocumentSourceType)}>
              {Object.entries(sourceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-slate-50 px-6 py-6 text-center transition-colors hover:bg-slate-100">
            <FileUp className="h-7 w-7 text-slate-500" />
            <span className="mt-2 text-sm font-medium">{isProcessing ? "Документ анализируется..." : "Выберите DOCX, PDF или XLSX до 50 МБ"}</span>
            <span className="mt-1 text-xs text-muted-foreground">После анализа откроется редактируемый preview найденных данных.</span>
            <Input
              ref={inputRef}
              type="file"
              accept=".docx,.pdf,.xlsx"
              className="sr-only"
              disabled={isSaving || isProcessing}
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </CardContent>
      </Card>

      {selectedDocument && draftPreview ? (
        <DocumentReview
          document={selectedDocument}
          preview={draftPreview}
          setPreview={setDraftPreview}
          onConfirm={() => confirmDocument(selectedDocument.id, draftPreview)}
        />
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Обработанные документы</CardTitle>
            <CardDescription>Здесь хранится результат анализа: классификация, качество и подтвержденный preview.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {state.processedDocuments.length === 0 ? (
              <EmptyState icon={FileSearch} title="Документы еще не загружались" description="Загрузите DOCX, PDF или XLSX, чтобы увидеть классификацию и preview." />
            ) : (
              state.processedDocuments.map((document) => (
                <ProcessedDocumentCard
                  key={document.id}
                  document={document}
                  onConfirm={() => confirmDocument(document.id, document.structuredPreview)}
                  onApply={() => openApplyFlow(document)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Журнал обработки</CardTitle>
            <CardDescription>Показывает этапы: загрузка, извлечение текста, структура, нормализация, валидация, классификация и preview.</CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-[520px] gap-3 overflow-auto">
            {state.documentProcessingLogs.length === 0 ? (
              <EmptyState icon={TimerReset} title="Журнал пуст" description="Записи появятся после первой обработки документа." />
            ) : (
              state.documentProcessingLogs.map((entry) => <LogEntry key={entry.id} entry={entry} />)
            )}
          </CardContent>
        </Card>
      </div>

      {dryRun ? (
        <EventApplyPanel
          dryRun={dryRun}
          selectedPreviewEventIds={selectedPreviewEventIds}
          importReport={importReport}
          isSaving={isSaving}
          onToggle={togglePreviewEvent}
          onSelectAll={(selected) => setAllImportableSelected(dryRun.items, selected)}
          onApply={applySelectedEvents}
        />
      ) : null}
    </>
  );
}

function DocumentReview({
  document,
  preview,
  setPreview,
  onConfirm
}: {
  document: NormalizedDocument;
  preview: DocumentStructuredPreview;
  setPreview: React.Dispatch<React.SetStateAction<DocumentStructuredPreview | null>>;
  onConfirm: () => void;
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Редактируемый preview: {document.title}</CardTitle>
            <CardDescription>Исправьте найденные данные, удалите лишнее, отклоните сомнительное или добавьте недостающее вручную.</CardDescription>
          </div>
          <ValidationBadge status={document.validationStatus} score={document.qualityScore} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <DocumentMetadataGrid document={document} />
        <ClassificationBlock classification={document.classification ?? createUnknownDocumentClassification(document.createdAt)} />
        <EditableStructuredPreview preview={preview} setPreview={setPreview} document={document} />
        <TextPreview document={document} />
        <Button onClick={onConfirm} disabled={document.validationStatus === "invalid" || document.validationStatus === "requires_ocr"}>
          <CheckCircle2 className="h-4 w-4" />
          Подтвердить результат анализа
        </Button>
      </CardContent>
    </Card>
  );
}

function EditableStructuredPreview({
  preview,
  setPreview,
  document
}: {
  preview: DocumentStructuredPreview;
  setPreview: React.Dispatch<React.SetStateAction<DocumentStructuredPreview | null>>;
  document: NormalizedDocument;
}) {
  function updateEntity(groupKey: Exclude<keyof DocumentStructuredPreview, "events">, id: string, patch: Partial<DocumentEntityPreview>) {
    setPreview((current) => {
      if (!current) return current;
      return {
        ...current,
        [groupKey]: current[groupKey].map((item) => (item.id === id ? { ...item, ...patch } : item))
      };
    });
  }

  function removeEntity(groupKey: Exclude<keyof DocumentStructuredPreview, "events">, id: string) {
    setPreview((current) => current ? { ...current, [groupKey]: current[groupKey].filter((item) => item.id !== id) } : current);
  }

  function addEntity(groupKey: Exclude<keyof DocumentStructuredPreview, "events">, kind: DocumentEntityPreviewKind, title: string) {
    setPreview((current) => current ? { ...current, [groupKey]: [...current[groupKey], createManualEntity(document, kind, title)] } : current);
  }

  function updateEvent(id: string, patch: Partial<DocumentEventPreview>) {
    setPreview((current) => current ? { ...current, events: current.events.map((event) => (event.id === id ? { ...event, ...patch } : event)) } : current);
  }

  function removeEvent(id: string) {
    setPreview((current) => current ? { ...current, events: current.events.filter((event) => event.id !== id) } : current);
  }

  function addEvent() {
    setPreview((current) => current ? { ...current, events: [...current.events, createManualEvent(document)] } : current);
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        Preview можно редактировать и подтверждать, но он не импортируется в рабочие разделы. Это подготовка к следующему этапу безопасного импорта.
      </div>

      {entityGroups.map((group) => (
        <Card key={group.key}>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>{preview[group.key].length} записей</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => addEntity(group.key, group.kind, group.emptyTitle)}>
              Добавить вручную
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {preview[group.key].length === 0 ? (
              <EmptyState icon={FileSearch} title="Данные не найдены" description="Добавьте запись вручную, если она есть в документе." />
            ) : (
              preview[group.key].map((item) => (
                <EditableEntityCard
                  key={item.id}
                  item={item}
                  onChange={(patch) => updateEntity(group.key, item.id, patch)}
                  onDelete={() => removeEntity(group.key, item.id)}
                  onReject={() => updateEntity(group.key, item.id, { sourceState: "rejected" })}
                  onConfirm={() => updateEntity(group.key, item.id, { sourceState: item.value ? item.sourceState : "empty" })}
                />
              ))
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Мероприятия</CardTitle>
            <CardDescription>{preview.events.length} записей preview</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEvent}>
            Добавить мероприятие вручную
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {preview.events.length === 0 ? (
            <EmptyState icon={FileSearch} title="Мероприятия не найдены" description="Добавьте мероприятие вручную, если оно есть в документе." />
          ) : (
            preview.events.map((event) => (
              <EditableEventCard
                key={event.id}
                event={event}
                onChange={(patch) => updateEvent(event.id, patch)}
                onDelete={() => removeEvent(event.id)}
                onReject={() => updateEvent(event.id, { sourceState: "rejected" })}
                onConfirm={() => updateEvent(event.id, { sourceState: event.title ? event.sourceState : "empty" })}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EditableEntityCard({
  item,
  onChange,
  onDelete,
  onReject,
  onConfirm
}: {
  item: DocumentEntityPreview;
  onChange: (patch: Partial<DocumentEntityPreview>) => void;
  onDelete: () => void;
  onReject: () => void;
  onConfirm: () => void;
}) {
  const isRejected = item.sourceState === "rejected";

  return (
    <div className={`rounded-md border p-3 ${isRejected ? "bg-rose-50 opacity-80" : "bg-white"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.sourceState === "empty" ? "warning" : item.sourceState === "rejected" ? "secondary" : "outline"}>
            {sourceStateLabels[item.sourceState]}
          </Badge>
          <span className="text-xs text-muted-foreground">Уверенность: {item.confidence}%</span>
        </div>
        <PreviewActions onEdit={() => onChange({ sourceState: item.sourceState === "empty" ? "manual" : "edited" })} onDelete={onDelete} onReject={onReject} onConfirm={onConfirm} />
      </div>
      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Поле</span>
          <Input
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value, sourceState: item.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Значение</span>
          <Input
            value={item.value}
            placeholder="Не найдено в документе. Заполните вручную при необходимости"
            onChange={(event) => onChange({ value: event.target.value, sourceState: item.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{item.sourceFragment}</div>
    </div>
  );
}

function EditableEventCard({
  event,
  onChange,
  onDelete,
  onReject,
  onConfirm
}: {
  event: DocumentEventPreview;
  onChange: (patch: Partial<DocumentEventPreview>) => void;
  onDelete: () => void;
  onReject: () => void;
  onConfirm: () => void;
}) {
  const isRejected = event.sourceState === "rejected";

  return (
    <div className={`rounded-md border p-3 ${isRejected ? "bg-rose-50 opacity-80" : "bg-white"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={event.sourceState === "empty" ? "warning" : event.sourceState === "rejected" ? "secondary" : "outline"}>
            {sourceStateLabels[event.sourceState]}
          </Badge>
          <Badge variant={event.category === "REAL_EVENT" ? "success" : event.category === "NOISE" ? "secondary" : "warning"}>
            {event.category}
          </Badge>
          <span className="text-xs text-muted-foreground">Качество: {event.qualityScore}%</span>
        </div>
        <PreviewActions onEdit={() => onChange({ sourceState: event.sourceState === "empty" ? "manual" : "edited" })} onDelete={onDelete} onReject={onReject} onConfirm={onConfirm} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="font-medium">Название мероприятия</span>
          <Input
            value={event.title}
            placeholder="Название мероприятия"
            onChange={(inputEvent) => onChange({ title: inputEvent.target.value, sourceState: event.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Срок</span>
          <Input
            value={event.dateText}
            placeholder="Не найдено в документе"
            onChange={(inputEvent) => onChange({ dateText: inputEvent.target.value, sourceState: event.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Уровень образования</span>
          <Input
            value={event.educationLevels.join(", ")}
            placeholder="НОО, ООО или СОО"
            onChange={(inputEvent) => onChange({ educationLevels: splitCsv(inputEvent.target.value), sourceState: event.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Классы</span>
          <Input
            value={event.classesText}
            placeholder="Например: 1-4 классы"
            onChange={(inputEvent) => onChange({ classesText: inputEvent.target.value, sourceState: event.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Ответственный</span>
          <Input
            value={event.responsibleText}
            placeholder="Не найдено в документе"
            onChange={(inputEvent) => onChange({ responsibleText: inputEvent.target.value, sourceState: event.sourceState === "empty" ? "manual" : "edited" })}
          />
        </label>
      </div>
      <label className="mt-3 grid gap-1 text-sm">
        <span className="font-medium">Фрагмент документа</span>
        <Textarea
          value={event.sourceFragment}
          onChange={(inputEvent) => onChange({ sourceFragment: inputEvent.target.value, sourceState: event.sourceState === "empty" ? "manual" : "edited" })}
        />
      </label>
      <div className="mt-2 text-xs text-muted-foreground">{event.qualityReason}</div>
    </div>
  );
}

function PreviewActions({
  onEdit,
  onDelete,
  onReject,
  onConfirm
}: {
  onEdit: () => void;
  onDelete: () => void;
  onReject: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
        Редактировать
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
        Удалить
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onReject}>
        <XCircle className="h-4 w-4" />
        Отклонить
      </Button>
      <Button type="button" size="sm" onClick={onConfirm}>
        <CheckCircle2 className="h-4 w-4" />
        Подтвердить
      </Button>
    </div>
  );
}

function ProcessedDocumentCard({
  document,
  onConfirm,
  onApply
}: {
  document: DocumentProcessingRecord;
  onConfirm: () => void;
  onApply: () => void;
}) {
  const classification = document.classification ?? createUnknownDocumentClassification(document.createdAt);
  const preview = document.structuredPreview;
  const previewCount = countStructuredPreviewItems(preview);

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{document.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {sourceTypeLabels[document.sourceType]} · {document.fileType.toUpperCase()} · {formatDateTime(document.createdAt)}
          </div>
        </div>
        <ValidationBadge status={document.validationStatus} score={document.qualityScore} />
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
        <div>Текст: {document.textLength} симв.</div>
        <div>Разделов: {document.sectionCount}</div>
        <div>Таблиц: {document.tableCount}</div>
        <div>Списков: {document.listCount}</div>
      </div>
      <div className="mt-3 rounded-md border bg-slate-50 p-3 text-sm">
        <div className="font-medium">Тип документа: {documentKindLabels[classification.documentKind]}</div>
        <div className="mt-1 text-muted-foreground">Уверенность: {classification.confidence}%</div>
        <SignalList signals={classification.matchedSignals} />
      </div>
      <div className="mt-3 text-sm text-muted-foreground">Preview-сущностей найдено: {previewCount}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={document.confirmed ? "success" : "outline"}>{document.confirmed ? "Результат анализа подтвержден" : "Preview"}</Badge>
        {!document.confirmed && document.validationStatus !== "invalid" && document.validationStatus !== "requires_ocr" ? (
          <Button size="sm" variant="outline" onClick={onConfirm}>
            Подтвердить результат анализа
          </Button>
        ) : null}
        {document.confirmed ? (
          <Button size="sm" onClick={onApply}>
            Применить данные в систему
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EventApplyPanel({
  dryRun,
  selectedPreviewEventIds,
  importReport,
  isSaving,
  onToggle,
  onSelectAll,
  onApply
}: {
  dryRun: DocumentEventImportDryRun;
  selectedPreviewEventIds: string[];
  importReport: DocumentEventImportResult | null;
  isSaving: boolean;
  onToggle: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onApply: () => void;
}) {
  const importableItems = dryRun.items.filter((item) => item.status === "IMPORTABLE");
  const allImportableSelected =
    importableItems.length > 0 && importableItems.every((item) => selectedPreviewEventIds.includes(item.previewEvent.id));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Dry-run применения мероприятий</CardTitle>
        <CardDescription>
          Перед записью в рабочий реестр система показывает, что будет добавлено, что похоже на дубли и что будет пропущено.
          Без кнопки «Применить выбранные» данные в events не меняются.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Summary title="Будет добавлено" value={dryRun.importableCount} />
          <Summary title="Дубли" value={dryRun.duplicateCount} />
          <Summary title="Неполные" value={dryRun.incompleteCount} />
          <Summary title="Пропущено" value={dryRun.skippedCount} />
        </div>

        {importableItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onSelectAll(!allImportableSelected)}>
              {allImportableSelected ? "Снять выделение" : "Выбрать все IMPORTABLE"}
            </Button>
            <Button type="button" size="sm" disabled={isSaving || selectedPreviewEventIds.length === 0} onClick={onApply}>
              Применить выбранные
            </Button>
          </div>
        ) : null}

        {(["IMPORTABLE", "DUPLICATE", "INCOMPLETE", "SKIPPED"] as DocumentEventImportStatus[]).map((status) => (
          <DryRunSection
            key={status}
            title={importStatusLabels[status]}
            status={status}
            items={dryRun.items.filter((item) => item.status === status)}
            selectedPreviewEventIds={selectedPreviewEventIds}
            onToggle={onToggle}
          />
        ))}

        {importReport ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="font-semibold">Импорт завершен</div>
            <div className="mt-1">Добавлено мероприятий: {importReport.importedCount}</div>
            <div>Пропущено: {importReport.duplicateCount + importReport.incompleteCount + importReport.skippedCount}</div>
            <Button asChild className="mt-3" size="sm">
              <Link href="/events">Открыть мероприятия</Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DryRunSection({
  title,
  status,
  items,
  selectedPreviewEventIds,
  onToggle
}: {
  title: string;
  status: DocumentEventImportStatus;
  items: DocumentEventImportDryRunItem[];
  selectedPreviewEventIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
        <div className="font-medium">{title}</div>
        <Badge variant={status === "IMPORTABLE" ? "success" : status === "DUPLICATE" ? "warning" : "outline"}>
          {items.length}
        </Badge>
      </div>
      <div className="grid gap-3 p-4">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Записей нет.</div>
        ) : (
          items.map((item) => (
            <DryRunItem
              key={item.previewEvent.id}
              item={item}
              checked={selectedPreviewEventIds.includes(item.previewEvent.id)}
              onToggle={() => onToggle(item.previewEvent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DryRunItem({
  item,
  checked,
  onToggle
}: {
  item: DocumentEventImportDryRunItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const event = item.previewEvent;

  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <label className="flex gap-3">
          {item.status === "IMPORTABLE" ? (
            <input type="checkbox" className="mt-1 h-4 w-4" checked={checked} onChange={onToggle} />
          ) : null}
          <span>
            <span className="block font-medium">{event.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {event.sourceDocumentName} · качество {event.qualityScore}% · уверенность {event.confidence}%
            </span>
          </span>
        </label>
        <Badge variant={item.status === "IMPORTABLE" ? "success" : item.status === "DUPLICATE" ? "warning" : "outline"}>
          {item.status}
        </Badge>
      </div>
      <div className="mt-2 grid gap-1 text-sm text-muted-foreground md:grid-cols-3">
        <div>Срок: {event.dateText || "не найден"}</div>
        <div>Уровни: {event.educationLevels.join(", ") || "не найдены"}</div>
        <div>Ответственный: {event.responsibleText || "не найден"}</div>
      </div>
      <div className="mt-2 text-sm">{item.reason}</div>
      {item.duplicateEventTitle ? (
        <div className="mt-1 text-xs text-amber-700">Возможный дубль: {item.duplicateEventTitle}</div>
      ) : null}
    </div>
  );
}

function DocumentMetadataGrid({ document }: { document: NormalizedDocument }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Summary title="Тип файла" value={document.fileType.toUpperCase()} />
      <Summary title="Символов" value={document.metadata.characterCount} />
      <Summary title="Разделов" value={document.sections.length} />
      <Summary title="Таблиц" value={document.tables.length} />
      <Summary title="Списков" value={document.lists.length} />
      <Summary title="Страниц" value={document.metadata.pageCount ?? "—"} />
      <Summary title="Листов XLSX" value={document.metadata.sheetCount ?? "—"} />
      <Summary title="MIME" value={document.metadata.mimeType || "не определен"} />
    </div>
  );
}

function ClassificationBlock({ classification }: { classification: DocumentClassification }) {
  return (
    <div className="rounded-md border bg-slate-50 p-4">
      <div className="font-medium">Классификация документа</div>
      <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div>Тип документа: {documentKindLabels[classification.documentKind]}</div>
        <div>Уверенность: {classification.confidence}%</div>
      </div>
      <SignalList signals={classification.matchedSignals} />
    </div>
  );
}

function SignalList({ signals }: { signals: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1">
      {signals.length > 0 ? (
        signals.map((signal) => (
          <Badge key={signal} variant="outline" className="bg-white">
            {signal}
          </Badge>
        ))
      ) : (
        <span className="text-sm text-muted-foreground">Признаки не найдены. Документ требует ручной проверки.</span>
      )}
    </div>
  );
}

function TextPreview({ document }: { document: NormalizedDocument }) {
  const previewText = document.text.slice(0, 4000);

  return (
    <div className="rounded-md border bg-slate-50 p-4">
      <div className="mb-2 font-medium">Preview текста</div>
      <p className="max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {previewText || "Текст отсутствует или документ требует OCR."}
      </p>
    </div>
  );
}

function LogEntry({ entry }: { entry: DocumentProcessingLogEntry }) {
  return (
    <div className="rounded-md border bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={entry.level === "error" ? "secondary" : entry.level === "warning" ? "warning" : "outline"}>{entry.stage}</Badge>
        <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
      </div>
      <div className="mt-2 font-medium">{entry.fileName}</div>
      <div className="mt-1 text-muted-foreground">{entry.message}</div>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 break-words text-lg font-semibold">{value}</div>
    </div>
  );
}

function ValidationBadge({ status, score }: { status: DocumentValidationStatus; score: number }) {
  const className =
    status === "excellent" || status === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "needs_review"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return <span className={`rounded-md border px-2 py-1 text-xs font-medium ${className}`}>{validationLabels[status]} · {score}%</span>;
}

function toProcessingRecord(document: NormalizedDocument): DocumentProcessingRecord {
  return {
    id: document.id,
    fileName: document.fileName,
    fileType: document.fileType,
    sourceType: document.sourceType,
    title: document.title,
    createdAt: document.createdAt,
    qualityScore: document.qualityScore,
    validationStatus: document.validationStatus,
    warnings: document.warnings,
    textLength: document.text.length,
    sectionCount: document.sections.length,
    tableCount: document.tables.length,
    listCount: document.lists.length,
    classification: document.classification ?? createUnknownDocumentClassification(document.createdAt),
    extractedEventPreview: document.structuredPreview?.events ?? document.extractedEventPreview ?? [],
    structuredPreview: document.structuredPreview ?? createEmptyStructuredPreview(),
    confirmed: false
  };
}

function createEditablePreview(document: NormalizedDocument): DocumentStructuredPreview {
  return normalizeStructuredPreview(document.structuredPreview ?? createEmptyStructuredPreview(), document);
}

function normalizeStructuredPreview(preview: DocumentStructuredPreview, document: NormalizedDocument): DocumentStructuredPreview {
  return {
    schoolData: ensureRequiredSchoolData(preview.schoolData, document),
    educationModules: normalizeEntities(preview.educationModules),
    associations: normalizeEntities(preview.associations),
    socialPartners: normalizeEntities(preview.socialPartners),
    infrastructure: normalizeEntities(preview.infrastructure),
    responsiblePersons: normalizeEntities(preview.responsiblePersons),
    terms: normalizeEntities(preview.terms),
    educationLevels: normalizeEntities(preview.educationLevels),
    events: preview.events.map((event) => ({ ...event, sourceState: event.sourceState ?? "extracted" }))
  };
}

function ensureRequiredSchoolData(items: DocumentEntityPreview[], document: NormalizedDocument) {
  const required = ["Название школы", "Муниципалитет", "Регион", "Директор", "Заместитель директора по ВР", "Учебный год"];
  const normalizedItems = normalizeEntities(items);
  const existing = new Set(normalizedItems.map((item) => normalizeText(item.title)));
  const missing = required
    .filter((title) => !existing.has(normalizeText(title)))
    .map((title) => createManualEntity(document, "school_data", title, "empty"));

  return [...normalizedItems, ...missing];
}

function normalizeEntities(items: DocumentEntityPreview[]) {
  return items.map((item) => ({ ...item, sourceState: item.sourceState ?? (item.value ? "extracted" : "empty") }));
}

function createEmptyStructuredPreview(): DocumentStructuredPreview {
  return {
    schoolData: [],
    educationModules: [],
    associations: [],
    socialPartners: [],
    infrastructure: [],
    responsiblePersons: [],
    terms: [],
    educationLevels: [],
    events: []
  };
}

function createManualEntity(
  document: NormalizedDocument,
  kind: DocumentEntityPreviewKind,
  title: string,
  sourceState: DocumentPreviewSourceState = "manual"
): DocumentEntityPreview {
  return {
    id: `document-entity-preview-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind,
    title,
    value: "",
    sourceState,
    confidence: 0,
    sourceDocumentId: document.id,
    sourceDocumentName: document.fileName,
    sourceFragment: "Не найдено в документе. Заполните вручную при необходимости",
    matchedSignals: []
  };
}

function createManualEvent(document: NormalizedDocument): DocumentEventPreview {
  return {
    id: `document-event-preview-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "",
    sourceState: "manual",
    confidence: 0,
    category: "REAL_EVENT",
    qualityScore: 0,
    qualityReason: "Добавлено пользователем вручную в preview.",
    sourceDocumentId: document.id,
    sourceDocumentName: document.fileName,
    sourceType: document.sourceType,
    dateText: "",
    month: null,
    educationLevels: [],
    classesText: "",
    responsibleText: "",
    sourceFragment: "Добавлено вручную",
    matchedSignals: []
  };
}

function countStructuredPreviewItems(preview: DocumentStructuredPreview) {
  return (
    preview.schoolData.length +
    preview.educationModules.length +
    preview.associations.length +
    preview.socialPartners.length +
    preview.infrastructure.length +
    preview.responsiblePersons.length +
    preview.terms.length +
    preview.educationLevels.length +
    preview.events.length
  );
}

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
