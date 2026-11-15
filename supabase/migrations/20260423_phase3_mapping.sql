-- EchoMind Phase 3 - Therapist <-> User Mapping
-- Implements:
-- 1) Invite creation
-- 2) Invite acceptance
-- 3) Mapping validation helper
-- 4) Therapist patient listing helper
-- 5) Relationship constraints (one user -> one therapist)

create extension if not exists pgcrypto;

-- Ensure mapping status enum supports pending/active lifecycle.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'mapping_status'
      and n.nspname = 'public'
  ) then
    create type public.mapping_status as enum ('pending', 'active', 'completed', 'deactivated');
  end if;
end $$;

-- Add invite + patient email support on mapping table if not already present.
alter table if exists public.therapist_patient_mapping
  add column if not exists user_email text,
  add column if not exists invite_token text,
  add column if not exists invite_url text,
  add column if not exists accepted_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- Keep required status default.
alter table if exists public.therapist_patient_mapping
  alter column status set default 'pending'::public.mapping_status;

-- Basic email shape guard for pending invites.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'therapist_patient_mapping_user_email_chk'
  ) then
    alter table public.therapist_patient_mapping
      add constraint therapist_patient_mapping_user_email_chk
      check (
        user_email is null or position('@' in lower(user_email)) > 1
      );
  end if;
end $$;

-- Enforce one active mapping per patient (one user cannot have multiple therapists).
create unique index if not exists therapist_patient_mapping_patient_active_uniq
  on public.therapist_patient_mapping (patient_id)
  where status in ('active', 'pending') and deleted_at is null;

-- Enforce one open invite per therapist+email pair.
create unique index if not exists therapist_patient_mapping_open_invite_uniq
  on public.therapist_patient_mapping (therapist_id, lower(user_email))
  where status = 'pending' and deleted_at is null;

-- Invite token uniqueness.
create unique index if not exists therapist_patient_mapping_invite_token_uniq
  on public.therapist_patient_mapping (invite_token)
  where invite_token is not null and deleted_at is null;

create index if not exists therapist_patient_mapping_therapist_idx
  on public.therapist_patient_mapping (therapist_id);
create index if not exists therapist_patient_mapping_patient_idx
  on public.therapist_patient_mapping (patient_id);
create index if not exists therapist_patient_mapping_created_at_idx
  on public.therapist_patient_mapping (created_at);

-- ---- RPC: POST /therapist/invite
-- Input: p_email
-- Output: invite_token + invite_url (+ mapping metadata)
create or replace function public.create_therapist_invite(
  p_email text,
  p_base_url text default 'https://app.echomind.com/invite'
)
returns table (
  mapping_id uuid,
  therapist_id uuid,
  user_email text,
  invite_token text,
  invite_url text,
  status public.mapping_status,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_therapist_id uuid := auth.uid();
  v_existing_active uuid;
  v_mapping_id uuid;
  v_token text;
  v_email text := lower(trim(p_email));
begin
  if v_therapist_id is null then
    raise exception 'Unauthorized';
  end if;

  if v_email is null or length(v_email) = 0 or position('@' in v_email) <= 1 then
    raise exception 'Invalid email';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = v_therapist_id and u.role = 'therapist'
  ) then
    raise exception 'Only therapists can create invites';
  end if;

  -- If user already exists and is actively mapped, block duplicate invite.
  select m.id
    into v_existing_active
  from public.users u
  join public.therapist_patient_mapping m on m.patient_id = u.id
  where lower(u.email) = v_email
    and m.status in ('active', 'pending')
    and m.deleted_at is null
  limit 1;

  if v_existing_active is not null then
    raise exception 'User is already mapped or has a pending invite';
  end if;

  -- Reuse existing pending invite for same therapist+email if present.
  select m.id, m.invite_token
    into v_mapping_id, v_token
  from public.therapist_patient_mapping m
  where m.therapist_id = v_therapist_id
    and lower(m.user_email) = v_email
    and m.status = 'pending'
    and m.deleted_at is null
  limit 1;

  if v_mapping_id is null then
    v_token := encode(gen_random_bytes(24), 'hex');
    insert into public.therapist_patient_mapping (
      therapist_id,
      user_email,
      invite_token,
      invite_url,
      status
    )
    values (
      v_therapist_id,
      v_email,
      v_token,
      p_base_url || '?token=' || v_token,
      'pending'
    )
    returning id into v_mapping_id;
  else
    update public.therapist_patient_mapping
      set invite_url = p_base_url || '?token=' || v_token
    where id = v_mapping_id;
  end if;

  return query
  select
    m.id,
    m.therapist_id,
    m.user_email,
    m.invite_token,
    m.invite_url,
    m.status,
    m.created_at
  from public.therapist_patient_mapping m
  where m.id = v_mapping_id;
