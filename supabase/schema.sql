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

alter table public.schools add column if not exists owner_id uuid references auth.users(id) on delete restrict;
alter table public.schools alter column owner_id set default auth.uid();

create table if not exists public.school_memberships (
  school_id text not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
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
  association_id text not null default '',
  infrastructure_object_id text not null default '',
  system_partner_id text not null default '',
  source_document_id text not null default '',
  source_document_title text not null default '',
  source_document_type text not null default '',
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  participants_count integer not null default 0 check (participants_count >= 0),
  short_report text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists association_id text not null default '';
alter table public.events add column if not exists infrastructure_object_id text not null default '';
alter table public.events add column if not exists system_partner_id text not null default '';
alter table public.events add column if not exists source_document_id text not null default '';
alter table public.events add column if not exists source_document_title text not null default '';
alter table public.events add column if not exists source_document_type text not null default '';
alter table public.events add column if not exists source_document_name text not null default '';
alter table public.events add column if not exists source_preview_event_id text not null default '';
alter table public.events add column if not exists import_batch_id text not null default '';
alter table public.events add column if not exists imported_at text not null default '';
alter table public.events add column if not exists imported_content_signature text not null default '';
alter table public.events add column if not exists source_type text not null default '';
alter table public.events add column if not exists source_confidence integer not null default 0;

create table if not exists public.educational_associations (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null default '',
  leader text not null default '',
  participants_count integer not null default 0 check (participants_count >= 0),
  classes text not null default '',
  photo_url text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_infrastructure_objects (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null default '',
  responsible text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.educational_system_partners (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  type text not null default '',
  cooperation_description text not null default '',
  contact_person text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.imported_documents (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  type text not null check (type in ('docx', 'pdf', 'xlsx')),
  uploaded_at timestamptz not null default now(),
  size_bytes integer not null default 0 check (size_bytes >= 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'pending', 'processed', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extracted_events (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  description text not null default '',
  date date not null,
  month integer not null check (month between 1 and 12),
  education_level text not null check (education_level in ('noo', 'ooo', 'soo')),
  module text not null default '',
  responsible text not null default '',
  source_document_id text not null,
  source_type text not null check (source_type in ('docx', 'pdf', 'xlsx')),
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  status text not null default 'found' check (status in ('found', 'selected', 'ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.normative_documents (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  title text not null,
  category text not null,
  level text not null,
  document_date date not null,
  version text not null default '',
  source text not null default '',
  actuality_status text not null default 'needs_review',
  uploaded_at timestamptz not null,
  file_name text not null default '',
  file_type text not null default '',
  size_bytes integer not null default 0,
  requirements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_processing_state (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  processed_documents jsonb not null default '[]'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.work_programs (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
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
create index if not exists events_association_id_idx on public.events(association_id);
create index if not exists events_infrastructure_object_id_idx on public.events(infrastructure_object_id);
create index if not exists events_system_partner_id_idx on public.events(system_partner_id);
create index if not exists educational_associations_school_id_idx on public.educational_associations(school_id);
create index if not exists educational_associations_school_id_status_idx on public.educational_associations(school_id, status);
create index if not exists school_infrastructure_objects_school_id_idx on public.school_infrastructure_objects(school_id);
create index if not exists educational_system_partners_school_id_idx on public.educational_system_partners(school_id);
create index if not exists imported_documents_school_id_uploaded_at_idx on public.imported_documents(school_id, uploaded_at desc);
create index if not exists extracted_events_school_id_date_idx on public.extracted_events(school_id, date);
create index if not exists extracted_events_school_id_level_idx on public.extracted_events(school_id, education_level);
create index if not exists extracted_events_source_document_id_idx on public.extracted_events(source_document_id);
create index if not exists extracurricular_school_id_status_idx on public.extracurricular_programs(school_id, status);
create index if not exists extracurricular_education_levels_idx on public.extracurricular_programs using gin(education_levels);
create index if not exists staff_school_id_idx on public.staff(school_id);
create index if not exists schools_owner_id_idx on public.schools(owner_id);
create index if not exists school_memberships_user_id_idx on public.school_memberships(user_id);
create index if not exists normative_documents_school_id_idx on public.normative_documents(school_id);
create index if not exists document_processing_state_school_id_idx on public.document_processing_state(school_id);
create index if not exists work_programs_school_id_idx on public.work_programs(school_id);

create schema if not exists private;

create or replace function private.can_access_school(target_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.schools
        where id = target_school_id and owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.school_memberships
        where school_id = target_school_id and user_id = (select auth.uid())
      )
    );
$$;

create or replace function private.can_manage_school(target_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.schools
        where id = target_school_id and owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.school_memberships
        where school_id = target_school_id
          and user_id = (select auth.uid())
          and role in ('owner', 'admin', 'member')
      )
    );
$$;

create or replace function private.can_administer_school(target_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.schools
        where id = target_school_id and owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.school_memberships
        where school_id = target_school_id
          and user_id = (select auth.uid())
          and role in ('owner', 'admin')
      )
    );
$$;

revoke all on function private.can_access_school(text) from public;
revoke all on function private.can_manage_school(text) from public;
revoke all on function private.can_administer_school(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.can_access_school(text) to authenticated;
grant execute on function private.can_manage_school(text) to authenticated;
grant execute on function private.can_administer_school(text) to authenticated;

alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;

drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools for select to authenticated
using (private.can_access_school(id));
drop policy if exists schools_insert on public.schools;
create policy schools_insert on public.schools for insert to authenticated
with check (owner_id = (select auth.uid()));
drop policy if exists schools_update on public.schools;
create policy schools_update on public.schools for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
drop policy if exists schools_delete on public.schools;
create policy schools_delete on public.schools for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists memberships_select on public.school_memberships;
create policy memberships_select on public.school_memberships for select to authenticated
using (private.can_access_school(school_id));
drop policy if exists memberships_insert on public.school_memberships;
create policy memberships_insert on public.school_memberships for insert to authenticated
with check (private.can_administer_school(school_id));
drop policy if exists memberships_update on public.school_memberships;
create policy memberships_update on public.school_memberships for update to authenticated
using (private.can_administer_school(school_id))
with check (private.can_administer_school(school_id));
drop policy if exists memberships_delete on public.school_memberships;
create policy memberships_delete on public.school_memberships for delete to authenticated
using (private.can_administer_school(school_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'partners',
    'modules',
    'events',
    'educational_associations',
    'school_infrastructure_objects',
    'educational_system_partners',
    'imported_documents',
    'extracted_events',
    'normative_documents',
    'document_processing_state',
    'work_programs',
    'extracurricular_programs',
    'staff'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.can_access_school(school_id))',
      table_name || '_select',
      table_name
    );
    execute format('drop policy if exists %I on public.%I', table_name || '_insert', table_name);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.can_manage_school(school_id))',
      table_name || '_insert',
      table_name
    );
    execute format('drop policy if exists %I on public.%I', table_name || '_update', table_name);
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.can_manage_school(school_id)) with check (private.can_manage_school(school_id))',
      table_name || '_update',
      table_name
    );
    execute format('drop policy if exists %I on public.%I', table_name || '_delete', table_name);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.can_manage_school(school_id))',
      table_name || '_delete',
      table_name
    );
  end loop;
end
$$;

grant select, insert, update, delete on public.schools to authenticated;
grant select, insert, update, delete on public.school_memberships to authenticated;
grant select, insert, update, delete on
  public.partners,
  public.modules,
  public.events,
  public.educational_associations,
  public.school_infrastructure_objects,
  public.educational_system_partners,
  public.imported_documents,
  public.extracted_events,
  public.normative_documents,
  public.document_processing_state,
  public.work_programs,
  public.extracurricular_programs,
  public.staff
to authenticated;

revoke all on all tables in schema public from anon;
