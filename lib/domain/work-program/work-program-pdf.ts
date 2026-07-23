import type { WorkProgram } from "@/types/work-program";

export function buildWorkProgramPdfDefinition(program: WorkProgram) {
  const content: unknown[] = [
    { text: program.title, style: "title" },
    { text: `Учебный год: ${program.academicYear}`, style: "subtitle" },
    { text: `Готовность: ${program.progress.percent}%`, style: "meta" }
  ];

  program.sections.forEach((section, sectionIndex) => {
    content.push({
      text: `${sectionIndex + 1}. ${section.title}`,
      style: "section",
      pageBreak: sectionIndex === 0 ? undefined : "before"
    });

    section.subsections.forEach((subsection, subsectionIndex) => {
      content.push({
        text: `${sectionIndex + 1}.${subsectionIndex + 1}. ${subsection.title}`,
        style: "subsection"
      });

      if (subsection.generatedContent.length === 0) {
        content.push({ text: "Раздел требует заполнения.", style: "warning" });
      }

      subsection.generatedContent.forEach((paragraph) => {
        content.push({ text: paragraph.text, style: "paragraph" });
        content.push({
          text: `Источник: ${paragraph.sources.map((source) => source.title).join(", ") || "не указан"}`,
          style: "source"
        });
      });
    });
  });

  return {
    pageSize: "A4",
    pageMargins: [56, 60, 56, 64],
    info: {
      title: program.title,
      subject: `Рабочая программа воспитания ${program.academicYear}`,
      creator: "Воспитание.PRO"
    },
    header: {
      text: "Воспитание.PRO",
      alignment: "right",
      margin: [0, 24, 56, 0],
      color: "#64748b",
      fontSize: 8
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: "center",
      margin: [0, 16, 0, 0],
      color: "#64748b",
      fontSize: 8
    }),
    content,
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.35,
      color: "#1e293b"
    },
    styles: {
      title: { fontSize: 20, bold: true, alignment: "center", margin: [0, 80, 0, 18] },
      subtitle: { fontSize: 12, alignment: "center", color: "#475569", margin: [0, 0, 0, 8] },
      meta: { fontSize: 9, alignment: "center", color: "#64748b", margin: [0, 0, 0, 36] },
      section: { fontSize: 16, bold: true, color: "#0f172a", margin: [0, 0, 0, 16] },
      subsection: { fontSize: 12, bold: true, color: "#1e3a5f", margin: [0, 12, 0, 8] },
      paragraph: { fontSize: 10, alignment: "justify", margin: [0, 0, 0, 5] },
      source: { fontSize: 8, italics: true, color: "#64748b", margin: [0, 0, 0, 10] },
      warning: { fontSize: 9, italics: true, color: "#b45309", margin: [0, 0, 0, 10] }
    }
  };
}

export async function buildWorkProgramPdfBlob(program: WorkProgram) {
  const [pdfMakeModule, fontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts")
  ]);
  const pdfMake = pdfMakeModule.default;
  const fonts = fontsModule.default;
  pdfMake.vfs = fonts.pdfMake?.vfs ?? fonts.vfs ?? {};

  return new Promise<Blob>((resolve) => {
    pdfMake.createPdf(buildWorkProgramPdfDefinition(program)).getBlob(resolve);
  });
}

export function getWorkProgramPdfFileName(program: WorkProgram) {
  const safeYear = program.academicYear.replace(/[^\d-]+/g, "-");
  return `rabochaya-programma-vospitaniya-${safeYear || "draft"}.pdf`;
}
