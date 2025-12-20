import { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { Card, Text, useTheme, Chip, Button, ProgressBar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { generateWeeklyReview, WeeklyReview } from "../../utils/weeklyReview";
import { formatMinutes } from "../../store/timerStore";

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
    const theme = useTheme();
    const { user } = useAuthStore();
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
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const fetchAnalytics = async () => {
        if (!user) return;

        try {
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

            // Consistency heatmap (28 days)
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

            // Fetch study time by subject
            await fetchStudyTime();

        } catch (error) {
            console.error("Error fetching analytics:", error);
        }
        setIsLoading(false);
    };

    const fetchStudyTime = async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const weekStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');

            // Get all focus sessions with full hierarchy
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

            // Calculate time metrics
            let todayMins = 0;
            let weekMins = 0;
            let allTimeMins = 0;

            // Aggregate by subject -> topic -> sub-topic
            const subjectMap = new Map<string, SubjectTime>();

            sessions.forEach((session: any) => {
                const mins = Math.floor((session.duration_seconds || 0) / 60);
                const sessionDate = session.started_at?.split('T')[0];

                allTimeMins += mins;
                if (sessionDate === today) {
                    todayMins += mins;
                }
                if (sessionDate >= weekStart) {
                    weekMins += mins;
                }

                const subjectId = session.subject_id;
                if (!subjectId) return;

                const subjectName = session.subjects?.name || 'Unknown';
                const color = session.subjects?.color || '#38BDF8';
                const topicId = session.topic_id;
                const topicName = session.topics?.name || 'General';
                const subTopicId = session.sub_topic_id;
                const subTopicName = session.sub_topics?.name || 'General';

                if (!subjectMap.has(subjectId)) {
                    subjectMap.set(subjectId, {
                        subjectId,
                        subjectName,
                        color,
                        totalMinutes: 0,
                        topics: []
                    });
                }

                const subject = subjectMap.get(subjectId)!;
                subject.totalMinutes += mins;

                // Aggregate topics
                let topic = subject.topics.find(t => t.topicId === topicId);
                if (!topic && topicId) {
                    topic = { topicId, topicName, minutes: 0, subTopics: [] };
                    subject.topics.push(topic);
                }
                if (topic) {
                    topic.minutes += mins;

                    // Aggregate sub-topics
                    if (subTopicId) {
                        const existingSubTopic = topic.subTopics.find(st => st.subTopicId === subTopicId);
                        if (existingSubTopic) {
                            existingSubTopic.minutes += mins;
                        } else {
                            topic.subTopics.push({ subTopicId, subTopicName, minutes: mins });
                        }
                    }
                }
            });

            // Sort by time
            const subjectList = Array.from(subjectMap.values())
                .sort((a, b) => b.totalMinutes - a.totalMinutes);

            subjectList.forEach(s => {
                s.topics.sort((a, b) => b.minutes - a.minutes);
                s.topics.forEach(t => {
                    t.subTopics.sort((a, b) => b.minutes - a.minutes);
                });
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

    const maxWeekly = Math.max(...weeklyData, 1);
    const maxConsistency = Math.max(...consistencyData, 1);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>Analytics</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Your study insights</Text>
                </View>

                {/* Stats Overview */}
                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { borderLeftColor: "#22C55E", borderLeftWidth: 3 }]} mode="outlined">
                        <Card.Content style={styles.statContent}>
                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                            <Text variant="headlineSmall" style={styles.statValue}>{totalCompleted}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Completed</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.statCard, { borderLeftColor: "#F97316", borderLeftWidth: 3 }]} mode="outlined">
                        <Card.Content style={styles.statContent}>
                            <Ionicons name="flame" size={20} color="#F97316" />
                            <Text variant="headlineSmall" style={styles.statValue}>{streak}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Day Streak</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.statCard, { borderLeftColor: "#A855F7", borderLeftWidth: 3 }]} mode="outlined">
                        <Card.Content style={styles.statContent}>
                            <Ionicons name="time" size={20} color="#A855F7" />
                            <Text variant="headlineSmall" style={styles.statValue}>{pendingCount}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Weekly Review Card */}
                {weeklyReview && (
                    <Card style={styles.reviewCard} mode="outlined">
                        <Card.Content>
                            <View style={styles.reviewHeader}>
                                <View style={styles.reviewTitleRow}>
                                    <Ionicons name="calendar" size={20} color="#38BDF8" />
                                    <Text variant="titleMedium" style={styles.chartTitle}>This Week</Text>
                                </View>
                                {weeklyReview.improvement !== 0 && (
                                    <Chip
                                        compact
                                        style={{ backgroundColor: weeklyReview.improvement > 0 ? "#22C55E20" : "#EF444420" }}
                                        textStyle={{ color: weeklyReview.improvement > 0 ? "#22C55E" : "#EF4444", fontSize: 11 }}
                                    >
                                        {weeklyReview.improvement > 0 ? "+" : ""}{weeklyReview.improvement}% vs last week
                                    </Chip>
                                )}
                            </View>

                            <View style={styles.reviewStats}>
                                <View style={styles.reviewStatItem}>
                                    <Text variant="headlineMedium" style={styles.reviewStatValue}>{weeklyReview.completionRate}%</Text>
                                    <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>Completion</Text>
                                </View>
                                <View style={styles.reviewStatDivider} />
                                <View style={styles.reviewStatItem}>
                                    <Text variant="headlineMedium" style={styles.reviewStatValue}>{weeklyReview.tasksCompleted}</Text>
                                    <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>Done</Text>
                                </View>
                                <View style={styles.reviewStatDivider} />
                                <View style={styles.reviewStatItem}>
                                    <Text variant="headlineMedium" style={[styles.reviewStatValue, weeklyReview.tasksMissed > 0 && { color: "#EF4444" }]}>
                                        {weeklyReview.tasksMissed}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>Missed</Text>
                                </View>
                            </View>

                            {weeklyReview.bestDay && (
                                <View style={styles.insightRow}>
                                    <Ionicons name="trophy" size={16} color="#FACC15" />
                                    <Text variant="bodySmall" style={styles.insightText}>Best day: {weeklyReview.bestDay}</Text>
                                </View>
                            )}
                            {weeklyReview.weakSubject && (
                                <View style={styles.insightRow}>
                                    <Ionicons name="alert-circle" size={16} color="#F97316" />
                                    <Text variant="bodySmall" style={styles.insightText}>Needs attention: {weeklyReview.weakSubject.name}</Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* Study Time Summary */}
                <Card style={styles.chartCard} mode="outlined">
                    <Card.Content>
                        <View style={styles.reviewTitleRow}>
                            <Ionicons name="time-outline" size={20} color="#A855F7" />
                            <Text variant="titleMedium" style={styles.chartTitle}>Study Time</Text>
                        </View>
                        <View style={styles.studyTimeStats}>
                            <View style={styles.studyTimeStat}>
                                <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: "#38BDF8" }]}>
                                    {formatMinutes(todayStudyMinutes)}
                                </Text>
                                <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>Today</Text>
                            </View>
                            <View style={styles.reviewStatDivider} />
                            <View style={styles.studyTimeStat}>
                                <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: "#22C55E" }]}>
                                    {formatMinutes(weekStudyMinutes)}
                                </Text>
                                <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>This Week</Text>
                            </View>
                            <View style={styles.reviewStatDivider} />
                            <View style={styles.studyTimeStat}>
                                <Text variant="headlineMedium" style={[styles.reviewStatValue, { color: "#A855F7" }]}>
                                    {formatMinutes(allTimeStudyMinutes)}
                                </Text>
                                <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>All Time</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Study Time by Subject */}
                {subjectTimes.length > 0 && (
                    <Card style={styles.chartCard} mode="outlined">
                        <Card.Content>
                            <View style={styles.studyTimeHeader}>
                                <View style={styles.reviewTitleRow}>
                                    <Ionicons name="book-outline" size={20} color="#A855F7" />
                                    <Text variant="titleMedium" style={styles.chartTitle}>By Subject</Text>
                                </View>
                                <Chip compact style={{ backgroundColor: "#A855F720" }} textStyle={{ color: "#A855F7", fontSize: 11 }}>
                                    {formatMinutes(allTimeStudyMinutes)} total
                                </Chip>
                            </View>

                            {subjectTimes.map((subject) => {
                                const isExpanded = expandedSubject === subject.subjectId;
                                const percentage = allTimeStudyMinutes > 0 ? (subject.totalMinutes / allTimeStudyMinutes) : 0;

                                return (
                                    <View key={subject.subjectId} style={styles.subjectTimeCard}>
                                        <TouchableOpacity
                                            onPress={() => setExpandedSubject(isExpanded ? null : subject.subjectId)}
                                            style={styles.subjectTimeRow}
                                        >
                                            <View style={[styles.subjectDot, { backgroundColor: subject.color }]} />
                                            <View style={styles.subjectTimeInfo}>
                                                <View style={styles.subjectTimeHeader}>
                                                    <Text variant="bodyLarge" style={styles.subjectTimeName}>{subject.subjectName}</Text>
                                                    <Text variant="bodyMedium" style={styles.subjectTimeValue}>{formatMinutes(subject.totalMinutes)}</Text>
                                                </View>
                                                <ProgressBar progress={percentage} color={subject.color} style={styles.subjectTimeBar} />
                                            </View>
                                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                                        </TouchableOpacity>

                                        {isExpanded && subject.topics.length > 0 && (
                                            <View style={styles.topicsList}>
                                                {subject.topics.sort((a, b) => b.minutes - a.minutes).map((topic) => (
                                                    <View key={topic.topicId} style={styles.topicRow}>
                                                        <Text variant="bodySmall" style={styles.topicName}>• {topic.topicName}</Text>
                                                        <Text variant="bodySmall" style={styles.topicTime}>{formatMinutes(topic.minutes)}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </Card.Content>
                    </Card>
                )}

                {/* Weekly Chart */}
                <Card style={styles.chartCard} mode="outlined">
                    <Card.Content>
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
                    </Card.Content>
                </Card>

                {/* Heatmap */}
                <Card style={styles.chartCard} mode="outlined">
                    <Card.Content>
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
                                                    intensity > 0.7 ? "#22C55E" :
                                                        intensity > 0.4 ? "#38BDF8" :
                                                            intensity > 0 ? "#38BDF850" :
                                                                "#334155",
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </View>
                        <View style={styles.heatmapLegend}>
                            <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>Less</Text>
                            <View style={[styles.legendDot, { backgroundColor: "#334155" }]} />
                            <View style={[styles.legendDot, { backgroundColor: "#38BDF850" }]} />
                            <View style={[styles.legendDot, { backgroundColor: "#38BDF8" }]} />
                            <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
                            <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>More</Text>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: "#1E293B" },
    statContent: { alignItems: "center", paddingVertical: 8 },
    statValue: { color: "#E5E7EB", fontWeight: "bold", marginTop: 4 },
    reviewCard: { marginHorizontal: 24, marginBottom: 16, backgroundColor: "#1E293B", borderColor: "#38BDF8" },
    reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    reviewTitleRow: { flexDirection: "row", alignItems: "center" },
    reviewStats: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    reviewStatItem: { flex: 1, alignItems: "center" },
    reviewStatValue: { color: "#E5E7EB", fontWeight: "bold" },
    reviewStatDivider: { width: 1, height: 32, backgroundColor: "#334155" },
    insightRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    insightText: { color: "#9CA3AF", marginLeft: 8 },
    chartCard: { marginHorizontal: 24, marginBottom: 16, backgroundColor: "#1E293B" },
    chartTitle: { color: "#E5E7EB", fontWeight: "600", marginBottom: 16, marginLeft: 8 },
    chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 },
    barContainer: { flex: 1, alignItems: "center" },
    barBg: { width: 24, height: 80, backgroundColor: "#334155", borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
    barFill: { width: "100%", backgroundColor: "#38BDF8", borderRadius: 6 },
    barLabel: { color: "#9CA3AF", marginTop: 6, fontSize: 10 },
    barValue: { color: "#64748B", fontSize: 9 },
    heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    heatmapCell: { width: 28, height: 28, borderRadius: 4 },
    heatmapLegend: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 6 },
    legendDot: { width: 16, height: 16, borderRadius: 2 },
    // Study Time styles
    studyTimeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    subjectTimeCard: { marginBottom: 12 },
    subjectTimeRow: { flexDirection: "row", alignItems: "center" },
    subjectDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    subjectTimeInfo: { flex: 1 },
    subjectTimeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    subjectTimeName: { color: "#E5E7EB" },
    subjectTimeValue: { color: "#9CA3AF" },
    subjectTimeBar: { height: 4, borderRadius: 2, marginTop: 6 },
    topicsList: { marginLeft: 22, marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#334155" },
    topicRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    topicName: { color: "#9CA3AF" },
    topicTime: { color: "#64748B" },
    studyTimeStats: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 16 },
    studyTimeStat: { alignItems: "center" },
});
