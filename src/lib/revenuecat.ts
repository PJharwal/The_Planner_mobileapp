/**
 * RevenueCat Configuration
 * 
 * Handles subscription management via RevenueCat SDK.
 * Falls back to mock implementation in Expo Go.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Check if running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// RevenueCat API Keys - Add to .env
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifier (must match RevenueCat dashboard)
export const PRO_ENTITLEMENT = 'pro';

// Cache key for offline resilience
const PRO_STATUS_CACHE_KEY = '@tasky_pro_status';

// We'll lazy-load the Purchases module only when not in Expo Go
let Purchases: any = null;
let LOG_LEVEL: any = null;

async function loadPurchasesModule() {
    if (isExpoGo) {
        console.log('[RevenueCat] Running in Expo Go - using mock implementation');
        return false;
    }

    try {
        const module = await import('react-native-purchases');
        Purchases = module.default;
        LOG_LEVEL = module.LOG_LEVEL;
        return true;
    } catch (error) {
        console.warn('[RevenueCat] Failed to load native module:', error);
        return false;
    }
}

/**
 * Configure RevenueCat SDK
 * Call this once on app launch
 */
export async function configureRevenueCat(): Promise<void> {
    const loaded = await loadPurchasesModule();
    if (!loaded) return;

    try {
        const apiKey = Platform.OS === 'ios'
            ? REVENUECAT_API_KEY_IOS
            : REVENUECAT_API_KEY_ANDROID;

        if (!apiKey) {
            console.warn('[RevenueCat] No API key configured for', Platform.OS);
            return;
        }

        // Enable debug logs in development
        if (__DEV__ && LOG_LEVEL) {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        await Purchases.configure({ apiKey });
        console.log('[RevenueCat] Configured successfully');
    } catch (error) {
        console.error('[RevenueCat] Configuration failed:', error);
    }
}

/**
 * Identify user with RevenueCat
 * Links RevenueCat subscriber to Supabase user_id
 */
export async function identifyUser(userId: string): Promise<any> {
    if (!Purchases) {
        console.log('[RevenueCat] Mock: identifyUser', userId);
        return null;
    }

    try {
        const customerInfo = await Purchases.logIn(userId);
        console.log('[RevenueCat] User identified:', userId);
        return customerInfo.customerInfo;
    } catch (error) {
        console.error('[RevenueCat] Failed to identify user:', error);
        return null;
    }
}

/**
 * Log out current user (on sign out)
 */
export async function logOutUser(): Promise<void> {
    try {
        if (Purchases) {
            await Purchases.logOut();
        }
        await AsyncStorage.removeItem(PRO_STATUS_CACHE_KEY);
    } catch (error) {
        console.error('[RevenueCat] Logout failed:', error);
    }
}

/**
 * Fetch current customer info and entitlements
 */
export async function getCustomerInfo(): Promise<any> {
    if (!Purchases) return null;

    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo;
    } catch (error) {
        console.error('[RevenueCat] Failed to get customer info:', error);
        return null;
    }
}

/**
 * Check if user has Pro entitlement
 */
export async function checkProStatus(): Promise<{
    isPro: boolean;
    expiresAt: Date | null;
    subscriptionType: 'free' | 'monthly' | 'yearly';
}> {
    // In Expo Go, always return cached or free
    if (!Purchases) {
        const cached = await getCachedProStatus();
        return {
            isPro: cached,
            expiresAt: null,
            subscriptionType: cached ? 'monthly' : 'free'
        };
    }

    try {
        const customerInfo = await Purchases.getCustomerInfo();
        const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];

        if (entitlement) {
            const isPro = true;
            const expiresAt = entitlement.expirationDate
                ? new Date(entitlement.expirationDate)
                : null;

            // Determine subscription type from product identifier
            const productId = entitlement.productIdentifier?.toLowerCase() || '';
            const subscriptionType = productId.includes('yearly') || productId.includes('annual')
                ? 'yearly'
                : 'monthly';

            // Cache for offline use
            await cacheProStatus(isPro);

            return { isPro, expiresAt, subscriptionType };
        }

        await cacheProStatus(false);
        return { isPro: false, expiresAt: null, subscriptionType: 'free' };
    } catch (error) {
        console.error('[RevenueCat] Failed to check pro status:', error);

        // Return cached status on failure
        const cached = await getCachedProStatus();
        return {
            isPro: cached,
            expiresAt: null,
            subscriptionType: cached ? 'monthly' : 'free'
        };
    }
}

/**
 * Fetch available offerings/packages
 */
export async function getOfferings(): Promise<any> {
    if (!Purchases) return null;

    try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
    } catch (error) {
        console.error('[RevenueCat] Failed to get offerings:', error);
        return null;
    }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
    pkg: any
): Promise<{ success: boolean; customerInfo: any; error?: string }> {
    if (!Purchases) {
        return { success: false, customerInfo: null, error: 'Not available in Expo Go' };
    }

    try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);

        // Check if purchase granted pro access
        const isPro = !!customerInfo.entitlements.active[PRO_ENTITLEMENT];
        await cacheProStatus(isPro);

        return { success: true, customerInfo };
    } catch (error: any) {
        // User cancelled
        if (error.userCancelled) {
            return { success: false, customerInfo: null, error: 'cancelled' };
        }

        console.error('[RevenueCat] Purchase failed:', error);
        return {
            success: false,
            customerInfo: null,
            error: error.message || 'Purchase failed'
        };
    }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{
    success: boolean;
    isPro: boolean;
    error?: string;
}> {
    if (!Purchases) {
        return { success: false, isPro: false, error: 'Not available in Expo Go' };
    }

    try {
        const customerInfo = await Purchases.restorePurchases();
        const isPro = !!customerInfo.entitlements.active[PRO_ENTITLEMENT];

        await cacheProStatus(isPro);

        return { success: true, isPro };
    } catch (error: any) {
        console.error('[RevenueCat] Restore failed:', error);
        return {
            success: false,
            isPro: false,
            error: error.message || 'Restore failed'
        };
    }
}

// ============================================
// OFFLINE CACHE HELPERS
// ============================================

async function cacheProStatus(isPro: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(PRO_STATUS_CACHE_KEY, JSON.stringify(isPro));
    } catch (error) {
        console.error('[RevenueCat] Failed to cache pro status:', error);
    }
}

export async function getCachedProStatus(): Promise<boolean> {
    try {
        const cached = await AsyncStorage.getItem(PRO_STATUS_CACHE_KEY);
        return cached ? JSON.parse(cached) : false;
    } catch (error) {
        return false;
    }
}
