-- User Focus Plan Table
-- Stores user's active study plan and recommendations

CREATE TABLE IF NOT EXISTS user_focus_plan (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_plan_id TEXT NOT NULL,
  recommended_plan_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_switch_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_focus_plan ENABLE ROW LEVEL SECURITY;

-- Users can manage their own focus plan
CREATE POLICY "Users manage own focus plan"
  ON user_focus_plan FOR ALL
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_focus_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_focus_plan_updated_at
  BEFORE UPDATE ON user_focus_plan
  FOR EACH ROW
  EXECUTE FUNCTION update_user_focus_plan_updated_at();

-- Extend focus_sessions table with new fields
ALTER TABLE focus_sessions
  ADD COLUMN IF NOT EXISTS session_quality TEXT CHECK (session_quality IN ('focused', 'okay', 'distracted')),
  ADD COLUMN IF NOT EXISTS auto_created_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_note TEXT,
  ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started ON focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_subject ON focus_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_quality ON focus_sessions(session_quality) WHERE session_quality IS NOT NULL;

-- Session statistics view (helper for analytics)
CREATE OR REPLACE VIEW session_stats AS
SELECT
  user_id,
  subject_id,
  DATE(started_at) as session_date,
  COUNT(*) as session_count,
  SUM(duration_seconds) as total_duration_seconds,
  AVG(duration_seconds) as avg_duration_seconds,
  COUNT(CASE WHEN session_quality = 'focused' THEN 1 END) as focused_count,
  COUNT(CASE WHEN session_quality = 'okay' THEN 1 END) as okay_count,
  COUNT(CASE WHEN session_quality = 'distracted' THEN 1 END) as distracted_count
FROM focus_sessions
WHERE duration_seconds >= 60  -- Only count sessions >= 1 minute
GROUP BY user_id, subject_id, DATE(started_at);

-- Grant access to the view
GRANT SELECT ON session_stats TO authenticated;
