import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";

import { createActivityMatrixAnalyzer } from "@/lib/domain/activity-matrix";
import { createActivityPlanBuilder } from "@/lib/domain/activity-plans";
import { createActivityReportBuilder } from "@/lib/domain/activity-reports";
import { calculateEventExecutionStatistics, createEventExecutionRiskAnalyzer, migrateEventExecutions } from "@/lib/domain/event-execution";
import { createWorkProgramComplianceChecker, getComplianceCheckStatus } from "@/lib/domain/federal-knowledge/work-program-compliance-checker";
import { federalKnowledgeBase } from "@/lib/domain/federal-knowledge/federal-knowledge-base";
import type {
  AppState,
  InspectionChecklist,
  InspectionEvidence,
  InspectionGap,
  InspectionPackage,
  InspectionPackageItem,
  InspectionPackageSection,
  InspectionReadiness,
  InspectionRecommendation,
  InspectionRequirement,
  InspectionRequirementStatus,
  InspectionRisk,
  InspectionRiskLevel,
  InspectionScenario,
  InspectionScenarioId
} from "@/types/domain";

export const inspectionScenarios: InspectionScenario[] = [
  scenario("school-self-audit", "Самообследование школы", "Комплексная подготовка школы к самообследованию воспитательной работы.", "all", 10, ["КПВР", "Рабочая программа", "Отчет", "Матрица", "Подтверждения"]),
  scenario("ddtt", "Проверка ДДТТ", "Готовность документов и мероприятий по профилактике детского дорожно-транспортного травматизма.", "direction-ddtt", 3, ["План ДДТТ", "Отчет ДДТТ", "Подтверждения"]),
  scenario("offense-prevention", "Проверка профилактики правонарушений", "Пакет по профилактике правонарушений и безнадзорности.", "direction-offense-prevention", 3, ["План профилактики", "Отчет", "Подтверждения"]),
  scenario("school-museum", "Проверка школьного музея", "Документы и мероприятия школьного музея.", "direction-school-museum", 3, ["План музея", "Отчет музея", "Подтверждения"]),
  scenario("first-movement", "Проверка Движения Первых", "Пакет по деятельности первичного отделения Движения Первых.", "direction-first-movement", 3, ["План", "Отчет", "Подтверждения"]),
  scenario("volunteer-team", "Проверка волонтерского отряда", "План, отчет и подтверждения добровольческой деятельности.", "direction-volunteer", 3, ["План волонтеров", "Отчет", "Подтверждения"]),
  scenario("parent-work", "Проверка родительской работы", "Пакет по взаимодействию с родителями.", "direction-parents", 3, ["План работы с родителями", "Отчет", "Подтверждения"]),
  scenario("internal-control", "Внутришкольный контроль заместителя директора", "Внутренний контроль исполнения мероприятий и качества документов.", "all", 8, ["Реестр", "Контроль исполнения", "Отчеты", "Риски"]),
  scenario("municipal-monitoring", "Муниципальный мониторинг воспитательной работы", "Сводный пакет для муниципального мониторинга.", "all", 10, ["КПВР", "Рабочая программа", "Отчеты", "Нормативная база"])
];

export class InspectionCenter {
  constructor(
    private readonly packageBuilder = new InspectionPackageBuilder(),
    private readonly readinessAnalyzer = new InspectionReadinessAnalyzer()
  ) {}

  buildPackage(state: AppState, scenarioId: InspectionScenarioId): InspectionPackage {
    return this.packageBuilder.build(state, scenarioId);
  }

  analyze(state: AppState, scenarioId: InspectionScenarioId): InspectionReadiness {
    return this.readinessAnalyzer.analyze(state, findInspectionScenario(scenarioId));
  }
}

