import { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Card, Text, Button, Portal, Modal, TextInput, useTheme, TouchableRipple, IconButton } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjectStore } from "../../store/subjectStore";
import { Topic } from "../../types";

export default function SubjectDetailScreen() {
    const theme = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { currentSubject, fetchSubjectWithTopics, createTopic, deleteTopic } = useSubjectStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (id) fetchSubjectWithTopics(id);
    }, [id]);

    const handleCreateTopic = async () => {
        if (!newTopicName.trim()) return;
        setIsCreating(true);
        try {
            await createTopic({ subject_id: id!, name: newTopicName.trim() });
            setModalVisible(false);
            setNewTopicName("");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
        setIsCreating(false);
    };

    if (!currentSubject) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={styles.loading}>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen
                    options={{
                        title: currentSubject.name,
                        headerStyle: { backgroundColor: "#0F172A" },
                        headerTintColor: "#E5E7EB",
                        headerBackVisible: false,
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color="#E5E7EB" />}
                                onPress={() => router.back()}
                                style={{ marginLeft: -4 }}
                            />
                        ),
                    }}
                />

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Subject Header */}
                    <View style={styles.subjectHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: currentSubject.color + "20" }]}>
                            <Text style={styles.subjectIcon}>{currentSubject.icon}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text variant="headlineSmall" style={styles.subjectName}>{currentSubject.name}</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                {currentSubject.topics?.length || 0} topics
                            </Text>
                        </View>
                    </View>

                    {/* Topics Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={{ color: "#E5E7EB" }}>Topics</Text>
                            <Button mode="contained" compact onPress={() => setModalVisible(true)}>
                                <Ionicons name="add" size={16} color="#FFF" /> Add
                            </Button>
                        </View>

                        {currentSubject.topics?.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <Card.Content style={styles.emptyContent}>
                                    <Ionicons name="book-outline" size={40} color="#9CA3AF" />
                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
                                        No topics yet.{"\n"}Add your first topic.
                                    </Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            currentSubject.topics?.map((topic, index) => (
                                <TouchableRipple key={topic.id} onPress={() => router.push(`/topic/${topic.id}`)}>
                                    <Card style={styles.topicCard} mode="outlined">
                                        <Card.Content style={styles.topicContent}>
                                            <View style={[styles.topicNumber, { backgroundColor: currentSubject.color + "20" }]}>
                                                <Text style={[styles.topicNumberText, { color: currentSubject.color }]}>{index + 1}</Text>
                                            </View>
                                            <View style={styles.topicInfo}>
                                                <Text variant="bodyLarge" style={{ color: "#E5E7EB" }}>{topic.name}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Tap to view tasks</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </Card.Content>
                                    </Card>
                                </TouchableRipple>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Modal */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Add Topic</Text>
                        <TextInput
                            label="Topic name"
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                            mode="outlined"
                            style={styles.modalInput}
                        />
                        <Button
                            mode="contained"
                            onPress={handleCreateTopic}
                            style={styles.createButton}
                            loading={isCreating}
                            disabled={isCreating}
                        >
                            Add Topic
                        </Button>
                    </Modal>
                </Portal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { color: "#9CA3AF", textAlign: "center", marginTop: 100 },
    scrollContent: { paddingBottom: 100 },
    subjectHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
    iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 16 },
    subjectIcon: { fontSize: 28 },
    headerInfo: { flex: 1 },
    subjectName: { color: "#E5E7EB", fontWeight: "bold" },
    section: { paddingHorizontal: 24 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    emptyCard: { backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 40 },
    topicCard: { marginBottom: 12, backgroundColor: "#1E293B" },
    topicContent: { flexDirection: "row", alignItems: "center" },
    topicNumber: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 16 },
    topicNumberText: { fontWeight: "bold" },
    topicInfo: { flex: 1 },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 20 },
    modalInput: { marginBottom: 24, backgroundColor: "#0F172A" },
    createButton: { borderRadius: 12 },
});
