import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserCapacity, UserCapacityInsert, UserCapacityUpdate } from '../types/database';
import { UserProfileInsights } from '../types/profile';
import { deriveUserCapacity } from '../utils/capacityDerivation';
import { format } from 'date-fns';

interface CapacityUsage {
    todayTaskCount: number;
    todayFocusMinutes: number;
    remainingTasks: number;
    remainingFocusMinutes: number;
    isOverTaskLimit: boolean;
    isOverFocusLimit: boolean;
}

interface CapacityStore {
    capacity: UserCapacity | null;
    isLoading: boolean;
    error: string | null;
    usage: CapacityUsage;

    // Actions
    fetchCapacity: () => Promise<void>;
    calculateAndSaveCapacity: (profile: UserProfileInsights) => Promise<void>;
    updateCapacity: (updates: Partial<Omit<UserCapacity, 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
    getTodayUsage: () => Promise<void>;
    canAddTask: () => boolean;
    getRemainingCapacity: () => { tasks: number; focusMinutes: number };
    logOverride: (type: 'task_limit' | 'focus_limit', reason?: string) => Promise<void>;
    resetUsage: () => void;
}

export const useCapacityStore = create<CapacityStore>((set, get) => ({
    capacity: null,
    isLoading: false,
    error: null,
    usage: {
        todayTaskCount: 0,
        todayFocusMinutes: 0,
        remainingTasks: 0,
        remainingFocusMinutes: 0,
        isOverTaskLimit: false,
        isOverFocusLimit: false,
    },

    fetchCapacity: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const { data, error } = await supabase
                .from('user_capacity')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                throw error;
            }

            set({ capacity: data, isLoading: false });

            // Auto-fetch today's usage if capacity exists
            if (data) {
                await get().getTodayUsage();
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    calculateAndSaveCapacity: async (profile: UserProfileInsights) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Derive capacity from profile
            const derivedCapacity = deriveUserCapacity(profile);

            const capacityData: UserCapacityInsert = {
                user_id: user.id,
                ...derivedCapacity,
            };

            // Upsert capacity
            const { data, error } = await supabase
                .from('user_capacity')
                .upsert(capacityData, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) throw error;

            set({ capacity: data });
            await get().getTodayUsage();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateCapacity: async (updates) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_capacity')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            set({ capacity: data });
            await get().getTodayUsage();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    getTodayUsage: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const capacity = get().capacity;
            if (!capacity) return;

            const today = format(new Date(), 'yyyy-MM-dd');

            // Get today's task count
            const { count: taskCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('due_date', today);

            // Get today's focus minutes
            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select('duration_seconds')
                .eq('user_id', user.id)
                .gte('started_at', `${today}T00:00:00`)
                .lt('started_at', `${today}T23:59:59`);

            const totalSeconds = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
            const todayFocusMinutes = Math.floor(totalSeconds / 60);

            const todayTaskCount = taskCount || 0;
            const remainingTasks = Math.max(0, capacity.max_tasks_per_day - todayTaskCount);
            const remainingFocusMinutes = Math.max(0, capacity.max_daily_focus_minutes - todayFocusMinutes);

            set({
                usage: {
                    todayTaskCount,
                    todayFocusMinutes,
                    remainingTasks,
                    remainingFocusMinutes,
                    isOverTaskLimit: todayTaskCount >= capacity.max_tasks_per_day,
                    isOverFocusLimit: todayFocusMinutes >= capacity.max_daily_focus_minutes,
                },
            });
        } catch (error: any) {
            console.error('Error fetching today usage:', error);
        }
    },

    canAddTask: () => {
        const { capacity, usage } = get();
        if (!capacity) return true; // No capacity data, allow
        return !usage.isOverTaskLimit;
    },

    getRemainingCapacity: () => {
        const { usage } = get();
        return {
            tasks: usage.remainingTasks,
            focusMinutes: usage.remainingFocusMinutes,
        };
    },

    logOverride: async (type, reason) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const capacity = get().capacity;
            if (!capacity) return;

            const originalLimit = type === 'task_limit'
                ? capacity.max_tasks_per_day
                : capacity.max_daily_focus_minutes;

            const overrideValue = type === 'task_limit'
                ? get().usage.todayTaskCount + 1
                : get().usage.todayFocusMinutes;

            await supabase.from('capacity_overrides').insert({
                user_id: user.id,
                override_type: type,
                original_limit: originalLimit,
                override_value: overrideValue,
                reason: reason || null,
            });
        } catch (error: any) {
            console.error('Error logging override:', error);
        }
    },

    resetUsage: () => {
        set({
            usage: {
                todayTaskCount: 0,
                todayFocusMinutes: 0,
                remainingTasks: 0,
                remainingFocusMinutes: 0,
                isOverTaskLimit: false,
                isOverFocusLimit: false,
            },
        });
    },
}));
