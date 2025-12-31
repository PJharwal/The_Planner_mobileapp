import { FocusSession, Task, Subject, Topic, SubTopic, DailyNote } from './database';

/**
 * Application-specific types (UI-ready with relationships)
 */

// Enriched types with joined data
export interface TaskWithRelations extends Task {
    topics?: Topic & {
        subjects?: Subject;
    };
    sub_topics?: SubTopic & {
        topics?: Topic & {
            subjects?: Subject;
        };
    };
}

export interface FocusSessionWithRelations extends FocusSession {
    subjects?: Subject;
    topics?: Topic;
    sub_topics?: SubTopic;
    tasks?: Task;
}

export interface SubTopicWithRelations extends SubTopic {
    topics?: Topic & {
        subjects?: Subject;
    };
}

export interface TopicWithRelations extends Topic {
    subjects?: Subject;
}

// UI State Types
export interface SuggestedTask {
    task: TaskWithRelations;
    score: number;
    reason: string;
    subjectName?: string;
    subjectColor?: string;
}

export interface ExportData {
    subjects: Subject[];
    topics: Topic[];
    subTopics: SubTopic[];
    tasks: Task[];
    todayTasks: Task[];
    focusSessions: FocusSession[];
    dailyNotes: DailyNote[];
    dailyReflections: DailyReflection[];
    examModes: ExamMode[];
    exportedAt: string;
    version: string;
}

// Other supporting types
export interface DailyReflection {
    id: string;
    user_id: string;
    date: string;
    mood: number;
    productivity: number;
    notes: string | null;
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

export interface StudyInsight {
    id: string;
    type: 'pattern' | 'achievement' | 'suggestion' | 'warning';
    title: string;
    description: string;
    priority: number;
    data?: Record<string, unknown>;
}

// Analytics types
export interface SubjectBreakdown {
    subject_id: string;
    subject_name: string;
    subject_color: string;
    total_minutes: number;
    session_count: number;
    percentage: number;
}

export interface TopicBreakdown {
    topic_id: string;
    topic_name: string;
    subject_name: string;
    total_minutes: number;
    session_count: number;
}

export interface StudyStats {
    todayMinutes: number;
    weekMinutes: number;
    allTimeMinutes: number;
    todaySessions: number;
    weekSessions: number;
    completionRate: number;
    subjectBreakdown: SubjectBreakdown[];
    topicBreakdown: TopicBreakdown[];
}

// Offline queue types
export interface QueuedItem<T = unknown> {
    id: string;
    type: 'session' | 'task' | 'note' | 'update';
    data: T;
    timestamp: number;
    retryCount: number;
}
