import { federalKnowledgeBase } from "@/lib/domain/federal-knowledge/federal-knowledge-base";
import { createWorkProgramComplianceChecker, getComplianceCheckStatus } from "@/lib/domain/federal-knowledge/work-program-compliance-checker";
import type { AppState, SchoolReadinessArea, SchoolReadinessCheck, SchoolReadinessItem } from "@/types/domain";

export interface SchoolReadinessChecker {
  check(state: AppState): SchoolReadinessCheck;
}

export class RuleBasedSchoolReadinessChecker implements SchoolReadinessChecker {
  check(state: AppState): SchoolReadinessCheck {
    const areas = [
      checkSchoolPassport(state),
      checkEducationalSystem(state),
      checkKpvr(state),
      checkWorkProgram(state),
      checkNormativeBase(state)
    ];
    const overallScore = Math.round(areas.reduce((sum, area) => sum + area.score, 0) / areas.length);
    const blockers = areas.flatMap((area) => area.blockers);

    return {
      overallScore,
      status: blockers.length > 0 ? "blocked" : overallScore >= 85 ? "ready" : "partial",
      filled: areas.filter((area) => area.status === "ready"),
      notFilled: areas.filter((area) => area.status !== "ready"),
      blockers,
      areas,
      checkedAt: new Date().toISOString()
    };
  }
}

export function createSchoolReadinessChecker(): SchoolReadinessChecker {
  return new RuleBasedSchoolReadinessChecker();
}

function checkSchoolPassport(state: AppState): SchoolReadinessArea {
  const passport = state.schoolPassport;
  const items: SchoolReadinessItem[] = [
    item("school-name", "Название школы", passport.name, "Укажите официальное название школы.", "/school-passport"),
    item("school-region", "Регион и муниципалитет", passport.region && passport.municipality, "Заполните регион и муниципалитет.", "/school-passport"),
    item("school-address", "Адрес", passport.address, "Заполните адрес школы.", "/school-passport"),
    item("school-leaders", "Руководители", passport.principal && passport.deputyDirector, "Укажите директора и заместителя директора по ВР.", "/school-passport"),
    item("school-year", "Учебный год", passport.academicYear, "Укажите учебный год.", "/school-passport"),
    item("school-counts", "Контингент", passport.studentsCount > 0 && passport.classesCount > 0, "Укажите количество обучающихся и классов.", "/school-passport")
  ];

  return buildArea("school-passport", "Паспорт школы", "/school-passport", items);
}

function checkEducationalSystem(state: AppState): SchoolReadinessArea {
  const activeAssociations = state.educationalSystem.associations.filter((association) => association.status === "active");
  const hasInfrastructure =
    state.educationalSystem.infrastructureObjects.length > 0 ||
    Object.values(state.schoolPassport.infrastructure).some(Boolean);
  const partnerCount = state.educationalSystem.partners.length + state.schoolPassport.socialPartners.length;
  const items: SchoolReadinessItem[] = [
    item("associations", "Воспитательные объединения", activeAssociations.length > 0, "Добавьте хотя бы одно активное объединение.", "/educational-system"),
    item("infrastructure", "Инфраструктура", hasInfrastructure, "Добавьте музей, ЦДИ, медиацентр или другой ресурс школы.", "/educational-system"),
    item("partners", "Социальные партнеры", partnerCount > 0, "Добавьте социальных партнеров.", "/educational-system"),
    item("responsibles", "Ответственные", hasAssociationLeaders(state), "Укажите руководителей объединений и ответственных за инфраструктуру.", "/educational-system", false)
  ];

  return buildArea("educational-system", "Воспитательная система", "/educational-system", items);
}

function checkKpvr(state: AppState): SchoolReadinessArea {
  const levels = ["noo", "ooo", "soo"] as const;
  const items: SchoolReadinessItem[] = [
    item("events", "Мероприятия", state.events.length > 0, "Добавьте мероприятия в реестр.", "/events"),
    ...levels.map((level) =>
      item(
        `events-${level}`,
        `Мероприятия ${level.toUpperCase()}`,
        state.events.some((event) => event.educationLevels.includes(level)),
        `Добавьте хотя бы одно мероприятие для ${level.toUpperCase()}.`,
        "/events"
      )
    ),
    item(
      "event-required-fields",
      "Обязательные поля мероприятий",
      state.events.every(
        (event) =>
          event.title &&
          event.moduleId &&
          event.startDate &&
          event.responsible &&
          state.eventDirectionRelations.some((relation) => relation.eventId === event.id)
      ),
      "Проверьте название, модуль, дату и ответственного в карточках мероприятий.",
      "/events"
    )
  ];

  return buildArea("kpvr", "КПВР", "/kpvr", items);
}

