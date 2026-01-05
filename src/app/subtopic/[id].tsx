// Sub-Topic Detail Screen
import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { Text, IconButton, TextInput, Portal, Modal, Snackbar } from "react-native-paper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { Task, SubTopic } from "../../types";
import { addTaskToToday, addSubTopicToToday, isTaskInToday } from "../../utils/addToToday";
import { format } from "date-fns";

// Design tokens
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { glassAccent, glassText, darkBackground, glass } from "../../constants/glassTheme";
// UI Components
import { Chip, Checkbox } from "../../components/ui";
import { GlassCard, GlassButton, MeshGradientBackground } from "../../components/glass";

export default function SubTopicDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();

    const [subTopic, setSubTopic] = useState<SubTopic | null>(null);
    const [topicName, setTopicName] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectColor, setSubjectColor] = useState(glassAccent.mint);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add task modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
    const [isAdding, setIsAdding] = useState(false);

    // Today status
    const [todayStatus, setTodayStatus] = useState<Record<string, boolean>>({});

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const fetchData = useCallback(async () => {
        if (!id) return;

        try {
            const { data: stData } = await supabase
                .from("sub_topics")
                .select(`*, topics (id, name, subjects (id, name, color))`)
                .eq("id", id)
                .single();

            if (stData) {
                setSubTopic(stData);
                setTopicName((stData as any).topics?.name || "");
                setSubjectName((stData as any).topics?.subjects?.name || "");
                setSubjectColor((stData as any).topics?.subjects?.color || glassAccent.mint);
            }

            const { data: tasksData } = await supabase
                .from("tasks")
                .select("*")
                .eq("sub_topic_id", id)
                .order("created_at", { ascending: false });

            setTasks(tasksData || []);

            const statusMap: Record<string, boolean> = {};
            for (const task of tasksData || []) {
                statusMap[task.id] = await isTaskInToday(task.id);
            }
            setTodayStatus(statusMap);
        } catch (error) {
            console.error("Error fetching sub-topic:", error);
        }
        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleToggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = !task.is_completed;
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, is_completed: newStatus, completed_at: newStatus ? new Date().toISOString() : undefined } : t
        ));

        await supabase
            .from("tasks")
            .update({ is_completed: newStatus, completed_at: newStatus ? new Date().toISOString() : null })
            .eq("id", taskId);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !id || !user || !subTopic) return;
        setIsAdding(true);

        try {
            const { error } = await supabase.from("tasks").insert({
                sub_topic_id: id,
                topic_id: subTopic.topic_id,
                user_id: user.id,
                title: newTaskTitle.trim(),
                priority: newTaskPriority,
                due_date: format(new Date(), "yyyy-MM-dd"),
            });

            if (error) {
                Alert.alert("Error", error.message || "Could not add task");
            } else {
                setNewTaskTitle("");
                setNewTaskPriority("medium");
                setShowAddModal(false);
                await fetchData();
                setSnackbarMessage("Task added!");
                setSnackbarVisible(true);
            }
        } catch (error) {
            console.error("Error adding task:", error);
            Alert.alert("Error", "Could not add task. Please try again.");
        }
        setIsAdding(false);
    };

    const handleAddTaskToToday = async (taskId: string) => {
        const result = await addTaskToToday(taskId);
        if (result.success && result.addedCount > 0) {
            setTodayStatus(prev => ({ ...prev, [taskId]: true }));
            setSnackbarMessage(result.message);
            setSnackbarVisible(true);
        }
    };

    const handleAddAllToToday = async () => {
        if (!id) return;
        const result = await addSubTopicToToday(id);
        setSnackbarMessage(result.message);
        setSnackbarVisible(true);
        if (result.success) await fetchData();
    };

    const completedCount = tasks.filter(t => t.is_completed).length;
    const totalCount = tasks.length;
    const pendingCount = totalCount - completedCount;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: subTopic?.name || "Sub-Topic",
                        headerStyle: { backgroundColor: 'transparent' },
                        headerTransparent: true,
                        headerTintColor: glassText.primary,
                        headerShadowVisible: false,
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color={glassText.primary} />}
                                onPress={() => router.back()}
                            />
                        ),
                        headerRight: () => (
                            <IconButton
                                icon={() => <Ionicons name="home-outline" size={22} color={glassText.secondary} />}
                                onPress={() => router.replace("/(tabs)")}
                            />
                        ),
                    }}
                />

                <MeshGradientBackground />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassAccent.mint} />}
                >
                    {/* Header Card */}
                    <GlassCard style={[styles.headerCard, { borderLeftColor: subjectColor, borderLeftWidth: 4 }]}>
                        <View style={styles.headerContent}>
                            <Text variant="bodySmall" style={styles.breadcrumb}>
                                {subjectName} • {topicName}
                            </Text>
                            <Text variant="headlineSmall" style={styles.title}>
                                {subTopic?.name}
                            </Text>
                            <View style={styles.statsRow}>
                                <Chip variant="default" size="sm" style={{ backgroundColor: glassText.muted + '20' }}>{`${completedCount}/${totalCount} completed`}</Chip>
                                {pendingCount > 0 && (
                                    <GlassButton variant="primary" size="sm" onPress={handleAddAllToToday}>
                                        Add all to Today
                                    </GlassButton>
                                )}
                            </View>
                        </View>
                    </GlassCard>

                    {/* Tasks Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Tasks</Text>
                            <GlassButton variant="ghost" size="sm" onPress={() => setShowAddModal(true)}>
                                Add
                            </GlassButton>
                        </View>

                        {tasks.length === 0 ? (
                            <GlassCard style={styles.emptyCard} intensity="light">
                                <View style={styles.emptyContent}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="checkbox-outline" size={32} color={glassText.muted} />
                                    </View>
                                    <Text variant="bodyMedium" style={styles.emptyText}>No tasks yet</Text>
                                    <Text variant="bodySmall" style={styles.emptyHint}>Add your first task to get started</Text>
                                    <GlassButton variant="primary" onPress={() => setShowAddModal(true)} style={styles.emptyButton}>
                                        Add Task
                                    </GlassButton>
                                </View>
                            </GlassCard>
                        ) : (
                            tasks.map(task => (
                                <GlassCard key={task.id} style={[styles.taskCard, task.is_completed && styles.taskCompleted]} intensity="light">
                                    <View style={styles.taskContent}>
                                        <Checkbox
                                            checked={task.is_completed}
                                            onToggle={() => handleToggleTask(task.id)}
                                        />
                                        <View style={styles.taskInfo}>
                                            <Text
                                                variant="bodyLarge"
                                                style={[styles.taskTitle, task.is_completed && styles.taskTitleCompleted]}
                                            >
                                                {task.title}
                                            </Text>
                                        </View>
                                        <Chip
                                            variant={`priority-${task.priority}` as any}
                                            size="sm"
                                        >
                                            {task.priority}
                                        </Chip>
                                        {!task.is_completed && !todayStatus[task.id] && (
                                            <TouchableOpacity
                                                onPress={() => handleAddTaskToToday(task.id)}
                                                style={styles.addButton}
                                            >
                                                <Ionicons name="add-circle-outline" size={22} color={glassAccent.mint} />
                                            </TouchableOpacity>
                                        )}
                                        {todayStatus[task.id] && (
                                            <Ionicons name="checkmark-circle" size={20} color={glassAccent.mint} style={styles.todayIcon} />
                                        )}
                                    </View>
                                </GlassCard>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Add Task Modal */}
                <Portal>
                    <Modal visible={showAddModal} onDismiss={() => setShowAddModal(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Add Task</Text>
                        <TextInput
                            label="Task title"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            mode="outlined"
                            style={styles.modalInput}
                            outlineColor={glass.border.light}
                            activeOutlineColor={glassAccent.mint}
                            textColor={glassText.primary}
                            theme={{ colors: { background: darkBackground.primary, placeholder: glassText.secondary, text: glassText.primary } }}
                        />
                        <Text variant="bodyMedium" style={styles.priorityLabel}>Priority</Text>
                        <View style={styles.priorityRow}>
                            {(["low", "medium", "high"] as const).map(p => (
                                <Chip
                                    key={p}
                                    variant={`priority-${p}` as any}
                                    selected={newTaskPriority === p}
                                    onPress={() => setNewTaskPriority(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Chip>
                            ))}
                        </View>
                        <View style={styles.modalButtons}>
                            <GlassButton variant="ghost" onPress={() => setShowAddModal(false)} style={{ flex: 1 }}>
                                Cancel
                            </GlassButton>
                            <GlassButton variant="primary" onPress={handleAddTask} loading={isAdding} style={{ flex: 1 }}>
                                Add
                            </GlassButton>
                        </View>
                    </Modal>
                </Portal>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={2000}
                    style={styles.snackbar}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: darkBackground.primary },
    scrollContent: { paddingBottom: 100 },
    // Header
    headerCard: { marginHorizontal: 16, marginTop: 120, borderRadius: borderRadius.lg },
    headerContent: { padding: spacing.md },
    breadcrumb: { color: glassText.secondary, marginBottom: 4 },
    title: { color: glassText.primary, fontWeight: "600" },
    statsRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: spacing.sm },
    // Section
    section: { paddingHorizontal: 16, marginTop: spacing.lg },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    sectionTitle: { color: glassText.primary, fontWeight: "600" },
    // Empty State
    emptyCard: {},
    emptyContent: { alignItems: "center", paddingVertical: spacing.xl },
    emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: glassText.muted + '20', alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    emptyText: { color: glassText.primary, fontWeight: "500" },
    emptyHint: { color: glassText.secondary, marginTop: 4 },
    emptyButton: { marginTop: spacing.md },
    // Task Cards
    taskCard: { marginBottom: spacing.sm, padding: 0 },
    taskCompleted: { opacity: 0.6 },
    taskContent: { flexDirection: "row", alignItems: "center", padding: 16 },
    taskInfo: { flex: 1, marginLeft: spacing.xs },
    taskTitle: { color: glassText.primary },
    taskTitleCompleted: { color: glassText.muted, textDecorationLine: "line-through" },
    addButton: { padding: spacing.xs, marginLeft: spacing.xs },
    todayIcon: { marginLeft: spacing.xs },
    // Modal
    modal: { backgroundColor: darkBackground.elevated, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalTitle: { color: glassText.primary, fontWeight: "600", marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.sm, backgroundColor: darkBackground.primary },
    priorityLabel: { color: glassText.secondary, marginBottom: spacing.xs },
    priorityRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
    modalButtons: { flexDirection: "row", gap: spacing.sm },
    // Snackbar
    snackbar: { backgroundColor: glassAccent.blue },
});
