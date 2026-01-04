import { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, LayoutAnimation, UIManager, Platform } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { format, subDays } from "date-fns";
import { generateWeeklyReview, WeeklyReview } from "../../utils/weeklyReview";
import { formatMinutes } from "../../store/timerStore";

// New Learning Intelligence Helpers
import { getAllInsights } from "../../utils/studyInsights";
import { getRevisionSuggestions } from "../../utils/revisionEngine";
import { StudyInsight, RevisionSuggestion } from "../../types";
import { LinearGradient } from "expo-linear-gradient";

// Design tokens
import { pastel, background, text, semantic, spacing, borderRadius, shadows, gradients } from "../../constants/theme";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
// UI Components
import { Chip, ProgressBar, InsightCard } from "../../components/ui";
import { GlassCard, MeshGradientBackground } from "../../components/glass";
import { CapacityInsightsCard } from "../../components/analytics/CapacityInsightsCard";
import { getCapacityInsights, CapacityInsights } from "../../utils/capacityInsights";

interface TopicTime {
    topicId: string;
    topicName: string;
    minutes: number;
    subTopics: { subTopicId: string; subTopicName: string; minutes: number }[];
}

interface SubjectTime {
    subjectId: string;
    subjectName: string;
    color: string;
    totalMinutes: number;
    topics: TopicTime[];
}

