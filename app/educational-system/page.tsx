"use client";

import { Building2, Handshake, Network, Plus, Trash2, Users } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { FieldHint, NextStepHint, ReadinessIndicator, SectionGuide } from "@/components/app/field-guide";
import { FieldLabel, FormField, TextareaField } from "@/components/app/form-field";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  associationActivityLevelLabels,
  associationTypeLabels,
  calculateAssociationAnalytics,
  educationalSystemStatusLabels,
  infrastructureObjectTypeLabels
} from "@/lib/domain/educational-system";
import { createId } from "@/lib/utils";
import type {
  EducationalAssociation,
  EducationalAssociationType,
  EducationalSystemPartner,
  EducationalSystemStatus,
  InfrastructureObjectType,
  SchoolInfrastructureObject
} from "@/types/domain";

type AssociationForm = Omit<EducationalAssociation, "id">;
type InfrastructureForm = Omit<SchoolInfrastructureObject, "id">;
type PartnerForm = Omit<EducationalSystemPartner, "id">;

const emptyAssociationForm: AssociationForm = {
  type: "volunteer_team",
  title: "",
  description: "",
  leader: "",
  participantsCount: 0,
  classes: "",
  photoUrl: "",
  status: "active"
};

const emptyInfrastructureForm: InfrastructureForm = {
  type: "museum",
  title: "",
  description: "",
  responsible: ""
};

const emptyPartnerForm: PartnerForm = {
  title: "",
  type: "",
  cooperationDescription: "",
  contactPerson: ""
};

