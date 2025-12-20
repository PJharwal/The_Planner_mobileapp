// Smart Today - AI-powered task suggestions
// Suggests today's study plan based on priorities

import { Task, Subject } from '../types';
import { supabase } from '../lib/supabase';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

export type SuggestionReason = 'exam_soon' | 'missed_yesterday' | 'due_soon' | 'balanced' | 'high_priority';

export interface SuggestedTask {
    task: Task;
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
 */
export async function getSmartTodaySuggestions(userId: string): Promise<SmartTodayResult> {
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
                        .eq('is_completed', false);

                    examTasks?.forEach(task => {
                        suggestions.push({
                            task,
                            reason: 'exam_soon',
                            reasonText: `Exam in ${examDaysAway} days`,
                            priority: 100 - examDaysAway!,
                            subjectName: (task as any).topics?.subjects?.name,
                            subjectColor: (task as any).topics?.subjects?.color,
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
            .limit(5);

        missedTasks?.forEach(task => {
            if (!suggestions.find(s => s.task.id === task.id)) {
                suggestions.push({
                    task,
                    reason: 'missed_yesterday',
                    reasonText: 'Missed - carry forward',
                    priority: 85,
                    subjectName: (task as any).topics?.subjects?.name,
                    subjectColor: (task as any).topics?.subjects?.color,
                });
            }
        });

        // 3. Get high priority tasks
        const { data: highPriorityTasks } = await supabase
            .from('tasks')
            .select('*, topics(name, subjects(name, color))')
            .eq('is_completed', false)
            .eq('priority', 'high')
            .limit(5);

        highPriorityTasks?.forEach(task => {
            if (!suggestions.find(s => s.task.id === task.id)) {
                suggestions.push({
                    task,
                    reason: 'high_priority',
                    reasonText: 'High priority',
                    priority: 80,
                    subjectName: (task as any).topics?.subjects?.name,
                    subjectColor: (task as any).topics?.subjects?.color,
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
            .limit(10);

        dueSoonTasks?.forEach(task => {
            if (!suggestions.find(s => s.task.id === task.id)) {
                const daysUntilDue = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : 30;
                suggestions.push({
                    task,
                    reason: 'due_soon',
                    reasonText: daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} days`,
                    priority: 70 - Math.min(daysUntilDue, 30),
                    subjectName: (task as any).topics?.subjects?.name,
                    subjectColor: (task as any).topics?.subjects?.color,
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

        // Sort by priority and limit to top 8
        suggestions.sort((a, b) => b.priority - a.priority);

        return {
            suggestions: suggestions.slice(0, 8),
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
