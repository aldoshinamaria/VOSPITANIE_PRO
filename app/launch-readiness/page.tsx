"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Circle, FileWarning, Rocket } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSchoolReadinessChecker } from "@/lib/domain/school-readiness-checker";
import { cn } from "@/lib/utils";
import type { SchoolReadinessArea, SchoolReadinessCheck, SchoolReadinessStatus } from "@/types/domain";

const statusLabels: Record<SchoolReadinessStatus, string> = {
  ready: "Готово",
  partial: "Частично заполнено",
  blocked: "Блокирует запуск"
};

export default function LaunchReadinessPage() {
  const { state } = useAppState();
  const checker = React.useMemo(() => createSchoolReadinessChecker(), []);
  const readiness = React.useMemo(() => checker.check(state), [checker, state]);

  return (
    <>
      <PageHeader
        title="Подготовка к запуску"
        description="Проверка готовности школы к формированию документов перед пилотным использованием в реальной школе."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Готовность" value={`${readiness.overallScore}%`} icon={Rocket} />
        <MetricCard title="Заполнено" value={readiness.filled.length} icon={CheckCircle2} />
        <MetricCard title="Не заполнено" value={readiness.notFilled.length} icon={Circle} />
        <MetricCard title="Блокеров" value={readiness.blockers.length} icon={AlertTriangle} />
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Готовность к формированию документов</CardTitle>
            <CardDescription>Сервис проверяет паспорт, воспитательную систему, КПВР, рабочую программу и нормативную базу.</CardDescription>
          </div>
          <Badge className={statusClassName(readiness.status)}>{statusLabels[readiness.status]}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-md border bg-white p-5">
              <div className="text-5xl font-semibold tracking-normal">{readiness.overallScore}%</div>
              <p className="mt-2 text-sm text-muted-foreground">{readinessDescription(readiness)}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {readiness.areas.map((area) => (
                <AreaSummary key={area.id} area={area} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ReadinessList title="Заполнено" description="Эти блоки уже можно использовать при формировании документов." areas={readiness.filled} emptyText="Пока нет полностью готовых блоков." />
        <ReadinessList title="Не заполнено" description="Эти блоки нужно дозаполнить перед пилотом." areas={readiness.notFilled} emptyText="Все ключевые блоки заполнены." />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Что мешает сформировать документы</CardTitle>
          <CardDescription>Сначала закройте эти пункты: они влияют на КПВР, рабочую программу и проверку соответствия.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {readiness.blockers.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Критических препятствий нет.</div>
          ) : (
            readiness.areas
              .filter((area) => area.blockers.length > 0)
              .map((area) => (
                <div key={area.id} className="rounded-md border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium">{area.title}</div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={area.href}>Перейти</Link>
                    </Button>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    {area.blockers.map((blocker) => (
                      <li key={blocker} className="flex gap-2">
                        <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                        <span>{blocker}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Маршрут подготовки</CardTitle>
          <CardDescription>Минимальная последовательность действий перед первым показом в школе.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {readiness.areas.map((area, index) => (
            <Link key={area.id} href={area.href} className="rounded-md border bg-white p-4 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardCheck className="h-4 w-4" />
                Шаг {index + 1}
              </div>
              <div className="mt-2 font-medium">{area.title}</div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className={cn("h-2 rounded-full", area.score >= 85 ? "bg-emerald-500" : area.score >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${area.score}%` }} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function AreaSummary({ area }: { area: SchoolReadinessArea }) {
  return (
    <Link href={area.href} className="rounded-md border bg-white p-4 transition-colors hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{area.title}</div>
        <Badge className={statusClassName(area.status)}>{statusLabels[area.status]}</Badge>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-normal">{area.score}%</div>
      <p className="mt-1 text-xs text-muted-foreground">
        {area.completed.length} готово, {area.missing.length} требует внимания
      </p>
    </Link>
  );
}

function ReadinessList({
  title,
  description,
  areas,
  emptyText
}: {
  title: string;
  description: string;
  areas: SchoolReadinessArea[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {areas.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          areas.map((area) => (
            <div key={area.id} className="rounded-md border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{area.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{area.score}% готовности</div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={area.href}>Открыть</Link>
                </Button>
              </div>
              {area.missing.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {area.missing.slice(0, 4).map((missing) => (
                    <li key={missing.id}>{missing.description}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function readinessDescription(readiness: SchoolReadinessCheck) {
  if (readiness.status === "ready") {
    return "Ключевые данные заполнены, документы можно готовить к пилотному показу.";
  }

  if (readiness.status === "partial") {
    return "Основные данные есть, но часть блоков требует дозаполнения.";
  }

  return "Есть блокирующие пробелы, которые помешают надежно сформировать документы.";
}

function statusClassName(status: SchoolReadinessStatus) {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-700";
}
