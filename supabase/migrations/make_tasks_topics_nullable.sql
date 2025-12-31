-- Migration: Make topic_id and sub_topic_id nullable in tasks table
-- This allows users to create tasks without requiring subjects/topics first

-- Make topic_id nullable
ALTER TABLE tasks 
ALTER COLUMN topic_id DROP NOT NULL;

-- Make sub_topic_id nullable
ALTER TABLE tasks 
ALTER COLUMN sub_topic_id DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN tasks.topic_id IS 'Optional foreign key to topics table. Can be null for standalone tasks.';
COMMENT ON COLUMN tasks.sub_topic_id IS 'Optional foreign key to sub_topics table. Can be null for standalone tasks.';