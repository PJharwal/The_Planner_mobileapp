// User Profile Store
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    user_id: string;
    display_name: string | null;
}

interface UserStore {
    profile: UserProfile | null;
    isLoading: boolean;
    displayName: string;

    fetchProfile: () => Promise<void>;
    updateDisplayName: (name: string) => Promise<boolean>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    profile: null,
    isLoading: false,
    displayName: '',

    fetchProfile: async () => {
        set({ isLoading: true });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            // Try to get existing profile
            let { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // If no profile exists, create one
            if (error && error.code === 'PGRST116') {
                const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: user.id,
                        display_name: defaultName
                    })
                    .select()
                    .single();

                if (!createError && newProfile) {
                    profile = newProfile;
                }
            }

            if (profile) {
                set({
                    profile,
                    displayName: profile.display_name || 'Student',
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
            set({ isLoading: false });
        }
    },

    updateDisplayName: async (name: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    display_name: name,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            set({ displayName: name });
            return true;

        } catch (error) {
            console.error('Error updating display name:', error);
            return false;
        }
    }
}));

// Get greeting based on time of day
export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}
