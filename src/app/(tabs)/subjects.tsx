import { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Portal, Modal, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSubjectStore } from "../../store/subjectStore";
import { SubjectHealth, getAllSubjectHealthScores, getHealthColor, getHealthLabel } from "../../utils/healthScore";

// Design tokens
import { pastel, background, text, semantic, spacing, borderRadius, shadows } from "../../constants/theme";
// UI Components
import { Card, Button, Chip } from "../../components/ui";

// Pastel subject colors
const SUBJECT_COLORS = [pastel.mint, pastel.peach, "#A0C4E8", "#E8C9A0", "#C9A0E8", "#A0E8C9", pastel.mistBlue, "#E8A0C9"];
const SUBJECT_ICONS = ["📚", "🧮", "🔬", "📖", "🎨", "🌍", "💻", "🎵", "🏃", "📐"];

export default function SubjectsScreen() {
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

    // Soft health colors
    const getSoftHealthColor = (level: string) => {
        switch (level) {
            case 'healthy': return semantic.success;
            case 'needs_attention': return semantic.warning;
            case 'critical': return semantic.error;
            default: return text.muted;
        }
    };

    if (isLoading && subjects.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={pastel.mint} />
                <Text variant="bodyMedium" style={{ color: text.secondary, marginTop: 16 }}>Loading subjects...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={pastel.mint} />}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="headlineLarge" style={styles.title}>Subjects</Text>
                        <Text variant="bodyMedium" style={{ color: text.secondary }}>
                            {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
                        </Text>
                    </View>

                    {/* Weakest Subject Alert */}
                    {weakestSubject && weakestSubject.level === 'needs_attention' && (
                        <Card style={styles.alertCard}>
                            <View style={styles.alertContent}>
                                <Ionicons name="alert-circle" size={20} color={semantic.warning} />
                                <View style={styles.alertInfo}>
                                    <Text variant="bodyMedium" style={{ color: text.primary }}>
                                        {weakestSubject.subjectName} needs attention
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: text.secondary }}>
                                        Score: {weakestSubject.score}% • {weakestSubject.missedCount} missed tasks
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Subjects Grid */}
                    {subjects.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <View style={styles.emptyContent}>
                                <Ionicons name="book-outline" size={48} color={text.muted} />
                                <Text variant="bodyMedium" style={{ color: text.secondary, textAlign: "center", marginTop: 12 }}>
                                    No subjects yet.{"\n"}Start by adding your first subject.
                                </Text>
                                <Button onPress={() => setModalVisible(true)} style={{ marginTop: 20 }}>
                                    Add Subject
                                </Button>
                            </View>
                        </Card>
                    ) : (
                        <View style={styles.grid}>
                            {subjects.map((subject) => {
                                const health = getHealthForSubject(subject.id);
                                return (
                                    <TouchableOpacity
                                        key={subject.id}
                                        onPress={() => router.push(`/subject/${subject.id}`)}
                                        style={styles.cardWrapper}
                                        activeOpacity={0.7}
                                    >
                                        <Card style={[styles.subjectCard, { borderLeftColor: subject.color, borderLeftWidth: 4 }]}>
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.iconContainer, { backgroundColor: subject.color + "25" }]}>
                                                    <Text style={styles.subjectIcon}>{subject.icon}</Text>
                                                </View>
                                                {health && (
                                                    <Chip size="sm" style={{ backgroundColor: getSoftHealthColor(health.level) + "20" }}>
                                                        {health.score}%
                                                    </Chip>
                                                )}
                                            </View>
                                            <Text variant="titleMedium" style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>

                                            {health ? (
                                                <View style={styles.healthMeta}>
                                                    <View style={[styles.healthDot, { backgroundColor: getSoftHealthColor(health.level) }]} />
                                                    <Text variant="bodySmall" style={{ color: getSoftHealthColor(health.level) }}>
                                                        {getHealthLabel(health.level)}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={styles.subjectMeta}>
                                                    <Ionicons name="layers-outline" size={14} color={text.muted} />
                                                    <Text variant="bodySmall" style={{ color: text.secondary, marginLeft: 4 }}>
                                                        Tap to view
                                                    </Text>
                                                </View>
                                            )}
                                        </Card>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Add Card */}
                            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.cardWrapper} activeOpacity={0.7}>
                                <Card style={styles.addCard}>
                                    <View style={styles.addCardContent}>
                                        <Ionicons name="add-circle-outline" size={32} color={pastel.mint} />
                                        <Text variant="bodyMedium" style={{ color: pastel.mint, marginTop: 8 }}>Add Subject</Text>
                                    </View>
                                </Card>
                            </TouchableOpacity>
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
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                        />

                        <Text variant="labelMedium" style={styles.label}>Color</Text>
                        <View style={styles.colorRow}>
                            {SUBJECT_COLORS.map((color) => (
                                <TouchableOpacity key={color} onPress={() => setSelectedColor(color)}>
                                    <View style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorSelected]} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text variant="labelMedium" style={styles.label}>Icon</Text>
                        <View style={styles.iconRow}>
                            {SUBJECT_ICONS.map((icon) => (
                                <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)}>
                                    <View style={[styles.iconOption, selectedIcon === icon && styles.iconSelected]}>
                                        <Text style={styles.iconOptionText}>{icon}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button
                            onPress={handleCreateSubject}
                            loading={isCreating}
                            disabled={isCreating || !newSubjectName.trim()}
                            fullWidth
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
    container: { flex: 1, backgroundColor: background.primary },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    title: { color: text.primary, fontWeight: "bold" },
    alertCard: { marginHorizontal: 24, marginBottom: 20, backgroundColor: semantic.warningLight },
    alertContent: { flexDirection: "row", alignItems: "center" },
    alertInfo: { marginLeft: 12, flex: 1 },
    emptyCard: { marginHorizontal: 24 },
    emptyContent: { alignItems: "center", paddingVertical: 48 },
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16 },
    cardWrapper: { width: "50%", padding: 8 },
    subjectCard: { minHeight: 150, padding: 16 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    subjectIcon: { fontSize: 22 },
    subjectName: { color: text.primary, fontWeight: "600", marginBottom: 8 },
    subjectMeta: { flexDirection: "row", alignItems: "center" },
    healthMeta: { flexDirection: "row", alignItems: "center" },
    healthDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    addCard: { minHeight: 150, borderStyle: "dashed", borderWidth: 2, borderColor: pastel.beige },
    addCardContent: { alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 40 },
    modal: { backgroundColor: background.card, margin: 20, padding: 24, borderRadius: borderRadius.lg },
    modalTitle: { color: text.primary, fontWeight: "bold", marginBottom: 20 },
    modalInput: { marginBottom: 16, backgroundColor: background.primary },
    label: { color: text.secondary, marginBottom: 12, marginTop: 8 },
    colorRow: { flexDirection: "row", gap: 12, marginBottom: 16, flexWrap: "wrap" },
    colorOption: { width: 36, height: 36, borderRadius: 18 },
    colorSelected: { borderWidth: 3, borderColor: pastel.slate },
    iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    iconOption: { width: 44, height: 44, borderRadius: 8, backgroundColor: background.secondary, alignItems: "center", justifyContent: "center" },
    iconSelected: { borderWidth: 2, borderColor: pastel.mint },
    iconOptionText: { fontSize: 20 },
});
