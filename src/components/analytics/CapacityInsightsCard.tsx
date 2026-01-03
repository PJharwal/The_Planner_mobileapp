import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass/GlassCard';
import { glassText, glassAccent, glass } from '../../constants/glassTheme';
import { CapacityInsights } from '../../utils/capacityInsights';
import { getAdherenceFeedback, getAdherenceColor } from '../../utils/capacityInsights';

interface CapacityInsightsCardProps {
    insights: CapacityInsights;
}

export function CapacityInsightsCard({ insights }: CapacityInsightsCardProps) {
    const feedback = getAdherenceFeedback(insights.averageAdherence, insights.overcapacityDays);
    const adherenceColor = getAdherenceColor(insights.averageAdherence);

    return (
        <GlassCard style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="speedometer-outline" size={20} color={glassAccent.mint} />
                    <Text variant="titleMedium" style={styles.title}>
                        Capacity Insights
                    </Text>
                </View>
                <Text variant="bodySmall" style={styles.subtitle}>
                    Last 7 days
                </Text>
            </View>

            {/* Weekly Adherence Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chart}>
                    {insights.weeklyAdherence.map((day) => {
                        const barHeight = (day.adherenceScore / 100) * 80;
                        const date = new Date(day.date);
                        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })[0];

                        return (
                            <View key={day.date} style={styles.barContainer}>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: barHeight,
                                                backgroundColor: getAdherenceColor(day.adherenceScore),
                                            },
                                        ]}
                                    />
                                </View>
                                <Text variant="bodySmall" style={styles.dayLabel}>
                                    {dayLabel}
                                </Text>
                            </View>
                        );
                    })}
                </View>
                <Text variant="bodySmall" style={styles.chartHint}>
                    Daily capacity adherence (higher is better)
                </Text>
            </View>

            {/* Key Metrics */}
            <View style={styles.metrics}>
                <View style={styles.metric}>
                    <Text variant="headlineMedium" style={[styles.metricValue, { color: adherenceColor }]}>
                        {insights.averageAdherence}%
                    </Text>
                    <Text variant="bodySmall" style={styles.metricLabel}>
                        Avg Adherence
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.metric}>
                    <Text variant="headlineMedium" style={[
                        styles.metricValue,
                        { color: insights.sessionCompletionRate >= 80 ? glassAccent.mint : glassAccent.warm }
                    ]}>
                        {insights.sessionCompletionRate}%
                    </Text>
                    <Text variant="bodySmall" style={styles.metricLabel}>
                        Sessions Done
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.metric}>
                    <Text variant="headlineMedium" style={[
                        styles.metricValue,
                        { color: insights.overcapacityDays > 2 ? glassAccent.warm : glassAccent.mint }
                    ]}>
                        {insights.overcapacityDays}
                    </Text>
                    <Text variant="bodySmall" style={styles.metricLabel}>
                        Over-Cap Days
                    </Text>
                </View>
            </View>

            {/* Feedback */}
            <View style={styles.feedback}>
                <Text variant="bodyMedium" style={styles.feedbackText}>
                    {feedback}
                </Text>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 24,
        marginBottom: 24,
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        color: glassText.primary,
        fontWeight: '600',
    },
    subtitle: {
        color: glassText.secondary,
    },
    chartContainer: {
        marginBottom: 16,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        marginBottom: 4,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        height: 80,
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    bar: {
        width: 24,
        borderRadius: 4,
        minHeight: 4,
    },
    dayLabel: {
        color: glassText.secondary,
        fontSize: 10,
    },
    chartHint: {
        color: glassText.secondary,
        textAlign: 'center',
    },
    metrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: glass.border.light,
    },
    metric: {
        alignItems: 'center',
    },
    metricValue: {
        fontWeight: '700',
        marginBottom: 4,
    },
    metricLabel: {
        color: glassText.secondary,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: glass.border.light,
    },
    feedback: {
        backgroundColor: glassAccent.mintGlow,
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    feedbackText: {
        color: glassText.primary,
        textAlign: 'center',
    },
});
