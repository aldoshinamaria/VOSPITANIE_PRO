import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";

import type { ActivityReport, ActivityReportExportOptions, ActivityReportRiskLevel, EventStatus } from "@/types/domain";

const statusLabels: Record<EventStatus, string> = {
  planned: "Планируется",
  completed: "Проведено",
  cancelled: "Отменено"
};

const riskLabels: Record<ActivityReportRiskLevel, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий"
};

export class ActivityReportExporter {
  async toDocx(report: ActivityReport, options: ActivityReportExportOptions): Promise<Blob> {
    const children: Array<Paragraph | Table> = [
      centeredTitle(report.title),
      centeredText(`${report.academicYear} учебный год`),
      spacedText(`Сформировано: ${new Date(report.generatedAt).toLocaleString("ru-RU")}`)
    ];

    if (options.includeKpi) {
      children.push(sectionTitle("KPI"), kpiTable(report));
    }

    if (options.includeInsights) {
      children.push(sectionTitle("Автоматические выводы"));
      report.insights.forEach((insight) => children.push(spacedText(`${insight.title}: ${insight.text}`)));
    }

    if (options.includeRisks) {
      children.push(sectionTitle("Риски"));
      report.risks.forEach((risk) => children.push(spacedText(`${riskLabels[risk.level]} риск. ${risk.title}. ${risk.reason}. Рекомендация: ${risk.recommendation}`)));
    }

    if (options.includeRecommendations) {
      children.push(sectionTitle("Рекомендации"));
      report.recommendations.forEach((recommendation, index) => children.push(spacedText(`${index + 1}. ${recommendation.text}`)));
    }

    if (options.includeEvents) {
      children.push(sectionTitle("Мероприятия"), eventsTable(report));
    }

    return Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
  }
}

export function createActivityReportExporter() {
  return new ActivityReportExporter();
}

export function getActivityReportDocxFileName(report: ActivityReport) {
  return `${normalizeFilePart(report.title)}-${normalizeFilePart(report.academicYear)}.docx`;
}

function centeredTitle(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 220 },
    children: [new TextRun({ text, bold: true, size: 28 })]
  });
}

function centeredText(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
    children: [new TextRun({ text, bold: true, size: 24 })]
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24 })]
  });
}

function spacedText(text: string) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22 })]
  });
}

function kpiTable(report: ActivityReport) {
  const statistics = report.statistics;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createHeaderRow(["Показатель", "Значение"]),
      createDataRow(["Количество мероприятий", String(statistics.totalEvents)]),
      createDataRow(["Проведено", String(statistics.completedEvents)]),
      createDataRow(["Отменено", String(statistics.cancelledEvents)]),
      createDataRow(["Просрочено", String(statistics.overdueEvents)]),
      createDataRow(["Охват классов", `${statistics.classCoveragePercent}%`]),
      createDataRow(["Охват направлений", `${statistics.directionCoveragePercent}%`]),
      createDataRow(["Выполнение плана", `${statistics.planCompletionPercent}%`]),
      createDataRow(["Подтверждено мероприятий", `${statistics.confirmedExecutionPercent}%`]),
      createDataRow(["Просрочка исполнения", `${statistics.overdueExecutionPercent}%`]),
      createDataRow(["Без ответственного", `${statistics.withoutResponsiblePercent}%`]),
      createDataRow(["Охват обучающихся", String(statistics.studentCoverage)])
    ]
  });
}

function eventsTable(report: ActivityReport) {
  const rows: TableRow[] = [createHeaderRow(["№", "Мероприятие", "Дата", "Классы", "Ответственные", "Статус", "Направления"])];
  let index = 1;

  report.sections.forEach((section) => {
    rows.push(createGroupRow(section.title, 7));
    section.rows.forEach((row) => {
      rows.push(
        createDataRow([
          String(index),
          row.title,
          row.date,
          row.classes,
          row.responsible,
          statusLabels[row.status],
          row.directionTitles.join(", ")
        ])
      );
      index += 1;
    });
  });

  if (report.sections.every((section) => section.rows.length === 0)) {
    rows.push(createDataRow(["", "Мероприятия не найдены", "", "", "", "", ""]));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createHeaderRow(values: string[]) {
  return new TableRow({
    tableHeader: true,
    children: values.map((value) =>
      new TableCell({
        shading: { fill: "E2E8F0" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, bold: true })] })],
        margins: cellMargins(),
        borders: cellBorders()
      })
    )
  });
}

function createGroupRow(title: string, columnSpan: number) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan,
        shading: { fill: "F8FAFC" },
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })],
        margins: cellMargins(),
        borders: cellBorders()
      })
    ]
  });
}

function createDataRow(values: string[]) {
  return new TableRow({
    children: values.map((value, index) =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: index === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [new TextRun({ text: value || " " })]
          })
        ],
        margins: cellMargins(),
        borders: cellBorders()
      })
    )
  });
}

function cellMargins() {
  return {
    top: 100,
    bottom: 100,
    left: 100,
    right: 100
  };
}

function cellBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
  };
}

function normalizeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "");
}
