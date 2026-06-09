"use client";

import { BookOpenCheck, CheckCircle2, Search } from "lucide-react";
import * as React from "react";

import { FormField } from "@/components/app/form-field";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  educationLevelFilterOptions,
  federalKnowledgeBase,
  filterFederalTargetResults
} from "@/lib/domain/federal-knowledge/federal-knowledge-base";
import type { EducationLevel, FederalDirection } from "@/types/domain";

type LevelFilter = "all" | EducationLevel;

const educationLevelLabels: Record<EducationLevel, string> = {
  noo: "НОО",
  ooo: "ООО",
  soo: "СОО"
};

export default function FederalKnowledgePage() {
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [search, setSearch] = React.useState("");
  const filteredTargets = filterFederalTargetResults({
    results: federalKnowledgeBase.targetResults,
    level: levelFilter,
    query: search
  });

  return (
    <>
      <PageHeader
        title="Федеральная база знаний"
        description="Справочник направлений воспитания, обязательных разделов рабочей программы и целевых ориентиров. Используется как база для будущей проверки рабочей программы."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Направлений" value={federalKnowledgeBase.directions.length} icon={BookOpenCheck} />
        <MetricCard title="Разделов" value={federalKnowledgeBase.programSections.length} icon={CheckCircle2} />
        <MetricCard title="Ориентиров" value={federalKnowledgeBase.targetResults.length} icon={Search} />
        <MetricCard title="Версия" value={federalKnowledgeBase.version} icon={BookOpenCheck} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Направления воспитания</CardTitle>
          <CardDescription>Единый федеральный справочник направлений. Не дублирует пользовательские модули воспитания.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {federalKnowledgeBase.directions.map((direction) => (
            <DirectionCard key={direction.id} direction={direction} />
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Обязательные разделы рабочей программы</CardTitle>
          <CardDescription>Для каждого раздела указаны критерии наличия и полноты.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {federalKnowledgeBase.programSections.map((section) => (
            <div key={section.id} className="rounded-md border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{section.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                </div>
                <Badge variant={section.required ? "success" : "secondary"}>{section.required ? "Обязательный" : "Дополнительный"}</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CriteriaBlock title="Критерии наличия" values={section.presenceCriteria} />
                <CriteriaBlock title="Критерии полноты" values={section.completenessCriteria} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Источник: {section.requirementSource}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Целевые ориентиры результатов воспитания</CardTitle>
          <CardDescription>Ориентиры разделены по НОО, ООО и СОО; поиск работает по тексту и ключевым словам проверки.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <Select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}>
              {educationLevelFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FormField
              label="Поиск"
              value={search}
              placeholder="Например: патриот, семья, наука, здоровье"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid gap-3">
            {filteredTargets.map((target) => {
              const direction = federalKnowledgeBase.directions.find((item) => item.id === target.directionId);

              return (
                <div key={target.id} className="rounded-md border bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{educationLevelLabels[target.educationLevel]}</Badge>
                    <Badge variant="secondary">{direction?.title ?? target.directionId}</Badge>
                    {target.required ? <Badge variant="success">Обязательный</Badge> : null}
                  </div>
                  <p className="text-sm leading-6">{target.text}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Ключевые слова: {target.verificationKeywords.join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Источник: {target.source}</div>
                </div>
              );
            })}
            {filteredTargets.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                По выбранным фильтрам ориентиры не найдены.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DirectionCard({ direction }: { direction: FederalDirection }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="font-medium">{direction.title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{direction.description}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {direction.keywords.slice(0, 4).map((keyword) => (
          <Badge key={keyword} variant="outline">
            {keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function CriteriaBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-sm font-medium">{title}</div>
      <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}
