import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from "react-native";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../../constants/theme";

export default function NotesScreen() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [notes] = useState<{ id: string; title: string; date: Date }[]>([]);

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Notes</Text>
                    <Text style={styles.subtitle}>Your study journal</Text>
                </View>

                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => setSelectedDate(subDays(selectedDate, 30))} style={styles.navButton}>
                        <Text style={styles.navText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthText}>{format(selectedDate, "MMMM yyyy")}</Text>
                    <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 30))} style={styles.navButton}>
                        <Text style={styles.navText}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarCard}>
                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, i) => (
                            <Text key={i} style={styles.weekDayText}>{day}</Text>
                        ))}
                    </View>
                    <View style={styles.daysGrid}>
                        {daysInMonth.map((day, index) => {
                            const isToday = isSameDay(day, new Date());
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedDate(day)}
                                    style={[styles.dayCell, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
                                >
                                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isToday && !isSelected && styles.dayTextToday]}>
                                        {format(day, "d")}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Selected Date Notes */}
                <View style={styles.notesSection}>
                    <View style={styles.notesSectionHeader}>
                        <Text style={styles.sectionTitle}>{format(selectedDate, "MMMM d, yyyy")}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                            <Text style={styles.addButtonText}>+ Add Note</Text>
                        </TouchableOpacity>
                    </View>

                    {notes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>📝</Text>
                            <Text style={styles.emptyText}>No notes for this day</Text>
                        </View>
                    ) : (
                        notes.map((note) => (
                            <View key={note.id} style={styles.noteCard}>
                                <Text style={styles.noteTitle}>{note.title}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Create Note Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Note</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="Note title" placeholderTextColor={colors.text.muted} value={noteTitle} onChangeText={setNoteTitle} />
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Write your note..." placeholderTextColor={colors.text.muted} value={noteContent} onChangeText={setNoteContent} multiline numberOfLines={4} />
                        <TouchableOpacity style={styles.createButton}>
                            <Text style={styles.createButtonText}>Save Note</Text>
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
    header: { paddingHorizontal: spacing.xxl, paddingTop: 60, paddingBottom: spacing.lg },
    title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.text.primary },
    subtitle: { fontSize: fontSize.md, color: colors.text.muted, marginTop: spacing.xs },
    monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.lg },
    navButton: { padding: spacing.md },
    navText: { fontSize: fontSize.xxl, color: colors.primary[400] },
    monthText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary, marginHorizontal: spacing.xl },
    calendarCard: { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: borderRadius.xxl, padding: spacing.lg, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.cardBorder },
    weekDaysRow: { flexDirection: "row", marginBottom: spacing.sm },
    weekDayText: { flex: 1, textAlign: "center", fontSize: fontSize.sm, color: colors.text.muted, fontWeight: fontWeight.medium },
    daysGrid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full },
    dayCellSelected: { backgroundColor: colors.primary[400] },
    dayCellToday: { borderWidth: 1, borderColor: colors.primary[400] },
    dayText: { fontSize: fontSize.md, color: colors.text.primary },
    dayTextSelected: { color: colors.white, fontWeight: fontWeight.bold },
    dayTextToday: { color: colors.primary[400] },
    notesSection: { paddingHorizontal: spacing.xxl },
    notesSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary },
    addButton: { backgroundColor: colors.primary[400], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
    addButtonText: { color: colors.white, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
    emptyState: { alignItems: "center", paddingVertical: spacing.xxxl, backgroundColor: colors.card, borderRadius: borderRadius.xxl },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { fontSize: fontSize.md, color: colors.text.muted },
    noteCard: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
    noteTitle: { fontSize: fontSize.md, color: colors.text.primary, fontWeight: fontWeight.medium },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: colors.dark[900], borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xxl },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xxl },
    modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
    closeButton: { fontSize: fontSize.xxl, color: colors.text.muted },
    input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fontSize.md, color: colors.text.primary, marginBottom: spacing.lg },
    textArea: { height: 120, textAlignVertical: "top" },
    createButton: { backgroundColor: colors.primary[400], borderRadius: borderRadius.lg, paddingVertical: spacing.lg, alignItems: "center" },
    createButtonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
