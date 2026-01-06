-- Add subscription fields for RevenueCat integration
-- Run this in your Supabase SQL Editor

-- Add subscription fields to user_profile_insights table
ALTER TABLE user_profile_insights 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT;

-- Create index for quick Pro status lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_insights_is_pro ON user_profile_insights(is_pro);

-- Comment for documentation
COMMENT ON COLUMN user_profile_insights.is_pro IS 'Whether user has active Pro subscription';
COMMENT ON COLUMN user_profile_insights.subscription_type IS 'free, monthly, or yearly';
COMMENT ON COLUMN user_profile_insights.subscription_expires_at IS 'When current subscription period ends';
COMMENT ON COLUMN user_profile_insights.revenuecat_customer_id IS 'RevenueCat customer ID for server-side sync';
