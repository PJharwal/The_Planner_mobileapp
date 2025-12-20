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

export interface SubTopic {
    id: string;
    topic_id: string;
    user_id: string;
    name: string;
    order_index: number;
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
}

export interface CreateTaskInput {
    sub_topic_id: string;
    title: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
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
