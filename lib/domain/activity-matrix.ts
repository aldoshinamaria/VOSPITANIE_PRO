import { educationLevelLabels, educationLevels } from "@/lib/domain/events";
import { monthLabels } from "@/lib/utils";
import type {
  ActivityMatrix,
  ActivityMatrixAnalysis,
  ActivityMatrixBalanceIndex,
  ActivityMatrixColumn,
  ActivityMatrixInput,
  ActivityMatrixMode,
  ActivityMatrixRecommendation,
  ActivityMatrixRisk,
  ActivityMatrixRow,
  EducationLevel,
  SchoolEvent
} from "@/types/domain";

const academicMonthOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
const standardClassNumbers = Array.from({ length: 11 }, (_, index) => String(index + 1));

export class ActivityMatrixAnalyzer {
  buildMatrix(input: ActivityMatrixInput): ActivityMatrix {
    const activeDirections = input.directions.filter((direction) => direction.active);
    const columns = buildColumns(input);
    const eventById = new Map(input.events.map((event) => [event.id, event]));
    const eventsByDirection = activeDirections.reduce<Map<string, SchoolEvent[]>>((acc, direction) => {
      const events = input.relations
        .filter((relation) => relation.directionId === direction.id)
        .map((relation) => eventById.get(relation.eventId))
        .filter((event): event is SchoolEvent => Boolean(event));

      acc.set(direction.id, dedupeEvents(events));
      return acc;
    }, new Map());
    const rows = activeDirections.map((direction) => buildRow(direction, eventsByDirection.get(direction.id) ?? [], columns, input.mode, input.modules));
    const maxCellCount = Math.max(0, ...rows.flatMap((row) => row.cells.map((cell) => cell.count)));
    const normalizedRows = rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        intensity: maxCellCount > 0 ? Math.round((cell.count / maxCellCount) * 100) : 0
      }))
    }));
    const analysis = this.analyze({
      rows: normalizedRows,
      columns,
      events: input.events,
      mode: input.mode,
      expectedClasses: input.expectedClasses ?? standardClassNumbers
    });

    return {
      mode: input.mode,
      columns,
      rows: normalizedRows,
      totalEvents: input.events.length,
      maxCellCount,
      analysis
    };
  }

  analyze(input: {
    rows: ActivityMatrixRow[];
    columns: ActivityMatrixColumn[];
    events: SchoolEvent[];
    mode: ActivityMatrixMode;
    expectedClasses: string[];
  }): ActivityMatrixAnalysis {
    const risks: ActivityMatrixRisk[] = [];
    const recommendations: ActivityMatrixRecommendation[] = [];
    const emptyDirections = input.rows.filter((row) => row.total === 0).map((row) => row.directionTitle);
    const weakDirections = input.rows.filter((row) => row.total > 0 && row.total < 2);
    const emptyColumns = input.columns
      .filter((column) => input.rows.every((row) => row.cells.find((cell) => cell.key === column.key)?.count === 0))
      .map((column) => column.label);
    const overloadedColumns = input.columns
      .filter((column) => {
        const count = input.rows.reduce((sum, row) => sum + (row.cells.find((cell) => cell.key === column.key)?.count ?? 0), 0);

        return input.events.length > 0 && count / input.events.length > 0.3;
      })
      .map((column) => column.label);
    const uncoveredEducationLevels = educationLevels.filter(
      (level) => !input.events.some((event) => event.educationLevels.includes(level))
    );
    const coveredClasses = new Set(input.events.flatMap((event) => extractClassNumbers(event.classes)));
    const uncoveredClasses = input.expectedClasses.filter((className) => !coveredClasses.has(className));

    emptyDirections.forEach((title) => {
      risks.push({
        id: `empty-direction-${slugify(title)}`,
        severity: "high",
        title: "Пустое направление",
        description: `Направление «${title}» не содержит мероприятий.`,
        reason: "Если направление не имеет мероприятий, оно не попадет в управленческие планы и рабочую программу как реальная практика.",
        recommendation: "Добавить минимум 3 мероприятия или отключить направление, если школа не ведет такую работу."
      });
    });

    weakDirections.forEach((row) => {
      risks.push({
        id: `weak-direction-${row.directionId}`,
        severity: "medium",
        title: "Слабое покрытие направления",
        description: `Направление «${row.directionTitle}» содержит менее 2 мероприятий за год.`,
        reason: "Единичное мероприятие не показывает системную работу по направлению.",
        recommendation: "Добавить еще 2-3 события в разные периоды учебного года.",
        directionId: row.directionId
      });
    });

    emptyColumns.forEach((label) => {
      risks.push({
        id: `empty-column-${slugify(label)}`,
        severity: "high",
        title: "Пустой период или сегмент",
        description: `В колонке «${label}» нет мероприятий.`,
        reason: "Пустые периоды создают провалы в календаре воспитательной работы.",
        recommendation: "Перенести часть событий из перегруженных периодов или добавить мероприятия.",
        columnKey: label
      });
    });

    overloadedColumns.forEach((label) => {
      risks.push({
        id: `overloaded-column-${slugify(label)}`,
        severity: "medium",
        title: "Перегрузка",
        description: `В колонке «${label}» сосредоточено более 30% мероприятий года.`,
        reason: "Перегрузка снижает качество подготовки мероприятий и увеличивает нагрузку на педагогов.",
        recommendation: "Равномернее распределить мероприятия по учебному году.",
        columnKey: label
      });
    });

    if (uncoveredEducationLevels.length > 0) {
      risks.push({
        id: "uncovered-education-levels",
        severity: "high",
        title: "Неохваченные уровни образования",
        description: `Нет мероприятий для уровней: ${uncoveredEducationLevels.map((level) => educationLevelLabels[level]).join(", ")}.`,
        reason: "КПВР и рабочая программа должны показывать воспитательную работу по всем уровням образования.",
        recommendation: "Добавить мероприятия для каждого неохваченного уровня."
      });
    }

    if (uncoveredClasses.length > 0) {
      risks.push({
        id: "uncovered-classes",
        severity: uncoveredClasses.length > 4 ? "medium" : "low",
        title: "Неохваченные классы",
        description: `В мероприятиях не найдены классы: ${uncoveredClasses.join(", ")}.`,
        reason: "Если классы не указаны в событиях, замдиректора не видит реальный охват.",
        recommendation: "Проверить поле «Классы» в карточках мероприятий и добавить недостающие классы."
      });
    }

    recommendations.push(...buildRecommendations(risks, input.rows, overloadedColumns));

    return {
      balance: calculateBalance(input.rows, input.columns, input.events, risks, uncoveredEducationLevels),
      risks: risks.sort(compareRisks),
      recommendations: recommendations.slice(0, 10),
      emptyDirections,
      emptyColumns,
      overloadedColumns,
      uncoveredEducationLevels,
      uncoveredClasses
    };
  }
}

