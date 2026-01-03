// Paywall Modal - Premium Upgrade Screen
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Portal, IconButton, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '../../lib/stripe';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

// Design tokens
import { pastel, background, text, spacing, borderRadius, gradients } from '../../constants/theme';
// Card, Button removed
import { GlassCard, GlassButton } from "../glass";

interface PaywallModalProps {
    visible: boolean;
    onDismiss: () => void;
    triggerFeature?: string; // Which feature triggered the paywall
}

export function PaywallModal({ visible, onDismiss, triggerFeature }: PaywallModalProps) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [isLoading, setIsLoading] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { startTrial, fetchSubscription } = useSubscriptionStore();
    const { user } = useAuthStore();

    const BENEFITS = [
        { icon: 'bulb', text: 'Smart AI Study Insights' },
        { icon: 'trending-up', text: 'Advanced Analytics' },
        { icon: 'repeat', text: 'Smart Revision Engine' },
        { icon: 'cloud-upload', text: 'Data Backup & Export' },
        { icon: 'school', text: 'Unlimited Subjects & Topics' },
    ];

    const PRICE_MONTHLY = '$4.99';
    const PRICE_YEARLY = '$39.99';
    const SAVINGS = '33%';

    const handleSubscribe = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // 1. Fetch PaymentIntent from our Edge Function
            const { data, error } = await supabase.functions.invoke('payment-sheet', {
                body: {
                    plan: billingCycle === 'yearly' ? 'premium_yearly' : 'premium_monthly',
                    is_trial: true // Logic handled by backend whether to charge 0 or full
                }
            });

            if (error || !data) throw new Error('Could not initialize payment');

            const { paymentIntent, ephemeralKey, customer } = data;

            // 2. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'The Planner',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                defaultBillingDetails: {
                    name: 'Student',
                },
                googlePay: {
                    merchantCountryCode: 'US',
                    testEnv: true, // Set to false for production
                },
                applePay: {
                    merchantCountryCode: 'US',
                }
            });

            if (initError) throw new Error(initError.message);

            // 3. Present Payment Sheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === 'Canceled') {
                    // User canceled, do nothing
                    setIsLoading(false);
                    return;
                }
                throw new Error(presentError.message);
            }

            // 4. Success!
            Alert.alert('Success', 'Welcome to Premium! Your trial has started.');

            // Refresh subscription status
            await fetchSubscription();
            onDismiss();

        } catch (error: any) {
            console.error(error);
            Alert.alert('Payment Error', error.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartFreeTrial = async () => {
        setIsLoading(true);
        const result = await startTrial();
        setIsLoading(false);

        if (result.success) {
            Alert.alert('Trial Started!', 'You now have 7 days of full Premium access.');
            onDismiss();
        } else {
            // If trial failed (already used), suggest subscribing
            Alert.alert('Trial Unavailable', 'You have already used your trial. Please subscribe to continue.');
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} animationType="slide" transparent>
                <View style={styles.container}>
                    <View style={styles.content}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                            <Ionicons name="close" size={24} color={text.secondary} />
                        </TouchableOpacity>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header Image/Gradient */}
                            <LinearGradient
                                colors={gradients.mint as any}
                                style={styles.header}
                            >
                                <Ionicons name="diamond" size={48} color={text.primary} />
                                <Text variant="headlineMedium" style={styles.title}>Unlock Full Potential</Text>
                                <Text variant="bodyMedium" style={styles.subtitle}>
                                    Your personal study intelligence system
                                </Text>
                            </LinearGradient>

                            {/* Trigger Context */}
                            {triggerFeature && (
                                <View style={styles.triggerContainer}>
                                    <Text variant="bodySmall" style={styles.triggerText}>
                                        <Ionicons name="lock-closed" size={12} /> {triggerFeature} is a Premium feature
                                    </Text>
                                </View>
                            )}

                            {/* Benefits List */}
                            <View style={styles.benefitsContainer}>
                                {BENEFITS.map((b, index) => (
                                    <View key={index} style={styles.benefitRow}>
                                        <View style={styles.benefitIcon}>
                                            <Ionicons name="checkmark" size={16} color={pastel.mint} />
                                        </View>
                                        <Text variant="bodyLarge" style={styles.benefitText}>{b.text}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Plans Toggle */}
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                    style={[styles.toggleOption, billingCycle === 'monthly' && styles.toggleActive]}
                                    onPress={() => setBillingCycle('monthly')}
                                >
                                    <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
                                    <Text style={styles.priceText}>{PRICE_MONTHLY}/mo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.toggleOption, billingCycle === 'yearly' && styles.toggleActive]}
                                    onPress={() => setBillingCycle('yearly')}
                                >
                                    {billingCycle === 'yearly' && (
                                        <View style={styles.savingsBadge}>
                                            <Text style={styles.savingsText}>SAVE {SAVINGS}</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
                                    <Text style={styles.priceText}>{PRICE_YEARLY}/yr</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <GlassButton
                                    variant="primary"
                                    onPress={handleStartFreeTrial}
                                    loading={isLoading}
                                    fullWidth
                                    style={styles.mainButton}
                                >
                                    Start 7-Day Free Trial
                                </GlassButton>

                                <Text variant="bodySmall" style={styles.termsText}>
                                    Then {billingCycle === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY}, auto-renews. Cancel anytime.
                                </Text>

                                <TouchableOpacity onPress={handleSubscribe} style={styles.secondaryLink}>
                                    <Text style={styles.linkText}>Already had a trial? Subscribe now</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: background.primary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '90%',
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
        padding: 4,
    },
    header: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    title: {
        fontWeight: 'bold',
        marginTop: spacing.md,
        color: text.primary,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: spacing.xs,
        color: text.secondary,
        textAlign: 'center',
        opacity: 0.8,
    },
    triggerContainer: {
        backgroundColor: `${pastel.peach}20`,
        padding: spacing.sm,
        alignItems: 'center',
    },
    triggerText: {
        color: text.primary,
        fontWeight: '600',
    },
    benefitsContainer: {
        padding: spacing.xl,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    benefitIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${pastel.mint}30`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    benefitText: {
        color: text.primary,
        fontSize: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: `${pastel.slate}10`,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        padding: 4,
        marginBottom: spacing.lg,
    },
    toggleOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    toggleActive: {
        backgroundColor: background.primary,
        shadowColor: '#4DA3FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
    },
    toggleText: {
        fontWeight: '600',
        color: text.secondary,
        marginBottom: 2,
    },
    toggleTextActive: {
        color: text.primary,
    },
    priceText: {
        fontSize: 12,
        color: text.muted,
    },
    savingsBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: pastel.mint,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    savingsText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: text.primary,
    },
    actions: {
        padding: spacing.xl,
        paddingTop: 0,
        alignItems: 'center',
    },
    mainButton: {
        marginBottom: spacing.sm,
    },
    termsText: {
        color: text.muted,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    secondaryLink: {
        padding: spacing.sm,
    },
    linkText: {
        color: text.secondary,
        textDecorationLine: 'underline',
    },
});
