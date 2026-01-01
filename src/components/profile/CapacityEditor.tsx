import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Card, Button } from '../../components/ui';
import { background, text, pastel, spacing, borderRadius } from '../../constants/theme';
import { useCapacityStore } from '../../store/capacityStore';
import { UserCapacity } from '../../types/database';

interface CapacityEditorProps {
    onRecalculate: () => void;
}

export function CapacityEditor({ onRecalculate }: CapacityEditorProps) {
    const { capacity, updateCapacity } = useCapacityStore();
    const [localCapacity, setLocalCapacity] = useState<Partial<UserCapacity>>(capacity || {});
    const [isSaving, setIsSaving] = useState(false);

    if (!capacity) {
        return (
            <Card style={styles.card}>
                <View style={styles.emptyState}>
                    <Ionicons name="speedometer-outline" size={40} color={text.muted} />
                    <Text variant="bodyMedium" style={styles.emptyText}>
                        No capacity data yet. Complete onboarding to set up your capacity.
                    </Text>
                </View>
            </Card>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateCapacity({
                max_tasks_per_day: localCapacity.max_tasks_per_day!,
                default_focus_minutes: localCapacity.default_focus_minutes!,
                default_break_minutes: localCapacity.default_break_minutes!,
                max_daily_focus_minutes: localCapacity.max_daily_focus_minutes!,
                recommended_sessions_per_day: localCapacity.recommended_sessions_per_day!,
            });
        } catch (error) {
            console.error('Error saving capacity:', error);
        }
        setIsSaving(false);
    };

    const hasChanges =
        localCapacity.max_tasks_per_day !== capacity.max_tasks_per_day ||
        localCapacity.default_focus_minutes !== capacity.default_focus_minutes ||
        localCapacity.default_break_minutes !== capacity.default_break_minutes ||
        localCapacity.max_daily_focus_minutes !== capacity.max_daily_focus_minutes ||
        localCapacity.recommended_sessions_per_day !== capacity.recommended_sessions_per_day;

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="speedometer-outline" size={20} color={pastel.mint} />
                    <Text variant="titleMedium" style={styles.title}>
                        Your Study Capacity
                    </Text>
                </View>
                <Text variant="bodySmall" style={styles.subtitle}>
                    Adjust your daily limits and focus durations
                </Text>
            </View>

            <View style={styles.metrics}>
                {/* Max Tasks Per Day */}
                <View style={styles.metric}>
                    <View style={styles.metricHeader}>
                        <Text variant="bodyMedium" style={styles.metricLabel}>
                            Max Tasks Per Day
                        </Text>
                        <Text variant="titleMedium" style={styles.metricValue}>
                            {localCapacity.max_tasks_per_day}
                        </Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={localCapacity.max_tasks_per_day || 5}
                        onValueChange={(value) => setLocalCapacity({ ...localCapacity, max_tasks_per_day: value })}
                        minimumTrackTintColor={pastel.mint}
                        maximumTrackTintColor={pastel.beige}
                        thumbTintColor={pastel.mint}
                    />
                    <View style={styles.sliderLabels}>
                        <Text variant="bodySmall" style={styles.sliderLabel}>1</Text>
                        <Text variant="bodySmall" style={styles.sliderLabel}>10</Text>
                    </View>
                </View>

                {/* Default Focus Minutes */}
                <View style={styles.metric}>
                    <View style={styles.metricHeader}>
                        <Text variant="bodyMedium" style={styles.metricLabel}>
                            Default Focus Duration
                        </Text>
                        <Text variant="titleMedium" style={styles.metricValue}>
                            {localCapacity.default_focus_minutes}m
                        </Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={10}
                        maximumValue={90}
                        step={5}
                        value={localCapacity.default_focus_minutes || 25}
                        onValueChange={(value) => setLocalCapacity({ ...localCapacity, default_focus_minutes: value })}
                        minimumTrackTintColor={pastel.mint}
                        maximumTrackTintColor={pastel.beige}
                        thumbTintColor={pastel.mint}
                    />
                    <View style={styles.sliderLabels}>
                        <Text variant="bodySmall" style={styles.sliderLabel}>10m</Text>
                        <Text variant="bodySmall" style={styles.sliderLabel}>90m</Text>
                    </View>
                </View>

                {/* Default Break Minutes */}
                <View style={styles.metric}>
                    <View style={styles.metricHeader}>
                        <Text variant="bodyMedium" style={styles.metricLabel}>
                            Default Break Duration
                        </Text>
                        <Text variant="titleMedium" style={styles.metricValue}>
                            {localCapacity.default_break_minutes}m
                        </Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={5}
                        maximumValue={20}
                        step={1}
                        value={localCapacity.default_break_minutes || 5}
                        onValueChange={(value) => setLocalCapacity({ ...localCapacity, default_break_minutes: value })}
                        minimumTrackTintColor={pastel.mint}
                        maximumTrackTintColor={pastel.beige}
                        thumbTintColor={pastel.mint}
                    />
                    <View style={styles.sliderLabels}>
                        <Text variant="bodySmall" style={styles.sliderLabel}>5m</Text>
                        <Text variant="bodySmall" style={styles.sliderLabel}>20m</Text>
                    </View>
                </View>

                {/* Max Daily Focus */}
                <View style={styles.metric}>
                    <View style={styles.metricHeader}>
                        <Text variant="bodyMedium" style={styles.metricLabel}>
                            Max Daily Focus Time
                        </Text>
                        <Text variant="titleMedium" style={styles.metricValue}>
                            {Math.floor(localCapacity.max_daily_focus_minutes! / 60)}h {localCapacity.max_daily_focus_minutes! % 60}m
                        </Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={60}
                        maximumValue={480}
                        step={30}
                        value={localCapacity.max_daily_focus_minutes || 120}
                        onValueChange={(value) => setLocalCapacity({ ...localCapacity, max_daily_focus_minutes: value })}
                        minimumTrackTintColor={pastel.mint}
                        maximumTrackTintColor={pastel.beige}
                        thumbTintColor={pastel.mint}
                    />
                    <View style={styles.sliderLabels}>
                        <Text variant="bodySmall" style={styles.sliderLabel}>1h</Text>
                        <Text variant="bodySmall" style={styles.sliderLabel}>8h</Text>
                    </View>
                </View>

                {/* Recommended Sessions */}
                <View style={styles.metric}>
                    <View style={styles.metricHeader}>
                        <Text variant="bodyMedium" style={styles.metricLabel}>
                            Recommended Sessions/Day
                        </Text>
                        <Text variant="titleMedium" style={styles.metricValue}>
                            {localCapacity.recommended_sessions_per_day}
                        </Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={8}
                        step={1}
                        value={localCapacity.recommended_sessions_per_day || 4}
                        onValueChange={(value) => setLocalCapacity({ ...localCapacity, recommended_sessions_per_day: value })}
                        minimumTrackTintColor={pastel.mint}
                        maximumTrackTintColor={pastel.beige}
                        thumbTintColor={pastel.mint}
                    />
                    <View style={styles.sliderLabels}>
                        <Text variant="bodySmall" style={styles.sliderLabel}>1</Text>
                        <Text variant="bodySmall" style={styles.sliderLabel}>8</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <Button
                    variant="ghost"
                    onPress={onRecalculate}
                    style={styles.recalculateButton}
                >
                    Recalculate from Profile
                </Button>
                <Button
                    onPress={handleSave}
                    disabled={!hasChanges || isSaving}
                    loading={isSaving}
                >
                    Save Changes
                </Button>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        padding: spacing.md,
    },
    header: {
        marginBottom: spacing.lg,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        color: text.primary,
        fontWeight: '600',
    },
    subtitle: {
        color: text.secondary,
    },
    metrics: {
        gap: spacing.lg,
    },
    metric: {
        marginBottom: spacing.sm,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    metricLabel: {
        color: text.primary,
        fontWeight: '500',
    },
    metricValue: {
        color: pastel.mint,
        fontWeight: '700',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    sliderLabel: {
        color: text.secondary,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    recalculateButton: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        color: text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
