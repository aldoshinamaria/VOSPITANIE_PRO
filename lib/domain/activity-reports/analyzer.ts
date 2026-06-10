import type {
  ActivityMatrixAnalysis,
  ActivityReportInsight,
  ActivityReportRisk,
  ActivityReportStatistics
} from "@/types/domain";

export class ActivityReportAnalyzer {
  analyze(input: {
    statistics: ActivityReportStatistics;
    matrixAnalysis: ActivityMatrixAnalysis;
    risks: ActivityReportRisk[];
  }): ActivityReportInsight[] {
    const insights: ActivityReportInsight[] = [];

    if (input.statistics.planCompletionPercent >= 80) {
      insights.push({
        id: "strong-completion",
        type: "strength",
        title: "Высокое выполнение плана",
        text: `Проведено ${input.statistics.planCompletionPercent}% мероприятий по выбранному отчету.`
      });
    }

    if (input.statistics.classCoveragePercent >= 80) {
      insights.push({
        id: "strong-class-coverage",
        type: "strength",
        title: "Хороший охват классов",
        text: `Охвачено ${input.statistics.classCoveragePercent}% классов, что позволяет показывать системную работу школы.`
      });
    }

    if (input.matrixAnalysis.balance.score >= 70) {
      insights.push({
        id: "balanced-work",
        type: "strength",
        title: "Сбалансированная воспитательная работа",
        text: `Индекс баланса составляет ${input.matrixAnalysis.balance.score}%.`
      });
    }

    if (input.risks.some((risk) => risk.level === "high")) {
      insights.push({
        id: "high-risks-present",
        type: "problem",
        title: "Есть критичные риски",
        text: "Перед проверкой необходимо закрыть высокие риски: пустые направления, отсутствующие уровни или отсутствие проведенных мероприятий."
      });
    }

    if (input.statistics.overdueEvents > 0) {
      insights.push({
        id: "overdue-events",
        type: "problem",
        title: "Есть невыполненные мероприятия",
        text: `Просрочено мероприятий: ${input.statistics.overdueEvents}. Это может вызвать вопросы при управленческой проверке.`
      });
    }

    insights.push({
      id: "report-conclusion",
      type: "conclusion",
      title: "Итог",
      text: buildConclusion(input.statistics, input.risks)
    });

    return insights;
  }
}

export function createActivityReportAnalyzer() {
  return new ActivityReportAnalyzer();
}

function buildConclusion(statistics: ActivityReportStatistics, risks: ActivityReportRisk[]) {
  if (statistics.totalEvents === 0) {
    return "Отчет не готов: в выбранном периоде нет мероприятий.";
  }

  const highRisks = risks.filter((risk) => risk.level === "high").length;

  if (highRisks > 0) {
    return `Отчет требует доработки: обнаружено высоких рисков ${highRisks}, выполнение плана ${statistics.planCompletionPercent}%.`;
  }

  if (statistics.planCompletionPercent >= 80 && statistics.classCoveragePercent >= 80) {
    return "Отчет можно использовать для управленческого анализа и подготовки к проверке.";
  }

  return "Отчет частично готов: данные можно использовать, но требуется уточнить охват и статусы мероприятий.";
}
