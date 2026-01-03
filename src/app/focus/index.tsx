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
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
// UI Components
import { Chip, SessionQualityModal } from "../../components/ui";
// Note: We use GlassCard/GlassButton instead of Card/Button
import { GlassCard, GlassButton } from "../../components/glass";
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
        } : undefined;
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
                    headerStyle: { backgroundColor: darkBackground.primary },
                    headerTintColor: glassText.primary,
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <IconButton
                            icon={() => <Ionicons name="close" size={24} color={glassText.primary} />}
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
                            <View style={[styles.taskDot, { backgroundColor: glassAccent.blue }]} />
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
                            <Text variant="bodySmall" style={{ color: glassText.secondary, marginBottom: spacing.xs }}>
                                Recommended for you: {capacity.default_focus_minutes} minutes
                            </Text>
                        )}
                        <View style={styles.durationChips}>
                            {timerPresets.map((preset) => (
                                <Chip
                                    key={preset.value}
                                    style={{
                                        backgroundColor: selectedDuration === preset.value
                                            ? glassAccent.blue + '20'
                                            : glass.background.light,
                                        borderColor: selectedDuration === preset.value
                                            ? glassAccent.blue
                                            : glass.border.light,
                                        borderWidth: 1
                                    }}
                                    textStyle={{
                                        color: selectedDuration === preset.value
                                            ? glassAccent.blue
                                            : glassText.secondary
                                    }}
                                    onPress={() => setSelectedDuration(preset.value)}
                                    selected={selectedDuration === preset.value}
                                >
                                    {preset.label}
                                </Chip>
                            ))}
                            <Chip
                                style={{
                                    backgroundColor: glass.background.light,
                                    borderColor: glass.border.light,
                                    borderWidth: 1
                                }}
                                textStyle={{ color: glassText.secondary }}
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
                            <GlassButton
                                variant="secondary"
                                onPress={pauseTimer}
                                style={styles.controlButton}
                                icon={() => <Ionicons name="pause" size={20} color={glassText.primary} />}
                            >
                                Pause
                            </GlassButton>
                            <GlassButton
                                variant="primary"
                                onPress={handleCompleteTask}
                                style={styles.controlButton}
                                icon={() => <Ionicons name="checkmark" size={20} color={glassText.inverse} />}
                            >
                                Done
                            </GlassButton>
                        </View>
                    ) : isPaused ? (
                        <View style={styles.activeControls}>
                            <GlassButton
                                variant="primary"
                                onPress={resumeTimer}
                                style={styles.controlButton}
                                icon={() => <Ionicons name="play" size={20} color={glassText.inverse} />}
                            >
                                Resume
                            </GlassButton>
                            <GlassButton
                                variant="danger"
                                onPress={handleStop}
                                style={styles.controlButton}
                                icon={() => <Ionicons name="square" size={20} color={glassText.inverse} />}
                            >
                                Stop
                            </GlassButton>
                        </View>
                    ) : (
                        <GlassButton
                            variant="primary"
                            onPress={handleStartSession}
                            size="lg"
                            fullWidth
                            glow
                        >
                            Start Focus
                        </GlassButton>
                    )}
                </View>

                {/* Today's Stats */}
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statsContent}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={20} color={glassAccent.blue} />
                            <Text variant="titleLarge" style={[styles.statValue, { color: glassText.primary }]}>{formatMinutes(todayTotalMinutes)}</Text>
                            <Text variant="bodySmall" style={[styles.statLabel, { color: glassText.secondary }]}>Today</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: glass.border.light }]} />
                        <View style={styles.statItem}>
                            <Ionicons name="list-outline" size={20} color={glassAccent.warm} />
                            <Text variant="titleLarge" style={[styles.statValue, { color: glassText.primary }]}>{suggestions.length}</Text>
                            <Text variant="bodySmall" style={[styles.statLabel, { color: glassText.secondary }]}>Tasks</Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Advanced Focus Mode Card */}
                {!isSessionActive && (
                    <GlassCard
                        style={styles.advancedCard}
                        intensity="light"
                        padding={0}
                        onPress={() => router.push("/focus/advanced")}
                    >
                        <View style={styles.advancedContent}>
                            <View style={[styles.advancedIcon, { backgroundColor: glassAccent.mintGlow }]}>
                                <Ionicons name="rocket-outline" size={28} color={glassAccent.mint} />
                            </View>
                            <View style={styles.advancedInfo}>
                                <Text variant="titleMedium" style={{ color: glassText.primary, fontWeight: '600' }}>
                                    Try Advanced Focus
                                </Text>
                                <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                    Fullscreen immersive mode with guided breaks
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={glassText.muted} />
                        </View>
                    </GlassCard>
                )}

                {/* Task Selection */}
                {!isSessionActive && (
                    <View style={styles.taskSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Select Task (Optional)
                        </Text>

                        {suggestions.map((suggestion) => (
                            <GlassCard
                                key={suggestion.task.id}
                                style={[
                                    styles.taskCard,
                                    selectedTask?.task.id === suggestion.task.id && styles.taskCardActive
                                ]}
                                onPress={() => handleSelectTask(suggestion)}
                                intensity={selectedTask?.task.id === suggestion.task.id ? "medium" : "light"}
                            >
                                <View style={styles.taskContent}>
                                    <View style={[styles.taskDot, { backgroundColor: suggestion.subjectColor || glassAccent.blue }]} />
                                    <View style={styles.taskInfo}>
                                        <Text variant="bodyLarge" style={styles.taskTitle}>{suggestion.task.title}</Text>
                                        <Text variant="bodySmall" style={styles.taskMeta}>{suggestion.subjectName}</Text>
                                    </View>
                                    <Ionicons
                                        name={selectedTask?.task.id === suggestion.task.id ? "radio-button-on" : "radio-button-off"}
                                        size={20}
                                        color={selectedTask?.task.id === suggestion.task.id ? glassAccent.blue : glassText.muted}
                                    />
                                </View>
                            </GlassCard>
                        ))}

                        {suggestions.length === 0 && !isLoading && (
                            <GlassCard style={styles.emptyCard} intensity="light">
                                <View style={styles.emptyContent}>
                                    <Ionicons name="checkmark-done" size={40} color={glassAccent.mint} />
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        All caught up! Start a free focus session.
                                    </Text>
                                </View>
                            </GlassCard>
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
                        outlineColor={glass.border.light}
                        activeOutlineColor={glassAccent.blue}
                        textColor={glassText.primary}
                        theme={{ colors: { background: darkBackground.primary, placeholder: glassText.secondary, text: glassText.primary } }}
                    />
                    <Text variant="bodySmall" style={styles.modalHint}>Enter 1-180 minutes</Text>
                    <GlassButton variant="primary" onPress={handleCustomDuration} fullWidth>
                        Set Duration
                    </GlassButton>
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
                style={{ backgroundColor: glassAccent.blue, marginBottom: 100 }}
            >
                You've been focused for a while. Time to stretch?
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: darkBackground.primary },
    scrollContent: { paddingBottom: 100 },
    timerSection: { alignItems: "center", paddingTop: 40, paddingBottom: spacing.lg },
    timerRing: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: glass.border.default,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.background.default,
        // Shadow (iOS only - no elevation to prevent black border on Android)
        shadowColor: '#4DA3FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.20,
        shadowRadius: 24,
    },
    timerRingActive: { borderColor: glassAccent.blue },
    timerRingPaused: { borderColor: glassAccent.warm },
    timerText: { fontSize: 48, fontWeight: "600", color: glassText.primary, fontVariant: ["tabular-nums"] },
    timerLabel: { fontSize: 14, color: glassText.secondary, marginTop: 4 },
    progressContainer: { width: "80%", height: 6, backgroundColor: glass.background.medium, borderRadius: 3, marginTop: spacing.lg, overflow: "hidden" },
    progressBar: { height: "100%", backgroundColor: glassAccent.blue, borderRadius: 3 },
    activeTaskContainer: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, paddingHorizontal: spacing.lg },
    activeTask: { color: glassText.primary, flex: 1 },
    subjectLabel: { color: glassText.secondary, marginTop: 4 },
    taskDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
    durationSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    sectionTitle: { color: glassText.primary, fontWeight: "600", marginBottom: spacing.sm },
    durationChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    controls: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    activeControls: { flexDirection: "row", gap: spacing.sm },
    controlButton: { flex: 1 },
    statsCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    statsContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { color: glassText.primary, fontWeight: "600", marginTop: 4 },
    statLabel: { color: glassText.secondary },
    statDivider: { width: 1, height: 40, backgroundColor: glass.border.light },
    taskSection: { paddingHorizontal: spacing.lg },
    taskCard: { marginBottom: spacing.xs, padding: 0 },
    taskCardActive: { borderColor: glassAccent.blue, borderWidth: 1 },
    taskContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    taskInfo: { flex: 1 },
    taskTitle: { color: glassText.primary },
    taskMeta: { color: glassText.secondary },
    emptyCard: { marginTop: spacing.sm },
    emptyContent: { alignItems: "center", paddingVertical: spacing.xl },
    emptyText: { color: glassText.secondary, marginTop: spacing.sm, textAlign: "center" },
    modal: { backgroundColor: darkBackground.elevated, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalTitle: { color: glassText.primary, fontWeight: "600", marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.xs, backgroundColor: darkBackground.primary },
    modalHint: { color: glassText.secondary, marginBottom: spacing.md },
    // Advanced Focus Mode styles
    advancedCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
    advancedContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    advancedIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    advancedInfo: { flex: 1 },
});
