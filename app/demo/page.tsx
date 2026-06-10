"use client";

import { ArrowRight, Loader2, Rocket } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";

export default function DemoPage() {
  const { updateState, error } = useAppState();
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const factory = React.useMemo(() => createDemoSchoolFactory(), []);

  React.useEffect(() => {
    let mounted = true;

    updateState(() => factory.createDemoSchool("urban"))
      .then(() => {
        if (mounted) {
          setLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setFailed(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [factory, updateState]);

  return (
    <>
      <PageHeader
        title="Демо Воспитание.PRO"
        description="Готовая демо-школа для знакомства с КПВР, рабочей программой, контролем исполнения, отчетами и центром проверок."
      />

      <Card className="border-sky-200 bg-sky-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-sky-800" />
            {loaded ? "Демо-школа загружена" : failed ? "Не удалось загрузить демо автоматически" : "Загружаю демо-школу"}
          </CardTitle>
          <CardDescription>
            {loaded
              ? "Можно показывать продукт: данные уже заполнены, разделы готовы к просмотру."
              : failed
                ? "Попробуйте загрузить демо вручную с главной страницы."
                : "Это займет несколько секунд. После загрузки откройте любой раздел из списка ниже."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {!loaded && !failed ? (
            <div className="flex items-center gap-2 text-sm text-sky-900">
              <Loader2 className="h-4 w-4 animate-spin" />
              Подготовка демо-данных...
            </div>
          ) : null}
          <DemoLink href="/" title="Главная панель" disabled={!loaded} />
          <DemoLink href="/kpvr" title="КПВР" disabled={!loaded} />
          <DemoLink href="/work-program" title="Рабочая программа" disabled={!loaded} />
          <DemoLink href="/inspection-center" title="Центр проверок" disabled={!loaded} />
        </CardContent>
      </Card>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </>
  );
}

function DemoLink({ href, title, disabled }: { href: string; title: string; disabled: boolean }) {
  if (disabled) {
    return (
      <Button variant="outline" className="justify-start" disabled>
        {title}
        <ArrowRight className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" className="justify-start">
      <Link href={href}>
        {title}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
