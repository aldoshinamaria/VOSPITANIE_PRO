import type { EducationLevel, FederalKnowledgeBase, FederalTargetResult } from "@/types/domain";

const source = "Федеральная рабочая программа воспитания общеобразовательной организации";

const federalKnowledgeBaseDirections = [
  { id: "civic", keywords: ["гражданин", "Россия", "право", "ответственность"] },
  { id: "patriotic", keywords: ["Родина", "Отечество", "Победа", "память"] },
  { id: "spiritual_moral", keywords: ["нравственность", "семья", "добро", "уважение"] },
  { id: "aesthetic", keywords: ["культура", "искусство", "творчество", "музей"] },
  { id: "physical", keywords: ["здоровье", "спорт", "безопасность", "профилактика"] },
  { id: "labor", keywords: ["труд", "профессия", "профориентация", "созидание"] },
  { id: "environmental", keywords: ["экология", "природа", "среда", "бережное отношение"] },
  { id: "scientific_knowledge", keywords: ["наука", "исследование", "познание", "проект"] }
] as const;

export const federalKnowledgeBase: FederalKnowledgeBase = {
  id: "federal-knowledge-2026",
  title: "Федеральная база знаний по рабочей программе воспитания",
  version: "2026.1",
  updatedAt: "2026-06-09",
  source,
  directions: [
    {
      id: "civic",
      title: "Гражданское",
      description: "Формирование российской гражданской идентичности, правовой культуры и ответственности.",
      keywords: ["гражданин", "Россия", "право", "ответственность", "общество", "государство"],
      source
    },
    {
      id: "patriotic",
      title: "Патриотическое",
      description: "Воспитание любви к Родине, уважения к истории, культуре и защитникам Отечества.",
      keywords: ["Родина", "Отечество", "Победа", "герои", "память", "патриот"],
      source
    },
    {
      id: "spiritual_moral",
      title: "Духовно-нравственное",
      description: "Развитие нравственных представлений, уважения к семье, человеку, традициям и культуре.",
      keywords: ["нравственность", "семья", "добро", "уважение", "традиции", "милосердие"],
      source
    },
    {
      id: "aesthetic",
      title: "Эстетическое",
      description: "Приобщение к культуре, искусству, творчеству и эстетическому восприятию мира.",
      keywords: ["культура", "искусство", "творчество", "музей", "театр", "эстетика"],
      source
    },
    {
      id: "physical",
      title: "Физическое",
      description: "Формирование культуры здоровья, безопасного образа жизни и физического развития.",
      keywords: ["здоровье", "спорт", "безопасность", "режим", "профилактика", "физическая культура"],
      source
    },
    {
      id: "labor",
      title: "Трудовое",
      description: "Развитие уважения к труду, профессиональному самоопределению и созидательной деятельности.",
      keywords: ["труд", "профессия", "профориентация", "мастерство", "созидание", "ответственность"],
      source
    },
    {
      id: "environmental",
      title: "Экологическое",
      description: "Формирование экологической культуры и ответственного отношения к природе.",
      keywords: ["экология", "природа", "среда", "бережное отношение", "ресурсы", "ответственность"],
      source
    },
    {
      id: "scientific_knowledge",
      title: "Ценность научного познания",
      description: "Развитие познавательной активности, исследовательской культуры и уважения к науке.",
      keywords: ["наука", "исследование", "познание", "проект", "технологии", "открытие"],
      source
    }
  ],
  programSections: [
    {
      id: "target",
      title: "Целевой раздел",
      description: "Определяет цель воспитания и целевые ориентиры результатов воспитания по уровням образования.",
      required: true,
      presenceCriteria: ["есть цель воспитания", "есть целевые ориентиры", "ориентиры разделены по НОО, ООО и СОО"],
      completenessCriteria: ["цель связана с личностным развитием", "ориентиры охватывают направления воспитания", "формулировки применимы к школе"],
      requirementSource: source
    },
    {
      id: "content",
      title: "Содержательный раздел",
      description: "Раскрывает уклад школы и виды, формы, содержание воспитательной деятельности.",
      required: true,
      presenceCriteria: ["есть уклад школы", "есть описание модулей воспитания", "есть формы и содержание деятельности"],
      completenessCriteria: ["использованы реальные данные школы", "отражены объединения и партнеры", "модули связаны с КПВР"],
      requirementSource: source
    },
    {
      id: "organizational",
      title: "Организационный раздел",
      description: "Описывает кадровое, нормативно-методическое, ресурсное обеспечение, поощрение и анализ воспитательного процесса.",
      required: true,
      presenceCriteria: ["есть кадровое обеспечение", "есть нормативно-методический блок", "есть анализ воспитательного процесса"],
      completenessCriteria: ["указаны ответственные роли", "учтены условия реализации", "описана система поощрения"],
      requirementSource: source
    },
    {
      id: "kpvr",
      title: "КПВР",
      description: "Календарный план воспитательной работы по уровням образования и модулям воспитания.",
      required: true,
      presenceCriteria: ["есть планы НОО, ООО, СОО", "мероприятия имеют сроки", "мероприятия имеют ответственных"],
      completenessCriteria: ["мероприятия сгруппированы по модулям", "учтены уровни образования", "есть классы и сроки"],
      requirementSource: source
    },
    {
      id: "appendices",
      title: "Приложения",
      description: "Приложения к рабочей программе, включая КПВР и связанные планы.",
      required: true,
      presenceCriteria: ["есть перечень приложений", "КПВР включен как приложение"],
      completenessCriteria: ["приложения согласованы с основным текстом", "приложения обновляются вместе с данными школы"],
      requirementSource: source
    }
  ],
  requirements: [
    {
      id: "req-target-by-level",
      sectionId: "target",
      title: "Целевые ориентиры по уровням образования",
      description: "Целевые ориентиры должны быть представлены отдельно для НОО, ООО и СОО.",
      required: true,
      keywords: ["НОО", "ООО", "СОО", "целевые ориентиры"],
      source
    },
    {
      id: "req-content-school-culture",
      sectionId: "content",
      title: "Уклад школы",
      description: "Содержательный раздел должен отражать особенности уклада конкретной школы.",
      required: true,
      keywords: ["уклад", "традиции", "объединения", "партнерство", "среда"],
      source
    },
    {
      id: "req-kpvr-module-groups",
      sectionId: "kpvr",
      title: "Группировка КПВР по модулям",
      description: "КПВР должен быть связан с модулями воспитания и уровнями образования.",
      required: true,
      keywords: ["модуль", "КПВР", "классы", "сроки", "ответственные"],
      source
    }
  ],
  targetResults: createTargetResults()
};

