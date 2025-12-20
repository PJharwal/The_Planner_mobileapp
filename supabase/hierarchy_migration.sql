-- Study App Hierarchy Migration
-- Adds sub_topics layer: Subject → Topic → Sub-Topic → Tasks
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. Create sub_topics table
-- =============================================
CREATE TABLE IF NOT EXISTS sub_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sub_topics
CREATE INDEX IF NOT EXISTS idx_sub_topics_topic_id ON sub_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_sub_topics_user_id ON sub_topics(user_id);

-- RLS for sub_topics
ALTER TABLE sub_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sub_topics" ON sub_topics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sub_topics" ON sub_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sub_topics" ON sub_topics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sub_topics" ON sub_topics
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. Add sub_topic_id column to tasks (nullable first)
-- =============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'sub_topic_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN sub_topic_id UUID REFERENCES sub_topics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for sub_topic_id
CREATE INDEX IF NOT EXISTS idx_tasks_sub_topic_id ON tasks(sub_topic_id);

-- =============================================
-- 3. Migrate existing data: Create default sub-topics for each topic
-- =============================================
DO $$
DECLARE
  topic_record RECORD;
  new_sub_topic_id UUID;
BEGIN
  -- For each topic that has tasks but no sub-topics, create a default sub-topic
  FOR topic_record IN 
    SELECT DISTINCT t.id as topic_id, t.user_id, t.name as topic_name
    FROM topics t
    INNER JOIN tasks tk ON tk.topic_id = t.id
    WHERE tk.sub_topic_id IS NULL
  LOOP
    -- Create a "General" sub-topic for this topic
    INSERT INTO sub_topics (topic_id, user_id, name, order_index)
    VALUES (topic_record.topic_id, topic_record.user_id, 'General', 0)
    RETURNING id INTO new_sub_topic_id;
    
    -- Update all tasks under this topic to use the new sub-topic
    UPDATE tasks 
    SET sub_topic_id = new_sub_topic_id
    WHERE topic_id = topic_record.topic_id 
    AND sub_topic_id IS NULL;
  END LOOP;
END $$;

-- =============================================
-- 4. Add sub_topic_id to focus_sessions
-- =============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'focus_sessions' AND column_name = 'sub_topic_id'
  ) THEN
    ALTER TABLE focus_sessions ADD COLUMN sub_topic_id UUID REFERENCES sub_topics(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_sub_topic_id ON focus_sessions(sub_topic_id);

-- =============================================
-- 5. Add sub_topic_id to today_tasks for reference
-- =============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'today_tasks' AND column_name = 'sub_topic_id'
  ) THEN
    ALTER TABLE today_tasks ADD COLUMN sub_topic_id UUID REFERENCES sub_topics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- 6. Verify migration
-- =============================================
-- After running, check: SELECT COUNT(*) FROM tasks WHERE sub_topic_id IS NULL;
-- Should return 0 if migration was successful
