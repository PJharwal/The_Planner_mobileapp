// Database Types for Student Study App

export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
}

export interface Subject {
    id: string;
    user_id: string;
    name: string;
    color: string;
    icon: string;
    created_at: string;
}

export interface Topic {
    id: string;
    subject_id: string;
    user_id: string;
    name: string;
    order_index: number;
    created_at: string;
}

// Learning Intelligence Types
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type SessionQuality = 'focused' | 'okay' | 'distracted';

export interface SubTopic {
    id: string;
    topic_id: string;
    user_id: string;
    name: string;
    order_index: number;
    difficulty?: DifficultyLevel; // NEW: Optional difficulty tag
    created_at: string;
}

export interface Task {
    id: string;
    topic_id?: string; // Legacy, kept for compatibility
    sub_topic_id: string;
    user_id: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
    priority: 'low' | 'medium' | 'high';
    difficulty?: DifficultyLevel; // NEW: Optional difficulty tag
    created_at: string;
    completed_at?: string;
}

export interface TaskNote {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export interface DailyNote {
    id: string;
    user_id: string;
    date: string;
    title?: string;
    content: string;
    created_at: string;
}

export interface ExamMode {
    id: string;
    user_id: string;
    name: string;
    exam_date: string;
    is_active: boolean;
    created_at: string;
}

export interface ExamTask {
    id: string;
    exam_id: string;
    task_id: string;
    is_completed: boolean;
}

export interface AnalyticsSnapshot {
    id: string;
    user_id: string;
    date: string;
    tasks_completed: number;
    tasks_missed: number;
    streak_count: number;
    created_at: string;
}

// ============================================
// LEARNING INTELLIGENCE TYPES
// ============================================

export interface ConfidenceTracking {
    id: string;
    user_id: string;
    sub_topic_id: string;
    level: ConfidenceLevel;
    updated_at: string;
    created_at: string;
}

export interface RevisionHistory {
    id: string;
    user_id: string;
    sub_topic_id: string;
    reviewed_at: string;
}

export interface ExamReflection {
    id: string;
    user_id: string;
    exam_id: string;
    what_worked?: string;
    what_didnt?: string;
    changes_next_time?: string;
    created_at: string;
}

export interface FocusSession {
    id: string;
    user_id: string;
    subject_id?: string;
    topic_id?: string;
    sub_topic_id?: string;
    task_id?: string;
    duration_seconds: number;
    target_duration_seconds?: number;
    started_at: string;
    ended_at: string;
    session_type: string;
    quality_rating?: SessionQuality; // NEW: Session quality reflection
}

export interface StudyInsight {
    type: 'best_time' | 'consistency' | 'intensity' | 'revision_needed' | 'weak_area';
    title: string;
    description: string;
    data?: any;
    dismissible: boolean;
}

export interface RevisionSuggestion {
    subTopicId: string;
    subTopicName: string;
    topicName: string;
    subjectName: string;
    subjectColor: string;
    reason: 'inactive' | 'low_confidence' | 'hard_topic' | 'exam_soon';
    reasonText: string;
    daysSinceReview: number;
    confidence?: ConfidenceLevel;
    difficulty?: DifficultyLevel;
    priority: number;
}

// Extended types with relations
export interface SubjectWithTopics extends Subject {
    topics: Topic[];
}

export interface TopicWithSubTopics extends Topic {
    sub_topics: SubTopic[];
}

export interface SubTopicWithTasks extends SubTopic {
    tasks: Task[];
}

export interface TopicWithTasks extends Topic {
    tasks: Task[];
}

export interface TaskWithNotes extends Task {
    notes: TaskNote[];
}

export interface SubTopicWithConfidence extends SubTopic {
    confidence?: ConfidenceTracking;
    lastReviewedAt?: string;
}

// Form types
export interface CreateSubjectInput {
    name: string;
    color?: string;
    icon?: string;
}

export interface CreateTopicInput {
    subject_id: string;
    name: string;
}

export interface CreateSubTopicInput {
    topic_id: string;
    name: string;
    difficulty?: DifficultyLevel;
}

export interface CreateTaskInput {
    sub_topic_id: string;
    title: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    difficulty?: DifficultyLevel;
}

export interface CreateDailyNoteInput {
    date: string;
    title?: string;
    content: string;
}

export interface CreateExamModeInput {
    name: string;
    exam_date: string;
}

// Auth types
export interface AuthState {
    user: User | null;
    session: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// Tab icons
export type TabName = 'home' | 'subjects' | 'notes' | 'analytics' | 'profile';


// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'incomplete';
export type PlanType = 'free' | 'premium_monthly' | 'premium_yearly';

export interface Subscription {
    user_id: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    plan_id: PlanType;
    status: SubscriptionStatus;
    trial_start_at?: string;
    trial_ends_at?: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================
// REVENUECAT TYPES
// ============================================

export type SubscriptionType = 'free' | 'monthly' | 'yearly';

export interface ProEntitlement {
    isActive: boolean;
    expiresAt: Date | null;
    productIdentifier: string | null;
}

