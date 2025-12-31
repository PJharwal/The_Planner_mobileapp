import { z } from 'zod';

/**
 * Session configuration validation
 * Prevents invalid durations, missing subjects, and injection attempts
 */
export const SessionConfigSchema = z.object({
    /** Session duration in minutes */
    duration: z.number()
        .int('Duration must be a whole number')
        .min(1, 'Minimum session is 1 minute')
        .max(180, 'Maximum session is 3 hours'),

    /** Required subject UUID */
    subjectId: z.string()
        .uuid('Invalid subject ID format')
        .min(1, 'Subject is required'),

    /** Optional topic UUID */
    topicId: z.string()
        .uuid('Invalid topic ID format')
        .optional(),

    /** Optional sub-topic UUID */
    subTopicId: z.string()
        .uuid('Invalid sub-topic ID format')
        .optional(),

    /** Optional session note (sanitized) */
    note: z.string()
        .max(200, 'Note must be under 200 characters')
        .trim()
        .transform((val) => val || undefined) // Convert empty string to undefined
        .optional()
});

export type ValidatedSessionConfig = z.infer<typeof SessionConfigSchema>;


/**
 * Focus session database insert schema
 * Validates data before insertion to prevent corruption
 */
export const FocusSessionInsertSchema = z.object({
    user_id: z.string().uuid(),
    subject_id: z.string().uuid(),
    topic_id: z.string().uuid().nullable(),
    sub_topic_id: z.string().uuid().nullable(),
    task_id: z.string().uuid().nullable(),
    auto_created_task_id: z.string().uuid().nullable(),
    duration_seconds: z.number()
        .int()
        .min(1, 'Duration must be at least 1 second')
        .max(86400, 'Duration cannot exceed 24 hours'),
    target_duration_seconds: z.number()
        .int()
        .min(1)
        .max(86400)
        .nullable(),
    session_quality: z.enum(['focused', 'okay', 'distracted']).nullable(),
    session_note: z.string().max(200).nullable(),
    session_type: z.string().default('focus'),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime()
}).refine(
    (data) => new Date(data.ended_at) > new Date(data.started_at),
    {
        message: 'End time must be after start time',
        path: ['ended_at']
    }
);

export type ValidatedFocusSessionInsert = z.infer<typeof FocusSessionInsertSchema>;

/**
 * Session quality rating schema
 */
export const SessionQualitySchema = z.enum(['focused', 'okay', 'distracted'], {
    message: 'Quality must be: focused, okay, or distracted'
});

export type ValidatedSessionQuality = z.infer<typeof SessionQualitySchema>;

