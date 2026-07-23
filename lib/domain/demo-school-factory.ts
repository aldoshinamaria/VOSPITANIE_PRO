import { mockAppState } from "@/data/mock-data";
import { migrateEventDirectionRelations, standardActivityDirections } from "@/lib/domain/activity-directions";
import { createEmptySchoolState } from "@/lib/domain/empty-school-state";
import { migrateEventExecutions } from "@/lib/domain/event-execution";
import { createWorkProgramAssembler } from "@/lib/domain/work-program/work-program-assembler";
import type {
  AppState,
  DemoSchoolTemplate,
  DemoSchoolTemplateId,
  EducationModule,
  EducationalSystem,
  EventExecution,
  EventExecutionStatus,
  ExtraActivity,
  KpvrItem,
  NormativeDocument,
  SchoolEvent,
  SchoolPassport,
  WorkProgram,
  WorkProgramProgress,
  WorkProgramSection
} from "@/types/domain";

export interface DemoSchoolFactory {
  createEmptySchool(): AppState;
  createDemoSchool(template?: DemoSchoolTemplateId): AppState;
  listTemplates(): DemoSchoolTemplate[];
  isEmpty(state: AppState): boolean;
}

const templates: DemoSchoolTemplate[] = [
  {
    id: "urban",
    title: "Городская школа",
    description: "Большая школа с медиацентром, музеем, партнерами и несколькими уровнями образования."
  },
  {
    id: "rural",
    title: "Сельская школа",
    description: "Небольшая школа с сильными традициями, местным музеем и сельскими социальными партнерами."
  },
  {
    id: "cadet",
    title: "Школа с кадетскими классами",
    description: "Акцент на патриотическое воспитание, кадетские классы, Юнармию и Совет ветеранов."
  },
  {
    id: "volunteer",
    title: "Школа с развитым волонтерским движением",
    description: "Сильный волонтерский отряд, акции помощи, партнерство с НКО и социальными службами."
  }
];

export function createDemoSchoolFactory(): DemoSchoolFactory {
  return new RuleBasedDemoSchoolFactory();
}

class RuleBasedDemoSchoolFactory implements DemoSchoolFactory {
  createEmptySchool(): AppState {
    return createEmptySchoolState();
  }

  createDemoSchool(template: DemoSchoolTemplateId = "urban"): AppState {
    const passport = createPassport(template);
    const educationalSystem = createEducationalSystem(template);
    const educationModules = createEducationModules();
    const events = createEvents(template);
    const activityDirections = standardActivityDirections;
    const extraActivities = createExtraActivities(template);
    const normativeDocuments = createNormativeDocuments();
    const eventExecutions = createDemoEventExecutions(events);
    const state: AppState = {
      ...mockAppState,
      schoolPassport: passport,
      educationModules,
      activityDirections,
      eventDirectionRelations: migrateEventDirectionRelations(events, activityDirections),
      eventExecutions: migrateEventExecutions(events, eventExecutions),
      events,
      kpvr: createKpvrItems(events),
      extraActivities,
      educationalSystem,
      importedDocuments: [
        {
          id: "demo-import-federal-plan",
          title: "Федеральный календарный план воспитательной работы",
          type: "docx",
          uploadedAt: "2026-06-01T10:00:00.000Z",
          sizeBytes: 428000,
          status: "processed"
        }
      ],
      extractedEvents: [],
      normativeDocuments,
      processedDocuments: mockAppState.processedDocuments,
      documentProcessingLogs: mockAppState.documentProcessingLogs,
      complianceCheckHistory: []
    };
    const workProgram = finalizeDemoWorkProgramReadiness(createWorkProgramAssembler().assemble(state));

    return {
      ...state,
      workProgram
    };
  }

  listTemplates() {
    return templates;
  }

  isEmpty(state: AppState) {
    return (
      !state.schoolPassport.name &&
      state.events.length === 0 &&
      state.educationalSystem.associations.length === 0 &&
      state.normativeDocuments.length === 0
    );
  }
}

function finalizeDemoWorkProgramReadiness(program: WorkProgram): WorkProgram {
  const sections = program.sections.map((section) =>
    section.id === "target"
      ? recalculateSectionProgress({
          ...section,
          subsections: section.subsections.map((subsection) =>
            subsection.id.startsWith("orientation-")
              ? {
                  ...subsection,
                  generatedContent: subsection.generatedContent.map((content) => ({
                    ...content,
                    readiness: "needs_review" as const
                  })),
                  progress: needsReviewProgress(["Целевые ориентиры подготовлены на основе демо-структуры и требуют методической сверки."])
                }
              : subsection
          )
        })
      : section
  );
  const progress = calculateDemoProgramProgress(sections);

  return {
    ...program,
    sections,
    progress,
    sectionVersions: {
      ...program.sectionVersions
    }
  };
}

function recalculateSectionProgress(section: WorkProgramSection): WorkProgramSection {
  return {
    ...section,
    progress: calculateDemoProgramProgress([section])
  };
}

