// InsightCard - Soft insight display card
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StudyInsight } from '../../types';
import { borderRadius, spacing, gradients } from '../../constants/theme';

interface InsightCardProps {
    insight: StudyInsight;
    onDismiss?: () => void;
}

const INSIGHT_ICONS: Record<StudyInsight['type'], string> = {
    best_time: 'sunny-outline',
    consistency: 'calendar-outline',
    intensity: 'flame-outline',
    revision_needed: 'refresh-outline',
    weak_area: 'alert-circle-outline',
};

const INSIGHT_GRADIENTS: Record<StudyInsight['type'], readonly string[]> = {
    best_time: gradients.warm,
    consistency: gradients.mint,
    intensity: gradients.peach,
    revision_needed: gradients.sage,
    weak_area: gradients.peach,
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
    const icon = INSIGHT_ICONS[insight.type];
    const gradient = INSIGHT_GRADIENTS[insight.type];

    return (
        <LinearGradient
            colors={gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={24} color="#5D6B6B" />
                </View>
                <View style={styles.textContainer}>
                    <Text variant="titleSmall" style={styles.title}>
                        {insight.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.description}>
                        {insight.description}
                    </Text>
                </View>
                {insight.dismissible && onDismiss && (
                    <TouchableOpacity
                        onPress={onDismiss}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.dismissButton}
                    >
                        <Ionicons name="close" size={18} color="rgba(93, 107, 107, 0.5)" />
                    </TouchableOpacity>
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#5D6B6B',
        fontWeight: '600',
        marginBottom: 2,
    },
    description: {
        color: 'rgba(93, 107, 107, 0.75)',
        lineHeight: 18,
    },
    dismissButton: {
        padding: 4,
    },
});
