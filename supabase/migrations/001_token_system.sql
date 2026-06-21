-- Ink-N-Motion token system (Stage 1)
-- Run in Supabase SQL Editor or via Supabase CLI.

-- ── profiles ────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  signup_bonus_granted boolean not null default false
);

-- ── token_grants (FIFO buckets with 60-day expiry) ──────────────

create table if not exists public.token_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount int not null check (amount > 0),
  remaining int not null check (remaining >= 0),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null check (source in ('signup_bonus', 'purchase', 'refund', 'admin')),
  pack_id text,
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  check (remaining <= amount)
);

create index if not exists idx_token_grants_fifo
  on public.token_grants (user_id, granted_at asc)
  where remaining > 0;

create index if not exists idx_token_grants_expiry
  on public.token_grants (user_id, expires_at)
  where remaining > 0;

-- ── token_ledger (immutable audit) ──────────────────────────────

create table if not exists public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_type text not null check (entry_type in ('grant', 'spend', 'refund', 'expire')),
  amount int not null,
  action text,
  grant_id uuid references public.token_grants (id),
  stripe_checkout_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_token_ledger_user_time
  on public.token_ledger (user_id, created_at desc);

create unique index if not exists idx_token_ledger_refund_batch
  on public.token_ledger (user_id, ((metadata ->> 'spend_batch')))
  where entry_type = 'refund' and (metadata ? 'spend_batch');

-- ── auto-create profile on signup ───────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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
  for each row
  execute function public.handle_new_user();

-- ── grant_tokens (idempotent on stripe session) ─────────────────

create or replace function public.grant_tokens(
  p_user_id uuid,
  p_amount int,
  p_source text,
  p_expires_at timestamptz default (now() + interval '60 days'),
  p_pack_id text default null,
  p_stripe_checkout_session_id text default null,
  p_action text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
  v_existing uuid;
begin
  if p_amount <= 0 then
    raise exception 'grant amount must be positive';
  end if;

  if p_stripe_checkout_session_id is not null then
    select id into v_existing
    from public.token_grants
    where stripe_checkout_session_id = p_stripe_checkout_session_id;

    if v_existing is not null then
      return v_existing;
    end if;
  end if;

  insert into public.token_grants (
    user_id,
    amount,
    remaining,
    expires_at,
    source,
    pack_id,
    stripe_checkout_session_id
  )
  values (
    p_user_id,
    p_amount,
    p_amount,
    p_expires_at,
    p_source,
    p_pack_id,
    p_stripe_checkout_session_id
  )
  returning id into v_grant_id;

  insert into public.token_ledger (
    user_id,
    entry_type,
    amount,
    action,
    grant_id,
    stripe_checkout_session_id
  )
  values (
    p_user_id,
    'grant',
    p_amount,
    coalesce(p_action, p_source),
    v_grant_id,
    p_stripe_checkout_session_id
  );

  return v_grant_id;
end;
$$;

-- ── spend_tokens (FIFO from oldest non-expired grant) ───────────

create or replace function public.spend_tokens(
  p_user_id uuid,
  p_action text,
  p_cost int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_grant record;
  v_to_deduct int;
  v_spend_batch uuid := gen_random_uuid();
  v_slice int;
begin
  if p_cost <= 0 then
    return v_spend_batch;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select coalesce(sum(remaining), 0)
  into v_balance
  from public.token_grants
  where user_id = p_user_id
    and expires_at > now()
    and remaining > 0;

  if v_balance < p_cost then
    raise exception 'insufficient_tokens' using errcode = 'P0001';
  end if;

  v_to_deduct := p_cost;

  for v_grant in
    select id, remaining
    from public.token_grants
    where user_id = p_user_id
      and expires_at > now()
      and remaining > 0
    order by granted_at asc
    for update
  loop
    exit when v_to_deduct <= 0;

    v_slice := least(v_grant.remaining, v_to_deduct);

    update public.token_grants
    set remaining = remaining - v_slice
    where id = v_grant.id;

    insert into public.token_ledger (
      user_id,
      entry_type,
      amount,
      action,
      grant_id,
      metadata
    )
    values (
      p_user_id,
      'spend',
      -v_slice,
      p_action,
      v_grant.id,
      jsonb_build_object('spend_batch', v_spend_batch)
    );

    v_to_deduct := v_to_deduct - v_slice;
  end loop;

  return v_spend_batch;
end;
$$;

-- ── refund_tokens (reverse a spend batch) ───────────────────────

create or replace function public.refund_tokens(
  p_user_id uuid,
  p_spend_batch uuid,
  p_action text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund_amount int;
  v_grant_id uuid;
begin
  if exists (
    select 1
    from public.token_ledger
    where user_id = p_user_id
      and entry_type = 'refund'
      and metadata ->> 'spend_batch' = p_spend_batch::text
  ) then
    select coalesce(sum(abs(amount)), 0)
    into v_refund_amount
    from public.token_ledger
    where user_id = p_user_id
      and entry_type = 'spend'
      and metadata ->> 'spend_batch' = p_spend_batch::text;

    return v_refund_amount;
  end if;

  select coalesce(sum(abs(amount)), 0)
  into v_refund_amount
  from public.token_ledger
  where user_id = p_user_id
    and entry_type = 'spend'
    and metadata ->> 'spend_batch' = p_spend_batch::text;

  if v_refund_amount <= 0 then
    raise exception 'spend_batch_not_found' using errcode = 'P0002';
  end if;

  v_grant_id := public.grant_tokens(
    p_user_id,
    v_refund_amount,
    'refund',
    now() + interval '60 days',
    null,
    null,
    coalesce(p_action, 'refund')
  );

  insert into public.token_ledger (
    user_id,
    entry_type,
    amount,
    action,
    grant_id,
    metadata
  )
  values (
    p_user_id,
    'refund',
    v_refund_amount,
    coalesce(p_action, 'refund'),
    v_grant_id,
    jsonb_build_object('spend_batch', p_spend_batch)
  );

  return v_refund_amount;
end;
$$;

-- ── ensure_signup_bonus (3 free tokens, once) ───────────────────

create or replace function public.ensure_signup_bonus(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_granted boolean;
begin
  select signup_bonus_granted
  into v_granted
  from public.profiles
  where id = p_user_id
  for update;

  if v_granted is null then
    insert into public.profiles (id)
    values (p_user_id)
    on conflict (id) do nothing;

    select signup_bonus_granted
    into v_granted
    from public.profiles
    where id = p_user_id
    for update;
  end if;

  if v_granted then
    return 0;
  end if;

  perform public.grant_tokens(
    p_user_id,
    3,
    'signup_bonus',
    now() + interval '60 days',
    null,
    null,
    'signup_bonus'
  );

  update public.profiles
  set signup_bonus_granted = true
  where id = p_user_id;

  return 3;
end;
$$;

-- ── spendable balance helper ────────────────────────────────────

create or replace function public.get_spendable_balance(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(remaining), 0)::int
  from public.token_grants
  where user_id = p_user_id
    and expires_at > now()
    and remaining > 0;
$$;

-- ── RLS ─────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.token_grants enable row level security;
alter table public.token_ledger enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users read own grants" on public.token_grants;
create policy "Users read own grants"
  on public.token_grants
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own ledger" on public.token_ledger;
create policy "Users read own ledger"
  on public.token_ledger
  for select
  using (auth.uid() = user_id);

-- Writes go through service-role API routes (security definer functions above).
