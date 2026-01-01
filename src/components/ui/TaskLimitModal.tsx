import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './index';
import { background, text, pastel, spacing, borderRadius, shadows } from '../../constants/theme';

interface TaskLimitModalProps {
    visible: boolean;
    currentCount: number;
    maxTasks: number;
    todayTasks: Array<{ id: string; title: string }>;
    onDismiss: () => void;
    onReplaceTask: (taskId: string) => void;
    onScheduleTomorrow: () => void;
    onAddAnyway: () => void;
}

export function TaskLimitModal({
    visible,
    currentCount,
    maxTasks,
    todayTasks,
    onDismiss,
    onReplaceTask,
    onScheduleTomorrow,
    onAddAnyway,
}: TaskLimitModalProps) {
    const [showTaskList, setShowTaskList] = React.useState(false);

    const handleReplacePress = () => {
        setShowTaskList(true);
    };

    const handleTaskSelect = (taskId: string) => {
        onReplaceTask(taskId);
        setShowTaskList(false);
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                {!showTaskList ? (
                    <View>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="alert-circle" size={32} color={pastel.peach} />
                            </View>
                            <Text variant="headlineSmall" style={styles.title}>
                                You've reached your daily limit
                            </Text>
                            <Text variant="bodyMedium" style={styles.subtitle}>
                                Based on your profile, you work best with{' '}
                                <Text style={styles.bold}>{maxTasks} tasks per day</Text>. Adding more
                                might reduce your focus quality.
                            </Text>
                        </View>

                        {/* Current Status */}
                        <View style={styles.statusCard}>
                            <View style={styles.statusRow}>
                                <Text variant="titleLarge" style={styles.statusNumber}>
                                    {currentCount} / {maxTasks}
                                </Text>
                                <Text variant="bodySmall" style={styles.statusLabel}>
                                    tasks today
                                </Text>
                            </View>
                        </View>

                        {/* Options */}
                        <View style={styles.options}>
                            {/* Replace Task */}
                            <TouchableOpacity
                                style={styles.option}
                                onPress={handleReplacePress}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: `${pastel.mistBlue}20` }]}>
                                    <Ionicons name="swap-horizontal" size={20} color={pastel.mistBlue} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text variant="bodyLarge" style={styles.optionTitle}>
                                        Replace a task
                                    </Text>
                                    <Text variant="bodySmall" style={styles.optionDesc}>
                                        Remove one from today's list
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={text.muted} />
                            </TouchableOpacity>

                            {/* Schedule Tomorrow */}
                            <TouchableOpacity
                                style={styles.option}
                                onPress={onScheduleTomorrow}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: `${pastel.slate}20` }]}>
                                    <Ionicons name="calendar" size={20} color={pastel.slate} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text variant="bodyLarge" style={styles.optionTitle}>
                                        Schedule for tomorrow
                                    </Text>
                                    <Text variant="bodySmall" style={styles.optionDesc}>
                                        Keep today manageable
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={text.muted} />
                            </TouchableOpacity>

                            {/* Add Anyway */}
                            <TouchableOpacity
                                style={styles.option}
                                onPress={onAddAnyway}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: `${pastel.mint}20` }]}>
                                    <Ionicons name="checkmark-circle" size={20} color={pastel.mint} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text variant="bodyLarge" style={styles.optionTitle}>
                                        Add anyway
                                    </Text>
                                    <Text variant="bodySmall" style={styles.optionDesc}>
                                        I know what I'm doing
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={text.muted} />
                            </TouchableOpacity>
                        </View>

                        {/* Cancel */}
                        <Button variant="ghost" onPress={onDismiss} fullWidth>
                            Cancel
                        </Button>
                    </View>
                ) : (
                    <View>
                        {/* Task Selection */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => setShowTaskList(false)}>
                                <Ionicons name="arrow-back" size={24} color={text.primary} />
                            </TouchableOpacity>
                            <Text variant="headlineSmall" style={[styles.title, { marginTop: spacing.sm }]}>
                                Replace which task?
                            </Text>
                            <Text variant="bodyMedium" style={styles.subtitle}>
                                Select a task to remove from today
                            </Text>
                        </View>

                        <View style={styles.taskList}>
                            {todayTasks.map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    style={styles.taskItem}
                                    onPress={() => handleTaskSelect(task.id)}
                                >
                                    <View style={styles.taskDot} />
                                    <Text variant="bodyLarge" style={styles.taskTitle} numberOfLines={2}>
                                        {task.title}
                                    </Text>
                                    <Ionicons name="close-circle-outline" size={20} color={text.muted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: background.card,
        margin: spacing.lg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    header: {
        marginBottom: spacing.lg,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        color: text.primary,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        color: text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    bold: {
        fontWeight: '600',
        color: text.primary,
    },
    statusCard: {
        backgroundColor: `${pastel.peach}10`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        alignItems: 'center',
    },
    statusRow: {
        alignItems: 'center',
    },
    statusNumber: {
        color: pastel.peach,
        fontWeight: '700',
        marginBottom: 4,
    },
    statusLabel: {
        color: text.secondary,
    },
    options: {
        marginBottom: spacing.md,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: background.secondary,
        marginBottom: spacing.sm,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        color: text.primary,
        fontWeight: '500',
        marginBottom: 2,
    },
    optionDesc: {
        color: text.secondary,
    },
    taskList: {
        marginTop: spacing.md,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: background.secondary,
        marginBottom: spacing.sm,
    },
    taskDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: pastel.mint,
        marginRight: spacing.sm,
    },
    taskTitle: {
        flex: 1,
        color: text.primary,
    },
});
