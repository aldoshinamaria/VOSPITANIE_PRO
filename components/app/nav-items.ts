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
import type { ComponentType } from "react";
import type { AppMode } from "@/types/app-mode";

type NavItemMode = AppMode | "hidden";

export const navItems = [
  {
    group: "Старт",
    title: "Главная",
    href: "/",
    icon: Home,
    modes: ["work"]
  },
  {
    group: "Старт",
    title: "Демо",
    href: "/demo",
    icon: Rocket,
    modes: ["demo"]
  },
  {
    group: "Старт",
    title: "Демонстрационный маршрут",
    href: "/demo-showcase",
    icon: Route,
    modes: ["demo"]
  },
  {
    group: "Старт",
    title: "Подготовка к запуску",
    href: "/launch-readiness",
    icon: Rocket,
    modes: ["hidden"]
  },
  {
    group: "Данные школы",
    title: "Паспорт школы",
    href: "/school-passport",
    icon: School,
    modes: ["work"]
  },
  {
    group: "Данные школы",
    title: "Воспитательная система",
    href: "/educational-system",
    icon: Network,
    modes: ["work"]
  },
  {
    group: "Данные школы",
    title: "Внеурочная деятельность",
    href: "/extra-activities",
    icon: Landmark,
    modes: ["work"]
  },
  {
    group: "Данные школы",
    title: "Нормативные документы",
    href: "/normative-documents",
    icon: Scale,
    modes: ["work"]
  },
  {
    group: "Планирование",
    title: "Мероприятия",
    href: "/events",
    icon: CalendarDays,
    modes: ["work"]
  },
  {
    group: "Планирование",
    title: "КПВР",
    href: "/kpvr",
    icon: ClipboardList,
    modes: ["work"]
  },
  {
    group: "Планирование",
    title: "Планы деятельности",
    href: "/activity-plans",
    icon: ListChecks,
    modes: ["work"]
  },
  {
    group: "Планирование",
    title: "Матрица воспитательной деятельности",
    href: "/activity-matrix",
    icon: Grid3X3,
    modes: ["work"]
  },
  {
    group: "Исполнение и отчеты",
    title: "Контроль исполнения",
    href: "/event-execution",
    icon: ClipboardCheck,
    modes: ["work"]
  },
  {
    group: "Исполнение и отчеты",
    title: "Отчеты",
    href: "/activity-reports",
    icon: PieChart,
    modes: ["work"]
  },
  {
    group: "Исполнение и отчеты",
    title: "Пакеты документов",
    href: "/document-packages",
    icon: PackageCheck,
    modes: ["work"]
  },
  {
    group: "Проверка и документы",
    title: "Рабочая программа",
    href: "/work-program",
    icon: ScrollText,
    modes: ["work"]
  },
  {
    group: "Проверка и документы",
    title: "Проверка соответствия",
    href: "/compliance-check",
    icon: ShieldCheck,
    modes: ["work"]
  },
  {
    group: "Проверка и документы",
    title: "Центр проверок",
    href: "/inspection-center",
    icon: SearchCheck,
    modes: ["work"]
  },
  {
    group: "Служебные инструменты",
    title: "Загрузка и анализ документов",
    href: "/document-processing",
    icon: FileInput,
    modes: ["work"]
  },
  {
    group: "Служебные инструменты",
    title: "Федеральная база знаний",
    href: "/federal-knowledge",
    icon: LibraryBig,
    modes: ["work"]
  },
  {
    group: "Служебные инструменты",
    title: "Модули воспитания",
    href: "/education-modules",
    icon: BookOpenCheck,
    modes: ["work"]
  },
  {
    group: "Служебные инструменты",
    title: "Экспорт документов",
    href: "/exports",
    icon: FileArchive,
    modes: ["work"]
  }
] as const satisfies ReadonlyArray<{
  group: string;
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  modes: readonly NavItemMode[];
}>;

export function getNavItemsForMode(mode: AppMode) {
  return navItems.filter((item) => (item.modes as readonly NavItemMode[]).includes(mode));
}