end;
$$;

revoke all on function public.create_therapist_invite(text, text) from public;
grant execute on function public.create_therapist_invite(text, text) to authenticated;

-- ---- RPC: POST /invite/accept
-- Flow:
-- 1) Authenticated user calls with invite token
-- 2) Verify pending invite exists
-- 3) Validate user not already mapped
-- 4) Activate mapping and bind patient_id
create or replace function public.accept_invite(
  p_invite_token text
)
returns table (
  mapping_id uuid,
  therapist_id uuid,
  patient_id uuid,
  status public.mapping_status,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_mapping public.therapist_patient_mapping%rowtype;
  v_existing_active uuid;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_invite_token is null or length(trim(p_invite_token)) = 0 then
    raise exception 'Invite token is required';
  end if;

  select lower(u.email) into v_email
  from public.users u
  where u.id = v_user_id;

  if v_email is null then
    raise exception 'User email not found';
  end if;

  select *
    into v_mapping
  from public.therapist_patient_mapping m
  where m.invite_token = p_invite_token
    and m.status = 'pending'
    and m.deleted_at is null
  limit 1;

  if v_mapping.id is null then
    raise exception 'Invalid or already used invite token';
  end if;

  -- Optional strictness: invited email must match logged-in email.
  if lower(v_mapping.user_email) <> v_email then
    raise exception 'Invite email does not match authenticated user';
  end if;

  -- Block if this user is already mapped.
  select m.id
    into v_existing_active
  from public.therapist_patient_mapping m
  where m.patient_id = v_user_id
    and m.status in ('active', 'pending')
    and m.deleted_at is null
  limit 1;

  if v_existing_active is not null then
    raise exception 'User already mapped to therapist';
  end if;

  update public.therapist_patient_mapping m
    set patient_id = v_user_id,
        status = 'active',
        accepted_at = now(),
        updated_at = now()
  where m.id = v_mapping.id;

  return query
  select
    m.id,
    m.therapist_id,
    m.patient_id,
    m.status,
    m.accepted_at
  from public.therapist_patient_mapping m
  where m.id = v_mapping.id;
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- ---- Validation helper: getUserTherapistMapping(userId)
-- If no mapping: returns 0 rows (caller should block access).
create or replace function public.get_user_therapist_mapping(
  p_user_id uuid default auth.uid()
)
returns table (
  mapping_id uuid,
  therapist_id uuid,
  patient_id uuid,
  status public.mapping_status
)
language sql
security definer
set search_path = public
as $$
  select
    m.id as mapping_id,
    m.therapist_id,
    m.patient_id,
    m.status
  from public.therapist_patient_mapping m
  where m.patient_id = p_user_id
    and m.status = 'active'
    and m.deleted_at is null
  limit 1;
$$;

revoke all on function public.get_user_therapist_mapping(uuid) from public;
grant execute on function public.get_user_therapist_mapping(uuid) to authenticated;

-- ---- Middleware-friendly gate function.
-- Returns allowed flag + reason for consistent app checks.
create or replace function public.can_user_enter_app(
  p_user_id uuid default auth.uid()
)
returns table (
  allowed boolean,
  reason text,
  mapping_id uuid,
  therapist_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_map record;
begin
  select m.id, m.therapist_id
    into v_map
  from public.therapist_patient_mapping m
  where m.patient_id = p_user_id
    and m.status = 'active'
    and m.deleted_at is null
  limit 1;

  if v_map.id is null then
    return query
    select
      false,
      'Access is invite-only. Contact your therapist.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  return query
  select true, 'ok'::text, v_map.id::uuid, v_map.therapist_id::uuid;
end;
$$;

revoke all on function public.can_user_enter_app(uuid) from public;
grant execute on function public.can_user_enter_app(uuid) to authenticated;

-- ---- Therapist patients list: GET /therapist/patients
create or replace function public.get_therapist_patients()
returns table (
  mapping_id uuid,
  user_id uuid,
  name text,
  email text,
  status public.mapping_status,
  sessions_used integer,
  total_sessions integer,
  last_activity timestamptz
)
language sql
security definer
set search_path = public
as $$
  with latest_block as (
    select distinct on (b.mapping_id)
      b.mapping_id,
      b.sessions_completed,
      b.total_sessions
    from public.session_blocks b
    order by b.mapping_id, b.created_at desc
  ),
  activity as (
    select
      m.id as mapping_id,
      max(rt.created_at) as last_activity
    from public.therapist_patient_mapping m
    left join public.session_blocks sb on sb.mapping_id = m.id
    left join public.therapy_sessions ts on ts.session_block_id = sb.id
    left join public.reflection_threads th on th.therapy_session_id = ts.id
    left join public.reflection_turns rt on rt.thread_id = th.id and rt.role = 'user'
    group by m.id
  )
  select
    m.id as mapping_id,
    u.id as user_id,
    u.full_name as name,
    u.email,
    m.status,
    coalesce(lb.sessions_completed, 0)::integer as sessions_used,
    coalesce(lb.total_sessions, 0)::integer as total_sessions,
    a.last_activity
  from public.therapist_patient_mapping m
  join public.users u on u.id = m.patient_id
  left join latest_block lb on lb.mapping_id = m.id
  left join activity a on a.mapping_id = m.id
  where m.therapist_id = auth.uid()
    and m.deleted_at is null
  order by coalesce(a.last_activity, m.created_at) desc;
$$;

revoke all on function public.get_therapist_patients() from public;
grant execute on function public.get_therapist_patients() to authenticated;

-- ---- Soft-delete helper for therapist removing relationship.
create or replace function public.delete_therapist_mapping(
  p_mapping_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.therapist_patient_mapping m
    set status = 'deactivated',
        deleted_at = now(),
        updated_at = now()
  where m.id = p_mapping_id
    and m.therapist_id = auth.uid()
    and m.deleted_at is null;
end;
$$;

revoke all on function public.delete_therapist_mapping(uuid) from public;
grant execute on function public.delete_therapist_mapping(uuid) to authenticated;

-- RLS hardening on mapping table.
alter table public.therapist_patient_mapping enable row level security;

drop policy if exists "mapping_select_parties" on public.therapist_patient_mapping;
create policy "mapping_select_parties"
  on public.therapist_patient_mapping
  for select
  to authenticated
  using (therapist_id = auth.uid() or patient_id = auth.uid());

drop policy if exists "mapping_insert_therapist_only" on public.therapist_patient_mapping;
create policy "mapping_insert_therapist_only"
  on public.therapist_patient_mapping
  for insert
  to authenticated
  with check (therapist_id = auth.uid());

drop policy if exists "mapping_update_parties" on public.therapist_patient_mapping;
create policy "mapping_update_parties"
  on public.therapist_patient_mapping
  for update
  to authenticated
  using (therapist_id = auth.uid() or patient_id = auth.uid())
  with check (therapist_id = auth.uid() or patient_id = auth.uid());

