import type { ReactNode } from "react";

import { DataStatus } from "@/components/app/data-status";
import { Sidebar } from "@/components/app/sidebar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">
          <DataStatus />
          {children}
        </main>
      </div>
    </div>
  );
}
