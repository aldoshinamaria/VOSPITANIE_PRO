"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Boxes,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileArchive,
  FileText,
  FolderCheck,
  Grid3X3,
  Loader2,
  Network,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";
import { formatRuDate } from "@/lib/utils";

type DemoStatus = "idle" | "loading" | "loaded" | "error";

const educationLevelLabels = {
  noo: "НОО",
  ooo: "ООО",
  soo: "СОО"
} as const;

const replacedTools = [
  "десятки Word-файлов",
  "Excel-таблицы с мероприятиями",
  "ручную сборку КПВР",
  "отдельные планы ДДТТ, профилактики, музея, ЮИД",
  "ручные отчеты за четверть и год",
  "хаос перед проверками"
];

const productFlow = [
  "Паспорт школы",
  "Мероприятия",
  "КПВР",
  "Планы деятельности",
  "Контроль исполнения",
  "Отчеты",
  "Центр проверок"
];

const demoRoute = [
  {
    title: "Главная панель",
    description: "Сводка по школе, ближайшие мероприятия и быстрые переходы.",
    href: "/",
    icon: BarChart3
  },
  {
    title: "КПВР",
    description: "Календарный план воспитательной работы по НОО, ООО и СОО.",
    href: "/kpvr",
    icon: ClipboardList
  },
  {
    title: "Рабочая программа",
    description: "Структура программы воспитания с источниками и версиями.",
    href: "/work-program",
    icon: FileText
  },
  {
    title: "Планы деятельности",
    description: "Планы по направлениям без дублирования мероприятий.",
    href: "/activity-plans",
    icon: Route
  },
  {
    title: "Контроль исполнения",
    description: "Статусы, прогресс, риски и подтверждение проведения.",
    href: "/event-execution",
    icon: ClipboardCheck
  },
  {
    title: "Отчеты",
    description: "Отчетность по направлениям, периодам и исполнению.",
    href: "/activity-reports",
    icon: BarChart3
  },
  {
    title: "Центр проверок",
    description: "Готовность к проверкам, чек-листы, риски и рекомендации.",
    href: "/inspection-center",
    icon: SearchCheck
  },
  {
    title: "Пакеты документов",
    description: "Подборки документов под проверку или внутренний контроль.",
    href: "/document-packages",
    icon: FileArchive
  }
];

const benefits = [
  "КПВР по НОО / ООО / СОО",
  "рабочая программа воспитания",
  "планы по направлениям",
  "контроль исполнения мероприятий",
  "отчеты по направлениям",
  "подготовка к проверкам",
  "проверка соответствия",
  "матрица воспитательной деятельности"
];

const timeSavings = [
  {
    title: "КПВР",
    description: "быстрее за счет автосборки из карточек мероприятий"
  },
  {
    title: "Отчеты",
    description: "быстрее за счет статусов исполнения и подтверждений"
  },
  {
    title: "Проверки",
    description: "быстрее за счет готовых пакетов и чек-листов"
  },
  {
    title: "Планы",
    description: "быстрее за счет направлений деятельности без дублей"
  }
];

const valueFlowActions = [
  { title: "Посмотреть мероприятие", href: "/events", icon: CalendarCheck },
  { title: "Посмотреть КПВР", href: "/kpvr", icon: ClipboardList },
  { title: "Посмотреть отчет", href: "/activity-reports", icon: BarChart3 },
  { title: "Посмотреть план деятельности", href: "/activity-plans", icon: Route }
];

const keyScenarios = [
  {
    title: "Получить КПВР",
    description: "Откройте календарный план по уровням НОО, ООО и СОО.",
    href: "/kpvr",
    icon: ClipboardList
  },
  {
    title: "Получить отчет",
    description: "Посмотрите отчетность по направлениям и исполнению.",
    href: "/activity-reports",
    icon: BarChart3
  },
  {
    title: "Подготовиться к проверке",
    description: "Откройте готовность, риски, рекомендации и пакеты документов.",
    href: "/inspection-center",
    icon: SearchCheck
  }
];

