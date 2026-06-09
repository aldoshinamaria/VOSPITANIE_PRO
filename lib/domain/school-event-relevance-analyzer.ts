import type { AppState, EducationLevel, ExtractedEvent } from "@/types/domain";

export type RelevanceLevel = "high" | "medium" | "low";

export interface SchoolEventRelevanceResult {
  relevanceLevel: RelevanceLevel;
  relevanceScore: number;
  reasons: string[];
  warnings: string[];
}

export interface SchoolEventRelevanceAnalyzer {
  analyze(event: ExtractedEvent, state: AppState): SchoolEventRelevanceResult;
}

interface RuleContext {
  text: string;
  state: AppState;
  reasons: string[];
  warnings: string[];
  score: number;
}

const relevanceLabels: Record<RelevanceLevel, string> = {
  high: "\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u0442\u0441\u044f \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c",
  medium: "\u041c\u043e\u0436\u043d\u043e \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c",
  low: "\u041d\u0435 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u0442\u0441\u044f"
};

export function createSchoolEventRelevanceAnalyzer(): SchoolEventRelevanceAnalyzer {
  return new RuleBasedSchoolEventRelevanceAnalyzer();
}

export function getRelevanceLabel(level: RelevanceLevel) {
  return relevanceLabels[level];
}

class RuleBasedSchoolEventRelevanceAnalyzer implements SchoolEventRelevanceAnalyzer {
  analyze(event: ExtractedEvent, state: AppState): SchoolEventRelevanceResult {
    const context: RuleContext = {
      text: normalizeSearchText([event.title, event.description, event.module, event.responsible].join(" ")),
      state,
      reasons: [],
      warnings: [],
      score: 42
    };

    applyDuplicateRule(event, context);
    applySchoolResourceRules(event, context);
    applyInfrastructureRules(context);
    applyExtracurricularRules(event, context);
    applyUniversalSchoolRules(context);
    applyEducationLevelRule(event.educationLevel, context);

    const relevanceScore = clampScore(context.score);

    return {
      relevanceLevel: getRelevanceLevelByScore(relevanceScore, context.warnings),
      relevanceScore,
      reasons: uniqueValues(context.reasons).slice(0, 4),
      warnings: uniqueValues(context.warnings).slice(0, 4)
    };
  }
}

function applyDuplicateRule(event: ExtractedEvent, context: RuleContext) {
  const duplicate = context.state.events.find((existingEvent) => {
    const titleSimilarity = calculateTitleSimilarity(event.title, existingEvent.title);
    const sameDate = event.date === existingEvent.startDate || event.date === existingEvent.endDate;
    const sameLevel = existingEvent.educationLevels.includes(event.educationLevel);

    return titleSimilarity >= 0.75 || (titleSimilarity >= 0.55 && sameDate && sameLevel);
  });

  if (duplicate) {
    context.score -= 28;
    context.warnings.push(`Possible duplicate: existing event "${duplicate.title}".`);
  }
}

function applySchoolResourceRules(event: ExtractedEvent, context: RuleContext) {
  const activeAssociations = context.state.educationalSystem.associations.filter((association) => association.status === "active");

  applyAssociationRule(context, {
    hasResource:
      context.state.schoolPassport.infrastructure.volunteerTeam ||
      activeAssociations.some((association) => association.type === "volunteer_team"),
    keywords: [
      "volunteer",
      "help",
      "action",
      "georgiev",
      "veteran",
      "svo",
      "РІРѕР»РѕРЅ",
      "Р°РєС†",
      "Р“РµРѕСЂ",
      "РІРµС‚РµСЂ"
    ],
    presentReason: getResourceReason(activeAssociations, "volunteer_team", "School has an active volunteer team."),
    missingWarning: "Looks like a volunteer action, but the school has no active volunteer team."
  });

  applyAssociationRule(context, {
    hasResource:
      context.state.schoolPassport.infrastructure.museum ||
      activeAssociations.some((association) => association.type === "school_museum"),
    keywords: [
      "museum",
      "excursion",
      "memory",
      "victory",
      "patriotic",
      "historic",
      "exposition",
      "РјСѓР·Рµ",
      "Р­РєСЃРє",
      "РїР°РјСЏ",
      "РџРѕР±РµРґ",
      "РїР°С‚СЂРёРѕС‚",
      "РёСЃС‚РѕСЂ"
    ],
    presentReason: getResourceReason(activeAssociations, "school_museum", "School has a museum resource."),
    missingWarning: "Requires a museum resource, but no school museum is configured."
  });

  applyAssociationRule(context, {
    hasResource:
      context.state.schoolPassport.infrastructure.yuid ||
      activeAssociations.some((association) => association.type === "yuid"),
    keywords: ["yuid", "pdd", "road safety", "traffic"],
    presentReason: "School has YUID resources for road safety work.",
    missingWarning: "Related to YUID/road safety, but YUID is not configured."
  });

  applyAssociationRule(context, {
    hasResource:
      context.state.schoolPassport.infrastructure.eagletsOfRussia ||
      activeAssociations.some((association) => association.type === "eaglets_of_russia"),
    keywords: ["eaglets", "orlyata"],
    presentReason: "School has Eaglets of Russia resources.",
    missingWarning: "Related to Eaglets of Russia, but the resource is not configured."
  });

  applyAssociationRule(context, {
    hasResource:
      context.state.schoolPassport.infrastructure.firstMovement ||
      activeAssociations.some((association) => association.type === "first_movement"),
    keywords: ["first movement", "rddm", "РґРІРёР¶РµРЅ"],
    presentReason: "School has First Movement resources.",
    missingWarning: "Related to First Movement, but the resource is not configured."
  });

  if (event.educationLevel === "noo" && context.state.schoolPassport.infrastructure.eagletsOfRussia && hasAnyKeyword(context.text, ["eaglets", "orlyata", "1-4"])) {
    context.score += 12;
    context.reasons.push("Suitable for primary school and Eaglets of Russia work.");
  }
}

