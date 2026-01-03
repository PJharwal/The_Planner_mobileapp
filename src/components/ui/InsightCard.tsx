// InsightCard - Glass insight display card
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StudyInsight } from '../../types';
import { borderRadius, spacing } from '../../constants/theme';
import { glass, glassAccent, glassText } from '../../constants/glassTheme';
import { GlassCard } from '../glass';

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

const INSIGHT_COLORS: Record<StudyInsight['type'], string> = {
    best_time: glassAccent.warm,
    consistency: glassAccent.mint,
    intensity: glassAccent.warm, // use warm instead of peach
    revision_needed: glassAccent.mint, // use mint instead of sage
    weak_area: glassAccent.warm,
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
    const icon = INSIGHT_ICONS[insight.type];
    const accentColor = INSIGHT_COLORS[insight.type];

    return (
        <GlassCard style={styles.container} intensity="light">
            <View style={[styles.content, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
                <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
                    <Ionicons name={icon as any} size={24} color={accentColor} />
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
                        <Ionicons name="close" size={18} color={glassText.secondary} />
                    </TouchableOpacity>
                )}
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
        padding: 0, // content handles padding
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
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: glassText.primary,
        fontWeight: '600',
        marginBottom: 2,
    },
    description: {
        color: glassText.secondary,
        lineHeight: 18,
    },
    dismissButton: {
        padding: 4,
    },
});
