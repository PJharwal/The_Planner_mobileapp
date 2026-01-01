/**
 * Database Types - Supabase Schema
 * 
 * Note: Ideally generated with: npx supabase gen types typescript > src/types/database.ts
 * For now, manually defined based on existing schema
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            // Focus Sessions
            focus_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    subject_id: string;
                    topic_id: string | null;
                    sub_topic_id: string | null;
                    task_id: string | null;
                    auto_created_task_id: string | null;
                    duration_seconds: number;
                    target_duration_seconds: number | null;
                    session_quality: 'focused' | 'okay' | 'distracted' | null;
                    session_note: string | null;
                    session_type: string;
                    started_at: string;
                    ended_at: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    subject_id: string;
                    topic_id?: string | null;
                    sub_topic_id?: string | null;
                    task_id?: string | null;
                    auto_created_task_id?: string | null;
                    duration_seconds: number;
                    target_duration_seconds?: number | null;
                    session_quality?: 'focused' | 'okay' | 'distracted' | null;
                    session_note?: string | null;
                    session_type?: string;
                    started_at: string;
                    ended_at: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    subject_id?: string;
                    topic_id?: string | null;
                    sub_topic_id?: string | null;
                    task_id?: string | null;
                    auto_created_task_id?: string | null;
                    duration_seconds?: number;
                    target_duration_seconds?: number | null;
                    session_quality?: 'focused' | 'okay' | 'distracted' | null;
                    session_note?: string | null;
                    session_type?: string;
                    started_at?: string;
                    ended_at?: string;
                    created_at?: string;
                };
            };

            // Tasks
            tasks: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    topic_id: string | null;
                    sub_topic_id: string | null;
                    priority: 'low' | 'medium' | 'high';
                    difficulty: number | null;
                    confidence: number | null;
                    due_date: string;
                    is_completed: boolean;
                    completed_at: string | null;
                    type: string | null;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    topic_id?: string | null;
                    sub_topic_id?: string | null;
                    priority?: 'low' | 'medium' | 'high';
                    difficulty?: number | null;
                    confidence?: number | null;
                    due_date: string;
                    is_completed?: boolean;
                    completed_at?: string | null;
                    type?: string | null;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    topic_id?: string | null;
                    sub_topic_id?: string | null;
                    priority?: 'low' | 'medium' | 'high';
                    difficulty?: number | null;
                    confidence?: number | null;
                    due_date?: string;
                    is_completed?: boolean;
                    completed_at?: string | null;
                    type?: string | null;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            // Subjects
            subjects: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    color: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    color: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    color?: string;
                    created_at?: string;
                };
            };

            // Topics
            topics: {
                Row: {
                    id: string;
                    subject_id: string;
                    name: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    subject_id: string;
                    name: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    subject_id?: string;
                    name?: string;
                    created_at?: string;
                };
            };

            // Sub Topics
            sub_topics: {
                Row: {
                    id: string;
                    topic_id: string;
                    name: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    topic_id: string;
                    name: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    topic_id?: string;
                    name?: string;
                    created_at?: string;
                };
            };

            // User Profiles
            user_profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    full_name: string | null;
                    selected_plan_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    full_name?: string | null;
                    selected_plan_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    full_name?: string | null;
                    selected_plan_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            // Daily Notes
            daily_notes: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    content: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    date: string;
                    content: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    date?: string;
                    content?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            // User Capacity
            user_capacity: {
                Row: {
                    user_id: string;
                    max_tasks_per_day: number;
                    default_focus_minutes: number;
                    default_break_minutes: number;
                    max_daily_focus_minutes: number;
                    recommended_sessions_per_day: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    max_tasks_per_day?: number;
                    default_focus_minutes?: number;
                    default_break_minutes?: number;
                    max_daily_focus_minutes?: number;
                    recommended_sessions_per_day?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    max_tasks_per_day?: number;
                    default_focus_minutes?: number;
                    default_break_minutes?: number;
                    max_daily_focus_minutes?: number;
                    recommended_sessions_per_day?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            // Capacity Overrides (for analytics)
            capacity_overrides: {
                Row: {
                    id: string;
                    user_id: string;
                    override_type: 'task_limit' | 'focus_limit';
                    original_limit: number;
                    override_value: number;
                    reason: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    override_type: 'task_limit' | 'focus_limit';
                    original_limit: number;
                    override_value: number;
                    reason?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    override_type?: 'task_limit' | 'focus_limit';
                    original_limit?: number;
                    override_value?: number;
                    reason?: string | null;
                    created_at?: string;
                };
            };
        };
    };
}

// Convenience type exports
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
export type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert'];
export type FocusSessionUpdate = Database['public']['Tables']['focus_sessions']['Update'];

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type Subject = Database['public']['Tables']['subjects']['Row'];
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert'];
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update'];

export type Topic = Database['public']['Tables']['topics']['Row'];
export type TopicInsert = Database['public']['Tables']['topics']['Insert'];
export type TopicUpdate = Database['public']['Tables']['topics']['Update'];

export type SubTopic = Database['public']['Tables']['sub_topics']['Row'];
export type SubTopicInsert = Database['public']['Tables']['sub_topics']['Insert'];
export type SubTopicUpdate = Database['public']['Tables']['sub_topics']['Update'];

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type DailyNote = Database['public']['Tables']['daily_notes']['Row'];
export type DailyNoteInsert = Database['public']['Tables']['daily_notes']['Insert'];
export type DailyNoteUpdate = Database['public']['Tables']['daily_notes']['Update'];

export type UserCapacity = Database['public']['Tables']['user_capacity']['Row'];
export type UserCapacityInsert = Database['public']['Tables']['user_capacity']['Insert'];
export type UserCapacityUpdate = Database['public']['Tables']['user_capacity']['Update'];

export type CapacityOverride = Database['public']['Tables']['capacity_overrides']['Row'];
export type CapacityOverrideInsert = Database['public']['Tables']['capacity_overrides']['Insert'];
export type CapacityOverrideUpdate = Database['public']['Tables']['capacity_overrides']['Update'];

