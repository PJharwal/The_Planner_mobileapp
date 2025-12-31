// Subscription Store - Manages Plan Status & Feature Gating
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Subscription, PlanType, SubscriptionStatus } from '../types';

interface SubscriptionState {
    subscription: Subscription | null;
    isLoading: boolean;
    isPremium: boolean;
    isTrialing: boolean;

    // Actions
    fetchSubscription: () => Promise<void>;
    startTrial: () => Promise<{ success: boolean; message?: string }>;
    checkAccess: (feature: 'insights' | 'smart_today' | 'exam_mode' | 'export') => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    subscription: null,
    isLoading: true,
    isPremium: false,
    isTrialing: false,

    fetchSubscription: async () => {
        try {
            set({ isLoading: true });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ subscription: null, isPremium: false, isTrialing: false, isLoading: false });
                return;
            }

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                const sub = data as Subscription;
                const isTrialing = sub.status === 'trialing';
                // Active or Trialing = Premium Access
                // (Also handle past_due gracefully for a few days if needed, but strict for now)
                const isPremium = sub.status === 'active' || isTrialing;

                // Check if trial expired 
                // (Supabase row level updates might delay, so client-side check is good backup)
                if (isTrialing && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
                    set({ subscription: sub, isPremium: false, isTrialing: false, isLoading: false });
                } else {
                    set({ subscription: sub, isPremium, isTrialing, isLoading: false });
                }
            } else {
                set({ subscription: null, isPremium: false, isTrialing: false, isLoading: false });
            }

        } catch (error) {
            console.error('Error fetching subscription:', error);
            set({ isLoading: false });
        }
    },

    startTrial: async () => {
        try {
            const { data, error } = await supabase.rpc('start_trial');

            if (error) throw error;

            if (data && data.success) {
                // Refresh local state
                await get().fetchSubscription();
                return { success: true };
            } else {
                return { success: false, message: data?.message || 'Could not start trial' };
            }
        } catch (error: any) {
            console.error('Error starting trial:', error);
            return { success: false, message: error.message };
        }
    },

    checkAccess: (feature) => {
        const { isPremium } = get();
        // Free features (always allowed if not listed here)
        // Gated features:
        if (['insights', 'smart_today', 'exam_mode', 'export'].includes(feature)) {
            return isPremium;
        }
        return true;
    },
}));
