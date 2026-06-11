"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function ResponsiveDisclosure({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const detailsRef = React.useRef<HTMLDetailsElement>(null);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");

    function syncOpenState() {
      if (detailsRef.current) {
        detailsRef.current.open = query.matches;
      }
    }

    syncOpenState();
    query.addEventListener("change", syncOpenState);

    return () => query.removeEventListener("change", syncOpenState);
  }, []);

  return (
    <details ref={detailsRef} className={cn("group rounded-lg border bg-white shadow-sm", className)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 md:hidden">
        <span>
          <span className="block font-semibold">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t p-4 md:border-t-0">{children}</div>
    </details>
  );
}
