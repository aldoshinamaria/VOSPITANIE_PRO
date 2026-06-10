import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  DatabaseZap,
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
  Rocket,
  Scale,
  School,
  ScrollText,
  ShieldCheck
} from "lucide-react";

export const navItems = [
  {
    title: "Главная",
    href: "/",
    icon: Home
  },
  {
    title: "Подготовка к запуску",
    href: "/launch-readiness",
    icon: Rocket
  },
  {
    title: "Паспорт школы",
    href: "/school-passport",
    icon: School
  },
  {
    title: "Модули воспитания",
    href: "/education-modules",
    icon: BookOpenCheck
  },
  {
    title: "Воспитательная система",
    href: "/educational-system",
    icon: Network
  },
  {
    title: "Мероприятия",
    href: "/events",
    icon: CalendarDays
  },
  {
    title: "Контроль исполнения",
    href: "/event-execution",
    icon: ClipboardCheck
  },
  {
    title: "КПВР",
    href: "/kpvr",
    icon: ClipboardList
  },
  {
    title: "Планы деятельности",
    href: "/activity-plans",
    icon: ListChecks
  },
  {
    title: "Матрица воспитательной деятельности",
    href: "/activity-matrix",
    icon: Grid3X3
  },
  {
    title: "Отчеты",
    href: "/activity-reports",
    icon: PieChart
  },
  {
    title: "Центр проверок",
    href: "/inspection-center",
    icon: SearchCheck
  },
  {
    title: "Пакеты документов",
    href: "/document-packages",
    icon: PackageCheck
  },
  {
    title: "Рабочая программа воспитания",
    href: "/work-program",
    icon: ScrollText
  },
  {
    title: "Проверка соответствия",
    href: "/compliance-check",
    icon: ShieldCheck
  },
  {
    title: "Нормативные документы",
    href: "/normative-documents",
    icon: Scale
  },
  {
    title: "Федеральная база знаний",
    href: "/federal-knowledge",
    icon: LibraryBig
  },
  {
    title: "Внеурочная деятельность",
    href: "/extra-activities",
    icon: Landmark
  },
  {
    title: "Импорт документов",
    href: "/import-documents",
    icon: FileInput
  },
  {
    title: "Документный движок",
    href: "/document-processing",
    icon: DatabaseZap
  },
  {
    title: "Экспорт документов",
    href: "/exports",
    icon: FileArchive
  }
] as const;
