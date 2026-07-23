"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { Button } from "@/components/ui/button";
import { isSupabaseBackendEnabled } from "@/lib/data-access/backend-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthStatus() {
  const { mode } = useAppState();
  const [email, setEmail] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const enabled = mode === "work" && isSupabaseBackendEnabled();

  React.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const client = createSupabaseBrowserClient();
    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (mounted) {
        setEmail(data.session?.user.email ?? null);
        setIsLoading(false);
      }
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setEmail(session?.user.email ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [enabled]);

  if (!enabled || isLoading) {
    return null;
  }

  if (!email) {
    return (
      <Button asChild variant="outline" className="mb-4">
        <Link href="/login">
          <LogIn className="h-4 w-4" />
          Войти в рабочий контур
        </Link>
      </Button>
    );
  }

  async function signOut() {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white px-4 py-3 text-sm">
      <div>
        <div className="text-xs text-muted-foreground">Рабочий контур Supabase</div>
        <div className="font-medium">{email}</div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4" />
        Выйти
      </Button>
    </div>
  );
}
