import { buildKpvrPlanRows } from "@/lib/domain/kpvr";
import { createId } from "@/lib/utils";
import type {
  AppState,
  EducationLevel,
  GeneratedContent,
  GeneratedParagraph,
  SchoolCultureSection,
  SchoolCultureSubsectionId,
  WorkProgram,
  WorkProgramProgress,
  WorkProgramReadinessStatus,
  WorkProgramSection,
  WorkProgramSectionId,
  WorkProgramSource,
  WorkProgramSubsection,
  WorkProgramVersion
} from "@/types/domain";

export interface SectionGenerator {
  generate(state: AppState): GeneratedParagraph[];
}

export interface SchoolCultureGenerator {
  generate(state: AppState): SchoolCultureSection;
}

export interface WorkProgramAssembler {
  assemble(state: AppState, previous?: WorkProgram): WorkProgram;
  rebuildFullProgram(state: AppState, previous: WorkProgram): WorkProgram;
  rebuildSchoolCulture(state: AppState, previous: WorkProgram): WorkProgram;
  rebuildSection(state: AppState, previous: WorkProgram, sectionId: WorkProgramSectionId): WorkProgram;
}

const sectionTitles: Record<WorkProgramSectionId, string> = {
  target: "Целевой раздел",
  content: "Содержательный раздел",
  organizational: "Организационный раздел",
  "school-culture": "Уклад школы",
  kpvr: "Календарный план воспитательной работы",
  appendices: "Приложения"
};

const educationLevelLabels: Record<EducationLevel, string> = {
  noo: "НОО",
  ooo: "ООО",
  soo: "СОО"
};

export class DefaultWorkProgramAssembler implements WorkProgramAssembler {
  constructor(private readonly schoolCultureGenerator: SchoolCultureGenerator = new DefaultSchoolCultureGenerator()) {}

  assemble(state: AppState, previous?: WorkProgram): WorkProgram {
    const now = new Date().toISOString();
    const generatedCulture = this.schoolCultureGenerator.generate(state);
    const schoolCulture = previous?.schoolCulture ? mergeManualParagraphs(previous.schoolCulture, generatedCulture) : generatedCulture;
    const sections = buildProgramSections(state, schoolCulture, previous);
    const progress = calculateProgramProgress(sections);
    const versions = previous?.versions?.length ? previous.versions : [createVersion("Первичная сборка рабочей программы", schoolCulture, now)];
    const sectionVersions = mergeSectionVersions(previous?.sectionVersions, sections, now);

    return {
      id: previous?.id ?? "work-program-main",
      title: "Рабочая программа воспитания",
      academicYear: state.schoolPassport.academicYear,
      sections,
      schoolCulture,
      progress,
      versions,
      sectionVersions,
      updatedAt: now
    };
  }

  rebuildFullProgram(state: AppState, previous: WorkProgram): WorkProgram {
    const now = new Date().toISOString();
    const next = this.assemble(state, previous);

    return {
      ...next,
      updatedAt: now,
      versions: [createVersion("Полная пересборка рабочей программы", next.schoolCulture, now), ...previous.versions].slice(0, 30),
      sectionVersions: createRebuildVersions(next.sections, previous.sectionVersions, "Пересборка раздела", now)
    };
  }

  rebuildSchoolCulture(state: AppState, previous: WorkProgram): WorkProgram {
    const now = new Date().toISOString();
    const generatedCulture = this.schoolCultureGenerator.generate(state);
    const sections = buildProgramSections(state, generatedCulture, previous);

    return {
      ...previous,
      academicYear: state.schoolPassport.academicYear,
      sections,
      schoolCulture: generatedCulture,
      progress: calculateProgramProgress(sections),
      updatedAt: now,
      versions: [createVersion("Пересборка раздела «Уклад школы»", generatedCulture, now), ...previous.versions].slice(0, 30),
      sectionVersions: {
        ...previous.sectionVersions,
        "school-culture": [
          createDetailedVersion("school-culture", "Пересборка раздела «Уклад школы»", getSection(sections, "school-culture"), now),
          ...(previous.sectionVersions?.["school-culture"] ?? [])
        ].slice(0, 30)
      }
    };
  }

