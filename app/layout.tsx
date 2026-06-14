import type { Metadata } from "next";

import { AppProvider } from "@/components/app/app-provider";
import { PageShell } from "@/components/app/page-shell";
import { createEmptySchoolState } from "@/lib/domain/empty-school-state";
import "./globals.css";

export const metadata: Metadata = {
  title: "Воспитание.PRO",
  description: "MVP рабочего места заместителя директора по воспитательной работе"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AppProvider initialState={createEmptySchoolState()}>
          <PageShell>{children}</PageShell>
        </AppProvider>
      </body>
    </html>
  );
}
