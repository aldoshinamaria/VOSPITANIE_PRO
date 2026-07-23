"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { useAppState } from "@/components/app/app-provider";
import { getNavItemsForMode } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

const BRAND = "\u0412\u043e\u0441\u043f\u0438\u0442\u0430\u043d\u0438\u0435.PRO";
const SUBTITLE = "\u0420\u0430\u0431\u043e\u0447\u0435\u0435 \u043c\u0435\u0441\u0442\u043e \u0437\u0430\u043c\u0435\u0441\u0442\u0438\u0442\u0435\u043b\u044f \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440\u0430";
const OPEN_MENU = "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e";
const CLOSE_MENU = "\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e";
const MAIN_MENU = "\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e";
const DEMO_STATUS = "\u0414\u0435\u043c\u043e-\u0434\u0430\u043d\u043d\u044b\u0435 \u0438\u0437\u043e\u043b\u0438\u0440\u043e\u0432\u0430\u043d\u044b \u043e\u0442 \u0440\u0430\u0431\u043e\u0447\u0435\u0439 \u0448\u043a\u043e\u043b\u044b";
const WORK_STATUS = "\u0420\u0430\u0431\u043e\u0447\u0438\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u0432 \u044d\u0442\u043e\u043c \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435";

export function Sidebar() {
  const pathname = usePathname();
  const { mode } = useAppState();
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const visibleNavItems = React.useMemo(() => (hasMounted ? getNavItemsForMode(mode) : []), [mode, hasMounted]);
  const isPublicDemoHost = hasMounted && window.location.hostname === "vospitanie-pro.vercel.app";
  const homeHref = mode === "demo" ? "/demo" : isPublicDemoHost ? "/work" : "/";
  const groupedItems = visibleNavItems.reduce(
    (groups, item) => {
      const group = groups.find((current) => current.title === item.group);

      if (group) {
        group.items.push(item);
      } else {
        groups.push({ title: item.group, items: [item] });
      }

      return groups;
    },
    [] as { title: (typeof visibleNavItems)[number]["group"]; items: (typeof visibleNavItems)[number][] }[]
  );

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-slate-950 px-4 text-white shadow-sm lg:hidden">
        <Link href={homeHref} className="min-w-0">
          <div className="truncate text-base font-semibold tracking-normal">{BRAND}</div>
          <div className="truncate text-xs text-slate-300">{SUBTITLE}</div>
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={() => setIsOpen(true)}
          aria-label={OPEN_MENU}
          aria-expanded={isOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 opacity-0 transition-opacity lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-label={CLOSE_MENU}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(88vw,20rem)] shrink-0 flex-col border-r bg-slate-950 text-white transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:min-h-screen lg:w-72 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-5">
          <Link href={homeHref} className="min-w-0">
            <div className="truncate text-lg font-semibold tracking-normal">{BRAND}</div>
            <div className="mt-1 truncate text-sm text-slate-300">{SUBTITLE}</div>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-label={CLOSE_MENU}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3" aria-label={MAIN_MENU}>
          {groupedItems.map((group) => (
            <div key={group.title} className="grid gap-1">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const href = isPublicDemoHost && mode === "work" && item.href === "/" ? "/work" : item.href;
                const isActive = pathname === item.href || pathname === href;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      isActive && "bg-white text-slate-950 hover:bg-white hover:text-slate-950"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 text-xs text-slate-400">
          {mode === "demo" ? DEMO_STATUS : WORK_STATUS}
        </div>
      </aside>
    </>
  );
}
