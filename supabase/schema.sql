-- Таблица для приложения «Тренировки».
-- Выполни целиком один раз: Supabase → SQL Editor → New query → вставить → Run.

create table if not exists public.entries (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  col        text        not null,
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, col, id)
);

create index if not exists entries_user_updated on public.entries (user_id, updated_at);

-- Каждый видит и меняет только свои записи
alter table public.entries enable row level security;

drop policy if exists "entries_select_own" on public.entries;
drop policy if exists "entries_insert_own" on public.entries;
drop policy if exists "entries_update_own" on public.entries;
drop policy if exists "entries_delete_own" on public.entries;

create policy "entries_select_own" on public.entries for select to authenticated using (auth.uid() = user_id);
create policy "entries_insert_own" on public.entries for insert to authenticated with check (auth.uid() = user_id);
create policy "entries_update_own" on public.entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "entries_delete_own" on public.entries for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.entries to authenticated;

-- Время изменения ставит сервер, чтобы синхронизация между устройствами была точной
create or replace function public.entries_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before insert or update on public.entries
for each row execute function public.entries_touch();
