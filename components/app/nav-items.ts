import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileArchive,
  FileInput,
  FileClock,
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

const text = {
  start: "\u0421\u0442\u0430\u0440\u0442",
  home: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f",
  demo: "\u0414\u0435\u043c\u043e",
  demoShowcase: "\u0414\u0435\u043c\u043e\u043d\u0441\u0442\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442",
  launchReadiness: "\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043a \u0437\u0430\u043f\u0443\u0441\u043a\u0443",
  schoolData: "\u0414\u0430\u043d\u043d\u044b\u0435 \u0448\u043a\u043e\u043b\u044b",
  schoolPassport: "\u041f\u0430\u0441\u043f\u043e\u0440\u0442 \u0448\u043a\u043e\u043b\u044b",
  educationalSystem: "\u0412\u043e\u0441\u043f\u0438\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430",
  extraActivities: "\u0412\u043d\u0435\u0443\u0440\u043e\u0447\u043d\u0430\u044f \u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c",
  normativeDocuments: "\u041d\u043e\u0440\u043c\u0430\u0442\u0438\u0432\u043d\u044b\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b",
  planning: "\u041f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",
  events: "\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f",
  kpvr: "\u041a\u041f\u0412\u0420",
  activityPlans: "\u041f\u043b\u0430\u043d\u044b \u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438",
  activityMatrix: "\u041c\u0430\u0442\u0440\u0438\u0446\u0430 \u0432\u043e\u0441\u043f\u0438\u0442\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0439 \u0434\u0435\u044f\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438",
  executionReports: "\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435 \u0438 \u043e\u0442\u0447\u0435\u0442\u044b",
  eventExecution: "\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c \u0438\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f",
  reports: "\u041e\u0442\u0447\u0435\u0442\u044b",
  documentPackages: "\u041f\u0430\u043a\u0435\u0442\u044b \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432",
  checksDocuments: "\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b",
  workProgram: "\u0420\u0430\u0431\u043e\u0447\u0430\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430",
  complianceCheck: "\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044f",
  inspectionCenter: "\u0426\u0435\u043d\u0442\u0440 \u043f\u0440\u043e\u0432\u0435\u0440\u043e\u043a",
  tools: "\u0421\u043b\u0443\u0436\u0435\u0431\u043d\u044b\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b",
  importEvents: "\u0418\u043c\u043f\u043e\u0440\u0442 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439",
  importHistory: "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0438\u043c\u043f\u043e\u0440\u0442\u043e\u0432",
  documentProcessing: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0438 \u0430\u043d\u0430\u043b\u0438\u0437 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432",
  federalKnowledge: "\u0424\u0435\u0434\u0435\u0440\u0430\u043b\u044c\u043d\u0430\u044f \u0431\u0430\u0437\u0430 \u0437\u043d\u0430\u043d\u0438\u0439",
  educationModules: "\u041c\u043e\u0434\u0443\u043b\u0438 \u0432\u043e\u0441\u043f\u0438\u0442\u0430\u043d\u0438\u044f",
  exports: "\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432"
} as const;

export const navItems = [
  { group: text.start, title: text.home, href: "/", icon: Home, modes: ["work"] },
  { group: text.start, title: text.demo, href: "/demo", icon: Rocket, modes: ["demo"] },
  { group: text.start, title: text.demoShowcase, href: "/demo-showcase", icon: Route, modes: ["demo"] },
  { group: text.start, title: text.launchReadiness, href: "/launch-readiness", icon: Rocket, modes: ["work"] },
  { group: text.schoolData, title: text.schoolPassport, href: "/school-passport", icon: School, modes: ["work"] },
  { group: text.schoolData, title: text.educationalSystem, href: "/educational-system", icon: Network, modes: ["work"] },
  { group: text.schoolData, title: text.extraActivities, href: "/extra-activities", icon: Landmark, modes: ["work"] },
  { group: text.schoolData, title: text.normativeDocuments, href: "/normative-documents", icon: Scale, modes: ["work"] },
  { group: text.planning, title: text.events, href: "/events", icon: CalendarDays, modes: ["work"] },
  { group: text.planning, title: text.kpvr, href: "/kpvr", icon: ClipboardList, modes: ["work"] },
  { group: text.planning, title: text.activityPlans, href: "/activity-plans", icon: ListChecks, modes: ["work"] },
  { group: text.planning, title: text.activityMatrix, href: "/activity-matrix", icon: Grid3X3, modes: ["work"] },
  { group: text.executionReports, title: text.eventExecution, href: "/event-execution", icon: ClipboardCheck, modes: ["work"] },
  { group: text.executionReports, title: text.reports, href: "/activity-reports", icon: PieChart, modes: ["work"] },
  { group: text.executionReports, title: text.documentPackages, href: "/document-packages", icon: PackageCheck, modes: ["work"] },
  { group: text.checksDocuments, title: text.workProgram, href: "/work-program", icon: ScrollText, modes: ["work"] },
  { group: text.checksDocuments, title: text.complianceCheck, href: "/compliance-check", icon: ShieldCheck, modes: ["work"] },
  { group: text.checksDocuments, title: text.inspectionCenter, href: "/inspection-center", icon: SearchCheck, modes: ["work"] },
  { group: text.tools, title: text.documentProcessing, href: "/document-processing", icon: FileInput, modes: ["work"] },
  { group: text.tools, title: text.importHistory, href: "/import-history", icon: FileClock, modes: ["work"] },
  { group: text.tools, title: text.importEvents, href: "/import-documents", icon: FileInput, modes: ["hidden"] },
  { group: text.tools, title: text.federalKnowledge, href: "/federal-knowledge", icon: LibraryBig, modes: ["work"] },
  { group: text.tools, title: text.educationModules, href: "/education-modules", icon: BookOpenCheck, modes: ["work"] },
  { group: text.tools, title: text.exports, href: "/exports", icon: FileArchive, modes: ["work"] }
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
