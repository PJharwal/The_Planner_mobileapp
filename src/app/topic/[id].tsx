import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import Animated, {
    FadeIn,
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import { useTaskStore } from "../../store/taskStore";
import { Task } from "../../types";
import { supabase } from "../../lib/supabase";

// Animated Checkbox
function AnimatedCheckbox({
    task,
    onToggle,
}: {
    task: Task;
    onToggle: (id: string) => void;
}) {
    const scale = useSharedValue(1);
    const checkScale = useSharedValue(task.is_completed ? 1 : 0);

    const handlePress = () => {
        scale.value = withSpring(0.9, {}, () => {
            scale.value = withSpring(1);
        });
        checkScale.value = withSpring(task.is_completed ? 0 : 1);
        onToggle(task.id);
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const checkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
        opacity: checkScale.value,
    }));

    return (
        <Animated.View style={containerStyle}>
            <TouchableOpacity
                onPress={handlePress}
                className={`flex-row items-center p-4 bg-dark-800 rounded-xl mb-3 border ${task.is_completed ? "border-primary-500/30" : "border-dark-700"
                    }`}
            >
                <View
                    className={`w-7 h-7 rounded-lg border-2 mr-4 items-center justify-center ${task.is_completed
                        ? "bg-primary-500 border-primary-500"
                        : "border-dark-500"
                        }`}
                >
                    <Animated.Text style={checkStyle} className="text-white text-sm">
                        ✓
                    </Animated.Text>
                </View>
                <View className="flex-1">
                    <Text
                        className={`text-base ${task.is_completed ? "text-dark-400 line-through" : "text-white"
                            }`}
                    >
                        {task.title}
                    </Text>
                    {task.due_date && (
                        <Text className="text-dark-500 text-sm mt-1">
                            Due: {task.due_date}
                        </Text>
                    )}
                </View>
                <View
                    className={`px-2 py-1 rounded ${task.priority === "high"
                        ? "bg-red-500/20"
                        : task.priority === "medium"
                            ? "bg-yellow-500/20"
                            : "bg-green-500/20"
                        }`}
                >
                    <Text
                        className={`text-xs ${task.priority === "high"
                            ? "text-red-400"
                            : task.priority === "medium"
                                ? "text-yellow-400"
                                : "text-green-400"
                            }`}
                    >
                        {task.priority}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function TopicDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const {
        tasks,
        fetchTasksByTopic,
        createTask,
        toggleTaskComplete,
        deleteTask,
        isLoading,
    } = useTaskStore();
    const [topicName, setTopicName] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

    useEffect(() => {
        if (id) {
            fetchTasksByTopic(id);
            fetchTopicName();
        }
    }, [id]);

    const fetchTopicName = async () => {
        const { data } = await supabase
            .from("topics")
            .select("name")
            .eq("id", id)
            .single();
        if (data) setTopicName(data.name);
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) {
            Alert.alert("Error", "Please enter a task title");
            return;
        }

        try {
            await createTask({
                topic_id: id!,
                title: newTaskTitle.trim(),
                priority: newTaskPriority,
            });
            setModalVisible(false);
            setNewTaskTitle("");
            setNewTaskPriority("medium");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDeleteTask = (task: Task) => {
        Alert.alert("Delete Task", `Delete "${task.title}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteTask(task.id),
            },
        ]);
    };

    const completedCount = tasks.filter((t) => t.is_completed).length;

    return (
        <View className="flex-1 bg-dark-950">
            <Stack.Screen
                options={{
                    title: topicName || "Topic",
                    headerStyle: { backgroundColor: "#0f172a" },
                    headerTintColor: "#fff",
                }}
            />

            <ScrollView className="flex-1" contentContainerClassName="pb-20">
                {/* Progress Header */}
                <Animated.View
                    entering={FadeIn.duration(600)}
                    className="px-6 pt-6 pb-4"
                >
                    <View className="bg-dark-800/50 rounded-2xl p-4 border border-dark-700">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-white text-lg font-semibold">Progress</Text>
                            <Text className="text-primary-400">
                                {completedCount}/{tasks.length} completed
                            </Text>
                        </View>
                        <View className="h-3 bg-dark-700 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-primary-500 rounded-full"
                                style={{
                                    width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`,
                                }}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Tasks List */}
                <View className="px-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-lg font-semibold">Tasks</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="bg-primary-500 px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-medium">+ Add Task</Text>
                        </TouchableOpacity>
                    </View>

                    {tasks.length === 0 ? (
                        <Animated.View
                            entering={FadeInDown.duration(600)}
                            className="items-center py-12 bg-dark-800/50 rounded-2xl"
                        >
                            <Text className="text-4xl mb-3">✅</Text>
                            <Text className="text-dark-400 text-center">
                                No tasks yet.{"\n"}Add tasks to track your progress.
                            </Text>
                        </Animated.View>
                    ) : (
                        tasks.map((task, index) => (
                            <Animated.View
                                key={task.id}
                                entering={FadeInDown.delay(index * 50).duration(400)}
                            >
                                <TouchableOpacity onLongPress={() => handleDeleteTask(task)}>
                                    <AnimatedCheckbox task={task} onToggle={toggleTaskComplete} />
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Create Task Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-dark-900 rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Add Task</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-dark-400 text-2xl">×</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white mb-4"
                            placeholder="Task title"
                            placeholderTextColor="#64748b"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                        />

                        <Text className="text-dark-300 mb-2 font-medium">Priority</Text>
                        <View className="flex-row gap-3 mb-6">
                            {(["low", "medium", "high"] as const).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setNewTaskPriority(p)}
                                    className={`flex-1 py-3 rounded-xl items-center border ${newTaskPriority === p
                                        ? p === "high"
                                            ? "bg-red-500/20 border-red-500"
                                            : p === "medium"
                                                ? "bg-yellow-500/20 border-yellow-500"
                                                : "bg-green-500/20 border-green-500"
                                        : "border-dark-700"
                                        }`}
                                >
                                    <Text
                                        className={
                                            newTaskPriority === p
                                                ? p === "high"
                                                    ? "text-red-400"
                                                    : p === "medium"
                                                        ? "text-yellow-400"
                                                        : "text-green-400"
                                                : "text-dark-400"
                                        }
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleCreateTask}
                            className="bg-primary-500 rounded-xl py-4 items-center"
                        >
                            <Text className="text-white font-bold text-lg">Add Task</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
