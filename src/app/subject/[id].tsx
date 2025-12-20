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
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSubjectStore } from "../../store/subjectStore";
import { Topic } from "../../types";

export default function SubjectDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { currentSubject, fetchSubjectWithTopics, createTopic, deleteTopic, isLoading } =
        useSubjectStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");

    useEffect(() => {
        if (id) {
            fetchSubjectWithTopics(id);
        }
    }, [id]);

    const handleCreateTopic = async () => {
        if (!newTopicName.trim()) {
            Alert.alert("Error", "Please enter a topic name");
            return;
        }

        try {
            await createTopic({
                subject_id: id!,
                name: newTopicName.trim(),
            });
            setModalVisible(false);
            setNewTopicName("");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDeleteTopic = (topic: Topic) => {
        Alert.alert("Delete Topic", `Are you sure you want to delete "${topic.name}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteTopic(topic.id),
            },
        ]);
    };

    if (!currentSubject) {
        return (
            <View className="flex-1 bg-dark-950 items-center justify-center">
                <Text className="text-dark-400">Loading...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-dark-950">
            <Stack.Screen
                options={{
                    title: currentSubject.name,
                    headerStyle: { backgroundColor: "#0f172a" },
                    headerTintColor: "#fff",
                }}
            />

            <ScrollView className="flex-1" contentContainerClassName="pb-20">
                {/* Subject Header */}
                <Animated.View
                    entering={FadeIn.duration(600)}
                    className="px-6 pt-6 pb-4"
                >
                    <View className="flex-row items-center mb-4">
                        <View
                            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                            style={{ backgroundColor: `${currentSubject.color}25` }}
                        >
                            <Text className="text-3xl">{currentSubject.icon}</Text>
                        </View>
                        <View>
                            <Text className="text-white text-2xl font-bold">
                                {currentSubject.name}
                            </Text>
                            <Text className="text-dark-400">
                                {currentSubject.topics.length} topics
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Topics List */}
                <View className="px-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-lg font-semibold">Topics</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="bg-primary-500 px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-medium">+ Add</Text>
                        </TouchableOpacity>
                    </View>

                    {currentSubject.topics.length === 0 ? (
                        <Animated.View
                            entering={FadeInDown.duration(600)}
                            className="items-center py-12 bg-dark-800/50 rounded-2xl"
                        >
                            <Text className="text-4xl mb-3">📖</Text>
                            <Text className="text-dark-400 text-center">
                                No topics yet.{"\n"}Add your first topic to get started.
                            </Text>
                        </Animated.View>
                    ) : (
                        currentSubject.topics.map((topic, index) => (
                            <Animated.View
                                key={topic.id}
                                entering={FadeInDown.delay(index * 100).duration(400)}
                            >
                                <TouchableOpacity
                                    onPress={() => router.push(`/topic/${topic.id}`)}
                                    onLongPress={() => handleDeleteTopic(topic)}
                                    className="flex-row items-center p-4 bg-dark-800 rounded-xl mb-3 border border-dark-700"
                                >
                                    <View
                                        className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                                        style={{ backgroundColor: `${currentSubject.color}20` }}
                                    >
                                        <Text style={{ color: currentSubject.color }} className="font-bold">
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white text-base font-medium">
                                            {topic.name}
                                        </Text>
                                        <Text className="text-dark-400 text-sm">
                                            Tap to view tasks
                                        </Text>
                                    </View>
                                    <Text className="text-dark-500">→</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Create Topic Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-dark-900 rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Add Topic</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-dark-400 text-2xl">×</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white mb-6"
                            placeholder="Topic name"
                            placeholderTextColor="#64748b"
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                        />

                        <TouchableOpacity
                            onPress={handleCreateTopic}
                            className="bg-primary-500 rounded-xl py-4 items-center"
                        >
                            <Text className="text-white font-bold text-lg">Add Topic</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
