import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, Portal, TextInput as PaperTextInput, Text } from 'react-native-paper';
import { ADAPTIVE_PLANS, getPlanById } from "../../utils/adaptivePlans";
import { format } from "date-fns";
import { useProfileStore } from "../../store/profileStore";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from '@expo/vector-icons';
import { darkBackground, glass, glassAccent, glassText } from '../../constants/glassTheme';
import { GlassSheet, GlassInput, GlassButton, GlassCard } from '../glass';
import { spacing, borderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { SessionConfigSchema } from '../../schemas/session.schema';
import { handleError } from '../../lib/errorHandler';

interface Subject {
    id: string;
    name: string;
    color: string;
}

interface Topic {
    id: string;
    name: string;
}

interface SubTopic {
    id: string;
    name: string;
}

interface StartSessionModalProps {
    visible: boolean;
    onDismiss: () => void;
    onStart: (config: SessionConfig) => void;
    defaultDuration: number;
}

export interface SessionConfig {
    duration: number;
    subjectId: string;
    topicId?: string;
    subTopicId?: string;
    note?: string;
}

export function StartSessionModal({
    visible,
    onDismiss,
    onStart,
    defaultDuration,
}: StartSessionModalProps) {
    const [duration, setDuration] = useState(defaultDuration.toString());
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [subTopics, setSubTopics] = useState<SubTopic[]>([]);

    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [todayCount, setTodayCount] = useState(0);

    const { user } = useAuthStore();
    const { profile } = useProfileStore();

    // Get active plan
    const activePlanId = profile?.selected_plan_id as any;
    const activePlan = activePlanId ? getPlanById(activePlanId) : ADAPTIVE_PLANS.find(p => p.id === 'balanced_daily');
    const isLimitReached = activePlan ? todayCount >= activePlan.max_sessions_per_day : false;

    useEffect(() => {
        if (visible) {
            fetchSubjects();
            fetchSessionCount();

            // Set default duration based on plan
            if (activePlan) {
                setDuration(activePlan.default_session_length.toString());
            } else {
                setDuration(defaultDuration.toString());
            }
            setSelectedSubject(null);
            setSelectedTopic(null);
            setSelectedSubTopic(null);
            setNote('');
        }
    }, [visible, defaultDuration, activePlan, user]);

    useEffect(() => {
        if (selectedSubject) {
            fetchTopics(selectedSubject);
        } else {
            setTopics([]);
        }
        setSelectedTopic(null);
        setSelectedSubTopic(null);
    }, [selectedSubject]);

    useEffect(() => {
        if (selectedTopic) {
            fetchSubTopics(selectedTopic);
        } else {
            setSubTopics([]);
        }
        setSelectedSubTopic(null);
    }, [selectedTopic]);

    const fetchSubjects = async () => {
        const { data } = await supabase
            .from('subjects')
            .select('id, name, color')
            .order('name');
        if (data) setSubjects(data);
    };

    const fetchTopics = async (subjectId: string) => {
        const { data } = await supabase
            .from('topics')
            .select('id, name')
            .eq('subject_id', subjectId)
            .order('name');
        if (data) setTopics(data);
    };

    const fetchSubTopics = async (topicId: string) => {
        const { data } = await supabase
            .from('sub_topics')
            .select('id, name')
            .eq('topic_id', topicId)
            .order('name');
        if (data) setSubTopics(data);
    };

    const fetchSessionCount = async () => {
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];

        const { count } = await supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('started_at', `${today}T00:00:00`)
            .lt('started_at', `${today}T23:59:59`);

        setTodayCount(count || 0);
    };

    const handleStart = () => {
        if (!selectedSubject || isLimitReached) return;

        try {
            // Validate input with Zod
            const validatedConfig = SessionConfigSchema.parse({
                duration: parseInt(duration),
                subjectId: selectedSubject,
                topicId: selectedTopic || undefined,
                subTopicId: selectedSubTopic || undefined,
                note: note.trim() || undefined,
            });

            // Type-safe config passed to parent
            onStart(validatedConfig);
            onDismiss();
        } catch (error) {
            // Zod validation error - show user-friendly message
            handleError.validation(error);
        }
    };

    const canStart = selectedSubject && duration && parseInt(duration) > 0;

    return (
        <GlassSheet
            visible={visible}
            onClose={onDismiss}
            title="Start Focus Session"
            presentation="card"
        >
            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {/* Plan Warning or Limit Reached */}
                {activePlan && (
                    <View style={{ marginBottom: 16 }}>
                        {isLimitReached ? (
                            <GlassCard intensity="light" style={[styles.warningCard, { backgroundColor: glassAccent.warm + '20' }]}>
                                <Ionicons name="alert-circle" size={20} color={glassAccent.warm} />
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleSmall" style={{ color: glassAccent.warm, fontWeight: 'bold' }}>Daily Limit Reached</Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                        Your "{activePlan.name}" plan limits you to {activePlan.max_sessions_per_day} sessions per day to prevent burnout.
                                    </Text>
                                </View>
                            </GlassCard>
                        ) : (
                            <GlassCard intensity="light" style={styles.warningCard}>
                                <Ionicons name="information-circle" size={20} color={glassAccent.mint} />
                                <Text variant="bodySmall" style={{ color: glassText.secondary, flex: 1 }}>
                                    {activePlan.smart_warnings[0] || `Aim for ${activePlan.default_session_length} mins`}
                                </Text>
                            </GlassCard>
                        )}
                    </View>
                )}

                {/* Duration */}
                <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.label}>
                        Session Duration
                    </Text>
                    <GlassInput
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="number-pad"
                        placeholder="Minutes"
                        style={styles.input}
                    />
                    <Text variant="bodySmall" style={styles.hint}>
                        Enter 1-180 minutes
                    </Text>
                </View>

                {/* Subject */}
                <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.label}>
                        Subject <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.optionsGrid}>
                        {subjects.map((subject) => (
                            <TouchableOpacity
                                key={subject.id}
                                onPress={() => setSelectedSubject(subject.id)}
                                style={[
                                    styles.option,
                                    selectedSubject === subject.id && styles.optionSelected,
                                ]}
                            >
                                <View
                                    style={[styles.colorDot, { backgroundColor: subject.color }]}
                                />
                                <Text
                                    variant="bodyMedium"
                                    style={[
                                        styles.optionText,
                                        selectedSubject === subject.id && styles.optionTextSelected,
                                    ]}
                                >
                                    {subject.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Topic (optional) */}
                {topics.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleSmall" style={styles.label}>
                            Topic (Optional)
                        </Text>
                        <View style={styles.optionsGrid}>
                            {topics.map((topic) => (
                                <TouchableOpacity
                                    key={topic.id}
                                    onPress={() => setSelectedTopic(topic.id)}
                                    style={[
                                        styles.option,
                                        selectedTopic === topic.id && styles.optionSelected,
                                    ]}
                                >
                                    <Text
                                        variant="bodyMedium"
                                        style={[
                                            styles.optionText,
                                            selectedTopic === topic.id && styles.optionTextSelected,
                                        ]}
                                    >
                                        {topic.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Sub-Topic (optional) */}
                {subTopics.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleSmall" style={styles.label}>
                            Sub-Topic (Optional)
                        </Text>
                        <View style={styles.optionsGrid}>
                            {subTopics.map((subTopic) => (
                                <TouchableOpacity
                                    key={subTopic.id}
                                    onPress={() => setSelectedSubTopic(subTopic.id)}
                                    style={[
                                        styles.option,
                                        selectedSubTopic === subTopic.id && styles.optionSelected,
                                    ]}
                                >
                                    <Text
                                        variant="bodyMedium"
                                        style={[
                                            styles.optionText,
                                            selectedSubTopic === subTopic.id && styles.optionTextSelected,
                                        ]}
                                    >
                                        {subTopic.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Note (optional) */}
                <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.label}>
                        Note (Optional)
                    </Text>
                    <GlassInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="What are you focusing on?"
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                        style={styles.input}
                    />
                </View>

                {/* Start Button */}
                <GlassButton
                    onPress={handleStart}
                    disabled={!selectedSubject || !duration || Number(duration) <= 0 || isLimitReached}
                    fullWidth
                    style={styles.startButton}
                >
                    {isLimitReached ? 'Limit Reached' : 'Start Focus Session'}
                </GlassButton>
            </ScrollView>
        </GlassSheet>
    );
}

const styles = StyleSheet.create({
    content: {
        // Removed flex: 1 - ScrollView should grow with content
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        color: glassText.primary,
        fontWeight: '600',
    },
    section: {
        marginBottom: spacing.lg,
    },
    label: {
        color: glassText.primary,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    required: {
        color: glassAccent.warm,
    },
    warningCard: {
        flexDirection: 'row',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        gap: 8,
    },
    input: {
        backgroundColor: 'transparent',
    },
    hint: {
        color: glassText.secondary,
        marginTop: spacing.xs,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: glass.background.light,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: glassAccent.mint,
        backgroundColor: glassAccent.mintGlow,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.xs,
    },
    optionText: {
        color: glassText.primary,
    },
    optionTextSelected: {
        color: glassAccent.mint,
        fontWeight: '600',
    },
    startButton: {
        marginTop: spacing.md,
    },
});
