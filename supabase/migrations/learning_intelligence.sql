-- Learning Intelligence System - Database Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CONFIDENCE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS confidence_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    sub_topic_id UUID NOT NULL,
    level TEXT CHECK (level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sub_topic_id)
);

-- Enable RLS
ALTER TABLE confidence_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own data
CREATE POLICY "Users can manage their own confidence tracking"
ON confidence_tracking FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. REVISION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS revision_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    sub_topic_id UUID NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE revision_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own revision history"
ON revision_history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. EXAM REFLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    exam_id UUID NOT NULL,
    what_worked TEXT,
    what_didnt TEXT,
    changes_next_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exam_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own exam reflections"
ON exam_reflections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- Add difficulty to sub_topics (optional field)
ALTER TABLE sub_topics 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add difficulty to tasks (optional field)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add quality_rating to focus_sessions
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS quality_rating TEXT CHECK (quality_rating IN ('focused', 'okay', 'distracted'));

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_confidence_user_subtopic 
ON confidence_tracking(user_id, sub_topic_id);

CREATE INDEX IF NOT EXISTS idx_revision_user_subtopic 
ON revision_history(user_id, sub_topic_id);

CREATE INDEX IF NOT EXISTS idx_revision_reviewed_at 
ON revision_history(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_exam_reflections_exam 
ON exam_reflections(exam_id);
