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

import { buildExtraActivityPlanRows } from "@/lib/domain/extra-activities";
import { educationLevelLabels, educationLevels } from "@/lib/domain/events";
import { buildKpvrDocument, formatKpvrPeriod } from "@/lib/domain/kpvr";
import type { AppState, EducationLevel } from "@/types/domain";

export function getDocxEducationLevels() {
  return educationLevels.map((level) => ({
    level,
    label: educationLevelLabels[level]
  }));
}

export async function buildKpvrDocxBlob(state: AppState, level: EducationLevel) {
  const document = buildKpvrDocument(level, state.events, state.educationModules);
  let rowNumber = 1;

  const tableRows: TableRow[] = [
    createHeaderRow(["№", "Дела, события, мероприятия", "Классы", "Сроки", "Ответственные"])
  ];

  document.groups.forEach((group) => {
    tableRows.push(createGroupRow(`Модуль: ${group.moduleTitle}`, 5));

    group.rows.forEach((row) => {
      tableRows.push(
        createDataRow([
          String(rowNumber),
          row.title,
          row.classes,
          formatKpvrPeriod(row),
          row.responsible
        ])
      );
      rowNumber += 1;
    });
  });

  if (document.groups.length === 0) {
    tableRows.push(createDataRow(["", "Мероприятия не добавлены", "", "", ""]));
  }

  return Packer.toBlob(
    new Document({
      sections: [
        {
          properties: {},
          children: [
            centeredTitle(`Календарный план воспитательной работы на ${state.schoolPassport.academicYear} учебный год`),
            centeredText(`Уровень образования: ${educationLevelLabels[level]}`),
            spacedText("2018–2027 гг. — Десятилетие детства в Российской Федерации"),
            spacedText("2022–2031 гг. — Десятилетие науки и технологий"),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows
            })
          ]
        }
      ]
    })
  );
}

export async function buildExtraActivityDocxBlob(state: AppState, level: EducationLevel) {
  const rows = buildExtraActivityPlanRows(state.extraActivities, level);

  return Packer.toBlob(
    new Document({
      sections: [
        {
          properties: {},
          children: [
            centeredTitle(`План внеурочной деятельности на ${state.schoolPassport.academicYear} учебный год`),
            centeredText(`Уровень образования: ${educationLevelLabels[level]}`),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                createHeaderRow([
                  "№",
                  "Название курса/программы/занятий",
                  "Классы",
                  "Количество часов в неделю",
                  "Педагог"
                ]),
                ...(rows.length > 0
                  ? rows.map((row, index) =>
                      createDataRow([
                        String(index + 1),
                        row.title,
                        row.classes,
                        String(row.weeklyHours),
                        row.teacher
                      ])
                    )
                  : [createDataRow(["", "Активные программы не добавлены", "", "", ""])])
              ]
            })
          ]
        }
      ]
    })
  );
}

export function getKpvrDocxFileName(state: AppState, level: EducationLevel) {
  return `kpvr-${educationLevelLabels[level].toLowerCase()}-${normalizeAcademicYear(state.schoolPassport.academicYear)}.docx`;
}

export function getExtraActivityDocxFileName(state: AppState, level: EducationLevel) {
  return `plan-vneurochnoy-deyatelnosti-${educationLevelLabels[level].toLowerCase()}-${normalizeAcademicYear(state.schoolPassport.academicYear)}.docx`;
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
    children: values.map(
      (value, index) =>
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

function normalizeAcademicYear(value: string) {
  return value.replace(/[^\d]+/g, "-").replace(/^-|-$/g, "");
}
