import { createId } from "@/lib/utils";
import type {
  DocumentEntityPreview,
  DocumentEntityPreviewKind,
  DocumentEventPreview,
  DocumentPreviewSourceState,
  DocumentStructuredPreview,
  NormalizedDocument
} from "@/types/document-processing";

const REQUIRED_SCHOOL_FIELDS = [
  "Название школы",
  "Муниципалитет",
  "Регион",
  "Директор",
  "Заместитель директора по ВР",
  "Учебный год"
];

const moduleSignals = [
  "Урочная деятельность",
  "Внеурочная деятельность",
  "Классное руководство",
  "Основные школьные дела",
  "Внешкольные мероприятия",
  "Трудовая деятельность",
  "Организация предметно-пространственной среды",
  "Взаимодействие с родителями",
  "Самоуправление",
  "Профилактика и безопасность",
  "Социальное партнерство",
  "Профориентация",
  "Детские общественные объединения",
  "Школьные медиа",
  "Школьный музей",
  "Добровольческая деятельность"
];

const associationSignals: Array<[string, string]> = [
  ["волонтер", "Волонтерский отряд"],
  ["доброволь", "Волонтерский отряд"],
  ["школьный музей", "Школьный музей"],
  ["музейный актив", "Школьный музей"],
  ["медиацентр", "Медиацентр"],
  ["школьный театр", "Театр"],
  ["юид", "ЮИД"],
  ["юнарм", "Юнармия"],
  ["орлята россии", "Орлята России"],
  ["движение первых", "Движение Первых"],
  ["рддм", "Движение Первых"],
  ["спортивный клуб", "Школьный спортивный клуб"],
  ["совет обучающихся", "Совет обучающихся"],
  ["самоуправлен", "Школьное самоуправление"]
];

const infrastructureSignals: Array<[string, string]> = [
  ["школьный музей", "Музей"],
  ["музейная комната", "Музейная комната"],
  ["библиотека", "Библиотека"],
  ["медиацентр", "Медиацентр"],
  ["актовый зал", "Актовый зал"],
  ["спортивный зал", "Спортивный зал"],
  ["центр детских инициатив", "Центр детских инициатив"],
  ["цди", "Центр детских инициатив"],
  ["профильный кабинет", "Профильные кабинеты"]
];

const partnerSignals = [
  "библиотека",
  "музей",
  "дом культуры",
  "дк",
  "колледж",
  "техникум",
  "университет",
  "предприятие",
  "центр занятости",
  "гибдд",
  "мвд",
  "мчс",
  "центр культуры",
  "спортивная школа"
];

export interface DocumentStructuredPreviewExtractor {
  extract(document: NormalizedDocument): NormalizedDocument;
}

export function createRuleBasedDocumentStructuredPreviewExtractor(): DocumentStructuredPreviewExtractor {
  return new RuleBasedDocumentStructuredPreviewExtractor();
}

export function createEmptyDocumentStructuredPreview(): DocumentStructuredPreview {
  return {
    schoolData: [],
    educationModules: [],
    associations: [],
    socialPartners: [],
    infrastructure: [],
    responsiblePersons: [],
    terms: [],
    educationLevels: [],
    events: []
  };
}

export function migrateDocumentStructuredPreview(preview?: Partial<DocumentStructuredPreview>): DocumentStructuredPreview {
  const empty = createEmptyDocumentStructuredPreview();

  return {
    schoolData: withEntitySourceState(preview?.schoolData ?? empty.schoolData),
    educationModules: withEntitySourceState(preview?.educationModules ?? empty.educationModules),
    associations: withEntitySourceState(preview?.associations ?? empty.associations),
    socialPartners: withEntitySourceState(preview?.socialPartners ?? empty.socialPartners),
    infrastructure: withEntitySourceState(preview?.infrastructure ?? empty.infrastructure),
    responsiblePersons: withEntitySourceState(preview?.responsiblePersons ?? empty.responsiblePersons),
    terms: withEntitySourceState(preview?.terms ?? empty.terms),
    educationLevels: withEntitySourceState(preview?.educationLevels ?? empty.educationLevels),
    events: Array.isArray(preview?.events)
      ? preview.events.map((event) => ({ ...event, sourceState: event.sourceState ?? "extracted" }))
      : empty.events
  };
}

