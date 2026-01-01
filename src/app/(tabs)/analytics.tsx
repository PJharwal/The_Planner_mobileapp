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
// UI Components
import { Card, Chip, ProgressBar, InsightCard, Button } from "../../components/ui";
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
    const [streak, setStreak] = useState(0);
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

            // Streak
            let currentStreak = 0;
            for (let i = 0; i < 30; i++) {
                const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
                const { count } = await supabase
                    .from("tasks")
                    .select("*", { count: "exact", head: true })
                    .eq("is_completed", true)
                    .gte("completed_at", `${dateStr}T00:00:00`)
                    .lt("completed_at", `${dateStr}T23:59:59`);
                if (count && count > 0) currentStreak++;
                else if (i > 0) break;
            }
            setStreak(currentStreak);

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
                const color = session.subjects?.color || pastel.mint;
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
                <ActivityIndicator size="large" color={pastel.mint} />
                <Text variant="bodyMedium" style={{ color: text.secondary, marginTop: 16 }}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text variant="headlineLarge" style={styles.title}>Analytics</Text>
                    {activeTab === "insights" && (
                        <Text variant="bodyMedium" style={{ color: text.secondary }}>Learning Intelligence</Text>
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
                        {insights.length > 0 && <View style={styles.badge} />}
                        <Text style={[styles.tabText, activeTab === "insights" && styles.activeTabText]}>Insights</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={pastel.mint} />}
            >
                {activeTab === "progress" ? (
                    <>
                        {/* Stats Overview */}
                        <View style={styles.statsRow}>
                            <Card style={[styles.statCard, { borderLeftColor: semantic.success, borderLeftWidth: 3 }]}>
                                <View style={styles.statContent}>
                                    <Ionicons name="checkmark-circle" size={20} color={semantic.success} />
                                    <Text variant="headlineSmall" style={styles.statValue}>{totalCompleted}</Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>Completed</Text>
                                </View>
                            </Card>
                            <Card style={[styles.statCard, { borderLeftColor: pastel.peach, borderLeftWidth: 3 }]}>
                                <View style={styles.statContent}>
                                    <Ionicons name="flame" size={20} color="#D89080" />
                                    <Text variant="headlineSmall" style={styles.statValue}>{streak}</Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>Day Streak</Text>
                                </View>
                            </Card>
                            <Card style={[styles.statCard, { borderLeftColor: pastel.mistBlue, borderLeftWidth: 3 }]}>
                                <View style={styles.statContent}>
                                    <Ionicons name="time" size={20} color="#6AABAC" />
                                    <Text variant="headlineSmall" style={styles.statValue}>{pendingCount}</Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>Pending</Text>
                                </View>
                            </Card>
                        </View>

                        {/* Weekly Review Card */}
                        {weeklyReview && (
                            <Card style={[styles.reviewCard, { borderColor: pastel.mint }]}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewTitleRow}>
                                        <Ionicons name="calendar" size={20} color={pastel.mint} />
                                        <Text variant="titleMedium" style={styles.chartTitle}>This Week</Text>
                                    </View>
                                    {weeklyReview.improvement !== 0 && (
                                        <Chip size="sm" variant={weeklyReview.improvement > 0 ? "success" : "error"}>
                                            {weeklyReview.improvement > 0 ? "+" : ""}{weeklyReview.improvement}% vs last week
                                        </Chip>
                                    )}
                                </View>

                                <View style={styles.reviewStats}>
                                    <View style={styles.reviewStatItem}>
                                        <Text variant="headlineMedium" style={styles.reviewStatValue}>{weeklyReview.completionRate}%</Text>
                                        <Text variant="bodySmall" style={{ color: text.secondary }}>Completion</Text>
                                    </View>
                                    <View style={styles.reviewStatDivider} />
                                    <View style={styles.reviewStatItem}>
                                        <Text variant="headlineMedium" style={styles.reviewStatValue}>{weeklyReview.tasksCompleted}</Text>
                                        <Text variant="bodySmall" style={{ color: text.secondary }}>Done</Text>
                                    </View>
                                    <View style={styles.reviewStatDivider} />
                                    <View style={styles.reviewStatItem}>
                                        <Text variant="headlineMedium" style={[styles.reviewStatValue, weeklyReview.tasksMissed > 0 && { color: semantic.error }]}>
                                            {weeklyReview.tasksMissed}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: text.secondary }}>Missed</Text>
                                    </View>
                                </View>

                                {weeklyReview.bestDay && (
                                    <View style={styles.insightRow}>
                                        <Ionicons name="trophy" size={16} color={semantic.warning} />
                                        <Text variant="bodySmall" style={styles.insightText}>Best day: {weeklyReview.bestDay}</Text>
                                    </View>
                                )}
                                {weeklyReview.weakSubject && (
                                    <View style={styles.insightRow}>
                                        <Ionicons name="alert-circle" size={16} color={semantic.warning} />
                                        <Text variant="bodySmall" style={styles.insightText}>Needs attention: {weeklyReview.weakSubject.name}</Text>
                                    </View>
                                )}
                            </Card>
                        )}

                        {/* Study Time Summary */}
                        <Card style={styles.chartCard}>
                            <View style={styles.reviewTitleRow}>
                                <Ionicons name="time-outline" size={20} color={pastel.mint} />
                                <Text variant="titleMedium" style={styles.chartTitle}>Study Time</Text>
                            </View>
                            <View style={styles.studyTimeStats}>
                                <View style={styles.studyTimeStat}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: pastel.mint }]}>
                                        {formatMinutes(todayStudyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>Today</Text>
                                </View>
                                <View style={styles.reviewStatDivider} />
                                <View style={styles.studyTimeStat}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: semantic.success }]}>
                                        {formatMinutes(weekStudyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>This Week</Text>
                                </View>
                                <View style={styles.reviewStatDivider} />
                                <View style={styles.studyTimeStat}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: pastel.peach }]}>
                                        {formatMinutes(allTimeStudyMinutes)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>All Time</Text>
                                </View>
                            </View>
                        </Card>

                        {/* Capacity Insights */}
                        {capacityInsights && (
                            <CapacityInsightsCard insights={capacityInsights} />
                        )}

                        {/* Weekly Chart */}
                        <Card style={styles.chartCard}>
                            <Text variant="titleMedium" style={styles.chartTitle}>Daily Progress</Text>
                            <View style={styles.chartContainer}>
                                {weeklyData.map((value, index) => (
                                    <View key={index} style={styles.barContainer}>
                                        <View style={styles.barBg}>
                                            <View style={[styles.barFill, { height: `${Math.max((value / maxWeekly) * 100, 5)}%` }]} />
                                        </View>
                                        <Text variant="bodySmall" style={styles.barLabel}>{weekDays[index]}</Text>
                                        <Text variant="labelSmall" style={styles.barValue}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>

                        {/* Heatmap */}
                        <Card style={styles.chartCard}>
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
                                                        intensity > 0.7 ? semantic.success :
                                                            intensity > 0.4 ? pastel.mint :
                                                                intensity > 0 ? pastel.mint + '50' :
                                                                    pastel.beige,
                                                },
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        </Card>
                    </>
                ) : (
                    <>
                        {/* Helper Message */}
                        {insights.length === 0 && revisions.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="analytics" size={48} color={pastel.slate + "40"} />
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
    container: { flex: 1, backgroundColor: background.primary },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerTop: { marginBottom: 16 },
    title: { color: text.primary, fontWeight: "bold" },

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
        backgroundColor: background.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    tabText: {
        fontWeight: "600",
        color: text.secondary
    },
    activeTabText: {
        color: text.primary
    },
    badge: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: semantic.error,
        marginRight: 6
    },

    // Stats
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, padding: 12 },
    statContent: { alignItems: "center", paddingVertical: 8 },
    statValue: { color: text.primary, fontWeight: "bold", marginTop: 4 },

    // Reviews
    reviewCard: { marginHorizontal: 24, marginBottom: 16, borderWidth: 1, padding: 16 },
    reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    reviewTitleRow: { flexDirection: "row", alignItems: "center" },
    reviewStats: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    reviewStatItem: { flex: 1, alignItems: "center" },
    reviewStatValue: { color: text.primary, fontWeight: "bold" },
    reviewStatDivider: { width: 1, height: 32, backgroundColor: pastel.beige },
    insightRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    insightText: { color: text.secondary, marginLeft: 8 },

    // Charts
    chartCard: { marginHorizontal: 24, marginBottom: 16, padding: 16 },
    chartTitle: { color: text.primary, fontWeight: "600", marginBottom: 16, marginLeft: 8 },
    chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 },
    barContainer: { flex: 1, alignItems: "center" },
    barBg: { width: 24, height: 80, backgroundColor: pastel.beige, borderRadius: 8, justifyContent: "flex-end", overflow: "hidden" },
    barFill: { width: "100%", backgroundColor: pastel.mint, borderRadius: 8 },
    barLabel: { color: text.secondary, marginTop: 6, fontSize: 10 },
    barValue: { color: text.muted, fontSize: 9 },
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
    subjectTimeName: { color: text.primary },
    subjectTimeValue: { color: text.secondary },
    topicsList: { marginLeft: 22, marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: pastel.beige },
    topicRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    topicName: { color: text.secondary },
    topicTime: { color: text.muted },

    // Helper & Insights specific
    section: { paddingHorizontal: 24, marginBottom: 20 },
    sectionTitle: { color: text.primary, fontWeight: "600", marginBottom: 4 },
    sectionSubtitle: { color: text.secondary, marginBottom: 12 },
    revisionCard: { padding: spacing.md, marginBottom: spacing.xs },
    revisionContent: { flexDirection: "row", alignItems: "flex-start" },
    colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: spacing.sm },
    revisionText: { flex: 1 },
    revisionTitle: { color: text.primary, fontWeight: "500" },
    revisionSubtitle: { color: text.secondary, marginTop: 2 },
    revisionReason: { color: pastel.peach, marginTop: 4 },
    emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
    emptyTitle: { color: text.primary, marginTop: spacing.md, fontWeight: "600" },
    emptyText: { color: text.secondary, textAlign: "center", marginTop: spacing.xs },

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
        color: text.primary,
    },
    lockedDesc: {
        textAlign: 'center',
        color: text.secondary,
        marginBottom: spacing.md,
    },
});
