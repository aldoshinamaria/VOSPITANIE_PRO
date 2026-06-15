"use client";

import { useMemo, useState } from "react";
import { BookOpen, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { FieldHint, NextStepHint, ReadinessIndicator, SectionGuide } from "@/components/app/field-guide";
import { FormField, FieldError, FieldLabel } from "@/components/app/form-field";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildExtraActivityPlanRows,
  calculateStudentsCoverage,
  calculateWeeklyHoursByLevel,
  extraActivityStatusLabels,
  extraActivityTypeLabels,
  filterExtraActivities,
  formatEducationLevels
} from "@/lib/domain/extra-activities";
import { educationLevelLabels, educationLevels } from "@/lib/domain/events";
import { createId } from "@/lib/utils";
import type { EducationLevel, ExtraActivity, ExtraActivityStatus, ExtraActivityType } from "@/types/domain";

type FormState = Omit<ExtraActivity, "id" | "totalHours">;
type Errors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  title: "",
  type: "extracurricular",
  area: "",
  educationLevels: ["ooo"],
  classes: "",
  weeklyHours: 1,
  teacher: "",
  classroom: "",
  schedule: "",
  studentsCount: 0,
  status: "active"
};

const levelOptions = educationLevels.map((level) => ({
  value: level,
  label: educationLevelLabels[level]
}));