export class InspectionPackageBuilder {
  build(state: AppState, scenarioId: InspectionScenarioId): InspectionPackage {
    const scenario = findInspectionScenario(scenarioId);
    const readiness = new InspectionReadinessAnalyzer().analyze(state, scenario);
    const plan = createActivityPlanBuilder().build({
      directionId: scenario.directionId,
      academicYear: state.schoolPassport.academicYear,
      state,
      options: { grouping: "month" }
    });
    const report = createActivityReportBuilder().build({
      state,
      filter: { directionId: scenario.directionId, periodMode: "academicYear" }
    });
    const matrix = createActivityMatrixAnalyzer().buildMatrix({
      mode: "month",
      events: plan.rows.map((row) => row.event),
      directions: state.activityDirections,
      relations: state.eventDirectionRelations,
      modules: state.educationModules
    });
    const evidence = buildEvidence(state, scenario, plan.rows.map((row) => row.event.id));

    return {
      id: `inspection-package-${scenario.id}`,
      scenario,
      title: `Пакет документов: ${scenario.title}`,
      readiness,
      sections: [
        section("plans", "Планы", [
          item("activity-plan", plan.title, `${plan.rows.length} мероприятий`, "plan", plan.id, plan.rows.length > 0)
        ]),
        section("reports", "Отчеты", [
          item("activity-report", report.title, `${report.statistics.totalEvents} мероприятий, выполнение ${report.statistics.planCompletionPercent}%`, "report", report.id, report.statistics.totalEvents > 0)
        ]),
        section("analytics", "Статистика и матрица", [
          item("activity-matrix", "Матрица активности", `Баланс ${matrix.analysis.balance.score}%`, "matrix", `matrix-${scenario.id}`, matrix.totalEvents > 0),
          item("risks", "Риски и рекомендации", `${readiness.risks.length} рисков`, "matrix", `risks-${scenario.id}`, readiness.risks.every((risk) => risk.level !== "high"))
        ]),
        section("evidence", "Подтверждающие данные", evidence.map((evidenceItem) =>
          item(evidenceItem.id, evidenceItem.title, evidenceItem.description, evidenceItem.sourceType, evidenceItem.sourceId, true)
        ))
      ],
      evidence,
      generatedAt: new Date().toISOString()
    };
  }
}

export class InspectionReadinessAnalyzer {
  analyze(state: AppState, scenario: InspectionScenario): InspectionReadiness {
    const requirements = buildRequirements(state, scenario);
    const checklist = new InspectionChecklistBuilder().build(requirements);
    const gaps = new InspectionGapAnalyzer().analyze(requirements);
    const risks = new InspectionRiskAnalyzer().analyze(state, scenario, requirements);
    const recommendations = buildRecommendations(gaps, risks);
    const score = calculateReadinessScore(requirements, risks);

    return {
      scenarioId: scenario.id,
      score,
      status: score >= 85 ? "ready" : score >= 60 ? "partially_ready" : "not_ready",
      label: score >= 85 ? "Готова" : score >= 60 ? "Частично готова" : "Не готова",
      checklist,
      gaps,
      risks,
      recommendations
    };
  }
}

export class InspectionChecklistBuilder {
  build(requirements: InspectionRequirement[]): InspectionChecklist {
    return {
      ready: requirements.filter((requirement) => requirement.status === "ready"),
      needsWork: requirements.filter((requirement) => requirement.status === "needs_work"),
      missing: requirements.filter((requirement) => requirement.status === "missing")
    };
  }
}

export class InspectionGapAnalyzer {
  analyze(requirements: InspectionRequirement[]): InspectionGap[] {
    return requirements
      .filter((requirement) => requirement.status !== "ready")
      .map((requirement) => ({
        id: `gap-${requirement.id}`,
        title: requirement.title,
        description: requirement.status === "missing" ? "Отсутствует обязательный элемент пакета." : "Элемент есть, но требует доработки.",
        fixUrl: inferFixUrl(requirement.id)
      }));
  }
}

export class InspectionRiskAnalyzer {
  analyze(state: AppState, scenario: InspectionScenario, requirements: InspectionRequirement[]): InspectionRisk[] {
    const risks: InspectionRisk[] = [];
    const missing = requirements.filter((requirement) => requirement.status === "missing");
    const needsWork = requirements.filter((requirement) => requirement.status === "needs_work");
    const executions = migrateEventExecutions(state.events, state.eventExecutions);
    const executionRisks = createEventExecutionRiskAnalyzer().analyze(state.events, executions);

    missing.forEach((requirement) => risks.push(risk(`missing-${requirement.id}`, "high", `Отсутствует: ${requirement.title}`, requirement.description, "Заполнить отсутствующий раздел или сформировать документ.")));
    needsWork.forEach((requirement) => risks.push(risk(`weak-${requirement.id}`, "medium", `Требует доработки: ${requirement.title}`, requirement.description, "Проверить качество данных и закрыть предупреждение.")));

    if (executionRisks.some((item) => item.level === "high")) {
      risks.push(risk("execution-high-risks", "high", "Есть критичные риски исполнения", "Не все мероприятия подтверждены или имеют ответственных.", "Открыть контроль исполнения и закрыть критичные риски."));
    }

    if (scenario.directionId !== "all" && !state.eventDirectionRelations.some((relation) => relation.directionId === scenario.directionId)) {
      risks.push(risk("direction-empty", "high", "Направление провалено", "По сценарию проверки нет мероприятий.", "Добавить мероприятия или связать существующие с направлением."));
    }

    return dedupeRisks(risks).sort((a, b) => riskWeight(b.level) - riskWeight(a.level));
  }
}