function checkWorkProgram(state: AppState): SchoolReadinessArea {
  const checker = createWorkProgramComplianceChecker();
  const compliance = checker.check({
    workProgram: state.workProgram,
    federalKnowledgeBase,
    kpvr: state.kpvr,
    events: state.events,
    educationalSystem: state.educationalSystem,
    extraActivities: state.extraActivities,
    educationModules: state.educationModules,
    normativeDocuments: state.normativeDocuments
  });
  const complianceStatus = getComplianceCheckStatus(compliance);
  const items: SchoolReadinessItem[] = [
    item("work-program-exists", "Структура программы", state.workProgram.sections.length >= 5, "Пересоберите рабочую программу.", "/work-program"),
    item("work-program-progress", "Готовность разделов", state.workProgram.progress.percent >= 70, "Проверьте разделы, требующие данных или ручной проверки.", "/work-program"),
    item("work-program-compliance", "Проверка соответствия", complianceStatus !== "needs_revision", "Закройте критические замечания проверки соответствия.", "/compliance-check"),
    item("work-program-review", "Нет критических замечаний", !compliance.issues.some((issue) => issue.severity === "critical"), "Откройте проверку соответствия и устраните критические проблемы.", "/compliance-check")
  ];

  return buildArea("work-program", "Рабочая программа", "/work-program", items);
}

function checkNormativeBase(state: AppState): SchoolReadinessArea {
  const documents = state.normativeDocuments;
  const items: SchoolReadinessItem[] = [
    item("federal-program", "Федеральная рабочая программа", documents.some((document) => document.category === "federal_work_program" && document.actualityStatus === "current"), "Добавьте актуальную федеральную рабочую программу.", "/normative-documents"),
    item("federal-calendar", "Федеральный календарный план", documents.some((document) => document.category === "federal_calendar_plan" && document.actualityStatus === "current"), "Добавьте актуальный федеральный календарный план.", "/normative-documents"),
    item("no-outdated", "Нет устаревших документов", documents.every((document) => document.actualityStatus !== "outdated"), "Обновите документы со статусом «устарел».", "/normative-documents"),
    item("reviewed-documents", "Документы проверены", documents.every((document) => document.actualityStatus !== "needs_review"), "Проверьте документы со статусом «требует проверки».", "/normative-documents", false)
  ];

  return buildArea("normative-base", "Нормативная база", "/normative-documents", items);
}

function buildArea(id: SchoolReadinessArea["id"], title: string, href: string, items: SchoolReadinessItem[]): SchoolReadinessArea {
  const requiredItems = items.filter((checkItem) => checkItem.required);
  const completed = items.filter((checkItem) => checkItem.done);
  const missing = items.filter((checkItem) => !checkItem.done);
  const missingRequired = requiredItems.filter((checkItem) => !checkItem.done);
  const score = Math.round((completed.length / Math.max(items.length, 1)) * 100);

  return {
    id,
    title,
    status: missingRequired.length > 0 ? (score >= 50 ? "partial" : "blocked") : "ready",
    score,
    completed,
    missing,
    blockers: missingRequired.map((checkItem) => checkItem.description),
    href
  };
}

function item(id: string, title: string, done: unknown, description: string, href: string, required = true): SchoolReadinessItem {
  return {
    id,
    title,
    description,
    done: Boolean(done),
    required,
    href
  };
}

function hasAssociationLeaders(state: AppState) {
  const associationsReady =
    state.educationalSystem.associations.length === 0 ||
    state.educationalSystem.associations.every((association) => Boolean(association.leader));
  const infrastructureReady =
    state.educationalSystem.infrastructureObjects.length === 0 ||
    state.educationalSystem.infrastructureObjects.every((object) => Boolean(object.responsible));

  return associationsReady && infrastructureReady;
}
