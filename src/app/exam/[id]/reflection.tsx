// Post-Exam Reflection Screen
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { Card, Button } from "../../../components/ui";
import { pastel, spacing, borderRadius, background, text } from "../../../constants/theme";

export default function ExamReflectionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id: examId } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [examName, setExamName] = useState("");
    const [whatWorked, setWhatWorked] = useState("");
    const [whatDidnt, setWhatDidnt] = useState("");
    const [changesNextTime, setChangesNextTime] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [existingReflection, setExistingReflection] = useState(false);

    useEffect(() => {
        if (examId && user) {
            loadExamAndReflection();
        }
    }, [examId, user]);

    const loadExamAndReflection = async () => {
        // Get exam name
        const { data: exam } = await supabase
            .from("exam_modes")
            .select("name")
            .eq("id", examId)
            .single();

        if (exam) {
            setExamName(exam.name);
        }

        // Check for existing reflection
        const { data: reflection } = await supabase
            .from("exam_reflections")
            .select("*")
            .eq("exam_id", examId)
            .eq("user_id", user!.id)
            .single();

        if (reflection) {
            setWhatWorked(reflection.what_worked || "");
            setWhatDidnt(reflection.what_didnt || "");
            setChangesNextTime(reflection.changes_next_time || "");
            setExistingReflection(true);
        }
    };

    const handleSave = async () => {
        if (!user || !examId) return;

        setIsSaving(true);
        try {
            if (existingReflection) {
                await supabase
                    .from("exam_reflections")
                    .update({
                        what_worked: whatWorked,
                        what_didnt: whatDidnt,
                        changes_next_time: changesNextTime,
                    })
                    .eq("exam_id", examId)
                    .eq("user_id", user.id);
            } else {
                await supabase.from("exam_reflections").insert({
                    user_id: user.id,
                    exam_id: examId,
                    what_worked: whatWorked,
                    what_didnt: whatDidnt,
                    changes_next_time: changesNextTime,
                });
            }
            router.back();
        } catch (error) {
            console.error("Error saving reflection:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={[styles.inner, { paddingTop: insets.top }]}>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: "Exam Reflection",
                        headerStyle: { backgroundColor: background.primary },
                        headerTintColor: text.primary,
                        headerShadowVisible: false,
                    }}
                />

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="bulb" size={32} color={pastel.peach} />
                        </View>
                        <Text variant="titleLarge" style={styles.headerTitle}>
                            {examName || "Exam"} Reflection
                        </Text>
                        <Text variant="bodyMedium" style={styles.headerSubtitle}>
                            Take a moment to reflect on your preparation. This helps you improve for next time.
                        </Text>
                    </View>

                    {/* What Worked */}
                    <View style={styles.section}>
                        <View style={styles.questionHeader}>
                            <Ionicons name="checkmark-circle" size={20} color={pastel.mint} />
                            <Text variant="titleSmall" style={styles.questionTitle}>
                                What worked well?
                            </Text>
                        </View>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g., Early morning study sessions, active recall..."
                            value={whatWorked}
                            onChangeText={setWhatWorked}
                            multiline
                            numberOfLines={4}
                            style={styles.textInput}
                            outlineColor="rgba(93, 107, 107, 0.2)"
                            activeOutlineColor={pastel.mint}
                        />
                    </View>

                    {/* What Didn't Work */}
                    <View style={styles.section}>
                        <View style={styles.questionHeader}>
                            <Ionicons name="close-circle" size={20} color={pastel.peach} />
                            <Text variant="titleSmall" style={styles.questionTitle}>
                                What didn't work?
                            </Text>
                        </View>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g., Cramming the night before, skipping breaks..."
                            value={whatDidnt}
                            onChangeText={setWhatDidnt}
                            multiline
                            numberOfLines={4}
                            style={styles.textInput}
                            outlineColor="rgba(93, 107, 107, 0.2)"
                            activeOutlineColor={pastel.peach}
                        />
                    </View>

                    {/* Changes for Next Time */}
                    <View style={styles.section}>
                        <View style={styles.questionHeader}>
                            <Ionicons name="arrow-forward-circle" size={20} color={pastel.mint} />
                            <Text variant="titleSmall" style={styles.questionTitle}>
                                What would you change next time?
                            </Text>
                        </View>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g., Start revision earlier, focus on weak areas..."
                            value={changesNextTime}
                            onChangeText={setChangesNextTime}
                            multiline
                            numberOfLines={4}
                            style={styles.textInput}
                            outlineColor="rgba(93, 107, 107, 0.2)"
                            activeOutlineColor={pastel.mint}
                        />
                    </View>

                    {/* Save Button */}
                    <Button
                        variant="primary"
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={isSaving}
                        fullWidth
                        style={styles.saveButton}
                    >
                        Save Reflection
                    </Button>

                    {/* Skip */}
                    <Button
                        variant="secondary"
                        onPress={() => router.back()}
                        style={styles.skipButton}
                    >
                        Skip for now
                    </Button>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: background.primary,
    },
    inner: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${pastel.peach}20`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    headerTitle: {
        color: text.primary,
        fontWeight: "600",
        textAlign: "center",
    },
    headerSubtitle: {
        color: text.secondary,
        textAlign: "center",
        marginTop: spacing.xs,
        lineHeight: 20,
    },
    section: {
        marginBottom: spacing.lg,
    },
    questionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
        gap: spacing.xs,
    },
    questionTitle: {
        color: text.primary,
        fontWeight: "500",
    },
    textInput: {
        backgroundColor: background.card,
        minHeight: 100,
    },
    saveButton: {
        marginTop: spacing.md,
    },
    skipButton: {
        marginTop: spacing.sm,
    },
});
