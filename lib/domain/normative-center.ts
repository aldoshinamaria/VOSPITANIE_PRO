import { createId } from "@/lib/utils";
import type {
  AppState,
  NormativeDocument,
  NormativeDocumentCategory,
  NormativeDocumentChange,
  NormativeDocumentComparison,
  NormativeRecommendation,
  NormativeRequirement,
  WorkProgramComplianceResult,
  WorkProgramDiscrepancy
} from "@/types/domain";

export interface NormativeDocumentAnalyzer {
  createDocument(input: CreateNormativeDocumentInput): NormativeDocument;
  compare(documentA: NormativeDocument, documentB: NormativeDocument): NormativeDocumentComparison;
  checkWorkProgram(state: AppState): WorkProgramComplianceResult;
}

export interface CreateNormativeDocumentInput {
  title: string;
  category: NormativeDocumentCategory;
  documentDate: string;
  version: string;
  source: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
}

export class RuleBasedNormativeDocumentAnalyzer implements NormativeDocumentAnalyzer {
  createDocument(input: CreateNormativeDocumentInput): NormativeDocument {
    const id = createId("normative-document");

    return {
      id,
      title: input.title,
      category: input.category,
      level: getDocumentLevel(input.category),
      documentDate: input.documentDate,
      version: input.version,
      source: input.source,
      actualityStatus: "needs_review",
      uploadedAt: new Date().toISOString(),
      fileName: input.fileName,
      fileType: input.fileType,
      sizeBytes: input.sizeBytes,
      requirements: inferRequirements(id, input.category, input.title)
    };
  }

  compare(documentA: NormativeDocument, documentB: NormativeDocument): NormativeDocumentComparison {
    const requirementsA = new Map(documentA.requirements.map((requirement) => [normalizeRequirementKey(requirement), requirement]));
    const requirementsB = new Map(documentB.requirements.map((requirement) => [normalizeRequirementKey(requirement), requirement]));
    const added: NormativeDocumentChange[] = [];
    const removed: NormativeDocumentChange[] = [];
    const changed: NormativeDocumentChange[] = [];

    requirementsB.forEach((requirement, key) => {
      const previous = requirementsA.get(key);

      if (!previous) {
        added.push(toChange("added", requirement));
        return;
      }

      if (previous.description !== requirement.description || previous.section !== requirement.section) {
        changed.push({
          ...toChange("changed", requirement),
          description: `Было: ${previous.description}. Стало: ${requirement.description}.`
        });
      }
    });

    requirementsA.forEach((requirement, key) => {
      if (!requirementsB.has(key)) {
        removed.push(toChange("removed", requirement));
      }
    });

    return {
      documentAId: documentA.id,
      documentBId: documentB.id,
      added,
      removed,
      changed
    };
  }

  checkWorkProgram(state: AppState): WorkProgramComplianceResult {
    const sourceDocuments = state.normativeDocuments.filter((document) => document.actualityStatus !== "outdated");
    const discrepancies: WorkProgramDiscrepancy[] = [];
    const recommendations: NormativeRecommendation[] = [];

    sourceDocuments.forEach((document) => {
      document.requirements.forEach((requirement) => {
        const result = checkRequirement(requirement, state);

        if (!result.ok) {
          discrepancies.push({
            id: createId("normative-discrepancy"),
            section: requirement.section,
            title: requirement.title,
            description: result.message,
            sourceDocumentId: document.id,
            sourceTitle: document.title,
            status: result.status
          });
          recommendations.push({
            id: createId("normative-recommendation"),
            priority: result.status === "has_discrepancies" ? "high" : "medium",
            title: result.recommendationTitle,
            description: result.recommendation,
            targetSection: requirement.section,
            sourceDocumentId: document.id
          });
        }
      });
    });

    const status =
      discrepancies.length === 0
        ? "compliant"
        : discrepancies.some((item) => item.status === "has_discrepancies")
          ? "has_discrepancies"
          : "needs_update";

    return {
      status,
      checkedAt: new Date().toISOString(),
      discrepancies,
      recommendations
    };
  }
}

export function createNormativeDocumentAnalyzer(): NormativeDocumentAnalyzer {
  return new RuleBasedNormativeDocumentAnalyzer();
}

