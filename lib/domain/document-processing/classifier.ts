import type { DocumentClassification, DocumentKind, NormalizedDocument } from "@/types/document-processing";
import type { DocumentClassifier } from "./contracts";

type ClassificationRule = {
  kind: DocumentKind;
  signals: Array<{
    label: string;
    weight: number;
    match: (context: ClassificationContext) => boolean;
  }>;
};

interface ClassificationContext {
  fileName: string;
  title: string;
  sectionText: string;
  text: string;
  tableText: string;
}

const UNKNOWN_CONFIDENCE_THRESHOLD = 42;

export class RuleBasedDocumentClassifier implements DocumentClassifier {
  async classify(document: NormalizedDocument): Promise<NormalizedDocument> {
    return {
      ...document,
      classification: classifyDocument(document)
    };
  }
}

export function createRuleBasedDocumentClassifier(): DocumentClassifier {
  return new RuleBasedDocumentClassifier();
}

export function createUnknownDocumentClassification(classifiedAt = new Date().toISOString()): DocumentClassification {
  return {
    documentKind: "unknown",
    confidence: 0,
    matchedSignals: [],
    classifiedAt
  };
}

function classifyDocument(document: NormalizedDocument): DocumentClassification {
  const context = buildContext(document);
  const classifiedAt = new Date().toISOString();
  const candidates = rules
    .map((rule) => {
      const matchedSignals = rule.signals.filter((signal) => signal.match(context));
      const rawScore = matchedSignals.reduce((sum, signal) => sum + signal.weight, 0);

      return {
        kind: rule.kind,
        confidence: Math.min(100, rawScore),
        matchedSignals: matchedSignals.map((signal) => signal.label)
      };
    })
    .sort((left, right) => right.confidence - left.confidence);

  const best = candidates[0];

  if (!best || best.confidence < UNKNOWN_CONFIDENCE_THRESHOLD) {
    return {
      documentKind: "unknown",
      confidence: best?.confidence ?? 0,
      matchedSignals: best?.matchedSignals ?? [],
      classifiedAt
    };
  }

  return {
    documentKind: best.kind,
    confidence: best.confidence,
    matchedSignals: best.matchedSignals,
    classifiedAt
  };
}

function buildContext(document: NormalizedDocument): ClassificationContext {
  const firstSections = document.sections
    .slice(0, 5)
    .map((section) => `${section.title} ${section.text}`)
    .join(" ");
  const tableText = document.tables
    .slice(0, 5)
    .map((table) => [table.title, table.columnHeaders.join(" "), table.rows.slice(0, 5).flat().join(" ")].join(" "))
    .join(" ");

  return {
    fileName: normalize(document.fileName),
    title: normalize(document.title),
    sectionText: normalize(firstSections),
    text: normalize(document.text.slice(0, 30_000)),
    tableText: normalize(tableText)
  };
}

