// Onboarding Screen - Multi-step personalized onboarding flow
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { QuestionCard } from '../../components/onboarding/QuestionCard';
import { ProgressIndicator } from '../../components/onboarding/ProgressIndicator';
import { background, text, pastel, spacing, borderRadius } from '../../constants/theme';
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
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
    };

    const handleNext = () => {
        if (isLastQuestion) {
            handleComplete();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            // Map answers to profile fields
            const profileData: Partial<UserProfileInsights> = {};
            ONBOARDING_QUESTIONS.forEach(q => {
                if (answers[q.id]) {
                    (profileData as any)[q.field] = answers[q.id];
                }
            });

            await saveProfile(profileData);
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
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text variant="headlineMedium" style={styles.title}>
                            Let's personalize your experience
                        </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.subtitle}>
                        You can change these answers later in settings
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
                    <View style={styles.sectionBadge}>
                        <Ionicons name="sparkles" size={14} color={pastel.mint} />
                        <Text variant="labelSmall" style={styles.sectionText}>
                            {currentQuestion.section}
                        </Text>
                    </View>

                    <QuestionCard
                        question={currentQuestion}
                        value={answers[currentQuestion.id] || null}
                        onAnswer={handleAnswer}
                    />
                </ScrollView>

                {/* Navigation */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                    <View style={styles.buttonRow}>
                        <Button
                            variant="ghost"
                            onPress={handleBack}
                            disabled={currentIndex === 0}
                            style={styles.backButton}
                        >
                            Back
                        </Button>

                        <Button
                            onPress={handleNext}
                            disabled={!canProceed}
                            loading={isSaving}
                            style={styles.nextButton}
                        >
                            {isLastQuestion ? 'Complete' : 'Next'}
                        </Button>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: background.primary,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    title: {
        color: text.primary,
        fontWeight: '600',
        flex: 1,
    },
    subtitle: {
        color: text.secondary,
    },
    progressContainer: {
        paddingHorizontal: spacing.lg,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    sectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: `${pastel.mint}15`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.md,
    },
    sectionText: {
        color: pastel.mint,
        marginLeft: 4,
        fontWeight: '600',
    },
    footer: {
        backgroundColor: background.primary,
        borderTopWidth: 1,
        borderTopColor: `${text.muted}15`,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    backButton: {
        flex: 1,
    },
    nextButton: {
        flex: 2,
    },
});
