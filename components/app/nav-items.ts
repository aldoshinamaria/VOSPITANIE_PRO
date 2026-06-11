import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileArchive,
  FileInput,
  Grid3X3,
  Home,
  PackageCheck,
  Landmark,
  LibraryBig,
  ListChecks,
  PieChart,
  SearchCheck,
  Network,
  Route,
  Rocket,
  Scale,
  School,
  ScrollText,
  ShieldCheck
} from "lucide-react";

export const navItems = [
  {
    group: "Старт",
    title: "Главная",
    href: "/",
    icon: Home
  },
  {
    group: "Старт",
    title: "Демо",
    href: "/demo",
    icon: Rocket
  },
  {
    group: "Старт",
    title: "Демонстрационный маршрут",
    href: "/demo-showcase",
    icon: Route
  },
  {
    group: "Старт",
    title: "Подготовка к запуску",
    href: "/launch-readiness",
    icon: Rocket
  },
  {
    group: "Данные школы",
    title: "Паспорт школы",
    href: "/school-passport",
    icon: School
  },
  {
    group: "Данные школы",
    title: "Воспитательная система",
    href: "/educational-system",
    icon: Network
  },
  {
    group: "Данные школы",
    title: "Внеурочная деятельность",
    href: "/extra-activities",
    icon: Landmark
  },
  {
    group: "Данные школы",
    title: "Нормативные документы",
    href: "/normative-documents",
    icon: Scale
  },
  {
    group: "Планирование",
    title: "Мероприятия",
    href: "/events",
    icon: CalendarDays
  },
  {
    group: "Планирование",
    title: "КПВР",
    href: "/kpvr",
    icon: ClipboardList
  },
  {
    group: "Планирование",
    title: "Планы деятельности",
    href: "/activity-plans",
    icon: ListChecks
  },
  {
    group: "Планирование",
    title: "Матрица воспитательной деятельности",
    href: "/activity-matrix",
    icon: Grid3X3
  },
  {
    group: "Исполнение и отчеты",
    title: "Контроль исполнения",
    href: "/event-execution",
    icon: ClipboardCheck
  },
  {
    group: "Исполнение и отчеты",
    title: "Отчеты",
    href: "/activity-reports",
    icon: PieChart
  },
  {
    group: "Исполнение и отчеты",
    title: "Пакеты документов",
    href: "/document-packages",
    icon: PackageCheck
  },
  {
    group: "Проверка и документы",
    title: "Рабочая программа",
    href: "/work-program",
    icon: ScrollText
  },
  {
    group: "Проверка и документы",
    title: "Проверка соответствия",
    href: "/compliance-check",
    icon: ShieldCheck
  },
  {
    group: "Проверка и документы",
    title: "Центр проверок",
    href: "/inspection-center",
    icon: SearchCheck
  },
  {
    group: "Служебные инструменты",
    title: "Импорт документов",
    href: "/import-documents",
    icon: FileInput
  },
  {
    group: "Служебные инструменты",
    title: "Работа с документами",
    href: "/document-processing",
    icon: FileArchive
  },
  {
    group: "Служебные инструменты",
    title: "Федеральная база знаний",
    href: "/federal-knowledge",
    icon: LibraryBig
  },
  {
    group: "Служебные инструменты",
    title: "Модули воспитания",
    href: "/education-modules",
    icon: BookOpenCheck
  },
  {
    group: "Служебные инструменты",
    title: "Экспорт документов",
    href: "/exports",
    icon: FileArchive
  }
] as const;
