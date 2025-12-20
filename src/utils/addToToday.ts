// Add to Today Utility - Subject/Topic/SubTopic/Task hierarchy
import { supabase } from '../lib/supabase';

export interface AddToTodayResult {
    success: boolean;
    addedCount: number;
    message: string;
}

/**
 * Helper to get user and today's date
 */
async function getContext() {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split('T')[0];
    return { user, today };
}

/**
 * Helper to add multiple tasks to today, avoiding duplicates
 */
async function addTasksToToday(taskIds: string[], userId: string, today: string): Promise<number> {
    if (taskIds.length === 0) return 0;

    // Get existing today tasks to avoid duplicates
    const { data: existingToday } = await supabase
        .from('today_tasks')
        .select('task_id')
        .eq('user_id', userId)
        .eq('date', today);

    const existingTaskIds = new Set(existingToday?.map(t => t.task_id) || []);

    // Filter out tasks that are already in today's list
    const newTaskIds = taskIds.filter(id => !existingTaskIds.has(id));

    if (newTaskIds.length === 0) return 0;

    // Insert new today tasks
    await supabase
        .from('today_tasks')
        .insert(newTaskIds.map(id => ({
            user_id: userId,
            task_id: id,
            date: today
        })));

    return newTaskIds.length;
}

/**
 * Add all pending tasks from a SUBJECT to Today
 */
export async function addSubjectToToday(subjectId: string): Promise<AddToTodayResult> {
    try {
        const { user, today } = await getContext();
        if (!user) return { success: false, addedCount: 0, message: 'Not authenticated' };

        // Get all pending tasks under this subject (via topics -> sub_topics -> tasks)
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                id,
                sub_topics!inner (
                    topic_id,
                    topics!inner (
                        subject_id
                    )
                )
            `)
            .eq('is_completed', false)
            .eq('sub_topics.topics.subject_id', subjectId);

        if (error) throw error;
        if (!tasks || tasks.length === 0) {
            return { success: true, addedCount: 0, message: 'No pending tasks' };
        }

        const addedCount = await addTasksToToday(tasks.map(t => t.id), user.id, today);

        return {
            success: true,
            addedCount,
            message: addedCount > 0 ? `${addedCount} task${addedCount > 1 ? 's' : ''} added` : 'Already in Today'
        };
    } catch (error: any) {
        console.error('Error adding subject to today:', error);
        return { success: false, addedCount: 0, message: error.message || 'Failed' };
    }
}

/**
 * Add all pending tasks from a TOPIC to Today
 */
export async function addTopicToToday(topicId: string): Promise<AddToTodayResult> {
    try {
        const { user, today } = await getContext();
        if (!user) return { success: false, addedCount: 0, message: 'Not authenticated' };

        // Get all pending tasks under this topic (via sub_topics)
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
                id,
                sub_topics!inner (topic_id)
            `)
            .eq('is_completed', false)
            .eq('sub_topics.topic_id', topicId);

        if (error) throw error;
        if (!tasks || tasks.length === 0) {
            return { success: true, addedCount: 0, message: 'No pending tasks' };
        }

        const addedCount = await addTasksToToday(tasks.map(t => t.id), user.id, today);

        return {
            success: true,
            addedCount,
            message: addedCount > 0 ? `${addedCount} task${addedCount > 1 ? 's' : ''} added` : 'Already in Today'
        };
    } catch (error: any) {
        console.error('Error adding topic to today:', error);
        return { success: false, addedCount: 0, message: error.message || 'Failed' };
    }
}

/**
 * Add all pending tasks from a SUB-TOPIC to Today
 */
export async function addSubTopicToToday(subTopicId: string): Promise<AddToTodayResult> {
    try {
        const { user, today } = await getContext();
        if (!user) return { success: false, addedCount: 0, message: 'Not authenticated' };

        // Get all pending tasks under this sub-topic
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id')
            .eq('sub_topic_id', subTopicId)
            .eq('is_completed', false);

        if (error) throw error;
        if (!tasks || tasks.length === 0) {
            return { success: true, addedCount: 0, message: 'No pending tasks' };
        }

        const addedCount = await addTasksToToday(tasks.map(t => t.id), user.id, today);

        return {
            success: true,
            addedCount,
            message: addedCount > 0 ? `${addedCount} task${addedCount > 1 ? 's' : ''} added` : 'Already in Today'
        };
    } catch (error: any) {
        console.error('Error adding sub-topic to today:', error);
        return { success: false, addedCount: 0, message: error.message || 'Failed' };
    }
}

/**
 * Add a single task to Today's list
 */
export async function addTaskToToday(taskId: string): Promise<AddToTodayResult> {
    try {
        const { user, today } = await getContext();
        if (!user) return { success: false, addedCount: 0, message: 'Not authenticated' };

        // Check if already in today's list
        const { data: existing } = await supabase
            .from('today_tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('task_id', taskId)
            .eq('date', today)
            .single();

        if (existing) {
            return { success: true, addedCount: 0, message: 'Already in Today' };
        }

        // Insert
        const { error } = await supabase
            .from('today_tasks')
            .insert({ user_id: user.id, task_id: taskId, date: today });

        if (error) throw error;

        return { success: true, addedCount: 1, message: 'Added to Today' };
    } catch (error: any) {
        console.error('Error adding task to today:', error);
        return { success: false, addedCount: 0, message: error.message || 'Failed' };
    }
}

/**
 * Check if a task is already in Today
 */
export async function isTaskInToday(taskId: string): Promise<boolean> {
    try {
        const { user, today } = await getContext();
        if (!user) return false;

        const { data } = await supabase
            .from('today_tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('task_id', taskId)
            .eq('date', today)
            .single();

        return !!data;
    } catch {
        return false;
    }
}

/**
 * Get all tasks in Today's list for current user
 */
export async function getTodayTasks() {
    try {
        const { user, today } = await getContext();
        if (!user) return [];

        const { data, error } = await supabase
            .from('today_tasks')
            .select(`
                id,
                task_id,
                tasks (
                    id,
                    title,
                    is_completed,
                    priority,
                    due_date,
                    sub_topic_id,
                    sub_topics (
                        id,
                        name,
                        topic_id,
                        topics (
                            id,
                            name,
                            subject_id,
                            subjects (
                                id,
                                name,
                                color
                            )
                        )
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('date', today);

        if (error) throw error;

        // Flatten the response
        return data?.map(t => ({
            todayId: t.id,
            ...(t.tasks as any),
            subTopic: (t.tasks as any)?.sub_topics,
            topic: (t.tasks as any)?.sub_topics?.topics,
            subject: (t.tasks as any)?.sub_topics?.topics?.subjects
        })) || [];

    } catch (error) {
        console.error('Error fetching today tasks:', error);
        return [];
    }
}

/**
 * Remove a task from Today's list
 */
export async function removeFromToday(taskId: string): Promise<boolean> {
    try {
        const { user, today } = await getContext();
        if (!user) return false;

        const { error } = await supabase
            .from('today_tasks')
            .delete()
            .eq('user_id', user.id)
            .eq('task_id', taskId)
            .eq('date', today);

        return !error;
    } catch (error) {
        console.error('Error removing from today:', error);
        return false;
    }
}
