import { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Portal, Modal, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSubjectStore } from "../../store/subjectStore";
import { SubjectHealth, getAllSubjectHealthScores, getHealthLabel } from "../../utils/healthScore";

// Design tokens
import { text, semantic, borderRadius } from "../../constants/theme";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
// UI Components
import { Chip } from "../../components/ui";
import { GlassCard, GlassButton, GlassInput, MeshGradientBackground } from "../../components/glass";

// Subject colors - consistent with Glass Theme
const SUBJECT_COLORS = [
    glassAccent.mint,
    glassAccent.warm,
    glassAccent.blue,
    "#E8C9A0", // Beige-ish
    "#C9A0E8", // Lavender
    "#A0E8C9", // Aqua
    "#FF9F9F", // Salmon
    "#E8A0C9"  // Pink
];
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

    useEffect(() => {
        fetchSubjects();
        fetchHealthScores();
    }, []);

    const fetchHealthScores = async () => {
        const scores = await getAllSubjectHealthScores();
        setHealthScores(scores);
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
            case 'healthy': return glassAccent.mint; // Success/Good
            case 'needs_attention': return glassAccent.warm; // Warning
            case 'critical': return "#FF6B6B"; // Critical Error
            default: return glassText.muted;
        }
    };

    if (isLoading && subjects.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={glassAccent.mint} />
                <Text variant="bodyMedium" style={{ color: glassText.secondary, marginTop: 16 }}>Loading subjects...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <MeshGradientBackground />
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={glassAccent.mint} />}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="headlineLarge" style={[styles.title, { color: glassText.primary }]}>Subjects</Text>
                        <Text variant="bodyMedium" style={{ color: glassText.secondary }}>
                            {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
                        </Text>
                    </View>

                    {/* Weakest Subject Alert */}
                    {weakestSubject && weakestSubject.level === 'needs_attention' && (
                        <GlassCard style={styles.alertCard} intensity="light">
                            <View style={styles.alertContent}>
                                <Ionicons name="alert-circle" size={20} color={glassAccent.warm} />
                                <View style={styles.alertInfo}>
                                    <Text variant="bodyMedium" style={{ color: glassText.primary }}>
                                        {weakestSubject.subjectName} needs attention
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                        Score: {weakestSubject.score}% • {weakestSubject.missedCount} missed tasks
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>
                    )}

                    {/* Subjects Grid */}
                    {subjects.length === 0 ? (
                        <GlassCard style={styles.emptyCard}>
                            <View style={styles.emptyContent}>
                                <Ionicons name="book-outline" size={48} color={glassText.muted} />
                                <Text variant="bodyMedium" style={{ color: glassText.secondary, textAlign: "center", marginTop: 12 }}>
                                    No subjects yet.{"\n"}Start by adding your first subject.
                                </Text>
                                <View style={{display: "flex", justifyContent: "center", alignItems: "center", marginTop: 20}}>
                                    <GlassButton onPress={() => setModalVisible(true)}>
                                        Add Subject
                                    </GlassButton>  
                                </View>
                            </View>
                        </GlassCard>
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
                                        <GlassCard style={[styles.subjectCard, { borderLeftColor: subject.color, borderLeftWidth: 4 }]} intensity="medium">
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
                                                    <Ionicons name="layers-outline" size={14} color={glassText.muted} />
                                                    <Text variant="bodySmall" style={{ color: glassText.secondary, marginLeft: 4 }}>
                                                        Tap to view
                                                    </Text>
                                                </View>
                                            )}
                                        </GlassCard>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Add Card */}
                            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.cardWrapper} activeOpacity={0.7}>
                                <GlassCard style={styles.addCard} intensity="light">
                                    <View style={styles.addCardContent}>
                                        <Ionicons name="add-circle-outline" size={32} color={glassAccent.mint} />
                                        <Text variant="bodyMedium" style={{ color: glassAccent.mint, marginTop: 8 }}>Add Subject</Text>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Modal */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>New Subject</Text>

                        <GlassInput
                            label="Subject name"
                            value={newSubjectName}
                            onChangeText={setNewSubjectName}
                            placeholder="e.g. Mathematics, Physics"
                            style={styles.modalInput}
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

                        <GlassButton
                            onPress={handleCreateSubject}
                            loading={isCreating}
                            disabled={isCreating || !newSubjectName.trim()}
                            fullWidth
                        >
                            Create Subject
                        </GlassButton>
                    </Modal>
                </Portal>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    title: { fontWeight: "bold" },
    alertCard: { marginHorizontal: 24, marginBottom: 20 },
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
    subjectName: { color: glassText.primary, fontWeight: "600", marginBottom: 8 },
    subjectMeta: { flexDirection: "row", alignItems: "center" },
    healthMeta: { flexDirection: "row", alignItems: "center" },
    healthDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    addCard: { minHeight: 150, borderStyle: "dashed", borderWidth: 2, borderColor: glass.border.light },
    addCardContent: { alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 40 },
    modal: { backgroundColor: darkBackground.elevated, margin: 20, padding: 24, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalTitle: { color: glassText.primary, fontWeight: "bold", marginBottom: 20 },
    modalInput: { marginBottom: 16, backgroundColor: darkBackground.primary },
    label: { color: glassText.secondary, marginBottom: 12, marginTop: 8 },
    colorRow: { flexDirection: "row", gap: 12, marginBottom: 16, flexWrap: "wrap" },
    colorOption: { width: 36, height: 36, borderRadius: 18 },
    colorSelected: { borderWidth: 3, borderColor: glassAccent.mint },
    iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    iconOption: { width: 44, height: 44, borderRadius: 8, backgroundColor: darkBackground.primary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: glass.border.light },
    iconSelected: { borderWidth: 2, borderColor: glassAccent.mint },
    iconOptionText: { fontSize: 20 },
});
