import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator } from "react-native";
import { Card, Text, Button, Portal, Modal, TextInput, useTheme, TouchableRipple } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

interface Note {
    id: string;
    title: string;
    content: string;
    note_date: string;
    created_at: string;
}

export default function NotesScreen() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [notes, setNotes] = useState<Note[]>([]);
    const [dailyNotes, setDailyNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    const fetchNotes = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("task_notes")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) {
                // Table might not exist yet - silently fail
                setNotes([]);
            } else {
                setNotes(data || []);
            }
        } catch (error) {
            setNotes([]);
        }
        setIsLoading(false);
    };

    const fetchDailyNotes = () => {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const filtered = notes.filter(note => note.note_date === dateStr);
        setDailyNotes(filtered);
    };

    useEffect(() => {
        fetchNotes();
    }, [user]);

    useEffect(() => {
        fetchDailyNotes();
    }, [selectedDate, notes]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotes();
        setRefreshing(false);
    };

    const handleSaveNote = async () => {
        if (!noteTitle.trim() || !user) return;
        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from("task_notes")
                .insert({
                    user_id: user.id,
                    title: noteTitle.trim(),
                    content: noteContent.trim(),
                    note_date: format(selectedDate, "yyyy-MM-dd"),
                })
                .select()
                .single();
            if (error) {
                // Table might not exist
                console.warn("Notes table not found - run schema_v2.sql");
            } else if (data) {
                setNotes([data, ...notes]);
                setModalVisible(false);
                setNoteTitle("");
                setNoteContent("");
            }
        } catch (error) {
            console.warn("Could not save note");
        }
        setIsSaving(false);
    };

    const hasNotesOnDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return notes.some(note => note.note_date === dateStr);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>Loading notes...</Text>
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
                        <Text variant="headlineLarge" style={styles.title}>Notes</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Your study journal</Text>
                    </View>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableRipple onPress={() => setSelectedDate(subDays(selectedDate, 30))} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
                        </TouchableRipple>
                        <Text variant="titleMedium" style={styles.monthText}>{format(selectedDate, "MMMM yyyy")}</Text>
                        <TouchableRipple onPress={() => setSelectedDate(addDays(selectedDate, 30))} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
                        </TouchableRipple>
                    </View>

                    {/* Calendar */}
                    <Card style={styles.calendarCard} mode="outlined">
                        <Card.Content>
                            <View style={styles.weekDaysRow}>
                                {weekDays.map((day, i) => (
                                    <View key={i} style={styles.weekDay}>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{day}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.daysGrid}>
                                {daysInMonth.map((day, index) => {
                                    const isToday = isSameDay(day, new Date());
                                    const isSelected = isSameDay(day, selectedDate);
                                    const hasNotes = hasNotesOnDate(day);
                                    return (
                                        <TouchableRipple key={index} onPress={() => setSelectedDate(day)} style={styles.dayWrapper}>
                                            <View style={[styles.dayCell, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}>
                                                <Text variant="bodyMedium" style={[styles.dayText, isSelected && styles.dayTextSelected, isToday && !isSelected && styles.dayTextToday]}>
                                                    {format(day, "d")}
                                                </Text>
                                                {hasNotes && <View style={styles.noteDot} />}
                                            </View>
                                        </TouchableRipple>
                                    );
                                })}
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Notes Section */}
                    <View style={styles.notesSection}>
                        <View style={styles.notesSectionHeader}>
                            <View>
                                <Text variant="titleMedium" style={{ color: "#E5E7EB" }}>{format(selectedDate, "MMMM d, yyyy")}</Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{dailyNotes.length} notes</Text>
                            </View>
                            <Button mode="contained" compact onPress={() => setModalVisible(true)} icon={() => <Ionicons name="add" size={16} color="#FFF" />}>
                                Add
                            </Button>
                        </View>

                        {dailyNotes.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <Card.Content style={styles.emptyContent}>
                                    <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 12 }}>
                                        No notes for this day.{"\n"}Tap "Add" to create one.
                                    </Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            dailyNotes.map((note) => (
                                <Card key={note.id} style={styles.noteCard} mode="outlined">
                                    <Card.Content>
                                        <Text variant="titleMedium" style={{ color: "#E5E7EB" }}>{note.title}</Text>
                                        {note.content && (
                                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }} numberOfLines={3}>
                                                {note.content}
                                            </Text>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Modal */}
                <Portal>
                    <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={styles.modalTitle}>New Note</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{format(selectedDate, "MMMM d, yyyy")}</Text>
                        </View>
                        <TextInput
                            label="Title"
                            value={noteTitle}
                            onChangeText={setNoteTitle}
                            mode="outlined"
                            style={styles.modalInput}
                        />
                        <TextInput
                            label="Content (optional)"
                            value={noteContent}
                            onChangeText={setNoteContent}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.modalInput}
                        />
                        <Button
                            mode="contained"
                            onPress={handleSaveNote}
                            style={styles.createButton}
                            loading={isSaving}
                            disabled={isSaving || !noteTitle.trim()}
                        >
                            Save Note
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
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    navButton: { padding: 12 },
    monthText: { color: "#E5E7EB", fontWeight: "600", marginHorizontal: 20 },
    calendarCard: { marginHorizontal: 24, marginBottom: 24, backgroundColor: "#1E293B" },
    weekDaysRow: { flexDirection: "row", marginBottom: 8 },
    weekDay: { flex: 1, alignItems: "center" },
    daysGrid: { flexDirection: "row", flexWrap: "wrap" },
    dayWrapper: { width: "14.28%" },
    dayCell: { aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999, position: "relative" },
    daySelected: { backgroundColor: "#38BDF8" },
    dayToday: { borderWidth: 1, borderColor: "#38BDF8" },
    dayText: { color: "#E5E7EB" },
    dayTextSelected: { color: "#FFFFFF", fontWeight: "bold" },
    dayTextToday: { color: "#38BDF8" },
    noteDot: { position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: "#22C55E" },
    notesSection: { paddingHorizontal: 24 },
    notesSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    emptyCard: { backgroundColor: "#1E293B" },
    emptyContent: { alignItems: "center", paddingVertical: 40 },
    noteCard: { marginBottom: 12, backgroundColor: "#1E293B" },
    modal: { backgroundColor: "#1E293B", margin: 20, padding: 24, borderRadius: 16 },
    modalHeader: { marginBottom: 20 },
    modalTitle: { color: "#E5E7EB", fontWeight: "bold" },
    modalInput: { marginBottom: 16, backgroundColor: "#0F172A" },
    createButton: { marginTop: 8, borderRadius: 12 },
});
