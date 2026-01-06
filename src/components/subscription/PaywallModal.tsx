/**
 * PaywallModal - Premium Upgrade Screen
 * 
 * Glassmorphism design with dark theme.
 * Uses RevenueCat for subscriptions.
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Glass components
import { GlassButton } from '../glass';

// RevenueCat (dynamically loaded)
import { getOfferings, purchasePackage, restorePurchases } from '../../lib/revenuecat';
import { useSubscriptionStore } from '../../store/subscriptionStore';

// Theme
import {
    darkBackground,
    glass,
    glassAccent,
    glassText,
} from '../../constants/glassTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PaywallModalProps {
    visible: boolean;
    onDismiss: () => void;
    triggerFeature?: string | null;
}

// Pro features list
const PRO_FEATURES = [
    {
        icon: 'flash-outline',
        title: 'Unlimited Tasks',
        description: 'No daily limits on tasks',
    },
    {
        icon: 'analytics-outline',
        title: 'Deep Analytics',
        description: 'Track patterns and progress',
    },
    {
        icon: 'bulb-outline',
        title: 'Smart Suggestions',
        description: 'AI-powered study planning',
    },
    {
        icon: 'time-outline',
        title: 'Advanced Focus',
        description: 'Custom focus plans',
    },
];

// Package type placeholder
type PackageType = any;

export function PaywallModal({ visible, onDismiss, triggerFeature }: PaywallModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [isLoading, setIsLoading] = useState(false);
    const [monthlyPackage, setMonthlyPackage] = useState<PackageType | null>(null);
    const [yearlyPackage, setYearlyPackage] = useState<PackageType | null>(null);

    const { refreshSubscription } = useSubscriptionStore();

    // Debug log when visibility changes
    useEffect(() => {
        console.log('[PaywallModal] visible:', visible, 'triggerFeature:', triggerFeature);
    }, [visible, triggerFeature]);

    // Fetch offerings on mount
    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        try {
            const offering = await getOfferings();
            if (offering) {
                const monthly = offering.availablePackages.find(
                    (pkg: PackageType) => pkg.packageType === 'MONTHLY' ||
                        pkg.identifier.toLowerCase().includes('monthly')
                );
                const yearly = offering.availablePackages.find(
                    (pkg: PackageType) => pkg.packageType === 'ANNUAL' ||
                        pkg.identifier.toLowerCase().includes('yearly') ||
                        pkg.identifier.toLowerCase().includes('annual')
                );
                setMonthlyPackage(monthly || null);
                setYearlyPackage(yearly || null);
            }
        } catch (error) {
            console.error('Failed to load offerings:', error);
        }
    };

    const handlePurchase = async () => {
        const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
        if (!pkg) {
            Alert.alert('Not Available', 'Subscriptions are not available in Expo Go. Please use a development build.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await purchasePackage(pkg);
            if (result.success) {
                await refreshSubscription();
                Alert.alert('Success!', 'Welcome to Tasky Pro!', [{ text: 'OK', onPress: onDismiss }]);
            } else if (result.error !== 'cancelled') {
                Alert.alert('Error', result.error || 'Purchase failed.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Purchase failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            const result = await restorePurchases();
            if (result.success && result.isPro) {
                await refreshSubscription();
                Alert.alert('Restored!', 'Your Pro access has been restored.', [{ text: 'OK', onPress: onDismiss }]);
            } else if (result.success) {
                Alert.alert('No Purchases Found', 'No previous subscriptions were found.');
            } else {
                Alert.alert('Restore Failed', result.error || 'Could not restore purchases.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Restore failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const monthlyPrice = monthlyPackage?.product?.priceString || '₹299';
    const yearlyPrice = yearlyPackage?.product?.priceString || '₹1,999';

    return (
        <Modal
            visible={visible}
            onRequestClose={onDismiss}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <View style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity
                    onPress={onDismiss}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={28} color={glassText.primary} />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="diamond" size={56} color={glassAccent.blue} />
                        </View>
                        <Text style={styles.title}>Upgrade to Tasky Pro</Text>
                        <Text style={styles.subtitle}>
                            Unlock unlimited tasks, deep analytics, and more
                        </Text>
                        {triggerFeature && (
                            <View style={styles.triggerBadge}>
                                <Ionicons name="lock-closed" size={12} color={glassAccent.warm} />
                                <Text style={styles.triggerText}>{triggerFeature} requires Pro</Text>
                            </View>
                        )}
                    </View>

                    {/* Features */}
                    <View style={styles.featuresCard}>
                        {PRO_FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <View style={styles.featureIcon}>
                                    <Ionicons name={feature.icon as any} size={20} color={glassAccent.blue} />
                                </View>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Pricing */}
                    <View style={styles.pricingRow}>
                        <TouchableOpacity
                            onPress={() => setSelectedPlan('monthly')}
                            style={[
                                styles.pricingCard,
                                selectedPlan === 'monthly' && styles.pricingCardSelected
                            ]}
                        >
                            <Text style={styles.pricingTitle}>Monthly</Text>
                            <Text style={styles.pricingPrice}>{monthlyPrice}</Text>
                            <Text style={styles.pricingPeriod}>/month</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSelectedPlan('yearly')}
                            style={[
                                styles.pricingCard,
                                selectedPlan === 'yearly' && styles.pricingCardSelected
                            ]}
                        >
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>BEST VALUE</Text>
                            </View>
                            <Text style={styles.pricingTitle}>Yearly</Text>
                            <Text style={styles.pricingPrice}>{yearlyPrice}</Text>
                            <Text style={styles.pricingPeriod}>/year</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CTA */}
                    <GlassButton
                        onPress={handlePurchase}
                        fullWidth
                        glow
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Start Free Trial'}
                    </GlassButton>

                    {/* Secondary */}
                    <TouchableOpacity onPress={handleRestore} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Restore Purchase</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDismiss} style={styles.secondaryButton}>
                        <Text style={styles.secondaryText}>Not now</Text>
                    </TouchableOpacity>

                    <Text style={styles.legalText}>
                        Subscription auto-renews. Cancel anytime.
                    </Text>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBackground.primary,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 100,
        padding: 10,
    },
    scrollContent: {
        paddingTop: 90,
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: glassAccent.blue + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: glassText.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: glassText.secondary,
        textAlign: 'center',
        marginTop: 8,
    },
    triggerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: glassAccent.warm + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 16,
        gap: 6,
    },
    triggerText: {
        color: glassAccent.warm,
        fontSize: 13,
        fontWeight: '500',
    },
    featuresCard: {
        width: '100%',
        backgroundColor: glass.background.default,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: glassAccent.blue + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        color: glassText.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    featureDesc: {
        color: glassText.muted,
        fontSize: 13,
        marginTop: 2,
    },
    pricingRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 24,
    },
    pricingCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        backgroundColor: glass.background.light,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pricingCardSelected: {
        backgroundColor: glassAccent.blue + '15',
        borderColor: glassAccent.blue,
    },
    badge: {
        position: 'absolute',
        top: -10,
        backgroundColor: glassAccent.warm,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    pricingTitle: {
        color: glassText.primary,
        fontSize: 15,
        fontWeight: '600',
        marginTop: 4,
    },
    pricingPrice: {
        color: glassText.primary,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    pricingPeriod: {
        color: glassText.muted,
        fontSize: 13,
    },
    secondaryButton: {
        marginTop: 16,
        padding: 8,
    },
    secondaryText: {
        color: glassText.muted,
        fontSize: 14,
    },
    legalText: {
        color: glassText.muted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
    },
});
