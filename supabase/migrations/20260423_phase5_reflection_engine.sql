-- EchoMind Phase 5 - Reflection Engine
-- Implements:
-- 1) get/create active reflection thread
-- 2) add user reflection entry
-- 3) mocked AI response generation + storage
-- 4) ordered, immutable turn storage
-- 5) read active thread turns (ordered)

-- ---------- Thread status ----------
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'reflection_thread_status'
      and n.nspname = 'public'
  ) then
    create type public.reflection_thread_status as enum ('active', 'closed');
  end if;
end $$;

alter table if exists public.reflection_threads
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists status public.reflection_thread_status not null default 'active',
  add column if not exists closed_at timestamptz;

-- Backfill user_id from existing session->block->mapping relation.
update public.reflection_threads t
set user_id = m.patient_id
from public.therapy_sessions s
join public.session_blocks b on b.id = s.session_block_id
join public.therapist_patient_mapping m on m.id = b.mapping_id
where t.therapy_session_id = s.id
  and t.user_id is null;

-- Enforce one active thread per session and one active thread per user.
create unique index if not exists reflection_threads_one_active_per_session_uniq
  on public.reflection_threads (therapy_session_id)
  where status = 'active';

create unique index if not exists reflection_threads_one_active_per_user_uniq
  on public.reflection_threads (user_id)
  where status = 'active';

create index if not exists reflection_threads_user_id_idx
  on public.reflection_threads (user_id);
create index if not exists reflection_threads_created_at_idx
  on public.reflection_threads (created_at);

-- ---------- Turn storage hardening ----------
-- Optional client idempotency key for user submissions.
alter table if exists public.reflection_turns
  add column if not exists client_submission_id text;

create unique index if not exists reflection_turns_user_idempotency_uniq
  on public.reflection_turns (thread_id, client_submission_id)
  where role = 'user' and client_submission_id is not null;

-- Immutable turn records (no updates/deletes).
create or replace function public.prevent_reflection_turn_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Reflection turns are immutable once stored';
end;
$$;

drop trigger if exists trg_reflection_turn_no_update on public.reflection_turns;
create trigger trg_reflection_turn_no_update
before update on public.reflection_turns
for each row execute function public.prevent_reflection_turn_mutation();

drop trigger if exists trg_reflection_turn_no_delete on public.reflection_turns;
create trigger trg_reflection_turn_no_delete
before delete on public.reflection_turns
for each row execute function public.prevent_reflection_turn_mutation();

-- ---------- Mock AI responder ----------
create or replace function public.generate_ai_reflection_response(
  p_user_content text
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_text text := lower(trim(coalesce(p_user_content, '')));
begin
  if length(v_text) < 40 then
    return 'Stay with that for a moment. What sits underneath it, beyond the first explanation?';
  elsif position(' but ' in v_text) > 0 or position(' though ' in v_text) > 0 then
    return 'There seems to be tension in what you wrote. If both parts are true, what feels most important to bring into session?';
  else
    return 'As you wrote that, what shifted for you most, and what feels unfinished right now?';
  end if;
end;
$$;

revoke all on function public.generate_ai_reflection_response(text) from public;
grant execute on function public.generate_ai_reflection_response(text) to authenticated;

-- ---------- Core: getOrCreateActiveThread(userId) ----------
create or replace function public.get_or_create_active_thread(
  p_user_id uuid default auth.uid()
)
returns table (
  thread_id uuid,
  session_id uuid,
  user_id uuid,
  status public.reflection_thread_status,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_thread_id uuid;
begin
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Strict gate: user must have active session.
  select ga.session_id
    into v_session_id
  from public.get_active_session(p_user_id) ga
  limit 1;

  if v_session_id is null then
    raise exception 'No active session assigned';
  end if;

  select t.id
    into v_thread_id
  from public.reflection_threads t
  where t.therapy_session_id = v_session_id
    and t.status = 'active'
  limit 1;

  if v_thread_id is null then
    insert into public.reflection_threads (
      therapy_session_id,
      user_id,
      status,
      started_at
    )
    values (
      v_session_id,
      p_user_id,
      'active',
      now()
    )
    returning id into v_thread_id;
  else
    -- Backfill/normalize ownership on legacy rows.
    update public.reflection_threads
      set user_id = p_user_id
    where id = v_thread_id
      and user_id is null;

    -- Safety: active session thread must belong to caller.
    if exists (
      select 1
      from public.reflection_threads t
      where t.id = v_thread_id
        and t.user_id <> p_user_id
    ) then
      raise exception 'Active thread ownership mismatch';
    end if;
  end if;

  return query
  select
    t.id,
    t.therapy_session_id,
    t.user_id,
    t.status,
    t.created_at
  from public.reflection_threads t
  where t.id = v_thread_id;
end;
$$;

revoke all on function public.get_or_create_active_thread(uuid) from public;
grant execute on function public.get_or_create_active_thread(uuid) to authenticated;

-- ---------- POST /reflection/entry ----------
-- Saves user turn + AI turn in one transaction.
create or replace function public.add_reflection_entry(
  p_content text,
  p_client_submission_id text default null
)
returns table (
  thread_id uuid,
  user_turn_id uuid,
  ai_turn_id uuid,
  ai_content text,
  user_created_at timestamptz,
  ai_created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_allowed boolean;
  v_reason text;
  v_session_id uuid;
  v_thread_id uuid;
  v_user_turn_id uuid;
  v_ai_turn_id uuid;
  v_ai_content text;
  v_user_created_at timestamptz;
  v_ai_created_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_content is null or length(btrim(p_content)) = 0 then
    raise exception 'Content cannot be empty';
  end if;

  -- 1) check can_user_enter_reflection()
  select c.allowed, c.reason, c.session_id
    into v_allowed, v_reason, v_session_id
  from public.can_user_enter_reflection(v_user_id) c
  limit 1;

  if not coalesce(v_allowed, false) then
    raise exception '%', coalesce(v_reason, 'No active session assigned');
  end if;

  -- 2) get active thread
  select t.thread_id
    into v_thread_id
  from public.get_or_create_active_thread(v_user_id) t
  limit 1;

  -- 2b) duplicate submission guard (client idempotency key).
  if p_client_submission_id is not null and length(btrim(p_client_submission_id)) > 0 then
    if exists (
      select 1
      from public.reflection_turns rt
      where rt.thread_id = v_thread_id
        and rt.role = 'user'
        and rt.client_submission_id = p_client_submission_id
    ) then
      raise exception 'Duplicate submission detected';
    end if;
  end if;

  -- 3) insert user turn
  insert into public.reflection_turns (
    thread_id,
    role,
    content,
    client_submission_id
  )
  values (
    v_thread_id,
    'user',
    btrim(p_content),
    nullif(btrim(p_client_submission_id), '')
  )
  returning id, created_at into v_user_turn_id, v_user_created_at;

  -- 4) generate + insert AI turn
  v_ai_content := public.generate_ai_reflection_response(p_content);

  insert into public.reflection_turns (
    thread_id,
    role,
    content
  )
  values (
    v_thread_id,
    'ai',
    v_ai_content
  )
  returning id, created_at into v_ai_turn_id, v_ai_created_at;

  return query
  select
    v_thread_id,
    v_user_turn_id,
    v_ai_turn_id,
    v_ai_content,
    v_user_created_at,
    v_ai_created_at;
