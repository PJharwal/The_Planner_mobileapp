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
import { Card, InsightCard } from "../../components/ui";
import { pastel, spacing, borderRadius, background, text } from "../../constants/theme";

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
                    <Ionicons name="chevron-back" size={24} color={text.primary} />
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Weekly Summary */}
                {weeklyReview && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            This Week
                        </Text>
                        <View style={styles.statsRow}>
                            <Card style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Ionicons name="checkmark-circle" size={24} color={pastel.mint} />
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {weeklyReview.tasksCompleted}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Tasks Done
                                    </Text>
                                </View>
                            </Card>

                            <Card style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Ionicons name="time" size={24} color={pastel.peach} />
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {formatMinutes(weeklyReview.studyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Study Time
                                    </Text>
                                </View>
                            </Card>

                            <Card style={styles.statCard}>
                                <View style={styles.statContent}>
                                    <Ionicons name="calendar" size={24} color={pastel.mint} />
                                    <Text variant="headlineSmall" style={styles.statNumber}>
                                        {weeklyReview.daysActive}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.statLabel}>
                                        Days Active
                                    </Text>
                                </View>
                            </Card>
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
                            <Card key={rev.subTopicId} style={styles.revisionCard}>
                                <View style={styles.revisionContent}>
                                    <View style={[styles.colorDot, { backgroundColor: rev.subjectColor }]} />
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
                            </Card>
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {!isLoading && insights.length === 0 && revisions.length === 0 && !weeklyReview && (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={48} color="rgba(93, 107, 107, 0.3)" />
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
        backgroundColor: background.primary,
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
        color: text.primary,
        fontWeight: "600",
    },
    subtitle: {
        color: text.secondary,
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
        color: text.primary,
        fontWeight: "600",
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        color: text.secondary,
        marginBottom: spacing.sm,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        padding: spacing.md,
    },
    statContent: {
        alignItems: "center",
    },
    statNumber: {
        color: text.primary,
        fontWeight: "600",
        marginTop: spacing.xs,
    },
    statLabel: {
        color: text.secondary,
        marginTop: 2,
    },
    revisionCard: {
        padding: spacing.md,
        marginBottom: spacing.xs,
    },
    revisionContent: {
        flexDirection: "row",
        alignItems: "flex-start",
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
        color: text.primary,
        fontWeight: "500",
    },
    revisionSubtitle: {
        color: text.secondary,
        marginTop: 2,
    },
    revisionReason: {
        color: pastel.peach,
        marginTop: 4,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xl * 2,
    },
    emptyTitle: {
        color: text.primary,
        marginTop: spacing.md,
    },
    emptyText: {
        color: text.secondary,
        textAlign: "center",
        marginTop: spacing.xs,
    },
});
