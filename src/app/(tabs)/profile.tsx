import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Avatar, Divider, Snackbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { exportAndShare } from "../../utils/dataExport";

// Design tokens
import { pastel, background, text, semantic, spacing, borderRadius, shadows } from "../../constants/theme";
// UI Components
import { Card, Button } from "../../components/ui";

interface UserStats {
    totalTasks: number;
    completedTasks: number;
    totalSubjects: number;
}

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, isLoading } = useAuthStore();
    const [stats, setStats] = useState<UserStats>({ totalTasks: 0, completedTasks: 0, totalSubjects: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    useEffect(() => {
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;
        try {
            const { count: totalTasks } = await supabase
                .from("tasks")
                .select("*", { count: "exact", head: true });

            const { count: completedTasks } = await supabase
                .from("tasks")
                .select("*", { count: "exact", head: true })
                .eq("is_completed", true);

            const { count: totalSubjects } = await supabase
                .from("subjects")
                .select("*", { count: "exact", head: true });

            setStats({
                totalTasks: totalTasks || 0,
                completedTasks: completedTasks || 0,
                totalSubjects: totalSubjects || 0,
            });
        } catch (error) {
            console.error(error);
        }
        setLoadingStats(false);
    };

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    try {
                        await logout();
                    } catch (error) {
                        console.error("Error signing out:", error);
                        Alert.alert("Error", "Failed to sign out. Please try again.");
                    }
                }
            },
        ]);
    };

    const handleExportData = async () => {
        setIsExporting(true);
        const result = await exportAndShare();
        setIsExporting(false);
        if (!result.success) {
            setSnackbarMessage(result.message);
            setSnackbarVisible(true);
        }
    };

    const menuItems = [
        { icon: "timer-outline" as const, title: "Exam Mode", subtitle: "Set up exam countdown", onPress: () => router.push("/exam/setup") },
        { icon: "download-outline" as const, title: "Export Data", subtitle: "Backup your study data", onPress: handleExportData, loading: isExporting },
    ];

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={pastel.mint} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>Profile</Text>
                </View>

                {/* User Card */}
                <Card style={styles.userCard}>
                    <View style={styles.userContent}>
                        <Avatar.Text
                            size={64}
                            label={user?.full_name?.charAt(0)?.toUpperCase() || "S"}
                            style={{ backgroundColor: pastel.mint }}
                            labelStyle={{ color: pastel.white }}
                        />
                        <View style={styles.userInfo}>
                            <Text variant="titleLarge" style={styles.userName}>{user?.full_name || "Student"}</Text>
                            <Text variant="bodyMedium" style={{ color: text.secondary }}>
                                {user?.email || "student@example.com"}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card gradient="mint" style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {loadingStats ? "-" : stats.totalSubjects}
                            </Text>
                            <Text variant="bodySmall" style={{ color: 'rgba(93, 107, 107, 0.65)' }}>Subjects</Text>
                        </View>
                    </Card>
                    <Card gradient="peach" style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {loadingStats ? "-" : stats.completedTasks}
                            </Text>
                            <Text variant="bodySmall" style={{ color: 'rgba(93, 107, 107, 0.65)' }}>Completed</Text>
                        </View>
                    </Card>
                    <Card gradient="sage" style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {loadingStats ? "-" : `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`}
                            </Text>
                            <Text variant="bodySmall" style={{ color: 'rgba(93, 107, 107, 0.65)' }}>Progress</Text>
                        </View>
                    </Card>
                </View>

                {/* Menu Items */}
                <Card style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <View key={item.title}>
                            <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                                <Ionicons name={item.icon} size={24} color={pastel.mint} style={styles.menuIcon} />
                                <View style={styles.menuInfo}>
                                    <Text variant="bodyLarge" style={styles.menuTitle}>{item.title}</Text>
                                    <Text variant="bodySmall" style={styles.menuDesc}>{item.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={text.muted} />
                            </TouchableOpacity>
                            {index < menuItems.length - 1 && <Divider style={styles.divider} />}
                        </View>
                    ))}
                </Card>

                {/* Logout Button */}
                <View style={{ paddingHorizontal: 24 }}>
                    <Button
                        variant="danger"
                        onPress={handleLogout}
                        fullWidth
                    >
                        Sign Out
                    </Button>
                </View>

                <Text variant="bodySmall" style={styles.version}>The Planner v1.0.0</Text>
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: pastel.slate }}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: background.primary },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
    title: { color: text.primary, fontWeight: "bold" },
    userCard: { marginHorizontal: 24, marginBottom: 20, padding: 16 },
    userContent: { flexDirection: "row", alignItems: "center" },
    userInfo: { marginLeft: 16, flex: 1 },
    userName: { color: text.primary, fontWeight: "600" },
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 12, marginBottom: 20 },
    statCard: { flex: 1, padding: 0 },
    statContent: { alignItems: "center", paddingVertical: 8 },
    statValue: { color: text.primary, fontWeight: "bold" },
    menuCard: { marginHorizontal: 24, marginBottom: 24, padding: 0, overflow: "hidden" },
    menuItem: { flexDirection: "row", alignItems: "center", padding: 16 },
    menuIcon: { marginRight: 16 },
    menuInfo: { flex: 1 },
    menuTitle: { color: text.primary },
    menuDesc: { color: text.secondary },
    divider: { backgroundColor: pastel.beige },
    version: { textAlign: "center", color: text.muted, marginTop: 24 },
});
