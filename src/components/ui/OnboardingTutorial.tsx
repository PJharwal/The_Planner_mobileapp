// OnboardingTutorial - First-time user tutorial cards
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Text, Portal, Modal } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeIn,
    FadeOut,
} from "react-native-reanimated";

import { Button } from "./Button";
import { pastel, background, text, spacing, borderRadius, gradients } from "../../constants/theme";

const { width } = Dimensions.get("window");
const TUTORIAL_KEY = "@the_planner_tutorial_shown";

interface TutorialStep {
    icon: string;
    title: string;
    description: string;
    gradient: readonly string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        icon: "school-outline",
        title: "Welcome to The Planner!",
        description: "Your personal study intelligence system. Let's get you started with a quick tour.",
        gradient: gradients.mint,
    },
    {
        icon: "book-outline",
        title: "Organize Your Subjects",
        description: "Create subjects, topics, and sub-topics to organize your study material in a structured way.",
        gradient: gradients.warm,
    },
    {
        icon: "checkbox-outline",
        title: "Track Your Tasks",
        description: "Add tasks to each topic. Mark them complete and watch your progress grow!",
        gradient: gradients.peach,
    },
    {
        icon: "time-outline",
        title: "Focus Timer",
        description: "Use the focus timer to track study sessions. Get insights on your best study times.",
        gradient: gradients.sage,
    },
    {
        icon: "bulb-outline",
        title: "Smart Suggestions",
        description: "Get AI-powered suggestions for what to study next based on your progress and exams.",
        gradient: gradients.mint,
    },
];

interface OnboardingTutorialProps {
    onComplete?: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
    const [visible, setVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const progress = useSharedValue(0);

    useEffect(() => {
        checkIfShouldShow();
    }, []);

    useEffect(() => {
        progress.value = withTiming((currentStep + 1) / TUTORIAL_STEPS.length, { duration: 300 });
    }, [currentStep]);

    const checkIfShouldShow = async () => {
        try {
            const shown = await AsyncStorage.getItem(TUTORIAL_KEY);
            if (!shown) {
                setVisible(true);
            }
        } catch (error) {
            console.error("Error checking tutorial status:", error);
        }
    };

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem(TUTORIAL_KEY, "true");
        } catch (error) {
            console.error("Error saving tutorial status:", error);
        }
        setVisible(false);
        onComplete?.();
    };

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

    if (!visible) return null;

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={handleSkip}
                contentContainerStyle={styles.modal}
            >
                <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.content}
                >
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBg}>
                            <Animated.View style={[styles.progressFill, progressStyle]} />
                        </View>
                        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text variant="labelMedium" style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Step Content */}
                    <View style={styles.stepContent}>
                        <LinearGradient
                            colors={step.gradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconContainer}
                        >
                            <Ionicons name={step.icon as any} size={48} color={text.primary} />
                        </LinearGradient>

                        <Text variant="headlineSmall" style={styles.title}>
                            {step.title}
                        </Text>
                        <Text variant="bodyMedium" style={styles.description}>
                            {step.description}
                        </Text>
                    </View>

                    {/* Pagination Dots */}
                    <View style={styles.dots}>
                        {TUTORIAL_STEPS.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentStep === index && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Actions */}
                    <Button
                        variant="primary"
                        onPress={handleNext}
                        fullWidth
                    >
                        {isLastStep ? "Get Started" : "Next"}
                    </Button>
                </Animated.View>
            </Modal>
        </Portal>
    );
}

// Hook to reset tutorial (for testing)
export async function resetTutorial() {
    await AsyncStorage.removeItem(TUTORIAL_KEY);
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: background.card,
        margin: 24,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    content: {
        alignItems: "center",
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: spacing.xl,
    },
    progressBg: {
        flex: 1,
        height: 4,
        backgroundColor: "rgba(93, 107, 107, 0.1)",
        borderRadius: 2,
        marginRight: spacing.md,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: pastel.mint,
        borderRadius: 2,
    },
    skipText: {
        color: text.muted,
    },
    stepContent: {
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.lg,
        shadowColor: pastel.mint,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        color: text.primary,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    description: {
        color: text.secondary,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },
    dots: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: spacing.xl,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(93, 107, 107, 0.2)",
    },
    dotActive: {
        backgroundColor: pastel.mint,
        width: 24,
    },
});
