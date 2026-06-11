"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Loader2,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";
import { formatRuDate } from "@/lib/utils";

const educationLevelLabels = {
  noo: "НОО",
  ooo: "ООО",
  soo: "СОО"
} as const;

const showcaseFlow = [
  "Мероприятие",
  "КПВР",
  "План",
  "Исполнение",
  "Отчет",
  "Проверка",
  "Рабочая программа"
];

const finalLinks = [
  { title: "КПВР", href: "/kpvr", icon: ClipboardList },
  { title: "Отчеты", href: "/activity-reports", icon: BarChart3 },
  { title: "Проверки", href: "/inspection-center", icon: SearchCheck },
  { title: "Рабочая программа", href: "/work-program", icon: FileText }
];

export default function DemoShowcasePage() {
  const { updateState, isSaving } = useAppState();
  const [loaded, setLoaded] = React.useState(false);
  const factory = React.useMemo(() => createDemoSchoolFactory(), []);
  const demoState = React.useMemo(() => factory.createDemoSchool("urban"), [factory]);
  const event =
    demoState.events.find((item) =>
      [item.title, item.description, item.direction].join(" ").match(/георгиевская|победа|мужеств|патриот/i)
    ) ?? demoState.events[0];
  const educationModule = demoState.educationModules.find((item) => item.id === event.moduleId);
  const directions = demoState.eventDirectionRelations
    .filter((relation) => relation.eventId === event.id)
    .map((relation) => demoState.activityDirections.find((direction) => direction.id === relation.directionId)?.title)
    .filter((title): title is string => Boolean(title));
  const association = demoState.educationalSystem.associations.find((item) => item.id === event.associationId);
  const kpvrLevels = event.educationLevels.map((level) => educationLevelLabels[level]).join(", ");

  async function loadDemo() {
    await updateState(() => factory.createDemoSchool("urban"));
    setLoaded(true);
  }

  const steps = [
    {
      title: "1. Мероприятие",
      description: "В демо-школе уже есть реальное событие. Оно хранится как одна карточка.",
      detail: event.title,
      href: "/events",
      action: "Открыть мероприятие",
      icon: CalendarCheck
    },
    {
      title: "2. КПВР",
      description: `Это мероприятие уже включается в КПВР по уровням: ${kpvrLevels}.`,
      detail: `${formatRuDate(event.startDate)} · ${event.classes} классы`,
      href: "/kpvr",
      action: "Открыть КПВР",
      icon: ClipboardList
    },
    {
      title: "3. План деятельности",
      description: "Та же карточка используется в плане по направлению деятельности.",
      detail: directions[0] ?? event.direction,
      href: "/activity-plans",
      action: "Открыть план",
      icon: Route
    },
    {
      title: "4. Контроль исполнения",
      description: "Мероприятие можно отметить как проведенное и подтвердить результат.",
      detail: `Ответственный: ${event.responsible}`,
      href: "/event-execution",
      action: "Открыть контроль исполнения",
      icon: ClipboardCheck
    },
    {
      title: "5. Отчет",
      description: "После исполнения мероприятие участвует в формировании отчета.",
      detail: `${event.participantsCount} участников в демо-карточке`,
      href: "/activity-reports",
      action: "Открыть отчет",
      icon: BarChart3
    },
    {
      title: "6. Центр проверок",
      description: "Данные используются при подготовке к проверке и сборе пакетов документов.",
      detail: "Готовность, риски, рекомендации",
      href: "/inspection-center",
      action: "Открыть центр проверок",
      icon: SearchCheck
    },
    {
      title: "7. Рабочая программа",
      description: "События, объединения и традиции школы становятся источниками рабочей программы.",
      detail: association ? `Связано с объединением: ${association.title}` : "Связано с воспитательной системой школы",
      href: "/work-program",
      action: "Открыть рабочую программу",
      icon: FileText
    }
  ];

  return (
    <main className="-mx-4 -mb-6 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#f8fafc_100%)] px-4 py-8 text-slate-950 sm:-mx-6 sm:px-6 lg:-m-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-8 rounded-3xl border bg-white p-6 shadow-sm sm:p-8 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
              <Sparkles className="h-3.5 w-3.5" />
              Демонстрационный маршрут
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Посмотрите систему за 5 минут
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Маршрут показывает, как одно мероприятие связывает КПВР, планы, исполнение, отчеты, проверки и рабочую
              программу воспитания.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" className="h-12 px-6" onClick={loadDemo} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Загрузить демо-школу
              </Button>
              <Button asChild variant="outline" className="h-12 px-6">
                <a href="#showcase-steps">Начать просмотр</a>
              </Button>
            </div>
            {loaded ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                Демо-школа загружена. Теперь открывайте шаги маршрута и смотрите связанные разделы.
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Можно сначала просмотреть маршрут, а затем загрузить демо-школу для перехода в заполненные разделы.
              </div>
            )}
          </div>

          <Card className="border-slate-200 bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Большая схема</CardTitle>
              <CardDescription className="text-slate-300">
                Все начинается с одной карточки мероприятия.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {showcaseFlow.map((item, index) => (
                <React.Fragment key={item}>
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-medium">{item}</div>
                  {index < showcaseFlow.length - 1 ? (
                    <div className="flex justify-center text-sky-300" aria-hidden="true">
                      ↓
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-sky-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Карточка мероприятия</CardTitle>
              <CardDescription>Реальное мероприятие из демо-школы.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <h2 className="text-3xl font-semibold tracking-normal">{event.title}</h2>
              <Fact label="Дата" value={formatRuDate(event.startDate)} />
              <Fact label="Ответственный" value={event.responsible} />
              <Fact label="Модуль воспитания" value={educationModule?.title ?? event.direction} />
              <Fact label="Направления" value={(directions.length > 0 ? directions : [event.direction]).join(", ")} />
              <Fact label="Уровни образования" value={kpvrLevels} />
              <Fact label="Статус" value={event.status === "planned" ? "Планируется" : event.status} />
            </CardContent>
          </Card>

          <div id="showcase-steps" className="grid gap-4">
            {steps.map((step) => (
              <StepCard key={step.title} {...step} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-slate-950 p-6 text-white sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal">Что посмотреть дальше</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                После маршрута откройте ключевые разделы и покажите готовые документы, отчеты и проверку.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {finalLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Button key={link.href} asChild variant="secondary" className="justify-between">
                    <Link href={link.href}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {link.title}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-950">{value}</div>
    </div>
  );
}

function StepCard({
  title,
  description,
  detail,
  href,
  action,
  icon: Icon
}: {
  title: string;
  description: string;
  detail: string;
  href: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-900">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1 leading-6">{description}</CardDescription>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href={href}>
            {action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-slate-50 p-3 text-sm font-medium text-slate-700">{detail}</div>
      </CardContent>
    </Card>
  );
}
