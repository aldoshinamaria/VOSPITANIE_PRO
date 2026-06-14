"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Download, FileText, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createWorkProgramAssembler } from "@/lib/domain/work-program/work-program-assembler";
import { buildWorkProgramDocxBlob, buildWorkProgramPrintHtml, getWorkProgramDocxFileName } from "@/lib/domain/work-program/work-program-export";
import { createId } from "@/lib/utils";
import type {
  AppState,
  GeneratedParagraph,
  SchoolCultureSubsectionId,
  WorkProgram,
  WorkProgramReadinessStatus,
  WorkProgramSectionId,
  WorkProgramVersion
} from "@/types/domain";

export default function WorkProgramPage() {
  const { state, updateState, isSaving } = useAppState();
  const assembler = React.useMemo(() => createWorkProgramAssembler(), []);
  const program = React.useMemo(
    () => (state.workProgram?.progress ? state.workProgram : assembler.assemble(state, state.workProgram)),
    [assembler, state]
  );
  const [activeSectionId, setActiveSectionId] = React.useState<WorkProgramSectionId>("target");
  const [activeSubsectionId, setActiveSubsectionId] = React.useState<SchoolCultureSubsectionId>("school-profile");
  const [selectedVersionId, setSelectedVersionId] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const inputReadiness = React.useMemo(() => checkWorkProgramInputReadiness(state), [state]);
  const canShowProgram = inputReadiness.items.every((item) => item.done);

  const activeSection = program.sections.find((section) => section.id === activeSectionId) ?? program.sections[0];
  const activeCultureSubsection = program.schoolCulture.subsections.find((subsection) => subsection.id === activeSubsectionId);
  const selectedSectionVersions = React.useMemo(
    () => (activeSection ? program.sectionVersions?.[activeSection.id] ?? [] : []),
    [activeSection, program.sectionVersions]
  );
  const selectedVersion =
    selectedSectionVersions.find((version) => version.id === selectedVersionId) ?? selectedSectionVersions[0] ?? program.versions[0];

  React.useEffect(() => {
    setSelectedVersionId(selectedSectionVersions[0]?.id ?? "");
  }, [activeSectionId, selectedSectionVersions]);

  async function persistProgram(nextProgram: WorkProgram) {
    await updateState((current) => ({
      ...current,
      workProgram: nextProgram
    }));
  }

  async function updateParagraph(subsectionId: SchoolCultureSubsectionId, paragraphId: string, text: string) {
    await persistProgram({
      ...program,
      schoolCulture: {
        ...program.schoolCulture,
        subsections: program.schoolCulture.subsections.map((subsection) =>
          subsection.id === subsectionId
            ? {
                ...subsection,
                paragraphs: subsection.paragraphs.map((paragraph) =>
                  paragraph.id === paragraphId ? { ...paragraph, text, status: paragraph.status === "added" ? "added" : "edited" } : paragraph
                )
              }
            : subsection
        )
      },
      updatedAt: new Date().toISOString()
    });
    setMessage("Изменения сохранены. Для обновления карты полной программы нажмите «Пересобрать программу».");
  }

  async function addParagraph(subsectionId: SchoolCultureSubsectionId) {
    const nextParagraph: GeneratedParagraph = {
      id: createId("work-program-paragraph"),
      text: "Новый абзац. Уточните содержание раздела.",
      originalText: "",
      sources: [{ id: "manual", type: "template", title: "Добавлено пользователем" }],
      status: "added"
    };

    await persistProgram({
      ...program,
      schoolCulture: {
        ...program.schoolCulture,
        subsections: program.schoolCulture.subsections.map((subsection) =>
          subsection.id === subsectionId ? { ...subsection, paragraphs: [...subsection.paragraphs, nextParagraph] } : subsection
        )
      },
      updatedAt: new Date().toISOString()
    });
  }

  async function removeParagraph(subsectionId: SchoolCultureSubsectionId, paragraphId: string) {
    await persistProgram({
      ...program,
      schoolCulture: {
        ...program.schoolCulture,
        subsections: program.schoolCulture.subsections.map((subsection) =>
          subsection.id === subsectionId
            ? {
                ...subsection,
                paragraphs: subsection.paragraphs.map((paragraph) =>
                  paragraph.id === paragraphId ? { ...paragraph, status: "removed" } : paragraph
                )
              }
            : subsection
        )
      },
      updatedAt: new Date().toISOString()
    });
  }

  async function restoreParagraph(subsectionId: SchoolCultureSubsectionId, paragraphId: string) {
    await persistProgram({
      ...program,
      schoolCulture: {
        ...program.schoolCulture,
        subsections: program.schoolCulture.subsections.map((subsection) =>
          subsection.id === subsectionId
            ? {
                ...subsection,
                paragraphs: subsection.paragraphs.map((paragraph) =>
                  paragraph.id === paragraphId ? { ...paragraph, text: paragraph.originalText || paragraph.text, status: "generated" } : paragraph
                )
              }
            : subsection
        )
      },
      updatedAt: new Date().toISOString()
    });
  }

  async function rebuildFullProgram() {
    await updateState((current) => ({
      ...current,
      workProgram: assembler.rebuildFullProgram(current, current.workProgram ?? assembler.assemble(current))
    }));
    setMessage("Рабочая программа пересобрана из актуальных данных. Для каждого раздела создана новая версия.");
  }

  async function rebuildSelectedSection() {
    if (!activeSection) {
      return;
    }

    await updateState((current) => ({
      ...current,
      workProgram: assembler.rebuildSection(current, current.workProgram ?? assembler.assemble(current), activeSection.id)
    }));
    setMessage(`Раздел «${activeSection.title}» пересобран из актуальных данных.`);
  }

  async function restoreVersion(version: WorkProgramVersion) {
    if (version.sectionId === "school-culture" && version.section) {
      await persistProgram({
        ...program,
        schoolCulture: version.section,
        updatedAt: new Date().toISOString()
      });
      setMessage(`Восстановлена версия: ${version.title}.`);
      return;
    }

    if (!version.subsections?.length) {
      return;
    }

    const nextSections = program.sections.map((section) =>
      section.id === version.sectionId
        ? {
            ...section,
            subsections: version.subsections ?? section.subsections,
            progress: version.progress ?? section.progress
          }
        : section
    );

    await persistProgram({
      ...program,
      sections: nextSections,
      progress: calculateProgramProgress(nextSections),
      updatedAt: new Date().toISOString()
    });
    setMessage(`Восстановлена версия раздела: ${version.title}.`);
  }

  async function exportDocx() {
    const blob = await buildWorkProgramDocxBlob(program);
    downloadBlob(blob, getWorkProgramDocxFileName(program));
  }

  function exportPdf() {
    const popup = window.open("", "_blank");

    if (!popup) {
      setMessage("Браузер заблокировал окно печати. Разрешите всплывающие окна и повторите экспорт PDF.");
      return;
    }

    popup.document.write(buildWorkProgramPrintHtml(program));
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <>
      <PageHeader
        title="Рабочая программа воспитания"
        description="Центральный документ системы: программа собирается из паспорта школы, воспитательной системы, модулей, мероприятий, КПВР и внеурочной деятельности."
        actions={
          <>
            <Button variant="outline" onClick={rebuildSelectedSection} disabled={isSaving || !activeSection || !canShowProgram}>
              <RefreshCw className="h-4 w-4" />
              Раздел
            </Button>
            <Button variant="outline" onClick={rebuildFullProgram} disabled={isSaving || !canShowProgram}>
              <RefreshCw className="h-4 w-4" />
              Программа
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={!canShowProgram}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button onClick={exportDocx} disabled={!canShowProgram}>
              <Download className="h-4 w-4" />
              DOCX
            </Button>
          </>
        }
      />

      {message ? <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}

      {!canShowProgram ? (
        <WorkProgramReadinessScreen readiness={inputReadiness} />
      ) : (
        <>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCardLike title="Готовность программы" value={`${program.progress.percent}%`} />
        <MetricCardLike title="Разделов" value={program.sections.length} />
        <MetricCardLike title="Абзацев" value={countFullParagraphs(program)} />
        <MetricCardLike title="Учебный год" value={program.academicYear} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Структура программы</CardTitle>
            <CardDescription>Разделы соответствуют структуре рабочей программы воспитания. Готовность считается по данным и необходимости проверки.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {program.sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`rounded-md border px-3 py-3 text-left transition ${
                  activeSection?.id === section.id ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => setActiveSectionId(section.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{section.title}</span>
                  <span className="text-sm">{section.progress.percent}%</span>
                </div>
                <div className={activeSection?.id === section.id ? "mt-1 text-xs text-slate-200" : "mt-1 text-xs text-muted-foreground"}>
                  {readinessLabel(section.progress.status)}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{activeSection?.title}</CardTitle>
                <CardDescription>
                  Источники и статус показываются для каждого подраздела и абзаца. Это карта происхождения текста для будущего ИИ-конструктора.
                </CardDescription>
              </div>
              {activeSection ? <ReadinessBadge status={activeSection.progress.status} percent={activeSection.progress.percent} /> : null}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {!activeSection ? (
              <EmptyState icon={FileText} title="Раздел не выбран" description="Выберите раздел программы слева." />
            ) : (
              activeSection.subsections.map((subsection) => (
                <div key={subsection.id} className="rounded-md border bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{subsection.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Источники: {sourceList(subsection.sources)}</div>
                    </div>
                    <ReadinessBadge status={subsection.progress.status} percent={subsection.progress.percent} />
                  </div>
                  <div className="grid gap-3">
                    {subsection.generatedContent.map((paragraph, index) => (
                      <div key={paragraph.id} className="rounded-md bg-slate-50 p-3 text-sm">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Абзац {index + 1}</Badge>
                          <ReadinessBadge status={paragraph.readiness} />
                        </div>
                        <p className="leading-6">{paragraph.text}</p>
                        <div className="mt-2 text-xs text-muted-foreground">Источник: {sourceList(paragraph.sources)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Редактор подраздела «Уклад школы»</CardTitle>
            <CardDescription>Этот блок остается редактируемым вручную: можно изменить, удалить, добавить абзац и восстановить автотекст.</CardDescription>
          </div>
          {activeCultureSubsection ? (
            <Button variant="outline" onClick={() => addParagraph(activeCultureSubsection.id)}>
              <Plus className="h-4 w-4" />
              Абзац
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <div className="grid gap-2 self-start">
            {program.schoolCulture.subsections.map((subsection) => (
              <Button
                key={subsection.id}
                variant={activeSubsectionId === subsection.id ? "default" : "outline"}
                className="justify-start"
                onClick={() => setActiveSubsectionId(subsection.id)}
              >
                {subsection.title}
              </Button>
            ))}
          </div>
          <div className="grid gap-4">
            {!activeCultureSubsection ? (
              <EmptyState icon={FileText} title="Подраздел не выбран" description="Выберите подраздел слева." />
            ) : (
              activeCultureSubsection.paragraphs.map((paragraph, index) => (
                <div key={paragraph.id} className="rounded-md border bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Абзац {index + 1}</Badge>
                      <Badge variant="outline">{paragraphStatusLabel(paragraph.status)}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => restoreParagraph(activeCultureSubsection.id, paragraph.id)}>
                        <RotateCcw className="h-4 w-4" />
                        Восстановить
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeParagraph(activeCultureSubsection.id, paragraph.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {paragraph.status === "removed" ? (
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Абзац удален из текущей версии.</div>
                  ) : (
                    <Textarea value={paragraph.text} onChange={(event) => updateParagraph(activeCultureSubsection.id, paragraph.id, event.target.value)} rows={5} />
                  )}
                  <div className="mt-3 text-xs text-muted-foreground">Источник: {sourceList(paragraph.sources)}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Версии выбранного раздела</CardTitle>
          <CardDescription>Каждая пересборка создает версию. По версии видно, какие источники повлияли на текст.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Select value={selectedVersion?.id ?? ""} onChange={(event) => setSelectedVersionId(event.target.value)}>
            {selectedSectionVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.title} - {version.changeSummary}
              </option>
            ))}
          </Select>
          {selectedVersion ? (
            <div className="rounded-md border bg-slate-50 p-4 text-sm">
              <div className="font-medium">{selectedVersion.changeSummary}</div>
              <div className="mt-1 text-muted-foreground">Источники версии: {selectedVersion.sourceSummary.join(", ") || "не указаны"}</div>
              {selectedVersion.progress ? <div className="mt-1 text-muted-foreground">Готовность версии: {selectedVersion.progress.percent}%</div> : null}
              <Button className="mt-3" variant="outline" onClick={() => restoreVersion(selectedVersion)}>
                Восстановить выбранную версию
              </Button>
            </div>
          ) : (
            <EmptyState icon={FileText} title="Версий пока нет" description="Пересоберите раздел или программу." />
          )}
        </CardContent>
      </Card>
        </>
      )}
    </>
  );
}

interface WorkProgramInputReadinessItem {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  done: boolean;
}

interface WorkProgramInputReadiness {
  percent: number;
  items: WorkProgramInputReadinessItem[];
}

function WorkProgramReadinessScreen({ readiness }: { readiness: WorkProgramInputReadiness }) {
  const missingItems = readiness.items.filter((item) => !item.done);

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle>Рабочая программа пока не сформирована</CardTitle>
        <CardDescription>
          Система не показывает шаблон как готовый документ. Сначала заполните обязательные данные школы, затем программа будет собрана из реальных источников.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="rounded-md border border-amber-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Готовность исходных данных</div>
              <div className="mt-1 text-3xl font-semibold">{readiness.percent}%</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Не хватает данных: {missingItems.length}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-600" style={{ width: `${readiness.percent}%` }} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {readiness.items.map((item) => {
            const Icon = item.done ? CheckCircle2 : Circle;

            return (
              <div key={item.id} className="rounded-md border bg-white p-4">
                <div className="flex items-start gap-3">
                  <Icon className={item.done ? "mt-0.5 h-5 w-5 text-emerald-700" : "mt-0.5 h-5 w-5 text-slate-400"} />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full justify-start">
                  <Link href={item.href}>{item.action}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function checkWorkProgramInputReadiness(state: AppState): WorkProgramInputReadiness {
  const passport = state.schoolPassport;
  const hasPassport = Boolean(
    passport.name &&
      passport.region &&
      passport.municipality &&
      passport.address &&
      passport.principal &&
      passport.deputyDirector &&
      passport.studentsCount > 0 &&
      passport.classesCount > 0
  );
  const hasInfrastructure = state.educationalSystem.infrastructureObjects.length > 0 || Object.values(passport.infrastructure).some(Boolean);
  const hasAssociations = state.educationalSystem.associations.some((association) => association.status === "active");
  const hasEducationalSystem = hasInfrastructure || hasAssociations;
  const hasPartners = state.schoolPassport.socialPartners.length + state.educationalSystem.partners.length > 0;
  const hasEvents = state.events.length > 0;
  const hasExtraActivities = state.extraActivities.length > 0;
  const hasKpvrData =
    hasEvents &&
    state.events.every((event) => event.title && event.moduleId && event.startDate && event.responsible && event.educationLevels.length > 0);

  const items: WorkProgramInputReadinessItem[] = [
    {
      id: "passport",
      title: "Паспорт школы",
      description: hasPassport ? "Основные сведения заполнены." : "Заполните название, регион, адрес, руководство, учебный год и контингент.",
      href: "/school-passport",
      action: "Открыть паспорт",
      done: hasPassport
    },
    {
      id: "educational-system",
      title: "Воспитательная система",
      description: hasEducationalSystem ? "Есть объединения или инфраструктура." : "Добавьте объединения, музей, ЦДИ, медиацентр или другие ресурсы.",
      href: "/educational-system",
      action: "Открыть систему",
      done: hasEducationalSystem
    },
    {
      id: "partners",
      title: "Социальные партнеры",
      description: hasPartners ? "Партнеры добавлены." : "Добавьте хотя бы одного партнера в паспорт школы или воспитательную систему.",
      href: "/school-passport",
      action: "Добавить партнеров",
      done: hasPartners
    },
    {
      id: "events",
      title: "Мероприятия",
      description: hasEvents ? "Реестр содержит мероприятия." : "Добавьте мероприятия, которые станут источником КПВР и традиций школы.",
      href: "/events",
      action: "Открыть мероприятия",
      done: hasEvents
    },
    {
      id: "extra-activities",
      title: "Внеурочная деятельность",
      description: hasExtraActivities ? "Программы внеурочной деятельности добавлены." : "Добавьте курсы или программы дополнительного образования.",
      href: "/extra-activities",
      action: "Открыть внеурочную деятельность",
      done: hasExtraActivities
    },
    {
      id: "kpvr",
      title: "КПВР",
      description: hasKpvrData ? "Данных достаточно для КПВР." : "Проверьте, что у мероприятий есть модуль, дата, ответственный и уровень образования.",
      href: "/kpvr",
      action: "Открыть КПВР",
      done: hasKpvrData
    }
  ];

  return {
    items,
    percent: Math.round((items.filter((item) => item.done).length / items.length) * 100)
  };
}

function MetricCardLike({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ReadinessBadge({ status, percent }: { status: WorkProgramReadinessStatus; percent?: number }) {
  const className =
    status === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "needs_review"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
      {readinessLabel(status)}
      {typeof percent === "number" ? ` · ${percent}%` : ""}
    </span>
  );
}

function countFullParagraphs(program: WorkProgram) {
  return program.sections.reduce(
    (sum, section) => sum + section.subsections.reduce((sectionSum, subsection) => sectionSum + subsection.generatedContent.length, 0),
    0
  );
}

function calculateProgramProgress(sections: WorkProgram["sections"]) {
  const percent = Math.round(sections.reduce((sum, section) => sum + section.progress.percent, 0) / Math.max(sections.length, 1));
  const missingData = sections.flatMap((section) => section.progress.missingData);
  const reviewNotes = sections.flatMap((section) => section.progress.reviewNotes);

  return {
    percent,
    status: missingData.length > 0 ? "needs_data" : reviewNotes.length > 0 ? "needs_review" : "ready",
    missingData,
    reviewNotes
  } as WorkProgram["progress"];
}

function paragraphStatusLabel(status: GeneratedParagraph["status"]) {
  const labels: Record<GeneratedParagraph["status"], string> = {
    generated: "Сформирован",
    edited: "Изменен",
    added: "Добавлен",
    removed: "Удален"
  };

  return labels[status];
}

function readinessLabel(status: WorkProgramReadinessStatus) {
  const labels: Record<WorkProgramReadinessStatus, string> = {
    ready: "Готово",
    needs_data: "Требует заполнения",
    needs_review: "Требует проверки"
  };

  return labels[status];
}

function sourceList(sources: Array<{ title: string }>) {
  return sources.length > 0 ? sources.map((source) => source.title).join(", ") : "источник не указан";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
