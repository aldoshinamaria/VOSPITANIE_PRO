import type {
  ActivityMatrixAnalysis,
  ActivityReportRisk,
  ActivityReportRiskLevel,
  ActivityReportStatistics
} from "@/types/domain";

export class ActivityReportRiskAnalyzer {
  analyze(statistics: ActivityReportStatistics, matrixAnalysis: ActivityMatrixAnalysis): ActivityReportRisk[] {
    const risks: ActivityReportRisk[] = [
      ...matrixAnalysis.risks.map((risk) => ({
        id: `matrix-${risk.id}`,
        level: risk.severity,
        title: risk.title,
        reason: risk.reason,
        recommendation: risk.recommendation
      }))
    ];

    if (statistics.totalEvents === 0) {
      risks.push(risk("report-empty", "high", "Нет мероприятий в отчете", "По выбранным условиям не найдено ни одного мероприятия.", "Проверьте период отчета или добавьте мероприятия в реестр."));
    }

    if (statistics.completedEvents === 0 && statistics.totalEvents > 0) {
      risks.push(risk("no-completed-events", "high", "Нет проведенных мероприятий", "В отчете есть мероприятия, но ни одно не отмечено как проведенное.", "Обновить статусы проведенных мероприятий перед показом отчета."));
    }

    if (statistics.planCompletionPercent < 50 && statistics.totalEvents > 0) {
      risks.push(risk("low-completion", "medium", "Низкое выполнение плана", `Выполнение составляет ${statistics.planCompletionPercent}%.`, "Проверить причины невыполнения и актуализировать статусы мероприятий."));
    }

    if (statistics.classCoveragePercent < 70) {
      risks.push(risk("low-class-coverage", "medium", "Недостаточный охват классов", `Охвачено ${statistics.classCoveragePercent}% классов.`, "Добавить мероприятия для неохваченных классов или уточнить поле «Классы»."));
    }

    if (statistics.directionCoveragePercent < 50) {
      risks.push(risk("low-direction-coverage", "high", "Недостаточный охват направлений", `Охвачено ${statistics.directionCoveragePercent}% направлений деятельности.`, "Добавить мероприятия по пустым и слабым направлениям."));
    }

    if (statistics.overdueEvents > 0) {
      risks.push(risk("overdue-events", "medium", "Есть просроченные мероприятия", `Просрочено мероприятий: ${statistics.overdueEvents}.`, "Провести мероприятия, перенести сроки или изменить статус."));
    }

    return dedupeRisks(risks).sort(compareRisks);
  }
}

export function createActivityReportRiskAnalyzer() {
  return new ActivityReportRiskAnalyzer();
}

function risk(
  id: string,
  level: ActivityReportRiskLevel,
  title: string,
  reason: string,
  recommendation: string
): ActivityReportRisk {
  return { id, level, title, reason, recommendation };
}

function dedupeRisks(risks: ActivityReportRisk[]) {
  return Array.from(new Map(risks.map((item) => [item.id, item])).values());
}

function compareRisks(left: ActivityReportRisk, right: ActivityReportRisk) {
  return riskWeight(right.level) - riskWeight(left.level) || left.title.localeCompare(right.title, "ru");
}

function riskWeight(level: ActivityReportRiskLevel) {
  if (level === "high") {
    return 3;
  }

  if (level === "medium") {
    return 2;
  }

  return 1;
}