export default function AnalyticsScreen() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"progress" | "insights">("progress");
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Real-time stats
    const [totalCompleted, setTotalCompleted] = useState(0);

    const [pendingCount, setPendingCount] = useState(0);
    const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [consistencyData, setConsistencyData] = useState<number[]>([]);

    // Weekly review
    const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null);

    // Study time metrics
    const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);
    const [weekStudyMinutes, setWeekStudyMinutes] = useState(0);
    const [allTimeStudyMinutes, setAllTimeStudyMinutes] = useState(0);
    const [subjectTimes, setSubjectTimes] = useState<SubjectTime[]>([]);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    // NEW: Insights & Revisions
    const [insights, setInsights] = useState<StudyInsight[]>([]);
    const [revisions, setRevisions] = useState<RevisionSuggestion[]>([]);

    // Capacity insights
    const [capacityInsights, setCapacityInsights] = useState<CapacityInsights | null>(null);

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const fetchAnalytics = async () => {
        if (!user) return;

        try {
            // ... (Existing Analytics Logic) ...
            // Completed tasks
            const { count: completed } = await supabase
                .from("tasks")
                .select("*", { count: "exact", head: true })
                .eq("is_completed", true);
            setTotalCompleted(completed || 0);

            // Pending tasks
            const { count: pending } = await supabase
                .from("tasks")
                .select("*", { count: "exact", head: true })
                .eq("is_completed", false);
            setPendingCount(pending || 0);

            // Weekly data
            const weekData: number[] = [];
            for (let i = 6; i >= 0; i--) {
                const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
                const { count } = await supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("is_completed", true)
                    .gte("completed_at", `${dateStr}T00:00:00`)
                    .lt("completed_at", `${dateStr}T23:59:59`);
                weekData.push(count || 0);
            }
            setWeeklyData(weekData);



            // Consistency heatmap
            const consistency: number[] = [];
            for (let i = 27; i >= 0; i--) {
                const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
                const { count } = await supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("is_completed", true)
                    .gte("completed_at", `${dateStr}T00:00:00`)
                    .lt("completed_at", `${dateStr}T23:59:59`);
                consistency.push(count || 0);
            }
            setConsistencyData(consistency);

            // Weekly review
            const review = await generateWeeklyReview();
            setWeeklyReview(review);

            // Fetch study time
            await fetchStudyTime();

            // NEW: Fetch Insights & Revisions
            const [insightsData, revisionsData, capacityData] = await Promise.all([
                getAllInsights(user.id),
                getRevisionSuggestions(user.id, 5),
                getCapacityInsights(user.id),
            ]);
            setInsights(insightsData);
            setRevisions(revisionsData);
            setCapacityInsights(capacityData);

        } catch (error) {
            console.error("Error fetching analytics:", error);
        }
        setIsLoading(false);
    };

    const fetchStudyTime = async () => {
        // ... (Existing Logic) ...
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const weekStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');

            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select(`
                    duration_seconds,
                    started_at,
                    subject_id,
                    topic_id,
                    sub_topic_id,
                    subjects (id, name, color),
                    topics (id, name),
                    sub_topics (id, name)
                `)
                .not('duration_seconds', 'is', null);

            if (!sessions || sessions.length === 0) {
                setSubjectTimes([]);
                setTodayStudyMinutes(0);
                setWeekStudyMinutes(0);
                setAllTimeStudyMinutes(0);
                return;
            }

            let todayMins = 0;
            let weekMins = 0;
            let allTimeMins = 0;

            const subjectMap = new Map<string, SubjectTime>();

            sessions.forEach((session: any) => {
                const mins = Math.floor((session.duration_seconds || 0) / 60);
                const sessionDate = session.started_at?.split('T')[0];

                allTimeMins += mins;
                if (sessionDate === today) todayMins += mins;
                if (sessionDate >= weekStart) weekMins += mins;

                const subjectId = session.subject_id;
                if (!subjectId) return;

                const subjectName = session.subjects?.name || 'Unknown';
                const color = session.subjects?.color || glassAccent.mint;
                const topicId = session.topic_id;
                const topicName = session.topics?.name || 'General';
                const subTopicId = session.sub_topic_id;
                const subTopicName = session.sub_topics?.name || 'General';

                if (!subjectMap.has(subjectId)) {
                    subjectMap.set(subjectId, { subjectId, subjectName, color, totalMinutes: 0, topics: [] });
                }

                const subject = subjectMap.get(subjectId)!;
                subject.totalMinutes += mins;

                let topic = subject.topics.find(t => t.topicId === topicId);
                if (!topic && topicId) {
                    topic = { topicId, topicName, minutes: 0, subTopics: [] };
                    subject.topics.push(topic);
                }
                if (topic) {
                    topic.minutes += mins;
                    if (subTopicId) {
                        const existingSubTopic = topic.subTopics.find(st => st.subTopicId === subTopicId);
                        if (existingSubTopic) existingSubTopic.minutes += mins;
                        else topic.subTopics.push({ subTopicId, subTopicName, minutes: mins });
                    }
                }
            });

            const subjectList = Array.from(subjectMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
            subjectList.forEach(s => {
                s.topics.sort((a, b) => b.minutes - a.minutes);
                s.topics.forEach(t => t.subTopics.sort((a, b) => b.minutes - a.minutes));
            });

            setSubjectTimes(subjectList);
            setTodayStudyMinutes(todayMins);
            setWeekStudyMinutes(weekMins);
            setAllTimeStudyMinutes(allTimeMins);

        } catch (error) {
            console.error('Error fetching study time:', error);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
    };

    const toggleTab = (tab: "progress" | "insights") => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const dismissInsight = (index: number) => {
        setInsights(prev => prev.filter((_, i) => i !== index));
    };

    const maxWeekly = Math.max(...weeklyData, 1);
    const maxConsistency = Math.max(...consistencyData, 1);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <MeshGradientBackground />
                <ActivityIndicator size="large" color={glassAccent.mint} />
                <Text variant="bodyMedium" style={{ color: glassText.secondary, marginTop: 16 }}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MeshGradientBackground />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text variant="headlineLarge" style={[styles.title, { color: glassText.primary }]}>Analytics</Text>
                    {activeTab === "insights" && (
                        <Text variant="bodyMedium" style={{ color: glassText.secondary }}>Learning Intelligence</Text>
                    )}
                </View>

                {/* Sliding Tabs Segmented Control */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "progress" && styles.activeTab]}
                        onPress={() => toggleTab("progress")}
                    >
                        <Text style={[styles.tabText, activeTab === "progress" && styles.activeTabText]}>Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "insights" && styles.activeTab]}
                        onPress={() => toggleTab("insights")}
                    >
                        {insights.length > 0 && <View style={[styles.badge, { backgroundColor: glassAccent.warm }]} />}
                        <Text style={[styles.tabText, activeTab === "insights" && styles.activeTabText]}>Insights</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassAccent.mint} />}
            >
                {activeTab === "progress" && (
                    <>
                        {/* Stats Overview */}
                        <View style={styles.statsRow}>
                            <GlassCard style={styles.statCard} bordered={false} intensity="light">
                                <View style={[styles.statContent, { borderLeftColor: glassAccent.mint, borderLeftWidth: 3, paddingLeft: 12 }]}>
                                    <Ionicons name="checkmark-circle" size={20} color={glassAccent.mint} />
                                    <Text variant="headlineSmall" style={styles.statValue}>{totalCompleted}</Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>Completed</Text>
                                </View>
                            </GlassCard>

                            <GlassCard style={styles.statCard} bordered={false} intensity="light">
                                <View style={[styles.statContent, { borderLeftColor: glassAccent.blue, borderLeftWidth: 3, paddingLeft: 12 }]}>
                                    <Ionicons name="time" size={20} color={glassAccent.blue} />
                                    <Text variant="headlineSmall" style={styles.statValue}>{pendingCount}</Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>Pending</Text>
                                </View>
                            </GlassCard>
                        </View>

                        {/* Weekly Review Card */}
                        {weeklyReview && (
                            <GlassCard style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewTitleRow}>
                                        <Ionicons name="calendar" size={20} color={glassAccent.mint} />
                                        <Text variant="titleMedium" style={styles.chartTitle}>This Week</Text>
                                    </View>
                                    {weeklyReview.improvement !== 0 && (
                                        <Chip size="sm" style={{ backgroundColor: weeklyReview.improvement > 0 ? glassAccent.mint + '20' : glassAccent.warm + '20' }}>
                                            <Text style={{ color: weeklyReview.improvement > 0 ? glassAccent.mint : glassAccent.warm, fontSize: 12 }}>
                                                {weeklyReview.improvement > 0 ? "+" : ""}{weeklyReview.improvement}% vs last week
                                            </Text>
                                        </Chip>
                                    )}
                                </View>

                                <View style={styles.reviewStats}>
                                    <View style={styles.reviewStatItem}>
                                        <Text variant="headlineMedium" style={styles.reviewStatValue}>{weeklyReview.completionRate}%</Text>
                                        <Text variant="bodySmall" style={{ color: glassText.secondary }}>Completion</Text>
                                    </View>
                                    <View style={styles.reviewStatDivider} />
                                    <View style={styles.reviewStatItem}>
                                        <Text variant="headlineMedium" style={styles.reviewStatValue}>{weeklyReview.tasksCompleted}</Text>
                                        <Text variant="bodySmall" style={{ color: glassText.secondary }}>Done</Text>
                                    </View>
                                    <View style={styles.reviewStatDivider} />
                                    <View style={styles.reviewStatItem}>
                                        <Text variant="headlineMedium" style={[styles.reviewStatValue, weeklyReview.tasksMissed > 0 && { color: glassAccent.warm }]}>
                                            {weeklyReview.tasksMissed}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: glassText.secondary }}>Missed</Text>
                                    </View>
                                </View>

                                {weeklyReview.bestDay && (
                                    <View style={styles.insightRow}>
                                        <Ionicons name="trophy" size={16} color={glassAccent.mint} />
                                        <Text variant="bodySmall" style={styles.insightText}>Best day: {weeklyReview.bestDay}</Text>
                                    </View>
                                )}
                                {weeklyReview.weakSubject && (
                                    <View style={styles.insightRow}>
                                        <Ionicons name="alert-circle" size={16} color={glassAccent.warm} />
                                        <Text variant="bodySmall" style={styles.insightText}>Needs attention: {weeklyReview.weakSubject.name}</Text>
                                    </View>
                                )}
                            </GlassCard>
                        )}

                        {/* Study Time Summary */}
                        <GlassCard style={styles.chartCard} intensity="medium">
                            <View style={styles.reviewTitleRow}>
                                <Ionicons name="time-outline" size={20} color={glassAccent.mint} />
                                <Text variant="titleMedium" style={styles.chartTitle}>Study Time</Text>
                            </View>
                            <View style={styles.studyTimeStats}>
                                <View style={styles.studyTimeStat}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: glassAccent.mint }]}>
                                        {formatMinutes(todayStudyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>Today</Text>
                                </View>
                                <View style={styles.reviewStatDivider} />
                                <View style={styles.studyTimeStat}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: glassAccent.blue }]}>
                                        {formatMinutes(weekStudyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>This Week</Text>
                                </View>
                                <View style={styles.reviewStatDivider} />
                                <View style={styles.studyTimeStat}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: glassAccent.warm }]}>
                                        {formatMinutes(allTimeStudyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>All Time</Text>
                                </View>
                            </View>
                        </GlassCard>

                        {/* Capacity Insights */}
                        {capacityInsights && (
                            <CapacityInsightsCard insights={capacityInsights} />
                        )}

                        {/* Weekly Chart */}
                        <GlassCard style={styles.chartCard}>
                            <Text variant="titleMedium" style={styles.chartTitle}>Daily Progress</Text>
                            <View style={styles.chartContainer}>
                                {weeklyData.map((value, index) => (
                                    <View key={index} style={styles.barContainer}>
                                        <View style={styles.barBg}>
                                            <View style={[styles.barFill, { height: `${Math.max((value / maxWeekly) * 100, 5)}%`, backgroundColor: glassAccent.mint }]} />
                                        </View>
                                        <Text variant="bodySmall" style={styles.barLabel}>{weekDays[index]}</Text>
                                        <Text variant="labelSmall" style={styles.barValue}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </GlassCard>

                        {/* Heatmap */}
                        <GlassCard style={styles.chartCard}>
                            <Text variant="titleMedium" style={styles.chartTitle}>Consistency (28 days)</Text>
                            <View style={styles.heatmapGrid}>
                                {consistencyData.map((value, index) => {
                                    const intensity = value / maxConsistency;
                                    return (
                                        <View
                                            key={index}
                                            style={[
                                                styles.heatmapCell,
                                                {
                                                    backgroundColor:
                                                        intensity > 0.7 ? glassAccent.mint :
                                                            intensity > 0.4 ? glassAccent.blue :
                                                                intensity > 0 ? `${glassAccent.mint}50` :
                                                                    glass.background.light,
                                                },
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        </GlassCard>
                    </>
                )}

                {activeTab === "insights" && (
                    <>
                        {/* Helper Message */}
                        {insights.length === 0 && revisions.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="analytics" size={48} color={glassText.muted} />
                                <Text variant="bodyLarge" style={styles.emptyTitle}>Gathering Intelligence...</Text>
                                <Text variant="bodyMedium" style={styles.emptyText}>
                                    Complete more study sessions to see your personalized learning patterns.
                                </Text>
                            </View>
                        )}

                        {/* Revision Suggestions */}
                        {revisions.length > 0 && (
                            <View style={styles.section}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Smart Revision
                                </Text>
                                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                                    Topics that need your attention now
                                </Text>
                                {revisions.map((rev) => (
                                    <GlassCard key={rev.subTopicId} style={styles.revisionCard} intensity="light">
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
                                    </GlassCard>
                                ))}
                            </View>
                        )}

                        {/* Study Patterns */}
                        {insights.length > 0 && (
                            <View style={styles.section}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Detected Patterns
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
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerTop: { marginBottom: 16 },
    title: { fontWeight: "bold" },

    // Tabs
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(93, 107, 107, 0.08)",
        borderRadius: borderRadius.lg,
        padding: 4
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: borderRadius.md,
        flexDirection: "row"
    },
    activeTab: {
        backgroundColor: darkBackground.elevated,
        shadowColor: '#4DA3FF',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
    },
    tabText: {
        fontWeight: "600",
        color: glassText.secondary
    },
    activeTabText: {
        color: glassText.primary
    },
    badge: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: glassAccent.warm,
        marginRight: 6
    },

    // Stats
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, padding: 0 },
    statContent: { alignItems: "center", paddingVertical: 12 },
    statValue: { color: glassText.primary, fontWeight: "bold", marginTop: 4 },

    // Reviews
    reviewCard: { marginHorizontal: 24, marginBottom: 16, padding: 16 },
    reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    reviewTitleRow: { flexDirection: "row", alignItems: "center" },
    reviewStats: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    reviewStatItem: { flex: 1, alignItems: "center" },
    reviewStatValue: { color: glassText.primary, fontWeight: "bold" },
    reviewStatDivider: { width: 1, height: 32, backgroundColor: glass.border.light },
    insightRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    insightText: { color: glassText.secondary, marginLeft: 8 },

    // Charts
    chartCard: { marginHorizontal: 24, marginBottom: 16, padding: 16 },
    chartTitle: { color: glassText.primary, fontWeight: "600", marginBottom: 16, marginLeft: 8 },
    chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 },
    barContainer: { flex: 1, alignItems: "center" },
    barBg: { width: 24, height: 80, backgroundColor: glass.background.light, borderRadius: 8, justifyContent: "flex-end", overflow: "hidden" },
    barFill: { width: "100%", backgroundColor: glassAccent.mint, borderRadius: 8 },
    barLabel: { color: glassText.secondary, marginTop: 6, fontSize: 10 },
    barValue: { color: glassText.muted, fontSize: 9 },
    heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    heatmapCell: { width: 28, height: 28, borderRadius: 6 },
    heatmapLegend: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 6 },
    legendDot: { width: 16, height: 16, borderRadius: 4 },
    studyTimeStats: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 16 },
    studyTimeStat: { alignItems: "center" },

    // Subject Study Time Styles
    studyTimeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    subjectTimeCard: { marginBottom: 12 },
    subjectTimeRow: { flexDirection: "row", alignItems: "center" },
    subjectDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    subjectTimeInfo: { flex: 1 },
    subjectTimeHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    subjectTimeName: { color: glassText.primary },
    subjectTimeValue: { color: glassText.secondary },
    topicsList: { marginLeft: 22, marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: glass.border.light },
    topicRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    topicName: { color: glassText.secondary },
    topicTime: { color: glassText.muted },

    // Helper & Insights specific
    section: { paddingHorizontal: 24, marginBottom: 20 },
    sectionTitle: { color: glassText.primary, fontWeight: "600", marginBottom: 4 },
    sectionSubtitle: { color: glassText.secondary, marginBottom: 12 },
    revisionCard: { padding: spacing.md, marginBottom: spacing.xs },
    revisionContent: { flexDirection: "row", alignItems: "flex-start" },
    colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: spacing.sm },
    revisionText: { flex: 1 },
    revisionTitle: { color: glassText.primary, fontWeight: "500" },
    revisionSubtitle: { color: glassText.secondary, marginTop: 2 },
    revisionReason: { color: glassAccent.warm, marginTop: 4 },
    emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
    emptyTitle: { color: glassText.primary, marginTop: spacing.md, fontWeight: "600" },
    emptyText: { color: glassText.secondary, textAlign: "center", marginTop: spacing.xs },

    // Locked State
    lockedCard: {
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.lg,
        marginHorizontal: 24,
    },
    lockedIcon: {
        width: 64,
        height: 64,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    lockedTitle: {
        fontWeight: 'bold',
        marginBottom: spacing.xs,
        color: glassText.primary,
    },
    lockedDesc: {
        textAlign: 'center',
        color: glassText.secondary,
        marginBottom: spacing.md,
    },
});
