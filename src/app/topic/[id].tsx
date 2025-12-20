// Topic Detail Screen - Shows Sub-Topics
import { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { Card, Text, Button, Portal, Modal, TextInput, ProgressBar, Chip, useTheme, IconButton, Snackbar } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { SubTopic } from "../../types";
import { addTopicToToday, addSubTopicToToday } from "../../utils/addToToday";

interface SubTopicWithCount extends SubTopic {
    taskCount: number;
    completedCount: number;
}

export default function TopicDetailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [topicName, setTopicName] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectColor, setSubjectColor] = useState("#38BDF8");
    const [subTopics, setSubTopics] = useState<SubTopicWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add sub-topic modal
    const [modalVisible, setModalVisible] = useState(false);
    const [newSubTopicName, setNewSubTopicName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const fetchData = useCallback(async () => {
        if (!id) return;

        try {
            // Fetch topic with subject info
            const { data: topicData } = await supabase
                .from("topics")
                .select("*, subjects(id, name, color)")
                .eq("id", id)
                .single();

            if (topicData) {
                setTopicName(topicData.name);
                setSubjectName((topicData as any).subjects?.name || "");
                setSubjectColor((topicData as any).subjects?.color || "#38BDF8");
            }

            // Fetch sub-topics with task counts
            const { data: subTopicsData } = await supabase
                .from("sub_topics")
                .select(`
                    *,
                    tasks (id, is_completed)
                `)
                .eq("topic_id", id)
                .order("order_index", { ascending: true });

            const subTopicsWithCounts = (subTopicsData || []).map(st => ({
                ...st,
                taskCount: (st.tasks || []).length,
                completedCount: (st.tasks || []).filter((t: any) => t.is_completed).length,
                tasks: undefined, // Remove tasks array from the object
            }));

            setSubTopics(subTopicsWithCounts);

        } catch (error) {
            console.error("Error fetching topic:", error);
        }
        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleCreateSubTopic = async () => {
        if (!newSubTopicName.trim() || !id || !user) return;
        setIsCreating(true);

        try {
            const { error } = await supabase.from("sub_topics").insert({
                topic_id: id,
                user_id: user.id,
                name: newSubTopicName.trim(),
                order_index: subTopics.length,
            });

            if (!error) {
                setNewSubTopicName("");
                setModalVisible(false);
                await fetchData();
            }
        } catch (error) {
            console.error("Error creating sub-topic:", error);
        }
        setIsCreating(false);
    };

    const handleAddSubTopicToToday = async (subTopicId: string) => {
        const result = await addSubTopicToToday(subTopicId);
        setSnackbarMessage(result.message);
        setSnackbarVisible(true);
    };

    const handleAddAllToToday = async () => {
        if (!id) return;
        const result = await addTopicToToday(id);
        setSnackbarMessage(result.message);
        setSnackbarVisible(true);
    };

    // Calculate overall progress
    const totalTasks = subTopics.reduce((sum, st) => sum + st.taskCount, 0);
    const completedTasks = subTopics.reduce((sum, st) => sum + st.completedCount, 0);
    const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const pendingTasks = totalTasks - completedTasks;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen
                    options={{
                        title: topicName || "Topic",
                        headerStyle: { backgroundColor: "#0A0F1A" },
                        headerTintColor: "#E5E7EB",
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color="#E5E7EB" />}
                                onPress={() => router.back()}
                            />
                        ),
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                >
                    {/* Header Card */}
                    <Card style={[styles.headerCard, { borderLeftColor: subjectColor, borderLeftWidth: 4 }]} mode="outlined">
                        <Card.Content>
                            <Text variant="bodySmall" style={styles.breadcrumb}>
                                {subjectName}
                            </Text>
                            <Text variant="headlineSmall" style={styles.title}>
                                {topicName}
                            </Text>
                            <View style={styles.progressRow}>
                                <View style={styles.progressInfo}>
                                    <Chip compact style={styles.statChip} textStyle={styles.statChipText}>
                                        {completedTasks}/{totalTasks} tasks
                                    </Chip>
                                    <Chip compact style={styles.statChip} textStyle={styles.statChipText}>
                                        {subTopics.length} sub-topics
                                    </Chip>
                                </View>
                            </View>
                            <ProgressBar progress={progress} color={subjectColor} style={styles.progressBar} />
                            {pendingTasks > 0 && (
                                <Button
                                    mode="contained"
                                    compact
                                    onPress={handleAddAllToToday}
                                    icon={() => <Ionicons name="add-circle" size={16} color="#FFF" />}
                                    style={styles.addAllButton}
                                >
                                    Add all to Today ({pendingTasks})
                                </Button>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Sub-Topics Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Sub-Topics</Text>
                            <IconButton
                                icon={() => <Ionicons name="add" size={20} color="#38BDF8" />}
                                onPress={() => setModalVisible(true)}
                            />
                        </View>

                        {subTopics.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <Card.Content style={styles.emptyContent}>
                                    <Ionicons name="git-branch-outline" size={40} color="#9CA3AF" />
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        No sub-topics yet.{"\n"}Add your first sub-topic!
                                    </Text>
                                    <Button mode="contained" onPress={() => setModalVisible(true)} style={{ marginTop: 16 }}>
                                        Add Sub-Topic
                                    </Button>
                                </Card.Content>
                            </Card>
                        ) : (
                            subTopics.map(st => {
                                const stProgress = st.taskCount > 0 ? st.completedCount / st.taskCount : 0;
                                const stPending = st.taskCount - st.completedCount;

                                return (
                                    <Card
                                        key={st.id}
                                        style={styles.subTopicCard}
                                        mode="outlined"
                                        onPress={() => (router as any).push(`/subtopic/${st.id}`)}
                                    >
                                        <Card.Content>
                                            <View style={styles.subTopicHeader}>
                                                <View style={styles.subTopicInfo}>
                                                    <Text variant="titleMedium" style={styles.subTopicName}>
                                                        {st.name}
                                                    </Text>
                                                    <Text variant="bodySmall" style={styles.subTopicStats}>
                                                        {st.completedCount}/{st.taskCount} tasks completed
                                                    </Text>
                                                </View>
                                                <View style={styles.subTopicActions}>
                                                    {stPending > 0 && (
                                                        <IconButton
                                                            icon={() => <Ionicons name="add-circle-outline" size={22} color="#38BDF8" />}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleAddSubTopicToToday(st.id);
                                                            }}
                                                        />
                                                    )}
                                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                                </View>
                                            </View>
                                            <ProgressBar progress={stProgress} color={subjectColor} style={styles.subTopicProgress} />
                                        </Card.Content>
                                    </Card>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                {/* Add Sub-Topic Modal */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Add Sub-Topic</Text>
                        <TextInput
                            label="Sub-topic name"
                            value={newSubTopicName}
                            onChangeText={setNewSubTopicName}
                            mode="outlined"
                            style={styles.modalInput}
                            placeholder="e.g., Quadratic Equations"
                        />
                        <View style={styles.modalButtons}>
                            <Button mode="outlined" onPress={() => setModalVisible(false)} textColor="#9CA3AF">
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={handleCreateSubTopic} loading={isCreating} disabled={isCreating || !newSubTopicName.trim()}>
                                Add
                            </Button>
                        </View>
                    </Modal>
                </Portal>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={2000}
                    style={styles.snackbar}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    headerCard: { margin: 16, backgroundColor: "#1E293B" },
    breadcrumb: { color: "#9CA3AF", marginBottom: 4 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    progressRow: { marginTop: 12 },
    progressInfo: { flexDirection: "row", gap: 8, marginBottom: 8 },
    statChip: { backgroundColor: "#334155" },
    statChipText: { color: "#9CA3AF", fontSize: 12 },
    progressBar: { height: 6, borderRadius: 3 },
    addAllButton: { marginTop: 12, borderRadius: 8 },
    section: { paddingHorizontal: 16 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { color: "#E5E7EB", fontWeight: "600" },
    emptyCard: { backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 32 },
    emptyText: { color: "#9CA3AF", marginTop: 12, textAlign: "center" },
    subTopicCard: { marginBottom: 12, backgroundColor: "#1E293B" },
    subTopicHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    subTopicInfo: { flex: 1 },
    subTopicName: { color: "#E5E7EB" },
    subTopicStats: { color: "#9CA3AF", marginTop: 4 },
    subTopicActions: { flexDirection: "row", alignItems: "center" },
    subTopicProgress: { height: 4, borderRadius: 2, marginTop: 12 },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 16 },
    modalInput: { marginBottom: 16, backgroundColor: "#0F172A" },
    modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
    snackbar: { backgroundColor: "#1E293B" },
});
