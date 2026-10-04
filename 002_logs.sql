-- Централизованное хранение логов клиента (опционально).
create table if not exists public.app_logs (
  id         bigint generated always as identity primary key,
  level      text not null,
  message    text not null,
  context    jsonb,
  url        text,
  user_id    uuid default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.app_logs enable row level security;

create policy "app_logs_insert_authenticated" on public.app_logs
  for insert to authenticated
  with check (true);

grant insert on public.app_logs to authenticated;