export class InspectionExporter {
  async toDocx(pack: InspectionPackage): Promise<Blob> {
    const rows = [
      header(["Раздел", "Элемент", "Статус", "Источник"]),
      ...pack.sections.flatMap((sectionItem) =>
        sectionItem.items.map((packageItem) => dataRow([sectionItem.title, packageItem.title, statusLabel(packageItem.status), packageItem.sourceType]))
      )
    ];

    return Packer.toBlob(
      new Document({
        sections: [
          {
            properties: {},
            children: [
              centeredTitle(pack.title),
              centeredText(`Готовность: ${pack.readiness.score}% (${pack.readiness.label})`),
              paragraph(`Сценарий проверки: ${pack.scenario.title}`),
              paragraph(`Сформировано: ${new Date(pack.generatedAt).toLocaleString("ru-RU")}`),
              new Paragraph({ text: "" }),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
              heading("Риски"),
              ...pack.readiness.risks.map((riskItem) => paragraph(`${riskItem.title}. ${riskItem.reason}. Рекомендация: ${riskItem.recommendation}`)),
              heading("Рекомендации"),
              ...pack.readiness.recommendations.map((recommendation, index) => paragraph(`${index + 1}. ${recommendation.text}`))
            ]
          }
        ]
      })
    );
  }
}

export function createInspectionCenter() {
  return new InspectionCenter();
}

export function findInspectionScenario(id: InspectionScenarioId) {
  return inspectionScenarios.find((scenarioItem) => scenarioItem.id === id) ?? inspectionScenarios[0];
}

export function getInspectionPackageDocxFileName(pack: InspectionPackage) {
  return `${pack.scenario.id}-${pack.readiness.score}.docx`;
}

function buildRequirements(state: AppState, scenario: InspectionScenario): InspectionRequirement[] {
  const plan = createActivityPlanBuilder().build({ directionId: scenario.directionId, academicYear: state.schoolPassport.academicYear, state });
  const report = createActivityReportBuilder().build({ state, filter: { directionId: scenario.directionId, periodMode: "academicYear" } });
  const matrix = createActivityMatrixAnalyzer().buildMatrix({ mode: "month", events: plan.rows.map((row) => row.event), directions: state.activityDirections, relations: state.eventDirectionRelations, modules: state.educationModules });
  const executions = migrateEventExecutions(state.events, state.eventExecutions);
  const executionStats = calculateEventExecutionStatistics(plan.rows.map((row) => row.event), executions);
  const compliance = createWorkProgramComplianceChecker().check({
    workProgram: state.workProgram,
    federalKnowledgeBase,
    kpvr: state.kpvr,
    events: state.events,
    educationalSystem: state.educationalSystem,
    extraActivities: state.extraActivities,
    educationModules: state.educationModules,
    normativeDocuments: state.normativeDocuments
  });

  return [
    requirement("plan", "План деятельности", `Минимум ${scenario.minimumEvents} мероприятий по сценарию.`, plan.rows.length >= scenario.minimumEvents ? "ready" : plan.rows.length > 0 ? "needs_work" : "missing", "ActivityPlanBuilder"),
    requirement("report", "Отчет", "Отчет должен содержать мероприятия и KPI.", report.statistics.totalEvents > 0 ? "ready" : "missing", "ActivityReportBuilder"),
    requirement("confirmed-events", "Подтвержденные мероприятия", "В пакете должны быть подтвержденные мероприятия.", executionStats.confirmedPercent >= 70 ? "ready" : executionStats.confirmedPercent > 0 ? "needs_work" : "missing", "EventExecution"),
    requirement("kpvr", "КПВР", "Календарный план должен содержать мероприятия.", state.events.length > 0 ? "ready" : "missing", "КПВР"),
    requirement("work-program", "Рабочая программа воспитания", "Рабочая программа должна быть собрана и проверена.", getComplianceCheckStatus(compliance) === "compliant" ? "ready" : getComplianceCheckStatus(compliance) === "partially_compliant" ? "needs_work" : "missing", "WorkProgramComplianceChecker"),
    requirement("matrix", "Матрица активности", "Матрица должна показывать баланс и отсутствие критичных провалов.", matrix.analysis.balance.score >= 70 ? "ready" : matrix.analysis.balance.score >= 40 ? "needs_work" : "missing", "ActivityMatrixAnalyzer"),
    requirement("normative", "Нормативная база", "Нужны актуальные нормативные документы.", state.normativeDocuments.some((document) => document.actualityStatus === "current") ? "ready" : "needs_work", "Нормативный центр")
  ];
}

