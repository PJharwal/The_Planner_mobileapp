// Insights Screen - Study Analytics & Intelligence
import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../store/authStore";
import { getAllInsights, generateWeeklyReview } from "../../utils/studyInsights";
import { getRevisionSuggestions } from "../../utils/revisionEngine";
import { StudyInsight, RevisionSuggestion } from "../../types";
import { InsightCard } from "../../components/ui";
import { GlassCard } from "../../components/glass";
import { spacing, borderRadius } from "../../constants/theme";
import { glassAccent, glassText, darkBackground } from "../../constants/glassTheme";

export default function InsightsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();

    const [insights, setInsights] = useState<StudyInsight[]>([]);
    const [revisions, setRevisions] = useState<RevisionSuggestion[]>([]);
    const [weeklyReview, setWeeklyReview] = useState<{
        tasksCompleted: number;
        studyMinutes: number;
        daysActive: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;

        const [insightsData, revisionsData, weeklyData] = await Promise.all([
            getAllInsights(user.id),
            getRevisionSuggestions(user.id, 5),
            generateWeeklyReview(user.id),
        ]);

        setInsights(insightsData);
        setRevisions(revisionsData);
        setWeeklyReview(weeklyData);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const dismissInsight = (index: number) => {
        setInsights(prev => prev.filter((_, i) => i !== index));
    };

    const formatMinutes = (mins: number) => {
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            return m > 0 ? `${hrs}h ${m}m` : `${hrs}h`;
        }
        return `${mins}m`;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="chevron-back" size={24} color={glassText.primary} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text variant="headlineMedium" style={styles.title}>Insights</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Your study patterns & progress
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassAccent.mint} />
                }
            >
                {/* Weekly Summary */}
                {weeklyReview && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            This Week
                        </Text>
                        <View style={styles.statsRow}>
                            <GlassCard style={styles.statCard} intensity="light">
                                <View style={styles.statContent}>
                                    <Ionicons name="checkmark-circle" size={24} color={glassAccent.mint} />
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {weeklyReview.tasksCompleted}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Tasks Done
                                    </Text>
                                </View>
                            </GlassCard>

                            <GlassCard style={styles.statCard} intensity="light">
                                <View style={styles.statContent}>
                                    <Ionicons name="time" size={24} color={glassAccent.warm} />
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {formatMinutes(weeklyReview.studyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Study Time
                                    </Text>
                                </View>
                            </GlassCard>

                            <GlassCard style={styles.statCard} intensity="light">
                                <View style={styles.statContent}>
                                    <Ionicons name="calendar" size={24} color={glassAccent.mint} />
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {weeklyReview.daysActive}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Days Active
                                    </Text>
                                </View>
                            </GlassCard>
                        </View>
                    </View>
                )}

                {/* Study Insights */}
                {insights.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Study Patterns
                        </Text>
                        {insights.map((insight, index) => (
                            <InsightCard
                                key={`${insight.type}-${index}`}
                                insight={insight}
                                onDismiss={() => dismissInsight(index)}
                            />
                        ))}
                    </View>
                )}

                {/* Revision Suggestions */}
                {revisions.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Needs Revision
                        </Text>
                        <Text variant="bodySmall" style={styles.sectionSubtitle}>
                            Topics that could use another look
                        </Text>
                        {revisions.map((rev) => (
                            <GlassCard key={rev.subTopicId} style={styles.revisionCard} intensity="light">
                                <View style={styles.revisionContent}>
                                    <View style={[styles.colorDot, { backgroundColor: rev.subjectColor || glassAccent.mint }]} />
                                    <View style={styles.revisionText}>
                                        <Text variant="titleSmall" style={styles.revisionTitle}>
                                            {rev.subTopicName}
                                        </Text>
                                        <Text variant="bodySmall" style={styles.revisionSubtitle}>
                                            {rev.subjectName} › {rev.topicName}
                                        </Text>
                                        <Text variant="labelSmall" style={styles.revisionReason}>
                                            {rev.reasonText}
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {!isLoading && insights.length === 0 && revisions.length === 0 && !weeklyReview && (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={48} color={glassText.muted} />
                        <Text variant="bodyLarge" style={styles.emptyTitle}>
                            No insights yet
                        </Text>
                        <Text variant="bodyMedium" style={styles.emptyText}>
                            Complete some focus sessions to see your study patterns.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBackground.primary,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.xs,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: glassText.primary,
        fontWeight: "600",
    },
    subtitle: {
        color: glassText.secondary,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: glassText.primary,
        fontWeight: "600",
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        color: glassText.secondary,
        marginBottom: spacing.sm,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    statCard: {
        flex: 1, // GlassCard flex works if container allows
        padding: 0,
    },
    insightCardContent: {
        padding: 16,
    },
    statContent: {
        alignItems: "center",
        padding: spacing.md,
    },
    statNumber: {
        color: glassText.primary,
        fontWeight: "600",
        marginTop: spacing.xs,
    },
    statLabel: {
        color: glassText.secondary,
        marginTop: 2,
    },
    revisionCard: {
        marginBottom: spacing.xs,
        padding: 0,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    revisionContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: spacing.md,
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
        marginRight: spacing.sm,
    },
    revisionText: {
        flex: 1,
    },
    revisionTitle: {
        color: glassText.primary,
        fontWeight: "500",
    },
    revisionSubtitle: {
        color: glassText.secondary,
        marginTop: 2,
    },
    revisionReason: {
        color: glassAccent.warm,
        marginTop: 4,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xl * 2,
    },
    emptyTitle: {
        color: glassText.primary,
        marginTop: spacing.md,
    },
    emptyText: {
        color: glassText.secondary,
        textAlign: "center",
        marginTop: spacing.xs,
    },
});
