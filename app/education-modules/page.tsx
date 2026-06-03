"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { FormField, TextareaField } from "@/components/app/form-field";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createId } from "@/lib/utils";

export default function EducationModulesPage() {
  const { state, updateState, isSaving } = useAppState();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const activeCount = state.educationModules.filter((educationModule) => educationModule.active).length;

  async function toggleModule(id: string) {
    try {
      await updateState((current) => ({
        ...current,
        educationModules: current.educationModules.map((educationModule) =>
          educationModule.id === id ? { ...educationModule, active: !educationModule.active } : educationModule
        )
      }));
    } catch {
      return;
    }
  }

  async function addModule() {
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    if (!nextTitle) {
      setError("Введите название модуля");
      return;
    }

    if (!nextDescription) {
      setError("Введите описание модуля");
      return;
    }

    const titleExists = state.educationModules.some(
      (educationModule) => educationModule.title.trim().toLowerCase() === nextTitle.toLowerCase()
    );

    if (titleExists) {
      setError("Модуль с таким названием уже есть в справочнике");
      return;
    }

    try {
      await updateState((current) => ({
        ...current,
        educationModules: [
          ...current.educationModules,
          {
            id: createId("module-custom"),
            title: nextTitle,
            description: nextDescription,
            active: true
          }
        ]
      }));
    } catch {
      return;
    }

    setTitle("");
    setDescription("");
    setError(null);
  }

  return (
    <>
      <PageHeader
        title="Модули воспитания"
        description="Справочник стандартных и пользовательских модулей рабочей программы воспитания."
      />

      <div className="grid gap-6">
        {activeCount === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Все модули отключены. Включите хотя бы один модуль, чтобы можно было добавлять мероприятия.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Всего модулей" value={state.educationModules.length} />
          <Metric label="Активны" value={activeCount} />
          <Metric label="Отключены" value={state.educationModules.length - activeCount} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Добавить свой модуль</CardTitle>
            <CardDescription>Пользовательский модуль сразу становится активным и доступен для мероприятий.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_1fr_auto] lg:items-start">
            <FormField label="Название модуля" value={title} onChange={(event) => setTitle(event.target.value)} />
            <TextareaField
              label="Описание"
              value={description}
              className="[&_textarea]:min-h-10"
              onChange={(event) => setDescription(event.target.value)}
            />
            <Button className="lg:mt-7" onClick={addModule} disabled={isSaving}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
            {error ? <div className="text-sm text-red-700 lg:col-span-3">{error}</div> : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {state.educationModules.map((educationModule) => (
            <Card key={educationModule.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <div className="mb-2">
                    <Badge variant={educationModule.active ? "success" : "secondary"}>
                      {educationModule.active ? "Активен" : "Отключен"}
                    </Badge>
                  </div>
                  <CardTitle>{educationModule.title}</CardTitle>
                  <CardDescription className="mt-2">{educationModule.description}</CardDescription>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
                  <span>{educationModule.active ? "Вкл." : "Выкл."}</span>
                  <input
                    type="checkbox"
                    checked={educationModule.active}
                    onChange={() => toggleModule(educationModule.id)}
                    disabled={isSaving}
                    className="h-5 w-5 rounded border-slate-300 accent-sky-800"
                  />
                </label>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