export default function DemoPage() {
  const { updateState, error } = useAppState();
  const [status, setStatus] = React.useState<DemoStatus>("idle");
  const factory = React.useMemo(() => createDemoSchoolFactory(), []);
  const previewState = React.useMemo(() => factory.createDemoSchool("urban"), [factory]);
  const featuredEvent =
    previewState.events.find((event) =>
      [event.title, event.description, event.direction].join(" ").match(/георгиевская|день победы|урок мужества|патриот/i)
    ) ?? previewState.events[0];
  const featuredModule = previewState.educationModules.find((module) => module.id === featuredEvent?.moduleId);
  const featuredDirections = previewState.eventDirectionRelations
    .filter((relation) => relation.eventId === featuredEvent?.id)
    .map((relation) => previewState.activityDirections.find((direction) => direction.id === relation.directionId)?.title)
    .filter((title): title is string => Boolean(title));
  const featuredAssociation = previewState.educationalSystem.associations.find(
    (association) => association.id === featuredEvent?.associationId
  );

  const metrics = React.useMemo(
    () => [
      { label: "обучающихся", value: previewState.schoolPassport.studentsCount, icon: Users },
      { label: "классов", value: previewState.schoolPassport.classesCount, icon: Boxes },
      { label: "мероприятий", value: previewState.events.length, icon: CalendarCheck },
      { label: "модулей воспитания", value: previewState.educationModules.filter((module) => module.active).length, icon: BookOpenCheck },
      { label: "направлений деятельности", value: previewState.activityDirections.length, icon: Grid3X3 },
      { label: "планов работы", value: 12, icon: ClipboardList },
      { label: "рабочая программа", value: "есть", icon: FileText },
      { label: "центр проверок", value: "есть", icon: FolderCheck }
    ],
    [previewState]
  );

  async function loadDemoSchool() {
    setStatus("loading");

    try {
      await updateState(() => factory.createDemoSchool("urban"));
      setStatus("loaded");
      document.getElementById("demo-route")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="-m-6 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.14),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <section className="grid min-h-[560px] items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Демо-версия
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Воспитание.PRO
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-700">
              Цифровое рабочее место заместителя директора по воспитательной работе.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              КПВР, рабочая программа воспитания, планы по направлениям, контроль исполнения, отчеты и подготовка к
              проверкам в одной системе.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button type="button" className="h-12 px-6" onClick={loadDemoSchool} disabled={status === "loading"}>
                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Загрузить демо-школу
              </Button>
              <Button asChild variant="outline" className="h-12 px-6">
                <a href="#demo-route">Посмотреть маршрут демо</a>
              </Button>
              <Button asChild variant="ghost" className="h-12 px-6">
                <Link href="/">Открыть главную панель</Link>
              </Button>
            </div>
            <DemoStateNotice status={status} error={error} />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {keyScenarios.map((scenario) => (
                <Button key={scenario.href} asChild variant="outline" className="h-auto justify-start bg-white px-4 py-3 text-left">
                  <Link href={scenario.href}>
                    <scenario.icon className="h-4 w-4 shrink-0" />
                    <span>
                      <span className="block font-semibold">{scenario.title}</span>
                      <span className="mt-1 block text-xs font-normal text-slate-500">{scenario.description}</span>
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200 bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
            <CardHeader className="border-b bg-slate-950 text-white">
              <CardTitle className="text-2xl">Одна запись работает везде</CardTitle>
              <CardDescription className="text-slate-300">
                Мероприятие вносится один раз и автоматически попадает в документы, планы и отчеты.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-5">
              {productFlow.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-md border bg-white p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-900">
                    {index + 1}
                  </div>
                  <div className="font-medium text-slate-900">{item}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {replacedTools.map((item) => (
            <Card key={item} className="border-slate-200 bg-white">
              <CardContent className="flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" />
                <div>
                  <div className="font-semibold text-slate-950">Заменяет</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Демо-школа</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">Готовые данные для показа продукта</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Метрики берутся из готового демонстрационного набора и помогают быстро увидеть продукт в работе.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricTile key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        {featuredEvent ? (
          <section className="overflow-hidden rounded-3xl border border-sky-200 bg-slate-950 text-white shadow-2xl shadow-slate-300/70">
            <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_36%)] p-6 sm:p-8 xl:border-b-0 xl:border-r">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Как работает система на реальном мероприятии
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                  Одно мероприятие работает во всех документах
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Одно мероприятие вносится один раз и автоматически используется во всех документах школы.
                </p>

                <div className="mt-6 rounded-2xl border border-white/15 bg-white p-5 text-slate-950 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
                        Карточка мероприятия
                      </div>
                      <h3 className="mt-2 text-2xl font-semibold tracking-normal">{featuredEvent.title}</h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {featuredEvent.status === "planned" ? "Планируется" : featuredEvent.status}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm">
                    <EventFact label="Дата" value={formatRuDate(featuredEvent.startDate)} />
                    <EventFact label="Ответственный" value={featuredEvent.responsible} />
                    <EventFact
                      label="Направления деятельности"
                      value={(featuredDirections.length > 0 ? featuredDirections : [featuredEvent.direction]).join(", ")}
                    />
                    <EventFact label="Модуль воспитания" value={featuredModule?.title ?? featuredEvent.direction} />
                    <EventFact
                      label="Уровень образования"
                      value={featuredEvent.educationLevels.map((level) => educationLevelLabels[level]).join(", ")}
                    />
                    <EventFact label="Классы" value={featuredEvent.classes} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {valueFlowActions.map((action) => (
                    <Button key={action.href} asChild variant="secondary" className="justify-between">
                      <Link href={action.href}>
                        <span className="flex items-center gap-2">
                          <action.icon className="h-4 w-4" />
                          {action.title}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid gap-3">
                  <FlowCard icon={CalendarCheck} title="Мероприятие" description={featuredEvent.title} />
                  <FlowArrow />
                  <FlowCard icon={ClipboardList} title="КПВР" description="появляется в планах ООО и СОО по дате мероприятия" />
                  <FlowArrow />
                  <FlowCard icon={Route} title={`План: ${featuredEvent.direction}`} description="использует ту же карточку без повторного ввода" />
                  <FlowArrow />
                  <FlowCard
                    icon={Network}
                    title={featuredAssociation ? `План объединения: ${featuredAssociation.title}` : "План объединения"}
                    description="связь берется из воспитательной системы школы"
                  />
                  <FlowArrow />
                  <FlowCard icon={FileText} title="Рабочая программа воспитания" description="мероприятие становится источником для традиций и содержания" />
                  <FlowArrow />
                  <FlowCard icon={BarChart3} title="Отчет за период" description="учитывается по статусу, участникам и направлению" />
                  <FlowArrow />
                  <FlowCard icon={SearchCheck} title="Центр проверок" description="попадает в готовность, риски и рекомендации" />
                  <FlowArrow />
                  <FlowCard icon={FileArchive} title="Пакет документов" description="может войти в подборку материалов для проверки" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 bg-white p-5 text-slate-950 sm:p-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-red-800">Без Воспитание.PRO</div>
                <h3 className="mt-2 text-2xl font-semibold tracking-normal">Ручное дублирование</h3>
                <p className="mt-3 text-sm leading-6 text-red-900">
                  Мероприятие приходится заносить в несколько документов: КПВР, отдельный план, отчет, программу и
                  материалы к проверке.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">С Воспитание.PRO</div>
                <h3 className="mt-2 text-2xl font-semibold tracking-normal">Один ввод данных</h3>
                <p className="mt-3 text-sm leading-6 text-emerald-900">
                  Мероприятие заносится один раз. Документы, планы, отчеты, проверки, аналитика и рабочая программа
                  используют одну связанную карточку.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 bg-slate-900 p-5 sm:p-6">
              <h3 className="text-2xl font-semibold tracking-normal">Почему это экономит время</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  "Создание мероприятия — 1 действие.",
                  "Обновление мероприятия — 1 действие.",
                  "Изменения отражаются в КПВР.",
                  "Изменения отражаются в планах.",
                  "Изменения отражаются в отчетах.",
                  "Изменения отражаются в проверках, аналитике и рабочей программе."
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="demo-route" className="scroll-mt-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Маршрут на 5 минут</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">Куда нажать, чтобы увидеть ценность</h2>
            </div>
            <Button type="button" onClick={loadDemoSchool} disabled={status === "loading"}>
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Загрузить демо-школу
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {demoRoute.map((item, index) => (
              <RouteCard key={item.href} index={index + 1} disabled={status !== "loaded"} {...item} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-2xl">Что получает замдиректора</CardTitle>
              <CardDescription>Не отдельный документ, а связанная система управления воспитательной работой.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-md border bg-slate-50 p-3 text-sm font-medium text-slate-800">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-sky-800" />
                  {benefit}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Clock3 className="h-5 w-5 text-sky-800" />
                Экономия времени
              </CardTitle>
              <CardDescription>Без недоказуемых обещаний: быстрее там, где данные уже связаны.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {timeSavings.map((item) => (
                <div key={item.title} className="rounded-md border p-4">
                  <div className="font-semibold text-slate-950">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-sky-200 bg-sky-950 p-6 text-white shadow-xl shadow-sky-950/10 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal">Хотите проверить на своей школе?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100">
                Начните с демо-школы, затем откройте главную панель и замените данные на свою школу.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" className="h-12 px-6" onClick={loadDemoSchool} disabled={status === "loading"}>
                Попробовать демо-школу
              </Button>
              <Button asChild variant="outline" className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                <Link href="/school-passport">Запросить адаптацию</Link>
              </Button>
              <Button asChild variant="ghost" className="h-12 px-6 text-white hover:bg-white/10 hover:text-white">
                <Link href="/">Открыть главную панель</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DemoStateNotice({ status, error }: { status: DemoStatus; error: string | null }) {
  if (status === "idle") {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        Это демонстрационный режим. Данные сохраняются в браузере и подходят для просмотра возможностей. Для работы
        реальной школы потребуется подключение базы данных.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загружаем демо-школу и готовим разделы для просмотра.
      </div>
    );
  }

  if (status === "loaded") {
    return (
      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        Демо-школа загружена. Теперь можно посмотреть КПВР, рабочую программу, планы, отчеты и центр проверок.
        Данные демонстрационные и сохраняются в этом браузере.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
      Не удалось загрузить демо-школу. {error ? `Причина: ${error}` : "Попробуйте обновить страницу и повторить загрузку."}
    </div>
  );
}

function EventFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-950">{value}</div>
    </div>
  );
}

function FlowCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-300 text-sky-950">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-white">{title}</div>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <div className="h-5 w-px bg-sky-300/70" />
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-sky-800" />
      <div className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function RouteCard({
  index,
  title,
  description,
  href,
  disabled,
  icon: Icon
}: {
  index: number;
  title: string;
  description: string;
  href: string;
  disabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900">
            {index}
          </div>
          <Icon className="h-5 w-5 text-sky-800" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="min-h-16 leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <Button variant="outline" className="w-full justify-between" disabled>
            Сначала загрузите демо
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href={href}>
              Перейти
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
