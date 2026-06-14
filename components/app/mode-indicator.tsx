"use client";

import { Database, MonitorPlay } from "lucide-react";

import { useAppState } from "@/components/app/app-provider";
import { Badge } from "@/components/ui/badge";

export function ModeIndicator() {
  const { mode } = useAppState();
  const isDemo = mode === "demo";
  const Icon = isDemo ? MonitorPlay : Database;

  return (
    <div className="mb-4 flex justify-end">
      <Badge variant={isDemo ? "secondary" : "outline"} className="gap-2 px-3 py-1 text-xs uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {isDemo ? "DEMO MODE" : "WORK MODE"}
      </Badge>
    </div>
  );
}

