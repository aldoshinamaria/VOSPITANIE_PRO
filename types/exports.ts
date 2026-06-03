export interface ExportDocument {
  id: string;
  title: string;
  description: string;
  format: "docx" | "xlsx" | "pdf";
  source: "school-passport" | "events" | "kpvr" | "extra-activities";
}
