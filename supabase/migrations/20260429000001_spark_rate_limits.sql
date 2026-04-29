-- ============================================================
-- SPARK — Rate limiting per user per day
-- ============================================================

create table if not exists spark_rate_limits (
  id      uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day)
);

create index if not exists spark_rate_limits_user_day_idx
  on spark_rate_limits(user_id, day);

alter table spark_rate_limits enable row level security;

drop policy if exists spark_rate_limits_owner_policy on spark_rate_limits;
create policy spark_rate_limits_owner_policy
  on spark_rate_limits for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger spark_rate_limits_updated
  before update on spark_rate_limits
  for each row execute function spark_touch_updated_at();
