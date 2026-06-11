import type { AppState } from "@/types/domain";
import { createEmptyWorkProgram } from "@/lib/domain/work-program/work-program-assembler";
import { migrateEventDirectionRelations, standardActivityDirections } from "@/lib/domain/activity-directions";
import { migrateEventExecutions } from "@/lib/domain/event-execution";

const mockAppStateDraft: AppState = {
  schoolPassport: {
    id: "school-1",
    name: "МБОУ Средняя школа N 12",
    region: "Московская область",
    municipality: "г. Коломна",
    address: "ул. Школьная, 15",
    principal: "Иванова Марина Сергеевна",
    deputyDirector: "Петрова Анна Викторовна",
    academicYear: "2026/2027",
    studentsCount: 684,
    classesCount: 29,
    infrastructure: {
      museum: true,
      mediaCenter: true,
      theater: false,
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
        id: "partner-1",
        name: "Дом культуры",
        type: "Культурное учреждение",
        activity: "Совместные патриотические и творческие мероприятия"
      },
      {
        id: "partner-2",
        name: "Детская библиотека",
        type: "Образовательный партнер",
        activity: "Классные часы, читательские акции, тематические встречи"
      },
      {
        id: "partner-3",
        name: "Совет ветеранов",
        type: "Общественная организация",
        activity: "Уроки мужества и встречи с обучающимися"
      }
    ],
    updatedAt: "2026-06-01"
  },
  educationModules: [
    {
      id: "module-urochnaya-deyatelnost",
      title: "Урочная деятельность",
      description: "Воспитательный потенциал уроков, рабочих программ и предметного содержания.",
      active: true
    },
    {
      id: "module-vneurochnaya-deyatelnost",
      title: "Внеурочная деятельность",
      description: "Курсы, кружки, объединения и регулярные занятия вне расписания уроков.",
      active: true
    },
    {
      id: "module-klassnoe-rukovodstvo",
      title: "Классное руководство",
      description: "Работа классных руководителей с коллективами обучающихся и семьями.",
      active: true
    },
    {
      id: "module-osnovnye-shkolnye-dela",
      title: "Основные школьные дела",
      description: "Ключевые общешкольные события, традиции и воспитательные практики.",
      active: true
    },
    {
      id: "module-vneshkolnye-meropriyatiya",
      title: "Внешкольные мероприятия",
      description: "Муниципальные, региональные и партнерские события за пределами школы.",
      active: true
    },
    {
      id: "module-trudovaya-deyatelnost",
      title: "Трудовая деятельность",
      description: "Практики общественно полезного труда, дежурства и трудовых инициатив.",
      active: true
    },
    {
      id: "module-predmetno-prostranstvennaya-sreda",
      title: "Организация предметно-пространственной среды",
      description: "Оформление и развитие школьной среды как воспитательного ресурса.",
      active: true
    },
    {
      id: "module-roditeli",
      title: "Взаимодействие с родителями",
      description: "Совместная работа школы и семей обучающихся.",
      active: true
    },
    {
      id: "module-samoupravlenie",
      title: "Самоуправление",
      description: "Ученическое самоуправление, советы обучающихся и инициативные группы.",
      active: true
    },
    {
      id: "module-profilaktika-bezopasnost",
      title: "Профилактика и безопасность",
      description: "Профилактическая работа, безопасность, правовое и цифровое просвещение.",
      active: true
    },
    {
      id: "module-socialnoe-partnerstvo",
      title: "Социальное партнерство",
      description: "Совместная деятельность с организациями, учреждениями и общественными объединениями.",
      active: true
    },
    {
      id: "module-proforientaciya",
      title: "Профориентация",
      description: "Профессиональное самоопределение обучающихся и знакомство с миром профессий.",
      active: true
    },
    {
      id: "module-detskie-obedineniya",
      title: "Детские общественные объединения",
      description: "Работа с детскими и молодежными объединениями на базе школы.",
      active: true
    },
    {
      id: "module-shkolnye-media",
      title: "Школьные медиа",
      description: "Медиацентр, школьные издания, видеопроекты и информационные каналы.",
      active: true
    },
    {
      id: "module-shkolnyy-muzey",
      title: "Школьный музей",
      description: "Музейная педагогика, экскурсии, поисковая и краеведческая работа.",
      active: true
    },
    {
      id: "module-adaptaciya-detey-migrantov",
      title: "Адаптация детей-мигрантов",
      description: "Сопровождение языковой, социальной и культурной адаптации обучающихся.",
      active: true
    }
  ],
  get activityDirections() {
    return standardActivityDirections;
  },
  events: [
    {
      id: "event-1",
      title: "День единых действий",
      description: "Общешкольное событие по календарю памятных дат с классными часами и выставкой.",
      moduleId: "module-osnovnye-shkolnye-dela",
      direction: "Патриотическое воспитание",
      educationLevels: ["ooo", "soo"],
      classes: "8-11",
      startDate: "2026-06-07",
      endDate: "2026-06-07",
      month: 6,
      venue: "Актовый зал",
      responsible: "Классные руководители 8-11 классов",
      coExecutors: "Советник директора, актив школы",
      partner: "Совет ветеранов",
      status: "planned",
      participantsCount: 214,
      shortReport: "",
      priority: "high"
    },
    {
      id: "event-2",
      title: "Встреча с социальными партнерами",
      description: "Рабочая встреча с организациями-партнерами по плану совместных мероприятий.",
      moduleId: "module-socialnoe-partnerstvo",
      direction: "Социальное партнерство",
      educationLevels: ["ooo"],
      classes: "7-9",
      startDate: "2026-06-12",
      endDate: "2026-06-12",
      month: 6,
      venue: "Кабинет заместителя директора по ВР",
      responsible: "Заместитель директора по ВР",
      coExecutors: "Советник директора",
      partner: "Дом культуры",
      status: "planned",
      participantsCount: 36,
      shortReport: "",
      priority: "medium"
    },
    {
      id: "event-3",
      title: "Итоговый классный час",
      description: "Подведение итогов учебного года, обсуждение достижений класса и планов на лето.",
      moduleId: "module-klassnoe-rukovodstvo",
      direction: "Классное руководство",
      educationLevels: ["noo", "ooo", "soo"],
      classes: "1-11",
      startDate: "2026-06-18",
      endDate: "2026-06-18",
      month: 6,
      venue: "Классные кабинеты",
      responsible: "Классные руководители",
      coExecutors: "Педагог-психолог",
      partner: "",
      status: "planned",
      participantsCount: 684,
      shortReport: "",
      priority: "medium"
    }
  ],
  get eventDirectionRelations() {
    return migrateEventDirectionRelations(this.events, this.activityDirections);
  },
  get eventExecutions() {
    return migrateEventExecutions(this.events);
  },
  kpvr: [
    {
      id: "kpvr-1",
      moduleId: "module-urochnaya-deyatelnost",
      module: "Урочная деятельность",
      task: "Включить воспитательные задачи в рабочие программы",
      period: "Сентябрь",
      responsible: "Руководители ШМО",
      status: "completed"
    },
    {
      id: "kpvr-2",
      moduleId: "module-klassnoe-rukovodstvo",
      module: "Классное руководство",
      task: "Провести цикл занятий по профориентации",
      period: "В течение года",
      responsible: "Классные руководители",
      status: "in_progress"
    },
    {
      id: "kpvr-3",
      moduleId: "module-vneshkolnye-meropriyatiya",
      module: "Внешкольные мероприятия",
      task: "Согласовать календарь муниципальных событий",
      period: "Июнь",
      responsible: "Заместитель директора по ВР",
      status: "planned"
    }
  ],
  extraActivities: [
    {
      id: "extra-1",
      title: "Школьный медиацентр",
      type: "extracurricular",
      area: "Социальное",
      educationLevels: ["ooo", "soo"],
      classes: "7-11",
      teacher: "Смирнова Елена Олеговна",
      classroom: "Кабинет 214",
      schedule: "Пн, 15:00",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 18,
      status: "active"
    },
    {
      id: "extra-2",
      title: "Юный исследователь",
      type: "extracurricular",
      area: "Интеллектуальное",
      educationLevels: ["noo", "ooo"],
      classes: "3-6",
      teacher: "Кузнецов Павел Игоревич",
      classroom: "Кабинет 305",
      schedule: "Ср, 14:30",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 24,
      status: "active"
    },
    {
      id: "extra-3",
      title: "Волонтерский отряд",
      type: "additional_education",
      area: "Гражданско-патриотическое",
      educationLevels: ["ooo", "soo"],
      classes: "8-11",
      teacher: "Петрова Анна Викторовна",
      classroom: "Центр детских инициатив",
      schedule: "Чт, 15:30",
      weeklyHours: 1,
      totalHours: 34,
      studentsCount: 31,
      status: "active"
    }
  ],
  educationalSystem: {
    associations: [
      {
        id: "association-volunteers-1",
        type: "volunteer_team",
        title: "Правнуки Победы",
        description: "Волонтерский отряд для патриотических акций, помощи ветеранам и школьных социальных инициатив.",
        leader: "Петрова Анна Викторовна",
        participantsCount: 28,
        classes: "7-11",
        photoUrl: "",
        status: "active"
      },
      {
        id: "association-museum-1",
        type: "school_museum",
        title: "МИР отстояли - МИР защитим!",
        description: "Школьный музейный актив, поисковая и экскурсионная работа, подготовка памятных мероприятий.",
        leader: "Смирнова Елена Олеговна",
        participantsCount: 16,
        classes: "5-10",
        photoUrl: "",
        status: "active"
      }
    ],
    infrastructureObjects: [
      {
        id: "infrastructure-assembly-hall",
        type: "assembly_hall",
        title: "Актовый зал",
        description: "Пространство для общешкольных событий, концертов, встреч и церемоний.",
        responsible: "Заместитель директора по ВР"
      },
      {
        id: "infrastructure-cdi",
        type: "child_initiatives_center",
        title: "Центр детских инициатив",
        description: "Площадка для работы школьного актива, Движения Первых и проектных групп.",
        responsible: "Советник директора"
      }
    ],
    partners: [
      {
        id: "system-partner-veterans",
        title: "Совет ветеранов",
        type: "Общественная организация",
        cooperationDescription: "Уроки мужества, памятные акции, встречи с обучающимися.",
        contactPerson: "Иванов Сергей Петрович"
      }
    ]
  },
  importedDocuments: [],
  extractedEvents: [],
  normativeDocuments: [],
  processedDocuments: [],
  documentProcessingLogs: [],
  get workProgram() {
    return createEmptyWorkProgram(this as AppState);
  },
  complianceCheckHistory: [],
  exportDocuments: [
    {
      id: "export-1",
      title: "Паспорт школы",
      description: "Сводные сведения об образовательной организации.",
      format: "docx",
      source: "school-passport"
    },
    {
      id: "export-2",
      title: "План мероприятий",
      description: "Таблица ближайших воспитательных событий.",
      format: "docx",
      source: "events"
    },
    {
      id: "export-3",
      title: "КПВР",
      description: "Каркас календарного плана воспитательной работы.",
      format: "docx",
      source: "kpvr"
    },
    {
      id: "export-4",
      title: "План внеурочной деятельности",
      description: "Таблица курсов, программ и занятий с классами, часами и педагогами.",
      format: "docx",
      source: "extra-activities"
    }
  ]
};

export const mockAppState: AppState = JSON.parse(JSON.stringify(mockAppStateDraft)) as AppState;
