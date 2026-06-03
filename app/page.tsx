"use client";

import {
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileArchive,
  Landmark,
  School,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { EventStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRuDate } from "@/lib/utils";

const roleScenarios = [
  {
    title: "Заместитель директора по ВР",
    description: "Обновить паспорт школы, проверить модули, добавить мероприятие и проверить готовность данных к документам.",
    href: "/events",
    action: "Перейти к мероприятиям"
  },
  {
    title: "Советник директора",
    description: "Проверить активные модули воспитания и связать события с направлениями работы.",
    href: "/education-modules",
    action: "Открыть модули"
  },
  {
    title: "Классный руководитель",
    description: "Добавить классное событие, указать участников и ответственного.",
    href: "/events",
    action: "Добавить событие"
  },
  {
    title: "Директор школы",
    description: "Посмотреть общую картину: охват, мероприятия, КПВР и готовность данных к документам.",
    href: "/exports",
    action: "Проверить экспорт"
  }
];

const demoSteps = [
  {
    title: "1. Проверьте паспорт школы",
    description: "Учебный год, заместитель директора, инфраструктура и социальные партнеры.",
    href: "/school-passport",
    action: "Открыть паспорт"
  },
  {
    title: "2. Добавьте конкурс",
    description: "Быстрый сценарий сразу создает мероприятие и включает его в нужный КПВР.",
    href: "/events",
    action: "Добавить конкурс"
  },
  {
    title: "3. Сформируйте КПВР",
    description: "Проверьте вкладки НОО, ООО, СОО и группировку по модулям.",
    href: "/kpvr",
    action: "Проверить КПВР"
  },
  {
    title: "4. Скачайте DOCX",
    description: "Экспортируйте КПВР или план внеурочной деятельности для выбранного уровня.",
    href: "/exports",
    action: "Перейти к экспорту"
  }
];

export default function DashboardPage() {
  const { state } = useAppState();
  const activeModulesCount = state.educationModules.filter((module) => module.active).length;

  return (
    <>
      <PageHeader
        title="Главная панель"
        description="Краткая сводка по воспитательной работе школы и быстрый переход в основные разделы MVP."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Обучающихся" value={state.schoolPassport.studentsCount} icon={Users} />
        <MetricCard title="Классов" value={state.schoolPassport.classesCount} icon={School} />
        <MetricCard title="Мероприятий" value={state.events.length} icon={CalendarDays} />
        <MetricCard title="Активных модулей" value={activeModulesCount} icon={BookOpenCheck} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Сценарий демонстрации</CardTitle>
          <CardDescription>Короткий маршрут, который показывает ценность проекта без долгих объяснений.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {demoSteps.map((step) => (
            <div key={step.title} className="rounded-md border bg-white p-4">
              <div className="font-semibold">{step.title}</div>
              <p className="mt-2 min-h-12 text-sm text-muted-foreground">{step.description}</p>
              <Button asChild variant="outline" className="mt-4 w-full justify-start">
                <Link href={step.href}>
                  <ShieldCheck className="h-4 w-4" />
                  {step.action}
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        {roleScenarios.map((scenario) => (
          <Card key={scenario.title}>
            <CardHeader>
              <CardTitle>{scenario.title}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={scenario.href}>
                  <ShieldCheck className="h-4 w-4" />
                  {scenario.action}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ближайшие мероприятия</CardTitle>
            <CardDescription>Плановые события, ответственные и текущий статус.</CardDescription>
          </CardHeader>
          <CardContent>
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
                {state.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap">{formatRuDate(event.startDate)}</TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.responsible}</TableCell>
                    <TableCell>
                      <EventStatusBadge status={event.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Переходы к ключевым рабочим разделам.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/school-passport">
                <School className="h-4 w-4" />
                Открыть паспорт школы
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/kpvr">
                <ClipboardList className="h-4 w-4" />
                Проверить КПВР
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/exports">
                <FileArchive className="h-4 w-4" />
                Перейти к экспорту
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
