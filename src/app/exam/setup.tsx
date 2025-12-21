import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { Text, IconButton, Portal, Modal, TextInput } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, differenceInSeconds } from "date-fns";
import { useExamStore } from "../../store/examStore";
import DateTimePicker from "@react-native-community/datetimepicker";

// Design tokens
import { pastel, background, text, spacing, borderRadius, shadows, focus } from "../../constants/theme";
// UI Components
import { Card, Button } from "../../components/ui";

// Exam mode uses slightly darker, more serious pastels
const exam = {
    background: '#E8EEEE',
    card: '#F0F4F4',
    accent: '#C9DDDC',
    ring: '#B8CECE',
};

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const totalSeconds = Math.max(0, differenceInSeconds(target, now));

            const days = Math.floor(totalSeconds / (60 * 60 * 24));
            const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
            const seconds = totalSeconds % 60;

            setTimeLeft({ days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <View style={styles.timerContainer}>
            <View style={styles.timerRing}>
                <Text style={styles.timerDays}>{timeLeft.days}</Text>
                <Text style={styles.timerLabel}>days</Text>
            </View>
            <View style={styles.timerDetails}>
                <View style={styles.timerUnit}>
                    <Text style={styles.timerValue}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                    <Text style={styles.timerUnitLabel}>hours</Text>
                </View>
                <Text style={styles.timerSeparator}>:</Text>
                <View style={styles.timerUnit}>
                    <Text style={styles.timerValue}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                    <Text style={styles.timerUnitLabel}>min</Text>
                </View>
                <Text style={styles.timerSeparator}>:</Text>
                <View style={styles.timerUnit}>
                    <Text style={[styles.timerValue, styles.timerSeconds]}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
                    <Text style={styles.timerUnitLabel}>sec</Text>
                </View>
            </View>
        </View>
    );
}

