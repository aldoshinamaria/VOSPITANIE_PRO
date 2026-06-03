import type { Metadata } from "next";

import { AppProvider } from "@/components/app/app-provider";
import { PageShell } from "@/components/app/page-shell";
import { mockAppState } from "@/data/mock-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Воспитание.PRO",
  description: "MVP рабочего места заместителя директора по воспитательной работе"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AppProvider initialState={mockAppState}>
          <PageShell>{children}</PageShell>
        </AppProvider>
      </body>
    </html>
  );
}
