-- High-Impact Features Schema Additions (v2)
-- Run this after schema.sql

-- ================================================
-- Task Notes (for Notes screen)
-- ================================================
CREATE TABLE IF NOT EXISTS task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
    ON task_notes FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- Study Sessions (Time Tracking)
-- ================================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study sessions"
    ON study_sessions FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- Daily Reflections
-- ================================================
CREATE TABLE IF NOT EXISTS daily_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    learned TEXT,
    difficult TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reflection_date)
);

ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reflections"
    ON daily_reflections FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- Weekly Reviews (cached summaries)
-- ================================================
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    tasks_missed INTEGER DEFAULT 0,
    total_study_minutes INTEGER DEFAULT 0,
    best_day TEXT,
    weak_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    improvement_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weekly reviews"
    ON weekly_reviews FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- Missed Task Reasons (for recovery flow)
-- ================================================
CREATE TABLE IF NOT EXISTS missed_task_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL, -- 'too_difficult', 'no_time', 'low_priority', 'rescheduled'
    original_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE missed_task_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own missed task reasons"
    ON missed_task_reasons FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- Add priority field to tasks if not exists
-- ================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'priority') THEN
        ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium' 
            CHECK (priority IN ('low', 'medium', 'high'));
    END IF;
END $$;

-- ================================================
-- Indexes for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date 
    ON study_sessions(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date 
    ON daily_reflections(user_id, reflection_date);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
    ON tasks(user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_completed 
    ON tasks(user_id, is_completed);
