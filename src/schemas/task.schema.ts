import { z } from 'zod';

/**
 * Task creation validation
 * Prevents XSS, missing required fields, and invalid dates
 */
export const TaskCreateSchema = z.object({
    /** Task title (sanitized for XSS) */
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be under 200 characters')
        .trim()
        .transform((val) => val.replace(/[<>]/g, '')), // Basic XSS prevention

    /** Priority level */
    priority: z.enum(['low', 'medium', 'high'], {
        message: 'Priority must be low, medium, or high'
    }).default('medium'),

    /** Optional topic (if provided, must be valid UUID) */
    topic_id: z.string()
        .uuid('Invalid topic ID')
        .nullable()
        .optional(),

    /** Optional sub-topic (if provided, must be valid UUID) */
    sub_topic_id: z.string()
        .uuid('Invalid sub-topic ID')
        .nullable()
        .optional(),

    /** Due date (must be today or future) */
    due_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .refine(
            (date) => {
                const dueDate = new Date(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return dueDate >= today;
            },
            { message: 'Due date cannot be in the past' }
        ),

    /** Optional difficulty rating */
    difficulty: z.number()
        .int()
        .min(1, 'Difficulty must be 1-5')
        .max(5, 'Difficulty must be 1-5')
        .optional(),

    /** Optional confidence rating */
    confidence: z.number()
        .int()
        .min(1, 'Confidence must be 1-5')
        .max(5, 'Confidence must be 1-5')
        .optional(),

    /** Optional description */
    description: z.string()
        .max(1000, 'Description must be under 1000 characters')
        .trim()
        .transform((val) => val.replace(/[<>]/g, ''))
        .optional(),

    /** Task type */
    type: z.enum(['regular', 'revision', 'exam_prep']).default('regular').optional()
});

export type ValidatedTaskCreate = z.infer<typeof TaskCreateSchema>;

/**
 * Quick add task schema (minimal validation for home screen)
 */
export const QuickAddTaskSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title too long')
        .trim()
        .transform((val) => val.replace(/[<>]/g, '')),

    priority: z.enum(['low', 'medium', 'high']).default('medium'),

    due_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
});

export type ValidatedQuickAddTask = z.infer<typeof QuickAddTaskSchema>;

/**
 * Task update schema (all fields optional for partial updates)
 */
export const TaskUpdateSchema = z.object({
    title: z.string()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title too long')
        .trim()
        .transform((val) => val.replace(/[<>]/g, ''))
        .optional(),

    priority: z.enum(['low', 'medium', 'high']).optional(),

    topic_id: z.string().uuid().nullable().optional(),

    sub_topic_id: z.string().uuid().nullable().optional(),

    difficulty: z.number().int().min(1).max(5).optional(),

    confidence: z.number().int().min(1).max(5).optional(),

    due_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),

    is_completed: z.boolean().optional(),

    description: z.string()
        .max(1000)
        .trim()
        .transform((val) => val.replace(/[<>]/g, ''))
        .optional()
});

export type ValidatedTaskUpdate = z.infer<typeof TaskUpdateSchema>;
