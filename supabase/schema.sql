-- Family Hub Database Schema
-- Run this in the Supabase SQL Editor after creating your project.
-- All tables are created first, then RLS is enabled and policies are added.

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  display_name text,
  created_at timestamptz default now(),
  unique(family_id, user_id)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  amount decimal(10,2) not null,
  type text not null default 'expense' check (type in ('income', 'expense')),
  category text not null check (category in ('food','health','home','baby','transport','entertainment','other')),
  description text,
  date date not null,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  created_by uuid references auth.users(id) not null,
  assigned_to uuid references auth.users(id),
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  recurrence text not null default 'none' check (recurrence in ('none','daily','weekly','monthly')),
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  created_by uuid references auth.users(id) not null,
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean default false,
  created_at timestamptz default now()
);

create table if not exists baby_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  logged_by uuid references auth.users(id) not null,
  type text not null check (type in ('feed','sleep','diaper','milestone')),
  timestamp timestamptz not null default now(),
  duration_minutes int,
  notes text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  created_by uuid references auth.users(id) not null,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references shopping_lists(id) on delete cascade not null,
  name text not null,
  quantity text,
  checked boolean default false,
  added_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  created_by uuid references auth.users(id) not null,
  title text not null,
  content text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at ON NOTES
-- ─────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ─────────────────────────────────────────

alter table families        enable row level security;
alter table family_members  enable row level security;
alter table expenses        enable row level security;
alter table tasks           enable row level security;
alter table appointments    enable row level security;
alter table baby_logs       enable row level security;
alter table shopping_lists  enable row level security;
alter table shopping_items  enable row level security;
alter table notes           enable row level security;

-- ─────────────────────────────────────────
-- FAMILIES POLICIES
-- ─────────────────────────────────────────

create policy "Members can view their family" on families
  for select using (
    exists (
      select 1 from family_members
      where family_members.family_id = families.id
        and family_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create families" on families
  for insert with check (auth.uid() is not null);

create policy "Admins can update their family" on families
  for update using (
    exists (
      select 1 from family_members
      where family_members.family_id = families.id
        and family_members.user_id = auth.uid()
        and family_members.role = 'admin'
    )
  );

-- ─────────────────────────────────────────
-- FAMILY_MEMBERS POLICIES
-- ─────────────────────────────────────────

create policy "Members can view family members" on family_members
  for select using (
    exists (
      select 1 from family_members fm2
      where fm2.family_id = family_members.family_id
        and fm2.user_id = auth.uid()
    )
  );

create policy "Users can insert themselves" on family_members
  for insert with check (auth.uid() = user_id);

create policy "Members can update their own record" on family_members
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- EXPENSES POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view expenses" on expenses
  for select using (
    exists (select 1 from family_members where family_id = expenses.family_id and user_id = auth.uid())
  );

create policy "Family members can insert expenses" on expenses
  for insert with check (
    exists (select 1 from family_members where family_id = expenses.family_id and user_id = auth.uid())
  );

create policy "Expense owners can update" on expenses
  for update using (user_id = auth.uid());

create policy "Expense owners can delete" on expenses
  for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────
-- TASKS POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view tasks" on tasks
  for select using (
    exists (select 1 from family_members where family_id = tasks.family_id and user_id = auth.uid())
  );

create policy "Family members can insert tasks" on tasks
  for insert with check (
    exists (select 1 from family_members where family_id = tasks.family_id and user_id = auth.uid())
  );

create policy "Family members can update tasks" on tasks
  for update using (
    exists (select 1 from family_members where family_id = tasks.family_id and user_id = auth.uid())
  );

create policy "Task creators can delete" on tasks
  for delete using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- APPOINTMENTS POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view appointments" on appointments
  for select using (
    exists (select 1 from family_members where family_id = appointments.family_id and user_id = auth.uid())
  );

create policy "Family members can insert appointments" on appointments
  for insert with check (
    exists (select 1 from family_members where family_id = appointments.family_id and user_id = auth.uid())
  );

create policy "Family members can update appointments" on appointments
  for update using (
    exists (select 1 from family_members where family_id = appointments.family_id and user_id = auth.uid())
  );

create policy "Appointment creators can delete" on appointments
  for delete using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- BABY_LOGS POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view baby logs" on baby_logs
  for select using (
    exists (select 1 from family_members where family_id = baby_logs.family_id and user_id = auth.uid())
  );

create policy "Family members can insert baby logs" on baby_logs
  for insert with check (
    exists (select 1 from family_members where family_id = baby_logs.family_id and user_id = auth.uid())
  );

create policy "Log owners can update" on baby_logs
  for update using (logged_by = auth.uid());

create policy "Log owners can delete" on baby_logs
  for delete using (logged_by = auth.uid());

-- ─────────────────────────────────────────
-- SHOPPING_LISTS POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view shopping lists" on shopping_lists
  for select using (
    exists (select 1 from family_members where family_id = shopping_lists.family_id and user_id = auth.uid())
  );

create policy "Family members can insert shopping lists" on shopping_lists
  for insert with check (
    exists (select 1 from family_members where family_id = shopping_lists.family_id and user_id = auth.uid())
  );

create policy "Family members can update shopping lists" on shopping_lists
  for update using (
    exists (select 1 from family_members where family_id = shopping_lists.family_id and user_id = auth.uid())
  );

create policy "List creators can delete" on shopping_lists
  for delete using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- SHOPPING_ITEMS POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view shopping items" on shopping_items
  for select using (
    exists (
      select 1 from shopping_lists sl
      join family_members fm on fm.family_id = sl.family_id
      where sl.id = shopping_items.list_id and fm.user_id = auth.uid()
    )
  );

create policy "Family members can insert shopping items" on shopping_items
  for insert with check (
    exists (
      select 1 from shopping_lists sl
      join family_members fm on fm.family_id = sl.family_id
      where sl.id = shopping_items.list_id and fm.user_id = auth.uid()
    )
  );

create policy "Family members can update shopping items" on shopping_items
  for update using (
    exists (
      select 1 from shopping_lists sl
      join family_members fm on fm.family_id = sl.family_id
      where sl.id = shopping_items.list_id and fm.user_id = auth.uid()
    )
  );

create policy "Family members can delete shopping items" on shopping_items
  for delete using (
    exists (
      select 1 from shopping_lists sl
      join family_members fm on fm.family_id = sl.family_id
      where sl.id = shopping_items.list_id and fm.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- NOTES POLICIES
-- ─────────────────────────────────────────

create policy "Family members can view notes" on notes
  for select using (
    exists (select 1 from family_members where family_id = notes.family_id and user_id = auth.uid())
  );

create policy "Family members can insert notes" on notes
  for insert with check (
    exists (select 1 from family_members where family_id = notes.family_id and user_id = auth.uid())
  );

create policy "Family members can update notes" on notes
  for update using (
    exists (select 1 from family_members where family_id = notes.family_id and user_id = auth.uid())
  );

create policy "Note creators can delete" on notes
  for delete using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- REALTIME (optional – for shopping items live sync)
-- ─────────────────────────────────────────

alter publication supabase_realtime add table shopping_items;
