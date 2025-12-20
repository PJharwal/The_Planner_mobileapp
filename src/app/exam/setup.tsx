import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Card, Text, Button, TextInput, useTheme, List, TouchableRipple, IconButton } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, differenceInSeconds } from "date-fns";
import { useExamStore } from "../../store/examStore";
import DateTimePicker from "@react-native-community/datetimepicker";

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
    const theme = useTheme();
    const router = useRouter();
    const { activeExam, exams, createExam, fetchActiveExam, fetchExams, updateExam } = useExamStore();
    const [examName, setExamName] = useState("");
    const [examDate, setExamDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 7 days from now
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
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen
                    options={{
                        title: "Exam Mode",
                        headerStyle: { backgroundColor: "#0F172A" },
                        headerTintColor: "#E5E7EB",
                        headerLeft: () => (
                            <IconButton icon={() => <Ionicons name="arrow-back" size={24} color="#E5E7EB" />} onPress={() => router.back()} />
                        ),
                    }}
                />

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {activeExam ? (
                        <>
                            {/* Active Exam View */}
                            <View style={styles.activeHeader}>
                                <View style={styles.examBadge}>
                                    <Ionicons name="timer" size={16} color="#38BDF8" />
                                    <Text style={styles.examBadgeText}>EXAM MODE ACTIVE</Text>
                                </View>
                                <Text variant="headlineSmall" style={styles.examName}>{activeExam.name}</Text>
                                <Text variant="bodyMedium" style={styles.examDate}>
                                    {format(new Date(activeExam.exam_date), "MMMM d, yyyy")}
                                </Text>
                            </View>

                            <CountdownTimer targetDate={activeExam.exam_date} />

                            <Card style={styles.focusCard} mode="outlined">
                                <Card.Content style={styles.focusContent}>
                                    <Ionicons name="flash" size={24} color="#38BDF8" />
                                    <View style={styles.focusText}>
                                        <Text variant="titleMedium" style={{ color: "#E5E7EB" }}>Focus Mode</Text>
                                        <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>
                                            Stay focused! Complete your tasks daily.
                                        </Text>
                                    </View>
                                </Card.Content>
                            </Card>

                            <Card style={styles.menuCard} mode="outlined">
                                <List.Item
                                    title="Focus Tasks"
                                    description="View exam prep tasks"
                                    left={() => <Ionicons name="list-outline" size={24} color="#38BDF8" style={{ marginLeft: 16 }} />}
                                    right={() => <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                                    titleStyle={{ color: "#E5E7EB" }}
                                    descriptionStyle={{ color: "#9CA3AF" }}
                                />
                            </Card>

                            <Button
                                mode="outlined"
                                onPress={handleEndExam}
                                textColor="#EF4444"
                                style={styles.endButton}
                                icon={() => <Ionicons name="stop-circle-outline" size={20} color="#EF4444" />}
                            >
                                End Exam Mode
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Setup View */}
                            <View style={styles.setupHeader}>
                                <View style={styles.setupIconContainer}>
                                    <Ionicons name="timer-outline" size={48} color="#38BDF8" />
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
                            />

                            <TouchableRipple onPress={() => setShowDatePicker(true)}>
                                <TextInput
                                    label="Exam Date"
                                    value={format(examDate, "MMMM d, yyyy")}
                                    mode="outlined"
                                    editable={false}
                                    style={styles.input}
                                    right={<TextInput.Icon icon={() => <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />} />}
                                />
                            </TouchableRipple>

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

                            <Button
                                mode="contained"
                                onPress={handleCreateExam}
                                loading={isCreating}
                                disabled={isCreating}
                                style={styles.button}
                                contentStyle={styles.buttonContent}
                                icon={() => <Ionicons name="rocket-outline" size={20} color="#FFF" />}
                            >
                                Start Exam Mode
                            </Button>

                            {exams.length > 0 && (
                                <View style={styles.pastSection}>
                                    <Text variant="titleMedium" style={styles.pastTitle}>Past Exams</Text>
                                    {exams.slice(0, 3).map((exam) => (
                                        <Card key={exam.id} style={styles.pastCard} mode="outlined">
                                            <Card.Content style={styles.pastContent}>
                                                <Ionicons name="school-outline" size={20} color="#9CA3AF" />
                                                <View style={styles.pastInfo}>
                                                    <Text variant="bodyLarge" style={{ color: "#E5E7EB" }}>{exam.name}</Text>
                                                    <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>{exam.exam_date}</Text>
                                                </View>
                                            </Card.Content>
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
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100, paddingHorizontal: 24 },
    // Active Exam Styles
    activeHeader: { alignItems: "center", paddingTop: 32, paddingBottom: 16 },
    examBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#38BDF820", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
    examBadgeText: { color: "#38BDF8", fontSize: 12, fontWeight: "600", marginLeft: 6 },
    examName: { color: "#E5E7EB", fontWeight: "bold", textAlign: "center" },
    examDate: { color: "#9CA3AF", marginTop: 4 },
    // Timer Styles
    timerContainer: { alignItems: "center", marginVertical: 24 },
    timerRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: "#38BDF8", alignItems: "center", justifyContent: "center", marginBottom: 24 },
    timerDays: { fontSize: 48, fontWeight: "bold", color: "#E5E7EB" },
    timerLabel: { fontSize: 16, color: "#9CA3AF" },
    timerDetails: { flexDirection: "row", alignItems: "center" },
    timerUnit: { alignItems: "center", minWidth: 50 },
    timerValue: { fontSize: 28, fontWeight: "bold", color: "#E5E7EB", fontVariant: ["tabular-nums"] },
    timerSeconds: { color: "#EF4444" },
    timerUnitLabel: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
    timerSeparator: { fontSize: 28, fontWeight: "bold", color: "#64748B", marginHorizontal: 4 },
    // Cards
    focusCard: { marginBottom: 16, backgroundColor: "#1E293B", borderColor: "#38BDF840" },
    focusContent: { flexDirection: "row", alignItems: "center" },
    focusText: { marginLeft: 16, flex: 1 },
    menuCard: { marginBottom: 24, backgroundColor: "#1E293B" },
    endButton: { borderColor: "#EF4444", borderRadius: 12 },
    // Setup Styles
    setupHeader: { alignItems: "center", paddingTop: 32, paddingBottom: 32 },
    setupIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#38BDF820", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    setupTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 8 },
    setupSubtitle: { color: "#9CA3AF", textAlign: "center" },
    input: { marginBottom: 16, backgroundColor: "#1E293B" },
    button: { marginTop: 8, borderRadius: 12 },
    buttonContent: { paddingVertical: 8 },
    pastSection: { marginTop: 40 },
    pastTitle: { color: "#E5E7EB", fontWeight: "600", marginBottom: 16 },
    pastCard: { marginBottom: 12, backgroundColor: "#1E293B" },
    pastContent: { flexDirection: "row", alignItems: "center" },
    pastInfo: { marginLeft: 12, flex: 1 },
});
