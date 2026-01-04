import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface UserStreak {
    user_id: string;
    current_streak_days: number;
    longest_streak: number;
    last_active_date: string | null;
}

interface StreakState {
    streak: UserStreak | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchStreak: (userId: string) => Promise<void>;
    recordActivity: (userId: string) => Promise<void>;
    getGlowIntensity: () => number;
}

export const useStreakStore = create<StreakState>((set, get) => ({
    streak: null,
    isLoading: false,
    error: null,

    fetchStreak: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('user_streaks')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                // Check if streak needs to be reset (missed a day)
                const today = format(new Date(), 'yyyy-MM-dd');
                if (data.last_active_date) {
                    const lastActive = parseISO(data.last_active_date);
                    if (!isToday(lastActive) && !isYesterday(lastActive)) {
                        // Streak broken - reset to 0
                        const { data: updated } = await supabase
                            .from('user_streaks')
                            .update({
                                current_streak_days: 0,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('user_id', userId)
                            .select()
                            .single();
                        set({ streak: updated, isLoading: false });
                        return;
                    }
                }
                set({ streak: data, isLoading: false });
            } else {
                // Create initial streak record
                const { data: newStreak, error: insertError } = await supabase
                    .from('user_streaks')
                    .insert({
                        user_id: userId,
                        current_streak_days: 0,
                        longest_streak: 0,
                        last_active_date: null,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                set({ streak: newStreak, isLoading: false });
            }
        } catch (error: any) {
            console.error('Error fetching streak:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    recordActivity: async (userId: string) => {
        const { streak } = get();
        const today = format(new Date(), 'yyyy-MM-dd');

        try {
            // If no streak record exists, create one
            if (!streak) {
                const { data, error } = await supabase
                    .from('user_streaks')
                    .upsert({
                        user_id: userId,
                        current_streak_days: 1,
                        longest_streak: 1,
                        last_active_date: today,
                    })
                    .select()
                    .single();

                if (error) throw error;
                set({ streak: data });
                return;
            }

            // If already active today, no update needed
            if (streak.last_active_date) {
                const lastActive = parseISO(streak.last_active_date);
                if (isToday(lastActive)) {
                    return; // Already counted today
                }
            }

            // Calculate new streak
            let newStreak = 1;
            if (streak.last_active_date) {
                const lastActive = parseISO(streak.last_active_date);
                if (isYesterday(lastActive)) {
                    newStreak = streak.current_streak_days + 1;
                }
                // If more than 1 day ago, reset to 1
            }

            const newLongest = Math.max(streak.longest_streak, newStreak);

            const { data, error } = await supabase
                .from('user_streaks')
                .update({
                    current_streak_days: newStreak,
                    longest_streak: newLongest,
                    last_active_date: today,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            set({ streak: data });
        } catch (error: any) {
            console.error('Error recording activity:', error);
        }
    },

    getGlowIntensity: () => {
        const { streak } = get();
        const streakDays = streak?.current_streak_days || 0;

        // Glow levels per spec:
        // 0-2 days: None
        // 3-6 days: Soft glow
        // 7-13 days: Medium glow
        // 14+ days: Strong but calm (max 0.25)
        if (streakDays <= 2) return 0;
        if (streakDays <= 6) return 0.15;
        if (streakDays <= 13) return 0.2;
        return 0.25;
    },
}));

// Helper to get streak message
export function getStreakMessage(streakDays: number): string {
    if (streakDays === 0) return "Start your streak today!";
    if (streakDays === 1) return "Day 1! You've started something great.";
    if (streakDays <= 3) return "Building momentum! Keep it up.";
    if (streakDays <= 6) return "A week of consistency is within reach!";
    if (streakDays <= 13) return "Impressive! You're building a habit.";
    if (streakDays <= 29) return "You've been showing up consistently.";
    return "Incredible dedication! You're unstoppable.";
}

// Helper to get glow color based on intensity
export function getGlowColor(intensity: number): string {
    // Grey for inactive, warm orange for all active streaks
    if (intensity === 0) return '#9CA3AF';
    return '#FFB88C'; // Warm orange (soft, not red)
}
