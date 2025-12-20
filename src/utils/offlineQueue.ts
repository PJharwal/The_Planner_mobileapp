// Offline Queue - Local action storage and sync
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const QUEUE_KEY = '@offline_queue';

export type QueueActionType =
    | 'TOGGLE_TASK'
    | 'SAVE_SESSION'
    | 'ADD_TO_TODAY'
    | 'REMOVE_FROM_TODAY'
    | 'UPDATE_TASK';

export interface QueueItem {
    id: string;
    type: QueueActionType;
    payload: Record<string, any>;
    createdAt: string;
    retryCount: number;
}

/**
 * Add an action to the offline queue
 */
export async function addToQueue(type: QueueActionType, payload: Record<string, any>): Promise<void> {
    try {
        const queue = await getQueue();
        const newItem: QueueItem = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            createdAt: new Date().toISOString(),
            retryCount: 0,
        };
        queue.push(newItem);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        console.log(`[OfflineQueue] Added: ${type}`, payload);
    } catch (error) {
        console.error('[OfflineQueue] Error adding to queue:', error);
    }
}

/**
 * Get all pending queue items
 */
export async function getQueue(): Promise<QueueItem[]> {
    try {
        const data = await AsyncStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[OfflineQueue] Error getting queue:', error);
        return [];
    }
}

/**
 * Get queue count
 */
export async function getQueueCount(): Promise<number> {
    const queue = await getQueue();
    return queue.length;
}

/**
 * Remove an item from the queue
 */
async function removeFromQueue(id: string): Promise<void> {
    try {
        const queue = await getQueue();
        const filtered = queue.filter(item => item.id !== id);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('[OfflineQueue] Error removing from queue:', error);
    }
}

/**
 * Process a single queue item
 */
async function processItem(item: QueueItem): Promise<boolean> {
    try {
        switch (item.type) {
            case 'TOGGLE_TASK': {
                const { taskId, isCompleted, completedAt } = item.payload;
                const { error } = await supabase
                    .from('tasks')
                    .update({ is_completed: isCompleted, completed_at: completedAt })
                    .eq('id', taskId);
                return !error;
            }

            case 'SAVE_SESSION': {
                const { error } = await supabase
                    .from('focus_sessions')
                    .insert(item.payload);
                return !error;
            }

            case 'ADD_TO_TODAY': {
                const { taskId, userId, addedAt } = item.payload;
                // Check if already exists
                const { data: existing } = await supabase
                    .from('today_tasks')
                    .select('id')
                    .eq('task_id', taskId)
                    .eq('added_at', addedAt.split('T')[0])
                    .maybeSingle();

                if (existing) return true; // Already synced

                const { error } = await supabase
                    .from('today_tasks')
                    .insert({ task_id: taskId, user_id: userId, added_at: addedAt });
                return !error;
            }

            case 'REMOVE_FROM_TODAY': {
                const { taskId, date } = item.payload;
                const { error } = await supabase
                    .from('today_tasks')
                    .delete()
                    .eq('task_id', taskId)
                    .gte('added_at', `${date}T00:00:00`)
                    .lt('added_at', `${date}T23:59:59`);
                return !error;
            }

            case 'UPDATE_TASK': {
                const { taskId, updates } = item.payload;
                const { error } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', taskId);
                return !error;
            }

            default:
                console.warn(`[OfflineQueue] Unknown action type: ${item.type}`);
                return true; // Remove unknown items
        }
    } catch (error) {
        console.error(`[OfflineQueue] Error processing ${item.type}:`, error);
        return false;
    }
}

/**
 * Process all pending queue items
 */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
    const queue = await getQueue();

    if (queue.length === 0) {
        return { processed: 0, failed: 0 };
    }

    console.log(`[OfflineQueue] Processing ${queue.length} items...`);

    let processed = 0;
    let failed = 0;

    // Process items in order (oldest first)
    for (const item of queue) {
        const success = await processItem(item);

        if (success) {
            await removeFromQueue(item.id);
            processed++;
            console.log(`[OfflineQueue] ✓ Synced: ${item.type}`);
        } else {
            // Increment retry count
            item.retryCount++;

            if (item.retryCount >= 3) {
                // Remove after 3 failed attempts
                await removeFromQueue(item.id);
                console.warn(`[OfflineQueue] ✗ Removed after 3 retries: ${item.type}`);
            }
            failed++;
        }
    }

    console.log(`[OfflineQueue] Done: ${processed} synced, ${failed} failed`);
    return { processed, failed };
}

/**
 * Clear entire queue (use with caution)
 */
export async function clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
}
