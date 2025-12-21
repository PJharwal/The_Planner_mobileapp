import { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { Text, Portal, Modal, TextInput, IconButton } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjectStore } from "../../store/subjectStore";

// Design tokens
import { pastel, background, text, spacing, borderRadius, shadows } from "../../constants/theme";
// UI Components
import { Card, Button } from "../../components/ui";

export default function SubjectDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { currentSubject, fetchSubjectWithTopics, createTopic } = useSubjectStore();
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
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loading}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Get soft pastel variant of subject color
    const subjectColor = currentSubject.color || pastel.mint;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: currentSubject.name,
                        headerStyle: { backgroundColor: background.primary },
                        headerTintColor: text.primary,
                        headerShadowVisible: false,
                        headerBackVisible: false,
                        headerLeft: () => (
                            <IconButton
                                icon={() => <Ionicons name="arrow-back" size={24} color={text.primary} />}
                                onPress={() => router.back()}
                                style={{ marginLeft: -4 }}
                            />
                        ),
                        headerRight: () => (
                            <IconButton
                                icon={() => <Ionicons name="home-outline" size={22} color={text.secondary} />}
                                onPress={() => router.replace("/(tabs)")}
                            />
                        ),
                    }}
                />

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Subject Header */}
                    <Card style={styles.headerCard}>
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
                    </Card>

                    {/* Topics Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Topics</Text>
                            <Button variant="primary" size="sm" onPress={() => setModalVisible(true)}>
                                Add Topic
                            </Button>
                        </View>

                        {currentSubject.topics?.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <View style={styles.emptyContent}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="book-outline" size={32} color={text.muted} />
                                    </View>
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        No topics yet
                                    </Text>
                                    <Text variant="bodySmall" style={styles.emptyHint}>
                                        Add your first topic to get started
                                    </Text>
                                </View>
                            </Card>
                        ) : (
                            currentSubject.topics?.map((topic, index) => (
                                <TouchableOpacity key={topic.id} onPress={() => router.push(`/topic/${topic.id}`)} activeOpacity={0.7}>
                                    <Card style={styles.topicCard}>
                                        <View style={styles.topicContent}>
                                            <View style={[styles.topicNumber, { backgroundColor: `${subjectColor}25` }]}>
                                                <Text style={[styles.topicNumberText, { color: subjectColor }]}>{index + 1}</Text>
                                            </View>
                                            <View style={styles.topicInfo}>
                                                <Text variant="bodyLarge" style={styles.topicName}>{topic.name}</Text>
                                                <Text variant="bodySmall" style={styles.topicHint}>Tap to view tasks</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color={text.muted} />
                                        </View>
                                    </Card>
                                </TouchableOpacity>
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
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                        />
                        <Button variant="primary" onPress={handleCreateTopic} loading={isCreating} fullWidth>
                            Add Topic
                        </Button>
                    </Modal>
                </Portal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: background.primary },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loading: { color: text.muted },
    scrollContent: { paddingBottom: 100 },
    // Header Card
    headerCard: { marginHorizontal: spacing.lg, marginTop: spacing.md },
    subjectHeader: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    iconContainer: { width: 56, height: 56, borderRadius: borderRadius.md, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    subjectIcon: { fontSize: 28 },
    headerInfo: { flex: 1 },
    subjectName: { color: text.primary, fontWeight: "600" },
    topicCount: { color: text.secondary, marginTop: 2 },
    // Section
    section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    sectionTitle: { color: text.primary, fontWeight: "600" },
    // Empty State
    emptyCard: { marginTop: spacing.xs },
    emptyContent: { alignItems: "center", paddingVertical: spacing.xl },
    emptyIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${pastel.beige}50`, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    emptyText: { color: text.primary, fontWeight: "500" },
    emptyHint: { color: text.muted, marginTop: 4 },
    // Topic Cards
    topicCard: { marginBottom: spacing.sm },
    topicContent: { flexDirection: "row", alignItems: "center", padding: spacing.md },
    topicNumber: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    topicNumberText: { fontWeight: "600", fontSize: 16 },
    topicInfo: { flex: 1 },
    topicName: { color: text.primary },
    topicHint: { color: text.muted },
    // Modal
    modal: { backgroundColor: background.card, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, ...shadows.elevated },
    modalTitle: { color: text.primary, fontWeight: "600", marginBottom: spacing.md },
    modalInput: { marginBottom: spacing.md, backgroundColor: background.primary },
});
