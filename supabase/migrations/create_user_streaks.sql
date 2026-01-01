-- Create user_streaks table for streak tracking
-- This tracks consecutive active days based on focus sessions or task completion

create table public.user_streaks (
  user_id uuid references auth.users(id) on delete cascade primary key,
  
  -- Streak metrics
  current_streak_days integer not null default 0 check (current_streak_days >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_streaks enable row level security;

-- RLS Policies: Users can only access their own streak
create policy "Users can view own streak"
  on public.user_streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streak"
  on public.user_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streak"
  on public.user_streaks for update
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index user_streaks_user_id_idx on public.user_streaks(user_id);

-- Add trigger to update updated_at timestamp
create trigger set_user_streaks_updated_at
  before update on public.user_streaks
  for each row
  execute function public.handle_updated_at();
