import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HealthService } from '../../services/HealthService';
import { useHealthStore } from '../../store/healthStore';
import { spacing } from '../../constants/theme';
import { glass, glassAccent, glassText, darkBackground } from '../../constants/glassTheme';
import { GlassCard, GlassButton } from '../../components/glass';

export default function HealthConnectScreen() {
    const router = useRouter();
    const { setPermissions } = useHealthStore();
    const [loading, setLoading] = useState(false);

    // Check if HealthKit native module is available
    const isNativeAvailable = HealthService.isAvailable();

    const handleConnect = async () => {
        if (!isNativeAvailable) {
            // In Expo Go, just continue — the UI already explains the situation
            router.replace('/(tabs)');
            return;
        }

        setLoading(true);
        try {
            const authorized = await HealthService.initHealthKit();
            if (authorized) {
                setPermissions(true);
                await HealthService.fetchDayMetrics();
            }
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Health Connect Error:', error);
            router.replace('/(tabs)');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[darkBackground.primary, '#1a2c2c', darkBackground.primary]}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="heart" size={48} color={glassAccent.warm} />
                    </View>
                </View>

                <Text variant="displaySmall" style={styles.title}>
                    Optimize with Health
                </Text>

                <Text variant="bodyLarge" style={styles.subtitle}>
                    Tasky uses optional activity and sleep data to fine-tune focus sessions and prevent burnout.
                </Text>

                <View style={styles.features}>
                    <FeatureRow icon="bed-outline" title="Sleep Analysis" desc="Adjusts capacity after poor rest" />
                    <FeatureRow icon="pulse-outline" title="HRV & Recovery" desc="Detects high stress days" />
                    <FeatureRow icon="walk-outline" title="Activity Levels" desc="Suggests active breaks" />
                </View>

                {/* Show soft message when not in native build */}
                {!isNativeAvailable && (
                    <GlassCard style={styles.infoCard} intensity="light">
                        <View style={styles.infoContent}>
                            <Ionicons name="information-circle-outline" size={22} color={glassAccent.mint} />
                            <View style={{ flex: 1 }}>
                                <Text variant="titleSmall" style={{ color: glassText.primary, marginBottom: 4 }}>
                                    Available in the full app
                                </Text>
                                <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                    Apple Health access becomes available once Tasky is installed normally. Your data always stays on your device.
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                )}

                <GlassCard style={styles.privacyCard}>
                    <View style={styles.privacyContent}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={glassAccent.mint} />
                        <View style={{ flex: 1 }}>
                            <Text variant="titleSmall" style={{ color: glassText.primary, marginBottom: 4 }}>
                                Your Privacy First
                            </Text>
                            <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                Tasky never stores raw health data and never diagnoses mental or physical conditions. All adjustments are suggestions you can override.
                            </Text>
                        </View>
                    </View>
                </GlassCard>

            </ScrollView>

            <View style={styles.footer}>
                <GlassButton
                    onPress={handleConnect}
                    loading={loading}
                    size="lg"
                    fullWidth
                    glow
                >
                    {isNativeAvailable ? 'Connect Apple Health' : 'Continue'}
                </GlassButton>

                {isNativeAvailable && (
                    <GlassButton
                        variant="ghost"
                        onPress={handleSkip}
                        style={{ marginTop: 8 }}
                        fullWidth
                    >
                        Skip for now
                    </GlassButton>
                )}
            </View>
        </View>
    );
}

function FeatureRow({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
                <Ionicons name={icon} size={24} color={glassAccent.mint} />
            </View>
            <View>
                <Text variant="titleMedium" style={{ color: glassText.primary }}>{title}</Text>
                <Text variant="bodyMedium" style={{ color: glassText.secondary }}>{desc}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBackground.primary,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        padding: 24,
        paddingTop: 80,
        paddingBottom: 160,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: glassAccent.warm + '25',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: glassText.primary,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 12,
    },
    subtitle: {
        color: glassText.secondary,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    features: {
        gap: 24,
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: glassAccent.mint + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCard: {
        marginBottom: 16,
    },
    infoContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    privacyCard: {
        // Default glass card
    },
    privacyContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 48 : 24,
        backgroundColor: darkBackground.primary + 'CC', // translucent
        borderTopWidth: 1,
        borderTopColor: glass.border.light,
    },
});
