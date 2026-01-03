import { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, LayoutAnimation, UIManager } from "react-native";
import { Text, TextInput, Portal, Modal, Snackbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTaskStore } from "../../store/taskStore";
import { useAuthStore } from "../../store/authStore";
import { useReflectionStore } from "../../store/reflectionStore";
import { useUserStore, getGreeting } from "../../store/userStore";
import { useProfileStore } from "../../store/profileStore";
import { useCapacityStore } from "../../store/capacityStore";
import { ADAPTIVE_PLANS } from "../../utils/adaptivePlans";
import { Task } from "../../types";
import { format } from "date-fns";
import { supabase } from "../../lib/supabase";
import { getSmartTodaySuggestions, SuggestedTask, removeSuggestion } from "../../utils/smartToday";
import { getMissedTasks, MissedTask, rescheduleToToday, skipTask, SkipReason } from "../../utils/missedTasks";
import { globalSearch, SearchResult, getSearchIcon, getSearchTypeLabel } from "../../utils/globalSearch";
import { addSubjectToToday, addTopicToToday, addSubTopicToToday, addTaskToToday } from "../../utils/addToToday";

// Design tokens
import { semantic, spacing, borderRadius } from "../../constants/theme";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
// UI Components
import { Checkbox, Chip, SearchBar, ProgressBar, TaskRow, TaskLimitModal } from "../../components/ui";
import { GlassCard, GlassButton, MeshGradientBackground } from "../../components/glass";
import { StartSessionModal, SessionConfig } from "../../components/session/StartSessionModal";
import { StreakIcon } from "../../components/home/StreakIcon";
import { StreakModal } from "../../components/home/StreakModal";
import { useStreakStore } from "../../store/streakStore";
import { useHealthStore } from "../../store/healthStore";
import { HealthService } from "../../services/HealthService";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Smart Today Task Card
function SmartTaskCard({ suggestion, onToggle, onDismiss }: {
    suggestion: SuggestedTask;
    onToggle: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    const reasonColors: Record<string, string> = {
        exam_soon: glassAccent.warm,
        missed_yesterday: glassAccent.warm,
        high_priority: glassAccent.warm,
        due_soon: glassAccent.mint,
        balanced: glassAccent.mint,
    };

    return (
        <GlassCard style={styles.smartCard} bordered={false} intensity="light">
            <View style={[styles.smartContent, { borderLeftColor: suggestion.subjectColor || glassAccent.mint, borderLeftWidth: 4, paddingLeft: 12 }]}>
                <Checkbox
                    checked={suggestion.task.is_completed}
                    onToggle={() => onToggle(suggestion.task.id)}
                />
                <View style={styles.smartInfo}>
                    <Text variant="bodyLarge" style={styles.smartTitle}>{suggestion.task.title}</Text>
                    <View style={styles.smartMeta}>
                        <Chip size="sm" style={{ backgroundColor: (reasonColors[suggestion.reason] || glassAccent.blue) + "25" }}>
                            {suggestion.reasonText}
                        </Chip>
                        {suggestion.subjectName && (
                            <Text variant="bodySmall" style={{ color: glassText.secondary, marginLeft: 8 }}>{suggestion.subjectName}</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity onPress={() => onDismiss(suggestion.task.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={18} color={glassText.muted} />
                </TouchableOpacity>
            </View>
        </GlassCard>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { todayTasks, fetchTodayTasks, toggleTaskComplete, createTask, isLoading: tasksLoading } = useTaskStore();
    const { todayReflection, hasShownPrompt, fetchTodayReflection, saveReflection } = useReflectionStore();
    const { displayName, updateDisplayName } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);
    const [quickTaskTitle, setQuickTaskTitle] = useState("");
    const [streak, setStreak] = useState(0);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isLoadingStreak, setIsLoadingStreak] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    // Smart Today state
    const [smartSuggestions, setSmartSuggestions] = useState<SuggestedTask[]>([]);
    const [isLoadingSmart, setIsLoadingSmart] = useState(true);
    const [examDaysAway, setExamDaysAway] = useState<number | null>(null);

    // Missed tasks state
    const [missedTasks, setMissedTasks] = useState<MissedTask[]>([]);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Reflection modal
    const [reflectionVisible, setReflectionVisible] = useState(false);
    const [reflectionLearned, setReflectionLearned] = useState("");
    const [reflectionDifficult, setReflectionDifficult] = useState("");

    // Name edit modal
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [editName, setEditName] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);

    // Start Session modal
    const [startSessionModalVisible, setStartSessionModalVisible] = useState(false);
    const { profile, fetchProfile } = useProfileStore();

    // Task edit modal
    const [taskEditVisible, setTaskEditVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high">("medium");
    const [isSavingTask, setIsSavingTask] = useState(false);

    // Collapsible Today section
    const [todayCollapsed, setTodayCollapsed] = useState(false);

    // Search snackbar
    const [searchSnackbarVisible, setSearchSnackbarVisible] = useState(false);
    const [searchSnackbarMessage, setSearchSnackbarMessage] = useState("");

    // Capacity system
    const { capacity, usage, fetchCapacity, getTodayUsage, canAddTask, logOverride } = useCapacityStore();
    const [taskLimitModalVisible, setTaskLimitModalVisible] = useState(false);

    // Streak system
    const { fetchStreak: loadStreak, recordActivity } = useStreakStore();
    const [streakModalVisible, setStreakModalVisible] = useState(false);

    const fetchStreakData = async () => {
        if (user) await loadStreak(user.id);
    };

    // Health Integration
    const { derivedData, hasPermissions, updateHealthData, lastSyncTimestamp, healthInfluenceMode, baseline } = useHealthStore();

    useEffect(() => {
        const syncHealth = async () => {
            if (!hasPermissions || healthInfluenceMode === 'disabled') return;

            const now = new Date();
            const lastSync = lastSyncTimestamp ? new Date(lastSyncTimestamp) : null;
            const isNewDay = !lastSync || lastSync.getDate() !== now.getDate();

            if (isNewDay && now.getHours() >= 6) {
                try {
                    // Fetch metrics
                    const metrics = await HealthService.fetchDayMetrics();

                    // Calculate readiness
                    const result = HealthService.calculateReadiness(metrics, baseline);

                    // Update baseline (naive incremental for now)
                    const newBaseline = {
                        ...baseline,
                        daysCollected: baseline.daysCollected + 1,
                        avgSleep: (baseline.avgSleep * baseline.daysCollected + metrics.sleepHours) / (baseline.daysCollected + 1),
                        avgHRV: metrics.hrv > 0 ? (baseline.avgHRV * baseline.daysCollected + metrics.hrv) / (baseline.daysCollected + 1) : baseline.avgHRV
                    };

                    updateHealthData({
                        baseline: newBaseline,
                        derived: result,
                        timestamp: now.toISOString()
                    });
                } catch (e) {
                    console.error("Health sync failed", e);
                }
            }
        };
        syncHealth();
    }, [hasPermissions, healthInfluenceMode, lastSyncTimestamp, user]);

    useEffect(() => {
        if (user) {
            fetchTodayTasks();
            fetchPendingCount();
            fetchSmartToday();
            fetchMissedTasks();
            fetchTodayReflection();
            fetchProfile();
            fetchCapacity();
            fetchStreakData();
        }
    }, [user]);

    // Show reflection prompt once per day after first task completed
    useEffect(() => {
        const completedToday = todayTasks.filter(t => t.is_completed).length;
        if (completedToday >= 1 && !hasShownPrompt && !todayReflection) {
            setReflectionVisible(true);
        }
    }, [todayTasks, hasShownPrompt, todayReflection]);

    const fetchSmartToday = async () => {
        if (!user) return;
        setIsLoadingSmart(true);
        const result = await getSmartTodaySuggestions(user.id);
        setSmartSuggestions(result.suggestions);
        setPendingCount(result.totalPending);
        setExamDaysAway(result.examDaysAway);
        setIsLoadingSmart(false);
    };

    const fetchMissedTasks = async () => {
        const missed = await getMissedTasks();
        setMissedTasks(missed.slice(0, 3));
    };

    const fetchPendingCount = async () => {
        if (!user) return;
        const { count } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("is_completed", false);
        setPendingCount(count || 0);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchTodayTasks(), fetchStreakData(), fetchPendingCount(), fetchSmartToday(), fetchMissedTasks()]);
        setRefreshing(false);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            setIsSearching(true);
            const results = await globalSearch(query);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleSearchSelect = (result: SearchResult) => {
        setSearchQuery("");
        setSearchResults([]);
        (router as any).push(result.route);
    };

    const handleQuickAdd = async () => {
        if (!quickTaskTitle.trim() || !user) return;

        if (!canAddTask()) {
            setTaskLimitModalVisible(true);
            return;
        }

        setIsAddingTask(true);
        try {
            const { data: subTopics } = await supabase
                .from("sub_topics")
                .select("id, topic_id")
                .limit(1);

            const { error } = await supabase.from("tasks").insert({
                user_id: user.id,
                sub_topic_id: subTopics && subTopics.length > 0 ? subTopics[0].id : null,
                topic_id: subTopics && subTopics.length > 0 ? subTopics[0].topic_id : null,
                title: quickTaskTitle.trim(),
                priority: "medium",
                due_date: format(new Date(), "yyyy-MM-dd"),
            });

            if (!error) {
                setQuickTaskTitle("");
                await Promise.all([fetchTodayTasks(), fetchSmartToday(), getTodayUsage()]);
            } else {
                console.error("Error adding task:", error);
            }
        } catch (error) {
            console.error(error);
        }
        setIsAddingTask(false);
    };

    const handleDismissSuggestion = (taskId: string) => {
        setSmartSuggestions(removeSuggestion(smartSuggestions, taskId));
    };

    const handleToggleSmart = async (taskId: string) => {
        await toggleTaskComplete(taskId);
        await fetchSmartToday();
        if (user) await recordActivity(user.id);
    };

    const handleReschedule = async (taskId: string) => {
        await rescheduleToToday(taskId);
        await fetchMissedTasks();
        await fetchSmartToday();
    };

    const handleSkipTask = async (taskId: string, reason: SkipReason) => {
        await skipTask(taskId, reason);
        await fetchMissedTasks();
    };

    const handleSaveReflection = async () => {
        await saveReflection(reflectionLearned, reflectionDifficult);
        setReflectionVisible(false);
        setReflectionLearned("");
        setReflectionDifficult("");
    };

    const handleStartSession = (config: SessionConfig) => {
        router.push({
            pathname: '/focus',
            params: {
                duration: config.duration.toString(),
                subjectId: config.subjectId,
                topicId: config.topicId || '',
                subTopicId: config.subTopicId || '',
                note: config.note || '',
                autoStart: 'true',
            },
        });
    };

    const handleOpenNameModal = () => {
        setEditName(displayName);
        setNameModalVisible(true);
    };

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        setIsSavingName(true);
        await updateDisplayName(editName.trim());
        setNameModalVisible(false);
        setIsSavingName(false);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setEditTaskTitle(task.title);
        setEditTaskPriority(task.priority || "medium");
        setTaskEditVisible(true);
    };

    const handleSaveTask = async () => {
        if (!editingTask || !editTaskTitle.trim()) return;
        setIsSavingTask(true);
        try {
            await supabase
                .from("tasks")
                .update({
                    title: editTaskTitle.trim(),
                    priority: editTaskPriority
                })
                .eq("id", editingTask.id);
            await fetchTodayTasks();
            await fetchSmartToday();
        } catch (error) {
            console.error("Error updating task:", error);
        }
        setTaskEditVisible(false);
        setEditingTask(null);
        setIsSavingTask(false);
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await supabase.from("tasks").delete().eq("id", taskId);
            await fetchTodayTasks();
            await fetchSmartToday();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleSearchAddToToday = async (result: SearchResult) => {
        let message = "";
        try {
            if (result.type === "subject" && result.subjectId) {
                const res = await addSubjectToToday(result.subjectId);
                message = res.message;
            } else if (result.type === "topic" && result.topicId) {
                const res = await addTopicToToday(result.topicId);
                message = res.message;
            } else if (result.type === "sub_topic" && result.subTopicId) {
                const res = await addSubTopicToToday(result.subTopicId);
                message = res.message;
            } else if (result.type === "task") {
                const res = await addTaskToToday(result.id);
                message = res.message;
            }
            setSearchSnackbarMessage(message || "Added to Today");
            setSearchSnackbarVisible(true);
            setSearchQuery("");
            setSearchResults([]);
            await fetchTodayTasks();
        } catch (error) {
            console.error("Error adding to today:", error);
        }
    };

    const toggleTodayCollapse = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTodayCollapsed(!todayCollapsed);
    };

    const handleReplaceTask = async (taskId: string) => {
        await handleDeleteTask(taskId);
        await handleQuickAdd();
        setTaskLimitModalVisible(false);
    };

    const handleScheduleTomorrow = async () => {
        if (!quickTaskTitle.trim() || !user) return;
        setIsAddingTask(true);
        try {
            const { data: subTopics } = await supabase
                .from("sub_topics")
                .select("id, topic_id")
                .limit(1);

            const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");

            await supabase.from("tasks").insert({
                user_id: user.id,
                sub_topic_id: subTopics && subTopics.length > 0 ? subTopics[0].id : null,
                topic_id: subTopics && subTopics.length > 0 ? subTopics[0].topic_id : null,
                title: quickTaskTitle.trim(),
                priority: "medium",
                due_date: tomorrow,
            });

            setQuickTaskTitle("");
            setTaskLimitModalVisible(false);
            setSearchSnackbarMessage("Task scheduled for tomorrow");
            setSearchSnackbarVisible(true);
        } catch (error) {
            console.error("Error scheduling task:", error);
        }
        setIsAddingTask(false);
    };

    const handleAddAnyway = async () => {
        if (!user) return;
        await logOverride('task_limit');
        setTaskLimitModalVisible(false);
        setIsAddingTask(true);
        try {
            const { data: subTopics } = await supabase
                .from("sub_topics")
                .select("id, topic_id")
                .limit(1);

            const { error } = await supabase.from("tasks").insert({
                user_id: user.id,
                sub_topic_id: subTopics && subTopics.length > 0 ? subTopics[0].id : null,
                topic_id: subTopics && subTopics.length > 0 ? subTopics[0].topic_id : null,
                title: quickTaskTitle.trim(),
                priority: "medium",
                due_date: format(new Date(), "yyyy-MM-dd"),
            });

            if (!error) {
                setQuickTaskTitle("");
                await Promise.all([fetchTodayTasks(), fetchSmartToday(), getTodayUsage()]);
            }
        } catch (error) {
            console.error(error);
        }
        setIsAddingTask(false);
    };

    const completedCount = todayTasks.filter((t) => t.is_completed).length;
    const totalCount = todayTasks.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

    if (tasksLoading && todayTasks.length === 0 && isLoadingSmart) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={glassAccent.mint} />
                <Text variant="bodyMedium" style={{ color: glassText.secondary, marginTop: 16 }}>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <MeshGradientBackground />
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassAccent.mint} />}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text variant="bodyMedium" style={{ color: glassText.secondary }}>
                                {format(new Date(), "EEEE, MMMM d")}
                            </Text>
                            <StreakIcon onPress={() => setStreakModalVisible(true)} />
                        </View>
                        <TouchableOpacity onPress={handleOpenNameModal} style={styles.greetingRow}>
                            <Text variant="headlineLarge" style={styles.greeting}>
                                {getGreeting()}, {displayName || user?.full_name?.split(" ")[0] || "Student"} 👋
                            </Text>
                            <Ionicons name="pencil-outline" size={16} color={glassText.muted} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <SearchBar
                            placeholder="Search subjects, tasks, notes..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchResults.length > 0 && (
                            <GlassCard style={[styles.searchResults, { padding: 0 }]}>
                                {searchResults.slice(0, 6).map((result) => (
                                    <TouchableOpacity key={result.id} style={styles.searchResultItem} onPress={() => handleSearchSelect(result)}>
                                        <Ionicons name={getSearchIcon(result.type) as any} size={16} color={result.color || glassAccent.mint} />
                                        <View style={styles.searchResultInfo}>
                                            <Text variant="bodyMedium" style={{ color: glassText.primary }}>{result.title}</Text>
                                            <View style={styles.searchResultMeta}>
                                                <Chip size="sm">{getSearchTypeLabel(result.type)}</Chip>
                                                <Text variant="bodySmall" style={{ color: glassText.secondary }}>{result.subtitle}</Text>
                                            </View>
                                        </View>
                                        {result.type !== "note" && (
                                            <TouchableOpacity
                                                onPress={() => handleSearchAddToToday(result)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons name="add-circle-outline" size={22} color={glassAccent.mint} />
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </GlassCard>
                        )}
                    </View>

                    {/* Start Focus Session Card */}
                    {profile && (
                        <GlassCard style={styles.startSessionCard} intensity="medium">
                            <TouchableOpacity
                                onPress={() => setStartSessionModalVisible(true)}
                                style={styles.sessionCardContent}
                                activeOpacity={0.7}
                            >
                                <View style={styles.sessionIcon}>
                                    <Ionicons name="play-circle" size={32} color={glassAccent.mint} />
                                </View>
                                <View style={styles.sessionInfo}>
                                    <Text variant="titleMedium" style={styles.sessionTitle}>
                                        Start Focus Session
                                    </Text>
                                    <Text variant="bodySmall" style={styles.sessionSubtitle}>
                                        {ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)?.default_session_length || 25} min · Based on your plan
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={glassText.muted} />
                            </TouchableOpacity>
                        </GlassCard>
                    )}

                    {/* Exam Alert */}
                    {examDaysAway !== null && examDaysAway <= 7 && (
                        <GlassCard style={styles.examAlert} intensity="light">
                            <View style={styles.examAlertContent}>
                                <Ionicons name="warning" size={20} color={semantic.error} />
                                <Text variant="bodyMedium" style={styles.examAlertText}>
                                    Exam in {examDaysAway} days! Focus on exam tasks.
                                </Text>
                            </View>
                        </GlassCard>
                    )}

                    {/* Apple Health Promo Card */}
                    {!hasPermissions && (
                        <GlassCard style={styles.healthPromoCard} intensity="light">
                            <TouchableOpacity
                                onPress={() => router.push('/onboarding/health')}
                                style={styles.healthPromoContent}
                                activeOpacity={0.7}
                            >
                                <View style={styles.healthPromoIcon}>
                                    <Ionicons name="heart" size={24} color={glassAccent.warm} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleSmall" style={{ color: glassText.primary }}>
                                        Optimize with Apple Health
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                        Adjust focus based on sleep & recovery
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={glassText.muted} />
                            </TouchableOpacity>
                        </GlassCard>
                    )}

                    {/* Capacity Indicator */}
                    {capacity && (
                        <GlassCard style={styles.capacityCard}>
                            <View style={styles.capacityHeader}>
                                <View style={styles.capacityTitleRow}>
                                    <Ionicons name="speedometer-outline" size={18} color={glassAccent.mint} />
                                    <Text variant="titleSmall" style={styles.capacityTitle}>Your Capacity Today</Text>
                                </View>
                                <Text variant="bodySmall" style={styles.capacityHint}>
                                    {healthInfluenceMode === 'adaptive' && hasPermissions
                                        ? (derivedData.isCalibrating ? "Learning your rhythm..." : "Adjusted gently based on recovery signals")
                                        : "Based on your profile"}
                                </Text>
                            </View>

                            <View style={styles.capacityMetrics}>
                                <View style={styles.capacityMetric}>
                                    <Text variant="headlineSmall" style={[
                                        styles.capacityValue,
                                        { color: usage.isOverTaskLimit ? glassAccent.warm : glassAccent.mint }
                                    ]}>
                                        {usage.todayTaskCount} / {capacity.max_tasks_per_day}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.capacityLabel}>tasks today</Text>
                                    <ProgressBar
                                        progress={Math.min(1, usage.todayTaskCount / capacity.max_tasks_per_day)}
                                        color={usage.isOverTaskLimit ? glassAccent.warm : glassAccent.mint}
                                        height={4}
                                        style={{ marginTop: 8 }}
                                    />
                                </View>

                                <View style={styles.capacityDivider} />

                                <View style={styles.capacityMetric}>
                                    <Text variant="headlineSmall" style={[
                                        styles.capacityValue,
                                        { color: usage.isOverFocusLimit ? glassAccent.warm : glassText.muted }
                                    ]}>
                                        {usage.remainingFocusMinutes}m
                                    </Text>
                                    <Text variant="bodySmall" style={styles.capacityLabel}>focus time left</Text>
                                </View>
                            </View>
                        </GlassCard>
                    )}

                    {/* Stats Cards */}
                    <View style={styles.statsRow}>
                        <GlassCard style={styles.statCard} bordered={false} intensity="light">
                            <View style={styles.statHeader}>
                                <Ionicons name="checkmark-circle" size={18} color={glassText.secondary} />
                                <Text variant="labelSmall" style={{ color: glassText.muted, marginLeft: 4 }}>Today</Text>
                            </View>
                            <Text variant="titleLarge" style={styles.statValue}>{completedCount}/{totalCount}</Text>
                            <ProgressBar progress={progress} color={glassAccent.mint} height={4} style={{ marginTop: 8 }} />
                        </GlassCard>
                        <GlassCard style={styles.statCard} bordered={false} intensity="light">
                            <View style={styles.statHeader}>
                                <Ionicons name="flame" size={18} color={glassAccent.warm} />
                                <Text variant="labelSmall" style={{ color: glassText.muted, marginLeft: 4 }}>Streak</Text>
                            </View>
                            <Text variant="titleLarge" style={styles.statValue}>
                                {isLoadingStreak ? "-" : `${streak}d`}
                            </Text>
                        </GlassCard>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => (router as any).push("/focus")}>
                            <GlassCard style={styles.statCard} bordered={false} intensity="medium">
                                <View style={styles.statHeader}>
                                    <Ionicons name="timer" size={18} color={glassAccent.blue} />
                                    <Text variant="labelSmall" style={{ color: glassText.muted, marginLeft: 4 }}>Focus</Text>
                                </View>
                                <Text variant="titleLarge" style={styles.statValue}>Start</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    </View>

                    {/* Missed Tasks Recovery */}
                    {missedTasks.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="alert-circle" size={20} color={glassAccent.warm} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Missed Tasks</Text>
                                </View>
                            </View>
                            {missedTasks.map((missed) => (
                                <GlassCard key={missed.task.id} style={styles.missedCard} intensity="light">
                                    <Text variant="bodyLarge" style={{ color: glassText.primary }}>{missed.task.title}</Text>
                                    <Text variant="bodySmall" style={{ color: glassAccent.warm, marginTop: 4 }}>
                                        Missed {missed.daysMissed} day{missed.daysMissed > 1 ? 's' : ''} ago
                                    </Text>
                                    <View style={styles.missedActions}>
                                        <GlassButton size="sm" onPress={() => handleReschedule(missed.task.id)}>
                                            Reschedule
                                        </GlassButton>
                                        <GlassButton variant="ghost" size="sm" onPress={() => handleSkipTask(missed.task.id, 'no_time')}>
                                            Skip
                                        </GlassButton>
                                    </View>
                                </GlassCard>
                            ))}
                        </View>
                    )}

                    {/* Today's Tasks - Collapsible */}
                    <View style={styles.section}>
                        <TouchableOpacity onPress={toggleTodayCollapse} activeOpacity={0.7}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="today" size={20} color={glassText.primary} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>
                                        Today ({totalCount} tasks)
                                    </Text>
                                </View>
                                <Ionicons
                                    name={todayCollapsed ? "chevron-forward" : "chevron-down"}
                                    size={20}
                                    color={glassText.muted}
                                />
                            </View>
                        </TouchableOpacity>

                        {!todayCollapsed && (
                            <>
                                {todayTasks.length === 0 ? (
                                    <GlassCard style={styles.emptyCard} bordered={false}>
                                        <View style={styles.emptyContent}>
                                            <Ionicons name="checkbox-outline" size={40} color={glassText.muted} />
                                            <Text variant="bodyMedium" style={{ color: glassText.secondary, textAlign: "center", marginTop: 12 }}>
                                                No tasks due today.{"\n"}Add some from Subjects.
                                            </Text>
                                        </View>
                                    </GlassCard>
                                ) : (
                                    todayTasks.map((task) => (
                                        <TaskRow
                                            key={task.id}
                                            title={task.title}
                                            completed={task.is_completed}
                                            priority={task.priority || "medium"}
                                            onToggle={() => toggleTaskComplete(task.id)}
                                            onEdit={() => handleEditTask(task)}
                                            onDelete={() => handleDeleteTask(task.id)}
                                        />
                                    ))
                                )}
                            </>
                        )}
                    </View>

                    {/* Quick Add Task */}
                    <View style={styles.quickAddContainer}>
                        <GlassCard style={styles.quickAddCard} padding={0} intensity="medium">
                            <View style={styles.quickAddRow}>
                                <TextInput
                                    placeholder="Add a quick task..."
                                    value={quickTaskTitle}
                                    onChangeText={setQuickTaskTitle}
                                    style={styles.quickAddInput}
                                    placeholderTextColor={glassText.secondary}
                                    textColor={glassText.primary}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                    theme={{ colors: { background: "transparent" } }}
                                    onSubmitEditing={handleQuickAdd}
                                />
                                <TouchableOpacity
                                    onPress={handleQuickAdd}
                                    disabled={!quickTaskTitle.trim() || isAddingTask}
                                    style={styles.quickAddBtn}
                                >
                                    <Ionicons
                                        name="arrow-up-circle"
                                        size={32}
                                        color={quickTaskTitle.trim() ? glassAccent.mint : glassText.muted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </View>
                </ScrollView>

                {/* Modals */}
                <Portal>
                    {/* Name Edit Modal */}
                    <Modal visible={nameModalVisible} onDismiss={() => setNameModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>What should we call you?</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={styles.modalInput}
                            mode="outlined"
                            autoFocus
                            placeholder="Your Name"
                            outlineColor={glass.border.light}
                            activeOutlineColor={glassAccent.mint}
                            textColor={glassText.primary}
                            theme={{ colors: { background: darkBackground.primary, placeholder: glassText.secondary, text: glassText.primary } }}
                        />
                        <GlassButton onPress={handleSaveName} loading={isSavingName} fullWidth>
                            Save
                        </GlassButton>
                    </Modal>

                    {/* Task Edit Modal */}
                    <Modal visible={taskEditVisible} onDismiss={() => setTaskEditVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Edit Task</Text>
                        <TextInput
                            label="Title"
                            value={editTaskTitle}
                            onChangeText={setEditTaskTitle}
                            style={styles.modalInput}
                            mode="outlined"
                            outlineColor={glass.border.light}
                            activeOutlineColor={glassAccent.mint}
                            textColor={glassText.primary}
                            theme={{ colors: { background: darkBackground.primary, placeholder: glassText.secondary, text: glassText.primary } }}
                        />
                        <Text variant="bodyMedium" style={{ color: glassText.secondary, marginBottom: 8 }}>Priority</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                            {(['low', 'medium', 'high'] as const).map(p => (
                                <Chip
                                    key={p}
                                    selected={editTaskPriority === p}
                                    onPress={() => setEditTaskPriority(p)}
                                    // Use variant text logic potentially or just manual styles if Chip isn't fully updated yet
                                    // Assuming Chip handles selection via props or we need custom logic.
                                    // Chip component from 'ui' likely accepts variant.
                                    variant={editTaskPriority === p ? `priority-${p}` as any : 'default'}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Chip>
                            ))}
                        </View>
                        <GlassButton onPress={handleSaveTask} loading={isSavingTask} fullWidth>
                            Save Changes
                        </GlassButton>
                    </Modal>
                </Portal>

                <StartSessionModal
                    visible={startSessionModalVisible}
                    onDismiss={() => setStartSessionModalVisible(false)}
                    onStart={handleStartSession}
                    defaultDuration={ADAPTIVE_PLANS.find(p => p.id === profile?.selected_plan_id)?.default_session_length || 25}
                />

                <StreakModal
                    visible={streakModalVisible}
                    onClose={() => setStreakModalVisible(false)}
                />

                <TaskLimitModal
                    visible={taskLimitModalVisible}
                    onDismiss={() => setTaskLimitModalVisible(false)}
                    onReplaceTask={handleReplaceTask}
                    onScheduleTomorrow={handleScheduleTomorrow}
                    onAddAnyway={handleAddAnyway}
                    todayTasks={todayTasks}
                    currentCount={usage.todayTaskCount}
                    maxTasks={capacity?.max_tasks_per_day || 3}
                />

                <Snackbar
                    visible={searchSnackbarVisible}
                    onDismiss={() => setSearchSnackbarVisible(false)}
                    duration={3000}
                    style={{ backgroundColor: darkBackground.elevated }}
                >
                    {searchSnackbarMessage}
                </Snackbar>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 }, // ✅ Canonical inset
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    greetingRow: { flexDirection: "row", alignItems: "center" },
    greeting: { color: glassText.primary, fontWeight: "bold" },
    searchContainer: { paddingHorizontal: 16, marginBottom: 24, zIndex: 10 }, // ✅ Canonical inset
    searchResults: { position: "absolute", top: 56, left: 16, right: 16, zIndex: 100, maxHeight: 300 }, // ✅ Aligned
    searchResultItem: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 0.5, borderBottomColor: glass.border.light },
    searchResultInfo: { flex: 1, marginLeft: 12 },
    searchResultMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
    startSessionCard: { marginHorizontal: 16, marginBottom: 24, padding: 0 }, // ✅ Canonical margin
    sessionCardContent: { flexDirection: "row", alignItems: "center", padding: 16 },
    sessionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: glassAccent.mint + "20", alignItems: "center", justifyContent: "center", marginRight: 16 },
    sessionInfo: { flex: 1 },
    sessionTitle: { color: glassText.primary, fontWeight: "600" },
    sessionSubtitle: { color: glassText.secondary },
    examAlert: { marginHorizontal: 16, marginBottom: 16, backgroundColor: glassAccent.warm + "15" }, // ✅ Canonical margin
    examAlertContent: { flexDirection: "row", alignItems: "center", gap: 12 },
    examAlertText: { color: glassText.primary, flex: 1 },
    healthPromoCard: { marginHorizontal: 16, marginBottom: 24 }, // ✅ Canonical margin
    healthPromoContent: { flexDirection: "row", alignItems: "center", gap: 12 },
    healthPromoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: glassAccent.warm + "20", alignItems: "center", justifyContent: "center" },
    capacityCard: { marginHorizontal: 16, marginBottom: 24 }, // ✅ Canonical margin
    capacityHeader: { marginBottom: 16 },
    capacityTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    capacityTitle: { color: glassText.primary },
    capacityHint: { color: glassText.secondary },
    capacityMetrics: { flexDirection: "row", gap: 16 },
    capacityMetric: { flex: 1 },
    capacityValue: { fontWeight: "bold" },
    capacityLabel: { color: glassText.secondary },
    capacityDivider: { width: 1, backgroundColor: glass.border.light },
    statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 24 }, // ✅ Canonical padding
    statCard: { flex: 1, padding: 12 },
    statHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    statValue: { color: glassText.primary, fontWeight: "bold" },
    section: { paddingHorizontal: 16, marginBottom: 24 }, // ✅ Canonical padding
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionTitle: { color: glassText.primary, fontWeight: "600" },
    missedCard: { marginBottom: 12 },
    missedActions: { flexDirection: "row", gap: 8, marginTop: 12, justifyContent: "flex-end" },
    emptyCard: { padding: 24 },
    emptyContent: { alignItems: "center", paddingVertical: 20 },
    quickAddContainer: { paddingHorizontal: 16, paddingBottom: 20 }, // ✅ Canonical padding
    quickAddCard: { borderRadius: borderRadius.pill || 30 },
    quickAddRow: { flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 8, paddingVertical: 4 },
    quickAddInput: { flex: 1, backgroundColor: "transparent", fontSize: 16 },
    quickAddBtn: { padding: 4 },
    smartCard: { marginHorizontal: 16, marginBottom: 16 }, // ✅ Canonical margin
    smartContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    smartInfo: { flex: 1, marginHorizontal: 12 },
    smartTitle: { color: glassText.primary, fontWeight: "500" },
    smartMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    modal: { backgroundColor: darkBackground.elevated, margin: 20, padding: 24, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalTitle: { color: glassText.primary, fontWeight: "bold", marginBottom: 16 },
    modalInput: { marginBottom: 16, backgroundColor: darkBackground.primary },
});
