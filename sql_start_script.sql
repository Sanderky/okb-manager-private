-- 1. KONFIGURACJA I FUNKCJE
create type attachment_type as enum ('contract', 'id_card', 'a1', 'medical', 'other');
create or replace function public.handle_updated_at() returns trigger security definer
set search_path = '' as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
-- 2. KONTRAHENCI
create table contractors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now(),
  note text
);
create unique index contractors_name_unique_idx on contractors (lower(name));
-- 3. USTAWIENIA ALERTOW
create table alert_settings (
  id int primary key default 1 check (id = 1),
  a1_warning int not null default 30,
  a1_critical int not null default 7,
  contract_warning int not null default 30,
  contract_critical int not null default 7,
  updated_at timestamptz default now()
);
create trigger on_alert_settings_updated before
update on alert_settings for each row execute procedure handle_updated_at();
insert into alert_settings (
    id,
    a1_warning,
    a1_critical,
    contract_warning,
    contract_critical
  )
values (1, 30, 7, 30, 7) on conflict do nothing;
-- 4. NOTATKI DOMOWE
create table home_notes (
  id text primary key,
  note text,
  updated_at timestamptz default now()
);
create trigger on_home_notes_updated before
update on home_notes for each row execute procedure handle_updated_at();
insert into home_notes (id, note)
values ('home', '') on conflict do nothing;
-- 5. PRACOWNICY
create table employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status boolean default true,
  is_contractor boolean default false,
  pesel text,
  birth_date date,
  birth_place text,
  address text,
  email text,
  phone text,
  hour_rate numeric(10, 2),
  account_number text,
  contract_start_date date,
  contract_end_date date,
  contract_is_permanent boolean,
  a1_start_date date,
  a1_end_date date,
  note text,
  created_at timestamptz default now()
);
create index employees_status_idx on employees(status);
-- 6. BUDOWY
create table constructions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status boolean not null default true,
  location text,
  contractor_id uuid references contractors(id) on delete
  set null,
    start_date date,
    end_date date,
    note text,
    created_at timestamptz default now()
);
create index constructions_contractor_id_idx on constructions(contractor_id);
-- 7. ZALACZNIKI
create table employee_attachments (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  content_type text,
  type attachment_type not null default 'other',
  created_at timestamptz default now()
);
create index employee_attachments_employee_id_idx on employee_attachments(employee_id);
-- 8. URLOPY
create table vacations (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  group_id uuid default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  color text,
  description text,
  created_at timestamptz default now(),
  constraint vacations_dates_check check (end_date >= start_date)
);
create index vacations_employee_id_idx on vacations(employee_id);
create index vacations_dates_idx on vacations(start_date, end_date);
-- 9. GRAFIK PRACY (SCHEDULES)
create table daily_schedules (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  construction_id uuid references constructions(id) on delete cascade not null,
  date date not null,
  created_at timestamptz default now(),
  constraint daily_schedules_employee_id_date_key unique (employee_id, date)
);
create index daily_schedules_date_idx on daily_schedules(date);
create index daily_schedules_employee_id_idx on daily_schedules(employee_id);
create index daily_schedules_construction_id_idx on daily_schedules(construction_id);
-- 10. LOGI PRACY
create table work_logs (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  construction_id uuid references constructions(id) on delete cascade not null,
  date date not null,
  hours numeric(4, 1) not null default 0,
  created_at timestamptz default now(),
  constraint work_logs_employee_id_construction_id_date_key unique (employee_id, construction_id, date)
);
create index work_logs_date_idx on work_logs(date);
create index work_logs_employee_id_idx on work_logs(employee_id);
create index work_logs_construction_id_idx on work_logs(construction_id);
-- 11. KALENDARZ (EVENTS)
create table calendar_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  start_date date not null,
  end_date date not null,
  category text not null default 'other',
  color text not null default 'blue',
  is_auto_generated boolean not null default false,
  title text,
  description text,
  group_id uuid,
  constraint calendar_events_dates_check check (end_date >= start_date),
  constraint calendar_events_category_check check (
    category in (
      'accounting',
      'payroll',
      'lodging',
      'info',
      'other'
    )
  ),
  constraint calendar_events_color_check check (
    color in (
      'red',
      'orange',
      'blue',
      'green',
      'primary',
      'secondary'
    )
  )
);
create index calendar_events_dates_idx on calendar_events(start_date, end_date);
create index calendar_events_category_idx on calendar_events(category);
create index calendar_events_auto_gen_idx on calendar_events(is_auto_generated);
create table calendar_event_employees (
  event_id uuid references calendar_events(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  primary key (event_id, employee_id)
);
create index idx_calendar_event_employees_employee on calendar_event_employees(employee_id);
create table calendar_event_constructions (
  event_id uuid references calendar_events(id) on delete cascade not null,
  construction_id uuid references constructions(id) on delete cascade not null,
  primary key (event_id, construction_id)
);
create index idx_calendar_event_constructions_construction on calendar_event_constructions(construction_id);
-- 12. NOCLEGI
create table lodgings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  address text not null,
  start_date date not null,
  end_date date not null,
  description text,
  constraint lodgings_dates_check check (end_date >= start_date)
);
create table lodging_employees (
  lodging_id uuid references lodgings(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  primary key (lodging_id, employee_id)
);
create index idx_lodging_employees_employee on lodging_employees(employee_id);
-- 13. WIDOK ALERTS
create or replace view view_employee_alerts with (security_invoker = true) as
select e.id || '_contract' as id,
  e.id as employee_id,
  e.name as employee_name,
  case
    when (e.contract_end_date - current_date) <= s.contract_critical then 'error'
    else 'warning'
  end as severity,
  'contract' as type,
  e.contract_end_date as expiry_date,
  (e.contract_end_date - current_date) as days_remaining,
  1 as type_priority
from employees e
  cross join alert_settings s
where e.status = true
  and e.contract_end_date is not null
  and (e.contract_end_date - current_date) <= s.contract_warning
UNION ALL
select e.id || '_a1' as id,
  e.id as employee_id,
  e.name as employee_name,
  case
    when (e.a1_end_date - current_date) <= s.a1_critical then 'error'
    else 'warning'
  end as severity,
  'a1' as type,
  e.a1_end_date as expiry_date,
  (e.a1_end_date - current_date) as days_remaining,
  2 as type_priority
from employees e
  cross join alert_settings s
where e.status = true
  and e.a1_end_date is not null
  and (e.a1_end_date - current_date) <= s.a1_warning;
-- 14. POLITYKI BEZPIECZENSTWA (RLS)
insert into storage.buckets (id, name, public)
values ('files', 'files', false) on conflict (id) do
update
set public = false;
drop policy if exists "Public read" on storage.objects;
drop policy if exists "Auth access" on storage.objects;
drop policy if exists "Give me access" on storage.objects;
create policy "Auth access" on storage.objects for all to authenticated using (bucket_id = 'files') with check (bucket_id = 'files');
alter table employees enable row level security;
alter table contractors enable row level security;
alter table constructions enable row level security;
alter table employee_attachments enable row level security;
alter table vacations enable row level security;
alter table daily_schedules enable row level security;
alter table work_logs enable row level security;
alter table alert_settings enable row level security;
alter table home_notes enable row level security;
alter table calendar_events enable row level security;
alter table calendar_event_employees enable row level security;
alter table calendar_event_constructions enable row level security;
alter table lodgings enable row level security;
alter table lodging_employees enable row level security;
create policy "Auth All" on employees for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on contractors for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on constructions for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on employee_attachments for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on vacations for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on daily_schedules for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on work_logs for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on alert_settings for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on home_notes for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on calendar_events for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on calendar_event_employees for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on calendar_event_constructions for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on lodgings for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
create policy "Auth All" on lodging_employees for all using (
  (
    select auth.role()
  ) = 'authenticated'
);
-- 15. UPRAWNIENIA (Zapobiega błędom 403)
GRANT USAGE ON SCHEMA public TO postgres,
  anon,
  authenticated,
  service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres,
  anon,
  authenticated,
  service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres,
  anon,
  authenticated,
  service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres,
  anon,
  authenticated,
  service_role;