"use client";

import { CheckCircle2, ChevronDown, HelpCircle, Lightbulb, Route, Target } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionGuideProps {
  id: string;
  title: string;
  purpose: string;
  fill: string[];
  documents: string[];
  className?: string;
}

export function SectionGuide({ id, title, purpose, fill, documents, className }: SectionGuideProps) {
  const storageKey = `vospitanie-pro:section-guide:${id}`;
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "closed") {
      setOpen(false);
    }
  }, [storageKey]);

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "open" : "closed");
      return next;
    });
  }

  return (
    <Card className={cn("border-sky-200 bg-sky-50/70", className)}>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-sky-800" />
            {title}
          </CardTitle>
          <CardDescription className="mt-1 text-sky-950">{purpose}</CardDescription>
        </div>
        <button
          type="button"
          onClick={toggleOpen}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-3 text-sm font-medium text-sky-900"
        >
          {open ? "Свернуть" : "Показать"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
        </button>
      </CardHeader>
      {open ? (
        <CardContent className="grid gap-4 md:grid-cols-2">
          <GuideBlock
            icon={Lightbulb}
            title="Что заполнить"
            items={fill}
          />
          <GuideBlock
            icon={Route}
            title="Где это используется"
            items={documents}
          />
        </CardContent>
      ) : null}
    </Card>
  );
}

interface FieldHintProps {
  children: React.ReactNode;
  examples?: string[];
  documents?: string[];
  muted?: boolean;
}

export function FieldHint({ children, examples = [], documents = [], muted = false }: FieldHintProps) {
  return (
    <div className={cn("grid min-h-[3.75rem] gap-2 rounded-md border px-3 py-2 text-xs font-normal leading-5", muted ? "border-slate-100 bg-slate-50 text-slate-500" : "border-sky-100 bg-sky-50 text-sky-950")}>
      <div>{children}</div>
      {examples.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {examples.map((example) => (
            <Badge key={example} variant="secondary" className="bg-white text-slate-700">
              {example}
            </Badge>
          ))}
        </div>
      ) : null}
      {documents.length > 0 ? <DocumentImpact documents={documents} /> : null}
    </div>
  );
}

export function DocumentImpact({ documents }: { documents: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
      <span className="font-medium text-slate-700">Используется в:</span>
      {documents.map((document) => (
        <Badge key={document} variant="outline" className="bg-white">
          {document}
        </Badge>
      ))}
    </div>
  );
}

interface ReadinessIndicatorProps {
  title: string;
  completed: number;
  total: number;
  note?: string;
  className?: string;
}

export function ReadinessIndicator({ title, completed, total, note, className }: ReadinessIndicatorProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className={cn("border-slate-200", className)}>
      <CardContent className="grid gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {note ? <div className="mt-1 text-xs text-muted-foreground">{note}</div> : null}
          </div>
          <Badge variant={percent >= 80 ? "success" : percent >= 50 ? "warning" : "outline"}>
            {completed} из {total}
          </Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-800" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-muted-foreground">Заполнено: {percent}%</div>
      </CardContent>
    </Card>
  );
}

export function NextStepHint({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/70">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            {title}
          </div>
          <p className="mt-1 text-sm text-emerald-900">{description}</p>
        </div>
        <a className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-800 px-4 text-sm font-medium text-white" href={href}>
          Перейти
        </a>
      </CardContent>
    </Card>
  );
}

function GuideBlock({
  icon: Icon,
  title,
  items
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-md border border-sky-100 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
        <Icon className="h-4 w-4 text-sky-800" />
        {title}
      </div>
      <ul className="mt-3 grid gap-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-800" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
