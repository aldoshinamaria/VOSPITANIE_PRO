import type {
  ActivityMatrixAnalysis,
  ActivityReportRecommendation,
  ActivityReportRisk,
  ActivityReportStatistics
} from "@/types/domain";

export class ActivityReportRecommendationEngine {
  build(input: {
    statistics: ActivityReportStatistics;
    risks: ActivityReportRisk[];
    matrixAnalysis: ActivityMatrixAnalysis;
  }): ActivityReportRecommendation[] {
    const recommendations: ActivityReportRecommendation[] = [
      ...input.risks.map((risk) => ({
        id: `risk-${risk.id}`,
        priority: risk.level,
        text: risk.recommendation
      })),
      ...input.matrixAnalysis.recommendations.map((recommendation) => ({
        id: `matrix-${recommendation.id}`,
        priority: recommendation.priority,
        text: recommendation.text
      }))
    ];

    if (input.statistics.uncoveredClasses.length > 0) {
      recommendations.push({
        id: "cover-classes",
        priority: input.statistics.uncoveredClasses.length > 4 ? "medium" : "low",
        text: `Проверить охват классов: не отражены ${input.statistics.uncoveredClasses.join(", ")} классы.`
      });
    }

    if (input.statistics.planCompletionPercent < 70 && input.statistics.totalEvents > 0) {
      recommendations.push({
        id: "update-statuses",
        priority: "medium",
        text: "Перед отчетом актуализировать статусы мероприятий: планируется, проведено, отменено."
      });
    }

    if (input.statistics.directionCoveragePercent < 70) {
      recommendations.push({
        id: "increase-direction-coverage",
        priority: "high",
        text: "Усилить слабые направления деятельности и добавить не менее 3 мероприятий по каждому пустому направлению."
      });
    }

    return Array.from(new Map(recommendations.map((item) => [item.text, item])).values())
      .sort((a, b) => weight(b.priority) - weight(a.priority) || a.text.localeCompare(b.text, "ru"))
      .slice(0, 10);
  }
}

export function createActivityReportRecommendationEngine() {
  return new ActivityReportRecommendationEngine();
}

function weight(value: ActivityReportRecommendation["priority"]) {
  if (value === "high") {
    return 3;
  }

  if (value === "medium") {
    return 2;
  }

  return 1;
}
