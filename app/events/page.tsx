"use client";

import { Award, CalendarX, CheckCircle2, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { EmptyState } from "@/components/app/empty-state";
import { FieldHint, NextStepHint, ReadinessIndicator, SectionGuide } from "@/components/app/field-guide";
import { FieldError, FieldLabel, FormField, TextareaField } from "@/components/app/form-field";
import { PageHeader } from "@/components/app/page-header";
import { EventStatusBadge, PriorityBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildDirectionStatistics,
  createCustomActivityDirection,
  getDirectionsForEvent,
  inferDirectionIdsFromText,
  replaceEventDirectionRelations
} from "@/lib/domain/activity-directions";
import {
  findAssociationById,
  findInfrastructureObjectById
} from "@/lib/domain/educational-system";
import {
  educationLevelLabels,
  getEventPlanLabels,
  getKpvrPlanLabels,
  inferEducationLevelsFromClasses
} from "@/lib/domain/events";
import { DEFAULT_MODULE_ID, findModuleById } from "@/lib/domain/modules";
import { createId, formatRuDate, getMonthFromDate, monthLabels } from "@/lib/utils";
import type { EducationLevel, EventStatus, Priority, SchoolEvent } from "@/types/domain";

interface EventForm {
  title: string;
  description: string;
  moduleId: string;
  direction: string;
  directionIds: string[];
  educationLevels: EducationLevel[];
  classes: string;
  startDate: string;
  endDate: string;
  venue: string;
  responsible: string;
  coExecutors: string;
  partner: string;
  associationId: string;
  infrastructureObjectId: string;
  systemPartnerId: string;
  status: EventStatus;
  participantsCount: string;
  shortReport: string;
  priority: Priority;
}

type EventErrors = Partial<Record<keyof EventForm, string>>;
type StatusFilter = "all" | EventStatus;
type LevelFilter = "all" | EducationLevel;
type DirectionFilter = "all" | string;
type CompetitionLevel = "school" | "municipal" | "regional" | "federal";

interface CompetitionForm {
  title: string;
  competitionLevel: CompetitionLevel;
  classes: string;
  startDate: string;
  endDate: string;
  responsible: string;
  direction: string;
  organizer: string;
  venue: string;
  note: string;
}

type CompetitionErrors = Partial<Record<keyof CompetitionForm, string>>;

interface CompetitionConfirmation {
  event: SchoolEvent;
  message: string;
}

const competitionLevelLabels: Record<CompetitionLevel, string> = {
  school: "Школьный",
  municipal: "Муниципальный",
  regional: "Региональный",
  federal: "Всероссийский"
};

const EVENT_STATUS_LABEL = "\u0421\u0442\u0430\u0442\u0443\u0441";

const emptyForm: EventForm = {
  title: "",
  description: "",
  moduleId: DEFAULT_MODULE_ID,
  direction: "",
  directionIds: [],
  educationLevels: ["ooo"],
  classes: "",
  startDate: "",
  endDate: "",
  venue: "",
  responsible: "",
  coExecutors: "",
  partner: "",
  associationId: "",
  infrastructureObjectId: "",
  systemPartnerId: "",
  status: "planned",
  participantsCount: "0",
  shortReport: "",
  priority: "medium"
};

const emptyCompetitionForm: CompetitionForm = {
  title: "",
  competitionLevel: "school",
  classes: "",
  startDate: "",
  endDate: "",
  responsible: "",
  direction: "",
  organizer: "",
  venue: "",
  note: ""
};

export default function EventsPage() {
  const { state, updateState, isSaving } = useAppState();
  const [form, setForm] = React.useState<EventForm>(emptyForm);
  const [errors, setErrors] = React.useState<EventErrors>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = React.useState("all");
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [monthFilter, setMonthFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [directionFilter, setDirectionFilter] = React.useState<DirectionFilter>("all");
  const [newDirectionTitle, setNewDirectionTitle] = React.useState("");
  const [competitionOpen, setCompetitionOpen] = React.useState(false);
  const [competitionForm, setCompetitionForm] = React.useState<CompetitionForm>(emptyCompetitionForm);
  const [competitionErrors, setCompetitionErrors] = React.useState<CompetitionErrors>({});
  const [competitionConfirmation, setCompetitionConfirmation] = React.useState<CompetitionConfirmation | null>(null);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.info("[events] events page diagnostics", {
      stateEventsCount: state.events.length
    });
  }, [state.events.length]);

  const activeModules = state.educationModules.filter((educationModule) => educationModule.active);
  const activeDirections = state.activityDirections.filter((direction) => direction.active);
  const directionStatistics = buildDirectionStatistics(state.activityDirections, state.eventDirectionRelations, state.events);
  const educationalSystem = state.educationalSystem;
  const schoolPartners = state.schoolPassport.socialPartners;
  const derivedMonth = form.startDate ? getMonthFromDate(form.startDate) : null;
  const eventReadinessChecks = [
    Boolean(form.title.trim()),
    Boolean(form.moduleId),
    form.directionIds.length > 0,
    Boolean(form.description.trim()),
    form.educationLevels.length > 0,
    Boolean(form.classes.trim()),
    Boolean(form.startDate),
    Boolean(form.responsible.trim()),
    Number(form.participantsCount) >= 0
  ];
  const eventReadinessCompleted = eventReadinessChecks.filter(Boolean).length;
  const filteredEvents = state.events.filter((event) => {
    const matchesModule = moduleFilter === "all" || event.moduleId === moduleFilter;
    const matchesLevel = levelFilter === "all" || event.educationLevels.includes(levelFilter);
    const matchesMonth = monthFilter === "all" || event.month === Number(monthFilter);
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesDirection =
      directionFilter === "all" ||
      state.eventDirectionRelations.some((relation) => relation.eventId === event.id && relation.directionId === directionFilter);

    return matchesModule && matchesLevel && matchesMonth && matchesStatus && matchesDirection;
  });

  function setField<TField extends keyof EventForm>(field: TField, value: EventForm[TField]) {
    setSavedMessage(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setCompetitionField<TField extends keyof CompetitionForm>(
    field: TField,
    value: CompetitionForm[TField]
  ) {
    setCompetitionConfirmation(null);
    setCompetitionForm((current) => ({ ...current, [field]: value }));
  }

  function toggleEducationLevel(level: EducationLevel) {
    setForm((current) => {
      const exists = current.educationLevels.includes(level);
      const nextLevels = exists
        ? current.educationLevels.filter((item) => item !== level)
        : [...current.educationLevels, level];

      return {
        ...current,
        educationLevels: nextLevels
      };
    });
  }

  function toggleActivityDirection(directionId: string) {
    setForm((current) => {
      const exists = current.directionIds.includes(directionId);

      return {
        ...current,
        directionIds: exists
          ? current.directionIds.filter((item) => item !== directionId)
          : [...current.directionIds, directionId]
      };
    });
  }

  async function addCustomDirection() {
    const title = newDirectionTitle.trim();

    if (!title) {
      return;
    }

    const existing = state.activityDirections.find((direction) => direction.title.toLowerCase() === title.toLowerCase());

    if (existing) {
      setForm((current) => ({
        ...current,
        directionIds: current.directionIds.includes(existing.id) ? current.directionIds : [...current.directionIds, existing.id]
      }));
      setNewDirectionTitle("");
      return;
    }

    const direction = createCustomActivityDirection(title);

    await updateState((current) => ({
      ...current,
      activityDirections: [...current.activityDirections, direction]
    }));
    setForm((current) => ({
      ...current,
      directionIds: [...current.directionIds, direction.id]
    }));
    setNewDirectionTitle("");
  }

  async function saveEvent() {
    const nextErrors = validateEvent(form, activeModules.length > 0);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const selectedDirections = activeDirections.filter((direction) => form.directionIds.includes(direction.id));
    const eventPayload: SchoolEvent = {
      id: editingId ?? createId("event"),
      title: form.title.trim(),
      description: form.description.trim(),
      moduleId: form.moduleId,
      direction: form.direction.trim() || selectedDirections.map((direction) => direction.title).join(", "),
      educationLevels: form.educationLevels,
      classes: form.classes.trim(),
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      month: getMonthFromDate(form.startDate),
      venue: form.venue.trim(),
      responsible: form.responsible.trim(),
      coExecutors: form.coExecutors.trim(),
      partner: form.partner.trim(),
      associationId: form.associationId,
      infrastructureObjectId: form.infrastructureObjectId,
      systemPartnerId: form.systemPartnerId,
      status: form.status,
      participantsCount: Number(form.participantsCount) || 0,
      shortReport: form.shortReport.trim(),
      priority: form.priority
    };

    try {
      await updateState((current) => ({
        ...current,
        events: editingId
          ? current.events.map((event) => (event.id === editingId ? eventPayload : event))
          : [...current.events, eventPayload],
        eventDirectionRelations: replaceEventDirectionRelations(
          current.eventDirectionRelations,
          eventPayload.id,
          form.directionIds
        )
      }));
    } catch {
      setSavedMessage(null);
      return;
    }

    setSavedMessage(editingId ? "Изменения мероприятия сохранены." : "Мероприятие добавлено в реестр и КПВР по выбранным уровням.");
    resetForm();
  }

  function editEvent(event: SchoolEvent) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      moduleId: event.moduleId,
      direction: event.direction,
      directionIds: state.eventDirectionRelations
        .filter((relation) => relation.eventId === event.id)
        .map((relation) => relation.directionId),
      educationLevels: event.educationLevels,
      classes: event.classes,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue,
      responsible: event.responsible,
      coExecutors: event.coExecutors,
      partner: event.partner,
      associationId: event.associationId ?? "",
      infrastructureObjectId: event.infrastructureObjectId ?? "",
      systemPartnerId: event.systemPartnerId ?? "",
      status: event.status,
      participantsCount: String(event.participantsCount),
      shortReport: event.shortReport,
      priority: event.priority
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEvent(event: SchoolEvent) {
    const confirmed = window.confirm(`Удалить мероприятие «${event.title}»?`);

    if (!confirmed) {
      return;
    }

    try {
      await updateState((current) => ({
        ...current,
        events: current.events.filter((item) => item.id !== event.id),
        eventDirectionRelations: current.eventDirectionRelations.filter((relation) => relation.eventId !== event.id)
      }));
    } catch {
      return;
    }

    if (editingId === event.id) {
      resetForm();
    }
  }

  function resetForm() {
    setForm({ ...emptyForm, moduleId: activeModules[0]?.id ?? DEFAULT_MODULE_ID });
    setErrors({});
    setEditingId(null);
  }

  function resetFilters() {
    setModuleFilter("all");
    setLevelFilter("all");
    setMonthFilter("all");
    setStatusFilter("all");
    setDirectionFilter("all");
  }

  function prepareCompetition() {
    const nextErrors = validateCompetition(competitionForm);
    setCompetitionErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setCompetitionConfirmation(null);
      return;
    }

    const educationLevels = inferEducationLevelsFromClasses(competitionForm.classes);
    const month = getMonthFromDate(competitionForm.startDate);
    const eventPayload: SchoolEvent = {
      id: createId("event"),
      title: competitionForm.title.trim(),
      description: `${competitionLevelLabels[competitionForm.competitionLevel]} конкурс. ${competitionForm.note.trim()}`.trim(),
      moduleId: DEFAULT_MODULE_ID,
      direction: competitionForm.direction.trim(),
      educationLevels,
      classes: competitionForm.classes.trim(),
      startDate: competitionForm.startDate,
      endDate: competitionForm.endDate || competitionForm.startDate,
      month,
      venue: competitionForm.venue.trim(),
      responsible: competitionForm.responsible.trim(),
      coExecutors: "",
      partner: competitionForm.organizer.trim(),
      associationId: "",
      infrastructureObjectId: "",
      systemPartnerId: "",
      status: "planned",
      participantsCount: 0,
      shortReport: competitionForm.note.trim(),
      priority: "medium"
    };

    setCompetitionConfirmation({
      event: eventPayload,
      message: `Конкурс будет добавлен в ${getKpvrPlanLabels(educationLevels).join(", ")}, модуль “Основные школьные дела”, месяц ${monthLabels[month].toLowerCase()}.`
    });
  }

  async function saveCompetition() {
    if (!competitionConfirmation) {
      return;
    }

    const inferredDirectionIds = inferDirectionIdsFromText(
      [
        competitionConfirmation.event.title,
        competitionConfirmation.event.description,
        competitionConfirmation.event.direction,
        competitionConfirmation.event.partner
      ].join(" "),
      activeDirections
    );
    const fallbackDirectionIds = activeDirections[0]?.id ? [activeDirections[0].id] : [];

    try {
      await updateState((current) => ({
        ...current,
        events: [...current.events, competitionConfirmation.event],
        eventDirectionRelations: replaceEventDirectionRelations(
          current.eventDirectionRelations,
          competitionConfirmation.event.id,
          inferredDirectionIds.length > 0 ? inferredDirectionIds : fallbackDirectionIds
        )
      }));
    } catch {
      setSavedMessage(null);
      return;
    }

    setCompetitionForm(emptyCompetitionForm);
    setCompetitionErrors({});
    setCompetitionConfirmation(null);
    setSavedMessage("Конкурс добавлен как мероприятие и попадет в нужные планы КПВР.");
    setCompetitionOpen(false);
  }

  React.useEffect(() => {
    if (!activeModules.some((educationModule) => educationModule.id === form.moduleId)) {
      setForm((current) => ({ ...current, moduleId: activeModules[0]?.id ?? DEFAULT_MODULE_ID }));
    }
  }, [activeModules, form.moduleId]);

  return (
    <>
      <PageHeader
        title="Мероприятия"
        description="Реестр воспитательных событий с привязкой к модулям, уровням образования и планам НОО, ООО, СОО."
        actions={
          <Button onClick={() => setCompetitionOpen((current) => !current)} disabled={isSaving}>
            <Award className="h-4 w-4" />
            Добавить конкурс
          </Button>
        }
      />

      <div className="grid gap-6">
        <SectionGuide
          id="events"
          title="Как заполнять мероприятия"
          purpose="Мероприятие вносится один раз, а затем автоматически используется в КПВР, планах деятельности, отчетах и проверке соответствия."
          fill={[
            "Укажите название, модуль, направления, уровни образования, классы, дату и ответственного.",
            "Свяжите мероприятие с объединением, инфраструктурой или партнером, если оно проводится на их базе или с их участием.",
            "После проведения заполните участников и краткий отчет, чтобы событие попало в отчетность."
          ]}
          documents={["КПВР", "Планы деятельности", "Отчеты", "Проверка соответствия", "Рабочая программа"]}
        />

        {savedMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {savedMessage}
          </div>
        ) : null}

        {competitionOpen ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Быстрое добавление конкурса</CardTitle>
                  <CardDescription>
                    Система создаст мероприятие в модуле «Основные школьные дела» и определит КПВР по классам.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setCompetitionOpen(false)}>
                  <X className="h-4 w-4" />
                  Закрыть
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid items-stretch gap-4 xl:grid-cols-3">
              <FormField
                label="Название конкурса"
                value={competitionForm.title}
                error={competitionErrors.title}
                required
                onChange={(event) => setCompetitionField("title", event.target.value)}
              />
              <label className="grid h-full content-start gap-2 text-sm font-medium">
                <FieldLabel label="Уровень конкурса" required />
                <Select
                  value={competitionForm.competitionLevel}
                  onChange={(event) => setCompetitionField("competitionLevel", event.target.value as CompetitionLevel)}
                >
                  <option value="school">Школьный</option>
                  <option value="municipal">Муниципальный</option>
                  <option value="regional">Региональный</option>
                  <option value="federal">Всероссийский</option>
                </Select>
              </label>
              <FormField
                label="Классы"
                value={competitionForm.classes}
                error={competitionErrors.classes}
                required
                placeholder="например: 5-7 или 3, 6, 10"
                onChange={(event) => setCompetitionField("classes", event.target.value)}
              />
              <FormField
                label="Дата начала"
                type="date"
                value={competitionForm.startDate}
                error={competitionErrors.startDate}
                required
                onChange={(event) => setCompetitionField("startDate", event.target.value)}
              />
              <FormField
                label="Дата окончания"
                type="date"
                value={competitionForm.endDate}
                error={competitionErrors.endDate}
                onChange={(event) => setCompetitionField("endDate", event.target.value)}
              />
              <FormField
                label="Место проведения"
                value={competitionForm.venue}
                onChange={(event) => setCompetitionField("venue", event.target.value)}
              />
              <FormField
                label="Ответственный"
                value={competitionForm.responsible}
                error={competitionErrors.responsible}
                required
                onChange={(event) => setCompetitionField("responsible", event.target.value)}
              />
              <FormField
                label="Направление"
                value={competitionForm.direction}
                error={competitionErrors.direction}
                required
                onChange={(event) => setCompetitionField("direction", event.target.value)}
              />
              <FormField
                label="Партнер/организатор"
                value={competitionForm.organizer}
                error={competitionErrors.organizer}
                required
                onChange={(event) => setCompetitionField("organizer", event.target.value)}
              />
              <TextareaField
                className="xl:col-span-3"
                label="Примечание"
                value={competitionForm.note}
                onChange={(event) => setCompetitionField("note", event.target.value)}
              />

              {competitionConfirmation ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 xl:col-span-3">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-semibold">Подтверждение добавления</div>
                      <div className="mt-1">{competitionConfirmation.message}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 xl:col-span-3">
                <Button variant="outline" onClick={prepareCompetition}>
                  <CheckCircle2 className="h-4 w-4" />
                  Проверить добавление
                </Button>
                <Button onClick={saveCompetition} disabled={!competitionConfirmation || isSaving}>
                  <Save className="h-4 w-4" />
                  Сохранить конкурс
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{editingId ? "Редактировать мероприятие" : "Добавить мероприятие"}</CardTitle>
                <CardDescription>
                  Месяц определяется автоматически по дате начала. Если выбрать несколько уровней, событие попадет в несколько планов.
                </CardDescription>
              </div>
              {editingId ? (
                <Button variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4" />
                  Отменить
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <div className="px-6 pb-2">
            <ReadinessIndicator
              title="Готовность карточки мероприятия"
              completed={eventReadinessCompleted}
              total={eventReadinessChecks.length}
              note="Чем полнее карточка, тем точнее КПВР, планы и отчеты."
            />
          </div>
          <CardContent className="grid items-stretch gap-4 xl:grid-cols-3">
            <FormField
              label="Название мероприятия"
              value={form.title}
              error={errors.title}
              required
              placeholder="Например: День знаний"
              onChange={(event) => setField("title", event.target.value)}
              help={<FieldHint documents={["КПВР", "Отчеты"]}>Пишите название так, как оно должно выглядеть в документах.</FieldHint>}
            />
            <label className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Модуль воспитания" required />
              <Select value={form.moduleId} onChange={(event) => setField("moduleId", event.target.value)}>
                {activeModules.map((educationModule) => (
                  <option key={educationModule.id} value={educationModule.id}>
                    {educationModule.title}
                  </option>
                ))}
              </Select>
              <FieldHint documents={["КПВР", "Рабочая программа"]}>Модуль определяет, в каком блоке КПВР и рабочей программы появится мероприятие.</FieldHint>
              <FieldError error={errors.moduleId} />
            </label>
            <FormField
              label="Направление воспитания"
              value={form.direction}
              error={errors.direction}
              required
              placeholder="Например: патриотическое воспитание"
              onChange={(event) => setField("direction", event.target.value)}
              help={<FieldHint>Это короткое содержательное направление для поиска и документов.</FieldHint>}
            />
            <div className="grid h-full content-start gap-2 text-sm font-medium xl:col-span-3">
              <FieldLabel label="Направления деятельности" required />
              <div className="flex flex-wrap gap-2">
                {activeDirections.map((direction) => (
                  <label key={direction.id} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.directionIds.includes(direction.id)}
                      onChange={() => toggleActivityDirection(direction.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-sky-800"
                    />
                    {direction.title}
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newDirectionTitle}
                  placeholder="Добавить свое направление"
                  onChange={(event) => setNewDirectionTitle(event.target.value)}
                />
                <Button type="button" variant="outline" onClick={addCustomDirection}>
                  <Plus className="h-4 w-4" />
                  Добавить направление
                </Button>
              </div>
              <FieldError error={errors.directionIds} />
              <FieldHint documents={["Планы деятельности", "Матрица", "Отчеты"]}>
                Одно мероприятие может относиться к нескольким направлениям. Например, «Внимание, дети!» может быть ДДТТ, профилактикой и работой с родителями.
              </FieldHint>
            </div>
            <TextareaField
              className="xl:col-span-3"
              label="Описание"
              value={form.description}
              error={errors.description}
              required
              placeholder="Например: торжественная линейка, классные часы, встреча обучающихся и родителей"
              onChange={(event) => setField("description", event.target.value)}
              help={<FieldHint>Кратко опишите содержание: формат, цель, участники, итог. Достаточно 1-3 предложений.</FieldHint>}
            />
            <div className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Уровень образования" required />
              <div className="flex flex-wrap gap-2">
                {(Object.keys(educationLevelLabels) as EducationLevel[]).map((level) => (
                  <label key={level} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.educationLevels.includes(level)}
                      onChange={() => toggleEducationLevel(level)}
                      className="h-4 w-4 rounded border-slate-300 accent-sky-800"
                    />
                    {educationLevelLabels[level]}
                  </label>
                ))}
              </div>
              <FieldError error={errors.educationLevels} />
              <FieldHint documents={["КПВР НОО", "КПВР ООО", "КПВР СОО"]}>
                Если выбрать несколько уровней, мероприятие попадет в несколько календарных планов.
              </FieldHint>
            </div>
            <FormField
              label="Классы"
              value={form.classes}
              error={errors.classes}
              required
              placeholder="например: 5-7, 9А"
              onChange={(event) => setField("classes", event.target.value)}
              help={<FieldHint examples={["1-4", "5-9", "10-11"]}>Классы нужны для КПВР, планов и анализа охвата.</FieldHint>}
            />
            <FormField
              label="Дата начала"
              type="date"
              value={form.startDate}
              error={errors.startDate}
              required
              onChange={(event) => setField("startDate", event.target.value)}
              help={<FieldHint documents={["КПВР", "Планы"]}>По дате начала система автоматически определит месяц.</FieldHint>}
            />
            <FormField
              label="Дата окончания"
              type="date"
              value={form.endDate}
              error={errors.endDate}
              onChange={(event) => setField("endDate", event.target.value)}
            />
            <FormField
              label="Место проведения"
              value={form.venue}
              onChange={(event) => setField("venue", event.target.value)}
            />
            <div className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Месяц" />
              <div className="flex h-10 items-center rounded-md border bg-slate-50 px-3 text-sm">
                {derivedMonth ? monthLabels[derivedMonth] : "Будет определен по дате начала"}
              </div>
            </div>
            <FormField
              label="Ответственный"
              value={form.responsible}
              error={errors.responsible}
              required
              placeholder="Например: заместитель директора по воспитательной работе"
              onChange={(event) => setField("responsible", event.target.value)}
              help={<FieldHint documents={["КПВР", "Контроль исполнения"]}>Ответственный будет отображаться в планах и панели контроля исполнения.</FieldHint>}
            />
            <FormField
              label="Соисполнители"
              value={form.coExecutors}
              onChange={(event) => setField("coExecutors", event.target.value)}
            />
            <FormField
              label="Партнер"
              value={form.partner}
              placeholder="организация или партнер"
              onChange={(event) => setField("partner", event.target.value)}
            />
            <label className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Связь с объединением" />
              <Select value={form.associationId} onChange={(event) => setField("associationId", event.target.value)}>
                <option value="">Не связано с объединением</option>
                {educationalSystem.associations.map((association) => (
                  <option key={association.id} value={association.id}>
                    {association.title}
                  </option>
                ))}
              </Select>
              <FieldHint>Связь покажет, какое объединение участвует в мероприятии.</FieldHint>
            </label>
            <label className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Связь с инфраструктурой" />
              <Select
                value={form.infrastructureObjectId}
                onChange={(event) => setField("infrastructureObjectId", event.target.value)}
              >
                <option value="">Не связано с инфраструктурой</option>
                {educationalSystem.infrastructureObjects.map((object) => (
                  <option key={object.id} value={object.id}>
                    {object.title}
                  </option>
                ))}
              </Select>
              <FieldHint>Связь поможет понять, где и на базе чего проводится мероприятие.</FieldHint>
            </label>
            <label className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Связь с социальным партнером школы" />
              <Select value={form.systemPartnerId} onChange={(event) => setField("systemPartnerId", event.target.value)}>
                <option value="">Не связано с партнером</option>
                {schoolPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </Select>
              <FieldHint>Список берется из паспорта школы. Связанный партнер будет использоваться в рабочей программе и проверке соответствия.</FieldHint>
            </label>
            <label className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label={EVENT_STATUS_LABEL} />
              <Select value={form.status} onChange={(event) => setField("status", event.target.value as EventStatus)}>
                <option value="planned">Планируется</option>
                <option value="completed">Проведено</option>
                <option value="cancelled">Отменено</option>
              </Select>
            </label>
            <FormField
              label="Количество участников"
              type="number"
              min={0}
              value={form.participantsCount}
              error={errors.participantsCount}
              required
              onChange={(event) => setField("participantsCount", event.target.value)}
              help={<FieldHint documents={["Отчеты", "Матрица"]}>После проведения укажите фактический охват. Это влияет на отчетность.</FieldHint>}
            />
            <label className="grid h-full content-start gap-2 text-sm font-medium">
              <FieldLabel label="Приоритет" />
              <Select value={form.priority} onChange={(event) => setField("priority", event.target.value as Priority)}>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </Select>
            </label>
            <TextareaField
              className="xl:col-span-3"
              label="Краткий отчет"
              value={form.shortReport}
              onChange={(event) => setField("shortReport", event.target.value)}
              help={<FieldHint documents={["Отчеты"]}>Заполняйте после проведения: что сделали, сколько участников, какой результат.</FieldHint>}
            />
            <div className="flex flex-wrap gap-2 xl:col-span-3">
              <Button onClick={saveEvent} disabled={isSaving}>
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Сохранить изменения" : "Добавить мероприятие"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <RotateCcw className="h-4 w-4" />
                Очистить форму
              </Button>
            </div>
          </CardContent>
        </Card>

        {state.events.length > 0 ? (
          <NextStepHint
            title="Следующий шаг: сформировать КПВР"
            description="После добавления мероприятий перейдите в КПВР: система разложит события по уровням образования и датам."
            href="/kpvr"
          />
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>Реестр мероприятий</CardTitle>
                <CardDescription>
                  Показано {filteredEvents.length} из {state.events.length}. События с уровнем ООО автоматически входят в план ООО.
                </CardDescription>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_180px_140px_150px_170px_auto]">
                <Select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
                  <option value="all">Все модули</option>
                  {state.educationModules.map((educationModule) => (
                    <option key={educationModule.id} value={educationModule.id}>
                      {educationModule.title}
                    </option>
                  ))}
                </Select>
                <Select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)}>
                  <option value="all">Все направления</option>
                  {activeDirections.map((direction) => (
                    <option key={direction.id} value={direction.id}>
                      {direction.title}
                    </option>
                  ))}
                </Select>
                <Select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}>
                  <option value="all">Все уровни</option>
                  <option value="noo">НОО</option>
                  <option value="ooo">ООО</option>
                  <option value="soo">СОО</option>
                </Select>
                <Select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                  <option value="all">Все месяцы</option>
                  {Object.entries(monthLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="all">Все статусы</option>
                  <option value="planned">Планируется</option>
                  <option value="completed">Проведено</option>
                  <option value="cancelled">Отменено</option>
                </Select>
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  Сбросить
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {directionStatistics.length > 0 ? (
              <div className="border-b p-4">
                <div className="mb-3 flex flex-col gap-1">
                  <div className="text-sm font-semibold">Распределение по направлениям деятельности</div>
                  <div className="text-xs text-muted-foreground">
                    Одно мероприятие может входить сразу в несколько направлений без дублирования карточки.
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {directionStatistics.slice(0, 8).map((statistic) => (
                    <button
                      key={statistic.directionId}
                      type="button"
                      onClick={() => setDirectionFilter(statistic.directionId)}
                      className="rounded-md border bg-white p-3 text-left transition hover:border-sky-700 hover:bg-sky-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-medium">{statistic.title}</div>
                        <Badge variant="secondary">{statistic.eventsCount}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Уровни:{" "}
                        {statistic.byEducationLevel.map((item) => educationLevelLabels[item.level]).join(", ") || "нет данных"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {filteredEvents.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={CalendarX}
                  title="Мероприятия не найдены"
                  description="Измените фильтры или добавьте новое мероприятие через форму выше."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Период</TableHead>
                    <TableHead>Мероприятие</TableHead>
                    <TableHead>Модуль / направление</TableHead>
                    <TableHead>Планы</TableHead>
                    <TableHead>Ответственные</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Участники</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const educationModule = findModuleById(state.educationModules, event.moduleId);
                    const linkedAssociation = findAssociationById(educationalSystem.associations, event.associationId);
                    const linkedInfrastructure = findInfrastructureObjectById(
                      educationalSystem.infrastructureObjects,
                      event.infrastructureObjectId
                    );
                    const linkedPartner = schoolPartners.find((partner) => partner.id === event.systemPartnerId);
                    const eventDirections = getDirectionsForEvent(
                      event.id,
                      state.activityDirections,
                      state.eventDirectionRelations
                    );

                    return (
                      <TableRow id={`event-${event.id}`} key={event.id} className="scroll-mt-6">
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{monthLabels[event.month]}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRuDate(event.startDate)}
                            {event.endDate !== event.startDate ? ` - ${formatRuDate(event.endDate)}` : ""}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-64">
                          <div className="font-medium">{event.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{event.description}</div>
                          <div className="mt-2 text-xs">Классы: {event.classes}</div>
                          {event.venue ? <div className="text-xs text-muted-foreground">Место: {event.venue}</div> : null}
                          {event.sourceDocumentId ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline">Импортировано</Badge>
                              <Link
                                className="text-xs text-sky-700 underline-offset-2 hover:underline"
                                href={`/document-processing#document-${encodeURIComponent(event.sourceDocumentId)}`}
                              >
                                Источник: {event.sourceDocumentName ?? event.sourceDocumentTitle ?? "документ"}
                              </Link>
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="min-w-56">
                          <div className="font-medium">{educationModule?.title ?? "Модуль не выбран"}</div>
                          <div className="text-xs text-muted-foreground">{event.direction}</div>
                          {eventDirections.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {eventDirections.map((direction) => (
                                <Badge key={direction.id} variant="secondary">
                                  {direction.title}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                          {linkedAssociation || linkedInfrastructure || linkedPartner ? (
                            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                              {linkedAssociation ? <div>Объединение: {linkedAssociation.title}</div> : null}
                              {linkedInfrastructure ? <div>Инфраструктура: {linkedInfrastructure.title}</div> : null}
                              {linkedPartner ? <div>Партнер: {linkedPartner.name}</div> : null}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getEventPlanLabels(event).map((label) => (
                              <Badge key={label} variant="outline">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-56">
                          <div>{event.responsible}</div>
                          {event.coExecutors ? (
                            <div className="text-xs text-muted-foreground">Соисполнители: {event.coExecutors}</div>
                          ) : null}
                          {event.partner ? <div className="text-xs text-muted-foreground">Партнер: {event.partner}</div> : null}
                        </TableCell>
                        <TableCell>
                          <div className="grid gap-1">
                            <EventStatusBadge status={event.status} />
                            <PriorityBadge priority={event.priority} />
                          </div>
                        </TableCell>
                        <TableCell>{event.participantsCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => editEvent(event)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteEvent(event)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function validateEvent(form: EventForm, hasActiveModules: boolean) {
  const nextErrors: EventErrors = {};

  if (!form.title.trim()) {
    nextErrors.title = "Название обязательно";
  }

  if (!form.description.trim()) {
    nextErrors.description = "Описание обязательно";
  }

  if (!hasActiveModules || !form.moduleId) {
    nextErrors.moduleId = "Включите хотя бы один модуль воспитания";
  }

  if (!form.direction.trim()) {
    nextErrors.direction = "Направление обязательно";
  }

  if (form.directionIds.length === 0) {
    nextErrors.directionIds = "Выберите хотя бы одно направление деятельности";
  }

  if (form.educationLevels.length === 0) {
    nextErrors.educationLevels = "Выберите хотя бы один уровень";
  }

  if (!form.classes.trim()) {
    nextErrors.classes = "Классы обязательны";
  }

  if (!form.startDate) {
    nextErrors.startDate = "Дата начала обязательна";
  }

  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    nextErrors.endDate = "Дата окончания не может быть раньше даты начала";
  }

  if (!form.responsible.trim()) {
    nextErrors.responsible = "Ответственный обязателен";
  }

  if (!Number.isFinite(Number(form.participantsCount)) || Number(form.participantsCount) < 0) {
    nextErrors.participantsCount = "Количество участников должно быть 0 или больше";
  }

  return nextErrors;
}

function validateCompetition(form: CompetitionForm) {
  const nextErrors: CompetitionErrors = {};

  if (!form.title.trim()) {
    nextErrors.title = "Название конкурса обязательно";
  }

  if (!form.classes.trim()) {
    nextErrors.classes = "Классы обязательны";
  }

  if (!form.startDate) {
    nextErrors.startDate = "Дата начала обязательна";
  }

  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    nextErrors.endDate = "Дата окончания не может быть раньше даты начала";
  }

  if (!form.responsible.trim()) {
    nextErrors.responsible = "Ответственный обязателен";
  }

  if (!form.direction.trim()) {
    nextErrors.direction = "Направление обязательно";
  }

  if (!form.organizer.trim()) {
    nextErrors.organizer = "Партнер или организатор обязателен";
  }

  return nextErrors;
}
