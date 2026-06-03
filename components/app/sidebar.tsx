"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r bg-slate-950 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-lg font-semibold tracking-normal">Воспитание.PRO</div>
        <div className="mt-1 text-sm text-slate-300">Рабочее место заместителя директора</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
                isActive && "bg-white text-slate-950 hover:bg-white hover:text-slate-950"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-slate-400">Данные сохраняются в этом браузере</div>
    </aside>
  );
}