function calculateDemoProgramProgress(sections: WorkProgramSection[]): WorkProgramProgress {
  const percent = Math.round(sections.reduce((sum, section) => sum + section.subsections.reduce((subsectionSum, subsection) => subsectionSum + subsection.progress.percent, 0) / Math.max(section.subsections.length, 1), 0) / Math.max(sections.length, 1));
  const missingData = sections.flatMap((section) => section.subsections.flatMap((subsection) => subsection.progress.missingData));
  const reviewNotes = sections.flatMap((section) => section.subsections.flatMap((subsection) => subsection.progress.reviewNotes));

  return {
    percent,
    status: missingData.length > 0 ? "needs_data" : reviewNotes.length > 0 ? "needs_review" : "ready",
    missingData,
    reviewNotes
  };
}

function needsReviewProgress(reviewNotes: string[]): WorkProgramProgress {
  return { percent: 70, status: "needs_review", missingData: [], reviewNotes };
}

function createPassport(template: DemoSchoolTemplateId): SchoolPassport {
  const common = {
    id: `demo-school-${template}`,
    region: "Калужская область",
    academicYear: "2025/2026",
    infrastructure: {
      museum: true,
      mediaCenter: true,
      theater: true,
      sportsClub: true,
      volunteerTeam: true,
      yuid: true,
      firstMovement: true,
      eagletsOfRussia: true,
      childInitiativesCenter: true,
      schoolParliament: true,
      customItems: []
    },
    socialPartners: [
      {
        id: "passport-partner-veterans",
        name: "Калужский городской Совет ветеранов",
        type: "Общественная организация",
        activity: "Уроки мужества, памятные акции, встречи с обучающимися, сопровождение музейных проектов"
      },
      {
        id: "passport-partner-library",
        name: "Калужская областная детская библиотека",
        type: "Учреждение культуры",
        activity: "Читательские акции, классные часы, тематические выставки"
      },
      {
        id: "passport-partner-gibdd",
        name: "ОГИБДД УМВД России по г. Калуге",
        type: "Профилактическое партнерство",
        activity: "Недели безопасности, занятия ЮИД, профилактика детского дорожно-транспортного травматизма"
      },
      {
        id: "passport-partner-youth",
        name: "Молодежный центр г. Калуги",
        type: "Муниципальное учреждение",
        activity: "Проектные смены, добровольческие акции, мероприятия Движения Первых"
      }
    ],
    updatedAt: "2026-06-10"
  };

  if (template === "rural") {
    return {
      ...common,
      name: "МБОУ Новопольская средняя общеобразовательная школа",
      municipality: "Новопольское сельское поселение",
      address: "с. Новополье, ул. Центральная, 12",
      principal: "Соколова Елена Петровна",
      deputyDirector: "Кузнецова Ольга Викторовна",
      studentsCount: 186,
      classesCount: 11
    };
  }

  if (template === "cadet") {
    return {
      ...common,
      name: "МБОУ Средняя школа N 7 имени Героя России А.В. Миронова",
      municipality: "г. Коломна",
      address: "ул. Гагарина, 28",
      principal: "Волков Сергей Николаевич",
      deputyDirector: "Орлова Марина Андреевна",
      studentsCount: 742,
      classesCount: 31
    };
  }

  if (template === "volunteer") {
    return {
      ...common,
      name: "МБОУ Гимназия N 4 «Диалог»",
      municipality: "г. Подольск",
      address: "ул. Школьная, 9",
      principal: "Андреева Наталья Сергеевна",
      deputyDirector: "Михайлова Ирина Павловна",
      studentsCount: 918,
      classesCount: 37
    };
  }

  return {
    ...common,
    name: "МБОУ Средняя общеобразовательная школа N 18 г. Калуги",
    municipality: "город Калуга",
    address: "г. Калуга, ул. Генерала Попова, 18",
    principal: "Иванова Марина Сергеевна",
    deputyDirector: "Петрова Анна Викторовна",
    studentsCount: 824,
    classesCount: 33
  };
}

function createEducationModules(): EducationModule[] {
  return mockAppState.educationModules.map((module) => ({ ...module, active: true }));
}