  rebuildSection(state: AppState, previous: WorkProgram, sectionId: WorkProgramSectionId): WorkProgram {
    if (sectionId === "school-culture") {
      return this.rebuildSchoolCulture(state, previous);
    }

    const now = new Date().toISOString();
    const next = this.assemble(state, previous);
    const rebuilt = getSection(next.sections, sectionId);

    return {
      ...next,
      sectionVersions: {
        ...next.sectionVersions,
        [sectionId]: [
          createDetailedVersion(sectionId, `Пересборка раздела «${rebuilt.title}»`, rebuilt, now),
          ...(previous.sectionVersions?.[sectionId] ?? [])
        ].slice(0, 30)
      }
    };
  }
}

export class DefaultSchoolCultureGenerator implements SchoolCultureGenerator {
  private readonly traditionsGenerator = new SchoolTraditionsGenerator();
  private readonly partnershipGenerator = new SchoolPartnershipGenerator();

  generate(state: AppState): SchoolCultureSection {
    return {
      id: "school-culture",
      title: "Уклад школы",
      subsections: [
        createCultureSubsection("school-profile", "Общая характеристика школы", new SchoolProfileGenerator().generate(state)),
        createCultureSubsection("educational-environment", "Особенности воспитательной среды", new SchoolEnvironmentGenerator().generate(state)),
        createCultureSubsection("associations", "Воспитательные объединения", new SchoolAssociationsGenerator().generate(state)),
        createCultureSubsection("traditions", "Традиции школы", this.traditionsGenerator.generate(state)),
        createCultureSubsection("partnership", "Социальное партнерство", this.partnershipGenerator.generate(state)),
        createCultureSubsection("students-profile", "Особенности контингента обучающихся", new StudentProfileGenerator().generate(state))
      ]
    };
  }
}

export class SchoolTraditionsGenerator implements SectionGenerator {
  generate(state: AppState): GeneratedParagraph[] {
    const kpvrRows = buildKpvrPlanRows(state.events, state.educationModules);
    const candidates = state.events
      .filter((event) => {
        const educationModule = state.educationModules.find((item) => item.id === event.moduleId);
        const isSchoolAffair = educationModule?.title.toLowerCase().includes("школьн") || event.moduleId.includes("osnovnye");
        const repeatsInKpvr = kpvrRows.some((row) => row.eventId === event.id);
        const traditionWords = ["посвящ", "самоуправ", "фестиваль", "выбор", "последний звонок", "день", "акция"];
        return event.priority === "high" || isSchoolAffair || repeatsInKpvr || traditionWords.some((word) => event.title.toLowerCase().includes(word));
      })
      .slice(0, 8);

    if (candidates.length === 0) {
      return [
        paragraph(
          "traditions-empty",
          "Традиции школы будут уточняться по мере наполнения реестра мероприятий и календарного плана воспитательной работы.",
          [source("template", "template-traditions", "Структура раздела")]
        )
      ];
    }

    return [
      paragraph(
        "traditions-summary",
        `К числу значимых традиций школы относятся ${joinTitles(candidates.map((event) => `«${event.title}»`))}. Эти события отражают устойчивые воспитательные практики школы и включаются в календарное планирование.`,
        candidates.map((event) => source("event", event.id, event.title))
      )
    ];
  }
}

export class SchoolPartnershipGenerator implements SectionGenerator {
  generate(state: AppState): GeneratedParagraph[] {
    const partners = [
      ...state.schoolPassport.socialPartners.map((partner) => ({ id: partner.id, title: partner.name, description: partner.activity })),
      ...state.educationalSystem.partners.map((partner) => ({ id: partner.id, title: partner.title, description: partner.cooperationDescription }))
    ].filter((partner) => partner.title.trim());

    if (partners.length === 0) {
      return [
        paragraph(
          "partnership-empty",
          "Социальное партнерство школы находится в стадии формирования; сведения о партнерах могут быть дополнены в паспорте школы и воспитательной системе.",
          [source("template", "template-partnership", "Структура раздела")]
        )
      ];
    }

    return [
      paragraph(
        "partnership-summary",
        `Социальное партнерство школы реализуется во взаимодействии с ${joinTitles(partners.map((partner) => `«${partner.title}»`))}. Совместная деятельность используется для расширения воспитательной среды, проведения событий и сопровождения обучающихся.`,
        partners.map((partner) => source("partner", partner.id, partner.title))
      )
    ];
  }
}

