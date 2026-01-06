// Subscription Store - Manages Plan Status & Feature Gating (RevenueCat)
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type SubscriptionType = 'free' | 'monthly' | 'yearly';

interface SubscriptionState {
    // Core state
    isPro: boolean;
    subscriptionType: SubscriptionType;
    expiresAt: Date | null;
    isLoading: boolean;

    // Legacy compatibility
    isTrialing: boolean;

    // Actions
    refreshSubscription: () => Promise<void>;
    restorePurchases: () => Promise<{ success: boolean; message?: string }>;
    syncToSupabase: () => Promise<void>;
    checkAccess: (feature: 'insights' | 'smart_today' | 'exam_mode' | 'export') => boolean;

    // Internal
    _setProState: (isPro: boolean, type: SubscriptionType, expires: Date | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    isPro: false,
    subscriptionType: 'free',
    expiresAt: null,
    isLoading: true,
    isTrialing: false,

    /**
     * Refresh subscription status from RevenueCat
     * Falls back to cached state on failure
     */
    refreshSubscription: async () => {
        try {
            set({ isLoading: true });

            // Dynamically import to avoid crash in Expo Go
            const { checkProStatus, getCachedProStatus } = await import('../lib/revenuecat');
            const { isPro, subscriptionType, expiresAt } = await checkProStatus();

            set({
                isPro,
                subscriptionType,
                expiresAt,
                isTrialing: false,
                isLoading: false
            });

            // Sync to Supabase in background
            get().syncToSupabase();

        } catch (error) {
            console.error('[SubscriptionStore] Refresh failed:', error);

            // Use cached state on failure
            try {
                const { getCachedProStatus } = await import('../lib/revenuecat');
                const cached = await getCachedProStatus();
                set({
                    isPro: cached,
                    subscriptionType: cached ? 'monthly' : 'free',
                    isLoading: false
                });
            } catch {
                set({ isLoading: false });
            }
        }
    },

    /**
     * Restore previous purchases via RevenueCat
     */
    restorePurchases: async () => {
        try {
            const { restorePurchases: rcRestorePurchases } = await import('../lib/revenuecat');
            const result = await rcRestorePurchases();

            if (result.success) {
                // Refresh our state
                await get().refreshSubscription();

                if (result.isPro) {
                    return { success: true, message: 'Purchases restored successfully!' };
                } else {
                    return { success: true, message: 'No previous purchases found.' };
                }
            }

            return { success: false, message: result.error || 'Restore failed' };
        } catch (error: any) {
            console.error('[SubscriptionStore] Restore failed:', error);
            return { success: false, message: error.message || 'Restore failed' };
        }
    },

    /**
     * Sync subscription state to Supabase user_profile_insights table
     */
    syncToSupabase: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { isPro, subscriptionType, expiresAt } = get();

            await supabase
                .from('user_profile_insights')
                .update({
                    is_pro: isPro,
                    subscription_type: subscriptionType,
                    subscription_expires_at: expiresAt?.toISOString() || null,
                })
                .eq('user_id', user.id);

        } catch (error) {
            console.error('[SubscriptionStore] Supabase sync failed:', error);
            // Non-blocking, don't throw
        }
    },

    /**
     * Legacy feature access check (for backward compatibility)
     */
    checkAccess: (feature) => {
        const { isPro } = get();
        if (['insights', 'smart_today', 'exam_mode', 'export'].includes(feature)) {
            return isPro;
        }
        return true;
    },

    /**
     * Internal state setter
     */
    _setProState: (isPro, type, expires) => {
        set({ isPro, subscriptionType: type, expiresAt: expires });
    },
}));
