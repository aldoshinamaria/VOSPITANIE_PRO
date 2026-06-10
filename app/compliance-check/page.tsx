"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCopy, FileCheck2, RefreshCw, Route, ShieldCheck } from "lucide-react";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { federalKnowledgeBase } from "@/lib/domain/federal-knowledge/federal-knowledge-base";
import {
  buildComplianceFixPlan,
  createComplianceCheckHistoryEntry,
  createWorkProgramComplianceChecker,
  getComplianceCheckStatus,
  sortComplianceIssues
} from "@/lib/domain/federal-knowledge/work-program-compliance-checker";
import { cn } from "@/lib/utils";
import type {
  AppState,
  ComplianceCheck,
  ComplianceCheckHistory,
  ComplianceIssue,
  ComplianceOverallStatus,
  ComplianceSeverity,
  ComplianceStatus
} from "@/types/domain";

type IssueFilter = "all" | ComplianceSeverity;

interface ComplianceBlockView {
  title: string;
  score: number;
  status: ComplianceStatus;
  details: string;
}

const issueFilterLabels: Record<IssueFilter, string> = {
  all: "Все проблемы",
  critical: "Высокая критичность",
  warning: "Средняя критичность",
  info: "Низкая критичность"
};

const severityLabels: Record<ComplianceSeverity, string> = {
  critical: "Высокая",
  warning: "Средняя",
  info: "Низкая"
};

const statusLabels: Record<ComplianceStatus, string> = {
  passed: "Соответствует",
  needs_review: "Требует проверки",
  failed: "Не соответствует"
};

const overallStatusLabels: Record<ComplianceOverallStatus, string> = {
  compliant: "Соответствует",
  partially_compliant: "Частично соответствует",
  needs_revision: "Требует доработки"
};