class SchoolProfileGenerator implements SectionGenerator {
  generate(state: AppState): GeneratedParagraph[] {
    const passport = state.schoolPassport;

    return [
      paragraph(
        "school-profile-main",
        `${passport.name} расположена в ${passport.municipality || passport.region}. Образовательная организация реализует воспитательную работу в ${passport.academicYear} учебном году, охватывая ${passport.studentsCount} обучающихся и ${passport.classesCount} классов.`,
        [source("school-passport", passport.id, "Паспорт школы")]
      ),
      paragraph(
        "school-profile-levels",
        `В школьном планировании представлены уровни образования: ${getEducationLevelsFromEvents(state).join(", ") || "НОО, ООО, СОО"}. Особенности уклада определяются инфраструктурой школы, действующими объединениями, социальными партнерами и календарем воспитательных событий.`,
        [source("school-passport", passport.id, "Паспорт школы")]
      )
    ];
  }
}

class SchoolEnvironmentGenerator implements SectionGenerator {
  generate(state: AppState): GeneratedParagraph[] {
    const resources = [
      state.schoolPassport.infrastructure.museum ? "школьный музей" : "",
      state.schoolPassport.infrastructure.mediaCenter ? "медиацентр" : "",
      state.schoolPassport.infrastructure.theater ? "театр" : "",
      state.schoolPassport.infrastructure.sportsClub ? "спортивный клуб" : "",
      state.schoolPassport.infrastructure.childInitiativesCenter ? "центр детских инициатив" : "",
      ...state.educationalSystem.infrastructureObjects.map((object) => object.title)
    ].filter(Boolean);

    return [
      paragraph(
        "environment-main",
        resources.length > 0
          ? `Воспитательная среда школы опирается на следующие ресурсы: ${joinTitles(resources)}. Эти пространства используются для проведения школьных дел, проектной деятельности, встреч и событий календарного плана.`
          : "Воспитательная среда школы будет уточняться после заполнения инфраструктуры в паспорте школы и разделе воспитательной системы.",
        [
          source("school-passport", state.schoolPassport.id, "Инфраструктура паспорта школы"),
          ...state.educationalSystem.infrastructureObjects.map((object) => source("infrastructure", object.id, object.title))
        ]
      )
    ];
  }
}

class SchoolAssociationsGenerator implements SectionGenerator {
  generate(state: AppState): GeneratedParagraph[] {
    const associations = state.educationalSystem.associations.filter((association) => association.status === "active");

    if (associations.length === 0) {
      return [
        paragraph(
          "associations-empty",
          "Воспитательные объединения школы могут быть добавлены в разделе «Воспитательная система»; после этого они автоматически появятся в тексте уклада.",
          [source("template", "template-associations", "Структура раздела")]
        )
      ];
    }

    return associations.map((association) =>
      paragraph(
        `association-${association.id}`,
        `В школе действует объединение «${association.title}»${association.classes ? ` для обучающихся ${association.classes} классов` : ""}. Руководитель объединения: ${association.leader || "не указан"}. ${association.description}`,
        [source("educational-association", association.id, association.title)]
      )
    );
  }
}

class StudentProfileGenerator implements SectionGenerator {
  generate(state: AppState): GeneratedParagraph[] {
    return [
      paragraph(
        "students-profile-template",
        `Контингент обучающихся составляет ${state.schoolPassport.studentsCount} человек. На данном этапе раздел содержит базовое описание; далее он может автоматически дополняться данными о классах, социальных группах, образовательных потребностях и результатах воспитательной диагностики.`,
        [source("school-passport", state.schoolPassport.id, "Паспорт школы"), source("template", "template-students", "Шаблон структуры контингента")]
      )
    ];
  }
}

export function createWorkProgramAssembler(): WorkProgramAssembler {
  return new DefaultWorkProgramAssembler();
}

export function createEmptyWorkProgram(state: AppState): WorkProgram {
  return new DefaultWorkProgramAssembler().assemble(state);
}

