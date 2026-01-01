import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, AppState, Platform } from "react-native";
import { Text, IconButton, Portal, Modal, TextInput, Snackbar } from "react-native-paper";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTimerStore, formatTime, formatMinutes, formatCountdown, getTimerPresets } from "../../store/timerStore";
import { useCapacityStore } from "../../store/capacityStore";
import { useTaskStore } from "../../store/taskStore";
import { getSmartTodaySuggestions, SuggestedTask } from "../../utils/smartToday";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import { ADAPTIVE_PLANS } from "../../utils/adaptivePlans";

// Design tokens
import { focus, pastel, text, spacing, borderRadius, shadows } from "../../constants/theme";
// UI Components
import { Card, Button, Chip, SessionQualityModal } from "../../components/ui";
import { saveFocusSession } from "../../utils/sessionTaskLinker";
import { SessionQualityPrompt } from "../../components/session/SessionQualityPrompt";

export default function FocusModeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { profile } = useProfileStore();
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
        tick,
        fetchTodayTotal,
        getTimeRemaining,
        getProgress,
        showQualityPrompt,
        lastSessionMinutes,
        submitSessionQuality,
        dismissQualityPrompt,
    } = useTimerStore();
    const { toggleTaskComplete } = useTaskStore();

    // Get default session length from user's adaptive plan
    const getDefaultSessionLength = () => {
        if (!profile?.selected_plan_id) return 25 * 60; // Default 25 min
        const selectedPlan = ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id);
        return selectedPlan ? selectedPlan.default_session_length * 60 : 25 * 60;
    };

    const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Get capacity for personalized defaults
    const { capacity } = useCapacityStore();
    const timerPresets = getTimerPresets(capacity);
    const defaultDuration = capacity ? capacity.default_focus_minutes * 60 : 25 * 60;

    const [selectedDuration, setSelectedDuration] = useState(defaultDuration);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customMinutes, setCustomMinutes] = useState("30");
    const [selectedTask, setSelectedTask] = useState<SuggestedTask | null>(null);
    const [breakSnackbarVisible, setBreakSnackbarVisible] = useState(false);
    const [showLocalQualityPrompt, setShowLocalQualityPrompt] = useState(false);
    const [completedSessionMinutes, setCompletedSessionMinutes] = useState(0);
    const [pendingSessionQuality, setPendingSessionQuality] = useState<'focused' | 'okay' | 'distracted' | null>(null);

    // Session config from route params (when started from Home)
    const sessionConfig = {
        subjectId: typeof params.subjectId === 'string' ? params.subjectId : '',
        topicId: typeof params.topicId === 'string' && params.topicId ? params.topicId : undefined,
        subTopicId: typeof params.subTopicId === 'string' && params.subTopicId ? params.subTopicId : undefined,
        note: typeof params.note === 'string' && params.note ? params.note : undefined,
    };

    // Update default duration when profile changes
    useEffect(() => {
        setSelectedDuration(getDefaultSessionLength());
    }, [profile?.selected_plan_id]);

    // Feature: Break Guidance (profile-aware)
    useEffect(() => {
        const selectedPlan = profile?.selected_plan_id
            ? ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)
            : null;
        const breakFrequency = selectedPlan?.break_frequency || 60; // minutes

        // Suggest break based on profile
        if (elapsed > 0 && elapsed % (breakFrequency * 60) === 0) {
            setBreakSnackbarVisible(true);
        }
    }, [elapsed, profile?.selected_plan_id]);

    // Auto-start if coming from Home with session config
    useEffect(() => {
        if (params.autoStart === 'true' && sessionConfig.subjectId && !isRunning) {
            const duration = params.duration ? parseInt(params.duration as string) * 60 : selectedDuration;
            setSelectedDuration(duration);
            // Use setTimeout to ensure state is ready
            setTimeout(() => {
                startTimer(duration);
            }, 100);
        }
    }, [params.autoStart]);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        const result = await getSmartTodaySuggestions(user!.id);
        setSuggestions(result.suggestions.filter(s => !s.task.is_completed).slice(0, 6));
        await fetchTodayTotal();
        setIsLoading(false);
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning) {
            interval = setInterval(() => tick(), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, tick]);

    // AppState listener removed to allow timer to run in background
    // Timer store uses diff-based calculation (now - start) so it auto-recovers on resume


    const handleSelectTask = (suggestion: SuggestedTask) => setSelectedTask(suggestion);

    const handleStartSession = () => {
        const focusContext = selectedTask ? {
            taskId: selectedTask.task.id,
            taskTitle: selectedTask.task.title,
            topicId: selectedTask.task.topic_id || undefined,
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
        const sessionMinutes = Math.floor(elapsed / 60);
        const requireQuality = profile?.selected_plan_id
            ? ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)?.require_session_quality
            : false;

        // Save session if we have session config from Home
        if (sessionConfig.subjectId && elapsed > 0) {
            // Show quality prompt if required by plan
            if (requireQuality && sessionMinutes >= 1) {
                setCompletedSessionMinutes(sessionMinutes);
                setShowLocalQualityPrompt(true);
            } else {
                // Save without quality
                await saveFocusSession(
                    {
                        ...sessionConfig,
                        sessionDuration: Math.floor(targetDuration / 60),
                    },
                    elapsed,
                    undefined
                );
            }
        }

        await stopTimer();
        await loadData();
    };

    const handleQualitySelect = async (quality: 'focused' | 'okay' | 'distracted') => {
        // Save session with quality rating
        if (sessionConfig.subjectId) {
            await saveFocusSession(
                {
                    ...sessionConfig,
                    sessionDuration: completedSessionMinutes,
                },
                completedSessionMinutes * 60,
                quality
            );
        }
        setShowLocalQualityPrompt(false);
        setPendingSessionQuality(null);
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
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Focus Mode",
                    headerStyle: { backgroundColor: focus.background },
                    headerTintColor: focus.text,
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <IconButton
                            icon={() => <Ionicons name="close" size={24} color={focus.text} />}
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
                            <View style={[styles.taskDot, { backgroundColor: focus.accent }]} />
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

                {/* Duration Selection */}
                {!isSessionActive && (
                    <View style={styles.durationSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Duration</Text>
                        {capacity && (
                            <Text variant="bodySmall" style={{ color: text.secondary, marginBottom: spacing.xs }}>
                                Recommended for you: {capacity.default_focus_minutes} minutes
                            </Text>
                        )}
                        <View style={styles.durationChips}>
                            {timerPresets.map((preset) => (
                                <Chip
                                    key={preset.value}
                                    variant={selectedDuration === preset.value ? "primary" : "default"}
                                    onPress={() => setSelectedDuration(preset.value)}
                                    selected={selectedDuration === preset.value}
                                >
                                    {preset.label}
                                </Chip>
                            ))}
                            <Chip
                                variant={timerPresets.every(p => p.value !== selectedDuration) ? "primary" : "default"}
                                onPress={() => setShowCustomModal(true)}
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
                            <Button variant="secondary" onPress={pauseTimer} style={styles.controlButton}>
                                Pause
                            </Button>
                            <Button variant="primary" onPress={handleCompleteTask} style={styles.controlButton}>
                                Done
                            </Button>
                        </View>
                    ) : isPaused ? (
                        <View style={styles.activeControls}>
                            <Button variant="primary" onPress={resumeTimer} style={styles.controlButton}>
                                Resume
                            </Button>
                            <Button variant="danger" onPress={handleStop} style={styles.controlButton}>
                                Stop
                            </Button>
                        </View>
                    ) : (
                        <Button variant="primary" onPress={handleStartSession} fullWidth>
                            Start Focus
                        </Button>
                    )}
                </View>

                {/* Today's Stats */}
                <Card style={styles.statsCard}>
                    <View style={styles.statsContent}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={20} color={focus.accent} />
                            <Text variant="titleLarge" style={styles.statValue}>{formatMinutes(todayTotalMinutes)}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Today</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="list-outline" size={20} color={pastel.peach} />
                            <Text variant="titleLarge" style={styles.statValue}>{suggestions.length}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Tasks</Text>
                        </View>
                    </View>
                </Card>

                {/* Advanced Focus Mode Card */}
                {!isSessionActive && (
                    <Card
                        style={styles.advancedCard}
                        onPress={() => router.push('/focus/prepare')}
                    >
                        <View style={styles.advancedContent}>
                            <View style={styles.advancedIcon}>
                                <Ionicons name="rocket-outline" size={28} color={pastel.mint} />
                            </View>
                            <View style={styles.advancedInfo}>
                                <Text variant="titleMedium" style={{ color: text.primary, fontWeight: '600' }}>
                                    Try Advanced Focus
                                </Text>
                                <Text variant="bodySmall" style={{ color: text.secondary }}>
                                    Fullscreen immersive mode with guided breaks
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={text.muted} />
                        </View>
                    </Card>
                )}

                {/* Task Selection */}
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
                                onPress={() => handleSelectTask(suggestion)}
                            >
                                <View style={styles.taskContent}>
                                    <View style={[styles.taskDot, { backgroundColor: suggestion.subjectColor || focus.accent }]} />
                                    <View style={styles.taskInfo}>
                                        <Text variant="bodyLarge" style={styles.taskTitle}>{suggestion.task.title}</Text>
                                        <Text variant="bodySmall" style={styles.taskMeta}>{suggestion.subjectName}</Text>
                                    </View>
                                    <Ionicons
                                        name={selectedTask?.task.id === suggestion.task.id ? "radio-button-on" : "radio-button-off"}
                                        size={20}
                                        color={selectedTask?.task.id === suggestion.task.id ? focus.accent : text.muted}
                                    />
                                </View>
                            </Card>
                        ))}

                        {suggestions.length === 0 && !isLoading && (
                            <Card style={styles.emptyCard}>
                                <View style={styles.emptyContent}>
                                    <Ionicons name="checkmark-done" size={40} color={focus.accent} />
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        All caught up! Start a free focus session.
                                    </Text>
                                </View>
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
                        outlineColor={pastel.beige}
                        activeOutlineColor={focus.accent}
                    />
                    <Text variant="bodySmall" style={styles.modalHint}>Enter 1-180 minutes</Text>
                    <Button variant="primary" onPress={handleCustomDuration} fullWidth>
                        Set Duration
                    </Button>
                </Modal>
            </Portal>

            {/* Session Quality Modal */}
            <SessionQualityModal
                visible={showQualityPrompt}
                onDismiss={dismissQualityPrompt}
                onSubmit={submitSessionQuality}
                sessionMinutes={lastSessionMinutes}
            />

            {/* New Session Quality Prompt (for profile-aware plans) */}
            <SessionQualityPrompt
                visible={showLocalQualityPrompt}
                sessionMinutes={completedSessionMinutes}
                onQualitySelect={handleQualitySelect}
                onDismiss={() => setShowLocalQualityPrompt(false)}
            />

            <Snackbar
                visible={breakSnackbarVisible}
                onDismiss={() => setBreakSnackbarVisible(false)}
                duration={5000}
                action={{
                    label: "Take Break",
                    onPress: () => {
                        pauseTimer();
                        setBreakSnackbarVisible(false);
                    }
                }}
                style={{ backgroundColor: focus.accent, marginBottom: 100 }}
            >
                You've been focused for a while. Time to stretch?
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: focus.background },
    scrollContent: { paddingBottom: 100 },
    timerSection: { alignItems: "center", paddingTop: 40, paddingBottom: spacing.lg },
    timerRing: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 4,
        borderColor: pastel.beige,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focus.card,
        // Shadow
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    timerRingActive: { borderColor: focus.accent },
    timerRingPaused: { borderColor: pastel.peach },
    timerText: { fontSize: 48, fontWeight: "600", color: text.primary, fontVariant: ["tabular-nums"] },
    timerLabel: { fontSize: 14, color: text.secondary, marginTop: 4 },
    progressContainer: { width: "80%", height: 6, backgroundColor: pastel.beige, borderRadius: 3, marginTop: spacing.lg, overflow: "hidden" },
    progressBar: { height: "100%", backgroundColor: focus.accent, borderRadius: 3 },
    activeTaskContainer: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, paddingHorizontal: spacing.lg },
    activeTask: { color: text.primary, flex: 1 },
    subjectLabel: { color: text.secondary, marginTop: 4 },
    taskDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
    durationSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    sectionTitle: { color: text.primary, fontWeight: "600", marginBottom: spacing.sm },
    durationChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    controls: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    activeControls: { flexDirection: "row", gap: spacing.sm },
    controlButton: { flex: 1 },
    statsCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    statsContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { color: text.primary, fontWeight: "600", marginTop: 4 },
    statLabel: { color: text.secondary },
    statDivider: { width: 1, height: 40, backgroundColor: pastel.beige },
    taskSection: { paddingHorizontal: spacing.lg },
    taskCard: { marginBottom: spacing.xs },
    taskCardActive: { borderColor: focus.accent, borderWidth: 2 },
    taskContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    taskInfo: { flex: 1 },
    taskTitle: { color: text.primary },
    taskMeta: { color: text.secondary },
    emptyCard: { marginTop: spacing.sm },
    emptyContent: { alignItems: "center", paddingVertical: spacing.xl },
    emptyText: { color: text.secondary, marginTop: spacing.sm, textAlign: "center" },
    modal: { backgroundColor: focus.card, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg },
    modalTitle: { color: text.primary, fontWeight: "600", marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.xs, backgroundColor: focus.background },
    modalHint: { color: text.secondary, marginBottom: spacing.md },
    // Advanced Focus Mode styles
    advancedCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: `${pastel.mint}15` },
    advancedContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    advancedIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${pastel.mint}20`, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    advancedInfo: { flex: 1 },
});
