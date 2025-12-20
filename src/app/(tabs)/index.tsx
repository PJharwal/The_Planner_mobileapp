import { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, LayoutAnimation, UIManager } from "react-native";
import { Card, Text, Checkbox, Chip, ProgressBar, TextInput, IconButton, useTheme, Button, Portal, Modal, Searchbar, Snackbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTaskStore } from "../../store/taskStore";
import { useAuthStore } from "../../store/authStore";
import { useReflectionStore } from "../../store/reflectionStore";
import { useUserStore, getGreeting } from "../../store/userStore";
import { Task } from "../../types";
import { format, subDays } from "date-fns";
import { supabase } from "../../lib/supabase";
import { getSmartTodaySuggestions, SuggestedTask, removeSuggestion } from "../../utils/smartToday";
import { getMissedTasks, MissedTask, rescheduleToToday, skipTask, SkipReason } from "../../utils/missedTasks";
import { globalSearch, SearchResult, getSearchIcon, getSearchTypeLabel } from "../../utils/globalSearch";
import { addSubjectToToday, addTopicToToday, addSubTopicToToday, addTaskToToday } from "../../utils/addToToday";

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
    const theme = useTheme();
    const reasonColors: Record<string, string> = {
        exam_soon: "#EF4444",
        missed_yesterday: "#F97316",
        high_priority: "#A855F7",
        due_soon: "#38BDF8",
        balanced: "#22C55E",
    };

    return (
        <Card style={[styles.smartCard, { borderLeftColor: suggestion.subjectColor || theme.colors.primary, borderLeftWidth: 4 }]} mode="outlined">
            <Card.Content style={styles.smartContent}>
                <Checkbox
                    status={suggestion.task.is_completed ? "checked" : "unchecked"}
                    onPress={() => onToggle(suggestion.task.id)}
                    color="#22C55E"
                />
                <View style={styles.smartInfo}>
                    <Text variant="bodyLarge" style={styles.smartTitle}>{suggestion.task.title}</Text>
                    <View style={styles.smartMeta}>
                        <Chip
                            compact
                            style={{ backgroundColor: reasonColors[suggestion.reason] + "20", marginRight: 8 }}
                            textStyle={{ color: reasonColors[suggestion.reason], fontSize: 10 }}
                        >
                            {suggestion.reasonText}
                        </Chip>
                        {suggestion.subjectName && (
                            <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>{suggestion.subjectName}</Text>
                        )}
                    </View>
                </View>
                <IconButton
                    icon={() => <Ionicons name="close" size={16} color="#9CA3AF" />}
                    size={20}
                    onPress={() => onDismiss(suggestion.task.id)}
                />
            </Card.Content>
        </Card>
    );
}