export function createVersion(changeSummary: string, section: SchoolCultureSection, createdAt = new Date().toISOString()): WorkProgramVersion {
  return {
    id: createId("work-program-version"),
    title: `${section.title} от ${new Intl.DateTimeFormat("ru-RU").format(new Date(createdAt))}`,
    createdAt,
    sectionId: "school-culture",
    section,
    subsections: schoolCultureToSubsections(section),
    progress: readyProgress(),
    sourceSummary: summarizeSources(schoolCultureToSubsections(section).flatMap((item) => item.sources)),
    changeSummary
  };
}

function buildProgramSections(state: AppState, schoolCulture: SchoolCultureSection, previous?: WorkProgram): WorkProgramSection[] {
  return [
    buildTargetSection(state, previous),
    buildContentSection(state, schoolCulture, previous),
    buildOrganizationalSection(state, previous),
    buildKpvrSection(state, previous),
    buildAppendicesSection(state, previous)
  ];
}

function buildTargetSection(state: AppState, previous?: WorkProgram): WorkProgramSection {
  const subsections: WorkProgramSubsection[] = [
    ...(["noo", "ooo", "soo"] as EducationLevel[]).map((level) =>
      createSubsection(
        `goal-${level}`,
        `Цель воспитания ${educationLevelLabels[level]}`,
        [
          generated(
            `goal-${level}-content`,
            `Цель воспитания на уровне ${educationLevelLabels[level]} направлена на личностное развитие обучающихся, создание условий для самоопределения и социализации, формирование российской гражданской идентичности, ценностного отношения к семье, труду, культуре, природе и Отечеству.`,
            [source("template", `target-goal-${level}`, `Цель воспитания ${educationLevelLabels[level]}`)]
          )
        ],
        needsReviewProgress(["Требуется сверить формулировку с локальной рабочей программой и ФОП."])
      )
    ),
    ...(["noo", "ooo", "soo"] as EducationLevel[]).map((level) =>
      createSubsection(
        `orientation-${level}`,
        `Целевые ориентиры результатов воспитания ${educationLevelLabels[level]}`,
        [
          generated(
            `orientation-${level}-content`,
            `Целевые ориентиры уровня ${educationLevelLabels[level]} подготовлены как структурный блок для дальнейшего автоматического наполнения по направлениям воспитания и результатам воспитательной работы школы.`,
            [source("template", `target-orientation-${level}`, `Целевые ориентиры ${educationLevelLabels[level]}`)]
          )
        ],
        needsDataProgress(["Нужна детализация целевых ориентиров по направлениям воспитания."])
      )
    )
  ];

  return createSection("target", sectionTitles.target, subsections, previous);
}

function buildContentSection(state: AppState, schoolCulture: SchoolCultureSection, previous?: WorkProgram): WorkProgramSection {
  const schoolCultureSubsections = schoolCultureToSubsections(schoolCulture);
  const activitySubsections = state.educationModules
    .filter((module) => module.active)
    .map((module) => {
      const events = state.events.filter((event) => event.moduleId === module.id);
      const activities = state.extraActivities.filter((activity) =>
        module.title.toLowerCase().includes("внеур") || activity.area.toLowerCase().includes(module.title.toLowerCase())
      );
      const moduleSources = [
        source("module", module.id, module.title),
        ...events.map((event) => source("event", event.id, event.title)),
        ...activities.map((activity) => source("extra-activity", activity.id, activity.title))
      ];
      const eventText = events.length > 0 ? `В КПВР по модулю запланировано мероприятий: ${events.length}.` : "Мероприятия по модулю пока не внесены в КПВР.";
      const activityText = activities.length > 0 ? `Связанные программы внеурочной деятельности: ${joinTitles(activities.map((activity) => `«${activity.title}»`))}.` : "";

      return createSubsection(
        `module-${module.id}`,
        module.title,
        [
          generated(
            `module-${module.id}-content`,
            `Модуль «${module.title}» реализуется через урочные и внеурочные практики, классные и общешкольные дела, взаимодействие с участниками образовательных отношений. ${eventText} ${activityText}`.trim(),
            moduleSources
          )
        ],
        events.length > 0 || activities.length > 0 ? readyProgress() : needsReviewProgress(["Следует добавить мероприятия или формы работы по модулю."])
      );
    });

  const subsections = [
    createSubsection(
      "school-culture-summary",
      "Уклад школы",
      schoolCultureSubsections.flatMap((item) => item.generatedContent),
      calculateSectionProgressFromSubsections(schoolCultureSubsections)
    ),
    createSubsection(
      "activity-forms",
      "Виды, формы и содержание воспитательной деятельности",
      [
        generated(
          "activity-forms-intro",
          "Содержание воспитательной деятельности структурируется по модулям рабочей программы и наполняется данными КПВР, внеурочной деятельности, воспитательных объединений и социального партнерства.",
          [source("kpvr", "kpvr", "КПВР"), source("template", "activity-forms", "Структура содержательного раздела")]
        )
      ],
      readyProgress()
    ),
    ...activitySubsections
  ];

  return createSection("content", sectionTitles.content, subsections, previous);
}

