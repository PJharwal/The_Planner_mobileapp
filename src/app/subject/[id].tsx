import { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { Text, Portal, Modal, TextInput, IconButton } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjectStore } from "../../store/subjectStore";

// Design tokens
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { darkBackground, glassAccent, glassText, glass } from "../../constants/glassTheme";
// UI Components
import { GlassCard, GlassButton } from "../../components/glass";

export default function SubjectDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { currentSubject, fetchSubjectWithTopics, createTopic } = useSubjectStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (id) fetchSubjectWithTopics(id);
    }, [id, fetchSubjectWithTopics]);

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
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loading}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Get subject color (fallback to glassAccent.mint if null/legacy)
    const subjectColor = currentSubject.color || glassAccent.mint;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: currentSubject.name,
                        headerStyle: { backgroundColor: darkBackground.primary },
                        headerTintColor: glassText.primary,
                        headerShadowVisible: false,
                        headerBackVisible: false,
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color={glassText.primary} />}
                                onPress={() => router.back()}
                                style={{ marginLeft: -4 }}
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

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Subject Header */}
                    <GlassCard style={styles.headerCard}>
                        <View style={styles.subjectHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: `${subjectColor}30` }]}>
                                <Text style={styles.subjectIcon}>{currentSubject.icon || "📚"}</Text>
                            </View>
                            <View style={styles.headerInfo}>
                                <Text variant="headlineSmall" style={styles.subjectName}>{currentSubject.name}</Text>
                                <Text variant="bodyMedium" style={styles.topicCount}>
                                    {currentSubject.topics?.length || 0} topics
                                </Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Topics Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Topics</Text>
                            <GlassButton variant="primary" size="sm" onPress={() => setModalVisible(true)}>
                                Add Topic
                            </GlassButton>
                        </View>

                        {currentSubject.topics?.length === 0 ? (
                            <GlassCard style={styles.emptyCard} intensity="light">
                                <View style={styles.emptyContent}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="book-outline" size={32} color={glassText.muted} />
                                    </View>
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        No topics yet
                                    </Text>
                                    <Text variant="bodySmall" style={styles.emptyHint}>
                                        Add your first topic to get started
                                    </Text>
                                </View>
                            </GlassCard>
                        ) : (
                            currentSubject.topics?.map((topic, index) => (
                                <GlassCard
                                    key={topic.id}
                                    onPress={() => router.push(`/topic/${topic.id}`)}
                                    style={styles.topicCard}
                                    intensity="light"
                                >
                                    <View style={styles.topicContent}>
                                        <View style={[styles.topicNumber, { backgroundColor: `${subjectColor}20` }]}>
                                            <Text style={[styles.topicNumberText, { color: subjectColor }]}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.topicInfo}>
                                            <Text variant="bodyLarge" style={styles.topicName}>{topic.name}</Text>
                                            <Text variant="bodySmall" style={styles.topicHint}>Tap to view tasks</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={glassText.muted} />
                                    </View>
                                </GlassCard>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Add Topic Modal */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>Add Topic</Text>
                        <TextInput
                            label="Topic name"
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                            mode="outlined"
                            style={styles.modalInput}
                            outlineColor={glass.border.light}
                            activeOutlineColor={glassAccent.mint}
                            textColor={glassText.primary}
                            theme={{ colors: { background: darkBackground.primary, placeholder: glassText.secondary, text: glassText.primary } }}
                        />
                        <GlassButton variant="primary" onPress={handleCreateTopic} loading={isCreating} fullWidth>
                            Add Topic
                        </GlassButton>
                    </Modal>
                </Portal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: darkBackground.primary },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loading: { color: glassText.secondary },
    scrollContent: { paddingBottom: 100 },
    // Header Card
    headerCard: { marginHorizontal: spacing.lg, marginTop: spacing.md },
    subjectHeader: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    iconContainer: { width: 56, height: 56, borderRadius: borderRadius.md, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    subjectIcon: { fontSize: 28 },
    headerInfo: { flex: 1 },
    subjectName: { color: glassText.primary, fontWeight: "600" },
    topicCount: { color: glassText.secondary, marginTop: 2 },
    // Section
    section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    sectionTitle: { color: glassText.primary, fontWeight: "600" },
    // Empty State
    emptyCard: { marginTop: spacing.xs },
    emptyContent: { alignItems: "center", paddingVertical: spacing.xl },
    emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: glassText.muted + '20', alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    emptyText: { color: glassText.primary, fontWeight: "500" },
    emptyHint: { color: glassText.secondary, marginTop: 4 },
    // Topic Cards
    topicCard: { marginBottom: spacing.sm, padding: 0 },
    topicContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    topicNumber: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    topicNumberText: { fontWeight: "600", fontSize: 16 },
    topicInfo: { flex: 1 },
    topicName: { color: glassText.primary },
    topicHint: { color: glassText.secondary },
    // Modal
    modal: { backgroundColor: darkBackground.elevated, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalTitle: { color: glassText.primary, fontWeight: "600", marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.md, backgroundColor: darkBackground.primary },
});
