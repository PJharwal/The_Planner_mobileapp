import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { offlineQueue } from './offlineQueue';
import { handleError } from '../lib/errorHandler';


export interface SessionTaskConfig {
    subjectId: string;
    topicId?: string;
    subTopicId?: string;
    sessionNote?: string;
    sessionDuration: number;
}

/**
 * Find or create a task for a focus session
 * If a matching task exists for today → link to it
 * If none exists → auto-create a "Focus session" task
 */
export async function linkSessionToTask(config: SessionTaskConfig): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const today = format(new Date(), 'yyyy-MM-dd');

        // 1. Try to find matching task for today
        let query = supabase
            .from('tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('due_date', today)
            .eq('is_completed', false);

        // Match by subject/topic/subtopic hierarchy
        if (config.subTopicId) {
            query = query.eq('sub_topic_id', config.subTopicId);
        } else if (config.topicId) {
            query = query.eq('topic_id', config.topicId).is('sub_topic_id', null);
        } else {
            query = query.is('topic_id', null).is('sub_topic_id', null);
        }

        const { data: existingTasks } = await query.limit(1);

        if (existingTasks && existingTasks.length > 0) {
            // Link to existing task
            return existingTasks[0].id;
        }

        // 2. No matching task → auto-create one
        const taskTitle = await generateTaskTitle(config);

        const { data: newTask, error } = await supabase
            .from('tasks')
            .insert({
                user_id: user.id,
                sub_topic_id: config.subTopicId || null,
                topic_id: config.topicId || null,
                title: taskTitle,
                priority: 'medium',
                due_date: today,
                is_completed: true, // Mark as completed immediately
                completed_at: new Date().toISOString(),
                type: 'focus_generated', // Special type for auto-generated tasks
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating session task:', error);
            return null;
        }

        return newTask.id;
    } catch (error) {
        console.error('Error in linkSessionToTask:', error);
        return null;
    }
}

/**
 * Generate a descriptive title for the auto-created task
 */
async function generateTaskTitle(config: SessionTaskConfig): Promise<string> {
    try {
        // Fetch names for subject/topic/subtopic
        let subjectName = 'Study';
        let topicName = '';
        let subTopicName = '';

        if (config.subTopicId) {
            const { data: subTopic } = await supabase
                .from('sub_topics')
                .select('name, topics(name, subjects(name))')
                .eq('id', config.subTopicId)
                .single();

            if (subTopic) {
                subTopicName = subTopic.name;
                topicName = (subTopic.topics as any)?.name || '';
                subjectName = (subTopic.topics as any)?.subjects?.name || 'Study';
            }
        } else if (config.topicId) {
            const { data: topic } = await supabase
                .from('topics')
                .select('name, subjects(name)')
                .eq('id', config.topicId)
                .single();

            if (topic) {
                topicName = topic.name;
                subjectName = (topic.subjects as any)?.name || 'Study';
            }
        } else {
            const { data: subject } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', config.subjectId)
                .single();

            if (subject) {
                subjectName = subject.name;
            }
        }

        // Build title based on hierarchy
        if (subTopicName) {
            return `Focus: ${subTopicName} `;
        } else if (topicName) {
            return `Focus: ${topicName} `;
        } else {
            return `Focus: ${subjectName} `;
        }
    } catch (error) {
        console.error('Error generating task title:', error);
        return `Focus session - ${config.sessionDuration} min`;
    }
}

/**
 * Save a completed focus session to the database
 * Also links it to a task (existing or auto-created)
 */
export async function saveFocusSession(
    config: SessionTaskConfig,
    durationSeconds: number,
    quality?: 'focused' | 'okay' | 'distracted'
): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Discard sessions < 60 seconds
        if (durationSeconds < 60) {
            return false;
        }

        // Link to or create task
        const taskId = await linkSessionToTask(config);

        // Prepare session data object
        const sessionData = {
            user_id: user.id,
            subject_id: config.subjectId,
            topic_id: config.topicId || null,
            sub_topic_id: config.subTopicId || null,
            task_id: taskId,
            auto_created_task_id: taskId,
            duration_seconds: durationSeconds,
            session_quality: quality || null,
            session_note: config.sessionNote || null,
            started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
            ended_at: new Date().toISOString(),
        };

        // Save session
        const { error } = await supabase.from('focus_sessions').insert(sessionData);

        if (error) {
            // Add to offline queue on ANY error (network or logic, safety first)
            await handleError.network(error, sessionData, 'Session saved locally');
            return true; // Return true because we "saved" it (queued it)
        }

        return true;
    } catch (error) {
        // Even in critical failure, try to queue basic data if possible
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const fallbackData = {
                    user_id: user.id,
                    subject_id: config.subjectId,
                    duration_seconds: durationSeconds,
                    started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
                    ended_at: new Date().toISOString(),
                    task_id: null // might be missing if linking failed
                };
                await handleError.network(error, fallbackData, 'Session saved for later sync');
            }
        } catch (e) {
            await handleError.critical(e, 'Failed to save session. Please check your connection.');
        }

        return false;
    }
}