function buildOrganizationalSection(state: AppState, previous?: WorkProgram): WorkProgramSection {
  const staffNames = unique([
    state.schoolPassport.principal,
    state.schoolPassport.deputyDirector,
    ...state.events.map((event) => event.responsible),
    ...state.extraActivities.map((activity) => activity.teacher)
  ].filter(Boolean));

  const subsections: WorkProgramSubsection[] = [
    createSubsection(
      "staffing",
      "Кадровое обеспечение",
      [
        generated(
          "staffing-content",
          staffNames.length > 0
            ? `Кадровое обеспечение воспитательной работы включает администрацию школы, классных руководителей, педагогов внеурочной деятельности и ответственных за направления воспитательной работы. В текущих данных указаны: ${joinTitles(staffNames)}.`
            : "Кадровое обеспечение требует заполнения сведений о директорах, заместителях, педагогах и ответственных за мероприятия.",
          [source("school-passport", state.schoolPassport.id, "Паспорт школы"), source("staff", "staff-inferred", "Ответственные в мероприятиях и программах")]
        )
      ],
      staffNames.length > 0 ? readyProgress() : needsDataProgress(["Нужно заполнить кадровые данные."])
    ),
    templateSubsection("normative", "Нормативно-методическое обеспечение", "Раздел фиксирует локальные нормативные акты, методические материалы, планы и регламенты, обеспечивающие реализацию рабочей программы воспитания."),
    templateSubsection("conditions", "Требования к условиям работы", "Условия реализации программы включают организационные, кадровые, информационные и материально-технические ресурсы школы."),
    templateSubsection("encouragement", "Система поощрения социальной успешности", "Система поощрения направлена на признание достижений обучающихся в социально значимой, творческой, спортивной, добровольческой и проектной деятельности."),
    templateSubsection("analysis", "Анализ воспитательного процесса", "Анализ воспитательного процесса строится на мониторинге мероприятий, участии обучающихся, результатах наблюдений, обратной связи от классов и педагогов.")
  ];

  return createSection("organizational", sectionTitles.organizational, subsections, previous);
}

function buildKpvrSection(state: AppState, previous?: WorkProgram): WorkProgramSection {
  const rows = buildKpvrPlanRows(state.events, state.educationModules);
  const byLevel = (["noo", "ooo", "soo"] as EducationLevel[]).map((level) => {
    const count = state.events.filter((event) => event.educationLevels.includes(level)).length;

    return createSubsection(
      `kpvr-${level}`,
      `КПВР ${educationLevelLabels[level]}`,
      [
        generated(
          `kpvr-${level}-content`,
          count > 0
            ? `Календарный план воспитательной работы уровня ${educationLevelLabels[level]} формируется автоматически из реестра мероприятий. Количество мероприятий уровня: ${count}.`
            : `Для уровня ${educationLevelLabels[level]} мероприятия пока не внесены.`,
          [source("kpvr", `kpvr-${level}`, `КПВР ${educationLevelLabels[level]}`), ...rows.map((row) => source("event", row.eventId, row.title))]
        )
      ],
      count > 0 ? readyProgress() : needsDataProgress([`Добавьте мероприятия уровня ${educationLevelLabels[level]}.`])
    );
  });

  return createSection("kpvr", sectionTitles.kpvr, byLevel, previous);
}

