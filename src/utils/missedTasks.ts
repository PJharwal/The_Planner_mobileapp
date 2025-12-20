// Missed Task Recovery Utilities
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { format, subDays } from 'date-fns';

export interface MissedTask {
    task: Task;
    daysMissed: number;
    subjectName?: string;
    subjectColor?: string;
}

export type SkipReason = 'too_difficult' | 'no_time' | 'low_priority' | 'rescheduled';

/**
 * Get tasks that are overdue (missed)
 */
export async function getMissedTasks(): Promise<MissedTask[]> {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*, topics(name, subjects(name, color))')
            .eq('is_completed', false)
            .lt('due_date', today)
            .order('due_date', { ascending: true })
            .limit(10);

        if (error) throw error;

        return (tasks || []).map(task => {
            const dueDate = new Date(task.due_date);
            const now = new Date();
            const daysMissed = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
                task,
                daysMissed,
                subjectName: (task as any).topics?.subjects?.name,
                subjectColor: (task as any).topics?.subjects?.color,
            };
        });
    } catch (error) {
        console.error('Error fetching missed tasks:', error);
        return [];
    }
}

/**
 * Reschedule a missed task to today
 */
export async function rescheduleToToday(taskId: string): Promise<boolean> {
    try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { error } = await supabase
            .from('tasks')
            .update({ due_date: today })
            .eq('id', taskId);

        if (error) throw error;

        // Log the reschedule
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('missed_task_reasons').insert({
                task_id: taskId,
                user_id: user.id,
                reason: 'rescheduled',
                original_due_date: null, // Could track this if needed
            });
        }

        return true;
    } catch (error) {
        console.error('Error rescheduling task:', error);
        return false;
    }
}

/**
 * Skip a missed task with a reason
 */
export async function skipTask(taskId: string, reason: SkipReason): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Mark task as completed (skipped)
        const { error: updateError } = await supabase
            .from('tasks')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

        if (updateError) throw updateError;

        // Log the skip reason
        await supabase.from('missed_task_reasons').insert({
            task_id: taskId,
            user_id: user.id,
            reason,
        });

        return true;
    } catch (error) {
        console.error('Error skipping task:', error);
        return false;
    }
}

/**
 * Get skip reason label
 */
export function getSkipReasonLabel(reason: SkipReason): string {
    switch (reason) {
        case 'too_difficult': return 'Too difficult';
        case 'no_time': return 'No time';
        case 'low_priority': return 'Low priority';
        case 'rescheduled': return 'Rescheduled';
    }
}
