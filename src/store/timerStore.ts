// Timer Store - Enhanced Focus Session Time Tracking
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Vibration } from 'react-native';
import { SessionQuality } from '../types';
import { UserCapacity } from '../types/database';

/**
 * Get timer presets based on user capacity
 * Falls back to standard presets if no capacity provided
 */
export function getTimerPresets(capacity?: UserCapacity | null) {
    if (capacity) {
        return [
            { label: `${capacity.default_focus_minutes} min`, value: capacity.default_focus_minutes * 60, isDefault: true },
            { label: `${Math.floor(capacity.default_focus_minutes * 0.6)} min`, value: Math.floor(capacity.default_focus_minutes * 0.6) * 60 },
            { label: `${Math.floor(capacity.default_focus_minutes * 1.5)} min`, value: Math.floor(capacity.default_focus_minutes * 1.5) * 60 },
        ];
    }

    // Fallback presets
    return [
        { label: '25 min', value: 25 * 60, isDefault: true },
        { label: '40 min', value: 40 * 60 },
        { label: '90 min', value: 90 * 60 },
    ];
}

interface FocusContext {
    taskId?: string;
    taskTitle?: string;
    subTopicId?: string;
    subTopicName?: string;
    topicId?: string;
    topicName?: string;
    subjectId?: string;
    subjectName?: string;
}

interface TimerStore {
    // Timer state
    isRunning: boolean;
    isPaused: boolean;
    startTime: Date | null;
    elapsed: number; // seconds
    targetDuration: number; // seconds (0 = no limit)

    // Context
    context: FocusContext;

    // Stats
    todayTotalMinutes: number;

    // Session Quality (NEW)
    showQualityPrompt: boolean;
    lastSessionId: string | null;
    lastSessionMinutes: number;

    // Actions
    startTimer: (duration: number, context?: FocusContext) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => Promise<void>;
    resetTimer: () => void;
    tick: () => void;
    fetchTodayTotal: () => Promise<void>;

    // For countdown mode
    getTimeRemaining: () => number;
    getProgress: () => number;
    isCompleted: () => boolean;

    // Session Quality (NEW)
    submitSessionQuality: (quality: SessionQuality) => Promise<void>;
    dismissQualityPrompt: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
    isRunning: false,
    isPaused: false,
    startTime: null,
    elapsed: 0,
    targetDuration: 0,
    context: {},
    todayTotalMinutes: 0,
    showQualityPrompt: false,
    lastSessionId: null,
    lastSessionMinutes: 0,

    startTimer: (duration: number, context: FocusContext = {}) => {
        // Stop any existing timer first
        if (get().isRunning || get().isPaused) {
            get().stopTimer();
        }

        set({
            isRunning: true,
            isPaused: false,
            startTime: new Date(),
            elapsed: 0,
            targetDuration: duration,
            context,
        });
    },

    pauseTimer: () => {
        if (!get().isRunning) return;
        set({ isRunning: false, isPaused: true });
    },

    resumeTimer: () => {
        if (!get().isPaused) return;
        // Adjust start time to account for paused period
        const { elapsed } = get();
        set({
            isRunning: true,
            isPaused: false,
            startTime: new Date(Date.now() - elapsed * 1000),
        });
    },

    stopTimer: async () => {
        const { startTime, elapsed, context, isRunning, isPaused } = get();

        if ((!isRunning && !isPaused) || !startTime) {
            get().resetTimer();
            return;
        }

        const totalSeconds = elapsed;

        // Only save if studied for at least 10 seconds
        if (totalSeconds >= 10) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: inserted } = await supabase.from('focus_sessions').insert({
                        user_id: user.id,
                        subject_id: context.subjectId || null,
                        topic_id: context.topicId || null,
                        sub_topic_id: context.subTopicId || null,
                        task_id: context.taskId || null,
                        duration_seconds: totalSeconds,
                        target_duration_seconds: get().targetDuration || null,
                        started_at: startTime.toISOString(),
                        ended_at: new Date().toISOString(),
                        session_type: 'focus',
                    }).select('id').single();

                    // Refresh today's total
                    get().fetchTodayTotal();

                    // Show quality prompt for sessions >= 1 minute
                    const sessionMinutes = Math.floor(totalSeconds / 60);
                    if (inserted && sessionMinutes >= 1) {
                        set({
                            showQualityPrompt: true,
                            lastSessionId: inserted.id,
                            lastSessionMinutes: sessionMinutes,
                        });
                    }
                }
            } catch (error) {
                console.error('Error saving focus session:', error);
            }
        }

        // Reset timer state but keep quality prompt
        set({
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsed: 0,
            targetDuration: 0,
            context: {},
        });
    },

    resetTimer: () => {
        set({
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsed: 0,
            targetDuration: 0,
            context: {},
        });
    },

    tick: () => {
        const { startTime, isRunning, targetDuration } = get();
        if (isRunning && startTime) {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            set({ elapsed });

            // Check if countdown completed
            if (targetDuration > 0 && elapsed >= targetDuration) {
                // Vibrate to notify completion
                Vibration.vibrate([0, 500, 200, 500, 200, 500]);
                get().stopTimer();
            }
        }
    },

    getTimeRemaining: () => {
        const { targetDuration, elapsed } = get();
        if (targetDuration === 0) return 0; // No limit
        return Math.max(0, targetDuration - elapsed);
    },

    getProgress: () => {
        const { targetDuration, elapsed } = get();
        if (targetDuration === 0) return 0;
        return Math.min(1, elapsed / targetDuration);
    },

    isCompleted: () => {
        const { targetDuration, elapsed } = get();
        return targetDuration > 0 && elapsed >= targetDuration;
    },

    fetchTodayTotal: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];

            // Fetch from focus_sessions table
            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select('duration_seconds')
                .eq('user_id', user.id)
                .gte('started_at', `${today}T00:00:00`)
                .lt('started_at', `${today}T23:59:59`);

            const totalSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
            set({ todayTotalMinutes: Math.floor(totalSeconds / 60) });

        } catch (error) {
            console.error('Error fetching today total:', error);
        }
    },

    // Session Quality (NEW)
    submitSessionQuality: async (quality: SessionQuality) => {
        const { lastSessionId } = get();
        if (!lastSessionId) {
            set({ showQualityPrompt: false, lastSessionId: null });
            return;
        }

        try {
            await supabase
                .from('focus_sessions')
                .update({ quality_rating: quality })
                .eq('id', lastSessionId);
        } catch (error) {
            console.error('Error updating session quality:', error);
        }

        set({ showQualityPrompt: false, lastSessionId: null });
    },

    dismissQualityPrompt: () => {
        set({ showQualityPrompt: false, lastSessionId: null });
    },
}));

// Helper to format seconds to HH:MM:SS or MM:SS
export function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Helper to format minutes to readable string
export function formatMinutes(minutes: number): string {
    if (minutes >= 60) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return `${minutes}m`;
}

// Format countdown display
export function formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
