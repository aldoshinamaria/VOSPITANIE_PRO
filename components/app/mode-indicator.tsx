"use client";

import { MonitorPlay } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { Badge } from "@/components/ui/badge";

export function ModeIndicator() {
  const { mode } = useAppState();

  if (mode !== "demo") {
    return null;
  }

  return (
    <div className="mb-4 flex justify-end">
      <Badge variant="secondary" className="gap-2 px-3 py-1 text-xs uppercase tracking-wide">
        <MonitorPlay className="h-3.5 w-3.5" />
        DEMO MODE
      </Badge>
    </div>
  );
}
