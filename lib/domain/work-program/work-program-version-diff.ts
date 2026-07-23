import type {
  GeneratedContent,
  WorkProgramSection,
  WorkProgramVersion
} from "@/types/domain";

export type WorkProgramDiffStatus = "added" | "removed" | "changed" | "unchanged";

export interface WorkProgramParagraphDiff {
  id: string;
  subsectionTitle: string;
  paragraphNumber: number;
  status: WorkProgramDiffStatus;
  previousText?: string;
  currentText?: string;
}

export function buildWorkProgramVersionDiff(
  version: WorkProgramVersion,
  currentSection?: WorkProgramSection
): WorkProgramParagraphDiff[] {
  if (!currentSection || version.sectionId !== currentSection.id) {
    return [];
  }

  const previousParagraphs = flattenVersion(version);
  const currentParagraphs = flattenSection(currentSection);
  const keys = new Set([...previousParagraphs.keys(), ...currentParagraphs.keys()]);

  return Array.from(keys).map((key) => {
    const previous = previousParagraphs.get(key);
    const current = currentParagraphs.get(key);
    const previousText = previous?.paragraph.text;
    const currentText = current?.paragraph.text;

    return {
      id: key,
      subsectionTitle: current?.subsectionTitle ?? previous?.subsectionTitle ?? "Раздел",
      paragraphNumber: current?.paragraphNumber ?? previous?.paragraphNumber ?? 1,
      status: resolveStatus(previousText, currentText),
      previousText,
      currentText
    };
  });
}

function flattenVersion(version: WorkProgramVersion) {
  const result = new Map<string, FlatParagraph>();

  for (const subsection of version.subsections ?? []) {
    subsection.generatedContent.forEach((paragraph, index) => {
      result.set(paragraph.id, {
        subsectionTitle: subsection.title,
        paragraphNumber: index + 1,
        paragraph
      });
    });
  }

  return result;
}

function flattenSection(section: WorkProgramSection) {
  const result = new Map<string, FlatParagraph>();

  for (const subsection of section.subsections) {
    subsection.generatedContent.forEach((paragraph, index) => {
      result.set(paragraph.id, {
        subsectionTitle: subsection.title,
        paragraphNumber: index + 1,
        paragraph
      });
    });
  }

  return result;
}

function resolveStatus(previousText?: string, currentText?: string): WorkProgramDiffStatus {
  if (previousText === undefined) {
    return "added";
  }

  if (currentText === undefined) {
    return "removed";
  }

  return previousText === currentText ? "unchanged" : "changed";
}

interface FlatParagraph {
  subsectionTitle: string;
  paragraphNumber: number;
  paragraph: GeneratedContent;
}