class RuleBasedDocumentStructuredPreviewExtractor implements DocumentStructuredPreviewExtractor {
  extract(document: NormalizedDocument): NormalizedDocument {
    const fragments = buildFragments(document);
    const events = normalizeEventLevels(document, document.extractedEventPreview ?? []);
    const structuredPreview: DocumentStructuredPreview = addMissingRequiredFields({
      schoolData: extractSchoolData(document, fragments),
      educationModules: extractSignals(document, fragments, "education_module", moduleSignals.map((title) => [title, title])),
      associations: extractSignals(document, fragments, "association", associationSignals),
      socialPartners: extractSocialPartners(document, fragments),
      infrastructure: extractSignals(document, fragments, "infrastructure", infrastructureSignals),
      responsiblePersons: extractResponsiblePersons(document, fragments, events),
      terms: extractTerms(document, fragments, events),
      educationLevels: extractEducationLevels(document, fragments, events),
      events
    }, document);

    return {
      ...document,
      extractedEventPreview: events,
      structuredPreview
    };
  }
}

function buildFragments(document: NormalizedDocument) {
  const sectionFragments = document.sections.flatMap((section) => splitIntoFragments(`${section.title}. ${section.text}`));
  const tableFragments = document.tables.flatMap((table) => table.rows.map((row) => row.join(" | ")));
  const textFragments = splitIntoFragments(document.text);

  return uniqueByNormalized([...tableFragments, ...sectionFragments, ...textFragments])
    .map(cleanText)
    .filter((fragment) => fragment.length >= 8)
    .slice(0, 800);
}

function extractSchoolData(document: NormalizedDocument, fragments: string[]): DocumentEntityPreview[] {
  const candidates: DocumentEntityPreview[] = [];

  const schoolFragment = fragments.find((fragment) =>
    /\b(мбоу|моу|маоу|гбоу|сош|школа|лицей|гимназия)\b/i.test(fragment) &&
    !looksLikeEventFragment(fragment) &&
    !looksLikePartnerFragment(fragment)
  );
  const schoolName = schoolFragment?.match(/((?:мбоу|моу|маоу|гбоу|сош|школа|лицей|гимназия)[^.\n|]{5,180})/iu)?.[1];

  if (schoolName) {
    candidates.push(entity(document, "school_data", "Название школы", schoolName, schoolFragment, ["название школы"], 78));
  }

  const municipalityFragment = fragments.find((fragment) =>
    /муниципальн/i.test(fragment) &&
    !looksLikeEventFragment(fragment) &&
    !/проект|мероприят|акци|конкурс|урок|день/i.test(fragment)
  );
  const municipality = municipalityFragment?.match(/(муниципальн(?:ый|ого|ая|ое)?[^.\n|]{5,140})/iu)?.[1];

  if (municipality) {
    candidates.push(entity(document, "school_data", "Муниципалитет", municipality, municipalityFragment, ["муниципалитет"], 70));
  }

  const regionFragment = fragments.find((fragment) =>
    /(республика|область|край|автономный округ|город федерального значения)/i.test(fragment) &&
    !looksLikeEventFragment(fragment)
  );
  const region = regionFragment?.match(/((?:республика|область|край|автономный округ|город федерального значения)[^.\n|]{0,120})/iu)?.[1];

  if (region) {
    candidates.push(entity(document, "school_data", "Регион", region, regionFragment, ["регион"], 66));
  }

  const directorFragment = fragments.find((fragment) => /директор[:\s]/i.test(fragment) && !/заместител/i.test(fragment));
  const director = directorFragment?.match(/директор[:\s]+([^.\n|]{5,120})/iu)?.[1];

  if (director && looksLikePerson(director)) {
    candidates.push(entity(document, "school_data", "Директор", director, directorFragment, ["директор"], 72));
  }

  const deputyFragment = fragments.find((fragment) => /заместител[ья][^.\n|]{0,80}(вр|воспитательной работе)/i.test(fragment));
  const deputy = deputyFragment?.match(/заместител[ья][^.\n|]{0,80}(?:вр|воспитательной работе)[:\s]+([^.\n|]{5,120})/iu)?.[1];

  if (deputy && looksLikePerson(deputy)) {
    candidates.push(entity(document, "school_data", "Заместитель директора по ВР", deputy, deputyFragment, ["заместитель по вр"], 74));
  }

  const yearFragment = fragments.find((fragment) => /\d{4}\s*[-/]\s*\d{4}/.test(fragment));
  const academicYear = yearFragment?.match(/\d{4}\s*[-/]\s*\d{4}/u)?.[0];

  if (academicYear) {
    candidates.push(entity(document, "school_data", "Учебный год", academicYear, yearFragment, ["учебный год"], 70));
  }

  return dedupeEntities(candidates);
}

