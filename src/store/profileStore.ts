import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserProfileInsights, StudyPersona } from '../types/profile';
import { deriveStudyPersona } from '../utils/personaDerivation';
import { selectBestPlan } from '../utils/adaptivePlans';

interface ProfileStore {
    profile: UserProfileInsights | null;
    isLoading: boolean;
    hasCompletedOnboarding: boolean;
    error: string | null;

    fetchProfile: () => Promise<void>;
    saveProfile: (data: Partial<UserProfileInsights>) => Promise<void>;
    updateProfile: (updates: Partial<UserProfileInsights>) => Promise<void>;
    checkOnboardingStatus: () => Promise<boolean>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
    profile: null,
    isLoading: false,
    hasCompletedOnboarding: false,
    error: null,

    fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const { data, error } = await supabase
                .from('user_profile_insights')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            set({
                profile: data,
                hasCompletedOnboarding: !!data,
                isLoading: false,
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    saveProfile: async (data: Partial<UserProfileInsights>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Derive persona from answers
            const persona = deriveStudyPersona(data);

            // Select best plan for persona
            const bestPlan = selectBestPlan(persona);

            const profileData: Partial<UserProfileInsights> = {
                ...data,
                user_id: user.id,
                study_persona: persona,
                selected_plan_id: bestPlan.id,
            };

            // Use upsert to handle both new profiles and updates
            const { data: savedProfile, error } = await supabase
                .from('user_profile_insights')
                .upsert(profileData, {
                    onConflict: 'user_id', // Update if user_id already exists
                })
                .select()
                .single();

            if (error) throw error;

            set({
                profile: savedProfile,
                hasCompletedOnboarding: true,
            });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateProfile: async (updates: Partial<UserProfileInsights>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Re-derive persona if relevant fields changed
            const current = get().profile;
            const shouldRederivePersona =
                updates.focus_difficulty ||
                updates.attention_diagnosis ||
                updates.exam_proximity ||
                updates.miss_day_response ||
                updates.overload_response;

            let updatedData = { ...updates };

            if (shouldRederivePersona && current) {
                const newPersona = deriveStudyPersona({ ...current, ...updates });
                const newPlan = selectBestPlan(newPersona);
                updatedData = {
                    ...updatedData,
                    study_persona: newPersona,
                    selected_plan_id: newPlan.id,
                };
            }

            const { data, error } = await supabase
                .from('user_profile_insights')
                .update(updatedData)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            set({ profile: data });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    checkOnboardingStatus: async () => {
        await get().fetchProfile();
        return get().hasCompletedOnboarding;
    },
}));
