create table if not exists public.schools (
  id text primary key,
  name text not null,
  region text not null,
  municipality text not null,
  address text not null,
  principal text not null,
  deputy_director text not null,
  academic_year text not null,
  students_count integer not null default 0 check (students_count >= 0),
  classes_count integer not null default 0 check (classes_count >= 0),
  infrastructure jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  type text not null default '',
  activity text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  description text not null default '',
  module_id text not null,
  direction text not null default '',
  education_levels text[] not null default array[]::text[],
  classes text not null default '',
  start_date date not null,
  end_date date not null,
  month integer not null check (month between 1 and 12),
  venue text not null default '',
  responsible text not null default '',
  co_executors text not null default '',
  partner text not null default '',
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  participants_count integer not null default 0 check (participants_count >= 0),
  short_report text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extracurricular_programs (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  type text not null default 'extracurricular' check (type in ('extracurricular', 'additional_education')),
  area text not null default '',
  education_levels text[] not null default array[]::text[],
  classes text not null default '',
  teacher text not null default '',
  classroom text not null default '',
  schedule text not null default '',
  weekly_hours numeric not null default 0 check (weekly_hours >= 0),
  total_hours numeric not null default 0 check (total_hours >= 0),
  students_count integer not null default 0 check (students_count >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  full_name text not null,
  role text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partners_school_id_idx on public.partners(school_id);
create index if not exists modules_school_id_idx on public.modules(school_id);
create index if not exists modules_school_id_active_idx on public.modules(school_id, active);
create index if not exists events_school_id_start_date_idx on public.events(school_id, start_date);
create index if not exists events_school_id_month_idx on public.events(school_id, month);
create index if not exists events_school_id_module_id_idx on public.events(school_id, module_id);
create index if not exists events_education_levels_idx on public.events using gin(education_levels);
create index if not exists extracurricular_school_id_status_idx on public.extracurricular_programs(school_id, status);
create index if not exists extracurricular_education_levels_idx on public.extracurricular_programs using gin(education_levels);
create index if not exists staff_school_id_idx on public.staff(school_id);