function createEducationalSystem(template: DemoSchoolTemplateId): EducationalSystem {
  const volunteerTitle = template === "volunteer" ? "Правнуки Победы" : "Правнуки Победы";

  return {
    associations: [
      {
        id: "association-volunteers",
        type: "volunteer_team",
        title: volunteerTitle,
        description: "Волонтерский отряд проводит акции помощи ветеранам, пожилым людям и семьям участников СВО.",
        leader: "Смирнова Елена Олеговна",
        participantsCount: template === "rural" ? 18 : 46,
        classes: "5-11",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-museum",
        type: "school_museum",
        title: "МИР отстояли - МИР защитим!",
        description: "Школьный музей сохраняет материалы о земляках, истории школы и памятных датах России.",
        leader: "Никитина Татьяна Ивановна",
        participantsCount: 24,
        classes: "6-10",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-theater",
        type: "theater",
        title: "Школьный театр «Премьера»",
        description: "Творческое объединение готовит спектакли, литературно-музыкальные композиции и выступления на школьных событиях.",
        leader: "Федорова Наталья Юрьевна",
        participantsCount: 28,
        classes: "5-10",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-media",
        type: "media_center",
        title: "Медиацентр «Школьный объектив»",
        description: "Команда обучающихся выпускает новости школы, фотоотчеты, видеоролики и сопровождает публичные мероприятия.",
        leader: "Смирнова Елена Олеговна",
        participantsCount: 22,
        classes: "7-11",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-first",
        type: "first_movement",
        title: "Первичное отделение Движения Первых",
        description: "Актив обучающихся организует социальные, патриотические и творческие инициативы.",
        leader: "Орлова Марина Андреевна",
        participantsCount: 82,
        classes: "5-11",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-eaglets",
        type: "eaglets_of_russia",
        title: "Орлята России",
        description: "Начальная школа участвует в треках Орлят России, социальных поручениях и классных событиях.",
        leader: "Крылова Ольга Ивановна",
        participantsCount: 146,
        classes: "1-4",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-yuid",
        type: "yuid",
        title: "Отряд ЮИД «Светофор»",
        description: "Отряд проводит профилактические мероприятия по безопасности дорожного движения.",
        leader: "Громова Ирина Алексеевна",
        participantsCount: 16,
        classes: "4-7",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-yunarmiya",
        type: "yunarmiya",
        title: "Юнармейский отряд «Патриот»",
        description: "Отряд участвует в памятных мероприятиях, военно-спортивных играх и акциях гражданско-патриотической направленности.",
        leader: "Сергеев Дмитрий Валерьевич",
        participantsCount: 34,
        classes: "7-11",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-sport",
        type: "sports_club",
        title: "Школьный спортивный клуб «Импульс»",
        description: "Клуб организует соревнования, дни здоровья, спортивные секции и школьные турниры.",
        leader: "Егоров Алексей Павлович",
        participantsCount: 118,
        classes: "2-11",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-parliament",
        type: "custom",
        title: "Школьный парламент",
        description: "Орган ученического самоуправления участвует в планировании школьных дел и общественных инициатив.",
        leader: "Орлова Марина Андреевна",
        participantsCount: 27,
        classes: "7-11",
        photoUrl: "",
        status: "active"
      }
    ],
    infrastructureObjects: [
      {
        id: "infra-museum",
        type: "museum",
        title: "Школьный музей «МИР отстояли - МИР защитим!»",
        description: "Экспозиции о Великой Отечественной войне, истории школы и героях-земляках.",
        responsible: "Никитина Татьяна Ивановна"
      },
      {
        id: "infra-media",
        type: "media_center",
        title: "Школьный медиацентр",
        description: "Пространство для школьных новостей, видеопроектов и медиасопровождения событий.",
        responsible: "Смирнова Елена Олеговна"
      },
      {
        id: "infra-cdi",
        type: "child_initiatives_center",
        title: "Центр детских инициатив",
        description: "Место работы школьного актива, Движения Первых и проектных групп.",
        responsible: "Орлова Марина Андреевна"
      },
      {
        id: "infra-assembly",
        type: "assembly_hall",
        title: "Актовый зал",
        description: "Основная площадка школьных церемоний, театральных постановок, фестивалей и собраний.",
        responsible: "Федорова Наталья Юрьевна"
      },
      {
        id: "infra-gym",
        type: "gym",
        title: "Спортивный зал",
        description: "Площадка для соревнований, дней здоровья, секций и спортивных праздников.",
        responsible: "Егоров Алексей Павлович"
      },
      {
        id: "infra-library",
        type: "library",
        title: "Школьная библиотека",
        description: "Пространство читательских проектов, выставок, встреч и профориентационных мероприятий.",
        responsible: "Лебедева Анна Викторовна"
      },
      {
        id: "infra-subject",
        type: "subject_classrooms",
        title: "Профильные кабинеты естественно-научного цикла",
        description: "Кабинеты используются для проектных занятий, экологических практикумов и профориентации.",
        responsible: "Морозова Светлана Игоревна"
      }
    ],
    partners: [
      {
        id: "system-partner-veterans",
        title: "Совет ветеранов городского округа",
        type: "Общественная организация",
        cooperationDescription: "Уроки мужества, акции памяти, встречи с ветеранами и детьми войны.",
        contactPerson: "Иванов Сергей Петрович"
      },
      {
        id: "system-partner-library",
        title: "Центральная детская библиотека",
        type: "Учреждение культуры",
        cooperationDescription: "Тематические выставки, литературные гостиные, читательские акции.",
        contactPerson: "Лебедева Анна Викторовна"
      },
      {
        id: "system-partner-sport",
        title: "Спортивная школа олимпийского резерва «Юность»",
        type: "Спортивная организация",
        cooperationDescription: "Соревнования, дни здоровья, профориентационные встречи со спортсменами.",
        contactPerson: "Егоров Алексей Павлович"
      },
      {
        id: "system-partner-gibdd",
        title: "ОГИБДД УМВД России по г. Калуге",
        type: "Профилактическое ведомство",
        cooperationDescription: "Профилактика ДДТТ, занятия отряда ЮИД, акции «Внимание, дети!».",
        contactPerson: "Капитан полиции Волкова Ирина Сергеевна"
      },
      {
        id: "system-partner-museum",
        title: "Калужский областной краеведческий музей",
        type: "Учреждение культуры",
        cooperationDescription: "Экскурсии, музейные уроки, историко-патриотические проекты.",
        contactPerson: "Гришина Ольга Николаевна"
      },
      {
        id: "system-partner-youth",
        title: "Молодежный центр г. Калуги",
        type: "Муниципальное учреждение",
        cooperationDescription: "Добровольческие акции, проектные интенсивы, мероприятия Движения Первых.",
        contactPerson: "Кузьмин Артем Павлович"
      },
      {
        id: "system-partner-college",
        title: "Калужский колледж информационных технологий",
        type: "Профессиональная образовательная организация",
        cooperationDescription: "Профориентационные встречи, мастер-классы, профессиональные пробы.",
        contactPerson: "Белова Екатерина Андреевна"
      },
      {
        id: "system-partner-family",
        title: "Городской центр психолого-педагогической помощи семье",
        type: "Социальная служба",
        cooperationDescription: "Родительские собрания, профилактические консультации, сопровождение семей.",
        contactPerson: "Савина Мария Геннадьевна"
      }
    ]
  };
}

