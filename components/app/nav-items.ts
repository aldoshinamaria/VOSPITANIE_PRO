import {
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileArchive,
  Home,
  Landmark,
  School
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
    title: "Внеурочная деятельность",
    href: "/extra-activities",
    icon: Landmark
  },
  {
    title: "Экспорт документов",
    href: "/exports",
    icon: FileArchive
  }
] as const;
