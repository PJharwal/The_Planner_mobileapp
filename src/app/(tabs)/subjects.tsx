import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    StyleSheet,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSubjectStore } from "../../store/subjectStore";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../constants/theme";

const SUBJECT_COLORS = ["#38BDF8", "#22C55E", "#FACC15", "#EF4444", "#A855F7", "#EC4899"];
const SUBJECT_ICONS = ["📚", "🧮", "🔬", "📖", "🎨", "🌍", "💻", "🎵"];

export default function SubjectsScreen() {
    const router = useRouter();
    const { subjects, fetchSubjects, createSubject, deleteSubject, isLoading } = useSubjectStore();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSubjects();
        setRefreshing(false);
    };

    const handleCreateSubject = async () => {
        if (!newSubjectName.trim()) {
            Alert.alert("Error", "Please enter a subject name");
            return;
        }

        try {
            await createSubject({
                name: newSubjectName.trim(),
                color: selectedColor,
                icon: selectedIcon,
            });
            setModalVisible(false);
            setNewSubjectName("");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDeleteSubject = (id: string, name: string) => {
        Alert.alert("Delete Subject", `Delete "${name}" and all its topics?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteSubject(id) },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[400]} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Subjects</Text>
                    <Text style={styles.subtitle}>Organize your learning</Text>
                </View>

                {/* Subjects Grid */}
                <View style={styles.grid}>
                    {subjects.map((subject) => (
                        <TouchableOpacity
                            key={subject.id}
                            onPress={() => router.push(`/subject/${subject.id}`)}
                            onLongPress={() => handleDeleteSubject(subject.id, subject.name)}
                            style={[styles.subjectCard, { borderColor: subject.color + '40' }]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: subject.color + '20' }]}>
                                <Text style={styles.subjectIcon}>{subject.icon}</Text>
                            </View>
                            <Text style={styles.subjectName}>{subject.name}</Text>
                            <Text style={styles.topicCount}>Tap to view topics</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Add Subject Card */}
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addCard}>
                        <Text style={styles.addIcon}>+</Text>
                        <Text style={styles.addText}>Add Subject</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Create Subject Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Subject</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Subject name"
                            placeholderTextColor={colors.text.muted}
                            value={newSubjectName}
                            onChangeText={setNewSubjectName}
                        />

                        <Text style={styles.label}>Color</Text>
                        <View style={styles.colorPicker}>
                            {SUBJECT_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => setSelectedColor(color)}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.colorSelected,
                                    ]}
                                />
                            ))}
                        </View>

                        <Text style={styles.label}>Icon</Text>
                        <View style={styles.iconPicker}>
                            {SUBJECT_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon}
                                    onPress={() => setSelectedIcon(icon)}
                                    style={[styles.iconOption, selectedIcon === icon && styles.iconSelected]}
                                >
                                    <Text style={styles.iconText}>{icon}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity onPress={handleCreateSubject} style={styles.createButton}>
                            <Text style={styles.createButtonText}>Create Subject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: spacing.xxl, paddingTop: 60, paddingBottom: spacing.xxl },
    title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.text.primary },
    subtitle: { fontSize: fontSize.md, color: colors.text.muted, marginTop: spacing.xs },
    grid: { paddingHorizontal: spacing.xxl, flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
    subjectCard: {
        width: "47%",
        backgroundColor: colors.card,
        borderRadius: borderRadius.xxl,
        padding: spacing.lg,
        borderWidth: 1,
        ...shadows.sm,
    },
    iconContainer: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    subjectIcon: { fontSize: 24 },
    subjectName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.xs },
    topicCount: { fontSize: fontSize.sm, color: colors.text.muted },
    addCard: {
        width: "47%",
        backgroundColor: colors.card,
        borderRadius: borderRadius.xxl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 140,
    },
    addIcon: { fontSize: fontSize.xxxl, color: colors.primary[400], marginBottom: spacing.sm },
    addText: { fontSize: fontSize.md, color: colors.primary[400], fontWeight: fontWeight.medium },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: colors.dark[900], borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xxl },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xxl },
    modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
    closeButton: { fontSize: fontSize.xxl, color: colors.text.muted },
    input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fontSize.md, color: colors.text.primary, marginBottom: spacing.lg },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text.muted, marginBottom: spacing.sm },
    colorPicker: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
    colorOption: { width: 40, height: 40, borderRadius: borderRadius.full },
    colorSelected: { borderWidth: 3, borderColor: colors.white },
    iconPicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.xxl },
    iconOption: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
    iconSelected: { borderColor: colors.primary[400], backgroundColor: colors.primary[400] + '20' },
    iconText: { fontSize: 20 },
    createButton: { backgroundColor: colors.primary[400], borderRadius: borderRadius.lg, paddingVertical: spacing.lg, alignItems: "center" },
    createButtonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
