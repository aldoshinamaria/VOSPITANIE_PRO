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
    title: "\u0427\u0442\u043e \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0432 \u043f\u0435\u0440\u0432\u0443\u044e \u043e\u0447\u0435\u0440\u0435\u0434\u044c",
    items: [
      "\u043f\u0430\u0441\u043f\u043e\u0440\u0442 \u0448\u043a\u043e\u043b\u044b",
      "\u0437\u0430\u043c\u0435\u0441\u0442\u0438\u0442\u0435\u043b\u044c \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440\u0430 \u043f\u043e \u0412\u0420",
      "\u043e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f \u0438 \u0438\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430",
      "\u0441\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u0430\u0440\u0442\u043d\u0435\u0440\u044b"
    ],
    href: "/launch-readiness"
  },
  {
    title: "\u0427\u0442\u043e \u043d\u0443\u0436\u043d\u043e \u0434\u043b\u044f \u041a\u041f\u0412\u0420",
    items: [
      "\u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f",
      "\u043c\u043e\u0434\u0443\u043b\u0438 \u0432\u043e\u0441\u043f\u0438\u0442\u0430\u043d\u0438\u044f",
      "\u0443\u0440\u043e\u0432\u043d\u0438 \u041d\u041e\u041e/\u041e\u041e\u041e/\u0421\u041e\u041e",
      "\u0434\u0430\u0442\u044b \u0438 \u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0435"
    ],
    href: "/events"
  },
  {
    title: "\u0427\u0442\u043e \u043d\u0443\u0436\u043d\u043e \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0447\u0435\u0439 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b",
    items: [
      "\u043f\u0430\u0441\u043f\u043e\u0440\u0442 \u0448\u043a\u043e\u043b\u044b",
      "\u0432\u043e\u0441\u043f\u0438\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430",
      "\u041a\u041f\u0412\u0420",
      "\u043d\u043e\u0440\u043c\u0430\u0442\u0438\u0432\u043d\u0430\u044f \u0431\u0430\u0437\u0430"
    ],
    href: "/work-program"
  }
];