export function createActivityMatrixAnalyzer() {
  return new ActivityMatrixAnalyzer();
}

export function getActivityMatrixRiskLabel(severity: ActivityMatrixRisk["severity"]) {
  if (severity === "high") {
    return "Высокий риск";
  }

  if (severity === "medium") {
    return "Средний риск";
  }

  return "Низкий риск";
}

function buildColumns(input: ActivityMatrixInput): ActivityMatrixColumn[] {
  if (input.mode === "month") {
    return academicMonthOrder.map((month) => ({ key: String(month), label: monthLabels[month] }));
  }

  if (input.mode === "quarter") {
    return [
      { key: "1", label: "I четверть" },
      { key: "2", label: "II четверть" },
      { key: "3", label: "III четверть" },
      { key: "4", label: "IV четверть" }
    ];
  }

  if (input.mode === "educationLevel") {
    return educationLevels.map((level) => ({ key: level, label: educationLevelLabels[level] }));
  }

  if (input.mode === "class") {
    const classNumbers = Array.from(new Set([...standardClassNumbers, ...input.events.flatMap((event) => extractClassNumbers(event.classes))]));

    return classNumbers.sort((a, b) => Number(a) - Number(b)).map((className) => ({ key: className, label: `${className} класс` }));
  }

  if (input.mode === "responsible") {
    return Array.from(new Set(input.events.map((event) => event.responsible).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "ru"))
      .map((responsible) => ({ key: responsible, label: responsible }));
  }

  return input.modules.map((moduleItem) => ({ key: moduleItem.id, label: moduleItem.title }));
}

function buildRow(
  direction: { id: string; title: string },
  events: SchoolEvent[],
  columns: ActivityMatrixColumn[],
  mode: ActivityMatrixMode,
  modules: Array<{ id: string; title: string }>
): ActivityMatrixRow {
  const cells = columns.map((column) => {
    const cellEvents = events.filter((event) => eventMatchesColumn(event, column.key, mode, modules));

    return {
      key: column.key,
      label: column.label,
      count: cellEvents.length,
      events: cellEvents,
      intensity: 0
    };
  });

  return {
    directionId: direction.id,
    directionTitle: direction.title,
    total: events.length,
    cells,
    isEmpty: events.length === 0
  };
}

function eventMatchesColumn(event: SchoolEvent, key: string, mode: ActivityMatrixMode, modules: Array<{ id: string; title: string }>) {
  if (mode === "month") {
    return String(event.month) === key;
  }

  if (mode === "quarter") {
    return String(getQuarter(event.month)) === key;
  }

  if (mode === "educationLevel") {
    return event.educationLevels.includes(key as EducationLevel);
  }

  if (mode === "class") {
    return extractClassNumbers(event.classes).includes(key);
  }

  if (mode === "responsible") {
    return event.responsible === key;
  }

  return modules.some((moduleItem) => moduleItem.id === key) && event.moduleId === key;
}