function buildAppendicesSection(state: AppState, previous?: WorkProgram): WorkProgramSection {
  const subsections = [
    createSubsection(
      "appendix-kpvr",
      "Приложение: КПВР",
      [
        generated(
          "appendix-kpvr-content",
          "Календарный план воспитательной работы подключается как приложение к рабочей программе и формируется из реестра мероприятий.",
          [source("kpvr", "kpvr", "КПВР")]
        )
      ],
      state.events.length > 0 ? readyProgress() : needsDataProgress(["Нет мероприятий для приложения КПВР."])
    ),
    createSubsection(
      "appendix-extra",
      "Приложение: план внеурочной деятельности",
      [
        generated(
          "appendix-extra-content",
          "План внеурочной деятельности подключается как приложение и формируется из программ внеурочной деятельности и дополнительного образования.",
          [source("extra-activity", "extra-activities", "План внеурочной деятельности")]
        )
      ],
      state.extraActivities.length > 0 ? readyProgress() : needsDataProgress(["Нет программ внеурочной деятельности."])
    )
  ];

  return createSection("appendices", sectionTitles.appendices, subsections, previous);
}

function createSection(id: WorkProgramSectionId, title: string, subsections: WorkProgramSubsection[], previous?: WorkProgram): WorkProgramSection {
  const progress = calculateSectionProgressFromSubsections(subsections);

  return {
    id,
    title,
    status: "generated",
    progress,
    subsections,
    sources: uniqueSources(subsections.flatMap((subsection) => subsection.sources)),
    versions: previous?.sectionVersions?.[id] ?? []
  };
}

function createSubsection(
  id: string,
  title: string,
  generatedContent: GeneratedContent[],
  progress: WorkProgramProgress = calculateContentProgress(generatedContent)
): WorkProgramSubsection {
  return {
    id,
    title,
    generatedContent,
    progress,
    sources: uniqueSources(generatedContent.flatMap((content) => content.sources))
  };
}

function templateSubsection(id: string, title: string, text: string): WorkProgramSubsection {
  return createSubsection(
    id,
    title,
    [generated(`${id}-content`, text, [source("template", `template-${id}`, title)], "needs_review")],
    needsReviewProgress(["Раздел создан структурно и требует проверки под локальные документы школы."])
  );
}

function schoolCultureToSubsections(section: SchoolCultureSection): WorkProgramSubsection[] {
  return section.subsections.map((subsection) =>
    createSubsection(
      subsection.id,
      subsection.title,
      subsection.paragraphs
        .filter((paragraphItem) => paragraphItem.status !== "removed")
        .map((paragraphItem) => ({ ...paragraphItem, readiness: paragraphItem.sources.some((item) => item.type === "template") ? "needs_review" : "ready" }))
    )
  );
}

function createCultureSubsection(id: SchoolCultureSubsectionId, title: string, paragraphs: GeneratedParagraph[]) {
  return { id, title, paragraphs };
}

function paragraph(id: string, text: string, sources: WorkProgramSource[]): GeneratedParagraph {
  return {
    id,
    text,
    originalText: text,
    sources,
    status: "generated"
  };
}

function generated(id: string, text: string, sources: WorkProgramSource[], readiness: WorkProgramReadinessStatus = "ready"): GeneratedContent {
  return {
    ...paragraph(id, text, sources),
    readiness
  };
}

function source(type: WorkProgramSource["type"], id: string, title: string): WorkProgramSource {
  return { type, id, title };
}

function mergeManualParagraphs(previous: SchoolCultureSection, generated: SchoolCultureSection): SchoolCultureSection {
  return {
    ...generated,
    subsections: generated.subsections.map((subsection) => {
      const previousSubsection = previous.subsections.find((item) => item.id === subsection.id);
      const manualParagraphs = previousSubsection?.paragraphs.filter((item) => item.status === "edited" || item.status === "added") ?? [];

      return {
        ...subsection,
        paragraphs: [...subsection.paragraphs, ...manualParagraphs]
      };
    })
  };
}

function getEducationLevelsFromEvents(state: AppState) {
  const levels = new Set(state.events.flatMap((event) => event.educationLevels));

  return Array.from(levels).map((level) => educationLevelLabels[level]);
}