function buildEvidence(state: AppState, scenario: InspectionScenario, eventIds: string[]): InspectionEvidence[] {
  const planEvidence: InspectionEvidence[] = [
    { id: "evidence-plan", title: "План деятельности", sourceType: "plan", sourceId: `activity-plan-${scenario.directionId}`, description: "Собран из реестра мероприятий и направлений." },
    { id: "evidence-report", title: "Отчет", sourceType: "report", sourceId: `activity-report-${scenario.directionId}`, description: "Собран из мероприятий, исполнения и KPI." },
    { id: "evidence-matrix", title: "Матрица активности", sourceType: "matrix", sourceId: `activity-matrix-${scenario.directionId}`, description: "Показывает баланс направлений и периодов." }
  ];
  const eventEvidence = state.events
    .filter((event) => eventIds.includes(event.id))
    .slice(0, 10)
    .map((event) => ({ id: `evidence-event-${event.id}`, title: event.title, sourceType: "event" as const, sourceId: event.id, description: `Мероприятие: ${event.classes}, ответственный: ${event.responsible}` }));

  return [...planEvidence, ...eventEvidence];
}

function buildRecommendations(gaps: InspectionGap[], risks: InspectionRisk[]): InspectionRecommendation[] {
  return [
    ...risks.slice(0, 8).map((riskItem) => ({ id: `rec-${riskItem.id}`, priority: riskItem.level, text: riskItem.recommendation, targetUrl: "/event-execution" })),
    ...gaps.slice(0, 5).map((gap) => ({ id: `rec-${gap.id}`, priority: "medium" as const, text: `Закрыть пробел: ${gap.title}.`, targetUrl: gap.fixUrl }))
  ].slice(0, 10);
}

function calculateReadinessScore(requirements: InspectionRequirement[], risks: InspectionRisk[]) {
  const base = requirements.length > 0 ? requirements.reduce((sum, requirementItem) => sum + (requirementItem.status === "ready" ? 1 : requirementItem.status === "needs_work" ? 0.5 : 0), 0) / requirements.length * 100 : 0;
  const penalty = risks.filter((riskItem) => riskItem.level === "high").length * 5 + risks.filter((riskItem) => riskItem.level === "medium").length * 2;

  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

function scenario(id: InspectionScenarioId, title: string, description: string, directionId: string | "all", minimumEvents: number, requiredDocuments: string[]): InspectionScenario {
  return { id, title, description, directionId, minimumEvents, requiredDocuments };
}

function requirement(id: string, title: string, description: string, status: InspectionRequirementStatus, source: string): InspectionRequirement {
  return { id, title, description, required: true, status, source };
}

function section(id: string, title: string, items: InspectionPackageItem[]): InspectionPackageSection {
  return { id, title, items };
}

function item(id: string, title: string, description: string, sourceType: InspectionPackageItem["sourceType"], sourceId: string, ready: boolean): InspectionPackageItem {
  return { id, title, description, sourceType, sourceId, status: ready ? "ready" : "needs_work" };
}

function risk(id: string, level: InspectionRiskLevel, title: string, reason: string, recommendation: string): InspectionRisk {
  return { id, level, title, reason, recommendation };
}

function dedupeRisks(risks: InspectionRisk[]) {
  return Array.from(new Map(risks.map((riskItem) => [riskItem.id, riskItem])).values());
}

function riskWeight(level: InspectionRiskLevel) {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

function inferFixUrl(requirementId: string) {
  if (requirementId === "plan") return "/activity-plans";
  if (requirementId === "report") return "/activity-reports";
  if (requirementId === "confirmed-events") return "/event-execution";
  if (requirementId === "work-program") return "/work-program";
  if (requirementId === "matrix") return "/activity-matrix";
  if (requirementId === "normative") return "/normative-documents";
  return "/events";
}

function statusLabel(status: InspectionRequirementStatus) {
  if (status === "ready") return "Готово";
  if (status === "needs_work") return "Требует доработки";
  return "Отсутствует";
}

function centeredTitle(text: string) {
  return new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 28 })] });
}

function centeredText(text: string) {
  return new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 24 })] });
}

function heading(text: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 100 }, children: [new TextRun({ text, bold: true })] });
}

function paragraph(text: string) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text })] });
}

function header(values: string[]) {
  return new TableRow({
    tableHeader: true,
    children: values.map((value) => new TableCell({ shading: { fill: "E2E8F0" }, children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })], margins: margins(), borders: borders() }))
  });
}

function dataRow(values: string[]) {
  return new TableRow({ children: values.map((value) => new TableCell({ children: [new Paragraph(value || " ")], margins: margins(), borders: borders() })) });
}

function margins() {
  return { top: 100, bottom: 100, left: 100, right: 100 };
}

function borders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
  };
}
