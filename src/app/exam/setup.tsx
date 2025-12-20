import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import Animated, {
    FadeIn,
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from "react-native-reanimated";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { useExamStore } from "../../store/examStore";
import DateTimePicker from "@react-native-community/datetimepicker";

// Countdown Ring Animation
function CountdownRing({ daysLeft, totalDays }: { daysLeft: number; totalDays: number }) {
    const progress = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        const percentage = Math.max(0, Math.min(1, 1 - daysLeft / totalDays));
        progress.value = withTiming(percentage, { duration: 1500 });
        rotation.value = withRepeat(
            withTiming(360, { duration: 10000, easing: Easing.linear }),
            -1
        );
    }, [daysLeft]);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <View className="items-center justify-center">
            <Animated.View
                style={ringStyle}
                className="w-40 h-40 rounded-full border-4 border-dark-700 items-center justify-center"
            >
                <View className="absolute inset-0 rounded-full border-4 border-accent-500 opacity-50" />
            </Animated.View>
            <View className="absolute items-center">
                <Text className="text-white text-5xl font-bold">{daysLeft}</Text>
                <Text className="text-dark-400 text-lg">days left</Text>
            </View>
        </View>
    );
}

export default function ExamSetupScreen() {
    const router = useRouter();
    const { activeExam, exams, createExam, fetchActiveExam, fetchExams } = useExamStore();
    const [examName, setExamName] = useState("");
    const [examDate, setExamDate] = useState(new Date());
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

        if (examDate <= new Date()) {
            Alert.alert("Error", "Exam date must be in the future");
            return;
        }

        try {
            setIsCreating(true);
            await createExam({
                name: examName.trim(),
                exam_date: format(examDate, "yyyy-MM-dd"),
            });
            setExamName("");
            Alert.alert("Success", "Exam mode activated!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const daysLeft = activeExam
        ? Math.max(0, differenceInDays(new Date(activeExam.exam_date), new Date()))
        : 0;
    const hoursLeft = activeExam
        ? Math.max(0, differenceInHours(new Date(activeExam.exam_date), new Date()) % 24)
        : 0;

    return (
        <View className="flex-1 bg-dark-950">
            <Stack.Screen
                options={{
                    title: "Exam Mode",
                    headerStyle: { backgroundColor: "#0f172a" },
                    headerTintColor: "#fff",
                }}
            />

            <ScrollView className="flex-1" contentContainerClassName="pb-20">
                {activeExam ? (
                    // Active Exam View
                    <>
                        <Animated.View
                            entering={FadeIn.duration(600)}
                            className="items-center pt-10 pb-8"
                        >
                            <Text className="text-accent-400 text-lg mb-4">
                                {activeExam.name}
                            </Text>
                            <CountdownRing daysLeft={daysLeft} totalDays={30} />
                            <View className="flex-row mt-6 gap-6">
                                <View className="items-center">
                                    <Text className="text-white text-2xl font-bold">{daysLeft}</Text>
                                    <Text className="text-dark-400">Days</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-white text-2xl font-bold">{hoursLeft}</Text>
                                    <Text className="text-dark-400">Hours</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View
                            entering={FadeInDown.delay(200).duration(600)}
                            className="px-6"
                        >
                            <View className="bg-accent-500/10 border border-accent-500/30 rounded-2xl p-5 mb-6">
                                <Text className="text-white text-lg font-semibold mb-2">
                                    🎯 Focus Mode Active
                                </Text>
                                <Text className="text-dark-400">
                                    Stay focused! Complete your exam prep tasks daily to stay on track.
                                </Text>
                            </View>

                            <TouchableOpacity
                                className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-4"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-2xl mr-4">📋</Text>
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold">Focus Tasks</Text>
                                        <Text className="text-dark-400 text-sm">
                                            View and manage exam prep tasks
                                        </Text>
                                    </View>
                                    <Text className="text-dark-500">→</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="bg-dark-800 border border-dark-700 rounded-xl p-4"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-2xl mr-4">📊</Text>
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold">Prep Analytics</Text>
                                        <Text className="text-dark-400 text-sm">
                                            Track your exam preparation
                                        </Text>
                                    </View>
                                    <Text className="text-dark-500">→</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </>
                ) : (
                    // Setup New Exam View
                    <View className="px-6 pt-8">
                        <Animated.View
                            entering={FadeIn.duration(600)}
                            className="items-center mb-8"
                        >
                            <Text className="text-5xl mb-4">⏱️</Text>
                            <Text className="text-white text-2xl font-bold text-center">
                                Set Up Exam Mode
                            </Text>
                            <Text className="text-dark-400 text-center mt-2">
                                Create focused study sessions{"\n"}leading up to your exam
                            </Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <Text className="text-dark-300 mb-2 font-medium">Exam Name</Text>
                            <TextInput
                                className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-4 text-white mb-6"
                                placeholder="e.g. Final Math Exam"
                                placeholderTextColor="#64748b"
                                value={examName}
                                onChangeText={setExamName}
                            />

                            <Text className="text-dark-300 mb-2 font-medium">Exam Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-4 mb-6"
                            >
                                <Text className="text-white">
                                    {format(examDate, "MMMM d, yyyy")}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={examDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (date) setExamDate(date);
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}

                            <TouchableOpacity
                                onPress={handleCreateExam}
                                disabled={isCreating}
                                className={`bg-accent-500 rounded-xl py-4 items-center ${isCreating ? "opacity-50" : ""
                                    }`}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {isCreating ? "Setting Up..." : "Start Exam Mode"}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Previous Exams */}
                        {exams.length > 0 && (
                            <Animated.View
                                entering={FadeInDown.delay(400).duration(600)}
                                className="mt-8"
                            >
                                <Text className="text-white text-lg font-semibold mb-4">
                                    Past Exams
                                </Text>
                                {exams.slice(0, 3).map((exam) => (
                                    <View
                                        key={exam.id}
                                        className="bg-dark-800 rounded-xl p-4 mb-3 border border-dark-700"
                                    >
                                        <Text className="text-white font-medium">{exam.name}</Text>
                                        <Text className="text-dark-400 text-sm">
                                            {exam.exam_date}
                                        </Text>
                                    </View>
                                ))}
                            </Animated.View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
