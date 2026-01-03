// Profile Settings - Edit your personalized profile
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, GlassButton } from '../../components/glass';
import { QuestionCard } from '../../components/onboarding/QuestionCard';
import { darkBackground, glassText, glassAccent, glass } from '../../constants/glassTheme';
import { spacing, borderRadius } from '../../constants/theme';
import { ONBOARDING_QUESTIONS, getSectionNames, getQuestionsBySection } from '../../utils/onboardingQuestions';
import { useProfileStore } from '../../store/profileStore';
import { useCapacityStore } from '../../store/capacityStore';
import { UserProfileInsights } from '../../types/profile';
import { ADAPTIVE_PLANS } from '../../utils/adaptivePlans';
import { getPersonaDescription } from '../../utils/personaDerivation';
import { CapacityEditor } from '../../components/profile/CapacityEditor';

export default function ProfileSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, updateProfile } = useProfileStore();
    const { calculateAndSaveCapacity } = useCapacityStore();

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            // Pre-fill with existing answers
            const initialAnswers: Record<string, string> = {};
            ONBOARDING_QUESTIONS.forEach(q => {
                const value = (profile as any)[q.field];
                if (value) {
                    initialAnswers[q.id] = value;
                }
            });
            setAnswers(initialAnswers);
        }
    }, [profile]);

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates: Partial<UserProfileInsights> = {};
            ONBOARDING_QUESTIONS.forEach(q => {
                if (answers[q.id]) {
                    (updates as any)[q.field] = answers[q.id];
                }
            });

            await updateProfile(updates);
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRecalculateCapacity = async () => {
        if (!profile) return;
        try {
            await calculateAndSaveCapacity(profile);
            Alert.alert('Success', 'Capacity recalculated from your profile');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to recalculate capacity');
        }
    };

    const sections = getQuestionsBySection();
    const sectionNames = getSectionNames();

    const currentPlan = profile?.selected_plan_id
        ? ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)
        : null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Edit Profile',
                    headerStyle: { backgroundColor: darkBackground.primary },
                    headerTintColor: glassText.primary,
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Current Persona & Plan */}
                {profile && (
                    <GlassCard style={styles.personaCard}>
                        <Text variant="titleMedium" style={styles.personaTitle}>
                            Your Study Profile
                        </Text>
                        {profile.study_persona && (
                            <Text variant="bodyMedium" style={styles.personaDescription}>
                                {getPersonaDescription(profile.study_persona)}
                            </Text>
                        )}
                        {currentPlan && (
                            <View style={styles.planBadge}>
                                <Text style={styles.planEmoji}>{currentPlan.emoji}</Text>
                                <View>
                                    <Text variant="bodySmall" style={styles.planName}>
                                        {currentPlan.name}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.planDescription}>
                                        {currentPlan.description}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </GlassCard>
                )}

                {/* Privacy Notice */}
                <GlassCard style={styles.privacyCard} intensity="light">
                    <Text variant="bodySmall" style={styles.privacyText}>
                        🔒 Your profile data is private and only used to personalize your experience.
                        We never share this information.
                    </Text>
                </GlassCard>

                {/* Capacity Editor */}
                <CapacityEditor onRecalculate={handleRecalculateCapacity} />

                {/* Questions by Section */}
                {sectionNames.map((sectionName) => {
                    const questions = sections[sectionName];
                    const isExpanded = expandedSection === sectionName;

                    return (
                        <GlassCard key={sectionName} style={styles.sectionCard} padding={0}>
                            <TouchableOpacity
                                onPress={() => setExpandedSection(isExpanded ? null : sectionName)}
                                style={styles.sectionHeader}
                                activeOpacity={0.7}
                            >
                                <View style={styles.sectionHeaderContent}>
                                    <Text variant="titleSmall" style={styles.sectionName}>
                                        {sectionName}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.sectionCount}>
                                        {questions.length} questions
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.sectionQuestions}>
                                    {questions.map((question) => (
                                        <View key={question.id} style={styles.questionContainer}>
                                            <QuestionCard
                                                question={question}
                                                value={answers[question.id] || null}
                                                onAnswer={(value) => handleAnswer(question.id, value)}
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </GlassCard>
                    );
                })}

                {/* Save Button */}
                <View style={{ paddingHorizontal: 4 }}>
                    <GlassButton
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={isSaving}
                        variant="primary"
                        size="lg"
                    >
                        Save Changes
                    </GlassButton>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBackground.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    personaCard: {
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    personaTitle: {
        color: glassText.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    personaDescription: {
        color: glassText.secondary,
        marginBottom: spacing.md,
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: glass.background.light,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: glass.border.light,
    },
    planEmoji: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    planName: {
        color: glassText.primary,
        fontWeight: '600',
    },
    planDescription: {
        color: glassText.secondary,
    },
    privacyCard: {
        marginBottom: spacing.md,
    },
    privacyText: {
        color: glassText.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    sectionCard: {
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    sectionHeader: {
        padding: spacing.md,
    },
    sectionHeaderContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionName: {
        color: glassText.primary,
        fontWeight: '600',
    },
    sectionCount: {
        color: glassText.secondary,
    },
    sectionQuestions: {
        padding: spacing.md,
        paddingTop: 0,
    },
    questionContainer: {
        marginBottom: spacing.lg,
    },
});