// Regular Task Card with Edit/Delete
function TaskItem({ task, onToggle, onEdit, onDelete }: {
    task: Task;
    onToggle: (id: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}) {
    const priorityColors = { high: "#EF4444", medium: "#FACC15", low: "#22C55E" };

    return (
        <Card style={[styles.taskCard, task.is_completed && styles.taskCompleted]} mode="outlined">
            <Card.Content style={styles.taskContent}>
                <Checkbox
                    status={task.is_completed ? "checked" : "unchecked"}
                    onPress={() => onToggle(task.id)}
                    color="#22C55E"
                />
                <View style={styles.taskInfo}>
                    <Text variant="bodyLarge" style={[styles.taskTitle, task.is_completed && styles.taskTitleCompleted]}>
                        {task.title}
                    </Text>
                </View>
                <View style={styles.taskActions}>
                    <Chip
                        compact
                        style={{ backgroundColor: priorityColors[task.priority || "medium"] + "20" }}
                        textStyle={{ color: priorityColors[task.priority || "medium"], fontSize: 10 }}
                    >
                        {task.priority}
                    </Chip>
                    <IconButton
                        icon={() => <Ionicons name="pencil-outline" size={16} color="#9CA3AF" />}
                        size={18}
                        onPress={() => onEdit(task)}
                    />
                    <IconButton
                        icon={() => <Ionicons name="trash-outline" size={16} color="#EF4444" />}
                        size={18}
                        onPress={() => onDelete(task.id)}
                    />
                </View>
            </Card.Content>
        </Card>
    );
}

export default function HomeScreen() {
    const theme = useTheme();
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

    useEffect(() => {
        if (user) {
            fetchTodayTasks();
            fetchStreak();
            fetchPendingCount();
            fetchSmartToday();
            fetchMissedTasks();
            fetchTodayReflection();
            fetchProfile();
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

    const fetchStreak = async () => {
        if (!user) return;
        setIsLoadingStreak(true);
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
        setIsLoadingStreak(false);
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
        await Promise.all([fetchTodayTasks(), fetchStreak(), fetchPendingCount(), fetchSmartToday(), fetchMissedTasks()]);
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
        if (!quickTaskTitle.trim()) return;
        setIsAddingTask(true);
        try {
            // Get the first sub-topic to add the task to
            const { data: subTopics } = await supabase.from("sub_topics").select("id").limit(1);
            if (subTopics && subTopics.length > 0) {
                await createTask({
                    sub_topic_id: subTopics[0].id,
                    title: quickTaskTitle.trim(),
                    priority: "medium",
                    due_date: format(new Date(), "yyyy-MM-dd")
                });
                setQuickTaskTitle("");
                await Promise.all([fetchTodayTasks(), fetchSmartToday()]);
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

    const completedCount = todayTasks.filter((t) => t.is_completed).length;
    const totalCount = todayTasks.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

    if (tasksLoading && todayTasks.length === 0 && isLoadingSmart) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {format(new Date(), "EEEE, MMMM d")}
                        </Text>
                        <TouchableOpacity onPress={handleOpenNameModal} style={styles.greetingRow}>
                            <Text variant="headlineLarge" style={styles.greeting}>
                                {getGreeting()}, {displayName || user?.full_name?.split(" ")[0] || "Student"} 👋
                            </Text>
                            <Ionicons name="pencil-outline" size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Searchbar
                            placeholder="Search subjects, tasks, notes..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                            style={styles.searchBar}
                            inputStyle={styles.searchInput}
                            iconColor="#9CA3AF"
                        />
                        {searchResults.length > 0 && (
                            <Card style={styles.searchResults}>
                                {searchResults.slice(0, 6).map((result) => (
                                    <Card key={result.id} style={styles.searchResultItem} onPress={() => handleSearchSelect(result)}>
                                        <Card.Content style={styles.searchResultContent}>
                                            <Ionicons name={getSearchIcon(result.type) as any} size={16} color={result.color || "#38BDF8"} />
                                            <View style={styles.searchResultInfo}>
                                                <Text variant="bodyMedium" style={{ color: "#E5E7EB" }}>{result.title}</Text>
                                                <View style={styles.searchResultMeta}>
                                                    <Chip compact style={styles.searchTypeBadge} textStyle={styles.searchTypeBadgeText}>
                                                        {getSearchTypeLabel(result.type)}
                                                    </Chip>
                                                    <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>{result.subtitle}</Text>
                                                </View>
                                            </View>
                                            {result.type !== "note" && (
                                                <IconButton
                                                    icon={() => <Ionicons name="add-circle-outline" size={20} color="#38BDF8" />}
                                                    size={20}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleSearchAddToToday(result);
                                                    }}
                                                />
                                            )}
                                        </Card.Content>
                                    </Card>
                                ))}
                            </Card>
                        )}
                    </View>

                    {/* Exam Alert */}
                    {examDaysAway !== null && examDaysAway <= 7 && (
                        <Card style={styles.examAlert} mode="outlined">
                            <Card.Content style={styles.examAlertContent}>
                                <Ionicons name="warning" size={20} color="#EF4444" />
                                <Text variant="bodyMedium" style={styles.examAlertText}>
                                    Exam in {examDaysAway} days! Focus on exam tasks.
                                </Text>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Stats Cards */}
                    <View style={styles.statsRow}>
                        <Card style={[styles.statCard, { borderLeftColor: theme.colors.primary, borderLeftWidth: 3 }]} mode="outlined">
                            <Card.Content>
                                <View style={styles.statHeader}>
                                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                                    <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>Today</Text>
                                </View>
                                <Text variant="titleLarge" style={styles.statValue}>{completedCount}/{totalCount}</Text>
                                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                            </Card.Content>
                        </Card>
                        <Card style={[styles.statCard, { borderLeftColor: "#F97316", borderLeftWidth: 3 }]} mode="outlined">
                            <Card.Content>
                                <View style={styles.statHeader}>
                                    <Ionicons name="flame" size={16} color="#F97316" />
                                    <Text variant="labelSmall" style={{ color: "#F97316", marginLeft: 4 }}>Streak</Text>
                                </View>
                                <Text variant="titleLarge" style={styles.statValue}>
                                    {isLoadingStreak ? "-" : `${streak}d`}
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={[styles.statCard, { borderLeftColor: "#A855F7", borderLeftWidth: 3 }]} mode="outlined" onPress={() => (router as any).push("/focus")}>
                            <Card.Content>
                                <View style={styles.statHeader}>
                                    <Ionicons name="timer" size={16} color="#A855F7" />
                                    <Text variant="labelSmall" style={{ color: "#A855F7", marginLeft: 4 }}>Focus</Text>
                                </View>
                                <Text variant="titleLarge" style={styles.statValue}>Start</Text>
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Missed Tasks Recovery */}
                    {missedTasks.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="alert-circle" size={20} color="#F97316" />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Missed Tasks</Text>
                                </View>
                            </View>
                            {missedTasks.map((missed) => (
                                <Card key={missed.task.id} style={styles.missedCard} mode="outlined">
                                    <Card.Content>
                                        <Text variant="bodyLarge" style={{ color: "#E5E7EB" }}>{missed.task.title}</Text>
                                        <Text variant="bodySmall" style={{ color: "#F97316", marginTop: 4 }}>
                                            Missed {missed.daysMissed} day{missed.daysMissed > 1 ? 's' : ''} ago
                                        </Text>
                                        <View style={styles.missedActions}>
                                            <Button mode="contained" compact onPress={() => handleReschedule(missed.task.id)} style={styles.rescheduleBtn}>
                                                Reschedule
                                            </Button>
                                            <Button mode="outlined" compact onPress={() => handleSkipTask(missed.task.id, 'no_time')} textColor="#9CA3AF">
                                                Skip
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </View>
                    )}

                    {/* Smart Today Section */}
                    {smartSuggestions.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="sparkles" size={20} color="#38BDF8" />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Smart Today</Text>
                                </View>
                                <Chip compact style={{ backgroundColor: "#38BDF820" }} textStyle={{ color: "#38BDF8", fontSize: 10 }}>
                                    AI Suggested
                                </Chip>
                            </View>
                            <Text variant="bodySmall" style={styles.sectionSubtitle}>
                                Your personalized study plan for today
                            </Text>

                            {smartSuggestions.map((suggestion) => (
                                <SmartTaskCard
                                    key={suggestion.task.id}
                                    suggestion={suggestion}
                                    onToggle={handleToggleSmart}
                                    onDismiss={handleDismissSuggestion}
                                />
                            ))}
                        </View>
                    )}

                    {/* Quick Add Task */}
                    <Card style={styles.quickAddCard} mode="outlined">
                        <Card.Content style={styles.quickAddContent}>
                            <Ionicons name="add-circle-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Add a quick task..."
                                value={quickTaskTitle}
                                onChangeText={setQuickTaskTitle}
                                mode="flat"
                                style={styles.quickAddInput}
                                underlineStyle={{ display: 'none' }}
                                onSubmitEditing={handleQuickAdd}
                            />
                            <IconButton
                                icon={() => <Ionicons name="send" size={18} color="#FFF" />}
                                mode="contained"
                                onPress={handleQuickAdd}
                                style={{ backgroundColor: theme.colors.primary }}
                                disabled={isAddingTask || !quickTaskTitle.trim()}
                                size={18}
                            />
                        </Card.Content>
                    </Card>

                    {/* Today's Tasks - Collapsible */}
                    <View style={styles.section}>
                        <TouchableOpacity onPress={toggleTodayCollapse} activeOpacity={0.7}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Ionicons name="today" size={20} color="#E5E7EB" />
                                    <Text variant="titleMedium" style={styles.sectionTitle}>
                                        Today ({totalCount} tasks)
                                    </Text>
                                </View>
                                <Ionicons
                                    name={todayCollapsed ? "chevron-forward" : "chevron-down"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </View>
                        </TouchableOpacity>

                        {!todayCollapsed && (
                            <>
                                {todayTasks.length === 0 ? (
                                    <Card style={styles.emptyCard}>
                                        <Card.Content style={styles.emptyContent}>
                                            <Ionicons name="checkbox-outline" size={40} color="#9CA3AF" />
                                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
                                                No tasks due today.{"\n"}Add some from Subjects.
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                ) : (
                                    todayTasks.map((task) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={toggleTaskComplete}
                                            onEdit={handleEditTask}
                                            onDelete={handleDeleteTask}
                                        />
                                    ))
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>

                {/* Reflection Modal */}
                <Portal>
                    <Modal visible={reflectionVisible} onDismiss={() => { setReflectionVisible(false); markPromptShown(); }} contentContainerStyle={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="bulb" size={24} color="#FACC15" />
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
                        />
                        <TextInput
                            label="What was difficult?"
                            value={reflectionDifficult}
                            onChangeText={setReflectionDifficult}
                            mode="outlined"
                            style={styles.modalInput}
                            maxLength={200}
                        />
                        <View style={styles.modalButtons}>
                            <Button mode="outlined" onPress={() => { setReflectionVisible(false); markPromptShown(); }} textColor="#9CA3AF">
                                Skip
                            </Button>
                            <Button mode="contained" onPress={handleSaveReflection}>
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
                        />
                        <View style={styles.modalButtons}>
                            <Button mode="outlined" onPress={() => setNameModalVisible(false)} textColor="#9CA3AF">
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleSaveName} loading={isSavingName} disabled={isSavingName || !editName.trim()}>
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
                        />
                        <Text variant="bodyMedium" style={{ color: "#9CA3AF", marginBottom: 8 }}>Priority</Text>
                        <View style={styles.priorityRow}>
                            {(["low", "medium", "high"] as const).map((p) => (
                                <Chip
                                    key={p}
                                    selected={editTaskPriority === p}
                                    onPress={() => setEditTaskPriority(p)}
                                    style={[
                                        styles.priorityChip,
                                        editTaskPriority === p && {
                                            backgroundColor: p === "high" ? "#EF444420" : p === "medium" ? "#FACC1520" : "#22C55E20"
                                        }
                                    ]}
                                    textStyle={{
                                        color: editTaskPriority === p
                                            ? (p === "high" ? "#EF4444" : p === "medium" ? "#FACC15" : "#22C55E")
                                            : "#9CA3AF"
                                    }}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Chip>
                            ))}
                        </View>
                        <View style={styles.modalButtons}>
                            <Button mode="outlined" onPress={() => setTaskEditVisible(false)} textColor="#9CA3AF">
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleSaveTask} loading={isSavingTask} disabled={isSavingTask || !editTaskTitle.trim()}>
                                Save
                            </Button>
                        </View>
                    </Modal>
                </Portal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    greeting: { color: "#E5E7EB", fontWeight: "bold", marginTop: 4 },
    greetingRow: { flexDirection: "row", alignItems: "center" },
    searchContainer: { paddingHorizontal: 24, marginBottom: 16, zIndex: 100 },
    searchBar: { backgroundColor: "#1E293B", borderRadius: 12 },
    searchInput: { color: "#E5E7EB" },
    searchResults: { position: "absolute", top: 56, left: 24, right: 24, backgroundColor: "#1E293B", borderRadius: 12, zIndex: 999 },
    searchResultItem: { backgroundColor: "transparent" },
    searchResultContent: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
    searchResultInfo: { marginLeft: 12, flex: 1 },
    examAlert: { marginHorizontal: 24, marginBottom: 16, backgroundColor: "#EF444420", borderColor: "#EF4444" },
    examAlertContent: { flexDirection: "row", alignItems: "center" },
    examAlertText: { color: "#EF4444", marginLeft: 12, flex: 1 },
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: "#1E293B" },
    statHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    statValue: { color: "#E5E7EB", fontWeight: "bold" },
    progressBar: { marginTop: 8, height: 4, borderRadius: 2 },
    section: { paddingHorizontal: 24, marginBottom: 20 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitleRow: { flexDirection: "row", alignItems: "center" },
    sectionTitle: { color: "#E5E7EB", fontWeight: "600", marginLeft: 8 },
    sectionSubtitle: { color: "#9CA3AF", marginBottom: 12 },
    missedCard: { backgroundColor: "#1E293B", marginBottom: 10, borderColor: "#F97316" },
    missedActions: { flexDirection: "row", gap: 8, marginTop: 12 },
    rescheduleBtn: { borderRadius: 8 },
    smartCard: { marginBottom: 10, backgroundColor: "#1E293B" },
    smartContent: { flexDirection: "row", alignItems: "center" },
    smartInfo: { flex: 1, marginLeft: 4 },
    smartTitle: { color: "#E5E7EB", marginBottom: 4 },
    smartMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    quickAddCard: { marginHorizontal: 24, marginBottom: 20, backgroundColor: "#1E293B" },
    quickAddContent: { flexDirection: "row", alignItems: "center" },
    quickAddInput: { flex: 1, backgroundColor: "transparent", fontSize: 14 },
    emptyCard: { backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 32 },
    taskCard: { marginBottom: 10, backgroundColor: "#1E293B" },
    taskCompleted: { opacity: 0.6 },
    taskContent: { flexDirection: "row", alignItems: "center" },
    taskInfo: { flex: 1, marginLeft: 4 },
    taskTitle: { color: "#E5E7EB" },
    taskTitleCompleted: { color: "#9CA3AF", textDecorationLine: "line-through" },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold", marginLeft: 12 },
    modalSubtitle: { color: "#9CA3AF", marginBottom: 20 },
    modalInput: { marginBottom: 12, backgroundColor: "#0F172A" },
    modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
    taskActions: { flexDirection: "row", alignItems: "center", gap: 4 },
    priorityRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    priorityChip: { backgroundColor: "#334155" },
    searchResultMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    searchTypeBadge: { backgroundColor: "#334155", height: 20 },
    searchTypeBadgeText: { color: "#9CA3AF", fontSize: 9 },
});
