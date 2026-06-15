"use client";

import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { FieldHint, NextStepHint, ReadinessIndicator, SectionGuide } from "@/components/app/field-guide";
import { FormField, TextareaField } from "@/components/app/form-field";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createId } from "@/lib/utils";
import type { SchoolInfrastructure, SchoolPassport, SocialPartner } from "@/types/domain";

type SchoolPassportField = keyof Pick<
  SchoolPassport,
  | "name"
  | "region"
  | "municipality"
  | "address"
  | "principal"
  | "deputyDirector"
  | "academicYear"
  | "studentsCount"
  | "classesCount"
>;

type ValidationErrors = Partial<Record<string, string>>;

const requiredFields: Array<{ key: SchoolPassportField; label: string }> = [
  { key: "name", label: "Название школы" },
  { key: "region", label: "Регион" },
  { key: "municipality", label: "Муниципалитет" },
  { key: "address", label: "Адрес" },
  { key: "principal", label: "ФИО директора" },
  { key: "deputyDirector", label: "ФИО заместителя директора по ВР" },
  { key: "academicYear", label: "Учебный год" },
  { key: "studentsCount", label: "Количество обучающихся" },
  { key: "classesCount", label: "Количество классов" }
];

const infrastructureItems: Array<{ key: keyof SchoolInfrastructure; label: string }> = [
  { key: "museum", label: "Школьный музей" },
  { key: "mediaCenter", label: "Медиацентр" },
  { key: "theater", label: "Театр" },
  { key: "sportsClub", label: "Спортивный клуб" },
  { key: "volunteerTeam", label: "Волонтерский отряд" },
  { key: "yuid", label: "ЮИД" },
  { key: "firstMovement", label: "Движение Первых" },
  { key: "eagletsOfRussia", label: "Орлята России" },
  { key: "childInitiativesCenter", label: "Центр детских инициатив" },
  { key: "schoolParliament", label: "Школьный парламент" }
];