function applyInfrastructureRules(context: RuleContext) {
  const infrastructure = context.state.schoolPassport.infrastructure;
  const infrastructureObjects = context.state.educationalSystem.infrastructureObjects;
  const hasMuseumObject = infrastructureObjects.some((object) => object.type === "museum" || object.type === "museum_room");
  const hasMediaObject = infrastructureObjects.some((object) => object.type === "media_center");
  const hasAssemblyHall = infrastructureObjects.some((object) => object.type === "assembly_hall");
  const hasGym = infrastructureObjects.some((object) => object.type === "gym");
  const hasLibrary = infrastructureObjects.some((object) => object.type === "library");

  applyInfrastructureResourceRule(context, hasMuseumObject || infrastructure.museum, ["museum", "excursion", "exposition", "РјСѓР·Рµ", "Р­РєСЃРє"], "Matches school museum infrastructure.", "Needs museum infrastructure.");
  applyInfrastructureResourceRule(context, hasMediaObject || infrastructure.mediaCenter, ["media", "video", "newspaper", "РјРµРґРёР°"], "School has a media center.", "Needs a media center.");
  applyInfrastructureResourceRule(context, hasAssemblyHall, ["concert", "stage", "ceremony"], "School has an assembly hall.", "Likely needs an assembly hall.");
  applyInfrastructureResourceRule(context, hasGym || infrastructure.sportsClub, ["sport", "competition", "tournament"], "School has sports infrastructure.", "Needs sports infrastructure.");
  applyInfrastructureResourceRule(context, hasLibrary, ["library", "reader", "book"], "School has library resources.", "Needs library resources.");
}

function applyExtracurricularRules(event: ExtractedEvent, context: RuleContext) {
  const relatedProgram = context.state.extraActivities.find(
    (program) =>
      program.status === "active" &&
      program.educationLevels.includes(event.educationLevel) &&
      calculateTitleSimilarity(
        [event.title, event.description, event.module].join(" "),
        [program.title, program.area].join(" ")
      ) >= 0.28
  );

  if (relatedProgram) {
    context.score += 16;
    context.reasons.push(`Connected with active extracurricular program "${relatedProgram.title}".`);
  }
}

function applyUniversalSchoolRules(context: RuleContext) {
  if (hasAnyKeyword(context.text, ["class teacher", "lesson of courage", "meeting", "РєР»Р°СЃСЃ", "РЈСЂРѕРє"])) {
    context.score += 10;
    context.reasons.push("Can be implemented by class teachers.");
  }

  if (hasAnyKeyword(context.text, ["school stage", "competition", "action", "holiday", "РєРѕРЅРєСѓСЂ", "Р°РєС†"])) {
    context.score += 8;
    context.reasons.push("Universal event for the school calendar plan.");
  }
}

function applyEducationLevelRule(level: EducationLevel, context: RuleContext) {
  const hasStudents = context.state.schoolPassport.studentsCount > 0 && context.state.schoolPassport.classesCount > 0;

  if (hasStudents) {
    context.score += 6;
    context.reasons.push(`Education level ${getEducationLevelShortLabel(level)} is available in school planning.`);
  } else {
    context.score -= 8;
    context.warnings.push("School passport has no student/class counts; education level needs manual check.");
  }
}

function applyAssociationRule(
  context: RuleContext,
  rule: {
    hasResource: boolean;
    keywords: string[];
    presentReason: string;
    missingWarning: string;
  }
) {
  if (!hasAnyKeyword(context.text, rule.keywords)) {
    return;
  }

  if (rule.hasResource) {
    context.score += 24;
    context.reasons.push(rule.presentReason);
  } else {
    context.score -= 22;
    context.warnings.push(rule.missingWarning);
  }
}

function applyInfrastructureResourceRule(
  context: RuleContext,
  hasResource: boolean,
  keywords: string[],
  reason: string,
  warning: string
) {
  if (!hasAnyKeyword(context.text, keywords)) {
    return;
  }

  if (hasResource) {
    context.score += 12;
    context.reasons.push(reason);
  } else {
    context.score -= 14;
    context.warnings.push(warning);
  }
}

function getResourceReason(
  associations: AppState["educationalSystem"]["associations"],
  type: AppState["educationalSystem"]["associations"][number]["type"],
  fallback: string
) {
  const association = associations.find((item) => item.type === type);

  return association ? `Connected with school association "${association.title}".` : fallback;
}

function getRelevanceLevelByScore(score: number, warnings: string[]): RelevanceLevel {
  if (score >= 74 && warnings.length <= 1) {
    return "high";
  }

  if (score <= 44 || warnings.length >= 2) {
    return "low";
  }

  return "medium";
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function calculateTitleSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeSearchText(left);
  const normalizedRight = normalizeSearchText(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return 0.86;
  }

  const leftTokens = new Set(normalizedLeft.split(" "));
  const rightTokens = new Set(normalizedRight.split(" "));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return union === 0 ? 0 : intersection / union;
}

function hasAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeSearchText(keyword)));
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getEducationLevelShortLabel(level: EducationLevel) {
  const labels: Record<EducationLevel, string> = {
    noo: "NOO",
    ooo: "OOO",
    soo: "SOO"
  };

  return labels[level];
}
