/**
 * Feature Gate Utility
 * 
 * Centralized Pro feature access control.
 * Opens paywall modal when non-Pro user attempts gated action.
 */

import { useSubscriptionStore } from '../store/subscriptionStore';
import { useModalStore } from '../store/modalStore';

/**
 * Pro-only features enum
 */
export enum ProFeature {
    ADVANCED_FOCUS = 'Advanced Focus Modes',
    UNLIMITED_TASKS = 'Unlimited Tasks',
    DEEP_ANALYTICS = 'Deep Analytics & Insights',
    HEALTH_OPTIMIZATION = 'Apple Health Optimization',
    CLOUD_SYNC = 'Cloud Sync & Backup',
    SMART_TODAY = 'Smart Today AI',
    EXAM_MODE = 'Exam Mode',
    EXPORT_DATA = 'Data Export',
}

/**
 * Free tier limits
 */
export const FREE_LIMITS = {
    TASKS_PER_DAY: 6,
    FOCUS_PLANS: 1,
    ANALYTICS_DAYS: 7,
    SUBJECTS: 3,
};

/**
 * Check if user has access to a Pro feature
 * Returns immediately without side effects
 */
export function checkFeatureAccess(feature: ProFeature): boolean {
    const { isPro } = useSubscriptionStore.getState();
    return isPro;
}

/**
 * Gate a feature - opens paywall if not Pro
 * Returns true if access granted, false if blocked
 * 
 * Usage:
 * ```
 * const handleAdvancedFocus = () => {
 *   if (!gateFeature(ProFeature.ADVANCED_FOCUS)) return;
 *   // Continue with feature...
 * };
 * ```
 */
export function gateFeature(feature: ProFeature): boolean {
    const { isPro } = useSubscriptionStore.getState();

    if (isPro) {
        return true;
    }

    // Rate limit: don't show paywall twice in same session (5 min cooldown)
    const { lastPaywallShownAt, openPaywall } = useModalStore.getState();
    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

    if (lastPaywallShownAt && now - lastPaywallShownAt < COOLDOWN_MS) {
        // Still within cooldown, silently deny
        return false;
    }

    // Show paywall with feature context
    openPaywall(feature);
    return false;
}

/**
 * Check if user has reached a free tier limit
 */
export function hasReachedLimit(
    type: 'tasks' | 'subjects' | 'focusPlans',
    currentCount: number
): boolean {
    const { isPro } = useSubscriptionStore.getState();

    if (isPro) return false;

    switch (type) {
        case 'tasks':
            return currentCount >= FREE_LIMITS.TASKS_PER_DAY;
        case 'subjects':
            return currentCount >= FREE_LIMITS.SUBJECTS;
        case 'focusPlans':
            return currentCount >= FREE_LIMITS.FOCUS_PLANS;
        default:
            return false;
    }
}

/**
 * Gate based on limit - opens paywall if limit reached
 */
export function gateLimitedFeature(
    type: 'tasks' | 'subjects' | 'focusPlans',
    currentCount: number
): boolean {
    const limitReached = hasReachedLimit(type, currentCount);

    if (!limitReached) return true;

    // Map limit type to feature
    const featureMap: Record<string, ProFeature> = {
        tasks: ProFeature.UNLIMITED_TASKS,
        subjects: ProFeature.UNLIMITED_TASKS,
        focusPlans: ProFeature.ADVANCED_FOCUS,
    };

    return gateFeature(featureMap[type]);
}

/**
 * React hook for feature access
 */
export function useFeatureAccess(feature: ProFeature): {
    hasAccess: boolean;
    requestAccess: () => boolean;
} {
    const isPro = useSubscriptionStore((state) => state.isPro);

    return {
        hasAccess: isPro,
        requestAccess: () => gateFeature(feature),
    };
}
