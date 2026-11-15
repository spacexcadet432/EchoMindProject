-- EchoMind Phase 4 - Session System
-- Implements:
-- 1) create session block + generate sessions
-- 2) strict active session control
-- 3) session progression (complete -> next active)
-- 4) scheduling utility
-- 5) therapist/user access-safe RPCs

-- Ensure therapy_session_status enum supports "upcoming" safely in one transaction.
-- Supabase migrations run in a transaction, so ADD VALUE + immediate usage is unsafe.
do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'therapy_session_status'
      and n.nspname = 'public'
  ) then
    -- Rebuild enum to include upcoming and preserve compatibility with legacy pending values.
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'therapy_sessions'
        and column_name = 'status'
    ) then
      alter table public.therapy_sessions
        alter column status drop default;
    end if;

    alter type public.therapy_session_status rename to therapy_session_status_old;
    create type public.therapy_session_status as enum ('upcoming', 'active', 'completed');

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'therapy_sessions'
        and column_name = 'status'
    ) then
      alter table public.therapy_sessions
        alter column status type public.therapy_session_status
        using (
          case
            when status::text = 'pending' then 'upcoming'
            else status::text
          end
        )::public.therapy_session_status;

      alter table public.therapy_sessions
        alter column status set default 'upcoming'::public.therapy_session_status;
    end if;

    drop type public.therapy_session_status_old;
  else
    create type public.therapy_session_status as enum ('upcoming', 'active', 'completed');
  end if;
end $$;

-- Edge-case guard: at most one active session inside a block.
create unique index if not exists therapy_sessions_one_active_per_block_uniq
  on public.therapy_sessions (session_block_id)
  where status = 'active';

-- Trigger: enforce only one active session per patient across all non-completed blocks.
create or replace function public.enforce_single_active_session_per_patient()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_mapping_id uuid;
  v_active_count integer;
begin
  if coalesce(new.status::text, '') <> 'active' then
    return new;
  end if;

  select b.mapping_id
    into v_mapping_id
  from public.session_blocks b
  where b.id = new.session_block_id;

  select count(*)
    into v_active_count
  from public.therapy_sessions s
  join public.session_blocks b on b.id = s.session_block_id
  where b.mapping_id = v_mapping_id
    and s.status = 'active'
    and (tg_op = 'INSERT' or s.id <> new.id);

  if v_active_count > 0 then
    raise exception 'Only one active session is allowed per user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_single_active_session_per_patient on public.therapy_sessions;
create trigger trg_single_active_session_per_patient
before insert or update of status, session_block_id on public.therapy_sessions
for each row execute function public.enforce_single_active_session_per_patient();

