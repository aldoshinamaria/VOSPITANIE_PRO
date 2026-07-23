"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseBackendEnabled } from "@/lib/data-access/backend-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<AuthMode>("sign-in");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const enabled = isSupabaseBackendEnabled();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const client = createSupabaseBrowserClient();

      if (mode === "sign-up") {
        const { data, error: authError } = await client.auth.signUp({ email, password });

        if (authError) {
          throw authError;
        }

        if (!data.session) {
          setMessage("Аккаунт создан. Подтвердите адрес электронной почты, затем войдите.");
          setMode("sign-in");
          return;
        }
      } else {
        const { error: authError } = await client.auth.signInWithPassword({ email, password });

        if (authError) {
          throw authError;
        }
      }

      router.push("/launch-readiness");
      router.refresh();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Вход в рабочий контур"
        description="Авторизация отделяет данные школ и позволяет серверным политикам проверить доступ пользователя."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{mode === "sign-in" ? "Вход" : "Создание аккаунта"}</CardTitle>
          <CardDescription>
            Используйте рабочий адрес. Пароль передаётся напрямую в Supabase Auth и не сохраняется приложением.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!enabled ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Серверный контур ещё не включён. Для локальной работы данные продолжают безопасно храниться только в этом браузере.
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={submit}>
              <label className="grid gap-2 text-sm font-medium">
                Электронная почта
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Пароль
                <Input
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {message ? <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">{message}</div> : null}
              {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-900">{error}</div> : null}
              <Button type="submit" disabled={isSubmitting}>
                {mode === "sign-in" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isSubmitting ? "Подождите…" : mode === "sign-in" ? "Войти" : "Создать аккаунт"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
                  setError(null);
                  setMessage(null);
                }}
              >
                {mode === "sign-in" ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("email rate limit exceeded")) {
    return "Превышен лимит писем подтверждения Supabase. Подождите и повторите регистрацию позже.";
  }

  if (message.includes("Invalid login credentials")) {
    return "Неверная электронная почта или пароль.";
  }

  if (message.includes("Email not confirmed")) {
    return "Сначала подтвердите электронную почту по ссылке из письма.";
  }

  return message || "Не удалось выполнить вход.";
}