function createEvents(template: DemoSchoolTemplateId): SchoolEvent[] {
  const volunteerTitle = template === "volunteer" ? "Правнуки Победы" : "Правнуки Победы";

  return [
    event("demo-event-01", "День знаний «Школа начинается с мечты»", "Общешкольная линейка, классные часы о ценностях образования и встреча с родителями первоклассников.", "module-osnovnye-shkolnye-dela", "Гражданское воспитание", ["noo", "ooo", "soo"], "1-11", "2025-09-01", "Заместитель директора по ВР", "", "infra-assembly", "", "", 824, "high", "completed"),
    event("demo-event-02", "Акция «Внимание, дети!»", "ЮИД и инспектор ГИБДД проводят профилактику ДДТТ для обучающихся и родителей.", "module-profilaktika-bezopasnost", "ДДТТ", ["noo", "ooo"], "1-7", "2025-09-08", "Руководитель ЮИД", "association-yuid", "", "system-partner-gibdd", "ОГИБДД УМВД России по г. Калуге", 430, "high", "completed"),
    event("demo-event-03", "Посвящение в пятиклассники", "Традиционное школьное дело с участием классных руководителей, школьного парламента и Движения Первых.", "module-osnovnye-shkolnye-dela", "Гражданское воспитание", ["ooo"], "5", "2025-09-19", "Педагог-организатор", "association-first", "infra-cdi", "", "", 96, "high", "completed"),
    event("demo-event-04", "Старт треков «Орлята России»", "Начальная школа открывает год треков Орлят России и распределяет поручения в классах.", "module-detskie-obedineniya", "Орлята России", ["noo"], "1-4", "2025-09-24", "Крылова Ольга Ивановна", "association-eaglets", "infra-cdi", "", "", 238, "medium", "completed"),
    event("demo-event-05", "Родительская конференция «Школа и семья»", "Единая конференция по воспитательным приоритетам года, безопасности и партнерству семьи и школы.", "module-roditeli", "Работа с родителями", ["noo", "ooo", "soo"], "1-11", "2025-09-27", "Петрова Анна Викторовна", "", "infra-assembly", "system-partner-family", "Городской центр психолого-педагогической помощи семье", 360, "high", "completed"),
    event("demo-event-06", "День учителя и День самоуправления", "Школьный парламент и актив старшеклассников проводят День самоуправления и праздничную программу.", "module-samoupravlenie", "Самоуправление", ["ooo", "soo"], "8-11", "2025-10-03", "Советник директора", "association-parliament", "infra-assembly", "", "", 286, "high", "completed"),
    event("demo-event-07", "Музейный урок «Калуга в истории страны»", "Школьный музей и краеведческий музей проводят интерактивный урок для 6-8 классов.", "module-shkolnyy-muzey", "Школьный музей", ["ooo"], "6-8", "2025-10-10", "Никитина Татьяна Ивановна", "association-museum", "infra-museum", "system-partner-museum", "Калужский областной краеведческий музей", 124, "medium", "completed"),
    event("demo-event-08", "Осенняя экологическая акция «Чистый школьный двор»", "Классы и волонтерский отряд проводят уборку территории и экологический классный час.", "module-trudovaya-deyatelnost", "Экологическое воспитание", ["noo", "ooo"], "3-8", "2025-10-16", "Учитель биологии", "association-volunteers", "infra-subject", "", volunteerTitle, 310, "medium", "completed"),
    event("demo-event-09", "Киберурок «Безопасный интернет»", "Медиацентр и классные руководители проводят занятия по информационной безопасности.", "module-profilaktika-bezopasnost", "Информационная безопасность", ["ooo", "soo"], "5-11", "2025-10-22", "Смирнова Елена Олеговна", "association-media", "infra-media", "", "", 512, "medium", "completed"),
    event("demo-event-10", "Фестиваль школьного театра «Премьера»", "Школьный театр представляет постановки по литературным произведениям и истории школы.", "module-osnovnye-shkolnye-dela", "Эстетическое воспитание", ["noo", "ooo", "soo"], "1-11", "2025-10-29", "Федорова Наталья Юрьевна", "association-theater", "infra-assembly", "system-partner-library", "Калужская областная детская библиотека", 470, "high", "completed"),
    event("demo-event-11", "Урок мужества «Память поколений»", "Встреча с ветеранами, музейная экспозиция и работа волонтерского отряда.", "module-osnovnye-shkolnye-dela", "Патриотическое воспитание", ["ooo", "soo"], "5-11", "2025-11-07", "Петрова Анна Викторовна", "association-volunteers", "infra-museum", "system-partner-veterans", "Калужский городской Совет ветеранов", 390, "high", "completed"),
    event("demo-event-12", "Профпробы «IT-город»", "Старшеклассники проходят мастер-классы и профессиональные пробы с колледжем информационных технологий.", "module-proforientaciya", "Профориентация", ["soo"], "9-11", "2025-11-13", "Педагог-психолог", "", "infra-subject", "system-partner-college", "Калужский колледж информационных технологий", 112, "medium", "completed"),
    event("demo-event-13", "Неделя правовых знаний", "Классные часы, правовая викторина и профилактические беседы по правонарушениям.", "module-profilaktika-bezopasnost", "Профилактика правонарушений", ["ooo", "soo"], "5-11", "2025-11-18", "Социальный педагог", "", "infra-library", "system-partner-family", "Городской центр психолого-педагогической помощи семье", 505, "medium", "completed"),
    event("demo-event-14", "Добровольческая акция «Тепло рядом»", "Волонтеры собирают открытки и наборы поддержки для пожилых жителей микрорайона.", "module-detskie-obedineniya", "Волонтерская деятельность", ["ooo", "soo"], "6-11", "2025-11-25", "Смирнова Елена Олеговна", "association-volunteers", "infra-cdi", "system-partner-youth", "Молодежный центр г. Калуги", 148, "high", "completed"),
    event("demo-event-15", "Декада ЗОЖ «Выбор сильных»", "Школьный спортивный клуб проводит турниры, зарядки и встречи о здоровом образе жизни.", "module-profilaktika-bezopasnost", "ЗОЖ", ["noo", "ooo", "soo"], "1-11", "2025-12-03", "Егоров Алексей Павлович", "association-sport", "infra-gym", "system-partner-sport", "Спортивная школа «Юность»", 620, "medium", "completed"),
    event("demo-event-16", "День Конституции Российской Федерации", "Единые классные часы, дебаты школьного парламента и выставка в библиотеке.", "module-urochnaya-deyatelnost", "Гражданское воспитание", ["ooo", "soo"], "7-11", "2025-12-12", "Учитель истории", "association-parliament", "infra-library", "", "", 280, "medium", "completed"),
    event("demo-event-17", "Новогодний благотворительный марафон", "Театр, медиацентр и волонтеры проводят праздничные события и сбор подарков.", "module-osnovnye-shkolnye-dela", "Духовно-нравственное воспитание", ["noo", "ooo", "soo"], "1-11", "2025-12-23", "Педагог-организатор", "association-volunteers", "infra-assembly", "system-partner-youth", volunteerTitle, 760, "high", "completed"),
    event("demo-event-18", "Родительский практикум «Подросток в цифровой среде»", "Встреча родителей, педагога-психолога и специалистов по безопасности.", "module-vzaimodeystvie-s-roditelyami", "Работа с родителями", ["ooo", "soo"], "5-11", "2026-01-16", "Педагог-психолог", "", "infra-assembly", "system-partner-family", "Городской центр психолого-педагогической помощи семье", 220, "medium", "completed"),
    event("demo-event-19", "Акция «Блокадный хлеб»", "Патриотическая акция памяти с участием музея, волонтеров и классных руководителей.", "module-osnovnye-shkolnye-dela", "Патриотическое воспитание", ["ooo", "soo"], "5-11", "2026-01-27", "Никитина Татьяна Ивановна", "association-museum", "infra-museum", "system-partner-veterans", "Калужский городской Совет ветеранов", 410, "high", "completed"),
    event("demo-event-20", "Научно-практическая конференция «Первые шаги в науку»", "Проектные работы обучающихся, наставничество педагогов и защита исследовательских проектов.", "module-urochnaya-deyatelnost", "Ценность научного познания", ["noo", "ooo", "soo"], "2-11", "2026-02-05", "Морозова Светлана Игоревна", "", "infra-subject", "", "", 186, "medium", "completed"),
    event("demo-event-21", "Фестиваль патриотической песни «Пою мое Отечество»", "Творческий фестиваль, посвященный защитникам Отечества и памятным датам России.", "module-osnovnye-shkolnye-dela", "Патриотическое воспитание", ["noo", "ooo", "soo"], "1-11", "2026-02-20", "Учитель музыки", "association-theater", "infra-assembly", "system-partner-veterans", "", 540, "high", "completed"),
    event("demo-event-22", "Военно-спортивная игра «Зарница»", "Юнармейский отряд и спортивный клуб проводят командные этапы и патриотические задания.", "module-detskie-obedineniya", "Юнармия", ["ooo", "soo"], "7-11", "2026-02-27", "Сергеев Дмитрий Валерьевич", "association-yunarmiya", "infra-gym", "system-partner-sport", "Спортивная школа «Юность»", 214, "high", "completed"),
    event("demo-event-23", "Неделя финансовой грамотности", "Классные часы и деловые игры о финансовой безопасности и ответственном поведении.", "module-klassnoe-rukovodstvo", "Гражданское воспитание", ["ooo", "soo"], "5-11", "2026-03-04", "Классные руководители", "", "infra-library", "", "", 492, "medium", "completed"),
    event("demo-event-24", "Профориентационный форум «Маршрут успеха»", "Старшеклассники встречаются с колледжами, вузами, работодателями и выпускниками школы.", "module-proforientaciya", "Профориентация", ["ooo", "soo"], "8-11", "2026-03-13", "Педагог-психолог", "", "infra-assembly", "system-partner-college", "Калужский колледж информационных технологий", 260, "high", "completed"),
    event("demo-event-25", "Медиапроект «Герои моей семьи»", "Медиацентр готовит интервью, видеоролики и публикации о семейной памяти обучающихся.", "module-shkolnye-media", "Медиацентр", ["ooo", "soo"], "6-11", "2026-03-20", "Смирнова Елена Олеговна", "association-media", "infra-media", "", "", 96, "medium", "completed"),
    event("demo-event-26", "Экологический практикум «Школьная лаборатория»", "Практикум по экологическим исследованиям, наблюдениям и проектным решениям.", "module-vneurochnaya-deyatelnost", "Экологическое воспитание", ["noo", "ooo"], "3-8", "2026-03-26", "Морозова Светлана Игоревна", "", "infra-subject", "", "", 168, "medium", "planned"),
    event("demo-event-27", "Неделя детской книги", "Библиотека, театр и классы проводят читательские события и литературные гостиные.", "module-vneurochnaya-deyatelnost", "Эстетическое воспитание", ["noo", "ooo"], "1-7", "2026-04-03", "Лебедева Анна Викторовна", "association-theater", "infra-library", "system-partner-library", "Калужская областная детская библиотека", 356, "medium", "planned"),
    event("demo-event-28", "Школьные выборы президента ученического самоуправления", "Школьный парламент проводит кампанию, дебаты и голосование обучающихся.", "module-samoupravlenie", "Самоуправление", ["ooo", "soo"], "7-11", "2026-04-10", "Советник директора", "association-parliament", "infra-cdi", "", "", 318, "high", "planned"),
    event("demo-event-29", "Акция «Письмо солдату»", "Волонтерский отряд и классы готовят письма поддержки участникам СВО.", "module-detskie-obedineniya", "Волонтерская деятельность", ["noo", "ooo", "soo"], "1-11", "2026-04-17", "Петрова Анна Викторовна", "association-volunteers", "infra-cdi", "system-partner-youth", volunteerTitle, 620, "high", "planned"),
    event("demo-event-30", "Профилактическая неделя «Безопасная весна»", "Комплекс мероприятий по антитеррористической, пожарной и дорожной безопасности.", "module-profilaktika-bezopasnost", "Антитеррористическая безопасность", ["noo", "ooo", "soo"], "1-11", "2026-04-22", "Заместитель директора по безопасности", "association-yuid", "infra-assembly", "system-partner-gibdd", "ОГИБДД УМВД России по г. Калуге", 824, "medium", "planned"),
    event("demo-event-31", "День Победы: митинг и Вахта памяти", "Школьный музей, волонтеры, Юнармия и партнеры проводят памятный комплекс мероприятий.", "module-osnovnye-shkolnye-dela", "Патриотическое воспитание", ["noo", "ooo", "soo"], "1-11", "2026-05-05", "Петрова Анна Викторовна", "association-volunteers", "infra-museum", "system-partner-veterans", volunteerTitle, 824, "high", "planned"),
    event("demo-event-32", "Георгиевская ленточка", "Патриотическая акция с участием волонтерского отряда, школьного музея и Совета ветеранов.", "module-osnovnye-shkolnye-dela", "Патриотическое воспитание", ["ooo", "soo"], "5-11", "2026-05-06", "Заместитель директора по ВР", "association-volunteers", "infra-museum", "system-partner-veterans", volunteerTitle, 420, "high", "planned"),
    event("demo-event-33", "Семейный спортивный праздник «Мы вместе»", "ШСК проводит спортивные станции для семей обучающихся и классов.", "module-roditeli", "Работа с родителями", ["noo", "ooo"], "1-7", "2026-05-14", "Егоров Алексей Павлович", "association-sport", "infra-gym", "system-partner-sport", "Спортивная школа «Юность»", 390, "medium", "planned"),
    event("demo-event-34", "Итоговый слет Движения Первых", "Актив школы подводит итоги проектов, добровольческих акций и школьных инициатив.", "module-detskie-obedineniya", "Движение Первых", ["ooo", "soo"], "5-11", "2026-05-20", "Советник директора", "association-first", "infra-cdi", "system-partner-youth", "Молодежный центр г. Калуги", 210, "high", "planned"),
    event("demo-event-35", "Последний звонок", "Традиционная церемония для выпускников с участием родителей, педагогов и школьного актива.", "module-osnovnye-shkolnye-dela", "Гражданское воспитание", ["soo"], "11", "2026-05-25", "Заместитель директора по ВР", "association-parliament", "infra-assembly", "", "", 86, "high", "planned"),
    event("demo-event-36", "Итоговый совет профилактики и анализа воспитательной работы", "Команда воспитательной работы анализирует исполнение мероприятий, риски и задачи на следующий год.", "module-profilaktika-bezopasnost", "Профилактика безнадзорности", ["ooo", "soo"], "5-11", "2026-05-29", "Социальный педагог", "", "infra-library", "system-partner-family", "Городской центр психолого-педагогической помощи семье", 42, "medium", "planned")
  ];
}

