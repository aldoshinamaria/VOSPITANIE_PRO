import type { ReactNode } from "react";

import { DataStatus } from "@/components/app/data-status";
import { Sidebar } from "@/components/app/sidebar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <div className="flex min-w-0">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-6 pt-20 sm:px-6 lg:px-8 lg:py-6">
          <DataStatus />
          {children}
        </main>
      </div>
    </div>
  );
}
