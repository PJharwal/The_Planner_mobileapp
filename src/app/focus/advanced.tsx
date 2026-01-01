import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pastel, spacing, typography } from '../../constants/theme';
import { useTimerStore, formatCountdown } from '../../store/timerStore';
import { useCapacityStore } from '../../store/capacityStore';
import { Button } from '../../components/ui';

type FocusPhase = 'focus' | 'rest' | 'complete';

export default function AdvancedFocusScreen() {
    useKeepAwake(); // Prevent screen from sleeping

    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { capacity, usage } = useCapacityStore();

    const {
        isRunning,
        isPaused,
        elapsed,
        targetDuration,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        tick,
    } = useTimerStore();

    const [phase, setPhase] = useState<FocusPhase>('focus');
    const [showControls, setShowControls] = useState(true);
    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout>>();

    // Parse params
    const duration = params.duration ? parseInt(params.duration as string) : (capacity?.default_focus_minutes || 25) * 60;
    const breakDuration = (capacity?.default_break_minutes || 5) * 60;
    const taskTitle = params.taskTitle as string || 'Focus Session';

    useEffect(() => {
        // Auto-start timer
        if (!isRunning && phase === 'focus') {
            startTimer(duration, {
                taskId: params.taskId as string,
                taskTitle: taskTitle,
            });
        }
    }, []);

    // Tick timer
    useEffect(() => {
        if (!isRunning || isPaused) return;

        const interval = setInterval(() => {
            tick();

            // Check if focus phase complete
            if (phase === 'focus' && elapsed >= targetDuration) {
                handlePhaseComplete('focus');
            }
            // Check if rest phase complete
            else if (phase === 'rest' && elapsed >= targetDuration) {
                handlePhaseComplete('rest');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, isPaused, elapsed, targetDuration, phase]);

    // Auto-hide controls after 5 seconds
    useEffect(() => {
        if (showControls && phase !== 'complete') {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
            hideControlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 5000);
        }
        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, [showControls, phase]);

    const handlePhaseComplete = async (completedPhase: 'focus' | 'rest') => {
        if (completedPhase === 'focus') {
            // Transition to rest phase
            stopTimer();
            setPhase('rest');
            startTimer(breakDuration, {});
        } else if (completedPhase === 'rest') {
            // Session complete
            stopTimer();
            setPhase('complete');
        }
    };

    const handleTapScreen = () => {
        setShowControls(true);
    };

    const handlePauseResume = () => {
        if (isPaused) {
            resumeTimer();
        } else {
            pauseTimer();
        }
    };

    const handleExit = () => {
        stopTimer();
        router.back();
    };

    const handleSkipRest = () => {
        stopTimer();
        setPhase('complete');
    };

    const handleAnotherSession = () => {
        setPhase('focus');
        startTimer(duration, {
            taskId: params.taskId as string,
            taskTitle: taskTitle,
        });
    };

    const remaining = targetDuration - elapsed;
    const progress = targetDuration > 0 ? elapsed / targetDuration : 0;

    // Check capacity warning
    const isOverCapacity = usage.isOverFocusLimit || usage.isOverTaskLimit;
    const capacityWarning = isOverCapacity
        ? `You've used ${usage.todayFocusMinutes}/${capacity?.max_daily_focus_minutes}m today.`
        : null;

    // Dynamic gradient based on phase
    const getGradientColors = (): [string, string] => {
        switch (phase) {
            case 'focus':
                return ['#1a1a2e', '#16213e'];
            case 'rest':
                return ['#0f4c5c', '#1f7a8c'];
            case 'complete':
                return ['#145a32', '#1e8449'];
            default:
                return ['#1a1a2e', '#16213e'];
        }
    };

    return (
        <Pressable style={styles.container} onPress={handleTapScreen}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Gradient */}
            <LinearGradient
                colors={getGradientColors()}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Safe Area Top Controls */}
            {showControls && phase !== 'complete' && (
                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                    <IconButton
                        icon="close"
                        size={28}
                        iconColor="rgba(255,255,255,0.7)"
                        onPress={handleExit}
                    />
                    <View style={styles.phaseIndicator}>
                        <View style={[styles.phaseDot, phase === 'focus' && styles.phaseDotActive]} />
                        <View style={[styles.phaseDot, phase === 'rest' && styles.phaseDotActive]} />
                    </View>
                    <IconButton
                        icon={isPaused ? 'play' : 'pause'}
                        size={28}
                        iconColor="rgba(255,255,255,0.7)"
                        onPress={handlePauseResume}
                    />
                </View>
            )}

            {/* Main Content */}
            <View style={styles.content}>
                {phase === 'focus' && (
                    <View style={styles.focusContent}>
                        <Text style={styles.phaseLabel}>
                            {isPaused ? 'PAUSED' : 'FOCUS'}
                        </Text>
                        <Text style={styles.timer}>
                            {formatCountdown(remaining)}
                        </Text>
                        <Text style={styles.taskTitle}>
                            {taskTitle}
                        </Text>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>
                )}

                {phase === 'rest' && (
                    <View style={styles.restContent}>
                        <Ionicons name="cafe-outline" size={64} color={pastel.mint} />
                        <Text style={styles.restTitle}>
                            Take a Break
                        </Text>
                        <Text style={styles.timer}>
                            {formatCountdown(remaining)}
                        </Text>

                        <View style={styles.restSuggestions}>
                            <View style={styles.suggestionItem}>
                                <Ionicons name="water-outline" size={20} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.restSuggestion}>Hydrate</Text>
                            </View>
                            <View style={styles.suggestionItem}>
                                <Ionicons name="walk-outline" size={20} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.restSuggestion}>Quick stretch</Text>
                            </View>
                            <View style={styles.suggestionItem}>
                                <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.restSuggestion}>Look away from screen</Text>
                            </View>
                        </View>

                        <Button variant="ghost" onPress={handleSkipRest} style={styles.skipButton}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Skip Rest</Text>
                        </Button>
                    </View>
                )}

                {phase === 'complete' && (
                    <View style={styles.completeContent}>
                        <View style={styles.completeIcon}>
                            <Ionicons name="checkmark" size={48} color="#fff" />
                        </View>
                        <Text style={styles.completeTitle}>
                            Session Complete!
                        </Text>
                        <Text style={styles.completeMessage}>
                            Great work! You completed a full focus cycle.
                        </Text>

                        {capacityWarning && (
                            <View style={styles.capacityWarning}>
                                <Ionicons name="information-circle-outline" size={20} color={pastel.peach} />
                                <Text style={styles.warningText}>
                                    {capacityWarning}
                                </Text>
                            </View>
                        )}

                        <View style={styles.completeActions}>
                            <Button onPress={handleAnotherSession} style={styles.actionButton}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Another Session</Text>
                            </Button>
                            <Button variant="ghost" onPress={handleExit} style={styles.actionButton}>
                                <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Done for Now</Text>
                            </Button>
                        </View>
                    </View>
                )}
            </View>

            {/* Tap hint */}
            {!showControls && phase !== 'complete' && (
                <View style={[styles.tapHint, { bottom: insets.bottom + 24 }]}>
                    <Text style={styles.tapHintText}>Tap to show controls</Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        zIndex: 10,
    },
    phaseIndicator: {
        flexDirection: 'row',
        gap: 8,
    },
    phaseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    phaseDotActive: {
        backgroundColor: pastel.mint,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    focusContent: {
        alignItems: 'center',
        width: '100%',
    },
    phaseLabel: {
        color: pastel.mint,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 4,
        marginBottom: spacing.lg,
    },
    timer: {
        color: '#fff',
        fontSize: 72,
        fontWeight: '200',
        fontVariant: ['tabular-nums'],
        fontFamily: Platform.select({ ios: 'System', android: 'monospace' }),
        marginBottom: spacing.md,
    },
    taskTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    progressContainer: {
        width: '80%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        marginTop: spacing.lg,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: pastel.mint,
        borderRadius: 2,
    },
    restContent: {
        alignItems: 'center',
    },
    restTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '600',
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    restSuggestions: {
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    restSuggestion: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
    },
    skipButton: {
        marginTop: spacing.xl,
    },
    completeContent: {
        alignItems: 'center',
        width: '100%',
    },
    completeIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    completeTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    completeMessage: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    capacityWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(247,203,201,0.15)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    warningText: {
        color: pastel.peach,
        fontSize: 14,
        flex: 1,
    },
    completeActions: {
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    actionButton: {
        width: '100%',
    },
    tapHint: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tapHintText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
});
