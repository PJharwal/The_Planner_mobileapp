-- Feature Expansion Database Updates
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. Focus Sessions Table (for time tracking with context)
-- =============================================
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL,
  target_duration_seconds INTEGER, -- For custom timer targets
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  session_type TEXT DEFAULT 'focus' CHECK (session_type IN ('focus', 'task', 'pomodoro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for focus_sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_subject_id ON focus_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_topic_id ON focus_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);

-- RLS for focus_sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus sessions" ON focus_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON focus_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON focus_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. User Profiles Table (for display name)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 3. Update Notes Table (add subject_id link)
-- =============================================
-- Add subject_id column to existing notes table if it exists
DO $$ 
BEGIN
  -- Check if 'notes' table exists and add subject_id if missing
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'subject_id') THEN
      ALTER TABLE notes ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
    END IF;
  END IF;
  
  -- Check if 'daily_notes' table exists and add subject_id if missing
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_notes') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'daily_notes' AND column_name = 'subject_id') THEN
      ALTER TABLE daily_notes ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- =============================================
-- 4. Today's Tasks Table (for tracking which tasks are in Today's list)
-- =============================================
CREATE TABLE IF NOT EXISTS today_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id, date)
);

-- Indexes for today_tasks
CREATE INDEX IF NOT EXISTS idx_today_tasks_user_id ON today_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_today_tasks_date ON today_tasks(date);

-- RLS for today_tasks
ALTER TABLE today_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own today tasks" ON today_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own today tasks" ON today_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own today tasks" ON today_tasks
  FOR DELETE USING (auth.uid() = user_id);
