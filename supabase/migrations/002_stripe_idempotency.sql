-- Stripe webhook idempotency (Stage 5)
-- Prevents double-crediting on webhook replays.

create table if not exists public.stripe_processed_events (
  id text primary key,
  event_type text not null,
  checkout_session_id text,
  user_id uuid references auth.users (id) on delete set null,
  pack text,
  tokens_granted int,
  processed_at timestamptz not null default now()
);

create unique index if not exists idx_stripe_processed_checkout_session
  on public.stripe_processed_events (checkout_session_id)
  where checkout_session_id is not null;

alter table public.stripe_processed_events enable row level security;

-- No client policies; service role only.
