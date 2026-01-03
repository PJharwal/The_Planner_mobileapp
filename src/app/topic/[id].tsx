// Topic Detail Screen - Shows Sub-Topics
import { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, TouchableOpacity } from "react-native";
import { Text, Portal, Modal, TextInput, IconButton, Snackbar } from "react-native-paper";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { SubTopic } from "../../types";
import { addTopicToToday, addSubTopicToToday } from "../../utils/addToToday";

// Design tokens
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { glassAccent, glassText, darkBackground, glass } from "../../constants/glassTheme";
// UI Components
import { Chip, ProgressBar } from "../../components/ui";
import { GlassCard, GlassButton } from "../../components/glass";

interface SubTopicWithCount extends SubTopic {
    taskCount: number;
    completedCount: number;
}

export default function TopicDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    const [topicName, setTopicName] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectColor, setSubjectColor] = useState(glassAccent.mint);
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
                setSubjectColor((topicData as any).subjects?.color || glassAccent.mint);
            }

            // Fetch sub-topics with task counts
            const { data: subTopicsData } = await supabase
                .from("sub_topics")
                .select(`*, tasks (id, is_completed)`)
                .eq("topic_id", id)
                .order("order_index", { ascending: true });

            const subTopicsWithCounts = (subTopicsData || []).map(st => ({
                ...st,
                taskCount: (st.tasks || []).length,
                completedCount: (st.tasks || []).filter((t: any) => t.is_completed).length,
                tasks: undefined,
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
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: topicName || "Topic",
                        headerStyle: { backgroundColor: darkBackground.primary },
                        headerTintColor: glassText.primary,
                        headerShadowVisible: false,
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color={glassText.primary} />}
                                onPress={() => router.back()}
                            />
                        ),
                        headerRight: () => (
                            <IconButton
                                icon={() => <Ionicons name="home-outline" size={22} color={glassText.secondary} />}
                                onPress={() => router.replace("/(tabs)")}
                            />
                        ),
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassAccent.mint} />}
                >
                    {/* Header Card */}
                    <GlassCard style={[styles.headerCard, { borderLeftColor: subjectColor, borderLeftWidth: 4 }]}>
                        <View style={styles.headerContent}>
                            <Text variant="bodySmall" style={styles.breadcrumb}>{subjectName}</Text>
                            <Text variant="headlineSmall" style={styles.title}>{topicName}</Text>
                            <View style={styles.progressInfo}>
                                <Chip variant="default" size="sm">{completedTasks}/{totalTasks} tasks</Chip>
                                <Chip variant="default" size="sm" style={{ marginLeft: 8 }}>{subTopics.length} sub-topics</Chip>
                            </View>
                            <ProgressBar progress={progress} color={subjectColor} style={styles.progressBar} />
                            {pendingTasks > 0 && (
                                <GlassButton variant="primary" onPress={handleAddAllToToday} size="sm" style={styles.addAllButton}>
                                    {`Add all to Today (${pendingTasks})`}
                                </GlassButton>
                            )}
                        </View>
                    </GlassCard>

                    {/* Sub-Topics Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Sub-Topics</Text>
                            <GlassButton variant="ghost" size="sm" onPress={() => setModalVisible(true)}>
                                Add
                            </GlassButton>
                        </View>

                        {subTopics.length === 0 ? (
                            <GlassCard style={styles.emptyCard} intensity="light">
                                <View style={styles.emptyContent}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="git-branch-outline" size={32} color={glassText.muted} />
                                    </View>
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        No sub-topics yet
                                    </Text>
                                    <Text variant="bodySmall" style={styles.emptyHint}>
                                        Break down your topic into smaller parts
                                    </Text>
                                    <GlassButton variant="primary" onPress={() => setModalVisible(true)} style={styles.emptyButton}>
                                        Add Sub-Topic
                                    </GlassButton>
                                </View>
                            </GlassCard>
                        ) : (
                            subTopics.map(st => {
                                const stProgress = st.taskCount > 0 ? st.completedCount / st.taskCount : 0;
                                const stPending = st.taskCount - st.completedCount;

                                return (
                                    <GlassCard
                                        key={st.id}
                                        onPress={() => (router as any).push(`/subtopic/${st.id}`)}
                                        style={styles.subTopicCard}
                                        intensity="light"
                                    >
                                        <View style={styles.subTopicContent}>
                                            <View style={styles.subTopicHeader}>
                                                <View style={styles.subTopicInfo}>
                                                    <Text variant="titleMedium" style={styles.subTopicName}>{st.name}</Text>
                                                    <Text variant="bodySmall" style={styles.subTopicStats}>
                                                        {st.completedCount}/{st.taskCount} tasks completed
                                                    </Text>
                                                </View>
                                                <View style={styles.subTopicActions}>
                                                    {stPending > 0 && (
                                                        <TouchableOpacity
                                                            onPress={() => handleAddSubTopicToToday(st.id)}
                                                            style={styles.addButton}
                                                        >
                                                            <Ionicons name="add-circle-outline" size={22} color={glassAccent.mint} />
                                                        </TouchableOpacity>
                                                    )}
                                                    <Ionicons name="chevron-forward" size={20} color={glassText.muted} />
                                                </View>
                                            </View>
                                            <ProgressBar progress={stProgress} color={subjectColor} style={styles.subTopicProgress} />
                                        </View>
                                    </GlassCard>
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
                            outlineColor={glass.border.light}
                            activeOutlineColor={glassAccent.mint}
                            textColor={glassText.primary}
                            theme={{ colors: { background: darkBackground.primary, placeholder: glassText.secondary, text: glassText.primary } }}
                        />
                        <View style={styles.modalButtons}>
                            <GlassButton variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
                                Cancel
                            </GlassButton>
                            <GlassButton variant="primary" onPress={handleCreateSubTopic} loading={isCreating} style={{ flex: 1 }}>
                                Add
                            </GlassButton>
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
    container: { flex: 1, backgroundColor: darkBackground.primary },
    scrollContent: { paddingBottom: 100 },
    // Header
    headerCard: { marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: borderRadius.lg },
    headerContent: { padding: spacing.md },
    breadcrumb: { color: glassText.secondary, marginBottom: 4 },
    title: { color: glassText.primary, fontWeight: "600" },
    progressInfo: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.sm },
    progressBar: { height: 6, borderRadius: 3 },
    addAllButton: { marginTop: spacing.sm },
    // Section
    section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    sectionTitle: { color: glassText.primary, fontWeight: "600" },
    // Empty State
    emptyCard: {},
    emptyContent: { alignItems: "center", paddingVertical: spacing.xl },
    emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: glassText.muted + '20', alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    emptyText: { color: glassText.primary, fontWeight: "500" },
    emptyHint: { color: glassText.secondary, marginTop: 4 },
    emptyButton: { marginTop: spacing.md },
    // Sub-Topic Cards
    subTopicCard: { marginBottom: spacing.sm, padding: 0 },
    subTopicContent: { padding: spacing.md },
    subTopicHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    subTopicInfo: { flex: 1 },
    subTopicName: { color: glassText.primary },
    subTopicStats: { color: glassText.secondary, marginTop: 4 },
    subTopicActions: { flexDirection: "row", alignItems: "center" },
    addButton: { padding: spacing.xs, marginRight: spacing.xs },
    subTopicProgress: { height: 4, borderRadius: 2, marginTop: spacing.sm },
    // Modal
    modal: { backgroundColor: darkBackground.elevated, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalTitle: { color: glassText.primary, fontWeight: "600", marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.md, backgroundColor: darkBackground.primary },
    modalButtons: { flexDirection: "row", gap: spacing.sm },
    // Snackbar
    snackbar: { backgroundColor: glassAccent.blue },
});