function joinTitles(values: string[]) {
  const cleanValues = values.filter(Boolean);

  if (cleanValues.length <= 1) {
    return cleanValues[0] ?? "";
  }

  return `${cleanValues.slice(0, -1).join(", ")} и ${cleanValues.at(-1)}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueSources(sources: WorkProgramSource[]) {
  const map = new Map<string, WorkProgramSource>();
  sources.forEach((item) => map.set(`${item.type}:${item.id}`, item));

  return Array.from(map.values());
}

function summarizeSources(sources: WorkProgramSource[]) {
  return uniqueSources(sources).map((item) => `${item.title}`);
}

function calculateContentProgress(content: GeneratedContent[]): WorkProgramProgress {
  if (content.length === 0) {
    return needsDataProgress(["Нет сгенерированного содержания."]);
  }

  if (content.some((item) => item.readiness === "needs_data")) {
    return needsDataProgress(["Часть содержания требует исходных данных."]);
  }

  if (content.some((item) => item.readiness === "needs_review")) {
    return needsReviewProgress(["Часть содержания создана по шаблону и требует проверки."]);
  }

  return readyProgress();
}

function calculateSectionProgressFromSubsections(subsections: WorkProgramSubsection[]): WorkProgramProgress {
  if (subsections.length === 0) {
    return needsDataProgress(["Нет подразделов."]);
  }

  const percent = Math.round(subsections.reduce((sum, item) => sum + item.progress.percent, 0) / subsections.length);
  const missingData = subsections.flatMap((item) => item.progress.missingData);
  const reviewNotes = subsections.flatMap((item) => item.progress.reviewNotes);

  return {
    percent,
    status: missingData.length > 0 ? "needs_data" : reviewNotes.length > 0 ? "needs_review" : "ready",
    missingData,
    reviewNotes
  };
}

function calculateProgramProgress(sections: WorkProgramSection[]): WorkProgramProgress {
  const percent = Math.round(sections.reduce((sum, section) => sum + section.progress.percent, 0) / Math.max(sections.length, 1));
  const missingData = sections.flatMap((section) => section.progress.missingData);
  const reviewNotes = sections.flatMap((section) => section.progress.reviewNotes);

  return {
    percent,
    status: missingData.length > 0 ? "needs_data" : reviewNotes.length > 0 ? "needs_review" : "ready",
    missingData,
    reviewNotes
  };
}

function readyProgress(): WorkProgramProgress {
  return { percent: 100, status: "ready", missingData: [], reviewNotes: [] };
}

function needsReviewProgress(reviewNotes: string[]): WorkProgramProgress {
  return { percent: 70, status: "needs_review", missingData: [], reviewNotes };
}

function needsDataProgress(missingData: string[]): WorkProgramProgress {
  return { percent: 35, status: "needs_data", missingData, reviewNotes: [] };
}

function mergeSectionVersions(
  previousVersions: Partial<Record<WorkProgramSectionId, WorkProgramVersion[]>> | undefined,
  sections: WorkProgramSection[],
  createdAt: string
) {
  const next: Partial<Record<WorkProgramSectionId, WorkProgramVersion[]>> = { ...previousVersions };

  sections.forEach((section) => {
    if (!next[section.id]?.length) {
      next[section.id] = [createDetailedVersion(section.id, "Первичная сборка раздела", section, createdAt)];
    }
  });

  return next;
}

function createRebuildVersions(
  sections: WorkProgramSection[],
  previousVersions: Partial<Record<WorkProgramSectionId, WorkProgramVersion[]>>,
  changeSummary: string,
  createdAt: string
) {
  return sections.reduce<Partial<Record<WorkProgramSectionId, WorkProgramVersion[]>>>((acc, section) => {
    acc[section.id] = [createDetailedVersion(section.id, changeSummary, section, createdAt), ...(previousVersions?.[section.id] ?? [])].slice(0, 30);
    return acc;
  }, {});
}

function createDetailedVersion(
  sectionId: WorkProgramSectionId,
  changeSummary: string,
  section: WorkProgramSection,
  createdAt = new Date().toISOString()
): WorkProgramVersion {
  return {
    id: createId("work-program-version"),
    title: `${section.title} от ${new Intl.DateTimeFormat("ru-RU").format(new Date(createdAt))}`,
    createdAt,
    sectionId,
    subsections: section.subsections,
    progress: section.progress,
    sourceSummary: summarizeSources(section.sources),
    changeSummary
  };
}

function getSection(sections: WorkProgramSection[], sectionId: WorkProgramSectionId) {
  const section = sections.find((item) => item.id === sectionId);

  if (!section) {
    throw new Error(`Work program section not found: ${sectionId}`);
  }

  return section;
}