export default function ExamSetupScreen() {
    const router = useRouter();
    const { activeExam, exams, createExam, fetchActiveExam, fetchExams, updateExam } = useExamStore();
    const [examName, setExamName] = useState("");
    const [examDate, setExamDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchActiveExam();
        fetchExams();
    }, []);

    const handleCreateExam = async () => {
        if (!examName.trim()) {
            Alert.alert("Error", "Please enter an exam name");
            return;
        }
        try {
            setIsCreating(true);
            await createExam({ name: examName.trim(), exam_date: format(examDate, "yyyy-MM-dd") });
            setExamName("");
            Alert.alert("Success", "Exam mode activated!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEndExam = () => {
        Alert.alert("End Exam Mode", "Are you sure you want to end exam mode?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "End", style: "destructive", onPress: async () => {
                    if (activeExam) {
                        await updateExam(activeExam.id, { is_active: false });
                        await fetchActiveExam();
                    }
                }
            },
        ]);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: "Exam Mode",
                        headerStyle: { backgroundColor: exam.background },
                        headerTintColor: text.primary,
                        headerShadowVisible: false,
                        headerLeft: () => (
                            <IconButton icon={() => <Ionicons name="arrow-back" size={24} color={text.primary} />} onPress={() => router.back()} />
                        ),
                    }}
                />

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {activeExam ? (
                        <>
                            {/* Active Exam View */}
                            <View style={styles.activeHeader}>
                                <View style={styles.examBadge}>
                                    <Ionicons name="timer" size={16} color={text.primary} />
                                    <Text style={styles.examBadgeText}>EXAM MODE ACTIVE</Text>
                                </View>
                                <Text variant="headlineSmall" style={styles.examName}>{activeExam.name}</Text>
                                <Text variant="bodyMedium" style={styles.examDate}>
                                    {format(new Date(activeExam.exam_date), "MMMM d, yyyy")}
                                </Text>
                            </View>

                            <CountdownTimer targetDate={activeExam.exam_date} />

                            <Card style={styles.focusCard}>
                                <View style={styles.focusContent}>
                                    <View style={styles.focusIconContainer}>
                                        <Ionicons name="flash" size={24} color={text.primary} />
                                    </View>
                                    <View style={styles.focusText}>
                                        <Text variant="titleMedium" style={{ color: text.primary }}>Focus Mode</Text>
                                        <Text variant="bodySmall" style={{ color: text.secondary }}>
                                            Stay focused! Complete your tasks daily.
                                        </Text>
                                    </View>
                                </View>
                            </Card>

                            <Button variant="danger" onPress={handleEndExam} fullWidth>
                                End Exam Mode
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Setup View */}
                            <View style={styles.setupHeader}>
                                <View style={styles.setupIconContainer}>
                                    <Ionicons name="timer-outline" size={48} color={text.primary} />
                                </View>
                                <Text variant="headlineMedium" style={styles.setupTitle}>Set Up Exam Mode</Text>
                                <Text variant="bodyMedium" style={styles.setupSubtitle}>
                                    Create focused study sessions leading up to your exam
                                </Text>
                            </View>

                            <TextInput
                                label="Exam Name"
                                value={examName}
                                onChangeText={setExamName}
                                mode="outlined"
                                style={styles.input}
                                placeholder="e.g. Final Math Exam"
                                outlineColor={pastel.beige}
                                activeOutlineColor={exam.accent}
                                textColor={text.primary}
                            />

                            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                                <TextInput
                                    label="Exam Date"
                                    value={format(examDate, "MMMM d, yyyy")}
                                    mode="outlined"
                                    editable={false}
                                    style={styles.input}
                                    outlineColor={pastel.beige}
                                    textColor={text.primary}
                                    right={<TextInput.Icon icon={() => <Ionicons name="calendar-outline" size={20} color={text.secondary} />} />}
                                />
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={examDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_event: any, date?: Date) => {
                                        setShowDatePicker(false);
                                        if (date) setExamDate(date);
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}

                            <Button variant="primary" onPress={handleCreateExam} loading={isCreating} fullWidth>
                                Start Exam Mode
                            </Button>

                            {exams.length > 0 && (
                                <View style={styles.pastSection}>
                                    <Text variant="titleMedium" style={styles.pastTitle}>Past Exams</Text>
                                    {exams.slice(0, 3).map((examItem) => (
                                        <Card key={examItem.id} style={styles.pastCard}>
                                            <View style={styles.pastContent}>
                                                <View style={styles.pastIcon}>
                                                    <Ionicons name="school-outline" size={20} color={text.secondary} />
                                                </View>
                                                <View style={styles.pastInfo}>
                                                    <Text variant="bodyLarge" style={{ color: text.primary }}>{examItem.name}</Text>
                                                    <Text variant="bodySmall" style={{ color: text.secondary }}>{examItem.exam_date}</Text>
                                                </View>
                                            </View>
                                        </Card>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: exam.background },
    scrollContent: { paddingBottom: 100, paddingHorizontal: spacing.lg },
    // Active Exam Styles
    activeHeader: { alignItems: "center", paddingTop: spacing.xl, paddingBottom: spacing.md },
    examBadge: { flexDirection: "row", alignItems: "center", backgroundColor: `${exam.accent}50`, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.pill, marginBottom: spacing.md },
    examBadgeText: { color: text.primary, fontSize: 12, fontWeight: "600", marginLeft: 6 },
    examName: { color: text.primary, fontWeight: "600", textAlign: "center" },
    examDate: { color: text.secondary, marginTop: 4 },
    // Timer Styles
    timerContainer: { alignItems: "center", marginVertical: spacing.lg },
    timerRing: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 4,
        borderColor: exam.ring,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.lg,
        backgroundColor: exam.card,
        // Shadow
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    timerDays: { fontSize: 48, fontWeight: "600", color: text.primary },
    timerLabel: { fontSize: 16, color: text.secondary },
    timerDetails: { flexDirection: "row", alignItems: "center" },
    timerUnit: { alignItems: "center", minWidth: 50 },
    timerValue: { fontSize: 28, fontWeight: "600", color: text.primary, fontVariant: ["tabular-nums"] },
    timerSeconds: { color: pastel.peach },
    timerUnitLabel: { fontSize: 12, color: text.secondary, marginTop: 2 },
    timerSeparator: { fontSize: 28, fontWeight: "600", color: text.muted, marginHorizontal: 4 },
    // Cards
    focusCard: { marginBottom: spacing.md },
    focusContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    focusIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${exam.accent}40`, alignItems: "center", justifyContent: "center" },
    focusText: { marginLeft: spacing.md, flex: 1 },
    // Setup Styles
    setupHeader: { alignItems: "center", paddingTop: spacing.xl, paddingBottom: spacing.xl },
    setupIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${exam.accent}40`, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    setupTitle: { color: text.primary, fontWeight: "600", marginBottom: spacing.xs },
    setupSubtitle: { color: text.secondary, textAlign: "center" },
    input: { marginBottom: spacing.md, backgroundColor: exam.card },
    pastSection: { marginTop: spacing.xl },
    pastTitle: { color: text.primary, fontWeight: "600", marginBottom: spacing.md },
    pastCard: { marginBottom: spacing.sm },
    pastContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    pastIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${exam.accent}30`, alignItems: "center", justifyContent: "center" },
    pastInfo: { marginLeft: spacing.sm, flex: 1 },
});
