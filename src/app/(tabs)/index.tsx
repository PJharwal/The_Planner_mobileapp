import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
} from "react-native";
import { useTaskStore } from "../../store/taskStore";
import { useAuthStore } from "../../store/authStore";
import { Task } from "../../types";
import { format } from "date-fns";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../constants/theme";

// Progress Bar Component
function ProgressBar({ progress }: { progress: number }) {
    return (
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%` }]} />
        </View>
    );
}

// Task Item Component
function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
    const priorityColors = {
        high: { bg: colors.priority.highBg, text: colors.priority.high },
        medium: { bg: colors.priority.mediumBg, text: colors.priority.medium },
        low: { bg: colors.priority.lowBg, text: colors.priority.low },
    };
    const priorityStyle = priorityColors[task.priority || 'medium'];

    return (
        <TouchableOpacity
            onPress={() => onToggle(task.id)}
            style={[styles.taskItem, task.is_completed && styles.taskItemCompleted]}
        >
            <View style={[styles.checkbox, task.is_completed && styles.checkboxChecked]}>
                {task.is_completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.is_completed && styles.taskTitleCompleted]}>
                    {task.title}
                </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                    {task.priority}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function HomeScreen() {
    const { user } = useAuthStore();
    const { todayTasks, fetchTodayTasks, toggleTaskComplete } = useTaskStore();
    const [refreshing, setRefreshing] = useState(false);
    const [quickTaskTitle, setQuickTaskTitle] = useState("");

    useEffect(() => {
        fetchTodayTasks();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTodayTasks();
        setRefreshing(false);
    };

    const completedCount = todayTasks.filter((t) => t.is_completed).length;
    const totalCount = todayTasks.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const streak = 7; // Placeholder

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary[400]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.dateText}>
                        {format(new Date(), "EEEE, MMMM d")}
                    </Text>
                    <Text style={styles.greeting}>
                        Hello, {user?.full_name?.split(" ")[0] || "Student"} 👋
                    </Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={[styles.statsCard, styles.progressCard]}>
                        <Text style={styles.statsLabel}>Daily Progress</Text>
                        <Text style={styles.statsValue}>
                            {completedCount}/{totalCount}
                        </Text>
                        <View style={styles.progressContainer}>
                            <ProgressBar progress={progress} />
                        </View>
                    </View>

                    <View style={[styles.statsCard, styles.streakCard]}>
                        <Text style={styles.statsLabel}>Study Streak</Text>
                        <Text style={styles.statsValue}>🔥 {streak} days</Text>
                        <Text style={styles.statsHint}>Keep it up!</Text>
                    </View>
                </View>

                {/* Quick Add Task */}
                <View style={styles.quickAddContainer}>
                    <View style={styles.quickAddRow}>
                        <TextInput
                            style={styles.quickAddInput}
                            placeholder="Quick add task for today..."
                            placeholderTextColor={colors.text.muted}
                            value={quickTaskTitle}
                            onChangeText={setQuickTaskTitle}
                        />
                        <TouchableOpacity style={styles.quickAddButton}>
                            <Text style={styles.quickAddButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Tasks */}
                <View style={styles.tasksSection}>
                    <Text style={styles.sectionTitle}>Today's Tasks</Text>

                    {todayTasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>🎯</Text>
                            <Text style={styles.emptyText}>
                                No tasks for today!{"\n"}Add some to get started.
                            </Text>
                        </View>
                    ) : (
                        todayTasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTaskComplete}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: spacing.xxl,
        paddingTop: 60,
        paddingBottom: spacing.xxl,
    },
    dateText: {
        fontSize: fontSize.md,
        color: colors.text.muted,
    },
    greeting: {
        fontSize: fontSize.xxxl,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },
    statsRow: {
        flexDirection: "row",
        paddingHorizontal: spacing.xxl,
        gap: spacing.lg,
        marginBottom: spacing.xxl,
    },
    statsCard: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.xxl,
        ...shadows.md,
    },
    progressCard: {
        backgroundColor: colors.primary[400] + '15',
        borderWidth: 1,
        borderColor: colors.primary[400] + '30',
    },
    streakCard: {
        backgroundColor: colors.accent[500] + '15',
        borderWidth: 1,
        borderColor: colors.accent[500] + '30',
    },
    statsLabel: {
        fontSize: fontSize.sm,
        color: colors.primary[400],
    },
    statsValue: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },
    statsHint: {
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: spacing.sm,
    },
    progressContainer: {
        marginTop: spacing.md,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: colors.dark[700],
        borderRadius: borderRadius.full,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: colors.primary[400],
        borderRadius: borderRadius.full,
    },
    quickAddContainer: {
        paddingHorizontal: spacing.xxl,
        marginBottom: spacing.xxl,
    },
    quickAddRow: {
        flexDirection: "row",
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: "hidden",
    },
    quickAddInput: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.text.primary,
    },
    quickAddButton: {
        backgroundColor: colors.primary[400],
        paddingHorizontal: spacing.xl,
        alignItems: "center",
        justifyContent: "center",
    },
    quickAddButtonText: {
        color: colors.white,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
    tasksSection: {
        paddingHorizontal: spacing.xxl,
    },
    sectionTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxxl + spacing.lg,
        backgroundColor: colors.card,
        borderRadius: borderRadius.xxl,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: colors.text.muted,
        textAlign: "center",
    },
    taskItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.lg,
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    taskItemCompleted: {
        borderColor: colors.primary[400] + '30',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: colors.dark[500],
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.lg,
    },
    checkboxChecked: {
        backgroundColor: colors.primary[400],
        borderColor: colors.primary[400],
    },
    checkmark: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: fontSize.md,
        color: colors.text.primary,
    },
    taskTitleCompleted: {
        color: colors.text.muted,
        textDecorationLine: "line-through",
    },
    priorityBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    priorityText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
});
