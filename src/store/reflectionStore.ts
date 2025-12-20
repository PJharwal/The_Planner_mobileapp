// Reflection Store - Daily learning reflections
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Reflection {
    id: string;
    reflection_date: string;
    learned: string | null;
    difficult: string | null;
}

interface ReflectionStore {
    todayReflection: Reflection | null;
    hasShownPrompt: boolean;
    isLoading: boolean;

    fetchTodayReflection: () => Promise<void>;
    saveReflection: (learned: string, difficult: string) => Promise<void>;
    markPromptShown: () => void;
}

export const useReflectionStore = create<ReflectionStore>((set, get) => ({
    todayReflection: null,
    hasShownPrompt: false,
    isLoading: false,

    fetchTodayReflection: async () => {
        set({ isLoading: true });
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('daily_reflections')
                .select('*')
                .eq('reflection_date', today)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            set({ todayReflection: data || null, isLoading: false });
        } catch (error) {
            console.error('Error fetching reflection:', error);
            set({ isLoading: false });
        }
    },

    saveReflection: async (learned: string, difficult: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = format(new Date(), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('daily_reflections')
                .upsert({
                    user_id: user.id,
                    reflection_date: today,
                    learned: learned || null,
                    difficult: difficult || null,
                }, { onConflict: 'user_id,reflection_date' })
                .select()
                .single();

            if (error) throw error;
            set({ todayReflection: data, hasShownPrompt: true });
        } catch (error) {
            console.error('Error saving reflection:', error);
        }
    },

    markPromptShown: () => {
        set({ hasShownPrompt: true });
    },
}));