function calculateBalance(
  rows: ActivityMatrixRow[],
  columns: ActivityMatrixColumn[],
  events: SchoolEvent[],
  risks: ActivityMatrixRisk[],
  uncoveredEducationLevels: EducationLevel[]
): ActivityMatrixBalanceIndex {
  if (events.length === 0) {
    return {
      score: 0,
      status: "critical",
      label: "Критично",
      explanation: "В системе нет мероприятий, поэтому баланс воспитательной работы не рассчитывается."
    };
  }

  const coveredDirections = rows.filter((row) => row.total > 0).length;
  const coveredColumns = columns.filter((column) =>
    rows.some((row) => (row.cells.find((cell) => cell.key === column.key)?.count ?? 0) > 0)
  ).length;
  const directionScore = rows.length > 0 ? (coveredDirections / rows.length) * 40 : 0;
  const columnScore = columns.length > 0 ? (coveredColumns / columns.length) * 35 : 0;
  const levelScore = ((educationLevels.length - uncoveredEducationLevels.length) / educationLevels.length) * 25;
  const riskPenalty = risks.filter((risk) => risk.severity === "high").length * 5 + risks.filter((risk) => risk.severity === "medium").length * 2;
  const score = Math.max(0, Math.min(100, Math.round(directionScore + columnScore + levelScore - riskPenalty)));

  if (score >= 85) {
    return { score, status: "excellent", label: "Отлично", explanation: "Работа распределена равномерно по направлениям, периодам и уровням." };
  }

  if (score >= 70) {
    return { score, status: "good", label: "Хорошо", explanation: "Система в целом сбалансирована, но есть локальные пробелы." };
  }

  if (score >= 45) {
    return { score, status: "needs_attention", label: "Требует внимания", explanation: "Есть заметные пробелы или перегрузки, которые стоит закрыть до утверждения планов." };
  }

  return { score, status: "critical", label: "Критично", explanation: "Матрица показывает существенные пробелы в воспитательной работе." };
}

function buildRecommendations(
  risks: ActivityMatrixRisk[],
  rows: ActivityMatrixRow[],
  overloadedColumns: string[]
): ActivityMatrixRecommendation[] {
  const recommendations: ActivityMatrixRecommendation[] = risks.map((risk) => ({
    id: `recommendation-${risk.id}`,
    text: risk.recommendation,
    priority: risk.severity
  }));
  const weakRows = rows.filter((row) => row.total > 0 && row.total < 3).slice(0, 3);

  weakRows.forEach((row) => {
    recommendations.push({
      id: `recommendation-balance-${row.directionId}`,
      text: `Усилить направление «${row.directionTitle}»: распределить минимум 3 мероприятия по разным месяцам.`,
      priority: "medium"
    });
  });

  overloadedColumns.forEach((column) => {
    recommendations.push({
      id: `recommendation-overload-${slugify(column)}`,
      text: `Разгрузить период «${column}»: перенести часть мероприятий в пустые или слабые периоды.`,
      priority: "medium"
    });
  });

  return dedupeRecommendations(recommendations).sort(compareRecommendations);
}

function getQuarter(month: number) {
  if ([9, 10, 11].includes(month)) {
    return 1;
  }

  if ([12, 1, 2].includes(month)) {
    return 2;
  }

  if ([3, 4, 5].includes(month)) {
    return 3;
  }

  return 4;
}

function extractClassNumbers(value: string) {
  const matches = value.match(/\d{1,2}/g) ?? [];

  return Array.from(new Set(matches.filter((item) => Number(item) >= 1 && Number(item) <= 11)));
}

function dedupeEvents(events: SchoolEvent[]) {
  return Array.from(new Map(events.map((event) => [event.id, event])).values());
}

function dedupeRecommendations(recommendations: ActivityMatrixRecommendation[]) {
  return Array.from(new Map(recommendations.map((recommendation) => [recommendation.text, recommendation])).values());
}

function compareRisks(left: ActivityMatrixRisk, right: ActivityMatrixRisk) {
  return riskWeight(right.severity) - riskWeight(left.severity) || left.title.localeCompare(right.title, "ru");
}

function compareRecommendations(left: ActivityMatrixRecommendation, right: ActivityMatrixRecommendation) {
  return riskWeight(right.priority) - riskWeight(left.priority) || left.text.localeCompare(right.text, "ru");
}

function riskWeight(severity: ActivityMatrixRisk["severity"]) {
  if (severity === "high") {
    return 3;
  }

  if (severity === "medium") {
    return 2;
  }

  return 1;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "");
}