const firstLaunchSteps = [
  {
    title: "1. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b",
    description:
      "\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u041a\u041f\u0412\u0420, \u043f\u043b\u0430\u043d\u044b, \u0440\u0430\u0431\u043e\u0447\u0438\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b, \u043f\u0440\u0438\u043a\u0430\u0437\u044b \u0438\u043b\u0438 \u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u044f.",
    href: "/document-processing"
  },
  {
    title: "2. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0430\u043d\u0430\u043b\u0438\u0437",
    description:
      "\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435, \u0438\u0441\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u043d\u0435\u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u0438 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 preview.",
    href: "/document-processing"
  },
  {
    title: "3. \u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043f\u0430\u0441\u043f\u043e\u0440\u0442 \u0448\u043a\u043e\u043b\u044b",
    description:
      "\u0412\u043d\u0435\u0441\u0438\u0442\u0435 \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f, \u0438\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0443 \u0438 \u0441\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u043f\u0430\u0440\u0442\u043d\u0435\u0440\u043e\u0432.",
    href: "/school-passport"
  },
  {
    title: "4. \u0421\u043e\u0431\u0435\u0440\u0438\u0442\u0435 \u041a\u041f\u0412\u0420",
    description:
      "\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f \u0438\u0437 \u0440\u0435\u0435\u0441\u0442\u0440\u0430, \u0447\u0442\u043e\u0431\u044b \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u043a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u043d\u044b\u0439 \u043f\u043b\u0430\u043d.",
    href: "/kpvr"
  },
  {
    title: "5. \u0421\u0444\u043e\u0440\u043c\u0438\u0440\u0443\u0439\u0442\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b",
    description:
      "\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u041a\u041f\u0412\u0420, \u043f\u043b\u0430\u043d\u044b \u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0438 \u0440\u0430\u0431\u043e\u0447\u0443\u044e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0443.",
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
        title={isEmpty ? "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c \u0432 \u0412\u043e\u0441\u043f\u0438\u0442\u0430\u043d\u0438\u0435.PRO" : "\u0413\u043b\u0430\u0432\u043d\u0430\u044f \u043f\u0430\u043d\u0435\u043b\u044c"}
        description={
          isEmpty
            ? "\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u0441 \u0434\u0430\u043d\u043d\u044b\u0445 \u0441\u0432\u043e\u0435\u0439 \u0448\u043a\u043e\u043b\u044b. \u041f\u043e\u0441\u043b\u0435 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f \u043f\u0430\u0441\u043f\u043e\u0440\u0442\u0430, \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439 \u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432 \u0441\u0438\u0441\u0442\u0435\u043c\u0430 \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u041a\u041f\u0412\u0420, \u043f\u043b\u0430\u043d\u044b \u0438 \u0440\u0430\u0431\u043e\u0447\u0443\u044e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0443."
            : "\u041a\u0440\u0430\u0442\u043a\u0430\u044f \u0441\u0432\u043e\u0434\u043a\u0430 \u043f\u043e \u0432\u043e\u0441\u043f\u0438\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0439 \u0440\u0430\u0431\u043e\u0442\u0435 \u0448\u043a\u043e\u043b\u044b \u0438 \u0431\u044b\u0441\u0442\u0440\u044b\u0439 \u043f\u0435\u0440\u0435\u0445\u043e\u0434 \u043a \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u043c \u0440\u0430\u0437\u0434\u0435\u043b\u0430\u043c."
        }
      />

      <FirstLaunchWizard isEmpty={isEmpty} />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title={STUDENTS_LABEL} value={state.schoolPassport.studentsCount} icon={Users} />
        <MetricCard title={CLASSES_LABEL} value={state.schoolPassport.classesCount} icon={School} />
        <MetricCard title={EVENTS_LABEL} value={state.events.length} icon={CalendarDays} />
        <MetricCard title={ACTIVE_MODULES_LABEL} value={activeModulesCount} icon={BookOpenCheck} />
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
                <Link href={hint.href}>{OPEN_LABEL}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{NEAREST_EVENTS_TITLE}</CardTitle>
            <CardDescription>{NEAREST_EVENTS_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:hidden">
              {state.events.length === 0 ? (
                <EmptyEventsMessage />
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
                    <TableHead>{DATE_LABEL}</TableHead>
                    <TableHead>{EVENT_LABEL}</TableHead>
                    <TableHead>{RESPONSIBLE_LABEL}</TableHead>
                    <TableHead>{STATUS_LABEL}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {EMPTY_EVENTS_TEXT}
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
            <CardTitle>{QUICK_ACTIONS_TITLE}</CardTitle>
            <CardDescription>{QUICK_ACTIONS_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction href="/school-passport" icon={<School className="h-4 w-4" />} label={SCHOOL_PASSPORT_LABEL} />
            <QuickAction href="/kpvr" icon={<ClipboardList className="h-4 w-4" />} label={KPVR_LABEL} />
            <QuickAction href="/exports" icon={<FileArchive className="h-4 w-4" />} label={EXPORT_LABEL} />
            <QuickAction href="/extra-activities" icon={<Landmark className="h-4 w-4" />} label={EXTRA_ACTIVITIES_LABEL} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function FirstLaunchWizard({ isEmpty }: { isEmpty: boolean }) {
  return (
    <Card className={isEmpty ? "border-sky-200 bg-sky-50" : "bg-white"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-sky-800" />
          {FIRST_LAUNCH_TITLE}
        </CardTitle>
        <CardDescription>
          {isEmpty
            ? FIRST_LAUNCH_EMPTY_DESCRIPTION
            : FIRST_LAUNCH_ACTIVE_DESCRIPTION}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {firstLaunchSteps.map((step) => (
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

function EmptyEventsMessage() {
  return (
    <div className="rounded-md border bg-slate-50 p-4 text-center text-sm text-muted-foreground">
      {EMPTY_EVENTS_TEXT}
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Button asChild variant="outline" className="justify-start">
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}

const OPEN_LABEL = "\u041e\u0442\u043a\u0440\u044b\u0442\u044c";
const STUDENTS_LABEL = "\u041e\u0431\u0443\u0447\u0430\u044e\u0449\u0438\u0445\u0441\u044f";
const CLASSES_LABEL = "\u041a\u043b\u0430\u0441\u0441\u043e\u0432";
const EVENTS_LABEL = "\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439";
const ACTIVE_MODULES_LABEL = "\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043c\u043e\u0434\u0443\u043b\u0435\u0439";
const NEAREST_EVENTS_TITLE = "\u0411\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f";
const NEAREST_EVENTS_DESCRIPTION =
  "\u041f\u043b\u0430\u043d\u043e\u0432\u044b\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f, \u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0435 \u0438 \u0442\u0435\u043a\u0443\u0449\u0438\u0439 \u0441\u0442\u0430\u0442\u0443\u0441.";
const EMPTY_EVENTS_TEXT =
  "\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442. \u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043f\u0435\u0440\u0432\u043e\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435 \u0438\u043b\u0438 \u0438\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0438\u0437 \u0448\u043a\u043e\u043b\u044c\u043d\u043e\u0433\u043e \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430.";
const DATE_LABEL = "\u0414\u0430\u0442\u0430";
const EVENT_LABEL = "\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435";
const RESPONSIBLE_LABEL = "\u041e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439";
const STATUS_LABEL = "\u0421\u0442\u0430\u0442\u0443\u0441";
const QUICK_ACTIONS_TITLE = "\u0411\u044b\u0441\u0442\u0440\u044b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f";
const QUICK_ACTIONS_DESCRIPTION = "\u041f\u0435\u0440\u0435\u0445\u043e\u0434\u044b \u043a \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u043c \u0440\u0430\u0437\u0434\u0435\u043b\u0430\u043c.";
const SCHOOL_PASSPORT_LABEL = "\u041f\u0430\u0441\u043f\u043e\u0440\u0442 \u0448\u043a\u043e\u043b\u044b";
const KPVR_LABEL = "\u041a\u041f\u0412\u0420";
const EXPORT_LABEL = "\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432";
const EXTRA_ACTIVITIES_LABEL = "\u0412\u043d\u0435\u0443\u0440\u043e\u0447\u043d\u0430\u044f \u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c";
const FIRST_LAUNCH_TITLE = "\u041c\u0430\u0441\u0442\u0435\u0440 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0437\u0430\u043f\u0443\u0441\u043a\u0430";
const FIRST_LAUNCH_EMPTY_DESCRIPTION =
  "\u0420\u0430\u0431\u043e\u0447\u0435\u0435 \u043f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u043e \u043e\u0442\u043a\u0440\u044b\u0442\u043e \u0441 \u0447\u0438\u0441\u0442\u043e\u0439 \u0448\u043a\u043e\u043b\u043e\u0439. \u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b, \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u0447\u0430\u0442\u044c \u0441\u0431\u043e\u0440\u043a\u0443 \u041a\u041f\u0412\u0420 \u0438 \u043f\u043b\u0430\u043d\u043e\u0432.";
const FIRST_LAUNCH_ACTIVE_DESCRIPTION =
  "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0430\u0439\u0442\u0435 \u0437\u0430\u043f\u043e\u043b\u043d\u044f\u0442\u044c \u0438 \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u0442\u044c \u0440\u0430\u0431\u043e\u0447\u0438\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0448\u043a\u043e\u043b\u044b.";
