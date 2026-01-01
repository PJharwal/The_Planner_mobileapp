import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useStreakStore, getStreakMessage, getGlowColor } from '../../store/streakStore';
import { text, pastel, spacing, borderRadius } from '../../constants/theme';
import { Card, Button } from '../ui';

interface StreakModalProps {
    visible: boolean;
    onClose: () => void;
}

export function StreakModal({ visible, onClose }: StreakModalProps) {
    const { streak, getGlowIntensity } = useStreakStore();
    const streakDays = streak?.current_streak_days || 0;
    const longestStreak = streak?.longest_streak || 0;
    const intensity = getGlowIntensity();
    const flameColor = getGlowColor(intensity);
    const message = getStreakMessage(streakDays);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
                    <Card style={styles.card}>
                        {/* Close Button */}
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={text.secondary} />
                        </Pressable>

                        {/* Flame Icon */}
                        <View style={[styles.iconContainer, { backgroundColor: `${flameColor}20` }]}>
                            <Ionicons
                                name={streakDays > 0 ? 'flame' : 'flame-outline'}
                                size={48}
                                color={flameColor}
                            />
                        </View>

                        {/* Current Streak */}
                        <Text variant="displaySmall" style={styles.streakNumber}>
                            {streakDays}
                        </Text>
                        <Text variant="titleMedium" style={styles.streakLabel}>
                            {streakDays === 1 ? 'day streak' : 'day streak'}
                        </Text>

                        {/* Message */}
                        <Text variant="bodyLarge" style={styles.message}>
                            {message}
                        </Text>

                        {/* Stats */}
                        <View style={styles.stats}>
                            <View style={styles.stat}>
                                <Text variant="headlineSmall" style={styles.statValue}>
                                    {longestStreak}
                                </Text>
                                <Text variant="bodySmall" style={styles.statLabel}>
                                    Longest Streak
                                </Text>
                            </View>
                        </View>

                        {/* Info */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={18} color={text.secondary} />
                            <Text variant="bodySmall" style={styles.infoText}>
                                Complete a focus session or task to keep your streak going.
                                Missing a day resets your streak.
                            </Text>
                        </View>

                        {/* Close Button */}
                        <Button variant="ghost" onPress={onClose} style={styles.doneButton}>
                            Done
                        </Button>
                    </Card>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    content: {
        width: '85%',
        maxWidth: 340,
    },
    card: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        padding: spacing.xs,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    streakNumber: {
        color: text.primary,
        fontWeight: '700',
    },
    streakLabel: {
        color: text.secondary,
        marginBottom: spacing.md,
    },
    message: {
        color: text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 24,
    },
    stats: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    statValue: {
        color: text.primary,
        fontWeight: '600',
    },
    statLabel: {
        color: text.secondary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: `${pastel.beige}50`,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    infoText: {
        flex: 1,
        color: text.secondary,
        lineHeight: 18,
    },
    doneButton: {
        width: '100%',
    },
});
