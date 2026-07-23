import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseBrowserClient = SupabaseClient;

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: SchoolRow;
        Insert: SchoolInsert;
        Update: Partial<SchoolInsert>;
      };
      partners: {
        Row: PartnerRow;
        Insert: PartnerInsert;
        Update: Partial<PartnerInsert>;
      };
      modules: {
        Row: ModuleRow;
        Insert: ModuleInsert;
        Update: Partial<ModuleInsert>;
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: Partial<EventInsert>;
      };
      educational_associations: {
        Row: EducationalAssociationRow;
        Insert: EducationalAssociationInsert;
        Update: Partial<EducationalAssociationInsert>;
      };
      school_infrastructure_objects: {
        Row: SchoolInfrastructureObjectRow;
        Insert: SchoolInfrastructureObjectInsert;
        Update: Partial<SchoolInfrastructureObjectInsert>;
      };
      educational_system_partners: {
        Row: EducationalSystemPartnerRow;
        Insert: EducationalSystemPartnerInsert;
        Update: Partial<EducationalSystemPartnerInsert>;
      };
      imported_documents: {
        Row: ImportedDocumentRow;
        Insert: ImportedDocumentInsert;
        Update: Partial<ImportedDocumentInsert>;
      };
      extracted_events: {
        Row: ExtractedEventRow;
        Insert: ExtractedEventInsert;
        Update: Partial<ExtractedEventInsert>;
      };
      normative_documents: {
        Row: NormativeDocumentRow;
        Insert: NormativeDocumentInsert;
        Update: Partial<NormativeDocumentInsert>;
      };
      document_processing_state: {
        Row: DocumentProcessingStateRow;
        Insert: DocumentProcessingStateInsert;
        Update: Partial<DocumentProcessingStateInsert>;
      };
      work_programs: {
        Row: WorkProgramRow;
        Insert: WorkProgramInsert;
        Update: Partial<WorkProgramInsert>;
      };
      extracurricular_programs: {
        Row: ExtracurricularProgramRow;
        Insert: ExtracurricularProgramInsert;
        Update: Partial<ExtracurricularProgramInsert>;
      };
      staff: {
        Row: StaffRow;
        Insert: StaffInsert;
        Update: Partial<StaffInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface SchoolRow {
  id: string;
  name: string;
  region: string;
  municipality: string;
  address: string;
  principal: string;
  deputy_director: string;
  academic_year: string;
  students_count: number;
  classes_count: number;
  infrastructure: Record<string, unknown>;
  updated_at: string;
}

export type SchoolInsert = SchoolRow;

export interface PartnerRow {
  id: string;
  school_id: string;
  name: string;
  type: string;
  activity: string;
  created_at?: string;
  updated_at?: string;
}

export type PartnerInsert = Omit<PartnerRow, "created_at" | "updated_at">;

export interface ModuleRow {
  id: string;
  school_id: string;
  title: string;
  description: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ModuleInsert = Omit<ModuleRow, "created_at" | "updated_at">;

export interface EventRow {
  id: string;
  school_id: string;
  title: string;
  description: string;
  module_id: string;
  direction: string;
  education_levels: string[];
  classes: string;
  start_date: string;
  end_date: string;
  month: number;
  venue: string;
  responsible: string;
  co_executors: string;
  partner: string;
  association_id: string;
  infrastructure_object_id: string;
  system_partner_id: string;
  source_document_id: string;
  source_document_title: string;
  source_document_type: string;
  source_document_name: string;
  source_preview_event_id: string;
  import_batch_id: string;
  imported_at: string;
  imported_content_signature: string;
  source_type: string;
  source_confidence: number;
  status: string;
  participants_count: number;
  short_report: string;
  priority: string;
  created_at?: string;
  updated_at?: string;
}

export type EventInsert = Omit<EventRow, "created_at" | "updated_at">;

export interface EducationalAssociationRow {
  id: string;
  school_id: string;
  type: string;
  title: string;
  description: string;
  leader: string;
  participants_count: number;
  classes: string;
  photo_url: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type EducationalAssociationInsert = Omit<EducationalAssociationRow, "created_at" | "updated_at">;

export interface SchoolInfrastructureObjectRow {
  id: string;
  school_id: string;
  type: string;
  title: string;
  description: string;
  responsible: string;
  created_at?: string;
  updated_at?: string;
}

export type SchoolInfrastructureObjectInsert = Omit<SchoolInfrastructureObjectRow, "created_at" | "updated_at">;

export interface EducationalSystemPartnerRow {
  id: string;
  school_id: string;
  title: string;
  type: string;
  cooperation_description: string;
  contact_person: string;
  created_at?: string;
  updated_at?: string;
}

export type EducationalSystemPartnerInsert = Omit<EducationalSystemPartnerRow, "created_at" | "updated_at">;

export interface ImportedDocumentRow {
  id: string;
  school_id: string;
  title: string;
  type: string;
  uploaded_at: string;
  size_bytes: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type ImportedDocumentInsert = Omit<ImportedDocumentRow, "created_at" | "updated_at">;

export interface ExtractedEventRow {
  id: string;
  school_id: string;
  title: string;
  description: string;
  date: string;
  month: number;
  education_level: string;
  module: string;
  responsible: string;
  source_document_id: string;
  source_type: string;
  confidence: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type ExtractedEventInsert = Omit<ExtractedEventRow, "created_at" | "updated_at">;

export interface NormativeDocumentRow {
  id: string;
  school_id: string;
  title: string;
  category: string;
  level: string;
  document_date: string;
  version: string;
  source: string;
  actuality_status: string;
  uploaded_at: string;
  file_name: string;
  file_type: string;
  size_bytes: number;
  requirements: unknown;
  created_at?: string;
  updated_at?: string;
}

export type NormativeDocumentInsert = Omit<NormativeDocumentRow, "created_at" | "updated_at">;

export interface DocumentProcessingStateRow {
  id: string;
  school_id: string;
  processed_documents: unknown;
  logs: unknown;
  updated_at?: string;
}

export type DocumentProcessingStateInsert = DocumentProcessingStateRow;

export interface WorkProgramRow {
  id: string;
  school_id: string;
  data: unknown;
  updated_at?: string;
}

export type WorkProgramInsert = WorkProgramRow;

export interface ExtracurricularProgramRow {
  id: string;
  school_id: string;
  title: string;
  type: string;
  area: string;
  education_levels: string[];
  classes: string;
  teacher: string;
  classroom: string;
  schedule: string;
  weekly_hours: number;
  total_hours: number;
  students_count: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type ExtracurricularProgramInsert = Omit<ExtracurricularProgramRow, "created_at" | "updated_at">;

export interface StaffRow {
  id: string;
  school_id: string;
  full_name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export type StaffInsert = Omit<StaffRow, "created_at" | "updated_at">;

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase не настроен: укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY в .env.local."
    );
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
