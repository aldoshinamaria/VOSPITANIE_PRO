import { createId, getMonthFromDate } from "@/lib/utils";
import type { EducationLevel } from "@/types/common";
import type { ExtractedEvent, ImportedDocument } from "@/types/imported-documents";

export interface DocumentEventExtractor {
  extract(document: ImportedDocument): Promise<ExtractedEvent[]>;
}

export class MockDocumentEventExtractor implements DocumentEventExtractor {
  async extract(document: ImportedDocument): Promise<ExtractedEvent[]> {
    const templates = getTemplates(document.title);

    return templates.map((template, index) => {
      const date = template.date;

      return {
        id: createId("extracted-event"),
        title: template.title,
        description: template.description,
        date,
        month: getMonthFromDate(date),
        educationLevel: template.educationLevel,
        module: template.module,
        responsible: template.responsible,
        sourceDocumentId: document.id,
        sourceType: document.type,
        confidence: Math.max(0.72, 0.94 - index * 0.07),
        status: "found"
      };
    });
  }
}

export function createDocumentEventExtractor(): DocumentEventExtractor {
  return new MockDocumentEventExtractor();
}

interface ExtractedEventTemplate {
  title: string;
  description: string;
  date: string;
  educationLevel: EducationLevel;
  module: string;
  responsible: string;
}

function getTemplates(documentTitle: string): ExtractedEventTemplate[] {
  const normalizedTitle = documentTitle.toLowerCase();

  if (normalizedTitle.includes("конкурс") || normalizedTitle.includes("олимпиад")) {
    return [
      {
        title: "Школьный этап конкурса",
        description: "Мероприятие извлечено mock-анализатором из импортированного документа.",
        date: "2026-02-12",
        educationLevel: "ooo",
        module: "Основные школьные дела",
        responsible: "Заместитель директора по ВР"
      },
      {
        title: "Подведение итогов конкурса",
        description: "Событие требует проверки пользователем перед импортом в реестр.",
        date: "2026-02-20",
        educationLevel: "soo",
        module: "Профориентация",
        responsible: "Советник директора"
      }
    ];
  }

  if (normalizedTitle.includes("внеур") || normalizedTitle.includes("план")) {
    return [
      {
        title: "Презентация программ внеурочной деятельности",
        description: "Найдено по структуре календарного плана.",
        date: "2026-09-10",
        educationLevel: "noo",
        module: "Внеурочная деятельность",
        responsible: "Классные руководители"
      },
      {
        title: "Неделя проектной деятельности",
        description: "Mock-анализатор определил событие как потенциальное мероприятие КПВР.",
        date: "2026-10-14",
        educationLevel: "ooo",
        module: "Внеурочная деятельность",
        responsible: "Руководители курсов"
      }
    ];
  }

  return [
    {
      title: "Георгиевская ленточка",
      description: "Патриотическая акция, найденная mock-анализатором.",
      date: "2026-05-06",
      educationLevel: "ooo",
      module: "Основные школьные дела",
      responsible: "Волонтерский отряд"
    },
    {
      title: "Урок мужества",
      description: "Событие требует ручной проверки перед импортом.",
      date: "2026-05-08",
      educationLevel: "soo",
      module: "Классное руководство",
      responsible: "Классные руководители"
    },
    {
      title: "Экскурсия в школьный музей",
      description: "Mock-событие на основе демонстрационного сценария обработки документа.",
      date: "2026-05-12",
      educationLevel: "noo",
      module: "Школьный музей",
      responsible: "Руководитель музея"
    }
  ];
}
