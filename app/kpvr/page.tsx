"use client";

import { useMemo, useState } from "react";
import { ClipboardList, GraduationCap, School } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { ScenarioReadiness } from "@/components/app/scenario-readiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildKpvrDocument, formatKpvrPeriod } from "@/lib/domain/kpvr";
import { cn } from "@/lib/utils";
import type { EducationLevel } from "@/types/domain";

const kpvrTabs: Array<{
  level: EducationLevel;
  title: string;
}> = [
  { level: "noo", title: "КПВР НОО" },
  { level: "ooo", title: "КПВР ООО" },
  { level: "soo", title: "КПВР СОО" }
];

export default function KpvrPage() {
  const { state } = useAppState();
  const [activeLevel, setActiveLevel] = useState<EducationLevel>("noo");

  const documents = useMemo(
    () => ({
      noo: buildKpvrDocument("noo", state.events, state.educationModules),
      ooo: buildKpvrDocument("ooo", state.events, state.educationModules),
      soo: buildKpvrDocument("soo", state.events, state.educationModules)
    }),
    [state.educationModules, state.events]
  );

  const activeDocument = documents[activeLevel];

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

            <div className="mt-8 overflow-x-auto rounded-md border">
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
