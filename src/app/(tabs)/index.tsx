import { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, LayoutAnimation, UIManager } from "react-native";
import { Text, TextInput, IconButton, Portal, Modal, Snackbar } from "react-native-paper";
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
import { format, subDays } from "date-fns";
import { supabase } from "../../lib/supabase";
import { getSmartTodaySuggestions, SuggestedTask, removeSuggestion } from "../../utils/smartToday";
import { getMissedTasks, MissedTask, rescheduleToToday, skipTask, SkipReason } from "../../utils/missedTasks";
import { globalSearch, SearchResult, getSearchIcon, getSearchTypeLabel } from "../../utils/globalSearch";
import { addSubjectToToday, addTopicToToday, addSubTopicToToday, addTaskToToday } from "../../utils/addToToday";

// Design tokens
import { pastel, background, text, semantic, priority, spacing, borderRadius, shadows, paperTheme, darkMode } from "../../constants/theme";
// UI Components
import { Card, Checkbox, Chip, Button, SearchBar, ProgressBar, TaskRow, TaskLimitModal } from "../../components/ui";
import { StartSessionModal, SessionConfig } from "../../components/session/StartSessionModal";
import { StreakIcon } from "../../components/home/StreakIcon";
import { StreakModal } from "../../components/home/StreakModal";
import { useStreakStore } from "../../store/streakStore";
import { useThemeStore } from "../../store/themeStore";

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
        exam_soon: semantic.error,
        missed_yesterday: semantic.warning,
        high_priority: pastel.peach,
        due_soon: pastel.mint,
        balanced: semantic.success,
    };

    return (
        <Card style={[styles.smartCard, { borderLeftColor: suggestion.subjectColor || pastel.mint, borderLeftWidth: 4 }]}>
            <View style={styles.smartContent}>
                <Checkbox
                    checked={suggestion.task.is_completed}
                    onToggle={() => onToggle(suggestion.task.id)}
                />
                <View style={styles.smartInfo}>
                    <Text variant="bodyLarge" style={styles.smartTitle}>{suggestion.task.title}</Text>
                    <View style={styles.smartMeta}>
                        <Chip size="sm" style={{ backgroundColor: reasonColors[suggestion.reason] + "25" }}>
                            {suggestion.reasonText}
                        </Chip>
                        {suggestion.subjectName && (
                            <Text variant="bodySmall" style={{ color: text.secondary, marginLeft: 8 }}>{suggestion.subjectName}</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity onPress={() => onDismiss(suggestion.task.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={18} color={text.muted} />
                </TouchableOpacity>
            </View>
        </Card>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { todayTasks, fetchTodayTasks, toggleTaskComplete, createTask, isLoading: tasksLoading } = useTaskStore();
    const { todayReflection, hasShownPrompt, fetchTodayReflection, saveReflection, markPromptShown } = useReflectionStore();
    const { displayName, fetchProfile, updateDisplayName } = useUserStore();
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
    const { profile } = useProfileStore();

    // Task edit modal
    const [taskEditVisible, setTaskEditVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high">("medium");
    const [isSavingTask, setIsSavingTask] = useState(false);

    // Collapsible Today section
    const [todayCollapsed, setTodayCollapsed] = useState(false);

    // Smart Today expanded state
    const [smartExpanded, setSmartExpanded] = useState(false);

    // Features expanded state
    const [featuresExpanded, setFeaturesExpanded] = useState(true);

    // Search snackbar
    const [searchSnackbarVisible, setSearchSnackbarVisible] = useState(false);
    const [searchSnackbarMessage, setSearchSnackbarMessage] = useState("");

    // Capacity system
    const { capacity, usage, fetchCapacity, getTodayUsage, canAddTask, logOverride } = useCapacityStore();
    const [taskLimitModalVisible, setTaskLimitModalVisible] = useState(false);

    // Streak system
    const { fetchStreak: loadStreak, recordActivity } = useStreakStore();
    const [streakModalVisible, setStreakModalVisible] = useState(false);

    // Theme system
    const { mode, toggleTheme } = useThemeStore();
    const isDark = mode === 'dark';

    const fetchStreakData = async () => {
        if (user) await loadStreak(user.id);
    };

    useEffect(() => {
        if (user) {
            fetchTodayTasks();
            fetchPendingCount();
            fetchSmartToday();
            fetchMissedTasks();
            fetchTodayReflection();
            fetchProfile();
            fetchCapacity(); // Fetch capacity data
            fetchStreakData(); // Fetch streak data
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

        // Check capacity limit before adding
        if (!canAddTask()) {
            setTaskLimitModalVisible(true);
            return;
        }

        setIsAddingTask(true);
        try {
            // Try to get a sub_topic, but don't require it
            const { data: subTopics } = await supabase
                .from("sub_topics")
                .select("id, topic_id")
                .limit(1);

            // Insert task - works with or without subject/topic
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
        // Record activity for streak tracking
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
        // Navigate to Focus Mode with session configuration
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

    //Task Limit Modal handlers
    const handleReplaceTask = async (taskId: string) => {
        // Delete the selected task
        await handleDeleteTask(taskId);
        // Then add the new task
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
        // Log override for analytics
        await logOverride('task_limit');
        setTaskLimitModalVisible(false);
        // Proceed with adding task (bypassing capacity check)
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

    // Get themedbackground color
    const themedBg = isDark ? darkMode.background.primary : background.primary;
    const themedText = isDark ? darkMode.text : text;
    const themedPastel = isDark ? darkMode.pastel : pastel;

    if (tasksLoading && todayTasks.length === 0 && isLoadingSmart) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: themedBg }]}>
                <ActivityIndicator size="large" color={themedPastel.mint} />
                <Text variant="bodyMedium" style={{ color: themedText.secondary, marginTop: 16 }}>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: themedBg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.container, { backgroundColor: themedBg }]}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themedPastel.mint} />}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text variant="bodyMedium" style={{ color: isDark ? darkMode.text.secondary : text.secondary }}>
                                {format(new Date(), "EEEE, MMMM d")}
                            </Text>
                            <View style={styles.headerIcons}>
                                <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
                                    <Ionicons
                                        name={isDark ? "sunny-outline" : "moon-outline"}
                                        size={22}
                                        color={isDark ? darkMode.pastel.mint : pastel.slate}
                                    />
                                </TouchableOpacity>
                                <StreakIcon onPress={() => setStreakModalVisible(true)} />
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleOpenNameModal} style={styles.greetingRow}>
                            <Text variant="headlineLarge" style={styles.greeting}>
                                {getGreeting()}, {displayName || user?.full_name?.split(" ")[0] || "Student"} 👋
                            </Text>
                            <Ionicons name="pencil-outline" size={16} color={text.muted} style={{ marginLeft: 8 }} />
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
                            <Card style={styles.searchResults} noPadding>
                                {searchResults.slice(0, 6).map((result) => (
                                    <TouchableOpacity key={result.id} style={styles.searchResultItem} onPress={() => handleSearchSelect(result)}>
                                        <Ionicons name={getSearchIcon(result.type) as any} size={16} color={result.color || pastel.mint} />
                                        <View style={styles.searchResultInfo}>
                                            <Text variant="bodyMedium" style={{ color: text.primary }}>{result.title}</Text>
                                            <View style={styles.searchResultMeta}>
                                                <Chip size="sm">{getSearchTypeLabel(result.type)}</Chip>
                                                <Text variant="bodySmall" style={{ color: text.secondary }}>{result.subtitle}</Text>
                                            </View>
                                        </View>
                                        {result.type !== "note" && (
                                            <TouchableOpacity
                                                onPress={() => handleSearchAddToToday(result)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons name="add-circle-outline" size={22} color={pastel.mint} />
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </Card>
                        )}
                    </View>

                    {/* Start Focus Session Card - NEW */}
                    {profile && (
                        <Card style={styles.startSessionCard}>
                            <TouchableOpacity
                                onPress={() => setStartSessionModalVisible(true)}
                                style={styles.sessionCardContent}
                                activeOpacity={0.7}
                            >
                                <View style={styles.sessionIcon}>
                                    <Ionicons name="play-circle" size={32} color={pastel.mint} />
                                </View>
                                <View style={styles.sessionInfo}>
                                    <Text variant="titleMedium" style={styles.sessionTitle}>
                                        Start Focus Session
                                    </Text>
                                    <Text variant="bodySmall" style={styles.sessionSubtitle}>
                                        {ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)?.default_session_length || 25} min · Based on your plan
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={text.muted} />
                            </TouchableOpacity>
                        </Card>
                    )}

                    {/* Exam Alert */}
                    {examDaysAway !== null && examDaysAway <= 7 && (
                        <Card style={styles.examAlert}>
                            <View style={styles.examAlertContent}>
                                <Ionicons name="warning" size={20} color={semantic.error} />
                                <Text variant="bodyMedium" style={styles.examAlertText}>
                                    Exam in {examDaysAway} days! Focus on exam tasks.
                                </Text>
                            </View>
                        </Card>
                    )}

                    {/* Capacity Indicator - NEW */}
                    {capacity && (
                        <Card style={styles.capacityCard}>
                            <View style={styles.capacityHeader}>
                                <View style={styles.capacityTitleRow}>
                                    <Ionicons name="speedometer-outline" size={18} color={pastel.mint} />
                                    <Text variant="titleSmall" style={styles.capacityTitle}>Your Capacity Today</Text>
                                </View>
                                <Text variant="bodySmall" style={styles.capacityHint}>
                                    Based on your profile
                                </Text>
                            </View>

                            <View style={styles.capacityMetrics}>
                                <View style={styles.capacityMetric}>
                                    <Text variant="headlineSmall" style={[
                                        styles.capacityValue,
                                        { color: usage.isOverTaskLimit ? pastel.peach : pastel.mint }
                                    ]}>
                                        {usage.todayTaskCount} / {capacity.max_tasks_per_day}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.capacityLabel}>tasks today</Text>
                                    <ProgressBar
                                        progress={Math.min(1, usage.todayTaskCount / capacity.max_tasks_per_day)}
                                        color={usage.isOverTaskLimit ? pastel.peach : pastel.mint}
                                        height={4}
                                        style={{ marginTop: 8 }}
                                    />
                                </View>

                                <View style={styles.capacityDivider} />

                                <View style={styles.capacityMetric}>
                                    <Text variant="headlineSmall" style={[
                                        styles.capacityValue,
                                        { color: usage.isOverFocusLimit ? pastel.peach : pastel.slate }
                                    ]}>
                                        {usage.remainingFocusMinutes}m
                                    </Text>
                                    <Text variant="bodySmall" style={styles.capacityLabel}>focus time left</Text>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Stats Cards */}
                    <View style={styles.statsRow}>
                        <Card gradient="mint" style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <Ionicons name="checkmark-circle" size={18} color="#5D6B6B" />
                                <Text variant="labelSmall" style={{ color: 'rgba(93, 107, 107, 0.65)', marginLeft: 4 }}>Today</Text>
                            </View>
                            <Text variant="titleLarge" style={styles.statValue}>{completedCount}/{totalCount}</Text>
                            <ProgressBar progress={progress} color="#5D6B6B" height={4} style={{ marginTop: 8 }} />
                        </Card>
                        <Card gradient="peach" style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <Ionicons name="flame" size={18} color="#5D6B6B" />
                                <Text variant="labelSmall" style={{ color: 'rgba(93, 107, 107, 0.65)', marginLeft: 4 }}>Streak</Text>
                            </View>
                            <Text variant="titleLarge" style={styles.statValue}>
                                {isLoadingStreak ? "-" : `${streak}d`}
                            </Text>
                        </Card>
                        <TouchableOpacity onPress={() => (router as any).push("/focus")}>
                            <Card gradient="sage" style={styles.statCard}>
                                <View style={styles.statHeader}>
                                    <Ionicons name="timer" size={18} color="#5D6B6B" />
                                    <Text variant="labelSmall" style={{ color: 'rgba(93, 107, 107, 0.65)', marginLeft: 4 }}>Focus</Text>
                                </View>
                                <Text variant="titleLarge" style={styles.statValue}>Start</Text>
                            </Card>
                        </TouchableOpacity>
                    </View>

                    {/* Missed Tasks Recovery */}
                    {missedTasks.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="alert-circle" size={20} color={semantic.warning} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Missed Tasks</Text>
                                </View>
                            </View>
                            {missedTasks.map((missed) => (
                                <Card key={missed.task.id} style={styles.missedCard}>
                                    <Text variant="bodyLarge" style={{ color: text.primary }}>{missed.task.title}</Text>
                                    <Text variant="bodySmall" style={{ color: semantic.warning, marginTop: 4 }}>
                                        Missed {missed.daysMissed} day{missed.daysMissed > 1 ? 's' : ''} ago
                                    </Text>
                                    <View style={styles.missedActions}>
                                        <Button size="sm" onPress={() => handleReschedule(missed.task.id)}>
                                            Reschedule
                                        </Button>
                                        <Button variant="ghost" size="sm" onPress={() => handleSkipTask(missed.task.id, 'no_time')}>
                                            Skip
                                        </Button>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    {/* Today's Tasks - Collapsible */}
                    <View style={styles.section}>
                        <TouchableOpacity onPress={toggleTodayCollapse} activeOpacity={0.7}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="today" size={20} color={text.primary} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>
                                        Today ({totalCount} tasks)
                                    </Text>
                                </View>
                                <Ionicons
                                    name={todayCollapsed ? "chevron-forward" : "chevron-down"}
                                    size={20}
                                    color={text.muted}
                                />
                            </View>
                        </TouchableOpacity>

                        {!todayCollapsed && (
                            <>
                                {todayTasks.length === 0 ? (
                                    <Card style={styles.emptyCard}>
                                        <View style={styles.emptyContent}>
                                            <Ionicons name="checkbox-outline" size={40} color={text.muted} />
                                            <Text variant="bodyMedium" style={{ color: text.secondary, textAlign: "center", marginTop: 12 }}>
                                                No tasks due today.{"\n"}Add some from Subjects.
                                            </Text>
                                        </View>
                                    </Card>
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

                    {/* Smart Today Section - Below Today Tasks, Collapsible */}
                    {smartSuggestions.length > 0 && (
                        <View style={styles.section}>
                            <TouchableOpacity onPress={() => setSmartExpanded(!smartExpanded)} activeOpacity={0.7}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Ionicons name="sparkles" size={20} color={pastel.mint} />
                                        <Text variant="titleMedium" style={styles.sectionTitle}>Smart Suggestions</Text>
                                        <Chip size="sm" variant="primary" style={{ marginLeft: 8 }}>{smartSuggestions.length}</Chip>
                                    </View>
                                    <Ionicons
                                        name={smartExpanded ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={text.muted}
                                    />
                                </View>
                            </TouchableOpacity>

                            {smartExpanded && (
                                <>
                                    <Text variant="bodySmall" style={styles.sectionSubtitle}>
                                        AI-powered suggestions based on your study patterns
                                    </Text>
                                    {smartSuggestions.slice(0, 5).map((suggestion) => (
                                        <SmartTaskCard
                                            key={suggestion.task.id}
                                            suggestion={suggestion}
                                            onToggle={handleToggleSmart}
                                            onDismiss={handleDismissSuggestion}
                                        />
                                    ))}
                                    {smartSuggestions.length > 5 && (
                                        <Text variant="bodySmall" style={{ color: text.muted, textAlign: "center", marginTop: 8 }}>
                                            +{smartSuggestions.length - 5} more suggestions
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    {/* Quick Add Task */}
                    <Card style={styles.quickAddCard}>
                        <View style={styles.quickAddContent}>
                            <Ionicons name="add-circle-outline" size={20} color={text.muted} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Add a quick task..."
                                placeholderTextColor={text.muted}
                                value={quickTaskTitle}
                                onChangeText={setQuickTaskTitle}
                                mode="flat"
                                style={styles.quickAddInput}
                                underlineStyle={{ display: 'none' } as any}
                                onSubmitEditing={handleQuickAdd}
                                theme={{ colors: { text: text.primary, primary: pastel.mint } }}
                            />
                            <TouchableOpacity
                                onPress={handleQuickAdd}
                                disabled={isAddingTask || !quickTaskTitle.trim()}
                                style={[styles.quickAddButton, (!quickTaskTitle.trim() || isAddingTask) && styles.quickAddButtonDisabled]}
                            >
                                <Ionicons name="send" size={18} color={pastel.white} />
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Explore Features Section */}
                    <View style={styles.section}>
                        <TouchableOpacity onPress={() => setFeaturesExpanded(!featuresExpanded)} activeOpacity={0.7}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="apps" size={20} color={pastel.mint} />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Explore Features</Text>
                                </View>
                                <Ionicons
                                    name={featuresExpanded ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={text.muted}
                                />
                            </View>
                        </TouchableOpacity>

                        {featuresExpanded && (
                            <View style={{ gap: 12, marginTop: 12 }}>
                                {/* Focus Timer */}
                                <TouchableOpacity onPress={() => router.push('/focus')} activeOpacity={0.7}>
                                    <Card style={styles.featureCard}>
                                        <View style={styles.featureIcon}>
                                            <Ionicons name="timer" size={24} color={pastel.mint} />
                                        </View>
                                        <View style={styles.featureContent}>
                                            <Text variant="titleSmall" style={styles.featureTitle}>Focus Timer</Text>
                                            <Text variant="bodySmall" style={styles.featureDesc}>Pomodoro sessions with quality tracking</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={text.muted} />
                                    </Card>
                                </TouchableOpacity>

                                {/* Analytics */}
                                <TouchableOpacity onPress={() => router.push('/analytics')} activeOpacity={0.7}>
                                    <Card style={styles.featureCard}>
                                        <View style={styles.featureIcon}>
                                            <Ionicons name="analytics" size={24} color={pastel.slate} />
                                        </View>
                                        <View style={styles.featureContent}>
                                            <Text variant="titleSmall" style={styles.featureTitle}>Analytics</Text>
                                            <Text variant="bodySmall" style={styles.featureDesc}>Track progress and insights</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={text.muted} />
                                    </Card>
                                </TouchableOpacity>

                                {/* Subjects */}
                                <TouchableOpacity onPress={() => router.push('/subjects')} activeOpacity={0.7}>
                                    <Card style={styles.featureCard}>
                                        <View style={styles.featureIcon}>
                                            <Ionicons name="book" size={24} color={pastel.peach} />
                                        </View>
                                        <View style={styles.featureContent}>
                                            <Text variant="titleSmall" style={styles.featureTitle}>Subjects & Topics</Text>
                                            <Text variant="bodySmall" style={styles.featureDesc}>Organize by subject and topic</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={text.muted} />
                                    </Card>
                                </TouchableOpacity>

                                {/* Notes */}
                                <TouchableOpacity onPress={() => router.push('/notes')} activeOpacity={0.7}>
                                    <Card style={styles.featureCard}>
                                        <View style={styles.featureIcon}>
                                            <Ionicons name="document-text" size={24} color={pastel.slate} />
                                        </View>
                                        <View style={styles.featureContent}>
                                            <Text variant="titleSmall" style={styles.featureTitle}>Notes</Text>
                                            <Text variant="bodySmall" style={styles.featureDesc}>Quick notes for each day</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={text.muted} />
                                    </Card>
                                </TouchableOpacity>

                                {/* Profile Settings */}
                                <TouchableOpacity onPress={() => router.push('/profile-settings')} activeOpacity={0.7}>
                                    <Card style={styles.featureCard}>
                                        <View style={styles.featureIcon}>
                                            <Ionicons name="person" size={24} color={pastel.mint} />
                                        </View>
                                        <View style={styles.featureContent}>
                                            <Text variant="titleSmall" style={styles.featureTitle}>Study Profile</Text>
                                            <Text variant="bodySmall" style={styles.featureDesc}>Personalize your study plan</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={text.muted} />
                                    </Card>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                </ScrollView>

                {/* Modals */}
                <Portal>
                    {/* Reflection Modal */}
                    <Modal visible={reflectionVisible} onDismiss={() => { setReflectionVisible(false); markPromptShown(); }} contentContainerStyle={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="bulb" size={24} color={semantic.warning} />
                            <Text variant="titleLarge" style={styles.modalTitle}>Daily Reflection</Text>
                        </View>
                        <Text variant="bodySmall" style={styles.modalSubtitle}>
                            Take a moment to reflect on your learning today
                        </Text>
                        <TextInput
                            label="What did you learn today?"
                            value={reflectionLearned}
                            onChangeText={setReflectionLearned}
                            mode="outlined"
                            style={styles.modalInput}
                            maxLength={200}
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                        />
                        <TextInput
                            label="What was difficult?"
                            value={reflectionDifficult}
                            onChangeText={setReflectionDifficult}
                            mode="outlined"
                            style={styles.modalInput}
                            maxLength={200}
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                        />
                        <View style={styles.modalButtons}>
                            <Button variant="ghost" onPress={() => { setReflectionVisible(false); markPromptShown(); }}>
                                Skip
                            </Button>
                            <Button onPress={handleSaveReflection}>
                                Save
                            </Button>
                        </View>
                    </Modal>

                    {/* Name Edit Modal */}
                    <Modal visible={nameModalVisible} onDismiss={() => setNameModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Edit Your Name</Text>
                        <TextInput
                            label="Your name"
                            value={editName}
                            onChangeText={setEditName}
                            mode="outlined"
                            style={styles.modalInput}
                            autoFocus
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                        />
                        <View style={styles.modalButtons}>
                            <Button variant="ghost" onPress={() => setNameModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button onPress={handleSaveName} loading={isSavingName} disabled={isSavingName || !editName.trim()}>
                                Save
                            </Button>
                        </View>
                    </Modal>

                    {/* Task Edit Modal */}
                    <Modal visible={taskEditVisible} onDismiss={() => setTaskEditVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Edit Task</Text>
                        <TextInput
                            label="Task title"
                            value={editTaskTitle}
                            onChangeText={setEditTaskTitle}
                            mode="outlined"
                            style={styles.modalInput}
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                        />
                        <Text variant="bodyMedium" style={{ color: text.secondary, marginBottom: 8 }}>Priority</Text>
                        <View style={styles.priorityRow}>
                            {(["low", "medium", "high"] as const).map((p) => (
                                <Chip
                                    key={p}
                                    variant={`priority-${p}`}
                                    selected={editTaskPriority === p}
                                    onPress={() => setEditTaskPriority(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Chip>
                            ))}
                        </View>
                        <View style={styles.modalButtons}>
                            <Button variant="ghost" onPress={() => setTaskEditVisible(false)}>
                                Cancel
                            </Button>
                            <Button onPress={handleSaveTask} loading={isSavingTask} disabled={isSavingTask || !editTaskTitle.trim()}>
                                Save
                            </Button>
                        </View>
                    </Modal>
                </Portal>

                {/* Task Limit Modal */}
                <TaskLimitModal
                    visible={taskLimitModalVisible}
                    currentCount={usage.todayTaskCount}
                    maxTasks={capacity?.max_tasks_per_day || 5}
                    todayTasks={todayTasks.filter(t => !t.is_completed).map(t => ({ id: t.id, title: t.title }))}
                    onDismiss={() => setTaskLimitModalVisible(false)}
                    onReplaceTask={handleReplaceTask}
                    onScheduleTomorrow={handleScheduleTomorrow}
                    onAddAnyway={handleAddAnyway}
                />

                {/* Start Session Modal */}
                <StartSessionModal
                    visible={startSessionModalVisible}
                    onDismiss={() => setStartSessionModalVisible(false)}
                    onStart={handleStartSession}
                    defaultDuration={
                        profile?.selected_plan_id
                            ? (ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)?.default_session_length || 25)
                            : 25
                    }
                />

                <Snackbar
                    visible={searchSnackbarVisible}
                    onDismiss={() => setSearchSnackbarVisible(false)}
                    duration={2000}
                    style={{ backgroundColor: pastel.slate }}
                >
                    {searchSnackbarMessage}
                </Snackbar>

                {/* Streak Modal */}
                <StreakModal
                    visible={streakModalVisible}
                    onClose={() => setStreakModalVisible(false)}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: background.primary },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
    themeToggle: { padding: 4 },
    greeting: { color: text.primary, fontWeight: "bold", marginTop: 4 },
    greetingRow: { flexDirection: "row", alignItems: "center" },
    searchContainer: { paddingHorizontal: 24, marginBottom: 16, zIndex: 100 },
    searchResults: { position: "absolute", top: 56, left: 0, right: 0, zIndex: 999, paddingVertical: 8 },
    searchResultItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 },
    searchResultInfo: { marginLeft: 12, flex: 1 },
    searchResultMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    examAlert: { marginHorizontal: 24, marginBottom: 16, backgroundColor: semantic.errorLight },
    examAlertContent: { flexDirection: "row", alignItems: "center" },
    examAlertText: { color: "#C08080", marginLeft: 12, flex: 1 },
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, padding: 12 },
    statHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    statValue: { color: text.primary, fontWeight: "bold" },
    section: { paddingHorizontal: 24, marginBottom: 20 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitleRow: { flexDirection: "row", alignItems: "center" },
    sectionTitle: { color: text.primary, fontWeight: "600", marginLeft: 8 },
    sectionSubtitle: { color: text.secondary, marginBottom: 12 },
    missedCard: { marginBottom: 10 },
    missedActions: { flexDirection: "row", gap: 8, marginTop: 12 },
    smartCard: { marginBottom: 10 },
    smartContent: { flexDirection: "row", alignItems: "center" },
    smartInfo: { flex: 1, marginLeft: 8 },
    smartTitle: { color: text.primary, marginBottom: 4 },
    smartMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    quickAddCard: { marginHorizontal: 24, marginBottom: 20 },
    quickAddContent: { flexDirection: "row", alignItems: "center" },
    quickAddInput: { flex: 1, backgroundColor: "transparent", fontSize: 14 },
    quickAddButton: { backgroundColor: pastel.mint, borderRadius: borderRadius.pill, padding: 10 },
    quickAddButtonDisabled: { opacity: 0.5 },
    emptyCard: { padding: 24 },
    emptyContent: { alignItems: "center" },
    modal: { backgroundColor: background.card, margin: 20, padding: 24, borderRadius: borderRadius.lg },
    modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    modalTitle: { color: text.primary, fontWeight: "bold", marginLeft: 12 },
    modalSubtitle: { color: text.secondary, marginBottom: 20 },
    modalInput: { marginBottom: 12, backgroundColor: background.primary },
    modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
    priorityRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    startSessionCard: {
        marginHorizontal: 24,
        marginBottom: 16,
        marginTop: 8,
    },
    sessionCardContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
    },
    sessionIcon: {
        marginRight: spacing.md,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        color: text.primary,
        fontWeight: "600",
    },
    sessionSubtitle: {
        color: text.secondary,
        marginTop: 2,
    },

    // Feature Cards
    featureCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
    },
    featureIcon: {
        marginRight: spacing.md,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        color: text.primary,
        fontWeight: "600",
        marginBottom: 2,
    },
    featureDesc: {
        color: text.secondary,
    },
    // Capacity Card Styles
    capacityCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        padding: spacing.md,
    },
    capacityHeader: {
        marginBottom: spacing.sm,
    },
    capacityTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    capacityTitle: {
        color: text.primary,
        fontWeight: '600',
    },
    capacityHint: {
        color: text.secondary,
    },
    capacityMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    capacityMetric: {
        flex: 1,
        alignItems: 'center',
    },
    capacityValue: {
        fontWeight: '700',
        marginBottom: 4,
    },
    capacityLabel: {
        color: text.secondary,
    },
    capacityDivider: {
        width: 1,
        height: 60,
        backgroundColor: pastel.beige,
        marginHorizontal: spacing.md,
    },
});
