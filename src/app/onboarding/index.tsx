// Onboarding Screen - Multi-step personalized onboarding flow
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';

import { GlassButton, MeshGradientBackground } from "../../components/glass";
import { QuestionCard } from '../../components/onboarding/QuestionCard';
import { ProgressIndicator } from '../../components/onboarding/ProgressIndicator';
import { background, text, pastel, spacing, borderRadius } from '../../constants/theme';
import { darkBackground, glass, glassAccent, glassText } from '../../constants/glassTheme';
import { ONBOARDING_QUESTIONS } from '../../utils/onboardingQuestions';
import { useProfileStore } from '../../store/profileStore';
import { UserProfileInsights } from '../../types/profile';

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { saveProfile } = useProfileStore();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const currentQuestion = ONBOARDING_QUESTIONS[currentIndex];
    const isLastQuestion = currentIndex === ONBOARDING_QUESTIONS.length - 1;
    const canProceed = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== '';

    const handleAnswer = (value: string) => {
        // Haptic feedback on selection
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Immediate visual feedback handled by component
        const newAnswers = {
            ...answers,
            [currentQuestion.id]: value,
        };
        setAnswers(newAnswers);

        // Auto-advance logic
        if (isLastQuestion) {
            setTimeout(() => {
                handleComplete(newAnswers);
            }, 600); // Slightly longer delay for final transition
        } else {
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 400); // Quick 400ms delay for flow
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleComplete = async (finalAnswers?: Record<string, string>) => {
        setIsSaving(true);
        try {
            // Map answers to profile fields
            const profileData: Partial<UserProfileInsights> = {};
            const answersToSave = finalAnswers || answers;

            ONBOARDING_QUESTIONS.forEach(q => {
                if (answersToSave[q.id]) {
                    (profileData as any)[q.field] = answersToSave[q.id];
                }
            });

            // Save profile (this derives persona and selects plan)
            await saveProfile(profileData);

            // Calculate and save capacity based on profile
            const { profile } = useProfileStore.getState();
            if (profile) {
                const capacityStore = (await import('../../store/capacityStore')).useCapacityStore;
                await capacityStore.getState().calculateAndSaveCapacity(profile);
            }

            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save profile');
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <MeshGradientBackground />
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text variant="headlineMedium" style={[styles.title, { color: glassText.primary }]}>
                            Let's personalize your experience
                        </Text>
                    </View>
                    <Text variant="bodySmall" style={[styles.subtitle, { color: glassText.secondary }]}>
                        Answer honestly for the best plan
                    </Text>
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <ProgressIndicator
                        current={currentIndex + 1}
                        total={ONBOARDING_QUESTIONS.length}
                    />
                </View>

                {/* Question */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.sectionBadge, { backgroundColor: glassAccent.mintGlow }]}>
                        <Ionicons name="sparkles" size={14} color={glassAccent.mint} />
                        <Text variant="labelSmall" style={[styles.sectionText, { color: glassAccent.mint }]}>
                            {currentQuestion.section}
                        </Text>
                    </View>

                    <QuestionCard
                        question={currentQuestion}
                        value={answers[currentQuestion.id] || null}
                        onAnswer={handleAnswer}
                    />
                </ScrollView>

                {/* No Footer/Buttons - Auto Advance Only */}
                {/* Optional: Invisible back region or small back text if strictly needed?
                    User rule: "Remove Back/Next buttons... Auto-advance". 
                    I'll add a small "Back" text button at top left or just rely on Android back button?
                    Actually, making it impossible to go back is risky for UX, but requested.
                    I will add a small "Back" icon in header if index > 0.
                */}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        color: glassText.primary,
        fontWeight: '600',
        flex: 1,
    },
    subtitle: {
        color: glassText.secondary,
    },
    progressContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    sectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: glassAccent.mintGlow,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 24,
    },
    sectionText: {
        color: glassAccent.mint,
        marginLeft: 6,
        fontWeight: '600',
    },
});