export default function SchoolPassportPage() {
  const { state, updateState, resetState, isSaving } = useAppState();
  const [form, setForm] = React.useState(state.schoolPassport);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const completedRequiredFields = requiredFields.filter(({ key }) => {
    const value = form[key];
    return typeof value === "number" ? value > 0 : Boolean(String(value).trim());
  }).length;

  React.useEffect(() => {
    setForm(state.schoolPassport);
    setErrors({});
  }, [state.schoolPassport]);

  function setField(field: SchoolPassportField, value: string) {
    setSavedAt(null);
    setForm((current) => ({
      ...current,
      [field]: field === "studentsCount" || field === "classesCount" ? Number(value) : value
    }));
  }

  function setInfrastructureField(field: keyof SchoolInfrastructure, value: boolean) {
    setSavedAt(null);
    setForm((current) => ({
      ...current,
      infrastructure: {
        ...current.infrastructure,
        [field]: value
      }
    }));
  }

  function addPartner() {
    setSavedAt(null);
    setForm((current) => ({
      ...current,
      socialPartners: [
        ...current.socialPartners,
        {
          id: createId("partner"),
          name: "",
          type: "",
          activity: ""
        }
      ]
    }));
  }

  function updatePartner(id: string, field: keyof Omit<SocialPartner, "id">, value: string) {
    setSavedAt(null);
    setForm((current) => ({
      ...current,
      socialPartners: current.socialPartners.map((partner) =>
        partner.id === id ? { ...partner, [field]: value } : partner
      )
    }));
  }

  function removePartner(id: string) {
    setSavedAt(null);
    setForm((current) => ({
      ...current,
      socialPartners: current.socialPartners.filter((partner) => partner.id !== id)
    }));
  }

  async function save() {
    const nextErrors = validateSchoolPassport(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSavedAt(null);
      return;
    }

    try {
      await updateState((current) => ({
        ...current,
        schoolPassport: {
          ...form,
          updatedAt: new Date().toISOString().slice(0, 10)
        }
      }));
      setSavedAt("Данные сохранены в Supabase");
    } catch {
      setSavedAt(null);
    }
  }

  async function resetWithConfirmation() {
    const confirmed = window.confirm("Сбросить паспорт школы к демонстрационным данным? Несохраненные изменения будут потеряны.");

    if (confirmed) {
      try {
        await resetState();
        setSavedAt(null);
      } catch {
        setSavedAt(null);
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Паспорт школы"
        description="Структурированные сведения об образовательной организации, инфраструктуре воспитательной работы и социальных партнерах."
        actions={
          <>
            <Button variant="outline" onClick={resetWithConfirmation} disabled={isSaving}>
              <RotateCcw className="h-4 w-4" />
              Сбросить
            </Button>
            <Button onClick={save} disabled={isSaving}>
              <Save className="h-4 w-4" />
              Сохранить
            </Button>
          </>
        }
      />

      <div className="grid gap-6">
        <SectionGuide
          id="school-passport"
          title="Как заполнить паспорт школы"
          purpose="Паспорт задает официальные сведения о школе. Эти данные автоматически подставляются в КПВР, рабочую программу, планы, отчеты и проверку соответствия."
          fill={[
            "Заполните официальное название, регион, муниципалитет и адрес так, как они указаны в документах школы.",
            "Укажите директора и заместителя по воспитательной работе: эти ФИО попадут в документы и отчеты.",
            "Отметьте инфраструктуру и партнеров, чтобы система понимала воспитательную среду школы."
          ]}
          documents={["Рабочая программа", "КПВР", "Планы деятельности", "Отчеты", "Проверка соответствия"]}
        />

        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Учебный год</p>
              <p className="mt-1 text-lg font-semibold">{form.academicYear || "Не указан"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Социальных партнеров</p>
              <p className="mt-1 text-lg font-semibold">{form.socialPartners.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Обновлено</p>
              <p className="mt-1 text-lg font-semibold">{form.updatedAt}</p>
            </div>
          </CardContent>
        </Card>

        <ReadinessIndicator
          title="Готовность паспорта школы"
          completed={completedRequiredFields}
          total={requiredFields.length}
          note="Минимально нужны общие сведения. Инфраструктура и партнеры повышают качество автоматической генерации документов."
        />

        {Object.keys(errors).length > 0 ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Заполните обязательные поля перед сохранением.
          </div>
        ) : null}

        {savedAt ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {savedAt}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Общие данные</CardTitle>
            <CardDescription>Базовые сведения, которые используются в документах школы.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField label="Название школы" value={form.name} error={errors.name} required placeholder="Например: МБОУ «СОШ N 7»" onChange={(event) => setField("name", event.target.value)} help={<FieldHint documents={["Рабочая программа", "КПВР"]}>Пишите полное официальное название школы.</FieldHint>} />
            <FormField label="Регион" value={form.region} error={errors.region} required placeholder="Например: Калужская область" onChange={(event) => setField("region", event.target.value)} help={<FieldHint documents={["Проверка соответствия"]}>Регион нужен для характеристик школы и будущих региональных требований.</FieldHint>} />
            <FormField label="Муниципалитет" value={form.municipality} error={errors.municipality} required placeholder="Например: город Обнинск" onChange={(event) => setField("municipality", event.target.value)} help={<FieldHint>Укажите город, район или муниципальный округ.</FieldHint>} />
            <FormField label="Адрес" value={form.address} error={errors.address} required placeholder="Например: ул. Ленина, 15" onChange={(event) => setField("address", event.target.value)} />
            <FormField label="ФИО директора" value={form.principal} error={errors.principal} required placeholder="Например: Иванов Сергей Петрович" onChange={(event) => setField("principal", event.target.value)} />
            <FormField label="ФИО заместителя директора по ВР" value={form.deputyDirector} error={errors.deputyDirector} required placeholder="Например: Петрова Анна Сергеевна" onChange={(event) => setField("deputyDirector", event.target.value)} help={<FieldHint documents={["КПВР", "Отчеты"]}>Этот человек обычно становится ответственным за воспитательную работу в документах.</FieldHint>} />
            <FormField label="Учебный год" value={form.academicYear} error={errors.academicYear} required placeholder="Например: 2025/2026" onChange={(event) => setField("academicYear", event.target.value)} help={<FieldHint documents={["КПВР", "Планы"]}>Учебный год попадет в заголовки календарных планов и рабочей программы.</FieldHint>} />
            <FormField label="Количество обучающихся" type="number" min={0} value={String(form.studentsCount)} error={errors.studentsCount} required onChange={(event) => setField("studentsCount", event.target.value)} help={<FieldHint documents={["Рабочая программа", "Отчеты"]}>Нужно для описания контингента и расчета охвата мероприятиями.</FieldHint>} />
            <FormField label="Количество классов" type="number" min={0} value={String(form.classesCount)} error={errors.classesCount} required onChange={(event) => setField("classesCount", event.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Инфраструктура</CardTitle>
            <CardDescription>Отметьте действующие школьные объединения и пространства.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {infrastructureItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 rounded-md border bg-white px-3 py-3 text-sm font-medium"
                >
                  <input
                    type="checkbox"
                    checked={form.infrastructure[item.key]}
                    onChange={(event) => setInfrastructureField(item.key, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-sky-800"
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <FieldHint examples={["школьный музей", "медиацентр", "ЮИД", "Движение Первых"]} documents={["Рабочая программа", "Планы деятельности", "Проверка соответствия"]}>
                Отмечайте только реально действующие объекты и объединения. Позже система будет связывать с ними мероприятия и рекомендации.
              </FieldHint>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Социальные партнеры</CardTitle>
              <CardDescription>Можно добавить несколько организаций и описать совместную работу.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={addPartner}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {form.socialPartners.length === 0 ? (
              <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Социальные партнеры пока не добавлены.
              </div>
            ) : null}

            {form.socialPartners.map((partner, index) => (
              <div key={partner.id} className="rounded-md border bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Партнер {index + 1}</div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePartner(partner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Название партнера"
                    value={partner.name}
                    error={errors[`partner.${partner.id}.name`]}
                    required
                    onChange={(event) => updatePartner(partner.id, "name", event.target.value)}
                    placeholder="Например: Центральная городская библиотека"
                    help={<FieldHint>Укажите конкретную организацию, с которой школа проводит совместную работу.</FieldHint>}
                  />
                  <FormField
                    label="Тип партнера"
                    value={partner.type}
                    error={errors[`partner.${partner.id}.type`]}
                    required
                    onChange={(event) => updatePartner(partner.id, "type", event.target.value)}
                    placeholder="Например: музей, библиотека, колледж, учреждение культуры"
                    help={<FieldHint>Укажите вид организации, а не ее название.</FieldHint>}
                  />
                  <TextareaField
                    className="md:col-span-2"
                    label="Содержание совместной деятельности"
                    value={partner.activity}
                    error={errors[`partner.${partner.id}.activity`]}
                    required
                    onChange={(event) => updatePartner(partner.id, "activity", event.target.value)}
                    placeholder="Например: экскурсии, уроки мужества, профориентационные встречи, совместные акции"
                    help={<FieldHint documents={["Рабочая программа", "Проверка соответствия"]}>Опишите конкретные формы совместной работы. Эти данные попадут в описание социального партнерства.</FieldHint>}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {completedRequiredFields === requiredFields.length ? (
          <NextStepHint
            title="Следующий шаг: воспитательная система"
            description="После паспорта заполните объединения, инфраструктуру и партнеров. Это усилит рабочую программу и планы деятельности."
            href="/educational-system"
          />
        ) : null}
      </div>
    </>
  );
}

function validateSchoolPassport(form: SchoolPassport) {
  const nextErrors: ValidationErrors = {};

  requiredFields.forEach(({ key, label }) => {
    const value = form[key];

    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) {
        nextErrors[key] = `${label} должно быть больше 0`;
      }
      return;
    }

    if (!String(value).trim()) {
      nextErrors[key] = `${label} обязательно`;
    }
  });

  form.socialPartners.forEach((partner) => {
    if (!partner.name.trim()) {
      nextErrors[`partner.${partner.id}.name`] = "Название партнера обязательно";
    }

    if (!partner.type.trim()) {
      nextErrors[`partner.${partner.id}.type`] = "Тип партнера обязателен";
    }

    if (!partner.activity.trim()) {
      nextErrors[`partner.${partner.id}.activity`] = "Содержание совместной деятельности обязательно";
    }
  });

  return nextErrors;
}
