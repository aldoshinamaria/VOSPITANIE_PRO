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
  infrastructure: Record<string, boolean>;
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
  status: string;
  participants_count: number;
  short_report: string;
  priority: string;
  created_at?: string;
  updated_at?: string;
}

export type EventInsert = Omit<EventRow, "created_at" | "updated_at">;

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
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase не настроен: укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
