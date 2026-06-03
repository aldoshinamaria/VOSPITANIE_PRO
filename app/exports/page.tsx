"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildExtraActivityPlanRows } from "@/lib/domain/extra-activities";
import {
  buildExtraActivityDocxBlob,
  buildKpvrDocxBlob,
  getDocxEducationLevels,
  getExtraActivityDocxFileName,
  getKpvrDocxFileName
} from "@/lib/domain/docx-export";
import { buildKpvrDocument } from "@/lib/domain/kpvr";
import type { EducationLevel } from "@/types/domain";

type ExportJob = "kpvr" | "extra-activities";

export default function ExportsPage() {
  const { state } = useAppState();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportLevels = getDocxEducationLevels();
  const documentsCount = exportLevels.length * 2;
  const kpvrRowsByLevel = Object.fromEntries(
    exportLevels.map(({ level }) => [level, buildKpvrDocument(level, state.events, state.educationModules).totalRows])
  ) as Record<EducationLevel, number>;
  const extraRowsByLevel = Object.fromEntries(
    exportLevels.map(({ level }) => [level, buildExtraActivityPlanRows(state.extraActivities, level).length])
  ) as Record<EducationLevel, number>;

  async function downloadDocx(job: ExportJob, level: EducationLevel) {
    const pendingKey = `${job}-${level}`;
    setPending(pendingKey);
    setError(null);

    try {
      const blob =
        job === "kpvr"
          ? await buildKpvrDocxBlob(state, level)
          : await buildExtraActivityDocxBlob(state, level);
      const fileName =
        job === "kpvr"
          ? getKpvrDocxFileName(state, level)
          : getExtraActivityDocxFileName(state, level);

      downloadBlob(blob, fileName);
    } catch {
      setError("Не удалось сформировать DOCX. Проверьте данные документа и повторите экспорт.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Экспорт документов"
        description="Генерация DOCX-файлов в браузере для КПВР и плана внеурочной деятельности по уровням образования."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Документов DOCX" value={documentsCount} icon={FileText} />
        <MetricCard title="Уровни" value="НОО / ООО / СОО" icon={FileText} />
        <MetricCard title="Учебный год" value={state.schoolPassport.academicYear} icon={FileText} />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ExportCard
          title="КПВР"
          description="Календарный план воспитательной работы с группировкой по модулям и таблицей мероприятий."
          badge="DOCX"
          pending={pending}
          job="kpvr"
          rowsByLevel={kpvrRowsByLevel}
          onDownload={downloadDocx}
        />
        <ExportCard
          title="План внеурочной деятельности"
          description="План программ и занятий с классами, количеством часов в неделю и педагогами."
          badge="DOCX"
          pending={pending}
          job="extra-activities"
          rowsByLevel={extraRowsByLevel}
          onDownload={downloadDocx}
        />
      </div>
    </>
  );
}

function ExportCard({
  title,
  description,
  badge,
  pending,
  job,
  rowsByLevel,
  onDownload
}: {
  title: string;
  description: string;
  badge: string;
  pending: string | null;
  job: ExportJob;
  rowsByLevel: Record<EducationLevel, number>;
  onDownload: (job: ExportJob, level: EducationLevel) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center justify-between gap-3">
          <Badge variant="outline">{badge}</Badge>
          <span className="text-xs text-muted-foreground">Экспорт из браузера</span>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {getDocxEducationLevels().map(({ level, label }) => {
          const pendingKey = `${job}-${level}`;
          const isPending = pending === pendingKey;
          const rowsCount = rowsByLevel[level];

          return (
            <div key={level} className="grid gap-1">
              <Button variant="outline" className="justify-start" disabled={Boolean(pending)} onClick={() => onDownload(job, level)}>
                <Download className="h-4 w-4" />
                {isPending ? "Формируется..." : `Скачать ${title} ${label}`}
              </Button>
              <div className={rowsCount > 0 ? "text-xs text-muted-foreground" : "text-xs text-amber-700"}>
                {rowsCount > 0 ? `В документ попадет строк: ${rowsCount}` : "Документ будет пустым: добавьте данные для этого уровня."}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
