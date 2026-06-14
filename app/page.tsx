"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileArchive,
  Landmark,
  Rocket,
  School,
  ShieldCheck,
  Users
} from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { EventStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRuDate } from "@/lib/utils";

const firstPriorityHints = [
  {
    title: "Что заполнить в первую очередь",
    items: ["паспорт школы", "заместитель директора по ВР", "объединения и инфраструктура", "социальные партнеры"],
    href: "/launch-readiness"
  },
  {
    title: "Что нужно для КПВР",
    items: ["мероприятия", "модули воспитания", "уровни НОО/ООО/СОО", "даты и ответственные"],
    href: "/events"
  },
  {
    title: "Что нужно для рабочей программы",
    items: ["паспорт школы", "воспитательная система", "КПВР", "нормативная база"],
    href: "/work-program"
  }
];

export default function DashboardPage() {
  const { state } = useAppState();
  const isEmpty =
    !state.schoolPassport.name &&
    state.events.length === 0 &&
    state.educationalSystem.associations.length === 0 &&
    state.normativeDocuments.length === 0;
  const activeModulesCount = state.educationModules.filter((module) => module.active).length;

  return (
    <>
      <PageHeader
        title={isEmpty ? "Добро пожаловать в Воспитание.PRO" : "Главная панель"}
        description={
          isEmpty
            ? "Начните со своей школы или загрузите демо-школу, чтобы за несколько минут увидеть КПВР, рабочую программу и проверку соответствия."
            : "Краткая сводка по воспитательной работе школы и быстрый переход к ключевым разделам."
        }
      />

      <FirstLaunchWizard
        isEmpty={isEmpty}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Обучающихся" value={state.schoolPassport.studentsCount} icon={Users} />
        <MetricCard title="Классов" value={state.schoolPassport.classesCount} icon={School} />
        <MetricCard title="Мероприятий" value={state.events.length} icon={CalendarDays} />
        <MetricCard title="Активных модулей" value={activeModulesCount} icon={BookOpenCheck} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {firstPriorityHints.map((hint) => (
          <Card key={hint.title}>
            <CardHeader>
              <CardTitle>{hint.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {hint.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-800" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-4 w-full justify-start" variant="outline">
                <Link href={hint.href}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Сценарий демонстрации за 5 минут</CardTitle>
          <CardDescription>Маршрут показывает ценность продукта без долгих объяснений.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DemoStep title="1. Готовность к запуску" description="Покажите, какие данные заполнены и что мешает документам." href="/launch-readiness" action="Открыть готовность" />
          <DemoStep title="2. КПВР" description="Покажите календарный план по НОО, ООО и СОО." href="/kpvr" action="Открыть КПВР" />
          <DemoStep title="3. Рабочая программа" description="Покажите автоматически собранную структуру программы." href="/work-program" action="Открыть программу" />
          <DemoStep title="4. Проверка соответствия" description="Покажите проблемы, рекомендации и план исправления." href="/compliance-check" action="Открыть проверку" />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ближайшие мероприятия</CardTitle>
            <CardDescription>Плановые события, ответственные и текущий статус.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:hidden">
              {state.events.length === 0 ? (
                <div className="rounded-md border bg-slate-50 p-4 text-center text-sm text-muted-foreground">
                  Мероприятий пока нет. Загрузите демо-школу или добавьте первое мероприятие.
                </div>
              ) : (
                state.events.slice(0, 8).map((event) => (
                  <article key={event.id} className="rounded-md border p-3">
                    <div className="text-xs font-semibold text-muted-foreground">{formatRuDate(event.startDate)}</div>
                    <div className="mt-1 font-medium">{event.title}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{event.responsible}</div>
                    <div className="mt-3">
                      <EventStatusBadge status={event.status} />
                    </div>
                  </article>
                ))
              )}
            </div>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Мероприятие</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Мероприятий пока нет. Добавьте первое мероприятие в рабочем режиме.
                    </TableCell>
                  </TableRow>
                ) : (
                  state.events.slice(0, 8).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap">{formatRuDate(event.startDate)}</TableCell>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.responsible}</TableCell>
                      <TableCell>
                        <EventStatusBadge status={event.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Переходы к ключевым разделам.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/school-passport">
                <School className="h-4 w-4" />
                Паспорт школы
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/kpvr">
                <ClipboardList className="h-4 w-4" />
                КПВР
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/exports">
                <FileArchive className="h-4 w-4" />
                Экспорт документов
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/extra-activities">
                <Landmark className="h-4 w-4" />
                Внеурочная деятельность
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function FirstLaunchWizard({
  isEmpty
}: {
  isEmpty: boolean;
}) {
  const steps = [
    { title: "1. Загрузите документы", description: "Добавьте федеральные, региональные или школьные документы для будущего анализа.", href: "/import-documents" },
    { title: "2. Проверьте анализ", description: "Проверьте качество извлечения текста и структуры в документном движке.", href: "/document-processing" },
    { title: "3. Заполните паспорт школы", description: "Внесите официальные сведения, инфраструктуру и социальных партнеров.", href: "/school-passport" },
    { title: "4. Сформируйте рабочую программу", description: "Соберите программу воспитания из данных школы и проверьте готовность разделов.", href: "/work-program" },
    { title: "5. Сформируйте КПВР", description: "Добавьте мероприятия и получите календарный план по уровням образования.", href: "/kpvr" }
  ];

  return (
    <Card className={isEmpty ? "border-sky-200 bg-sky-50" : "bg-white"}>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-sky-800" />
            Мастер первого запуска
          </CardTitle>
          <CardDescription>
            {isEmpty
              ? "Рабочий режим открыт с чистой школой. Демо-данные находятся только в разделе «Демо»."
              : "Продолжайте заполнять рабочие данные школы. Демо-режим не влияет на это состояние."}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <Link href="/demo">Открыть демо отдельно</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step) => (
            <Button key={step.title} asChild variant="outline" className="h-auto justify-start whitespace-normal p-4 text-left">
              <Link href={step.href}>
                <span>
                  <span className="block font-medium">{step.title}</span>
                  <span className="mt-2 block text-sm font-normal leading-5 text-muted-foreground">{step.description}</span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DemoStep({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="font-semibold">{title}</div>
      <p className="mt-2 min-h-12 text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" className="mt-4 w-full justify-start">
        <Link href={href}>
          <ShieldCheck className="h-4 w-4" />
          {action}
        </Link>
      </Button>
    </div>
  );
}
