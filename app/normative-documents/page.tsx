"use client";

import { AlertTriangle, CheckCircle2, FileCheck2, GitCompareArrows, Upload, XCircle } from "lucide-react";
import * as React from "react";

import { FormField, FieldLabel } from "@/components/app/form-field";
import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createNormativeDocumentAnalyzer } from "@/lib/domain/normative-center";
import type {
  NormativeDocument,
  NormativeDocumentActualityStatus,
  NormativeDocumentCategory,
  NormativeDocumentComparison,
  WorkProgramComplianceResult
} from "@/types/domain";

const categoryLabels: Record<NormativeDocumentCategory, string> = {
  federal_work_program: "Федеральная рабочая программа воспитания",
  federal_calendar_plan: "Федеральный календарный план",
  regional_document: "Региональный документ",
  municipal_document: "Муниципальный документ",
  local_school_document: "Локальный документ школы"
};

const actualityLabels: Record<NormativeDocumentActualityStatus, string> = {
  current: "Актуален",
  needs_review: "Требует проверки",
  outdated: "Устарел"
};

const levelLabels = {
  federal: "Федеральный",
  regional: "Региональный",
  municipal: "Муниципальный",
  local: "Локальный"
} as const;

export default function NormativeDocumentsPage() {
  const { state, updateState, isSaving } = useAppState();
  const analyzer = React.useMemo(() => createNormativeDocumentAnalyzer(), []);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<NormativeDocumentCategory>("federal_work_program");
  const [documentDate, setDocumentDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [version, setVersion] = React.useState("");
  const [source, setSource] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [documentAId, setDocumentAId] = React.useState("");
  const [documentBId, setDocumentBId] = React.useState("");
  const [comparison, setComparison] = React.useState<NormativeDocumentComparison | null>(null);
  const [compliance, setCompliance] = React.useState<WorkProgramComplianceResult | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const documents = state.normativeDocuments;
  const documentA = documents.find((document) => document.id === documentAId);
  const documentB = documents.find((document) => document.id === documentBId);

  async function addDocument(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !file) {
      setMessage("Укажите название документа и выберите файл.");
      return;
    }

    const nextDocument = analyzer.createDocument({
      title: title.trim(),
      category,
      documentDate,
      version: version.trim() || "1.0",
      source: source.trim() || "Не указан",
      fileName: file.name,
      fileType: file.name.split(".").pop()?.toLowerCase() ?? "",
      sizeBytes: file.size
    });

    await updateState((current) => ({
      ...current,
      normativeDocuments: [nextDocument, ...current.normativeDocuments]
    }));

    setTitle("");
    setVersion("");
    setSource("");
    setFile(null);
    setMessage("Нормативный документ добавлен. Требования сформированы rule-based анализатором.");
  }

  async function updateActualityStatus(id: string, actualityStatus: NormativeDocumentActualityStatus) {
    await updateState((current) => ({
      ...current,
      normativeDocuments: current.normativeDocuments.map((document) =>
        document.id === id ? { ...document, actualityStatus } : document
      )
    }));
  }

  async function removeDocument(id: string) {
    await updateState((current) => ({
      ...current,
      normativeDocuments: current.normativeDocuments.filter((document) => document.id !== id)
    }));
    setComparison(null);
    setCompliance(null);
  }

  function compareDocuments() {
    if (!documentA || !documentB) {
      setMessage("Выберите два документа для сравнения.");
      return;
    }

    setComparison(analyzer.compare(documentA, documentB));
    setMessage(null);
  }

  function checkWorkProgram() {
    setCompliance(analyzer.checkWorkProgram(state));
    setMessage(null);
  }

  return (
    <>
      <PageHeader
        title="Нормативные документы"
        description="Нормативный центр помогает отслеживать изменения документов и проверять рабочую программу воспитания, КПВР и воспитательную систему школы."
        actions={
          <Button onClick={checkWorkProgram} disabled={documents.length === 0}>
            <FileCheck2 className="h-4 w-4" />
            Проверить рабочую программу
          </Button>
        }
      />

      {message ? <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Документов" value={documents.length} />
        <MetricCard title="Актуальных" value={documents.filter((document) => document.actualityStatus === "current").length} />
        <MetricCard title="Требуют проверки" value={documents.filter((document) => document.actualityStatus === "needs_review").length} />
        <MetricCard title="Требований" value={documents.reduce((sum, document) => sum + document.requirements.length, 0)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Добавить документ</CardTitle>
            <CardDescription>Файл сохраняется как метаданные. Содержимое пока не анализируется: требования создаются rule-based анализатором по типу документа.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={addDocument}>
              <FormField label="Название" value={title} onChange={(event) => setTitle(event.target.value)} required />
              <label className="grid gap-2 text-sm font-medium">
                <FieldLabel label="Тип документа" required />
                <Select value={category} onChange={(event) => setCategory(event.target.value as NormativeDocumentCategory)}>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <FormField label="Дата документа" type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} required />
              <FormField label="Версия" value={version} onChange={(event) => setVersion(event.target.value)} placeholder="Например: 2026.1" />
              <FormField label="Источник" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Минпросвещения, регион, школа" />
              <label className="grid gap-2 text-sm font-medium">
                <FieldLabel label="Файл" required />
                <Input type="file" accept=".docx,.pdf,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
              <Button type="submit" disabled={isSaving}>
                <Upload className="h-4 w-4" />
                Добавить документ
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Реестр нормативных документов</CardTitle>
            <CardDescription>Документы можно помечать как актуальные, требующие проверки или устаревшие.</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState icon={FileCheck2} title="Документы не добавлены" description="Загрузите федеральную программу, календарный план или локальный документ школы." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="px-3 py-2">Название</th>
                      <th className="px-3 py-2">Уровень</th>
                      <th className="px-3 py-2">Дата</th>
                      <th className="px-3 py-2">Версия</th>
                      <th className="px-3 py-2">Источник</th>
                      <th className="px-3 py-2">Актуальность</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id} className="border-b align-top">
                        <td className="px-3 py-3">
                          <div className="font-medium">{document.title}</div>
                          <div className="text-xs text-muted-foreground">{categoryLabels[document.category]}</div>
                        </td>
                        <td className="px-3 py-3">{levelLabels[document.level]}</td>
                        <td className="px-3 py-3">{formatDate(document.documentDate)}</td>
                        <td className="px-3 py-3">{document.version}</td>
                        <td className="px-3 py-3">{document.source}</td>
                        <td className="px-3 py-3">
                          <Select value={document.actualityStatus} onChange={(event) => updateActualityStatus(document.id, event.target.value as NormativeDocumentActualityStatus)}>
                            {Object.entries(actualityLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => removeDocument(document.id)}>
                            Удалить
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Сравнить документы</CardTitle>
            <CardDescription>Сравнение показывает добавленные, удаленные и измененные требования между двумя нормативными документами.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DocumentSelect label="Документ А" value={documentAId} documents={documents} onChange={setDocumentAId} />
            <DocumentSelect label="Документ Б" value={documentBId} documents={documents} onChange={setDocumentBId} />
            <Button variant="outline" onClick={compareDocuments} disabled={documents.length < 2}>
              <GitCompareArrows className="h-4 w-4" />
              Сравнить документы
            </Button>
            {comparison ? <ComparisonView comparison={comparison} documents={documents} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Проверка рабочей программы</CardTitle>
            <CardDescription>Проверяются рабочая программа воспитания, КПВР и воспитательная система школы.</CardDescription>
          </CardHeader>
          <CardContent>
            {!compliance ? (
              <EmptyState icon={FileCheck2} title="Проверка не выполнена" description="Нажмите «Проверить рабочую программу», чтобы получить расхождения и рекомендации." />
            ) : (
              <ComplianceView result={compliance} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DocumentSelect({
  label,
  value,
  documents,
  onChange
}: {
  label: string;
  value: string;
  documents: NormativeDocument[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <FieldLabel label={label} />
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Выберите документ</option>
        {documents.map((document) => (
          <option key={document.id} value={document.id}>
            {document.title}
          </option>
        ))}
      </Select>
    </label>
  );
}

function ComparisonView({ comparison, documents }: { comparison: NormativeDocumentComparison; documents: NormativeDocument[] }) {
  return (
    <div className="grid gap-3">
      <div className="text-sm text-muted-foreground">
        Сравнение: {documents.find((document) => document.id === comparison.documentAId)?.title} →{" "}
        {documents.find((document) => document.id === comparison.documentBId)?.title}
      </div>
      <ChangeGroup title="Что добавлено" changes={comparison.added} />
      <ChangeGroup title="Что удалено" changes={comparison.removed} />
      <ChangeGroup title="Что изменено" changes={comparison.changed} />
    </div>
  );
}

function ChangeGroup({ title, changes }: { title: string; changes: NormativeDocumentComparison["added"] }) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 font-medium">{title}</div>
      {changes.length === 0 ? (
        <div className="text-sm text-muted-foreground">Нет изменений.</div>
      ) : (
        <div className="grid gap-2">
          {changes.map((change) => (
            <div key={change.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="font-medium">{change.title}</div>
              <div className="mt-1 text-muted-foreground">{change.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplianceView({ result }: { result: WorkProgramComplianceResult }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-md border bg-slate-50 p-4">
        {result.status === "compliant" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : result.status === "needs_update" ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
        <div>
          <div className="font-medium">{complianceStatusLabel(result.status)}</div>
          <div className="text-sm text-muted-foreground">Проверено: {formatDateTime(result.checkedAt)}</div>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="font-medium">Расхождения</div>
        {result.discrepancies.length === 0 ? (
          <div className="text-sm text-muted-foreground">Расхождения не найдены.</div>
        ) : (
          result.discrepancies.map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.section}</Badge>
                <Badge variant="outline">{complianceStatusLabel(item.status)}</Badge>
              </div>
              <div className="mt-2 font-medium">{item.title}</div>
              <div className="mt-1 text-muted-foreground">{item.description}</div>
              <div className="mt-2 text-xs text-muted-foreground">Источник: {item.sourceTitle}</div>
            </div>
          ))
        )}
      </div>
      <div className="grid gap-3">
        <div className="font-medium">Рекомендации</div>
        {result.recommendations.map((recommendation) => (
          <div key={recommendation.id} className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
            <div className="font-medium">{recommendation.title}</div>
            <div className="mt-1">{recommendation.description}</div>
            <div className="mt-2 text-xs">Рекомендуется обновить: {recommendation.targetSection}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function complianceStatusLabel(status: WorkProgramComplianceResult["status"]) {
  const labels = {
    compliant: "Соответствует",
    needs_update: "Требует обновления",
    has_discrepancies: "Есть расхождения"
  } as const;

  return labels[status];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU").format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