function createKpvrItems(events: SchoolEvent[]): KpvrItem[] {
  return events.map((schoolEvent, index) => ({
    id: `demo-kpvr-${index + 1}`,
    moduleId: schoolEvent.moduleId,
    module: schoolEvent.direction,
    task: schoolEvent.title,
    period: schoolEvent.startDate,
    responsible: schoolEvent.responsible,
    status: schoolEvent.status === "completed" ? "completed" : "planned"
  }));
}

function createDemoEventExecutions(events: SchoolEvent[]): EventExecution[] {
  return events.map((schoolEvent, index) => {
    const status = getExecutionStatus(index);
    const confirmed = status === "confirmed" || status === "included_in_report";
    const completedLike = ["completed", "confirmed", "included_in_report"].includes(status);

    return {
      id: `execution-${schoolEvent.id}`,
      eventId: schoolEvent.id,
      status,
      progress: {
        percent: getExecutionProgress(status),
        updatedAt: "2026-04-12T12:00:00.000Z"
      },
      actualDate: completedLike ? schoolEvent.endDate : "",
      responsible: schoolEvent.responsible,
      coExecutors: schoolEvent.coExecutors,
      confirmed,
      confirmedAt: confirmed ? "2026-04-12T12:00:00.000Z" : "",
      evidence: completedLike && index % 4 !== 0
        ? [
            {
              id: `evidence-${schoolEvent.id}`,
              eventId: schoolEvent.id,
              type: "link",
              title: "Ссылка на фотоотчет и материалы мероприятия",
              url: "https://school18-demo.example/report",
              createdAt: "2026-04-12T12:00:00.000Z"
            }
          ]
        : [],
      comments: completedLike
        ? [
            {
              id: `comment-${schoolEvent.id}`,
              eventId: schoolEvent.id,
              author: "Заместитель директора по ВР",
              text: schoolEvent.shortReport || `Мероприятие «${schoolEvent.title}» проведено, данные включены в демо-отчетность школы.`,
              createdAt: "2026-04-12T12:00:00.000Z"
            }
          ]
        : [],
      history: [
        {
          id: `history-${schoolEvent.id}`,
          eventId: schoolEvent.id,
          author: "Система",
          changedAt: "2026-04-12T12:00:00.000Z",
          field: "status",
          from: "Запланировано",
          to: status
        }
      ],
      reminders: completedLike
        ? []
        : [
            {
              id: `reminder-${schoolEvent.id}`,
              eventId: schoolEvent.id,
              remindAt: schoolEvent.startDate,
              message: "Проверить готовность ответственных и материалов мероприятия.",
              completed: false
            }
          ]
    };
  });
}