end;
$$;

revoke all on function public.add_reflection_entry(text, text) from public;
grant execute on function public.add_reflection_entry(text, text) to authenticated;

-- ---------- GET /reflection/thread ----------
-- Returns full active-thread turns for current user, ordered.
create or replace function public.get_reflection_thread()
returns table (
  thread_id uuid,
  session_id uuid,
  turn_id uuid,
  role public.reflection_turn_role,
  content text,
  turn_index bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_thread_id uuid;
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Must have active session.
  select ga.session_id into v_session_id
  from public.get_active_session(v_user_id) ga
  limit 1;

  if v_session_id is null then
    raise exception 'No active session assigned';
  end if;

  -- If thread doesn't exist yet, create it.
  select t.thread_id
    into v_thread_id
  from public.get_or_create_active_thread(v_user_id) t
  limit 1;

  return query
  select
    v_thread_id,
    v_session_id,
    rt.id,
    rt.role,
    rt.content,
    rt.turn_index,
    rt.created_at
  from public.reflection_turns rt
  where rt.thread_id = v_thread_id
  order by rt.turn_index asc, rt.created_at asc;
end;
$$;

revoke all on function public.get_reflection_thread() from public;
grant execute on function public.get_reflection_thread() to authenticated;

-- ---------- Access control hardening ----------
-- Do NOT expose reflection content to therapist.
alter table public.reflection_threads enable row level security;
alter table public.reflection_turns enable row level security;

drop policy if exists "reflection_threads_select_parties" on public.reflection_threads;
drop policy if exists "reflection_threads_modify_patient" on public.reflection_threads;
drop policy if exists "reflection_threads_select_patient_only" on public.reflection_threads;
create policy "reflection_threads_select_patient_only"
  on public.reflection_threads
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "reflection_threads_insert_patient_only" on public.reflection_threads;
create policy "reflection_threads_insert_patient_only"
  on public.reflection_threads
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "reflection_threads_update_patient_only" on public.reflection_threads;
create policy "reflection_threads_update_patient_only"
  on public.reflection_threads
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "reflection_turns_select_patient_only" on public.reflection_turns;
create policy "reflection_turns_select_patient_only"
  on public.reflection_turns
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reflection_threads t
      where t.id = reflection_turns.thread_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "reflection_turns_insert_patient_only" on public.reflection_turns;
create policy "reflection_turns_insert_patient_only"
  on public.reflection_turns
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.reflection_threads t
      where t.id = reflection_turns.thread_id
        and t.user_id = auth.uid()
    )
  );

-- Intentionally no update/delete policies for reflection_turns.