export default function ComplianceCheckPage() {
  const { state, updateState, isSaving } = useAppState();
  const [issueFilter, setIssueFilter] = React.useState<IssueFilter>("all");
  const [checkRun, setCheckRun] = React.useState(0);
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle");
  const [copyPlanState, setCopyPlanState] = React.useState<"idle" | "copied" | "failed">("idle");

  const checker = React.useMemo(() => createWorkProgramComplianceChecker(), []);
  const check = React.useMemo(() => {
    void checkRun;

    return checkState(checker, state);
  }, [checker, state, checkRun]);

  const filteredIssues = React.useMemo(() => {
    const issues = issueFilter === "all" ? check.issues : check.issues.filter((issue) => issue.severity === issueFilter);

    return sortComplianceIssues(issues);
  }, [check.issues, issueFilter]);

  const summary = getComplianceSummary(check);
  const blocks = getComplianceBlocks(check);
  const priorityIssues = sortComplianceIssues(check.issues).slice(0, 3);
  const fixPlan = buildComplianceFixPlan(check);
  const history = state.complianceCheckHistory;

  async function runAndSaveCheck() {
    await updateState((current) => {
      const nextCheck = checkState(checker, current);
      const nextEntry = createComplianceCheckHistoryEntry(nextCheck);

      return {
        ...current,
        complianceCheckHistory: [nextEntry, ...current.complianceCheckHistory].slice(0, 20)
      };
    });
    setCheckRun((value) => value + 1);
  }

  async function copyRecommendations() {
    const text = buildRecommendationsText(check);

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  async function copyFixPlan() {
    const text = fixPlan.length > 0 ? fixPlan.join("\n") : "План исправления: критических действий нет.";

    try {
      await navigator.clipboard.writeText(text);
      setCopyPlanState("copied");
    } catch {
      setCopyPlanState("failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Проверка соответствия"
        description="Контроль рабочей программы воспитания по федеральной базе знаний, приложениям, КПВР и нормативным документам."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Соответствие" value={`${check.overallScore}%`} icon={ShieldCheck} />
        <MetricCard title="Проблем" value={check.issues.length} icon={AlertTriangle} />
        <MetricCard title="Рекомендаций" value={check.recommendations.length} icon={ClipboardCopy} />
        <MetricCard title="Проверено" value={formatCheckedAt(check.checkedAt)} icon={FileCheck2} />
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Итог проверки</CardTitle>
            <CardDescription>Процент, статус и проблемы рассчитываются сервисом `WorkProgramComplianceChecker`.</CardDescription>
          </div>
          <Badge className={summary.className}>{overallStatusLabels[summary.status]}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-md border bg-white p-5">
              <div className="text-5xl font-semibold tracking-normal">{check.overallScore}%</div>
              <p className="mt-2 text-sm text-muted-foreground">{summary.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {blocks.map((block) => (
                <CheckBlock key={block.title} {...block} />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={runAndSaveCheck} disabled={isSaving}>
              <RefreshCw className="h-4 w-4" />
              {isSaving ? "Сохраняем" : "Перепроверить"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/work-program">
                <FileCheck2 className="h-4 w-4" />
                Перейти в рабочую программу
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/kpvr">
                <Route className="h-4 w-4" />
                Перейти в КПВР
              </Link>
            </Button>
            <Button type="button" variant="secondary" onClick={copyRecommendations}>
              <ClipboardCopy className="h-4 w-4" />
              Скопировать рекомендации
            </Button>
            {copyState === "copied" ? <span className="self-center text-sm text-emerald-700">Рекомендации скопированы</span> : null}
            {copyState === "failed" ? <span className="self-center text-sm text-red-700">Не удалось скопировать</span> : null}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Что исправить в первую очередь</CardTitle>
            <CardDescription>Первые действия отсортированы по критичности.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {priorityIssues.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Критических действий нет.</div>
            ) : (
              priorityIssues.map((issue) => (
                <div key={issue.id} className="rounded-md border bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={severityClassName(issue.severity)}>{severityLabels[issue.severity]}</Badge>
                    <span className="text-sm text-muted-foreground">{issue.location}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{issue.recommendation}</p>
                  <Button asChild className="mt-3" size="sm" variant="outline">
                    <Link href={issue.targetUrl}>Перейти к исправлению</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Краткий план исправления</CardTitle>
              <CardDescription>План собирается из рекомендаций проверки.</CardDescription>
            </div>
            <Button type="button" variant="secondary" onClick={copyFixPlan}>
              <ClipboardCopy className="h-4 w-4" />
              Скопировать план
            </Button>
          </CardHeader>
          <CardContent>
            {fixPlan.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">План исправления не требуется.</div>
            ) : (
              <ol className="grid gap-2 text-sm">
                {fixPlan.map((step) => (
                  <li key={step} className="rounded-md bg-slate-50 p-3">
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {copyPlanState === "copied" ? <p className="mt-3 text-sm text-emerald-700">План скопирован</p> : null}
            {copyPlanState === "failed" ? <p className="mt-3 text-sm text-red-700">Не удалось скопировать план</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Список проблем</CardTitle>
            <CardDescription>Для каждой проблемы показаны критичность, раздел, источник требования и действие.</CardDescription>
          </div>
          <Select className="w-full md:w-64" value={issueFilter} onChange={(event) => setIssueFilter(event.target.value as IssueFilter)}>
            {Object.entries(issueFilterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="grid gap-3">
          {filteredIssues.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-3 font-medium">По выбранному фильтру проблем нет</p>
              <p className="mt-1 text-sm text-muted-foreground">Можно переключить фильтр или перепроверить программу после изменений.</p>
            </div>
          ) : (
            filteredIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>История проверок</CardTitle>
          <CardDescription>Сохраняет снимки последних проверок и показывает динамику относительно прошлого результата.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {history.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              История пока пуста. Нажмите «Перепроверить», чтобы сохранить первый результат.
            </div>
          ) : (
            history.map((entry, index) => <HistoryRow key={entry.id} entry={entry} previous={history[index + 1]} />)
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CheckBlock({ title, score, status, details }: ComplianceBlockView) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge className={statusClassName(status)}>{statusLabels[status]}</Badge>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className={cn("h-2 rounded-full", score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${score}%` }} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-normal">{score}%</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{details}</p>
    </div>
  );
}

function IssueCard({ issue }: { issue: ComplianceIssue }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={severityClassName(issue.severity)}>{severityLabels[issue.severity]}</Badge>
        <Badge className={statusClassName(issue.status)}>{statusLabels[issue.status]}</Badge>
        <span className="text-sm text-muted-foreground">{issue.location}</span>
      </div>
      <p className="mt-3 font-medium">{issue.description}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <InfoBlock title="Почему важно" value={issue.whyItMatters} />
        <InfoBlock title="Источник требования" value={issue.requirementSource} />
        <InfoBlock title="Рекомендация" value={issue.recommendation} />
      </div>
      <Button asChild className="mt-4" size="sm" variant="outline">
        <Link href={issue.targetUrl}>Перейти к исправлению</Link>
      </Button>
    </div>
  );
}

function HistoryRow({ entry, previous }: { entry: ComplianceCheckHistory; previous?: ComplianceCheckHistory }) {
  const delta = previous ? entry.overallScore - previous.overallScore : 0;

  return (
    <div className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-[180px_1fr_180px] md:items-center">
      <div>
        <div className="font-medium">{formatCheckedAt(entry.checkedAt)}</div>
        <div className="mt-1 text-xs text-muted-foreground">{new Date(entry.checkedAt).toLocaleDateString("ru-RU")}</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <InfoBlock title="Соответствие" value={`${entry.overallScore}%`} />
        <InfoBlock title="Проблем" value={String(entry.issueCount)} />
        <InfoBlock title="Высокая" value={String(entry.highSeverityCount)} />
        <InfoBlock title="Средняя/низкая" value={`${entry.mediumSeverityCount}/${entry.lowSeverityCount}`} />
      </div>
      <Badge className={delta > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : delta < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-700"}>
        {previous ? `${delta > 0 ? "+" : ""}${delta}%` : "Первый замер"}
      </Badge>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{title}</div>
      <p className="mt-1 text-sm leading-5">{value}</p>
    </div>
  );
}

function checkState(checker: ReturnType<typeof createWorkProgramComplianceChecker>, state: AppState) {
  return checker.check({
    workProgram: state.workProgram,
    federalKnowledgeBase,
    kpvr: state.kpvr,
    events: state.events,
    educationalSystem: state.educationalSystem,
    extraActivities: state.extraActivities,
    educationModules: state.educationModules,
    normativeDocuments: state.normativeDocuments
  });
}

function getComplianceSummary(check: ComplianceCheck) {
  const status = getComplianceCheckStatus(check);

  if (status === "compliant") {
    return {
      status,
      description: "Рабочая программа выглядит готовой к проверке, остаются только точечные уточнения.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }

  if (status === "partially_compliant") {
    return {
      status,
      description: "Основа программы собрана, но часть федеральных требований требует доработки.",
      className: "border-amber-200 bg-amber-50 text-amber-800"
    };
  }

  return {
    status,
    description: "Перед показом или утверждением нужно закрыть обязательные замечания.",
    className: "border-red-200 bg-red-50 text-red-700"
  };
}

function getComplianceBlocks(check: ComplianceCheck): ComplianceBlockView[] {
  const kpvrIssues = check.issues.filter((issue) => issue.targetModule === "kpvr");
  const systemIssues = check.issues.filter((issue) => issue.targetModule === "educational-system");

  return [
    {
      title: "Обязательные разделы",
      score: average(check.sectionCoverage.map((item) => item.score)),
      status: deriveStatus(check.sectionCoverage.map((item) => item.status)),
      details: `${check.sectionCoverage.filter((item) => item.status === "passed").length} из ${check.sectionCoverage.length} разделов без замечаний`
    },
    {
      title: "Направления воспитания",
      score: average(check.directionCoverage.map((item) => item.score)),
      status: deriveStatus(check.directionCoverage.map((item) => item.status)),
      details: `${check.directionCoverage.filter((item) => item.status === "passed").length} из ${check.directionCoverage.length} направлений покрыты`
    },
    {
      title: "Целевые ориентиры",
      score: average(check.targetResultCoverage.map((item) => item.score)),
      status: deriveStatus(check.targetResultCoverage.map((item) => item.status)),
      details: check.targetResultCoverage.map((item) => `${item.educationLevel.toUpperCase()}: ${item.covered}/${item.total}`).join("; ")
    },
    {
      title: "Связь КПВР и программы",
      score: kpvrIssues.length === 0 ? 100 : 60,
      status: kpvrIssues.length === 0 ? "passed" : "needs_review",
      details: kpvrIssues.length === 0 ? "Замечаний по связке КПВР нет" : `${kpvrIssues.length} замечаний по согласованности`
    },
    {
      title: "Воспитательная система",
      score: systemIssues.length === 0 ? 100 : 60,
      status: systemIssues.length === 0 ? "passed" : "needs_review",
      details: systemIssues.length === 0 ? "Ключевые объединения отражены" : `${systemIssues.length} замечаний по укладу школы`
    }
  ];
}

function buildRecommendationsText(check: ComplianceCheck) {
  if (check.recommendations.length === 0) {
    return "Проверка соответствия: критических рекомендаций нет.";
  }

  return check.recommendations
    .map((recommendation, index) =>
      [
        `${index + 1}. ${recommendation.title}`,
        `Раздел: ${recommendation.targetLocation}`,
        `Источник: ${recommendation.sourceRequirement}`,
        `Описание: ${recommendation.description}`
      ].join("\n")
    )
    .join("\n\n");
}

function deriveStatus(statuses: ComplianceStatus[]): ComplianceStatus {
  if (statuses.some((status) => status === "failed")) {
    return "failed";
  }

  if (statuses.some((status) => status === "needs_review")) {
    return "needs_review";
  }

  return "passed";
}

function average(values: number[]) {
  return values.length === 0 ? 100 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function severityClassName(severity: ComplianceSeverity) {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusClassName(status: ComplianceStatus) {
  if (status === "passed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "needs_review") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
