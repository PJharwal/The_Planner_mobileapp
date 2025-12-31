-- Create user_profile_insights table for personalized onboarding
-- This stores user preferences and characteristics for adaptive planning

create table public.user_profile_insights (
  user_id uuid references auth.users(id) on delete cascade primary key,
  
  -- Basic context
  age_range text check (age_range in ('under_16', '16_18', '19_25', '26_plus')),
  role text check (role in ('school', 'college', 'professional', 'exam_prep')),
  primary_goal text check (primary_goal in ('consistency', 'exams', 'overload', 'habits')),
  
  -- Attention & Focus (stored as important user characteristics)
  focus_difficulty text check (focus_difficulty in ('easy', 'sometimes', 'often', 'very_hard')),
  attention_diagnosis text check (attention_diagnosis in ('no', 'yes_adhd', 'suspected', 'no_say')),
  
  -- Energy & Time
  peak_energy_time text check (peak_energy_time in ('early_morning', 'late_morning', 'afternoon', 'night')),
  daily_focus_capacity text check (daily_focus_capacity in ('less_1h', '1_2h', '2_4h', 'more_4h')),
  main_drain text check (main_drain in ('mental', 'phone', 'stress', 'too_many_tasks')),
  
  -- Consistency patterns
  consistency_span text check (consistency_span in ('1_2_days', '3_5_days', '1_2_weeks', 'more_2_weeks')),
  miss_day_response text check (miss_day_response in ('resume', 'guilty_delay', 'abandon', 'depends_mood')),
  overload_response text check (overload_response in ('reschedule', 'rush_stress', 'avoid', 'pause')),
  
  -- Planning style
  planning_style text check (planning_style in ('daily', 'weekly', 'advance', 'guide_me')),
  guidance_level text check (guidance_level in ('minimal', 'balanced', 'strong', 'decide_all')),
  
  -- Exam pressure
  exam_proximity text check (exam_proximity in ('within_1m', 'within_3_6m', 'later', 'no')),
  
  -- Open text fields
  biggest_struggle text,
  personal_notes text,
  
  -- Derived fields (computed, not user-input)
  study_persona text check (study_persona in (
    'low_focus_short_session',
    'exam_driven_high_pressure',
    'consistent_overloaded',
    'burnout_recovery',
    'balanced_learner'
  )),
  selected_plan_id text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_profile_insights enable row level security;

-- RLS Policies: Users can only access their own profile
create policy "Users can view own profile"
  on public.user_profile_insights for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.user_profile_insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.user_profile_insights for update
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index user_profile_insights_user_id_idx on public.user_profile_insights(user_id);

-- Add trigger to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.user_profile_insights
  for each row
  execute function public.handle_updated_at();