function getExecutionStatus(index: number): EventExecutionStatus {
  if (index < 18) {
    return "included_in_report";
  }

  if (index < 22) {
    return "confirmed";
  }

  if (index < 25) {
    return "completed";
  }

  if (index < 29) {
    return "in_progress";
  }

  if (index < 34) {
    return "planned";
  }

  if (index === 34) {
    return "assigned";
  }

  return "overdue";
}

function getExecutionProgress(status: EventExecutionStatus) {
  const progress: Record<EventExecutionStatus, number> = {
    draft: 10,
    planned: 25,
    assigned: 40,
    in_progress: 65,
    completed: 90,
    confirmed: 100,
    included_in_report: 100,
    cancelled: 0,
    overdue: 35
  };

  return progress[status];
}

function event(
  id: string,
  title: string,
  description: string,
  moduleId: string,
  direction: string,
  educationLevels: SchoolEvent["educationLevels"],
  classes: string,
  startDate: string,
  responsible: string,
  associationId: string,
  infrastructureObjectId: string,
  systemPartnerId: string,
  partner: string,
  participantsCount: number,
  priority: SchoolEvent["priority"],
  status: SchoolEvent["status"] = "planned"
): SchoolEvent {
  return {
    id,
    title,
    description,
    moduleId,
    direction,
    educationLevels,
    classes,
    startDate,
    endDate: startDate,
    month: Number(startDate.slice(5, 7)),
    venue: "Школа",
    responsible,
    coExecutors: "Советник директора, классные руководители",
    partner,
    associationId,
    infrastructureObjectId,
    systemPartnerId,
    status,
    participantsCount,
    shortReport: status === "completed" ? `Проведено. Участники: ${participantsCount}. Материалы переданы ответственному за отчетность.` : "",
    priority
  };
}