-- RPC: POST /therapist/session-block
-- Input: userId, totalSessions (4/6/8)
-- Output: block + generated sessions
create or replace function public.create_session_block(
  p_user_id uuid,
  p_total_sessions integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_therapist_id uuid := auth.uid();
  v_mapping_id uuid;
  v_block_id uuid;
  v_sessions jsonb;
begin
  if v_therapist_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_total_sessions not in (4, 6, 8) then
    raise exception 'totalSessions must be 4, 6, or 8';
  end if;

  -- Therapist must own this user mapping.
  select m.id
    into v_mapping_id
  from public.therapist_patient_mapping m
  where m.therapist_id = v_therapist_id
    and m.patient_id = p_user_id
    and m.status = 'active'
    and m.deleted_at is null
  limit 1;

  if v_mapping_id is null then
    raise exception 'Therapist does not own this user mapping';
  end if;

  -- Only one active block per mapping.
  if exists (
    select 1
    from public.session_blocks b
    where b.mapping_id = v_mapping_id
      and b.status = 'active'
  ) then
    raise exception 'Active session block already exists for this user';
  end if;

  insert into public.session_blocks (
    mapping_id,
    total_sessions,
    sessions_completed,
    status
  )
  values (
    v_mapping_id,
    p_total_sessions,
    0,
    'active'
  )
  returning id into v_block_id;

  -- Generate sessions 1..N (first active, rest upcoming).
  insert into public.therapy_sessions (
    session_block_id,
    session_number,
    status
  )
  select
    v_block_id,
    gs.n,
    case when gs.n = 1 then 'active'::public.therapy_session_status
         else 'upcoming'::public.therapy_session_status end
  from generate_series(1, p_total_sessions) as gs(n);

  select jsonb_agg(
           jsonb_build_object(
             'id', s.id,
             'session_number', s.session_number,
             'status', s.status,
             'scheduled_date', s.scheduled_date
           )
           order by s.session_number
         )
    into v_sessions
  from public.therapy_sessions s
  where s.session_block_id = v_block_id;

  return jsonb_build_object(
    'block', jsonb_build_object(
      'id', v_block_id,
      'mapping_id', v_mapping_id,
      'total_sessions', p_total_sessions,
      'sessions_completed', 0,
      'status', 'active'
    ),
    'sessions', coalesce(v_sessions, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.create_session_block(uuid, integer) from public;
grant execute on function public.create_session_block(uuid, integer) to authenticated;

-- Utility: getActiveSession(userId)
create or replace function public.get_active_session(
  p_user_id uuid default auth.uid()
)
returns table (
  session_id uuid,
  session_block_id uuid,
  mapping_id uuid,
  session_number integer,
  status public.therapy_session_status,
  scheduled_date date
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as session_id,
    s.session_block_id,
    b.mapping_id,
    s.session_number::integer,
    s.status,
    s.scheduled_date
  from public.therapy_sessions s
  join public.session_blocks b on b.id = s.session_block_id
  join public.therapist_patient_mapping m on m.id = b.mapping_id
  where m.patient_id = p_user_id
    and m.status = 'active'
    and m.deleted_at is null
    and b.status = 'active'
    and s.status = 'active'
  order by s.session_number
  limit 1;
$$;

revoke all on function public.get_active_session(uuid) from public;
grant execute on function public.get_active_session(uuid) to authenticated;

-- Gate helper before reflection.
create or replace function public.can_user_enter_reflection(
  p_user_id uuid default auth.uid()
)
returns table (
  allowed boolean,
  reason text,
  session_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  select ga.session_id
    into v_session_id
  from public.get_active_session(p_user_id) ga
  limit 1;

  if v_session_id is null then
    return query
    select false, 'No active session assigned'::text, null::uuid;
    return;
  end if;

  return query
  select true, 'ok'::text, v_session_id;
end;
$$;

revoke all on function public.can_user_enter_reflection(uuid) from public;
grant execute on function public.can_user_enter_reflection(uuid) to authenticated;

-- Function: completeSession(sessionId)
-- 1) mark current completed
-- 2) increment block completion count
-- 3) activate next session (n+1)
-- 4) if no next session -> mark block completed
create or replace function public.complete_session(
  p_session_id uuid
)
returns table (
  completed_session_id uuid,
  next_session_id uuid,
  block_id uuid,
  block_status public.session_block_status,
  sessions_completed integer,
  total_sessions integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_block_id uuid;
  v_mapping_id uuid;
  v_current_number integer;
  v_next_session_id uuid;
  v_sessions_completed integer;
  v_total_sessions integer;
  v_block_status public.session_block_status;
begin
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Validate session + ownership (patient or owning therapist).
  select
    s.session_block_id,
    b.mapping_id,
    s.session_number
  into
    v_block_id,
    v_mapping_id,
    v_current_number
  from public.therapy_sessions s
  join public.session_blocks b on b.id = s.session_block_id
  join public.therapist_patient_mapping m on m.id = b.mapping_id
  where s.id = p_session_id
    and b.status = 'active'
    and (
      m.patient_id = v_actor_id
      or m.therapist_id = v_actor_id
    )
    and m.deleted_at is null
  limit 1;

  if v_block_id is null then
    raise exception 'Session not found or access denied';
  end if;

  -- Must be active to complete.
  if not exists (
    select 1
    from public.therapy_sessions s
    where s.id = p_session_id
      and s.status = 'active'
  ) then
    raise exception 'Only active session can be completed';
  end if;

  update public.therapy_sessions
    set status = 'completed',
        updated_at = now()
  where id = p_session_id;

  -- Activate next upcoming session if present.
  select s.id
    into v_next_session_id
  from public.therapy_sessions s
  where s.session_block_id = v_block_id
    and s.session_number = v_current_number + 1
    and s.status::text in ('upcoming', 'pending')
  limit 1;

  if v_next_session_id is not null then
    update public.therapy_sessions
      set status = 'active',
          updated_at = now()
    where id = v_next_session_id;
  end if;

  -- Recompute completion count from truth.
  select count(*)::integer
    into v_sessions_completed
  from public.therapy_sessions s
  where s.session_block_id = v_block_id
    and s.status = 'completed';

  select b.total_sessions
    into v_total_sessions
  from public.session_blocks b
  where b.id = v_block_id;

  v_block_status := case
    when v_sessions_completed >= v_total_sessions then 'completed'::public.session_block_status
    else 'active'::public.session_block_status
  end;

  update public.session_blocks
    set sessions_completed = v_sessions_completed,
        status = v_block_status,
        updated_at = now()
  where id = v_block_id;

  return query
  select
    p_session_id,
    v_next_session_id,
    v_block_id,
    v_block_status,
    v_sessions_completed,
    v_total_sessions;
end;
$$;

revoke all on function public.complete_session(uuid) from public;
grant execute on function public.complete_session(uuid) to authenticated;

-- Function: assignSessionDate(sessionId, date)
create or replace function public.assign_session_date(
  p_session_id uuid,
  p_scheduled_date date
)
returns table (
  session_id uuid,
  scheduled_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Therapist side action; must own the mapped user.
  if not exists (
    select 1
    from public.therapy_sessions s
    join public.session_blocks b on b.id = s.session_block_id
    join public.therapist_patient_mapping m on m.id = b.mapping_id
    where s.id = p_session_id
      and m.therapist_id = v_actor_id
      and m.deleted_at is null
  ) then
    raise exception 'Session not found or access denied';
  end if;

  update public.therapy_sessions
    set scheduled_date = p_scheduled_date,
        updated_at = now()
  where id = p_session_id;

  return query
  select s.id, s.scheduled_date
  from public.therapy_sessions s
  where s.id = p_session_id;
end;
$$;

revoke all on function public.assign_session_date(uuid, date) from public;
grant execute on function public.assign_session_date(uuid, date) to authenticated;