function inferRequirements(documentId: string, category: NormativeDocumentCategory, title: string): NormativeRequirement[] {
  const base = [
    requirement(documentId, "work-program-structure", "Структура рабочей программы", "Рабочая программа должна содержать целевой, содержательный и организационный разделы."),
    requirement(documentId, "school-culture", "Уклад школы", "Содержательный раздел должен отражать уклад школы, традиции, объединения, партнерство и воспитательную среду."),
    requirement(documentId, "kpvr", "КПВР", "Календарный план воспитательной работы должен формироваться по уровням образования и модулям воспитания.")
  ];

  if (category === "federal_work_program") {
    return [
      ...base,
      requirement(documentId, "target-orientations", "Целевые ориентиры", "Целевые ориентиры должны быть разделены по НОО, ООО и СОО."),
      requirement(documentId, "activity-modules", "Виды, формы и содержание воспитательной деятельности", "Содержание воспитательной деятельности должно быть раскрыто по модулям воспитания.")
    ];
  }

  if (category === "federal_calendar_plan") {
    return [
      requirement(documentId, "kpvr", "Федеральный календарный план", "КПВР школы должен учитывать федеральные памятные даты, значимые события и уровни образования."),
      requirement(documentId, "events", "Реестр мероприятий", "Мероприятия должны иметь сроки, ответственных, классы, статус и связь с модулем воспитания.")
    ];
  }

  if (category === "local_school_document") {
    return [
      ...base,
      requirement(documentId, "organizational", "Локальное обеспечение", `Локальный документ «${title}» должен быть согласован с кадровым, нормативным и аналитическим разделами программы.`)
    ];
  }

  return [
    ...base,
    requirement(documentId, "regional-priorities", "Региональные и муниципальные приоритеты", "Рабочая программа должна учитывать региональные и муниципальные воспитательные приоритеты.")
  ];
}

function checkRequirement(requirement: NormativeRequirement, state: AppState) {
  switch (requirement.id.replace(`${requirement.sourceDocumentId}-`, "")) {
    case "work-program-structure":
      return state.workProgram.sections.length >= 3
        ? ok()
        : issue("needs_update", "В рабочей программе не хватает обязательных разделов.", "Обновить структуру программы", "Пересоберите рабочую программу воспитания.");
    case "school-culture":
      return state.workProgram.schoolCulture.subsections.length >= 6 && state.educationalSystem.associations.length > 0
        ? ok()
        : issue(
            "needs_update",
            "Раздел уклада сформирован, но воспитательная система школы заполнена неполно.",
            "Дополнить уклад школы",
            "Добавьте объединения, инфраструктуру и партнеров, затем пересоберите раздел «Уклад школы»."
          );
    case "kpvr":
      return state.events.length > 0
        ? ok()
        : issue("has_discrepancies", "В КПВР нет мероприятий из реестра.", "Заполнить КПВР", "Добавьте мероприятия или импортируйте их из документов.");
    case "target-orientations":
      return state.workProgram.sections.some((section) => section.id === "target")
        ? issue(
            "needs_update",
            "Целевой раздел есть, но целевые ориентиры пока требуют методической проверки.",
            "Проверить целевые ориентиры",
            "Уточните целевые ориентиры по НОО, ООО и СОО перед утверждением программы."
          )
        : issue("has_discrepancies", "Целевой раздел отсутствует.", "Добавить целевой раздел", "Пересоберите рабочую программу.");
    case "activity-modules":
      return state.educationModules.some((module) => module.active)
        ? ok()
        : issue("has_discrepancies", "Нет активных модулей воспитания.", "Включить модули воспитания", "Проверьте справочник модулей воспитания.");
    case "events":
      return state.events.every((event) => event.moduleId && event.responsible && event.startDate)
        ? ok()
        : issue("needs_update", "Часть мероприятий не содержит модуль, срок или ответственного.", "Проверить карточки мероприятий", "Заполните обязательные поля в реестре мероприятий.");
    case "organizational":
      return state.workProgram.sections.some((section) => section.id === "organizational")
        ? issue(
            "needs_update",
            "Организационный раздел создан шаблонно и требует сверки с локальными актами.",
            "Уточнить организационный раздел",
            "Добавьте локальные нормативные акты и проверьте кадровое обеспечение."
          )
        : issue("has_discrepancies", "Организационный раздел отсутствует.", "Добавить организационный раздел", "Пересоберите рабочую программу.");
    default:
      return issue(
        "needs_update",
        "Требование найдено в нормативном документе, но пока не имеет точной автоматической проверки.",
        "Проверить требование вручную",
        "Сверьте раздел рабочей программы с нормативным документом."
      );
  }
}

function requirement(sourceDocumentId: string, id: string, title: string, description: string): NormativeRequirement {
  return {
    id: `${sourceDocumentId}-${id}`,
    title,
    section: title,
    description,
    sourceDocumentId
  };
}

function getDocumentLevel(category: NormativeDocumentCategory) {
  if (category === "federal_work_program" || category === "federal_calendar_plan") {
    return "federal";
  }

  if (category === "regional_document") {
    return "regional";
  }

  if (category === "municipal_document") {
    return "municipal";
  }

  return "local";
}

function normalizeRequirementKey(requirement: NormativeRequirement) {
  return requirement.title.toLowerCase().trim();
}

function toChange(type: "added" | "removed" | "changed", requirement: NormativeRequirement): NormativeDocumentChange {
  return {
    id: createId(`normative-${type}`),
    type,
    section: requirement.section,
    title: requirement.title,
    description: requirement.description,
    sourceDocumentId: requirement.sourceDocumentId
  };
}

function ok() {
  return { ok: true as const };
}

function issue(status: "needs_update" | "has_discrepancies", message: string, recommendationTitle: string, recommendation: string) {
  return {
    ok: false as const,
    status,
    message,
    recommendationTitle,
    recommendation
  };
}