export default function EducationalSystemPage() {
  const { state, updateState, isSaving } = useAppState();
  const [associationForm, setAssociationForm] = React.useState<AssociationForm>(emptyAssociationForm);
  const [infrastructureForm, setInfrastructureForm] = React.useState<InfrastructureForm>(emptyInfrastructureForm);
  const [partnerForm, setPartnerForm] = React.useState<PartnerForm>(emptyPartnerForm);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const system = state.educationalSystem;
  const activeAssociations = system.associations.filter((association) => association.status === "active").length;
  const totalParticipants = system.associations.reduce((sum, association) => sum + association.participantsCount, 0);
  const readinessCompleted = [
    system.associations.length > 0,
    system.infrastructureObjects.length > 0,
    system.partners.length > 0,
    activeAssociations > 0
  ].filter(Boolean).length;

  function setAssociationField<TField extends keyof AssociationForm>(
    field: TField,
    value: AssociationForm[TField]
  ) {
    setAssociationForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  }

  function setInfrastructureField<TField extends keyof InfrastructureForm>(
    field: TField,
    value: InfrastructureForm[TField]
  ) {
    setInfrastructureForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  }

  function setPartnerField<TField extends keyof PartnerForm>(field: TField, value: PartnerForm[TField]) {
    setPartnerForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  }

  async function addAssociation() {
    if (!associationForm.title.trim() || !associationForm.leader.trim()) {
      setError("Укажите название объединения и руководителя.");
      return;
    }

    const nextAssociation: EducationalAssociation = {
      ...associationForm,
      id: createId("association"),
      title: associationForm.title.trim(),
      description: associationForm.description.trim(),
      leader: associationForm.leader.trim(),
      classes: associationForm.classes.trim(),
      photoUrl: associationForm.photoUrl.trim(),
      participantsCount: Number(associationForm.participantsCount) || 0
    };

    try {
      await updateState((current) => ({
        ...current,
        educationalSystem: {
          ...current.educationalSystem,
          associations: [nextAssociation, ...current.educationalSystem.associations]
        }
      }));
      setAssociationForm(emptyAssociationForm);
      setMessage("Объединение добавлено в воспитательную систему.");
    } catch {
      setMessage(null);
    }
  }

  async function addInfrastructureObject() {
    if (!infrastructureForm.title.trim() || !infrastructureForm.responsible.trim()) {
      setError("Укажите название объекта инфраструктуры и ответственного.");
      return;
    }

    const nextObject: SchoolInfrastructureObject = {
      ...infrastructureForm,
      id: createId("infrastructure"),
      title: infrastructureForm.title.trim(),
      description: infrastructureForm.description.trim(),
      responsible: infrastructureForm.responsible.trim()
    };

    try {
      await updateState((current) => ({
        ...current,
        educationalSystem: {
          ...current.educationalSystem,
          infrastructureObjects: [nextObject, ...current.educationalSystem.infrastructureObjects]
        }
      }));
      setInfrastructureForm(emptyInfrastructureForm);
      setMessage("Объект инфраструктуры добавлен.");
    } catch {
      setMessage(null);
    }
  }

  async function addPartner() {
    if (!partnerForm.title.trim() || !partnerForm.type.trim()) {
      setError("Укажите название и тип социального партнера.");
      return;
    }

    const nextPartner: EducationalSystemPartner = {
      ...partnerForm,
      id: createId("system-partner"),
      title: partnerForm.title.trim(),
      type: partnerForm.type.trim(),
      cooperationDescription: partnerForm.cooperationDescription.trim(),
      contactPerson: partnerForm.contactPerson.trim()
    };

    try {
      await updateState((current) => ({
        ...current,
        educationalSystem: {
          ...current.educationalSystem,
          partners: [nextPartner, ...current.educationalSystem.partners]
        }
      }));
      setPartnerForm(emptyPartnerForm);
      setMessage("Социальный партнер добавлен в воспитательную систему.");
    } catch {
      setMessage(null);
    }
  }

  async function removeAssociation(id: string) {
    try {
      await updateState((current) => ({
        ...current,
        educationalSystem: {
          ...current.educationalSystem,
          associations: current.educationalSystem.associations.filter((association) => association.id !== id)
        },
        events: current.events.map((event) =>
          event.associationId === id ? { ...event, associationId: "" } : event
        )
      }));
    } catch {
      return;
    }
  }

  async function removeInfrastructureObject(id: string) {
    try {
      await updateState((current) => ({
        ...current,
        educationalSystem: {
          ...current.educationalSystem,
          infrastructureObjects: current.educationalSystem.infrastructureObjects.filter((object) => object.id !== id)
        },
        events: current.events.map((event) =>
          event.infrastructureObjectId === id ? { ...event, infrastructureObjectId: "" } : event
        )
      }));
    } catch {
      return;
    }
  }

  async function removePartner(id: string) {
    try {
      await updateState((current) => ({
        ...current,
        educationalSystem: {
          ...current.educationalSystem,
          partners: current.educationalSystem.partners.filter((partner) => partner.id !== id)
        },
        events: current.events.map((event) =>
          event.systemPartnerId === id ? { ...event, systemPartnerId: "" } : event
        )
      }));
    } catch {
      return;
    }
  }

  return (
    <>
      <PageHeader
        title="Воспитательная система школы"
        description="Объединения, инфраструктура, партнеры и связи с мероприятиями. Раздел готовит данные для будущего ИИ-конструктора КПВР."
      />

      <div className="mt-6">
        <SectionGuide
          id="educational-system"
          title="Как описать воспитательную систему"
          purpose="Этот раздел показывает, на что реально опирается воспитательная работа школы: объединения, пространства и партнеры. Эти данные помогают системе связывать мероприятия с планами и рабочей программой."
          fill={[
            "Добавьте действующие объединения: волонтеры, музей, ЮИД, Движение Первых, медиацентр, театр.",
            "Опишите инфраструктуру: музей, библиотека, актовый зал, спортивный зал, центр детских инициатив.",
            "Укажите партнеров, которые участвуют в мероприятиях, профориентации, профилактике или патриотической работе."
          ]}
          documents={["Рабочая программа", "Планы деятельности", "Отчеты", "Проверка соответствия"]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Объединений" value={system.associations.length} icon={Network} />
        <MetricCard title="Активных" value={activeAssociations} icon={Users} />
        <MetricCard title="Участников" value={totalParticipants} icon={Users} />
        <MetricCard title="Партнеров" value={system.partners.length} icon={Handshake} />
      </div>

      {message ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <ReadinessIndicator
          title="Готовность воспитательной системы"
          completed={readinessCompleted}
          total={4}
          note="Для уверенной генерации нужны хотя бы одно объединение, один объект инфраструктуры и один партнер."
        />

        <Card>
          <CardHeader>
            <CardTitle>Воспитательные объединения</CardTitle>
            <CardDescription>Добавьте активы школы, которые могут участвовать в мероприятиях КПВР.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                <FieldLabel label="Тип" required />
                <Select
                  value={associationForm.type}
                  onChange={(event) => setAssociationField("type", event.target.value as EducationalAssociationType)}
                >
                  {Object.entries(associationTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <FieldHint examples={["Волонтерский отряд", "Школьный музей", "ЮИД", "Медиацентр"]}>
                  Выберите вариант, который ближе всего описывает объединение. Если точного типа нет, используйте собственное объединение.
                </FieldHint>
              </label>
              <FormField
                label="Название"
                required
                value={associationForm.title}
                placeholder="Например: Волонтерский отряд «Правнуки Победы»"
                onChange={(event) => setAssociationField("title", event.target.value)}
                help={<FieldHint documents={["Рабочая программа", "Планы деятельности"]}>Пишите реальное название объединения, а не только его тип.</FieldHint>}
              />
              <FormField
                label="Руководитель"
                required
                value={associationForm.leader}
                placeholder="Например: Иванова Мария Сергеевна"
                onChange={(event) => setAssociationField("leader", event.target.value)}
                help={<FieldHint>Укажите педагога или сотрудника, который отвечает за работу объединения.</FieldHint>}
              />
              <FormField
                label="Количество участников"
                type="number"
                min={0}
                value={associationForm.participantsCount}
                placeholder="Например: 25"
                onChange={(event) => setAssociationField("participantsCount", Number(event.target.value))}
                help={<FieldHint>Укажите примерное количество активных участников.</FieldHint>}
              />
              <FormField
                label="Классы"
                value={associationForm.classes}
                placeholder="Например: 5-9 или 7-11"
                onChange={(event) => setAssociationField("classes", event.target.value)}
                help={<FieldHint>Укажите классы, которые участвуют в объединении.</FieldHint>}
              />
              <label className="grid gap-2 text-sm font-medium">
                <FieldLabel label="Активность" />
                <Select
                  value={associationForm.status}
                  onChange={(event) => setAssociationField("status", event.target.value as EducationalSystemStatus)}
                >
                  <option value="active">Активно</option>
                  <option value="inactive">Неактивно</option>
                </Select>
              </label>
              <FormField
                label="Фото"
                value={associationForm.photoUrl}
                placeholder="URL изображения, необязательно"
                onChange={(event) => setAssociationField("photoUrl", event.target.value)}
              />
              <TextareaField
                className="lg:col-span-2"
                label="Описание"
                value={associationForm.description}
                placeholder="Например: добровольческие акции, помощь ветеранам, участие в городских мероприятиях"
                onChange={(event) => setAssociationField("description", event.target.value)}
                help={<FieldHint documents={["Рабочая программа"]}>Кратко опишите, чем занимается объединение.</FieldHint>}
              />
            </div>
            <Button className="w-fit" onClick={addAssociation} disabled={isSaving}>
              <Plus className="h-4 w-4" />
              Добавить объединение
            </Button>

            <div className="grid gap-4 xl:grid-cols-2">
              {system.associations.map((association) => {
                const analytics = calculateAssociationAnalytics(association, state.events);

                return (
                  <Card key={association.id}>
                    <CardHeader className="flex-row items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{associationTypeLabels[association.type]}</Badge>
                          <Badge variant={association.status === "active" ? "success" : "secondary"}>
                            {educationalSystemStatusLabels[association.status]}
                          </Badge>
                        </div>
                        <CardTitle>{association.title}</CardTitle>
                        <CardDescription className="mt-2">{association.description}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAssociation(association.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                      <div>Руководитель: {association.leader}</div>
                      <div>Классы: {association.classes || "не указаны"}</div>
                      <div className="grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Мероприятий</div>
                          <div className="font-semibold">{analytics.eventsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Участников</div>
                          <div className="font-semibold">{analytics.participantsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Активность</div>
                          <div className="font-semibold">{associationActivityLevelLabels[analytics.activityLevel]}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Инфраструктура школы</CardTitle>
            <CardDescription>Опишите пространства, которые используются в воспитательной работе.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                <FieldLabel label="Тип" required />
                <Select
                  value={infrastructureForm.type}
                onChange={(event) =>
                  setInfrastructureField("type", event.target.value as InfrastructureObjectType)
                }
                >
                  {Object.entries(infrastructureObjectTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <FieldHint examples={["школьный музей", "библиотека", "актовый зал"]}>
                  Инфраструктура показывает, где школа может проводить воспитательные события.
                </FieldHint>
              </label>
              <FormField
                label="Название"
                required
                value={infrastructureForm.title}
                onChange={(event) => setInfrastructureField("title", event.target.value)}
                help={<FieldHint examples={["Музей боевой славы", "Центр детских инициатив"]} documents={["Рабочая программа", "Планы"]}>Используйте понятное название объекта, которое принято в школе.</FieldHint>}
              />
              <FormField
                label="Ответственный"
                required
                value={infrastructureForm.responsible}
                onChange={(event) => setInfrastructureField("responsible", event.target.value)}
              />
              <TextareaField
                className="lg:col-span-3"
                label="Описание"
                value={infrastructureForm.description}
                onChange={(event) => setInfrastructureField("description", event.target.value)}
                help={<FieldHint>Опишите, какие мероприятия здесь проходят и какие возможности дает этот объект.</FieldHint>}
              />
            </div>
            <Button className="w-fit" onClick={addInfrastructureObject} disabled={isSaving}>
              <Plus className="h-4 w-4" />
              Добавить объект
            </Button>
            <div className="grid gap-4 xl:grid-cols-2">
              {system.infrastructureObjects.map((object) => (
                <Card key={object.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline">{infrastructureObjectTypeLabels[object.type]}</Badge>
                      <CardTitle className="mt-2">{object.title}</CardTitle>
                      <CardDescription className="mt-2">{object.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeInfrastructureObject(object.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="text-sm">Ответственный: {object.responsible}</CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Социальные партнеры</CardTitle>
            <CardDescription>Справочник партнеров для связи с мероприятиями и будущей генерации КПВР.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                label="Название"
                required
                value={partnerForm.title}
                placeholder="Например: Музей истории города Обнинска"
                onChange={(event) => setPartnerField("title", event.target.value)}
                help={<FieldHint>Укажите конкретную организацию, с которой школа проводит совместную работу.</FieldHint>}
              />
              <FormField
                label="Тип"
                required
                value={partnerForm.type}
                placeholder="Например: музей, библиотека, колледж, учреждение культуры"
                onChange={(event) => setPartnerField("type", event.target.value)}
                help={<FieldHint>Укажите вид организации, а не ее название.</FieldHint>}
              />
              <FormField
                label="Контактное лицо"
                value={partnerForm.contactPerson}
                placeholder="Например: Смирнова Елена Олеговна"
                onChange={(event) => setPartnerField("contactPerson", event.target.value)}
              />
              <TextareaField
                className="lg:col-span-3"
                label="Описание сотрудничества"
                value={partnerForm.cooperationDescription}
                placeholder="Например: экскурсии, уроки мужества, профориентационные встречи, совместные акции"
                onChange={(event) => setPartnerField("cooperationDescription", event.target.value)}
                help={<FieldHint documents={["Рабочая программа", "Проверка соответствия"]}>Опишите конкретные формы совместной работы. Эти данные попадут в описание социального партнерства.</FieldHint>}
              />
            </div>
            <Button className="w-fit" onClick={addPartner} disabled={isSaving}>
              <Plus className="h-4 w-4" />
              Добавить партнера
            </Button>
            <div className="grid gap-4 xl:grid-cols-2">
              {system.partners.map((partner) => (
                <Card key={partner.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline">{partner.type}</Badge>
                      <CardTitle className="mt-2">{partner.title}</CardTitle>
                      <CardDescription className="mt-2">{partner.cooperationDescription}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePartner(partner.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="text-sm">
                    Контактное лицо: {partner.contactPerson || "не указано"}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Связи для будущего ИИ-конструктора КПВР</CardTitle>
            <CardDescription>
              В карточке мероприятия можно выбрать объединение, инфраструктуру и партнера. Эти связи будут использоваться для рекомендаций и автоматической сборки планов.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Пример: мероприятие «Георгиевская ленточка» связывается с волонтерским отрядом «Правнуки Победы».
            </div>
          </CardContent>
        </Card>

        {readinessCompleted >= 3 ? (
          <NextStepHint
            title="Следующий шаг: мероприятия"
            description="Теперь можно добавлять мероприятия и связывать их с объединениями, инфраструктурой и партнерами."
            href="/events"
          />
        ) : null}
      </div>
    </>
  );
}
