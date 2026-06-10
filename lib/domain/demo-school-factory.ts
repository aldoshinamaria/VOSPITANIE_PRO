import { mockAppState } from "@/data/mock-data";
import { migrateEventDirectionRelations, standardActivityDirections } from "@/lib/domain/activity-directions";
import { createWorkProgramAssembler } from "@/lib/domain/work-program/work-program-assembler";
import type {
  AppState,
  DemoSchoolTemplate,
  DemoSchoolTemplateId,
  EducationModule,
  EducationalSystem,
  ExtraActivity,
  KpvrItem,
  NormativeDocument,
  SchoolEvent,
  SchoolPassport
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
    const now = new Date().toISOString();
    const state: AppState = {
      ...mockAppState,
      schoolPassport: {
        id: "school-empty",
        name: "",
        region: "",
        municipality: "",
        address: "",
        principal: "",
        deputyDirector: "",
        academicYear: "2026/2027",
        studentsCount: 0,
        classesCount: 0,
        infrastructure: {
          museum: false,
          mediaCenter: false,
          theater: false,
          sportsClub: false,
          volunteerTeam: false,
          yuid: false,
          firstMovement: false,
          eagletsOfRussia: false,
          childInitiativesCenter: false,
          schoolParliament: false
        },
        socialPartners: [],
        updatedAt: now
      },
      activityDirections: standardActivityDirections,
      eventDirectionRelations: [],
      events: [],
      kpvr: [],
      extraActivities: [],
      educationalSystem: {
        associations: [],
        infrastructureObjects: [],
        partners: []
      },
      importedDocuments: [],
      extractedEvents: [],
      normativeDocuments: [],
      processedDocuments: [],
      documentProcessingLogs: [],
      complianceCheckHistory: []
    };

    return {
      ...state,
      workProgram: createWorkProgramAssembler().assemble(state)
    };
  }

  createDemoSchool(template: DemoSchoolTemplateId = "urban"): AppState {
    const passport = createPassport(template);
    const educationalSystem = createEducationalSystem(template);
    const educationModules = createEducationModules();
    const events = createEvents(template);
    const activityDirections = standardActivityDirections;
    const extraActivities = createExtraActivities(template);
    const normativeDocuments = createNormativeDocuments();
    const state: AppState = {
      ...mockAppState,
      schoolPassport: passport,
      educationModules,
      activityDirections,
      eventDirectionRelations: migrateEventDirectionRelations(events, activityDirections),
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
    const workProgram = createWorkProgramAssembler().assemble(state);

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

function createPassport(template: DemoSchoolTemplateId): SchoolPassport {
  const common = {
    id: `demo-school-${template}`,
    region: "Московская область",
    academicYear: "2026/2027",
    infrastructure: {
      museum: true,
      mediaCenter: true,
      theater: template === "urban",
      sportsClub: true,
      volunteerTeam: true,
      yuid: true,
      firstMovement: true,
      eagletsOfRussia: true,
      childInitiativesCenter: true,
      schoolParliament: true
    },
    socialPartners: [
      {
        id: "passport-partner-veterans",
        name: "Совет ветеранов городского округа",
        type: "Общественная организация",
        activity: "Уроки мужества, памятные акции, встречи с обучающимися"
      },
      {
        id: "passport-partner-library",
        name: "Центральная детская библиотека",
        type: "Учреждение культуры",
        activity: "Читательские акции, классные часы, тематические выставки"
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
    name: "МБОУ Средняя общеобразовательная школа N 12",
    municipality: "г. Коломна",
    address: "ул. Школьная, 15",
    principal: "Иванова Марина Сергеевна",
    deputyDirector: "Петрова Анна Викторовна",
    studentsCount: 684,
    classesCount: 29
  };
}

function createEducationModules(): EducationModule[] {
  return mockAppState.educationModules.map((module) => ({ ...module, active: true }));
}

function createEducationalSystem(template: DemoSchoolTemplateId): EducationalSystem {
  const volunteerTitle = template === "volunteer" ? "Правнуки Победы" : "Добрые сердца";

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
        id: "association-yuid",
        type: "yuid",
        title: "Отряд ЮИД «Светофор»",
        description: "Отряд проводит профилактические мероприятия по безопасности дорожного движения.",
        leader: "Громова Ирина Алексеевна",
        participantsCount: 16,
        classes: "4-7",
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
        title: "Спортивная школа олимпийского резерва",
        type: "Спортивная организация",
        cooperationDescription: "Соревнования, дни здоровья, профориентационные встречи со спортсменами.",
        contactPerson: "Егоров Алексей Павлович"
      }
    ]
  };
}

function createEvents(template: DemoSchoolTemplateId): SchoolEvent[] {
  const volunteerTitle = template === "volunteer" ? "Правнуки Победы" : "Добрые сердца";

  return [
    event("demo-event-1", "Георгиевская ленточка", "Патриотическая акция с участием волонтерского отряда и школьного музея.", "module-osnovnye-shkolnye-dela", "Патриотическое воспитание", ["ooo", "soo"], "5-11", "2026-05-06", "Заместитель директора по ВР", "association-volunteers", "infra-museum", "system-partner-veterans", volunteerTitle, 320, "high"),
    event("demo-event-2", "Посвящение в пятиклассники", "Традиционное школьное дело для обучающихся 5 классов и классных руководителей.", "module-osnovnye-shkolnye-dela", "Гражданское воспитание", ["ooo"], "5", "2026-09-18", "Педагог-организатор", "association-first", "infra-cdi", "", "", 96, "high"),
    event("demo-event-3", "День самоуправления", "День ученического самоуправления с работой школьного парламента и актива Движения Первых.", "module-samoupravlenie", "Социальная активность", ["ooo", "soo"], "8-11", "2026-10-04", "Советник директора", "association-first", "infra-cdi", "", "", 180, "high"),
    event("demo-event-4", "Неделя безопасности дорожного движения", "Профилактические занятия и практикумы с отрядом ЮИД.", "module-profilaktika-bezopasnost", "Профилактика и безопасность", ["noo", "ooo"], "1-7", "2026-09-23", "Руководитель ЮИД", "association-yuid", "", "", "", 410, "medium"),
    event("demo-event-5", "Фестиваль патриотической песни", "Творческий фестиваль, посвященный памятным датам России.", "module-osnovnye-shkolnye-dela", "Эстетическое воспитание", ["noo", "ooo", "soo"], "1-11", "2027-02-20", "Учитель музыки", "", "", "system-partner-library", "", 540, "high"),
    event("demo-event-6", "Профориентационная встреча «Маршрут успеха»", "Встреча старшеклассников с представителями колледжей и предприятий.", "module-proforientaciya", "Трудовое воспитание", ["soo"], "10-11", "2026-11-15", "Педагог-психолог", "", "", "", "", 88, "medium")
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
  priority: SchoolEvent["priority"]
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
    status: "planned",
    participantsCount,
    shortReport: "",
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