function extractSignals(
  document: NormalizedDocument,
  fragments: string[],
  kind: DocumentEntityPreviewKind,
  signals: Array<[string, string]>
) {
  const found = signals.flatMap(([needle, title]) => {
    const normalizedNeedle = normalize(needle);
    const fragment = fragments.find((item) => normalize(item).includes(normalizedNeedle));

    return fragment ? [entity(document, kind, title, title, fragment, [needle], 72)] : [];
  });

  return dedupeEntities(found);
}

function extractSocialPartners(document: NormalizedDocument, fragments: string[]): DocumentEntityPreview[] {
  const partners = fragments.flatMap((fragment) => {
    if (!looksLikePartnerFragment(fragment) || looksLikeEventFragment(fragment)) {
      return [];
    }

    const value = cleanText(fragment)
      .split("|")
      .map(cleanText)
      .find((part) => partnerSignals.some((signal) => normalize(part).includes(normalize(signal)))) ?? fragment;

    return [entity(document, "social_partner", "Социальный партнер", value, fragment, ["партнер"], 68)];
  });

  return dedupeEntities(partners).slice(0, 30);
}

function extractResponsiblePersons(document: NormalizedDocument, fragments: string[], events: DocumentEventPreview[]) {
  const fromEvents = events
    .filter((event) => event.responsibleText && looksLikeResponsible(event.responsibleText))
    .map((event) =>
      entity(document, "responsible_person", "Ответственный", event.responsibleText, event.sourceFragment, ["ответственный"], 78)
    );
  const fromText = fragments.flatMap((fragment) => {
    const matches = Array.from(fragment.matchAll(/(?:ответствен(?:ный|ные)?|исполнитель|руководитель|организатор):?\s*([^|.;\n]{5,120})/giu));
    return matches
      .map((match) => cleanText(match[1]))
      .filter(looksLikeResponsible)
      .map((value) => entity(document, "responsible_person", "Ответственный", value, fragment, ["ответственный"], 66));
  });

  return dedupeEntities([...fromEvents, ...fromText]).slice(0, 50);
}

function extractTerms(document: NormalizedDocument, fragments: string[], events: DocumentEventPreview[]) {
  const fromEvents = events
    .filter((event) => event.dateText || event.month)
    .map((event) =>
      entity(document, "term", "Срок", event.dateText || formatMonth(event.month), event.sourceFragment, ["срок"], event.month ? 78 : 62)
    );
  const fromText = fragments.flatMap((fragment) => {
    const matches = Array.from(fragment.matchAll(/\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?\b|\b(?:сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья]|январ[ья]|феврал[ья]|март[а]?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|август[а]?)\b/giu));
    return matches.map((match) => entity(document, "term", "Срок", cleanText(match[0]), fragment, ["дата"], 60));
  });

  return dedupeEntities([...fromEvents, ...fromText]).slice(0, 80);
}

function extractEducationLevels(document: NormalizedDocument, fragments: string[], events: DocumentEventPreview[]) {
  const forcedLevel = inferForcedEducationLevel(document);
  const foundLevels = new Set<string>();

  if (forcedLevel) {
    foundLevels.add(forcedLevel);
  } else {
    const text = normalize(fragments.join(" "));
    if (text.includes("ноо") || /1\s*[-–]\s*4|1-4|начальн/.test(text)) foundLevels.add("НОО");
    if (text.includes("ооо") || /5\s*[-–]\s*9|5-9|основн/.test(text)) foundLevels.add("ООО");
    if (text.includes("соо") || /10\s*[-–]\s*11|10-11|средн/.test(text)) foundLevels.add("СОО");
    events.forEach((event) => event.educationLevels.forEach((level) => foundLevels.add(level.toUpperCase())));
  }

  return Array.from(foundLevels).map((level) =>
    entity(document, "education_level", `Уровень ${level}`, level, level, ["уровень образования"], 78)
  );
}

