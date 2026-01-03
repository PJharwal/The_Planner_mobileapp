import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Text, Portal, Modal, TextInput, Snackbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, isToday } from "date-fns";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { useTaskStore } from "../../store/taskStore";

// Design tokens
import { text, semantic, borderRadius } from "../../constants/theme";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
// UI Components
import { Chip } from "../../components/ui";
import { GlassCard, GlassButton, GlassInput, MeshGradientBackground } from "../../components/glass";

interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
    created_at: string;
}

interface DailyTask {
    id: string;
    title: string;
    priority: string;
    is_completed: boolean;
    due_date: string;
}

export default function NotesScreen() {
    const { user } = useAuthStore();
    const { createTask, fetchTodayTasks } = useTaskStore();
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Notes state
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [notes, setNotes] = useState<Note[]>([]);
    const [dailyNotes, setDailyNotes] = useState<Note[]>([]);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Task state
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    const fetchNotes = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("daily_notes")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (!error) {
                setNotes(data || []);
            } else {
                console.error("Notes fetch error:", error);
            }
        } catch (error) {
            console.warn("Notes fetch failed:", error);
        }
    };

    const fetchTasksForDate = useCallback(async () => {
        if (!user) return;
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const { data } = await supabase
                .from("tasks")
                .select("id, title, priority, is_completed, due_date")
                .eq("due_date", dateStr)
                .order("priority", { ascending: false });
            setDailyTasks(data || []);
        } catch (error) {
            console.warn("Tasks fetch failed");
        }
    }, [selectedDate, user]);

    const fetchDailyNotes = useCallback(() => {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const filtered = notes.filter(note => note.date === dateStr);
        setDailyNotes(filtered);
    }, [selectedDate, notes]);

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            await fetchNotes();
            setIsLoading(false);
        };
        loadAll();
    }, [user]);

    useEffect(() => {
        fetchDailyNotes();
        fetchTasksForDate();
    }, [fetchDailyNotes, fetchTasksForDate]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotes();
        await fetchTasksForDate();
        setRefreshing(false);
    };

    const handleSaveNote = async () => {
        if (!noteTitle.trim() || !user) return;
        setIsSaving(true);
        try {
            if (editingNote) {
                // Update existing note
                const { data, error } = await supabase
                    .from("daily_notes")
                    .update({
                        title: noteTitle.trim(),
                        content: noteContent.trim() || noteTitle.trim(),
                    })
                    .eq("id", editingNote.id)
                    .select()
                    .single();
                if (!error && data) {
                    setNotes(notes.map(n => n.id === editingNote.id ? data : n));
                    setNoteModalVisible(false);
                    setNoteTitle("");
                    setNoteContent("");
                    setEditingNote(null);
                    setSnackbarMessage("Note updated!");
                    setSnackbarVisible(true);
                } else if (error) {
                    Alert.alert("Error", "Could not update note. Please try again.");
                }
            } else {
                // Create new note
                const { data, error } = await supabase
                    .from("daily_notes")
                    .insert({
                        user_id: user.id,
                        title: noteTitle.trim(),
                        content: noteContent.trim() || noteTitle.trim(),
                        date: format(selectedDate, "yyyy-MM-dd"),
                    })
                    .select()
                    .single();
                if (!error && data) {
                    setNotes([data, ...notes]);
                    setNoteModalVisible(false);
                    setNoteTitle("");
                    setNoteContent("");
                    setSnackbarMessage("Note saved!");
                    setSnackbarVisible(true);
                } else if (error) {
                    Alert.alert("Error", "Could not save note. Please try again.");
                }
            }
        } catch (error) {
            console.warn("Could not save note:", error);
            Alert.alert("Error", "Could not save note. Please try again.");
        }
        setIsSaving(false);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content || "");
        setNoteModalVisible(true);
    };

    const handleDeleteNote = (note: Note) => {
        Alert.alert(
            "Delete Note",
            `Are you sure you want to delete "${note.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from("daily_notes")
                                .delete()
                                .eq("id", note.id);
                            if (!error) {
                                setNotes(notes.filter(n => n.id !== note.id));
                                setSnackbarMessage("Note deleted!");
                                setSnackbarVisible(true);
                            } else {
                                Alert.alert("Error", "Could not delete note.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Could not delete note.");
                        }
                    }
                }
            ]
        );
    };

    const openNewNoteModal = () => {
        setEditingNote(null);
        setNoteTitle("");
        setNoteContent("");
        setNoteModalVisible(true);
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim() || !user) return;
        setIsSaving(true);
        try {
            // Get first available sub_topic with its topic_id
            const { data: subTopics } = await supabase
                .from("sub_topics")
                .select("id, topic_id")
                .limit(1);

            if (!subTopics || subTopics.length === 0) {
                Alert.alert("Setup Required", "Please create a Subject > Topic > Sub-Topic first before adding tasks.");
                setIsSaving(false);
                return;
            }

            // Insert task with all required foreign keys
            const { error } = await supabase.from("tasks").insert({
                user_id: user.id,
                sub_topic_id: subTopics[0].id,
                topic_id: subTopics[0].topic_id,
                title: newTaskTitle.trim(),
                priority: "medium",
                due_date: format(selectedDate, "yyyy-MM-dd"),
            });

            if (error) throw error;

            setTaskModalVisible(false);
            setNewTaskTitle("");
            await fetchTasksForDate();

            const dayLabel = isToday(selectedDate) ? "today" : format(selectedDate, "MMMM d");
            setSnackbarMessage(`Task added for ${dayLabel}!`);
            setSnackbarVisible(true);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Could not create task");
        }
        setIsSaving(false);
    };

    const hasNotesOnDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return notes.some(note => note.date === dateStr);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={glassAccent.mint} />
                <Text variant="bodyMedium" style={{ color: glassText.secondary, marginTop: 16 }}>Loading...</Text>
            </View>
        );
    }

    const isFutureDate = isFuture(selectedDate) && !isToday(selectedDate);

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
                        <Text variant="headlineLarge" style={[styles.title, { color: glassText.primary }]}>Calendar</Text>
                        <Text variant="bodyMedium" style={{ color: glassText.secondary }}>Plan your study sessions</Text>
                    </View>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={() => setSelectedDate(subDays(selectedDate, 30))} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color={glassAccent.mint} />
                        </TouchableOpacity>
                        <Text variant="titleMedium" style={styles.monthText}>{format(selectedDate, "MMMM yyyy")}</Text>
                        <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 30))} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color={glassAccent.mint} />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar */}
                    <GlassCard style={styles.calendarCard} intensity="light">
                        <View style={styles.weekDaysRow}>
                            {weekDays.map((day, i) => (
                                <View key={i} style={styles.weekDay}>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>{day}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.daysGrid}>
                            {daysInMonth.map((day, index) => {
                                const isDayToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                const hasNotes = hasNotesOnDate(day);
                                return (
                                    <TouchableOpacity key={index} onPress={() => setSelectedDate(day)} style={styles.dayWrapper}>
                                        <View style={[styles.dayCell, isSelected && styles.daySelected, isDayToday && !isSelected && styles.dayToday]}>
                                            <Text variant="bodyMedium" style={[styles.dayText, isSelected && styles.dayTextSelected, isDayToday && !isSelected && styles.dayTextToday]}>
                                                {format(day, "d")}
                                            </Text>
                                            {hasNotes && <View style={styles.noteDot} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </GlassCard>

                    {/* Day Detail Section */}
                    <View style={styles.daySection}>
                        <View style={styles.daySectionHeader}>
                            <View>
                                <Text variant="titleMedium" style={{ color: glassText.primary }}>{format(selectedDate, "MMMM d, yyyy")}</Text>
                                <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                    {dailyTasks.length} tasks • {dailyNotes.length} notes
                                </Text>
                            </View>
                            <View style={styles.addButtons}>
                                <GlassButton size="sm" variant="ghost" onPress={() => setTaskModalVisible(true)}>
                                    + Task
                                </GlassButton>
                                <GlassButton size="sm" onPress={openNewNoteModal}>
                                    + Note
                                </GlassButton>
                            </View>
                        </View>

                        {/* Future Date Banner */}
                        {isFutureDate && (
                            <GlassCard style={styles.futureBanner} intensity="light">
                                <View style={styles.futureBannerContent}>
                                    <Ionicons name="calendar-outline" size={20} color={glassText.primary} />
                                    <Text variant="bodySmall" style={{ color: glassText.primary, marginLeft: 8 }}>
                                        Planning ahead! Tasks added here will appear on this date.
                                    </Text>
                                </View>
                            </GlassCard>
                        )}

                        {/* Tasks for this date */}
                        {dailyTasks.length > 0 && (
                            <View style={styles.tasksContainer}>
                                <Text variant="labelLarge" style={styles.sectionLabel}>Tasks</Text>
                                {dailyTasks.map((task) => (
                                    <GlassCard key={task.id} style={[styles.taskCard, task.is_completed && styles.taskCompleted]} intensity="light">
                                        <View style={styles.taskRow}>
                                            <Ionicons
                                                name={task.is_completed ? "checkmark-circle" : "ellipse-outline"}
                                                size={20}
                                                color={task.is_completed ? semantic.success : glassText.muted}
                                            />
                                            <Text
                                                variant="bodyMedium"
                                                style={[styles.taskTitle, task.is_completed && styles.taskTitleDone]}
                                            >
                                                {task.title}
                                            </Text>
                                            <Chip variant={`priority-${task.priority}` as any} size="sm">
                                                {task.priority}
                                            </Chip>
                                        </View>
                                    </GlassCard>
                                ))}
                            </View>
                        )}

                        {/* Notes for this date */}
                        {dailyNotes.length > 0 && (
                            <View style={styles.notesContainer}>
                                <Text variant="labelLarge" style={styles.sectionLabel}>Notes</Text>
                                {dailyNotes.map((note) => (
                                    <GlassCard key={note.id} style={styles.noteCard} intensity="light">
                                        <View style={styles.noteHeader}>
                                            <Text variant="titleMedium" style={{ color: glassText.primary, flex: 1 }}>{note.title}</Text>
                                            <View style={styles.noteActions}>
                                                <TouchableOpacity onPress={() => handleEditNote(note)} style={styles.noteActionBtn}>
                                                    <Ionicons name="pencil-outline" size={18} color={glassText.secondary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteNote(note)} style={styles.noteActionBtn}>
                                                    <Ionicons name="trash-outline" size={18} color={glassAccent.warm} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {note.content && note.content !== note.title && (
                                            <Text variant="bodyMedium" style={{ color: glassText.secondary, marginTop: 8 }} numberOfLines={3}>
                                                {note.content}
                                            </Text>
                                        )}
                                    </GlassCard>
                                ))}
                            </View>
                        )}

                        {/* Empty State */}
                        {dailyTasks.length === 0 && dailyNotes.length === 0 && (
                            <GlassCard style={styles.emptyCard} bordered={false}>
                                <View style={styles.emptyContent}>
                                    <Ionicons name="document-text-outline" size={48} color={glassText.muted} />
                                    <Text variant="bodyMedium" style={{ color: glassText.secondary, textAlign: "center", marginTop: 12 }}>
                                        Nothing planned for this day.{"\n"}Add a task or note to get started.
                                    </Text>
                                </View>
                            </GlassCard>
                        )}
                    </View>
                </ScrollView>

                {/* Note Modal */}
                <Portal>
                    <Modal visible={noteModalVisible} onDismiss={() => { setNoteModalVisible(false); setEditingNote(null); }} contentContainerStyle={{ padding: 20 }}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "position" : "height"}
                            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
                        >
                            <View style={{ backgroundColor: darkBackground.elevated, borderRadius: borderRadius.lg, padding: 24, borderWidth: 1, borderColor: glass.border.light }}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <View style={styles.modalHeader}>
                                        <Text variant="titleLarge" style={styles.modalTitle}>{editingNote ? "Edit Note" : "New Note"}</Text>
                                        <Text variant="bodySmall" style={{ color: glassText.secondary }}>{format(selectedDate, "MMMM d, yyyy")}</Text>
                                    </View>
                                    <GlassInput
                                        label="Title"
                                        value={noteTitle}
                                        onChangeText={setNoteTitle}
                                        style={styles.modalInput}
                                    />
                                    <GlassInput
                                        label="Content (optional)"
                                        value={noteContent}
                                        onChangeText={setNoteContent}
                                        multiline
                                        numberOfLines={8}
                                        style={[styles.modalInput, { maxHeight: 200 }]}
                                    />
                                    <GlassButton
                                        onPress={handleSaveNote}
                                        loading={isSaving}
                                        disabled={isSaving || !noteTitle.trim()}
                                        fullWidth
                                    >
                                        {editingNote ? "Update Note" : "Save Note"}
                                    </GlassButton>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                </Portal>

                {/* Task Modal */}
                <Portal>
                    <Modal visible={taskModalVisible} onDismiss={() => setTaskModalVisible(false)} contentContainerStyle={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={styles.modalTitle}>New Task</Text>
                            <Chip variant={isFutureDate ? "primary" : "default"} size="sm">
                                {format(selectedDate, "MMM d, yyyy")}
                            </Chip>
                        </View>
                        {isFutureDate && (
                            <Text variant="bodySmall" style={styles.futureHint}>
                                This task will appear in Today on {format(selectedDate, "MMMM d")}.
                            </Text>
                        )}
                        <GlassInput
                            label="Task title"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            style={styles.modalInput}
                        />
                        <GlassButton
                            onPress={handleCreateTask}
                            loading={isSaving}
                            disabled={isSaving || !newTaskTitle.trim()}
                            fullWidth
                        >
                            {isFutureDate ? "Schedule Task" : "Add Task"}
                        </GlassButton>
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
    container: { flex: 1, backgroundColor: 'transparent' },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
    title: { fontWeight: "bold" },
    monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    navButton: { padding: 12 },
    monthText: { color: glassText.primary, fontWeight: "600", marginHorizontal: 20 },
    calendarCard: { marginHorizontal: 24, marginBottom: 24, padding: 16 },
    weekDaysRow: { flexDirection: "row", marginBottom: 8 },
    weekDay: { flex: 1, alignItems: "center" },
    daysGrid: { flexDirection: "row", flexWrap: "wrap" },
    dayWrapper: { width: "14.28%" },
    dayCell: { aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 999, position: "relative" },
    daySelected: { backgroundColor: glassAccent.mint },
    dayToday: { borderWidth: 1.5, borderColor: glassAccent.mint },
    dayText: { color: glassText.primary },
    dayTextSelected: { color: "#000", fontWeight: "bold" },
    dayTextToday: { color: glassAccent.mint },
    noteDot: { position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: glassAccent.mint },
    daySection: { paddingHorizontal: 24 },
    daySectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    addButtons: { flexDirection: "row", gap: 8 },
    futureBanner: { marginBottom: 16, padding: 12 },
    futureBannerContent: { flexDirection: "row", alignItems: "center" },
    tasksContainer: { marginBottom: 16 },
    sectionLabel: { color: glassText.secondary, marginBottom: 8 },
    taskCard: { marginBottom: 8, padding: 12 },
    taskCompleted: { opacity: 0.6 },
    taskRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    taskTitle: { flex: 1, color: glassText.primary },
    taskTitleDone: { textDecorationLine: "line-through", color: glassText.muted },
    notesContainer: { marginBottom: 16 },
    noteCard: { marginBottom: 12, padding: 16 },
    noteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    noteActions: { flexDirection: "row", gap: 8 },
    noteActionBtn: { padding: 4 },
    emptyCard: { padding: 24 },
    emptyContent: { alignItems: "center", paddingVertical: 20 },
    modal: { backgroundColor: darkBackground.elevated, margin: 20, padding: 24, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: glass.border.light },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    modalTitle: { color: glassText.primary, fontWeight: "bold" },
    modalInput: { marginBottom: 16, backgroundColor: darkBackground.primary },
    futureHint: { color: glassAccent.mint, marginBottom: 16, fontStyle: "italic" },
    snackbar: { backgroundColor: darkBackground.elevated, borderWidth: 1, borderColor: glass.border.light },
});
