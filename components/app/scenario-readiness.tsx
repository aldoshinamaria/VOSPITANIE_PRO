import Link from "next/link";
import { CheckCircle2, Circle, FileText, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppState } from "@/types/domain";

interface ScenarioReadinessProps {
  state: AppState;
}

export function ScenarioReadiness({ state }: ScenarioReadinessProps) {
  const activeAssociations = state.educationalSystem.associations.filter((item) => item.status === "active");
  const hasMuseum =
    state.schoolPassport.infrastructure.museum ||
    state.educationalSystem.infrastructureObjects.some((item) => item.type === "museum" || item.type === "museum_room") ||
    state.educationalSystem.associations.some((item) => item.type === "school_museum" && item.status === "active");
  const selectedExtracted = state.extractedEvents.filter((event) => event.status === "selected").length;

  const steps = [
    {
      title: "Паспорт школы",
      description: state.schoolPassport.name || "Заполните основные данные школы",
      done: Boolean(state.schoolPassport.name && state.schoolPassport.academicYear && state.schoolPassport.studentsCount > 0),
      href: "/school-passport"
    },
    {
      title: "Воспитательная система",
      description: `${activeAssociations.length} активных объединений`,
      done: activeAssociations.length > 0,
      href: "/educational-system"
    },
    {
      title: "Музей и инфраструктура",
      description: hasMuseum ? "Музейный ресурс найден" : "Добавьте музей или музейную комнату",
      done: hasMuseum,
      href: "/educational-system"
    },
    {
      title: "Социальные партнеры",
      description: `${state.educationalSystem.partners.length + state.schoolPassport.socialPartners.length} партнеров`,
      done: state.educationalSystem.partners.length + state.schoolPassport.socialPartners.length > 0,
      href: "/educational-system"
    },
    {
      title: "Федеральный план",
      description: `${state.importedDocuments.length} документов загружено`,
      done: state.importedDocuments.length > 0,
      href: "/import-documents"
    },
    {
      title: "Извлечение и импорт",
      description: `${state.extractedEvents.length} найдено, ${selectedExtracted} импортировано`,
      done: selectedExtracted > 0 || state.events.some((event) => event.sourceDocumentId),
      href: "/import-documents"
    },
    {
      title: "КПВР",
      description: `${state.events.length} мероприятий в реестре`,
      done: state.events.length > 0,
      href: "/kpvr"
    }
  ];

  const completed = steps.filter((step) => step.done).length;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-sky-800" />
            Готовность сценария КПВР
          </CardTitle>
          <CardDescription>
            Короткая проверка пути: от данных школы до документа КПВР.
          </CardDescription>
        </div>
        <Badge variant={completed === steps.length ? "success" : "warning"}>
          {completed}/{steps.length}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <Link
              key={step.title}
              href={step.href}
              className="flex items-start gap-3 rounded-md border bg-white px-3 py-3 text-sm transition-colors hover:bg-slate-50"
            >
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span>
                <span className="block font-medium">{step.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{step.description}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/import-documents">
              <FileText className="h-4 w-4" />
              Перейти к импорту
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/kpvr">Открыть КПВР</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
