import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, Portal, TextInput as PaperTextInput, Text } from 'react-native-paper';
import { ADAPTIVE_PLANS, getPlanById } from "../../utils/adaptivePlans";
import { format } from "date-fns";
import { useProfileStore } from "../../store/profileStore";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { background, text, pastel, spacing, borderRadius, semantic } from '../../constants/theme';
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
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text variant="headlineSmall" style={styles.title}>
                            Start Focus Session
                        </Text>
                        <TouchableOpacity onPress={onDismiss}>
                            <Ionicons name="close" size={24} color={text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Plan Warning or Limit Reached */}
                    {activePlan && (
                        <View style={{ marginBottom: 16 }}>
                            {isLimitReached ? (
                                <View style={[styles.warningCard, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                    <View style={{ flex: 1 }}>
                                        <Text variant="titleSmall" style={{ color: '#EF4444', fontWeight: 'bold' }}>Daily Limit Reached</Text>
                                        <Text variant="bodySmall" style={{ color: '#7F1D1D' }}>
                                            Your "{activePlan.name}" plan limits you to {activePlan.max_sessions_per_day} sessions per day to prevent burnout.
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={[styles.warningCard, { backgroundColor: pastel.mistBlue, borderColor: pastel.mint }]}>
                                    <Ionicons name="information-circle" size={20} color={text.secondary} />
                                    <Text variant="bodySmall" style={{ color: text.secondary, flex: 1 }}>
                                        {activePlan.smart_warnings[0] || `Aim for ${activePlan.default_session_length} mins`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Duration */}
                    <View style={styles.section}>
                        <Text variant="titleSmall" style={styles.label}>
                            Session Duration
                        </Text>
                        <PaperTextInput
                            mode="outlined"
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="number-pad"
                            placeholder="Minutes"
                            right={<PaperTextInput.Affix text="min" />}
                            style={styles.input}
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
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
                        <PaperTextInput
                            mode="outlined"
                            value={note}
                            onChangeText={setNote}
                            placeholder="What are you focusing on?"
                            multiline
                            numberOfLines={2}
                            maxLength={200}
                            style={styles.input}
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                            placeholderTextColor={text.muted}
                        />
                    </View>

                    {/* Start Button */}
                    <Button
                        onPress={handleStart}
                        disabled={!selectedSubject || !duration || Number(duration) <= 0 || (isLimitReached as boolean)}
                        fullWidth
                        style={[
                            styles.startButton,
                            ...((!selectedSubject || !duration || Number(duration) <= 0 || isLimitReached) ? [styles.startButtonDisabled] : [])
                        ] as any}
                    >
                        <Text style={styles.startButtonText}>
                            {isLimitReached ? 'Limit Reached' : 'Start Focus Session'}
                        </Text>
                    </Button>
                </ScrollView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: background.card,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.xl * 2,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        color: text.primary,
        fontWeight: '600',
    },
    section: {
        marginBottom: spacing.lg,
    },
    label: {
        color: text.primary,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    required: {
        color: semantic.error,
    },
    warningCard: {
        flexDirection: 'row',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    input: {
        backgroundColor: background.primary,
    },
    hint: {
        color: text.secondary,
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
        backgroundColor: background.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: pastel.mint,
        backgroundColor: `${pastel.mint}15`,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.xs,
    },
    optionText: {
        color: text.primary,
    },
    optionTextSelected: {
        color: pastel.mint,
        fontWeight: '600',
    },
    startButton: {
        marginTop: spacing.md,
    },
    startButtonDisabled: {
        opacity: 0.5,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    }
});