export default function ExtraActivitiesPage() {
  const { state, updateState, isSaving } = useAppState();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: "all" as "all" | EducationLevel,
    classNumber: "",
    teacher: ""
  });

  const filteredActivities = useMemo(
    () => filterExtraActivities(state.extraActivities, filters),
    [filters, state.extraActivities]
  );
  const hoursByLevel = useMemo(() => calculateWeeklyHoursByLevel(state.extraActivities), [state.extraActivities]);
  const coverage = useMemo(() => calculateStudentsCoverage(state.extraActivities), [state.extraActivities]);
  const planRows = useMemo(() => buildExtraActivityPlanRows(state.extraActivities), [state.extraActivities]);
  const formReadinessChecks = [
    Boolean(form.title.trim()),
    Boolean(form.area.trim()),
    form.educationLevels.length > 0,
    Boolean(form.classes.trim()),
    form.weeklyHours > 0,
    Boolean(form.teacher.trim()),
    Boolean(form.classroom.trim()),
    form.studentsCount > 0
  ];
  const formReadinessCompleted = formReadinessChecks.filter(Boolean).length;

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setSavedMessage(null);
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleLevel(level: EducationLevel) {
    setForm((current) => {
      const nextLevels = current.educationLevels.includes(level)
        ? current.educationLevels.filter((item) => item !== level)
        : [...current.educationLevels, level];

      return { ...current, educationLevels: nextLevels };
    });
    setErrors((current) => ({ ...current, educationLevels: undefined }));
  }

  async function saveProgram() {
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const nextProgram: ExtraActivity = {
      ...form,
      id: editingId ?? createId("extra"),
      totalHours: form.weeklyHours * 34
    };

    try {
      await updateState((current) => ({
        ...current,
        extraActivities: editingId
          ? current.extraActivities.map((activity) => (activity.id === editingId ? nextProgram : activity))
          : [nextProgram, ...current.extraActivities]
      }));
    } catch {
      setSavedMessage(null);
      return;
    }

    setSavedMessage(editingId ? "Изменения программы сохранены." : "Программа добавлена в реестр и план внеурочной деятельности.");
    resetForm();
  }

  function editProgram(activity: ExtraActivity) {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      type: activity.type,
      area: activity.area,
      educationLevels: activity.educationLevels,
      classes: activity.classes,
      weeklyHours: activity.weeklyHours,
      teacher: activity.teacher,
      classroom: activity.classroom,
      schedule: activity.schedule,
      studentsCount: activity.studentsCount,
      status: activity.status
    });
    setErrors({});
  }

  async function deleteProgram(activity: ExtraActivity) {
    const confirmed = window.confirm(`Удалить программу «${activity.title}»?`);

    if (!confirmed) {
      return;
    }

    try {
      await updateState((current) => ({
        ...current,
        extraActivities: current.extraActivities.filter((item) => item.id !== activity.id)
      }));
    } catch {
      return;
    }

    if (editingId === activity.id) {
      resetForm();
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  }

  function resetFilters() {
    setFilters({ level: "all", classNumber: "", teacher: "" });
  }

  return (
    <>
      <PageHeader
        title="Внеурочная деятельность"
        description="Реестр программ внеурочной деятельности и дополнительного образования с расчетом часов, охвата и предпросмотром школьного плана."
      />

      <SectionGuide
        id="extra-activities"
        title="Как заполнить внеурочную деятельность"
        purpose="Программы внеурочной деятельности используются в плане внеурочной деятельности, рабочей программе и анализе охвата обучающихся."
        fill={[
          "Укажите название программы, направление, уровни образования, классы и педагога.",
          "Заполните часы в неделю и количество обучающихся: система посчитает нагрузку и охват.",
          "Добавляйте только реально действующие программы и кружки."
        ]}
        documents={["План внеурочной деятельности", "Рабочая программа", "Отчеты", "Планы деятельности"]}
        className="mb-6"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Часы НОО / ООО / СОО" value={`${hoursByLevel.noo} / ${hoursByLevel.ooo} / ${hoursByLevel.soo}`} icon={Clock} />
        <MetricCard title="Активных программ" value={state.extraActivities.filter((activity) => activity.status === "active").length} icon={BookOpen} />
        <MetricCard title="Охват обучающихся" value={coverage} icon={Users} />
      </div>

      {savedMessage ? (
        <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {savedMessage}
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{editingId ? "Редактирование программы" : "Карточка программы"}</CardTitle>
          <CardDescription>Заполните основные параметры курса, кружка или объединения.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-2">
          <ReadinessIndicator
            title="Готовность карточки программы"
            completed={formReadinessCompleted}
            total={formReadinessChecks.length}
            note="Полная карточка дает корректный план внеурочной деятельности и расчет охвата."
          />
        </div>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <FormField
              label="Название программы"
              required
              value={form.title}
              error={errors.title}
              onChange={(event) => setField("title", event.target.value)}
              help={<FieldHint examples={["Юный экскурсовод", "Школьный медиацентр", "Профориентационный клуб"]} documents={["План внеурочной деятельности"]}>Название попадет в таблицу плана без дополнительного редактирования.</FieldHint>}
            />
            <label className="grid gap-2 text-sm font-medium">
              <FieldLabel label="Тип" required />
              <Select value={form.type} onChange={(event) => setField("type", event.target.value as ExtraActivityType)}>
                {Object.entries(extraActivityTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <FormField
              label="Направление"
              required
              value={form.area}
              error={errors.area}
              onChange={(event) => setField("area", event.target.value)}
              help={<FieldHint examples={["социальное", "духовно-нравственное", "профориентационное"]}>Направление помогает группировать программы и видеть баланс воспитательной работы.</FieldHint>}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2 text-sm font-medium">
              <FieldLabel label="Уровень образования" required />
              <div className="flex flex-wrap gap-2">
                {levelOptions.map((level) => (
                  <label key={level.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.educationLevels.includes(level.value)}
                      onChange={() => toggleLevel(level.value)}
                    />
                    {level.label}
                  </label>
                ))}
              </div>
              <FieldError error={errors.educationLevels} />
              <FieldHint documents={["План внеурочной деятельности", "Рабочая программа"]}>Выбранные уровни определяют, в какие планы попадет программа.</FieldHint>
            </div>
            <FormField
              label="Классы"
              required
              value={form.classes}
              error={errors.classes}
              placeholder="например: 5-7, 8А"
              onChange={(event) => setField("classes", event.target.value)}
              help={<FieldHint examples={["1-4", "5-7", "8-11"]}>Классы нужны для таблицы плана и расчета охвата.</FieldHint>}
            />
            <FormField
              label="Количество часов в неделю"
              required
              type="number"
              min={1}
              value={form.weeklyHours}
              error={errors.weeklyHours}
              onChange={(event) => setField("weeklyHours", Number(event.target.value))}
              help={<FieldHint documents={["План внеурочной деятельности"]}>Система автоматически рассчитает годовой объем как часы в неделю × 34.</FieldHint>}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <FormField
              label="Педагог"
              required
              value={form.teacher}
              error={errors.teacher}
              onChange={(event) => setField("teacher", event.target.value)}
              help={<FieldHint>Укажите педагога, который ведет программу. Это попадет в план.</FieldHint>}
            />
            <FormField
              label="Кабинет"
              required
              value={form.classroom}
              error={errors.classroom}
              onChange={(event) => setField("classroom", event.target.value)}
            />
            <FormField
              label="Количество обучающихся"
              required
              type="number"
              min={0}
              value={form.studentsCount}
              error={errors.studentsCount}
              onChange={(event) => setField("studentsCount", Number(event.target.value))}
              help={<FieldHint documents={["Отчеты"]}>Количество обучающихся используется для расчета охвата внеурочной деятельностью.</FieldHint>}
            />
            <label className="grid gap-2 text-sm font-medium">
              <FieldLabel label="Статус" required />
              <Select value={form.status} onChange={(event) => setField("status", event.target.value as ExtraActivityStatus)}>
                {Object.entries(extraActivityStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <FormField
            label="Расписание"
            value={form.schedule}
            placeholder="например: Пн, 15:00"
            onChange={(event) => setField("schedule", event.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveProgram} disabled={isSaving}>
              <Plus className="mr-2 h-4 w-4" />
              {editingId ? "Сохранить изменения" : "Добавить программу"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Очистить
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.extraActivities.length > 0 ? (
        <NextStepHint
          title="Следующий шаг: рабочая программа"
          description="После заполнения внеурочной деятельности проверьте, как эти данные отражаются в рабочей программе воспитания."
          href="/work-program"
        />
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Реестр программ</CardTitle>
          <CardDescription>Фильтруйте программы по уровню образования, классу и педагогу.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[220px_180px_1fr_auto]">
            <label className="grid gap-2 text-sm font-medium">
              <FieldLabel label="Уровень образования" />
              <Select
                value={filters.level}
                onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value as "all" | EducationLevel }))}
              >
                <option value="all">Все уровни</option>
                {levelOptions.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </label>
            <FormField
              label="Класс"
              value={filters.classNumber}
              placeholder="например: 7"
              onChange={(event) => setFilters((current) => ({ ...current, classNumber: event.target.value }))}
            />
            <FormField
              label="Педагог"
              value={filters.teacher}
              placeholder="ФИО или часть фамилии"
              onChange={(event) => setFilters((current) => ({ ...current, teacher: event.target.value }))}
            />
            <Button className="lg:mt-7" variant="outline" onClick={resetFilters}>
              Сбросить
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Программа</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Направление</TableHead>
                  <TableHead>Уровни</TableHead>
                  <TableHead>Классы</TableHead>
                  <TableHead>Часы</TableHead>
                  <TableHead>Педагог / кабинет</TableHead>
                  <TableHead>Охват</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      По выбранным фильтрам программы не найдены.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="min-w-56 font-medium">{activity.title}</TableCell>
                      <TableCell className="min-w-48">{extraActivityTypeLabels[activity.type]}</TableCell>
                      <TableCell className="min-w-48">{activity.area}</TableCell>
                      <TableCell>{formatEducationLevels(activity.educationLevels)}</TableCell>
                      <TableCell>{activity.classes}</TableCell>
                      <TableCell>{activity.weeklyHours}</TableCell>
                      <TableCell className="min-w-56">
                        <div>{activity.teacher}</div>
                        <div className="text-xs text-muted-foreground">{activity.classroom}</div>
                      </TableCell>
                      <TableCell>{activity.studentsCount}</TableCell>
                      <TableCell>
                        <Badge variant={activity.status === "active" ? "success" : "outline"}>
                          {extraActivityStatusLabels[activity.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => editProgram(activity)} aria-label="Редактировать программу">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProgram(activity)} aria-label="Удалить программу">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Предпросмотр плана внеурочной деятельности</CardTitle>
          <CardDescription>Формат таблицы подготовлен для школьного календарного плана.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <article className="bg-white px-4 py-6 text-slate-950 md:px-8">
            <header className="mx-auto max-w-5xl text-center">
              <p className="text-sm font-semibold uppercase tracking-normal text-slate-600">План внеурочной деятельности</p>
              <h2 className="mt-2 text-xl font-semibold">
                План внеурочной деятельности на {state.schoolPassport.academicYear} учебный год
              </h2>
            </header>
            <div className="mt-8 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="w-16 text-center text-slate-900">№</TableHead>
                    <TableHead className="min-w-96 text-slate-900">Название курса/программы/занятий</TableHead>
                    <TableHead className="w-40 text-slate-900">Классы</TableHead>
                    <TableHead className="w-56 text-slate-900">Количество часов в неделю</TableHead>
                    <TableHead className="min-w-64 text-slate-900">Педагог</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                        Активные программы не добавлены.
                      </TableCell>
                    </TableRow>
                  ) : (
                    planRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center align-top">{index + 1}</TableCell>
                        <TableCell className="align-top font-medium">{row.title}</TableCell>
                        <TableCell className="align-top">{row.classes}</TableCell>
                        <TableCell className="align-top">{row.weeklyHours}</TableCell>
                        <TableCell className="align-top">{row.teacher}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </article>
        </CardContent>
      </Card>
    </>
  );
}

function validateForm(form: FormState) {
  const errors: Errors = {};

  if (!form.title.trim()) {
    errors.title = "Укажите название программы";
  }

  if (!form.area.trim()) {
    errors.area = "Укажите направление";
  }

  if (form.educationLevels.length === 0) {
    errors.educationLevels = "Выберите хотя бы один уровень";
  }

  if (!form.classes.trim()) {
    errors.classes = "Укажите классы";
  }

  if (!Number.isFinite(form.weeklyHours) || form.weeklyHours <= 0) {
    errors.weeklyHours = "Укажите количество часов больше 0";
  }

  if (!form.teacher.trim()) {
    errors.teacher = "Укажите педагога";
  }

  if (!form.classroom.trim()) {
    errors.classroom = "Укажите кабинет";
  }

  if (!Number.isFinite(form.studentsCount) || form.studentsCount < 0) {
    errors.studentsCount = "Укажите корректный охват";
  }

  return errors;
}
