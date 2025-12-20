-- Student Study App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📚',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics Table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Task Notes Table
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Notes Table
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Modes Table
CREATE TABLE IF NOT EXISTS exam_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Tasks Table
CREATE TABLE IF NOT EXISTS exam_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exam_modes(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Analytics Snapshots Table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_missed INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_topic_id ON tasks(topic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_id ON daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(date);
CREATE INDEX IF NOT EXISTS idx_exam_modes_user_id ON exam_modes(user_id);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Subjects policies
CREATE POLICY "Users can view own subjects" ON subjects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subjects" ON subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON subjects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON subjects
  FOR DELETE USING (auth.uid() = user_id);

-- Topics policies
CREATE POLICY "Users can view own topics" ON topics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own topics" ON topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON topics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON topics
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Task Notes policies
CREATE POLICY "Users can view own task notes" ON task_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own task notes" ON task_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task notes" ON task_notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task notes" ON task_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Notes policies
CREATE POLICY "Users can view own daily notes" ON daily_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own daily notes" ON daily_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily notes" ON daily_notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily notes" ON daily_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Exam Modes policies
CREATE POLICY "Users can view own exam modes" ON exam_modes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own exam modes" ON exam_modes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exam modes" ON exam_modes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exam modes" ON exam_modes
  FOR DELETE USING (auth.uid() = user_id);

-- Exam Tasks policies (check via exam_modes)
CREATE POLICY "Users can view own exam tasks" ON exam_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM exam_modes WHERE id = exam_tasks.exam_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create own exam tasks" ON exam_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM exam_modes WHERE id = exam_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update own exam tasks" ON exam_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM exam_modes WHERE id = exam_tasks.exam_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own exam tasks" ON exam_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM exam_modes WHERE id = exam_tasks.exam_id AND user_id = auth.uid())
  );

-- Analytics Snapshots policies
CREATE POLICY "Users can view own analytics" ON analytics_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own analytics" ON analytics_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON analytics_snapshots
  FOR UPDATE USING (auth.uid() = user_id);