const rules: ClassificationRule[] = [
  {
    kind: "federal_work_program",
    signals: [
      includes("федеральная рабочая программа воспитания", 55),
      includes("фрпв", 45),
      includes("федеральная образовательная программа", 28),
      and("рабочая программа воспитания + федеральный признак", 45, [
        includesText("рабочая программа воспитания"),
        includesAnyText(["федеральная", "федеральный", "минпросвещения", "фоп"])
      ])
    ]
  },
  {
    kind: "federal_calendar_plan",
    signals: [
      includes("федеральный календарный план", 55),
      includes("федеральный примерный календарный план", 55),
      includes("фкп", 45),
      and("календарный план + федеральный признак", 42, [
        includesText("календарный план воспитательной работы"),
        includesAnyText(["федеральный", "федеральная", "фоп"])
      ])
    ]
  },
  {
    kind: "kpvr",
    signals: [
      includes("кпвр", 48),
      includes("ктпвр", 42),
      includes("календарный план воспитательной работы", 38),
      tableIncludes("таблица: мероприятия", 18, ["мероприят", "дела", "события"]),
      tableIncludes("таблица: сроки", 14, ["срок", "дата", "месяц"]),
      tableIncludes("таблица: ответственные", 14, ["ответствен"])
    ]
  },
  {
    kind: "upbringing_plan",
    signals: [
      includes("план воспитательной работы", 52),
      includes("план вр", 44),
      includes("план воспитательной деятельности", 42),
      and("план + воспитательная работа", 38, [
        includesAnyText(["план работы", "план мероприятий", "план"]),
        includesAnyText(["воспитательная работа", "воспитательной работы", "воспитательная деятельность"])
      ]),
      tableIncludes("таблица: план мероприятий", 18, ["мероприят", "срок", "ответствен"])
    ]
  },
  {
    kind: "regulation",
    signals: [
      includes("положение", 52),
      includes("положение о", 48),
      includes("общие положения", 28),
      includes("права и обязанности", 22),
      includes("порядок организации", 22)
    ]
  },
  {
    kind: "order",
    signals: [
      includes("приказ", 52),
      includes("приказываю", 52),
      includes("на основании", 16),
      includes("контроль за исполнением приказа", 28),
      includes("назначить ответственным", 22)
    ]
  },
  {
    kind: "school_work_program",
    signals: [
      includes("рабочая программа воспитания", 38),
      and("рабочая программа воспитания + учебный год", 40, [
        includesText("рабочая программа воспитания"),
        includesAnyText(["учебный год", "2025/2026", "2026/2027", "2025-2026", "2026-2027"])
      ]),
      and("рабочая программа воспитания + школьный признак", 36, [
        includesText("рабочая программа воспитания"),
        includesAnyText(["мбоу", "мобу", "сош", "школа", "общеобразовательное бюджетное учреждение"])
      ]),
      and("структура рабочей программы", 45, [
        includesText("целевой раздел"),
        includesText("содержательный раздел"),
        includesText("организационный раздел")
      ]),
      includes("общеобразовательная организация", 15)
    ]
  },
  {
    kind: "extra_activity_plan",
    signals: [
      includes("план внеурочной деятельности", 58),
      includes("внеурочная деятельность", 34),
      tableIncludes("таблица: часы и педагог", 24, ["часы", "педагог", "класс"])
    ]
  },
  {
    kind: "social_passport",
    signals: [
      includes("социальный паспорт", 58),
      includes("контингент обучающихся", 32),
      includes("категории семей", 32)
    ]
  },
  {
    kind: "development_program",
    signals: [
      includes("программа развития", 55),
      includes("целевые показатели", 28),
      includes("развитие образовательной организации", 32)
    ]
  },
  {
    kind: "regional_document",
    signals: [
      includes("региональный", 35),
      includes("министерство образования", 22),
      includesAny("региональные признаки", 8, ["область", "край", "республика"])
    ]
  },
  {
    kind: "municipal_document",
    signals: [
      includes("муниципальный", 40),
      includes("управление образования", 25),
      includes("администрация", 18)
    ]
  },
  {
    kind: "local_school_document",
    signals: [
      includes("локальный акт", 36),
      includes("приказ", 24),
      includes("положение", 22),
      includesAny("школьные признаки", 20, ["мбоу", "сош", "школа"])
    ]
  },
  {
    kind: "normative_document",
    signals: [
      includes("нормативный документ", 40),
      includes("требования", 18),
      includes("приказ министерства", 30),
      includes("письмо министерства", 26)
    ]
  }
];

function includes(label: string, weight: number) {
  const needle = normalize(label);

  return {
    label,
    weight,
    match: (context: ClassificationContext) =>
      context.fileName.includes(needle) ||
      context.title.includes(needle) ||
      context.sectionText.includes(needle) ||
      context.text.includes(needle)
  };
}

function includesAny(label: string, weight: number, values: string[]) {
  const needles = values.map(normalize);

  return {
    label,
    weight,
    match: (context: ClassificationContext) =>
      needles.some((needle) =>
        context.fileName.includes(needle) ||
        context.title.includes(needle) ||
        context.sectionText.includes(needle) ||
        context.text.includes(needle)
      )
  };
}

function tableIncludes(label: string, weight: number, values: string[]) {
  const needles = values.map(normalize);

  return {
    label,
    weight,
    match: (context: ClassificationContext) => needles.every((needle) => context.tableText.includes(needle))
  };
}

function and(label: string, weight: number, checks: Array<(context: ClassificationContext) => boolean>) {
  return {
    label,
    weight,
    match: (context: ClassificationContext) => checks.every((check) => check(context))
  };
}

function includesText(value: string) {
  const needle = normalize(value);

  return (context: ClassificationContext) =>
    context.title.includes(needle) || context.sectionText.includes(needle) || context.text.includes(needle);
}

function includesAnyText(values: string[]) {
  const needles = values.map(normalize);

  return (context: ClassificationContext) =>
    needles.some((needle) => context.title.includes(needle) || context.sectionText.includes(needle) || context.text.includes(needle));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}
