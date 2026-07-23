import { createId } from "@/lib/utils";
import type {
  ComplianceCheck,
  ComplianceCheckHistory,
  ComplianceIssue,
  ComplianceOverallStatus,
  ComplianceRecommendation,
  ComplianceStatus,
  EducationModule,
  EducationLevel,
  EducationalSystem,
  FederalDirection,
  FederalKnowledgeBase,
  FederalProgramSection,
  ExtraActivity,
  KpvrItem,
  NormativeDocument,
  SchoolEvent,
  WorkProgram,
  WorkProgramSection
} from "@/types/domain";

export interface WorkProgramComplianceCheckerInput {
  workProgram?: WorkProgram | null;
  federalKnowledgeBase: FederalKnowledgeBase;
  kpvr?: KpvrItem[];
  events?: SchoolEvent[];
  educationalSystem?: EducationalSystem;
  extraActivities?: ExtraActivity[];
  educationModules?: EducationModule[];
  normativeDocuments?: NormativeDocument[];
}

export interface WorkProgramComplianceChecker {
  check(input: WorkProgramComplianceCheckerInput): ComplianceCheck;
}

const minimumSectionTextLength = 240;
const targetLevels: EducationLevel[] = ["noo", "ooo", "soo"];

export class RuleBasedWorkProgramComplianceChecker implements WorkProgramComplianceChecker {
  check(input: WorkProgramComplianceCheckerInput): ComplianceCheck {
    const workProgram = input.workProgram;
    const events = input.events ?? [];
    const kpvr = input.kpvr ?? [];
    const educationalSystem = input.educationalSystem ?? { associations: [], infrastructureObjects: [], partners: [] };
    const extraActivities = input.extraActivities ?? [];
    const educationModules = input.educationModules ?? [];
    const normativeDocuments = input.normativeDocuments ?? [];
    const issues: ComplianceIssue[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    const programText = normalizeText(extractProgramText(workProgram));
    const sectionCoverage = input.federalKnowledgeBase.programSections.map((section) =>
      checkRequiredSection(section, workProgram, issues, recommendations)
    );
    const directionCoverage = input.federalKnowledgeBase.directions.map((direction) =>
      checkDirectionCoverage(direction, programText, events, extraActivities, issues, recommendations)
    );
    const targetResultCoverage = targetLevels.map((level) =>
      checkTargetResults(level, input.federalKnowledgeBase, workProgram, programText, issues, recommendations)
    );

    checkKpvrConnection(workProgram, kpvr, events, issues, recommendations, input.federalKnowledgeBase.source);
    checkEducationalSystemConnection(workProgram, educationalSystem, issues, recommendations, input.federalKnowledgeBase.source);
    checkAppendices(kpvr, extraActivities, educationModules, educationalSystem, issues, recommendations, input.federalKnowledgeBase.source);
    checkNormativeActuality(normativeDocuments, issues, recommendations, input.federalKnowledgeBase.source);

    const allScores = [
      ...sectionCoverage.map((item) => item.score),
      ...directionCoverage.map((item) => item.score),
      ...targetResultCoverage.map((item) => item.score)
    ];
    const severityPenalty = issues.reduce((sum, issue) => sum + (issue.severity === "critical" ? 10 : issue.severity === "warning" ? 5 : 1), 0);
    const baseScore = average(allScores);
    const overallScore = clamp(Math.round(baseScore - severityPenalty), 0, 100);

    return {
      overallScore,
      sectionCoverage,
      directionCoverage,
      targetResultCoverage,
      issues,
      recommendations,
      checkedAt: new Date().toISOString()
    };
  }
}

export function createWorkProgramComplianceChecker(): WorkProgramComplianceChecker {
  return new RuleBasedWorkProgramComplianceChecker();
}

export function getComplianceCheckStatus(check: ComplianceCheck): ComplianceOverallStatus {
  if (check.overallScore >= 85 && check.issues.every((issue) => issue.severity !== "critical")) {
    return "compliant";
  }

  if (check.overallScore >= 60) {
    return "partially_compliant";
  }

  return "needs_revision";
}

export function createComplianceCheckHistoryEntry(check: ComplianceCheck): ComplianceCheckHistory {
  return {
    id: createId("compliance-history"),
    checkedAt: check.checkedAt,
    overallScore: check.overallScore,
    status: getComplianceCheckStatus(check),
    issueCount: check.issues.length,
    highSeverityCount: check.issues.filter((issue) => issue.severity === "critical").length,
    mediumSeverityCount: check.issues.filter((issue) => issue.severity === "warning").length,
    lowSeverityCount: check.issues.filter((issue) => issue.severity === "info").length,
    snapshot: check
  };
}

export function sortComplianceIssues(issues: ComplianceIssue[]) {
  const severityRank = {
    critical: 0,
    warning: 1,
    info: 2
  };

  return [...issues].sort((issueA, issueB) => severityRank[issueA.severity] - severityRank[issueB.severity]);
}

export function buildComplianceFixPlan(check: ComplianceCheck) {
  return sortComplianceIssues(check.issues)
    .slice(0, 8)
    .map((issue, index) => `${index + 1}. ${issue.recommendation} (${issue.location})`);
}

function checkRequiredSection(
  requirement: FederalProgramSection,
  workProgram: WorkProgram | null | undefined,
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[]
) {
  const section = workProgram?.sections?.find((item) => item.id === requirement.id);
  const textLength = section ? extractSectionText(section).length : 0;
  const hasSubsections = Boolean(section?.subsections?.length);
  let status: ComplianceStatus = "passed";
  let score = 100;
  let issueCount = 0;

  if (!section) {
    status = "failed";
    score = 0;
    issueCount += 1;
    addIssue(issues, recommendations, {
      severity: "critical",
      status,
      description: `Обязательный раздел «${requirement.title}» отсутствует.`,
      location: requirement.title,
      whyItMatters: "Без обязательного раздела рабочая программа не соответствует федеральной структуре.",
      requirementSource: requirement.requirementSource,
      recommendation: `Добавьте или пересоберите раздел «${requirement.title}».`
    });
  } else if (!hasSubsections || textLength < minimumSectionTextLength) {
    status = "needs_review";
    score = hasSubsections ? 55 : 35;
    issueCount += 1;
    addIssue(issues, recommendations, {
      severity: "warning",
      status,
      description: `Раздел «${requirement.title}» найден, но выглядит неполным: ${textLength} символов.`,
      location: requirement.title,
      whyItMatters: "Короткий или пустой раздел не раскрывает обязательные критерии полноты.",
      requirementSource: requirement.requirementSource,
      recommendation: `Дополните раздел: ${requirement.completenessCriteria.join("; ")}.`
    });
  }

  return {
    sectionId: requirement.id,
    title: requirement.title,
    required: requirement.required,
    status,
    score,
    textLength,
    issueCount
  };
}

function checkDirectionCoverage(
  direction: FederalDirection,
  programText: string,
  events: SchoolEvent[],
  extraActivities: ExtraActivity[],
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[]
) {
  const corpus = normalizeText(
    [
      programText,
      ...events.map((event) => `${event.title} ${event.description} ${event.direction} ${event.shortReport}`),
      ...extraActivities.map((activity) => `${activity.title} ${activity.area}`)
    ].join(" ")
  );
  const matchedKeywords = direction.keywords.filter((keyword) => corpus.includes(normalizeText(keyword)));
  const missingKeywords = direction.keywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const score = Math.round((matchedKeywords.length / Math.max(direction.keywords.length, 1)) * 100);
  const status: ComplianceStatus = score >= 35 ? "passed" : score > 0 ? "needs_review" : "failed";

  if (status !== "passed") {
    addIssue(issues, recommendations, {
      severity: status === "failed" ? "critical" : "warning",
      status,
      description: `Направление воспитания «${direction.title}» недостаточно отражено в программе и связанных данных.`,
      location: "Направления воспитания",
      whyItMatters: "Федеральная структура требует охвата всех направлений воспитания.",
      requirementSource: direction.source,
      recommendation: `Добавьте содержание, мероприятия или формы работы по направлению «${direction.title}».`
    });
  }

  return {
    directionId: direction.id,
    title: direction.title,
    status,
    score,
    matchedKeywords,
    missingKeywords
  };
}

function checkTargetResults(
  level: EducationLevel,
  knowledgeBase: FederalKnowledgeBase,
  workProgram: WorkProgram | null | undefined,
  programText: string,
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[]
) {
  const targetSectionText = normalizeText(extractSectionText(workProgram?.sections?.find((section) => section.id === "target")));
  const textToCheck = `${targetSectionText} ${programText}`;
  const targetResults = knowledgeBase.targetResults.filter((result) => result.educationLevel === level);
  const missing = targetResults.filter((result) => {
    const keywordMatched = result.verificationKeywords.some((keyword) => textToCheck.includes(normalizeText(keyword)));
    const levelMatched = textToCheck.includes(level);

    return !keywordMatched || !levelMatched;
  });
  const covered = targetResults.length - missing.length;
  const score = Math.round((covered / Math.max(targetResults.length, 1)) * 100);
  const status: ComplianceStatus = score >= 70 ? "passed" : score > 0 ? "needs_review" : "failed";

  if (status !== "passed") {
    addIssue(issues, recommendations, {
      severity: status === "failed" ? "critical" : "warning",
      status,
      description: `Целевые ориентиры уровня ${level.toUpperCase()} покрыты не полностью: ${covered} из ${targetResults.length}.`,
      location: "Целевой раздел",
      whyItMatters: "Целевые ориентиры должны быть представлены отдельно для НОО, ООО и СОО.",
      requirementSource: knowledgeBase.source,
      recommendation: `Дополните целевые ориентиры уровня ${level.toUpperCase()} по направлениям воспитания.`
    });
  }

  return {
    educationLevel: level,
    status,
    score,
    covered,
    total: targetResults.length,
    missingTargetResultIds: missing.map((result) => result.id)
  };
}

function checkKpvrConnection(
  workProgram: WorkProgram | null | undefined,
  kpvr: KpvrItem[],
  events: SchoolEvent[],
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[],
  source: string
) {
  const contentText = normalizeText(extractSectionText(workProgram?.sections?.find((section) => section.id === "content")));
    const moduleCandidates = unique(
      [
        ...kpvr.map((item) => item.module ?? ""),
        ...events.map((event) => event.moduleId),
        ...events.map((event) => event.direction)
      ].filter((value): value is string => Boolean(value?.trim()))
    );
  const missingModules = moduleCandidates.filter((moduleName) => !contentText.includes(normalizeText(moduleName)));

  if (moduleCandidates.length > 0 && missingModules.length > 0) {
    addIssue(issues, recommendations, {
      severity: "warning",
      status: "needs_review",
      description: `В КПВР или мероприятиях есть модули/направления, не отраженные в содержательном разделе: ${missingModules.slice(0, 6).join(", ")}.`,
      location: "Связь КПВР и содержательного раздела",
      whyItMatters: "КПВР должен быть связан с содержанием рабочей программы, иначе документ выглядит несогласованным.",
      requirementSource: source,
      recommendation: "Пересоберите содержательный раздел или добавьте описание соответствующих модулей воспитания."
    });
  }
}

function checkEducationalSystemConnection(
  workProgram: WorkProgram | null | undefined,
  educationalSystem: EducationalSystem,
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[],
  source: string
) {
  const programText = normalizeText(extractProgramText(workProgram));
  const importantAssociations = educationalSystem.associations.filter((association) =>
    ["volunteer_team", "school_museum", "yuid", "eaglets_of_russia", "first_movement"].includes(association.type)
  );
  const missingAssociations = importantAssociations.filter((association) => !programText.includes(normalizeText(association.title)));

  if (missingAssociations.length > 0) {
    addIssue(issues, recommendations, {
      severity: "warning",
      status: "needs_review",
      description: `В воспитательной системе есть значимые объединения, не отраженные в программе: ${missingAssociations.map((item) => item.title).join(", ")}.`,
      location: "Уклад школы / Воспитательные объединения",
      whyItMatters: "Реальные объединения школы должны быть отражены в укладе и содержательном разделе программы.",
      requirementSource: source,
      recommendation: "Пересоберите раздел «Уклад школы» и проверьте блок воспитательных объединений."
    });
  }
}

function checkAppendices(
  kpvr: KpvrItem[],
  extraActivities: ExtraActivity[],
  educationModules: EducationModule[],
  educationalSystem: EducationalSystem,
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[],
  source: string
) {
  const checks = [
    {
      passed: kpvr.length > 0,
      description: "В приложениях к рабочей программе не найден КПВР.",
      recommendation: "Сформируйте КПВР и включите его в приложения к рабочей программе.",
      targetModule: "kpvr" as const,
      targetUrl: "/kpvr"
    },
    {
      passed: extraActivities.length > 0,
      description: "В приложениях не найден план внеурочной деятельности.",
      recommendation: "Добавьте программы внеурочной деятельности и включите план в приложения.",
      targetModule: "work-program" as const,
      targetUrl: "/extra-activities"
    },
    {
      passed: educationModules.some((module) => module.active),
      description: "В приложениях не найден актуальный список модулей воспитания.",
      recommendation: "Проверьте справочник модулей воспитания и включите его в приложения.",
      targetModule: "work-program" as const,
      targetUrl: "/education-modules"
    },
    {
      passed: educationalSystem.partners.length > 0,
      description: "В приложениях не найден раздел с социальными партнерами.",
      recommendation: "Добавьте социальных партнеров в воспитательную систему и отразите их в приложениях.",
      targetModule: "educational-system" as const,
      targetUrl: "/educational-system"
    },
    {
      passed: educationalSystem.associations.length > 0 || educationalSystem.infrastructureObjects.length > 0,
      description: "В приложениях не отражена воспитательная система школы.",
      recommendation: "Заполните объединения и инфраструктуру школы, затем пересоберите рабочую программу.",
      targetModule: "educational-system" as const,
      targetUrl: "/educational-system"
    }
  ];

  checks
    .filter((check) => !check.passed)
    .forEach((check) => {
      addIssue(issues, recommendations, {
        severity: "warning",
        status: "needs_review",
        description: check.description,
        location: "Приложения",
        whyItMatters: "Приложения подтверждают, что рабочая программа связана с реальными планами и ресурсами школы.",
        requirementSource: source,
        recommendation: check.recommendation,
        targetModule: check.targetModule,
        targetSectionId: "appendices",
        targetUrl: check.targetUrl
      });
    });
}

function checkNormativeActuality(
  normativeDocuments: NormativeDocument[],
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[],
  source: string
) {
  const currentFederalProgram = normativeDocuments.some(
    (document) => document.category === "federal_work_program" && document.actualityStatus === "current"
  );
  const currentFederalCalendarPlan = normativeDocuments.some(
    (document) => document.category === "federal_calendar_plan" && document.actualityStatus === "current"
  );
  const outdatedDocuments = normativeDocuments.filter((document) => document.actualityStatus === "outdated");
  const needsReviewDocuments = normativeDocuments.filter((document) => document.actualityStatus === "needs_review");

  if (!currentFederalProgram) {
    addIssue(issues, recommendations, {
      severity: "critical",
      status: "failed",
      description: "В нормативном центре нет актуальной федеральной рабочей программы воспитания.",
      location: "Нормативные документы",
      whyItMatters: "Без актуального федерального документа невозможно надежно подтвердить соответствие рабочей программы.",
      requirementSource: source,
      recommendation: "Загрузите или отметьте актуальной федеральную рабочую программу воспитания.",
      targetModule: "normative-documents",
      targetUrl: "/normative-documents"
    });
  }

  if (!currentFederalCalendarPlan) {
    addIssue(issues, recommendations, {
      severity: "critical",
      status: "failed",
      description: "В нормативном центре нет актуального федерального календарного плана.",
      location: "Нормативные документы",
      whyItMatters: "КПВР школы должен сверяться с актуальным федеральным календарным планом.",
      requirementSource: source,
      recommendation: "Добавьте актуальный федеральный календарный план в нормативные документы.",
      targetModule: "normative-documents",
      targetUrl: "/normative-documents"
    });
  }

  if (outdatedDocuments.length > 0) {
    addIssue(issues, recommendations, {
      severity: "warning",
      status: "needs_review",
      description: `Есть устаревшие нормативные документы: ${outdatedDocuments.map((document) => document.title).join(", ")}.`,
      location: "Нормативные документы",
      whyItMatters: "Устаревшие документы могут привести к расхождениям в рабочей программе и КПВР.",
      requirementSource: source,
      recommendation: "Проверьте устаревшие документы и замените их актуальными версиями.",
      targetModule: "normative-documents",
      targetUrl: "/normative-documents"
    });
  }

  if (needsReviewDocuments.length > 0) {
    addIssue(issues, recommendations, {
      severity: "info",
      status: "needs_review",
      description: `Есть нормативные документы со статусом проверки: ${needsReviewDocuments.map((document) => document.title).join(", ")}.`,
      location: "Нормативные документы",
      whyItMatters: "Документы со статусом проверки требуют ручного подтверждения актуальности.",
      requirementSource: source,
      recommendation: "Проверьте документы со статусом «требует обновления» и подтвердите их актуальность.",
      targetModule: "normative-documents",
      targetUrl: "/normative-documents"
    });
  }
}

function addIssue(
  issues: ComplianceIssue[],
  recommendations: ComplianceRecommendation[],
  issue: Omit<ComplianceIssue, "id" | "targetModule" | "targetSectionId" | "targetSubsectionId" | "targetUrl"> &
    Partial<Pick<ComplianceIssue, "targetModule" | "targetSectionId" | "targetSubsectionId" | "targetUrl">>
) {
  const target = resolveIssueTarget(issue);
  const nextIssue = {
    ...target,
    ...issue,
    id: createId("compliance-issue")
  };

  if (nextIssue.targetModule === "work-program" && nextIssue.targetSectionId) {
    nextIssue.targetUrl = `/work-program#section-${nextIssue.targetSectionId}`;
  }

  issues.push(nextIssue);
  recommendations.push({
    id: createId("compliance-recommendation"),
    priority: issue.severity,
    title: issue.recommendation,
    description: issue.description,
    targetLocation: issue.location,
    sourceRequirement: issue.requirementSource
  });
}

function resolveIssueTarget(issue: Pick<ComplianceIssue, "location"> & Partial<Pick<ComplianceIssue, "targetModule" | "targetSectionId" | "targetSubsectionId" | "targetUrl">>) {
  if (issue.targetModule && issue.targetUrl) {
    return {
      targetModule: issue.targetModule,
      targetSectionId: issue.targetSectionId,
      targetSubsectionId: issue.targetSubsectionId,
      targetUrl: issue.targetUrl
    };
  }

  const location = normalizeText(issue.location);

  if (location.includes("кпвр") || location.includes("РєРїРІСЂ")) {
    return {
      targetModule: "kpvr" as const,
      targetSectionId: "kpvr",
      targetUrl: "/kpvr"
    };
  }

  if (location.includes("норматив") || location.includes("РЅРѕСЂРјР°С‚РёРІ")) {
    return {
      targetModule: "normative-documents" as const,
      targetUrl: "/normative-documents"
    };
  }

  if (location.includes("уклад") || location.includes("объедин") || location.includes("СѓРєР»Р°Рґ") || location.includes("РѕР±СЉРµРґРёРЅ")) {
    return {
      targetModule: "educational-system" as const,
      targetSectionId: "school-culture",
      targetUrl: "/educational-system"
    };
  }

  if (location.includes("цел") || location.includes("С†РµР»")) {
    return {
      targetModule: "work-program" as const,
      targetSectionId: "target",
      targetUrl: "/work-program"
    };
  }

  if (location.includes("содерж") || location.includes("СЃРѕРґРµСЂ")) {
    return {
      targetModule: "work-program" as const,
      targetSectionId: "content",
      targetUrl: "/work-program"
    };
  }

  if (location.includes("организа") || location.includes("РѕСЂРіР°РЅРёР·")) {
    return {
      targetModule: "work-program" as const,
      targetSectionId: "organizational",
      targetUrl: "/work-program"
    };
  }

  if (location.includes("прилож") || location.includes("РїСЂРёР»РѕР¶")) {
    return {
      targetModule: "work-program" as const,
      targetSectionId: "appendices",
      targetUrl: "/work-program"
    };
  }

  return {
    targetModule: "work-program" as const,
    targetUrl: "/work-program"
  };
}

function extractProgramText(workProgram: WorkProgram | null | undefined) {
  return workProgram?.sections?.map((section) => extractSectionText(section)).join("\n") ?? "";
}

function extractSectionText(section: WorkProgramSection | null | undefined) {
  return (
    section?.subsections
      ?.flatMap((subsection) => subsection.generatedContent)
      .filter((content) => content.status !== "removed")
      .map((content) => `${content.text} ${content.sources.map((source) => source.title).join(" ")}`)
      .join("\n") ?? ""
  );
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
