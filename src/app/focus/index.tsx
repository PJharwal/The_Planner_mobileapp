import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, AppState, TextInput as RNTextInput } from "react-native";
import { Card, Text, Button, IconButton, useTheme, Chip, Portal, Modal, TextInput } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTimerStore, formatTime, formatMinutes, formatCountdown, TIMER_PRESETS } from "../../store/timerStore";
import { useTaskStore } from "../../store/taskStore";
import { getSmartTodaySuggestions, SuggestedTask } from "../../utils/smartToday";
import { useAuthStore } from "../../store/authStore";

export default function FocusModeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuthStore();
    const {
        isRunning,
        isPaused,
        elapsed,
        targetDuration,
        context,
        todayTotalMinutes,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        tick,
        fetchTodayTotal,
        getTimeRemaining,
        getProgress,
    } = useTimerStore();
    const { toggleTaskComplete } = useTaskStore();

    const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDuration, setSelectedDuration] = useState(25 * 60);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customMinutes, setCustomMinutes] = useState("30");
    const [selectedTask, setSelectedTask] = useState<SuggestedTask | null>(null);

    // Fetch suggestions on mount
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        const result = await getSmartTodaySuggestions(user!.id);
        setSuggestions(result.suggestions.filter(s => !s.task.is_completed).slice(0, 6));
        await fetchTodayTotal();
        setIsLoading(false);
    };

    // Timer tick effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning) {
            interval = setInterval(() => {
                tick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, tick]);

    // Save on app background
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "background" && isRunning) {
                pauseTimer();
            }
        });
        return () => subscription?.remove();
    }, [isRunning]);

    const handleSelectTask = (suggestion: SuggestedTask) => {
        setSelectedTask(suggestion);
    };

    const handleStartSession = () => {
        const focusContext = selectedTask ? {
            taskId: selectedTask.task.id,
            taskTitle: selectedTask.task.title,
            topicId: selectedTask.task.topic_id,
            subjectName: selectedTask.subjectName,
        } : {};

        startTimer(selectedDuration, focusContext);
    };

    const handleCompleteTask = async () => {
        if (context.taskId) {
            await stopTimer();
            await toggleTaskComplete(context.taskId);
            await loadData();
        }
    };

    const handleStop = async () => {
        await stopTimer();
        await loadData();
    };

    const handleCustomDuration = () => {
        const mins = parseInt(customMinutes);
        if (mins > 0 && mins <= 180) {
            setSelectedDuration(mins * 60);
            setShowCustomModal(false);
        }
    };

    const isSessionActive = isRunning || isPaused;
    const timeRemaining = getTimeRemaining();
    const progress = getProgress();

    return (
        <View style={[styles.container, { backgroundColor: "#0A0F1A" }]}>
            <Stack.Screen
                options={{
                    title: "Focus Mode",
                    headerStyle: { backgroundColor: "#0A0F1A" },
                    headerTintColor: "#E5E7EB",
                    headerLeft: () => (
                        <IconButton
                            icon={() => <Ionicons name="close" size={24} color="#E5E7EB" />}
                            onPress={() => {
                                if (isRunning) pauseTimer();
                                router.back();
                            }}
                        />
                    ),
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Timer Display */}
                <View style={styles.timerSection}>
                    <View style={[
                        styles.timerRing,
                        isRunning && styles.timerRingActive,
                        isPaused && styles.timerRingPaused
                    ]}>
                        {targetDuration > 0 ? (
                            <>
                                <Text style={styles.timerText}>{formatCountdown(timeRemaining)}</Text>
                                <Text style={styles.timerLabel}>
                                    {isRunning ? "Focus" : isPaused ? "Paused" : "Ready"}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                                <Text style={styles.timerLabel}>
                                    {isRunning ? "Studying" : "Elapsed"}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Progress indicator */}
                    {isSessionActive && targetDuration > 0 && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                        </View>
                    )}

                    {/* Active task display */}
                    {context.taskTitle && (
                        <View style={styles.activeTaskContainer}>
                            <View style={[styles.taskDot, { backgroundColor: "#38BDF8" }]} />
                            <Text variant="titleMedium" style={styles.activeTask} numberOfLines={2}>
                                {context.taskTitle}
                            </Text>
                        </View>
                    )}
                    {context.subjectName && (
                        <Text variant="bodySmall" style={styles.subjectLabel}>
                            {context.subjectName} • {context.topicName}
                        </Text>
                    )}
                </View>

                {/* Duration Selection (only when not in session) */}
                {!isSessionActive && (
                    <View style={styles.durationSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Duration</Text>
                        <View style={styles.durationChips}>
                            {TIMER_PRESETS.map((preset) => (
                                <Chip
                                    key={preset.value}
                                    selected={selectedDuration === preset.value}
                                    onPress={() => setSelectedDuration(preset.value)}
                                    style={[
                                        styles.durationChip,
                                        selectedDuration === preset.value && styles.durationChipSelected
                                    ]}
                                    textStyle={[
                                        styles.durationChipText,
                                        selectedDuration === preset.value && styles.durationChipTextSelected
                                    ]}
                                >
                                    {preset.label}
                                </Chip>
                            ))}
                            <Chip
                                icon={() => <Ionicons name="create-outline" size={14} color={selectedDuration > 90 * 60 ? "#0A0F1A" : "#9CA3AF"} />}
                                onPress={() => setShowCustomModal(true)}
                                style={[
                                    styles.durationChip,
                                    selectedDuration > 90 * 60 && styles.durationChipSelected
                                ]}
                                textStyle={[
                                    styles.durationChipText,
                                    selectedDuration > 90 * 60 && styles.durationChipTextSelected
                                ]}
                            >
                                Custom
                            </Chip>
                        </View>
                    </View>
                )}

                {/* Controls */}
                <View style={styles.controls}>
                    {isRunning ? (
                        <View style={styles.activeControls}>
                            <Button
                                mode="contained"
                                onPress={pauseTimer}
                                style={styles.pauseButton}
                                contentStyle={styles.buttonContent}
                                icon={() => <Ionicons name="pause" size={24} color="#FFF" />}
                            >
                                Pause
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={handleCompleteTask}
                                style={styles.completeButton}
                                textColor="#22C55E"
                                icon={() => <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
                            >
                                Done
                            </Button>
                        </View>
                    ) : isPaused ? (
                        <View style={styles.activeControls}>
                            <Button
                                mode="contained"
                                onPress={resumeTimer}
                                style={styles.startButton}
                                contentStyle={styles.buttonContent}
                                icon={() => <Ionicons name="play" size={24} color="#FFF" />}
                            >
                                Resume
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={handleStop}
                                style={styles.stopButton}
                                textColor="#EF4444"
                                icon={() => <Ionicons name="stop" size={20} color="#EF4444" />}
                            >
                                Stop
                            </Button>
                        </View>
                    ) : (
                        <Button
                            mode="contained"
                            onPress={handleStartSession}
                            style={styles.startButton}
                            contentStyle={styles.buttonContent}
                            icon={() => <Ionicons name="play" size={24} color="#FFF" />}
                        >
                            Start Focus
                        </Button>
                    )}
                </View>

                {/* Today's Stats */}
                <Card style={styles.statsCard} mode="outlined">
                    <Card.Content style={styles.statsContent}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={20} color="#38BDF8" />
                            <Text variant="titleLarge" style={styles.statValue}>{formatMinutes(todayTotalMinutes)}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Today</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="list-outline" size={20} color="#A855F7" />
                            <Text variant="titleLarge" style={styles.statValue}>{suggestions.length}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Tasks</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Task Selection (only when not in session) */}
                {!isSessionActive && (
                    <View style={styles.taskSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Select Task (Optional)
                        </Text>

                        {suggestions.map((suggestion) => (
                            <Card
                                key={suggestion.task.id}
                                style={[
                                    styles.taskCard,
                                    selectedTask?.task.id === suggestion.task.id && styles.taskCardActive
                                ]}
                                mode="outlined"
                                onPress={() => handleSelectTask(suggestion)}
                            >
                                <Card.Content style={styles.taskContent}>
                                    <View style={[styles.taskDot, { backgroundColor: suggestion.subjectColor || "#38BDF8" }]} />
                                    <View style={styles.taskInfo}>
                                        <Text variant="bodyLarge" style={styles.taskTitle}>{suggestion.task.title}</Text>
                                        <Text variant="bodySmall" style={styles.taskMeta}>{suggestion.subjectName}</Text>
                                    </View>
                                    <Ionicons
                                        name={selectedTask?.task.id === suggestion.task.id ? "radio-button-on" : "radio-button-off"}
                                        size={20}
                                        color={selectedTask?.task.id === suggestion.task.id ? "#38BDF8" : "#64748B"}
                                    />
                                </Card.Content>
                            </Card>
                        ))}

                        {suggestions.length === 0 && !isLoading && (
                            <Card style={styles.emptyCard}>
                                <Card.Content style={styles.emptyContent}>
                                    <Ionicons name="checkmark-done" size={40} color="#22C55E" />
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        All caught up! Start a free focus session.
                                    </Text>
                                </Card.Content>
                            </Card>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Custom Duration Modal */}
            <Portal>
                <Modal visible={showCustomModal} onDismiss={() => setShowCustomModal(false)} contentContainerStyle={styles.modal}>
                    <Text variant="titleLarge" style={styles.modalTitle}>Custom Duration</Text>
                    <TextInput
                        label="Minutes"
                        value={customMinutes}
                        onChangeText={setCustomMinutes}
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.modalInput}
                    />
                    <Text variant="bodySmall" style={styles.modalHint}>Enter 1-180 minutes</Text>
                    <Button mode="contained" onPress={handleCustomDuration} style={styles.modalButton}>
                        Set Duration
                    </Button>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    timerSection: { alignItems: "center", paddingTop: 40, paddingBottom: 24 },
    timerRing: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 4,
        borderColor: "#334155",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F172A",
    },
    timerRingActive: { borderColor: "#38BDF8", shadowColor: "#38BDF8", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
    timerRingPaused: { borderColor: "#F97316" },
    timerText: { fontSize: 48, fontWeight: "bold", color: "#E5E7EB", fontVariant: ["tabular-nums"] },
    timerLabel: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
    progressContainer: { width: "80%", height: 4, backgroundColor: "#334155", borderRadius: 2, marginTop: 24, overflow: "hidden" },
    progressBar: { height: "100%", backgroundColor: "#38BDF8", borderRadius: 2 },
    activeTaskContainer: { flexDirection: "row", alignItems: "center", marginTop: 20, paddingHorizontal: 24 },
    activeTask: { color: "#E5E7EB", flex: 1 },
    subjectLabel: { color: "#9CA3AF", marginTop: 4 },
    taskDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    durationSection: { paddingHorizontal: 24, marginBottom: 24 },
    sectionTitle: { color: "#E5E7EB", fontWeight: "600", marginBottom: 12 },
    durationChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    durationChip: { backgroundColor: "#1E293B" },
    durationChipSelected: { backgroundColor: "#38BDF8" },
    durationChipText: { color: "#9CA3AF" },
    durationChipTextSelected: { color: "#0A0F1A" },
    controls: { paddingHorizontal: 24, marginBottom: 24 },
    activeControls: { flexDirection: "row", gap: 12 },
    startButton: { flex: 1, borderRadius: 12 },
    pauseButton: { flex: 1, borderRadius: 12, backgroundColor: "#F97316" },
    completeButton: { borderRadius: 12, borderColor: "#22C55E" },
    stopButton: { borderRadius: 12, borderColor: "#EF4444" },
    buttonContent: { paddingVertical: 8 },
    statsCard: { marginHorizontal: 24, marginBottom: 24, backgroundColor: "#1E293B" },
    statsContent: { flexDirection: "row", alignItems: "center" },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { color: "#E5E7EB", fontWeight: "bold", marginTop: 4 },
    statLabel: { color: "#9CA3AF" },
    statDivider: { width: 1, height: 40, backgroundColor: "#334155" },
    taskSection: { paddingHorizontal: 24 },
    taskCard: { marginBottom: 10, backgroundColor: "#1E293B" },
    taskCardActive: { borderColor: "#38BDF8", borderWidth: 2 },
    taskContent: { flexDirection: "row", alignItems: "center" },
    taskInfo: { flex: 1 },
    taskTitle: { color: "#E5E7EB" },
    taskMeta: { color: "#9CA3AF" },
    emptyCard: { backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 32 },
    emptyText: { color: "#9CA3AF", marginTop: 12 },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 20 },
    modalInput: { marginBottom: 8, backgroundColor: "#0F172A" },
    modalHint: { color: "#9CA3AF", marginBottom: 16 },
    modalButton: { borderRadius: 12 },
});
