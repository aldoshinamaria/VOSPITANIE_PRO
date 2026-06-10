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

import type { ActivityPlan, ActivityPlanExportOptions, EventStatus } from "@/types/domain";

const statusLabels: Record<EventStatus, string> = {
  planned: "Планируется",
  completed: "Проведено",
  cancelled: "Отменено"
};

export class ActivityPlanExporter {
  async toDocx(plan: ActivityPlan, options: ActivityPlanExportOptions): Promise<Blob> {
    const children: Array<Paragraph | Table> = [
      centeredTitle(plan.title),
      centeredText(`${plan.academicYear} учебный год`),
      spacedText(`Направление: ${plan.directionTitle}`)
    ];

    if (options.includeGoal) {
      children.push(sectionTitle("Цель"), spacedText(plan.goal));
    }

    if (options.includeTasks) {
      children.push(sectionTitle("Задачи"));
      plan.tasks.forEach((task) => children.push(spacedText(`- ${task}`)));
    }

    children.push(sectionTitle("Мероприятия"));

    const tableRows: TableRow[] = [
      createHeaderRow([
        "№",
        "Мероприятие",
        "Дата",
        "Классы",
        "Ответственные",
        ...(options.includeStatus ? ["Статус"] : []),
        ...(options.includeDirection ? ["Направление"] : [])
      ])
    ];
    let rowNumber = 1;

    plan.sections.forEach((section) => {
      tableRows.push(createGroupRow(section.title, options));

      section.rows.forEach((row) => {
        tableRows.push(
          createDataRow([
            String(rowNumber),
            row.title,
            row.date,
            row.classes,
            row.responsible,
            ...(options.includeStatus ? [statusLabels[row.status]] : []),
            ...(options.includeDirection ? [row.directionTitles.join(", ")] : [])
          ])
        );
        rowNumber += 1;
      });
    });

    if (plan.rows.length === 0) {
      tableRows.push(createDataRow(["", "Мероприятия по выбранным условиям не найдены", "", "", "", "", ""]));
    }

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      })
    );

    return Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
  }
}

export function createActivityPlanExporter() {
  return new ActivityPlanExporter();
}

export function getActivityPlanDocxFileName(plan: ActivityPlan) {
  const title = plan.directionTitle === "Все направления" ? "school-plan" : plan.directionTitle;

  return `${normalizeFilePart(title)}-${normalizeFilePart(plan.academicYear)}.docx`;
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

function createGroupRow(title: string, options: ActivityPlanExportOptions) {
  const columnSpan = 5 + Number(options.includeStatus) + Number(options.includeDirection);

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
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}
