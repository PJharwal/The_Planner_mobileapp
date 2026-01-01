-- Create user_capacity table for character-based capacity system
-- This stores personalized daily limits derived from user characteristics

create table public.user_capacity (
  user_id uuid references auth.users(id) on delete cascade primary key,
  
  -- Derived capacity metrics
  max_tasks_per_day integer not null default 5 check (max_tasks_per_day >= 1 and max_tasks_per_day <= 10),
  default_focus_minutes integer not null default 25 check (default_focus_minutes >= 10 and default_focus_minutes <= 90),
  default_break_minutes integer not null default 5 check (default_break_minutes >= 5 and default_break_minutes <= 20),
  max_daily_focus_minutes integer not null default 120 check (max_daily_focus_minutes >= 60 and max_daily_focus_minutes <= 480),
  recommended_sessions_per_day integer not null default 4 check (recommended_sessions_per_day >= 1 and recommended_sessions_per_day <= 8),
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_capacity enable row level security;

-- RLS Policies: Users can only access their own capacity
create policy "Users can view own capacity"
  on public.user_capacity for select
  using (auth.uid() = user_id);

create policy "Users can insert own capacity"
  on public.user_capacity for insert
  with check (auth.uid() = user_id);

create policy "Users can update own capacity"
  on public.user_capacity for update
  using (auth.uid() = user_id);

-- Create index for faster lookups (user_id is already indexed as primary key)
create index user_capacity_user_id_idx on public.user_capacity(user_id);

-- Add trigger to update updated_at timestamp
create trigger set_user_capacity_updated_at
  before update on public.user_capacity
  for each row
  execute function public.handle_updated_at();

-- Optional: Create table for tracking capacity overrides (for analytics)
create table public.capacity_overrides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  override_type text not null check (override_type in ('task_limit', 'focus_limit')),
  original_limit integer not null,
  override_value integer not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for capacity_overrides
alter table public.capacity_overrides enable row level security;

create policy "Users can view own overrides"
  on public.capacity_overrides for select
  using (auth.uid() = user_id);

create policy "Users can insert own overrides"
  on public.capacity_overrides for insert
  with check (auth.uid() = user_id);

-- Create index for overrides
create index capacity_overrides_user_id_idx on public.capacity_overrides(user_id);
create index capacity_overrides_created_at_idx on public.capacity_overrides(created_at);
