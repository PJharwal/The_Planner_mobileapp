import { useState } from 'react';
import { View, ScrollView, StyleSheet, Switch } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, Button, Chip } from '../../components/ui';
import { background, text, pastel, spacing, borderRadius } from '../../constants/theme';
import { useCapacityStore } from '../../store/capacityStore';
import { useTaskStore } from '../../store/taskStore';
import { getTimerPresets } from '../../store/timerStore';

export default function PreFocusScreen() {
    const router = useRouter();
    const { capacity } = useCapacityStore();
    const { todayTasks } = useTaskStore();

    const timerPresets = getTimerPresets(capacity);
    const defaultDuration = capacity ? capacity.default_focus_minutes * 60 : 25 * 60;

    const [selectedDuration, setSelectedDuration] = useState(defaultDuration);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [includeBreak, setIncludeBreak] = useState(true);

    const incompleteTasks = todayTasks.filter(t => !t.is_completed);

    const handleBegin = () => {
        router.push({
            pathname: '/focus/advanced',
            params: {
                duration: selectedDuration.toString(),
                taskId: selectedTask || undefined,
                taskTitle: selectedTask
                    ? incompleteTasks.find(t => t.id === selectedTask)?.title
                    : 'Focus Session',
                includeBreak: includeBreak ? 'true' : 'false',
            },
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="rocket-outline" size={48} color={pastel.mint} />
                    <Text variant="headlineLarge" style={styles.title}>
                        Advanced Focus
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Prepare for a deep work session
                    </Text>
                </View>

                {/* Duration Selection */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={20} color={pastel.mint} />
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Session Duration
                        </Text>
                    </View>
                    {capacity && (
                        <Text variant="bodySmall" style={styles.hint}>
                            Recommended: {capacity.default_focus_minutes} minutes
                        </Text>
                    )}
                    <View style={styles.presets}>
                        {timerPresets.map(preset => (
                            <Chip
                                key={preset.value}
                                variant={selectedDuration === preset.value ? 'primary' : 'default'}
                                onPress={() => setSelectedDuration(preset.value)}
                                selected={selectedDuration === preset.value}
                            >
                                {preset.label}
                            </Chip>
                        ))}
                    </View>
                </Card>

                {/* Task Selection */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="checkbox-outline" size={20} color={pastel.mint} />
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Focus On (Optional)
                        </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.hint}>
                        Choose a task to track this session
                    </Text>
                    <View style={styles.tasks}>
                        <Chip
                            variant={selectedTask === null ? 'primary' : 'default'}
                            onPress={() => setSelectedTask(null)}
                            selected={selectedTask === null}
                        >
                            General Study
                        </Chip>
                        {incompleteTasks.slice(0, 5).map(task => (
                            <Chip
                                key={task.id}
                                variant={selectedTask === task.id ? 'primary' : 'default'}
                                onPress={() => setSelectedTask(task.id)}
                                selected={selectedTask === task.id}
                            >
                                {task.title}
                            </Chip>
                        ))}
                    </View>
                </Card>

                {/* Break Toggle */}
                <Card style={styles.section}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Include Guided Break
                            </Text>
                            <Text variant="bodySmall" style={styles.hint}>
                                {capacity?.default_break_minutes || 5} minute rest after focus
                            </Text>
                        </View>
                        <Switch
                            value={includeBreak}
                            onValueChange={setIncludeBreak}
                            trackColor={{ false: pastel.beige, true: pastel.mint }}
                            thumbColor="#fff"
                        />
                    </View>
                </Card>

                {/* Session Preview */}
                <Card style={styles.preview}>
                    <Text variant="titleSmall" style={styles.previewTitle}>
                        Session Plan
                    </Text>
                    <View style={styles.previewFlow}>
                        <View style={styles.previewPhase}>
                            <Ionicons name="bulb" size={24} color={pastel.mint} />
                            <Text variant="bodyMedium" style={styles.previewLabel}>
                                Focus
                            </Text>
                            <Text variant="bodySmall" style={styles.previewDuration}>
                                {Math.floor(selectedDuration / 60)} min
                            </Text>
                        </View>
                        {includeBreak && (
                            <>
                                <Ionicons name="arrow-forward" size={16} color={text.secondary} />
                                <View style={styles.previewPhase}>
                                    <Ionicons name="cafe" size={24} color={pastel.mistBlue} />
                                    <Text variant="bodyMedium" style={styles.previewLabel}>
                                        Rest
                                    </Text>
                                    <Text variant="bodySmall" style={styles.previewDuration}>
                                        {capacity?.default_break_minutes || 5} min
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </Card>

                {/* Begin Button */}
                <Button onPress={handleBegin} style={styles.beginButton}>
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text variant="titleMedium" style={{ color: '#fff', marginLeft: 8 }}>
                        Begin Session
                    </Text>
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: background.primary,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.lg,
    },
    title: {
        color: text.primary,
        fontWeight: '700',
        marginTop: spacing.sm,
    },
    subtitle: {
        color: text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    section: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        color: text.primary,
        fontWeight: '600',
    },
    hint: {
        color: text.secondary,
        marginBottom: spacing.sm,
    },
    presets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    tasks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleInfo: {
        flex: 1,
    },
    preview: {
        padding: spacing.md,
        marginBottom: spacing.lg,
        backgroundColor: `${pastel.mint}10`,
    },
    previewTitle: {
        color: text.primary,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    previewFlow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    previewPhase: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    previewLabel: {
        color: text.primary,
        fontWeight: '500',
    },
    previewDuration: {
        color: text.secondary,
    },
    beginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
