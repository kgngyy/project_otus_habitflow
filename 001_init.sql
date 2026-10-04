-- ============================================================================
--  HabitFlow — начальная схема БД (Supabase / PostgreSQL 15+)
--  Запускать целиком в Supabase → SQL Editor → Run.
--  Идемпотентен: можно перезапускать.
-- ============================================================================

begin;

-- ---------------------------------------------------------------- 0. Расширения
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ---------------------------------------------------------------- 1. profiles
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Публичный профиль, 1:1 с auth.users. Создаётся триггером при регистрации.';

-- ---------------------------------------------------------------- 2. habits
create table if not exists public.habits (
  id         uuid primary key default gen_random_uuid(),
  -- default auth.uid(): клиенту не нужно передавать user_id,
  -- а RLS with check не даст подставить чужой id.
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  name       text not null,
  color      text not null default '#4f8cff',
  days       integer[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint habits_name_len   check (char_length(btrim(name)) between 1 and 100),
  constraint habits_color_fmt  check (color ~* '^#[0-9a-f]{6}'),
  constraint habits_days_valid check (
        array_length(days, 1) between 1 and 7
    and days <@ '{0,1,2,3,4,5,6}'::integer[]
  )
);

comment on column public.habits.days is
  'Дни недели: 0=Вс … 6=Сб — совпадает с JS Date.getDay()';

-- ---------------------------------------------------------------- 3. check_ins
create table if not exists public.check_ins (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  date_key   date not null,
  created_at timestamptz not null default now(),

  -- уникальность пары: нельзя отметить одну привычку дважды в один день
  constraint check_ins_habit_date_uniq unique (habit_id, date_key)
);
-- NB: отдельный индекс по habit_id НЕ нужен — его роль играет индекс
-- уникального constraint'а check_ins_habit_date_uniq (habit_id, date_key).

-- индекс под аналитику «что отмечено в конкретный день»
create index if not exists idx_check_ins_date_key
  on public.check_ins (date_key);

-- индекс под основной сценарий выборки (мои привычки, свежие сверху)
create index if not exists idx_habits_user_created_at
  on public.habits (user_id, created_at desc);

-- ------------------------------------------------- 4. Триггер updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_habits_updated_at on public.habits;
create trigger trg_habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- --------------------------------- 5. Автопрофиль при регистрации (auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer                       -- обходит RLS: пишем в public от имени владельца
set search_path = ''                   -- защита от подмены search_path
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  6. Права ролей. Без GRANT политики RLS не сработают: запрос упадёт раньше.
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.habits    to authenticated;
grant select, insert, update, delete on public.check_ins to authenticated;
grant select, update                 on public.profiles  to authenticated;
-- insert в profiles делает только триггер (security definer) => клиенту не выдаём

revoke all on public.habits    from anon;
revoke all on public.check_ins from anon;
revoke all on public.profiles  from anon;

-- ============================================================================
--  7. Row Level Security
-- ============================================================================
alter table public.profiles  enable row level security;
alter table public.habits    enable row level security;
alter table public.check_ins enable row level security;

-- опциональный «параноидальный» режим: RLS действует даже для владельца таблицы
-- (на суперпользователя postgres/Supabase Studio не влияет)
-- alter table public.habits force row level security;

-- ----------------------------------------------------------- habits policies
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
  for update to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);   -- нельзя «переписать» user_id на чужой

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -------------------------------------------------------- check_ins policies
-- Пользователь оперирует отметками только своих привычек.
drop policy if exists "check_ins_select_own" on public.check_ins;
create policy "check_ins_select_own" on public.check_ins
  for select to authenticated
  using (exists (
    select 1 from public.habits h
    where h.id = public.check_ins.habit_id
      and h.user_id = (select auth.uid())
  ));

drop policy if exists "check_ins_insert_own" on public.check_ins;
create policy "check_ins_insert_own" on public.check_ins
  for insert to authenticated
  with check (exists (
    select 1 from public.habits h
    where h.id = public.check_ins.habit_id
      and h.user_id = (select auth.uid())
  ));

drop policy if exists "check_ins_update_own" on public.check_ins;
create policy "check_ins_update_own" on public.check_ins
  for update to authenticated
  using (exists (
    select 1 from public.habits h
    where h.id = public.check_ins.habit_id
      and h.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.habits h
    where h.id = public.check_ins.habit_id      -- habit_id нельзя перевести на чужую
      and h.user_id = (select auth.uid())
  ));

drop policy if exists "check_ins_delete_own" on public.check_ins;
create policy "check_ins_delete_own" on public.check_ins
  for delete to authenticated
  using (exists (
    select 1 from public.habits h
    where h.id = public.check_ins.habit_id
      and h.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------- profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using      ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT-политики нет намеренно: строка создаётся триггером (security definer).

commit;
