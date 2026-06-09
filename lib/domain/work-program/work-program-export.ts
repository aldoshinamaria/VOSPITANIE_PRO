import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import type { SchoolCultureSection, WorkProgram, WorkProgramSection, WorkProgramSubsection } from "@/types/domain";

export async function buildWorkProgramDocxBlob(program: WorkProgram) {
  const children: Paragraph[] = [
    centeredTitle(`${program.title} на ${program.academicYear} учебный год`),
    centeredText(`Готовность документа: ${program.progress.percent}%`),
    new Paragraph({ text: "" })
  ];

  program.sections.forEach((section) => {
    children.push(sectionHeading(section.title));

    section.subsections.forEach((subsection) => {
      children.push(subsectionHeading(subsection.title));
      subsection.generatedContent
        .filter((content) => content.status !== "removed")
        .forEach((content) => {
          children.push(bodyParagraph(content.text));
          children.push(sourceParagraph(content.sources.map((source) => source.title).join(", ")));
        });
    });
  });

  return Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
}

export function getWorkProgramDocxFileName(program: WorkProgram) {
  return `rabochaya-programma-vospitaniya-${program.academicYear.replace(/[^\d]+/g, "-")}.docx`;
}

export function buildWorkProgramPrintHtml(program: WorkProgram) {
  const body = program.sections.map((section) => sectionToHtml(section)).join("");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(program.title)}</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 32px; color: #111827; }
    h1 { text-align: center; font-size: 20px; }
    h2 { margin-top: 28px; font-size: 17px; }
    h3 { margin-top: 18px; font-size: 15px; }
    p { font-size: 14px; line-height: 1.5; text-align: justify; }
    .source { color: #64748b; font-size: 11px; margin-top: -6px; text-align: left; }
  </style>
</head>
<body>
  <h1>${escapeHtml(program.title)}<br/>${escapeHtml(program.academicYear)} учебный год</h1>
  ${body}
</body>
</html>`;
}

export async function buildSchoolCultureDocxBlob(program: WorkProgram) {
  return buildWorkProgramDocxBlob({
    ...program,
    sections: [
      {
        id: "school-culture",
        title: "Уклад школы",
        status: "generated",
        progress: program.progress,
        subsections: schoolCultureToExportSubsections(program.schoolCulture),
        sources: [],
        versions: []
      }
    ]
  });
}

export function getSchoolCultureDocxFileName(program: WorkProgram) {
  return `uklad-shkoly-${program.academicYear.replace(/[^\d]+/g, "-")}.docx`;
}

export function buildSchoolCulturePrintHtml(section: SchoolCultureSection, title: string, academicYear: string) {
  return buildWorkProgramPrintHtml({
    id: "school-culture-export",
    title,
    academicYear,
    sections: [
      {
        id: "school-culture",
        title: section.title,
        status: "generated",
        progress: { percent: 100, status: "ready", missingData: [], reviewNotes: [] },
        subsections: schoolCultureToExportSubsections(section),
        sources: [],
        versions: []
      }
    ],
    schoolCulture: section,
    progress: { percent: 100, status: "ready", missingData: [], reviewNotes: [] },
    versions: [],
    sectionVersions: {},
    updatedAt: new Date().toISOString()
  });
}

function sectionToHtml(section: WorkProgramSection) {
  return `
    <h2>${escapeHtml(section.title)}</h2>
    ${section.subsections.map((subsection) => subsectionToHtml(subsection)).join("")}
  `;
}

function subsectionToHtml(subsection: WorkProgramSubsection) {
  return `
    <h3>${escapeHtml(subsection.title)}</h3>
    ${subsection.generatedContent
      .filter((content) => content.status !== "removed")
      .map(
        (content) => `
          <p>${escapeHtml(content.text)}</p>
          <p class="source">Источник: ${escapeHtml(content.sources.map((source) => source.title).join(", "))}</p>
        `
      )
      .join("")}
  `;
}

function schoolCultureToExportSubsections(section: SchoolCultureSection): WorkProgramSubsection[] {
  return section.subsections.map((subsection) => ({
    id: subsection.id,
    title: subsection.title,
    generatedContent: subsection.paragraphs.map((paragraph) => ({
      ...paragraph,
      readiness: paragraph.sources.some((source) => source.type === "template") ? "needs_review" : "ready"
    })),
    progress: { percent: 100, status: "ready", missingData: [], reviewNotes: [] },
    sources: subsection.paragraphs.flatMap((paragraph) => paragraph.sources)
  }));
}

function centeredTitle(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 180 },
    children: [new TextRun({ text, bold: true, size: 28 })]
  });
}

function centeredText(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [new TextRun({ text, bold: true, size: 24 })]
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 140 },
    children: [new TextRun({ text, bold: true, size: 28 })]
  });
}

function subsectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24 })]
  });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 24 })]
  });
}

function sourceParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: `Источник: ${text || "не указан"}`, italics: true, color: "64748B", size: 18 })]
  });
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
