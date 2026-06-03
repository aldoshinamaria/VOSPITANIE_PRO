import type { EducationModule } from "@/types/modules";
import type { ExportDocument } from "@/types/exports";
import type { ExtraActivity } from "@/types/extra-activities";
import type { KpvrItem } from "@/types/kpvr";
import type { SchoolEvent } from "@/types/events";
import type { SchoolPassport } from "@/types/school";

export interface AppState {
  schoolPassport: SchoolPassport;
  educationModules: EducationModule[];
  events: SchoolEvent[];
  kpvr: KpvrItem[];
  extraActivities: ExtraActivity[];
  exportDocuments: ExportDocument[];
}
