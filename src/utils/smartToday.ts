// Smart Today - AI-powered task suggestions
// Suggests today's study plan based on priorities

import { supabase } from '../lib/supabase';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';
import type { Task } from '../types/database';
import type { TaskWithRelations } from '../types/app';
import { handleError } from '../lib/errorHandler';

// Pagination constant to prevent loading too many tasks at once
const MAX_TASKS_TO_FETCH = 100;

export type SuggestionReason = 'exam_soon' | 'missed_yesterday' | 'due_soon' | 'balanced' | 'high_priority' | 'low_confidence' | 'needs_revision';

export interface SuggestedTask {
    task: TaskWithRelations;
    reason: SuggestionReason;
    reasonText: string;
    priority: number; // 1-100, higher = more urgent
    subjectName?: string;
    subjectColor?: string;
}

export interface SmartTodayResult {
    suggestions: SuggestedTask[];
    totalPending: number;
    examDaysAway: number | null;
}

/**
 * Get smart task suggestions for today
 * Priority order:
 * 1. Exam-related tasks (exam in ≤7 days)
 * 2. Missed tasks from yesterday
 * 3. High priority pending tasks
 * 4. Tasks with nearest due date
 * 5. Balance across subjects
 * 
 * PROFILE-AWARE: Respects user's daily task limit from their adaptive plan
 */
export async function getSmartTodaySuggestions(userId: string, maxSuggestions: number = 8): Promise<SmartTodayResult> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    const suggestions: SuggestedTask[] = [];

    try {
        // 1. Check for active exam mode
        const { data: activeExam } = await supabase
            .from('exam_modes')
            .select('*, exam_tasks(task_id)')
            .eq('is_active', true)
            .single();

        let examDaysAway: number | null = null;

        if (activeExam) {
            examDaysAway = differenceInDays(parseISO(activeExam.exam_date), new Date());

            // If exam in ≤7 days, prioritize exam tasks
            if (examDaysAway <= 7 && examDaysAway >= 0) {
                const examTaskIds = activeExam.exam_tasks?.map((et: any) => et.task_id) || [];

                if (examTaskIds.length > 0) {
                    const { data: examTasks } = await supabase
                        .from('tasks')
                        .select('*, topics(name, subjects(name, color))')
                        .in('id', examTaskIds)
                        .eq('is_completed', false)
                        .limit(MAX_TASKS_TO_FETCH);

                    (examTasks as TaskWithRelations[])?.forEach(task => {
                        suggestions.push({
                            task,
                            reason: 'exam_soon',
                            reasonText: `Exam in ${examDaysAway} days`,
                            priority: 100 - examDaysAway!,
                            subjectName: task.topics?.subjects?.name,
                            subjectColor: task.topics?.subjects?.color,
                        });
                    });
                }
            }
        }

        // 2. Get missed tasks from yesterday
        const { data: missedTasks } = await supabase
            .from('tasks')
            .select('*, topics(name, subjects(name, color))')
            .eq('is_completed', false)
            .lt('due_date', today)
            .order('due_date', { ascending: true })
            .limit(MAX_TASKS_TO_FETCH);

        (missedTasks as TaskWithRelations[])?.forEach(task => {
            if (!suggestions.find(s => s.task.id === task.id)) {
                suggestions.push({
                    task,
                    reason: 'missed_yesterday',
                    reasonText: 'Missed - carry forward',
                    priority: 85,
                    subjectName: task.topics?.subjects?.name,
                    subjectColor: task.topics?.subjects?.color,
                });
            }
        });

        // 3. Get high priority tasks
        const { data: highPriorityTasks } = await supabase
            .from('tasks')
            .select('*, topics(name, subjects(name, color))')
            .eq('is_completed', false)
            .eq('priority', 'high')
            .limit(MAX_TASKS_TO_FETCH);

        (highPriorityTasks as TaskWithRelations[])?.forEach(task => {
            if (!suggestions.find(s => s.task.id === task.id)) {
                suggestions.push({
                    task,
                    reason: 'high_priority',
                    reasonText: 'High priority',
                    priority: 80,
                    subjectName: task.topics?.subjects?.name,
                    subjectColor: task.topics?.subjects?.color,
                });
            }
        });

        // 4. Get tasks due soon
        const { data: dueSoonTasks } = await supabase
            .from('tasks')
            .select('*, topics(name, subjects(name, color))')
            .eq('is_completed', false)
            .gte('due_date', today)
            .order('due_date', { ascending: true })
            .limit(MAX_TASKS_TO_FETCH);

        (dueSoonTasks as TaskWithRelations[])?.forEach(task => {
            if (!suggestions.find(s => s.task.id === task.id)) {
                const daysUntilDue = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : 30;
                suggestions.push({
                    task,
                    reason: 'due_soon',
                    reasonText: daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} days`,
                    priority: 70 - Math.min(daysUntilDue, 30),
                    subjectName: task.topics?.subjects?.name,
                    subjectColor: task.topics?.subjects?.color,
                });
            }
        });

        // 5. Balance: Add tasks from subjects with fewer suggestions
        const subjectCounts: Record<string, number> = {};
        suggestions.forEach(s => {
            if (s.subjectName) {
                subjectCounts[s.subjectName] = (subjectCounts[s.subjectName] || 0) + 1;
            }
        });

        // Get total pending count
        const { count: totalPending } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('is_completed', false);

        // Sort by priority and limit to profile-based max (or default 8)
        suggestions.sort((a, b) => b.priority - a.priority);

        return {
            suggestions: suggestions.slice(0, maxSuggestions),
            totalPending: totalPending || 0,
            examDaysAway,
        };

    } catch (error) {
        console.error('Smart Today error:', error);
        return { suggestions: [], totalPending: 0, examDaysAway: null };
    }
}

/**
 * Remove a task from today's suggestions (user dismissed it)
 */
export function removeSuggestion(
    suggestions: SuggestedTask[],
    taskId: string
): SuggestedTask[] {
    return suggestions.filter(s => s.task.id !== taskId);
}

/**
 * Reorder suggestions
 */
export function reorderSuggestions(
    suggestions: SuggestedTask[],
    fromIndex: number,
    toIndex: number
): SuggestedTask[] {
    const result = [...suggestions];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
}
