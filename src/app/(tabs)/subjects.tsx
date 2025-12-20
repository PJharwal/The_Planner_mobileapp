import { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Card, Text, Portal, Modal, TextInput, Button, useTheme, TouchableRipple, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSubjectStore } from "../../store/subjectStore";
import { SubjectHealth, getAllSubjectHealthScores, getHealthColor, getHealthLabel } from "../../utils/healthScore";

const SUBJECT_COLORS = ["#38BDF8", "#22C55E", "#FACC15", "#EF4444", "#A855F7", "#EC4899", "#F97316", "#14B8A6"];
const SUBJECT_ICONS = ["📚", "🧮", "🔬", "📖", "🎨", "🌍", "💻", "🎵", "🏃", "📐"];

export default function SubjectsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { subjects, fetchSubjects, createSubject, isLoading } = useSubjectStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
    const [isCreating, setIsCreating] = useState(false);

    // Health scores
    const [healthScores, setHealthScores] = useState<SubjectHealth[]>([]);
    const [loadingHealth, setLoadingHealth] = useState(true);

    useEffect(() => {
        fetchSubjects();
        fetchHealthScores();
    }, []);

    const fetchHealthScores = async () => {
        setLoadingHealth(true);
        const scores = await getAllSubjectHealthScores();
        setHealthScores(scores);
        setLoadingHealth(false);
    };

    const getHealthForSubject = (subjectId: string): SubjectHealth | undefined => {
        return healthScores.find(h => h.subjectId === subjectId);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchSubjects(), fetchHealthScores()]);
        setRefreshing(false);
    };

    const handleCreateSubject = async () => {
        if (!newSubjectName.trim()) return;
        setIsCreating(true);
        try {
            await createSubject({ name: newSubjectName.trim(), color: selectedColor, icon: selectedIcon });
            setModalVisible(false);
            setNewSubjectName("");
            setSelectedColor(SUBJECT_COLORS[0]);
            setSelectedIcon(SUBJECT_ICONS[0]);
            await fetchHealthScores();
        } catch (error) {
            console.error(error);
        }
        setIsCreating(false);
    };

    // Find weakest subject
    const weakestSubject = healthScores.length > 0
        ? healthScores.reduce((min, curr) => curr.score < min.score ? curr : min, healthScores[0])
        : null;

    if (isLoading && subjects.length === 0) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>Loading subjects...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="headlineLarge" style={styles.title}>Subjects</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
                        </Text>
                    </View>

                    {/* Weakest Subject Alert */}
                    {weakestSubject && weakestSubject.level === 'needs_attention' && (
                        <Card style={styles.alertCard} mode="outlined">
                            <Card.Content style={styles.alertContent}>
                                <Ionicons name="alert-circle" size={20} color="#FACC15" />
                                <View style={styles.alertInfo}>
                                    <Text variant="bodyMedium" style={{ color: "#E5E7EB" }}>
                                        {weakestSubject.subjectName} needs attention
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>
                                        Score: {weakestSubject.score}% • {weakestSubject.missedCount} missed tasks
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Subjects Grid */}
                    {subjects.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Card.Content style={styles.emptyContent}>
                                <Ionicons name="book-outline" size={48} color="#9CA3AF" />
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
                                    No subjects yet.{"\n"}Start by adding your first subject.
                                </Text>
                                <Button mode="contained" onPress={() => setModalVisible(true)} style={{ marginTop: 20 }}>
                                    Add Subject
                                </Button>
                            </Card.Content>
                        </Card>
                    ) : (
                        <View style={styles.grid}>
                            {subjects.map((subject) => {
                                const health = getHealthForSubject(subject.id);
                                return (
                                    <TouchableRipple
                                        key={subject.id}
                                        onPress={() => router.push(`/subject/${subject.id}`)}
                                        style={styles.cardWrapper}
                                    >
                                        <Card style={[styles.subjectCard, { borderLeftColor: subject.color, borderLeftWidth: 4 }]} mode="outlined">
                                            <Card.Content>
                                                <View style={styles.cardHeader}>
                                                    <View style={[styles.iconContainer, { backgroundColor: subject.color + "20" }]}>
                                                        <Text style={styles.subjectIcon}>{subject.icon}</Text>
                                                    </View>
                                                    {health && (
                                                        <Chip
                                                            compact
                                                            style={{ backgroundColor: getHealthColor(health.level) + "20" }}
                                                            textStyle={{ color: getHealthColor(health.level), fontSize: 10 }}
                                                        >
                                                            {health.score}%
                                                        </Chip>
                                                    )}
                                                </View>
                                                <Text variant="titleMedium" style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>

                                                {health ? (
                                                    <View style={styles.healthMeta}>
                                                        <View style={[styles.healthDot, { backgroundColor: getHealthColor(health.level) }]} />
                                                        <Text variant="bodySmall" style={{ color: getHealthColor(health.level) }}>
                                                            {getHealthLabel(health.level)}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.subjectMeta}>
                                                        <Ionicons name="layers-outline" size={14} color="#9CA3AF" />
                                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                                                            Tap to view
                                                        </Text>
                                                    </View>
                                                )}
                                            </Card.Content>
                                        </Card>
                                    </TouchableRipple>
                                );
                            })}

                            {/* Add Card */}
                            <TouchableRipple onPress={() => setModalVisible(true)} style={styles.cardWrapper}>
                                <Card style={styles.addCard} mode="outlined">
                                    <Card.Content style={styles.addCardContent}>
                                        <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary} />
                                        <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginTop: 8 }}>Add Subject</Text>
                                    </Card.Content>
                                </Card>
                            </TouchableRipple>
                        </View>
                    )}
                </ScrollView>

                {/* Modal */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>New Subject</Text>

                        <TextInput
                            label="Subject name"
                            value={newSubjectName}
                            onChangeText={setNewSubjectName}
                            mode="outlined"
                            style={styles.modalInput}
                            placeholder="e.g. Mathematics, Physics"
                        />

                        <Text variant="labelMedium" style={styles.label}>Color</Text>
                        <View style={styles.colorRow}>
                            {SUBJECT_COLORS.map((color) => (
                                <TouchableRipple key={color} onPress={() => setSelectedColor(color)}>
                                    <View style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorSelected]} />
                                </TouchableRipple>
                            ))}
                        </View>

                        <Text variant="labelMedium" style={styles.label}>Icon</Text>
                        <View style={styles.iconRow}>
                            {SUBJECT_ICONS.map((icon) => (
                                <TouchableRipple key={icon} onPress={() => setSelectedIcon(icon)}>
                                    <View style={[styles.iconOption, selectedIcon === icon && styles.iconSelected]}>
                                        <Text style={styles.iconOptionText}>{icon}</Text>
                                    </View>
                                </TouchableRipple>
                            ))}
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleCreateSubject}
                            style={styles.createButton}
                            loading={isCreating}
                            disabled={isCreating || !newSubjectName.trim()}
                        >
                            Create Subject
                        </Button>
                    </Modal>
                </Portal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    alertCard: { marginHorizontal: 24, marginBottom: 20, backgroundColor: "#FACC1520", borderColor: "#FACC15" },
    alertContent: { flexDirection: "row", alignItems: "center" },
    alertInfo: { marginLeft: 12, flex: 1 },
    emptyCard: { marginHorizontal: 24, backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 48 },
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16 },
    cardWrapper: { width: "50%", padding: 8 },
    subjectCard: { backgroundColor: "#1E293B", minHeight: 150 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    subjectIcon: { fontSize: 22 },
    subjectName: { color: "#E5E7EB", fontWeight: "600", marginBottom: 8 },
    subjectMeta: { flexDirection: "row", alignItems: "center" },
    healthMeta: { flexDirection: "row", alignItems: "center" },
    healthDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    addCard: { backgroundColor: "#1E293B", borderStyle: "dashed", minHeight: 150 },
    addCardContent: { alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 40 },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 20 },
    modalInput: { marginBottom: 16, backgroundColor: "#0F172A" },
    label: { color: "#9CA3AF", marginBottom: 12, marginTop: 8 },
    colorRow: { flexDirection: "row", gap: 12, marginBottom: 16, flexWrap: "wrap" },
    colorOption: { width: 36, height: 36, borderRadius: 18 },
    colorSelected: { borderWidth: 3, borderColor: "#FFFFFF" },
    iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    iconOption: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" },
    iconSelected: { borderWidth: 2, borderColor: "#38BDF8" },
    iconOptionText: { fontSize: 20 },
    createButton: { marginTop: 8, borderRadius: 12 },
});