function createExtraActivities(template: DemoSchoolTemplateId): ExtraActivity[] {
  return [
    {
      id: "extra-media",
      title: "Школьный медиацентр",
      type: "extracurricular",
      area: "Социальное",
      educationLevels: ["ooo", "soo"],
      classes: "7-11",
      teacher: "Смирнова Елена Олеговна",
      classroom: "Медиацентр",
      schedule: "Понедельник, 15:00",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 18,
      status: "active"
    },
    {
      id: "extra-volunteer",
      title: template === "volunteer" ? "Волонтерская школа «Правнуки Победы»" : "Школа добровольца",
      type: "extracurricular",
      area: "Социальное",
      educationLevels: ["ooo", "soo"],
      classes: "5-11",
      teacher: "Петрова Анна Викторовна",
      classroom: "Центр детских инициатив",
      schedule: "Среда, 15:30",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: template === "rural" ? 14 : 32,
      status: "active"
    },
    {
      id: "extra-museum",
      title: "Юный экскурсовод школьного музея",
      type: "additional_education",
      area: "Духовно-нравственное",
      educationLevels: ["ooo"],
      classes: "6-9",
      teacher: "Никитина Татьяна Ивановна",
      classroom: "Школьный музей",
      schedule: "Четверг, 14:40",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 16,
      status: "active"
    },
    {
      id: "extra-theater",
      title: "Школьный театр «Премьера»",
      type: "additional_education",
      area: "Эстетическое",
      educationLevels: ["noo", "ooo"],
      classes: "3-8",
      teacher: "Федорова Наталья Юрьевна",
      classroom: "Актовый зал",
      schedule: "Вторник, 15:20",
      weeklyHours: 2,
      totalHours: 68,
      studentsCount: 28,
      status: "active"
    },
    {
      id: "extra-sport",
      title: "Школьный спортивный клуб «Импульс»",
      type: "extracurricular",
      area: "Спортивно-оздоровительное",
      educationLevels: ["noo", "ooo", "soo"],
      classes: "2-11",
      teacher: "Егоров Алексей Павлович",
      classroom: "Спортивный зал",
      schedule: "Пятница, 15:00",
      weeklyHours: 2,
      totalHours: 68,
      studentsCount: 118,
      status: "active"
    },
    {
      id: "extra-eaglets",
      title: "Орлята России: треки года",
      type: "extracurricular",
      area: "Социальное",
      educationLevels: ["noo"],
      classes: "1-4",
      teacher: "Крылова Ольга Ивановна",
      classroom: "Кабинеты начальной школы",
      schedule: "Среда, 13:30",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 146,
      status: "active"
    },
    {
      id: "extra-career",
      title: "Профориентационный клуб «Маршрут успеха»",
      type: "extracurricular",
      area: "Профориентационное",
      educationLevels: ["ooo", "soo"],
      classes: "8-11",
      teacher: "Педагог-психолог",
      classroom: "Профильные кабинеты",
      schedule: "Четверг, 15:30",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 42,
      status: "active"
    }
  ];
}

function createNormativeDocuments(): NormativeDocument[] {
  return [
    normativeDocument("norm-federal-work-program", "Федеральная рабочая программа воспитания", "federal_work_program", "current"),
    normativeDocument("norm-federal-calendar", "Федеральный календарный план воспитательной работы", "federal_calendar_plan", "current"),
    normativeDocument("norm-local-program", "Локальная рабочая программа воспитания школы", "local_school_document", "current")
  ];
}

function normativeDocument(
  id: string,
  title: string,
  category: NormativeDocument["category"],
  actualityStatus: NormativeDocument["actualityStatus"]
): NormativeDocument {
  return {
    id,
    title,
    category,
    level: category.startsWith("federal") ? "federal" : "local",
    documentDate: "2026-06-01",
    version: "2026.1",
    source: "Демо-данные",
    actualityStatus,
    uploadedAt: "2026-06-10T09:00:00.000Z",
    fileName: `${id}.docx`,
    fileType: "docx",
    sizeBytes: 512000,
    requirements: []
  };
}