export const educationLevelFilterOptions: Array<{ value: "all" | EducationLevel; label: string }> = [
  { value: "all", label: "Все уровни" },
  { value: "noo", label: "НОО" },
  { value: "ooo", label: "ООО" },
  { value: "soo", label: "СОО" }
];

export function filterFederalTargetResults(params: {
  results: FederalTargetResult[];
  level: "all" | EducationLevel;
  query: string;
}) {
  const query = params.query.trim().toLowerCase();

  return params.results.filter((result) => {
    const matchesLevel = params.level === "all" || result.educationLevel === params.level;
    const matchesQuery =
      !query ||
      result.text.toLowerCase().includes(query) ||
      result.verificationKeywords.some((keyword) => keyword.toLowerCase().includes(query));

    return matchesLevel && matchesQuery;
  });
}

function createTargetResults(): FederalTargetResult[] {
  const directionText = {
    civic: "осознает принадлежность к российскому обществу, уважает права и обязанности гражданина, готов участвовать в жизни класса, школы и страны",
    patriotic: "проявляет уважение к Родине, истории России, государственным символам, защитникам Отечества и памятным событиям",
    spiritual_moral: "проявляет уважение к человеку, семье, традициям, нравственным нормам, способен к доброжелательному взаимодействию",
    aesthetic: "проявляет интерес к культуре, искусству, творчеству, бережно относится к культурному наследию",
    physical: "понимает ценность здоровья, безопасного поведения, физической активности и профилактики вредных привычек",
    labor: "уважает труд, проявляет ответственность в поручениях, интересуется профессиями и созидательной деятельностью",
    environmental: "бережно относится к природе, понимает личную ответственность за состояние окружающей среды",
    scientific_knowledge: "проявляет познавательную активность, интерес к исследованию, проектной деятельности, науке и технологиям"
  } as const;
  const levelIntro: Record<EducationLevel, string> = {
    noo: "Обучающийся начального общего образования",
    ooo: "Обучающийся основного общего образования",
    soo: "Обучающийся среднего общего образования"
  };

  return federalKnowledgeBaseDirections.map((direction) =>
    (["noo", "ooo", "soo"] as EducationLevel[]).map((level) => ({
      id: `target-${level}-${direction.id}`,
      educationLevel: level,
      directionId: direction.id,
      text: `${levelIntro[level]} ${directionText[direction.id]}.`,
      required: true,
      verificationKeywords: [...direction.keywords],
      source
    }))
  ).flat();
}
