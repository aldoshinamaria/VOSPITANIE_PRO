"use client";

import { CheckCircle2, FileSearch, FileUp, ShieldAlert, TimerReset } from "lucide-react";
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
import { createDocumentProcessingPipeline } from "@/lib/domain/document-processing/pipeline";
import type {
  DocumentProcessingLogEntry,
  DocumentProcessingRecord,
  DocumentSourceType,
  DocumentValidationStatus,
  NormalizedDocument
} from "@/types/domain";

const sourceTypeLabels: Record<DocumentSourceType, string> = {
  import: "Импорт документов",
  normative: "Нормативный центр",
  "work-program": "Рабочая программа",
  kpvr: "КПВР",
  local: "Локальный документ"
};

const validationLabels: Record<DocumentValidationStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  needs_review: "Needs Review",
  invalid: "Invalid",
  requires_ocr: "Требуется OCR"
};

export default function DocumentProcessingPage() {
  const { state, updateState, isSaving } = useAppState();
  const pipeline = React.useMemo(() => createDocumentProcessingPipeline(), []);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [sourceType, setSourceType] = React.useState<DocumentSourceType>("import");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<NormalizedDocument | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const result = await pipeline.process(file, sourceType);
      const record = toProcessingRecord(result.normalizedDocument);

      setSelectedDocument(result.normalizedDocument);
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

  async function confirmDocument(id: string) {
    await updateState((current) => ({
      ...current,
      processedDocuments: current.processedDocuments.map((document) =>
        document.id === id ? { ...document, confirmed: true } : document
      )
    }));
  }

  return (
    <>
      <PageHeader
        title="Документный движок"
        description="Production-ready слой обработки документов: хранение файла, извлечение текста, структура, нормализация, валидация и подготовка данных для будущего AI-анализа."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Обработано" value={state.processedDocuments.length} icon={FileSearch} />
        <MetricCard title="Подтверждено" value={state.processedDocuments.filter((document) => document.confirmed).length} icon={CheckCircle2} />
        <MetricCard title="Требуют проверки" value={state.processedDocuments.filter((document) => document.validationStatus === "needs_review").length} icon={ShieldAlert} />
        <MetricCard title="Журнал" value={state.documentProcessingLogs.length} icon={TimerReset} />
      </div>

      {error ? <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Проверить документ</CardTitle>
          <CardDescription>Поддерживаются DOCX, текстовый PDF, XLSX. Сканированный PDF определяется автоматически и получает статус «Требуется OCR».</CardDescription>
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
            <span className="mt-2 text-sm font-medium">{isProcessing ? "Документ обрабатывается..." : "Выберите DOCX, PDF или XLSX до 50 МБ"}</span>
            <span className="mt-1 text-xs text-muted-foreground">Данные не попадут в КПВР, РПВ или нормативный центр без ручного подтверждения</span>
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

      {selectedDocument ? (
        <DocumentReview document={selectedDocument} onConfirm={() => confirmDocument(selectedDocument.id)} />
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Индекс обработанных документов</CardTitle>
            <CardDescription>Здесь хранятся только результаты проверки и подтверждения, а не автоматические изменения данных школы.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {state.processedDocuments.length === 0 ? (
              <EmptyState icon={FileSearch} title="Документы не обработаны" description="Загрузите тестовый DOCX, PDF или XLSX для проверки движка." />
            ) : (
              state.processedDocuments.map((document) => (
                <ProcessedDocumentCard key={document.id} document={document} onConfirm={() => confirmDocument(document.id)} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Журнал обработки</CardTitle>
            <CardDescription>Пользователь видит, когда документ загружен, обработан, какие были предупреждения и ошибки.</CardDescription>
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
    </>
  );
}

function DocumentReview({ document, onConfirm }: { document: NormalizedDocument; onConfirm: () => void }) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Экран проверки: {document.title}</CardTitle>
            <CardDescription>Перед использованием пользователь должен проверить качество извлечения и подтвердить документ вручную.</CardDescription>
          </div>
          <ValidationBadge status={document.validationStatus} score={document.qualityScore} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Summary title="Символов" value={document.metadata.characterCount} />
          <Summary title="Разделов" value={document.sections.length} />
          <Summary title="Таблиц" value={document.tables.length} />
          <Summary title="Списков" value={document.lists.length} />
        </div>
        <ReviewBlock title="Что найдено" items={buildFoundItems(document)} />
        <ReviewBlock title="Что не удалось извлечь" items={buildMissingItems(document)} />
        <ReviewBlock title="Что вызывает сомнения" items={document.warnings.length > 0 ? document.warnings : ["Критичных сомнений не обнаружено."]} />
        <ReviewBlock title="Что требует ручной проверки" items={buildManualReviewItems(document)} />
        <div className="rounded-md border bg-slate-50 p-4">
          <div className="mb-2 font-medium">Предпросмотр текста</div>
          <p className="max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">{document.text.slice(0, 4000) || "Текст отсутствует."}</p>
        </div>
        <Button onClick={onConfirm} disabled={document.validationStatus === "invalid" || document.validationStatus === "requires_ocr"}>
          <CheckCircle2 className="h-4 w-4" />
          Подтвердить данные документа
        </Button>
      </CardContent>
    </Card>
  );
}

function ProcessedDocumentCard({ document, onConfirm }: { document: DocumentProcessingRecord; onConfirm: () => void }) {
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
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <div>Разделов: {document.sectionCount}</div>
        <div>Таблиц: {document.tableCount}</div>
        <div>Списков: {document.listCount}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={document.confirmed ? "success" : "outline"}>{document.confirmed ? "Подтвержден" : "Не подтвержден"}</Badge>
        {!document.confirmed && document.validationStatus !== "invalid" && document.validationStatus !== "requires_ocr" ? (
          <Button size="sm" variant="outline" onClick={onConfirm}>
            Подтвердить
          </Button>
        ) : null}
      </div>
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

function ReviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border p-4">
      <div className="font-medium">{title}</div>
      <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
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
    confirmed: false
  };
}

function buildFoundItems(document: NormalizedDocument) {
  return [
    `Текст: ${document.metadata.characterCount} символов, ${document.metadata.wordCount} слов.`,
    `Разделы: ${document.sections.length}.`,
    `Таблицы: ${document.tables.length}.`,
    `Списки: ${document.lists.length}.`,
    document.metadata.hasAppendices ? "Приложения обнаружены." : "Приложения не обнаружены."
  ];
}

function buildMissingItems(document: NormalizedDocument) {
  const items = [];

  if (document.validationStatus === "requires_ocr") {
    items.push("Текст сканированного PDF не извлечен. Требуется OCR.");
  }

  if (document.sections.length === 0) {
    items.push("Структура разделов не найдена.");
  }

  if (document.fileType === "xlsx" && document.tables.length === 0) {
    items.push("Табличные диапазоны XLSX не найдены.");
  }

  return items.length > 0 ? items : ["Критичных потерь извлечения не обнаружено."];
}

function buildManualReviewItems(document: NormalizedDocument) {
  return [
    "Проверить корректность заголовков и границ разделов.",
    "Проверить таблицы и списки перед передачей в КПВР, рабочую программу или нормативный центр.",
    document.validationStatus === "needs_review" ? "Документ требует ручной проверки качества." : "Документ можно использовать после подтверждения пользователем."
  ];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
