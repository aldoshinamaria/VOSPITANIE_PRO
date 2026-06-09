import {
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  DatabaseZap,
  FileArchive,
  FileInput,
  Home,
  Landmark,
  LibraryBig,
  Network,
  Scale,
  School,
  ScrollText
} from "lucide-react";

export const navItems = [
  {
    title: "Главная",
    href: "/",
    icon: Home
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
    title: "КПВР",
    href: "/kpvr",
    icon: ClipboardList
  },
  {
    title: "Документный движок",
    href: "/document-processing",
    icon: DatabaseZap
  },
  {
    title: "Федеральная база знаний",
    href: "/federal-knowledge",
    icon: LibraryBig
  },
  {
    title: "Рабочая программа воспитания",
    href: "/work-program",
    icon: ScrollText
  },
  {
    title: "Нормативные документы",
    href: "/normative-documents",
    icon: Scale
  },
  {
    title: "Внеурочная деятельность",
    href: "/extra-activities",
    icon: Landmark
  },
  {
    title: "Экспорт документов",
    href: "/exports",
    icon: FileArchive
  },
  {
    title: "Импорт документов",
    href: "/import-documents",
    icon: FileInput
  }
] as const;
