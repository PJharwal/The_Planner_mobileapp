// Sub-Topic Detail Screen
import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { Card, Text, Button, IconButton, TextInput, useTheme, Checkbox, Portal, Modal, Chip, Snackbar } from "react-native-paper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { Task, SubTopic } from "../../types";
import { addTaskToToday, addSubTopicToToday, isTaskInToday } from "../../utils/addToToday";

export default function SubTopicDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuthStore();

    const [subTopic, setSubTopic] = useState<SubTopic | null>(null);
    const [topicName, setTopicName] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectColor, setSubjectColor] = useState("#38BDF8");
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
            // Fetch sub-topic with topic and subject info
            const { data: stData } = await supabase
                .from("sub_topics")
                .select(`
                    *,
                    topics (
                        id, name,
                        subjects (id, name, color)
                    )
                `)
                .eq("id", id)
                .single();

            if (stData) {
                setSubTopic(stData);
                setTopicName((stData as any).topics?.name || "");
                setSubjectName((stData as any).topics?.subjects?.name || "");
                setSubjectColor((stData as any).topics?.subjects?.color || "#38BDF8");
            }

            // Fetch tasks
            const { data: tasksData } = await supabase
                .from("tasks")
                .select("*")
                .eq("sub_topic_id", id)
                .order("created_at", { ascending: false });

            setTasks(tasksData || []);

            // Check which tasks are in Today
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

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, is_completed: newStatus, completed_at: newStatus ? new Date().toISOString() : undefined } : t
        ));

        await supabase
            .from("tasks")
            .update({
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            })
            .eq("id", taskId);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !id || !user) return;
        setIsAdding(true);

        try {
            const { error } = await supabase.from("tasks").insert({
                sub_topic_id: id,
                user_id: user.id,
                title: newTaskTitle.trim(),
                priority: newTaskPriority,
            });

            if (!error) {
                setNewTaskTitle("");
                setNewTaskPriority("medium");
                setShowAddModal(false);
                await fetchData();
            }
        } catch (error) {
            console.error("Error adding task:", error);
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
        if (result.success) {
            await fetchData();
        }
    };

    const completedCount = tasks.filter(t => t.is_completed).length;
    const totalCount = tasks.length;
    const pendingCount = totalCount - completedCount;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

    const priorityColors = { high: "#EF4444", medium: "#FACC15", low: "#22C55E" };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen
                    options={{
                        title: subTopic?.name || "Sub-Topic",
                        headerStyle: { backgroundColor: "#0A0F1A" },
                        headerTintColor: "#E5E7EB",
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color="#E5E7EB" />}
                                onPress={() => router.back()}
                            />
                        ),
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                >
                    {/* Header Card */}
                    <Card style={[styles.headerCard, { borderLeftColor: subjectColor, borderLeftWidth: 4 }]} mode="outlined">
                        <Card.Content>
                            <Text variant="bodySmall" style={styles.breadcrumb}>
                                {subjectName} • {topicName}
                            </Text>
                            <Text variant="headlineSmall" style={styles.title}>
                                {subTopic?.name}
                            </Text>
                            <View style={styles.statsRow}>
                                <Chip compact style={styles.statChip} textStyle={styles.statChipText}>
                                    {completedCount}/{totalCount} completed
                                </Chip>
                                {pendingCount > 0 && (
                                    <Button
                                        mode="contained"
                                        compact
                                        onPress={handleAddAllToToday}
                                        icon={() => <Ionicons name="add-circle" size={16} color="#FFF" />}
                                        style={styles.addAllButton}
                                    >
                                        Add all to Today
                                    </Button>
                                )}
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Tasks Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Tasks</Text>
                            <IconButton
                                icon={() => <Ionicons name="add" size={20} color="#38BDF8" />}
                                onPress={() => setShowAddModal(true)}
                            />
                        </View>

                        {tasks.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <Card.Content style={styles.emptyContent}>
                                    <Ionicons name="checkbox-outline" size={40} color="#9CA3AF" />
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        No tasks yet. Add your first task!
                                    </Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            tasks.map(task => (
                                <Card key={task.id} style={[styles.taskCard, task.is_completed && styles.taskCompleted]} mode="outlined">
                                    <Card.Content style={styles.taskContent}>
                                        <Checkbox
                                            status={task.is_completed ? "checked" : "unchecked"}
                                            onPress={() => handleToggleTask(task.id)}
                                            color="#22C55E"
                                        />
                                        <View style={styles.taskInfo}>
                                            <Text variant="bodyLarge" style={[styles.taskTitle, task.is_completed && styles.taskTitleCompleted]}>
                                                {task.title}
                                            </Text>
                                        </View>
                                        <Chip
                                            compact
                                            style={{ backgroundColor: priorityColors[task.priority] + "20", marginRight: 8 }}
                                            textStyle={{ color: priorityColors[task.priority], fontSize: 10 }}
                                        >
                                            {task.priority}
                                        </Chip>
                                        {!task.is_completed && !todayStatus[task.id] && (
                                            <IconButton
                                                icon={() => <Ionicons name="add-circle-outline" size={20} color="#38BDF8" />}
                                                size={20}
                                                onPress={() => handleAddTaskToToday(task.id)}
                                            />
                                        )}
                                        {todayStatus[task.id] && (
                                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ marginRight: 8 }} />
                                        )}
                                    </Card.Content>
                                </Card>
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
                        />
                        <Text variant="bodyMedium" style={styles.priorityLabel}>Priority</Text>
                        <View style={styles.priorityRow}>
                            {(["low", "medium", "high"] as const).map(p => (
                                <Chip
                                    key={p}
                                    selected={newTaskPriority === p}
                                    onPress={() => setNewTaskPriority(p)}
                                    style={[
                                        styles.priorityChip,
                                        newTaskPriority === p && { backgroundColor: priorityColors[p] + "20" }
                                    ]}
                                    textStyle={{ color: newTaskPriority === p ? priorityColors[p] : "#9CA3AF" }}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Chip>
                            ))}
                        </View>
                        <View style={styles.modalButtons}>
                            <Button mode="outlined" onPress={() => setShowAddModal(false)} textColor="#9CA3AF">
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleAddTask} loading={isAdding} disabled={isAdding || !newTaskTitle.trim()}>
                                Add
                            </Button>
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
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    headerCard: { margin: 16, backgroundColor: "#1E293B" },
    breadcrumb: { color: "#9CA3AF", marginBottom: 4 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    statsRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 12 },
    statChip: { backgroundColor: "#334155" },
    statChipText: { color: "#9CA3AF", fontSize: 12 },
    addAllButton: { borderRadius: 8 },
    section: { paddingHorizontal: 16 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitle: { color: "#E5E7EB", fontWeight: "600" },
    emptyCard: { backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 32 },
    emptyText: { color: "#9CA3AF", marginTop: 12 },
    taskCard: { marginBottom: 10, backgroundColor: "#1E293B" },
    taskCompleted: { opacity: 0.6 },
    taskContent: { flexDirection: "row", alignItems: "center" },
    taskInfo: { flex: 1, marginLeft: 4 },
    taskTitle: { color: "#E5E7EB" },
    taskTitleCompleted: { color: "#9CA3AF", textDecorationLine: "line-through" },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 16 },
    modalInput: { marginBottom: 12, backgroundColor: "#0F172A" },
    priorityLabel: { color: "#9CA3AF", marginBottom: 8 },
    priorityRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    priorityChip: { backgroundColor: "#334155" },
    modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
    snackbar: { backgroundColor: "#1E293B" },
});