function normalizeEventLevels(document: NormalizedDocument, events: DocumentEventPreview[]) {
  const forcedLevel = inferForcedEducationLevel(document);

  if (!forcedLevel) {
    return events.map((event) => ({ ...event, sourceState: event.sourceState ?? "extracted" }));
  }

  return events.map((event) => ({
    ...event,
    sourceState: event.sourceState ?? "extracted",
    educationLevels: [forcedLevel]
  }));
}

function inferForcedEducationLevel(document: NormalizedDocument) {
  const text = normalize(`${document.fileName} ${document.title} ${document.sections.slice(0, 2).map((section) => section.title).join(" ")}`);
  const isPlan = ["kpvr", "upbringing_plan"].includes(document.classification?.documentKind ?? "");

  if (!isPlan) {
    return null;
  }

  if (/\bноо\b|1\s*[-–]\s*4|начальн/.test(text)) return "НОО";
  if (/\bооо\b|5\s*[-–]\s*9|основн/.test(text)) return "ООО";
  if (/\bсоо\b|10\s*[-–]\s*11|средн/.test(text)) return "СОО";

  return null;
}

function addMissingRequiredFields(preview: DocumentStructuredPreview, document: NormalizedDocument): DocumentStructuredPreview {
  const existingSchoolFields = new Set(preview.schoolData.map((item) => normalize(item.title)));
  const missingSchoolData = REQUIRED_SCHOOL_FIELDS.filter((title) => !existingSchoolFields.has(normalize(title))).map((title) =>
    entity(document, "school_data", title, "", "Не найдено в документе. Заполните вручную при необходимости.", ["empty"], 0, "empty")
  );

  return {
    ...preview,
    schoolData: [...preview.schoolData, ...missingSchoolData]
  };
}

function entity(
  document: NormalizedDocument,
  kind: DocumentEntityPreviewKind,
  title: string,
  value: string,
  sourceFragment: string,
  matchedSignals: string[],
  confidence: number,
  sourceState: DocumentPreviewSourceState = "extracted"
): DocumentEntityPreview {
  return {
    id: createId("document-entity-preview"),
    kind,
    title: cleanText(title),
    value: cleanText(value).slice(0, 220),
    sourceState,
    confidence,
    sourceDocumentId: document.id,
    sourceDocumentName: document.fileName,
    sourceFragment: cleanText(sourceFragment).slice(0, 420),
    matchedSignals
  };
}

function withEntitySourceState(items?: Partial<DocumentEntityPreview>[]) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        sourceState: item.sourceState ?? (item.value ? "extracted" : "empty")
      })) as DocumentEntityPreview[]
    : [];
}

function splitIntoFragments(text: string) {
  return text
    .split(/\n+|;\s+|(?<=[.!?])\s+(?=[А-ЯЁA-Z])/u)
    .map(cleanText)
    .filter(Boolean);
}

function dedupeEntities(items: DocumentEntityPreview[]) {
  const seen = new Set<string>();
  const result: DocumentEntityPreview[] = [];

  for (const item of items) {
    const key = `${item.kind}:${normalize(item.title)}:${normalize(item.value)}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function uniqueByNormalized(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function formatMonth(month: number | null) {
  return month ? new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(new Date(2026, month - 1, 1)) : "";
}

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function normalize(value: string) {
  return cleanText(value).toLowerCase().replace(/ё/g, "е");
}

function looksLikeEventFragment(value: string) {
  const normalized = normalize(value);
  return /мероприят|акци|конкурс|урок|день |классный час|экскурс|соревнован|праздник|проект/.test(normalized);
}

function looksLikePartnerFragment(value: string) {
  const normalized = normalize(value);
  return partnerSignals.some((signal) => normalized.includes(normalize(signal))) || normalized.includes("социальн") && normalized.includes("партнер");
}

function looksLikePerson(value: string) {
  const normalized = normalize(value);
  if (looksLikeEventFragment(value) || looksLikePartnerFragment(value)) return false;
  if (/отряд|музей|движение|орлята|юид|юнарм|медиацентр|совет/.test(normalized)) return false;
  return /[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ]\.){1,2}|[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+/.test(value);
}

function looksLikeResponsible(value: string) {
  const normalized = normalize(value);
  if (!value || looksLikeEventFragment(value)) return false;
  if (/волонтерский отряд|школьный музей|движение первых|орлята россии|юид|юнармия/.test(normalized)) return false;
  return /классн|заместител|советник|педагог|учитель|руководител|директор|библиотекар|психолог|социальн/.test(normalized) || looksLikePerson(value);
}
