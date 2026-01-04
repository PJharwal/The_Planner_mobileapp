import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { FocusSession } from '../types';

const OFFLINE_QUEUE_KEY = 'offline_session_queue';

// Helper to log errors silently (avoids circular dependency with errorHandler)
const logSilent = (error: unknown, context: string) => {
    if (__DEV__) {
        console.warn(`[OfflineQueue:${context}]`, error);
    }
};

interface QueuedSession {
    id: string; // Temporary ID
    data: unknown;
    timestamp: number;
    retryCount: number;
}

export const offlineQueue = {
    /**
     * Add a session to the offline queue
     */
    add: async (sessionData: unknown) => {
        try {
            const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            const queue: QueuedSession[] = queueJson ? JSON.parse(queueJson) : [];

            // Add new item
            queue.push({
                id: Math.random().toString(36).substring(7),
                data: sessionData,
                timestamp: Date.now(),
                retryCount: 0
            });

            await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

            if (__DEV__) {
                console.log('Session added to offline queue');
            }
        } catch (error) {
            logSilent(error, 'add');
        }
    },

    /**
     * Process the queue and try to sync with Supabase
     */
    process: async () => {
        try {
            const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            if (!queueJson) return;

            let queue: QueuedSession[] = JSON.parse(queueJson);
            if (queue.length === 0) return;

            if (__DEV__) {
                console.log(`Processing ${queue.length} offline sessions...`);
            }

            const remainingQueue: QueuedSession[] = [];

            for (const item of queue) {
                try {
                    // Try to insert into Supabase
                    const { error } = await supabase
                        .from('focus_sessions')
                        .insert(item.data);

                    if (error) {
                        // Keep in queue for retry
                        item.retryCount++;

                        // Discard if too many retries (prevent infinite queue growth)
                        if (item.retryCount < 5) {
                            remainingQueue.push(item);
                        } else {
                            logSilent(error, `maxRetries:${item.id}`);
                        }
                    } else {
                        if (__DEV__) {
                            console.log('Offline session synced successfully');
                        }
                    }
                } catch (e) {
                    logSilent(e, 'networkError');
                    remainingQueue.push(item);
                }
            }

            // Update queue
            await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));

        } catch (error) {
            logSilent(error, 'process');
        }
    },

    /**
     * Get queue size
     */
    getSize: async () => {
        try {
            const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            return queueJson ? JSON.parse(queueJson).length : 0;
        } catch {
            return 0;
        }
    }
};
