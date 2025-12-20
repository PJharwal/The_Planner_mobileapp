import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Card, Text, Avatar, List, Button, useTheme, Divider, Snackbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { exportAndShare } from "../../utils/dataExport";

interface UserStats {
    totalTasks: number;
    completedTasks: number;
    totalSubjects: number;
}

export default function ProfileScreen() {
    const theme = useTheme();
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
            { text: "Sign Out", style: "destructive", onPress: logout },
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
            <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>Profile</Text>
                </View>

                {/* User Card */}
                <Card style={styles.userCard} mode="outlined">
                    <Card.Content style={styles.userContent}>
                        <Avatar.Text
                            size={64}
                            label={user?.full_name?.charAt(0)?.toUpperCase() || "S"}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                        <View style={styles.userInfo}>
                            <Text variant="titleLarge" style={styles.userName}>{user?.full_name || "Student"}</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                {user?.email || "student@example.com"}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard} mode="outlined">
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {loadingStats ? "-" : stats.totalSubjects}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Subjects</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statCard} mode="outlined">
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {loadingStats ? "-" : stats.completedTasks}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Completed</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statCard} mode="outlined">
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {loadingStats ? "-" : `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Progress</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Menu Items */}
                <Card style={styles.menuCard} mode="outlined">
                    {menuItems.map((item, index) => (
                        <View key={item.title}>
                            <List.Item
                                title={item.title}
                                description={item.subtitle}
                                left={() => <Ionicons name={item.icon} size={24} color="#38BDF8" style={styles.menuIcon} />}
                                right={() => <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                                onPress={item.onPress}
                                titleStyle={styles.menuTitle}
                                descriptionStyle={styles.menuDesc}
                            />
                            {index < menuItems.length - 1 && <Divider style={styles.divider} />}
                        </View>
                    ))}
                </Card>

                {/* Logout Button */}
                <Button
                    mode="outlined"
                    onPress={handleLogout}
                    textColor="#EF4444"
                    style={styles.logoutButton}
                    icon={() => <Ionicons name="log-out-outline" size={20} color="#EF4444" />}
                >
                    Sign Out
                </Button>

                <Text variant="bodySmall" style={styles.version}>Study App v1.0.0</Text>
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: "#1E293B" }}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    userCard: { marginHorizontal: 24, marginBottom: 20, backgroundColor: "#1E293B" },
    userContent: { flexDirection: "row", alignItems: "center" },
    userInfo: { marginLeft: 16, flex: 1 },
    userName: { color: "#E5E7EB", fontWeight: "600" },
    statsRow: { flexDirection: "row", paddingHorizontal: 24, gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: "#1E293B" },
    statContent: { alignItems: "center", paddingVertical: 8 },
    statValue: { color: "#E5E7EB", fontWeight: "bold" },
    menuCard: { marginHorizontal: 24, marginBottom: 24, backgroundColor: "#1E293B" },
    menuIcon: { marginLeft: 16, marginRight: 8 },
    menuTitle: { color: "#E5E7EB" },
    menuDesc: { color: "#9CA3AF" },
    divider: { backgroundColor: "#334155" },
    logoutButton: { marginHorizontal: 24, borderColor: "#EF4444", borderRadius: 12 },
    version: { textAlign: "center", color: "#9CA3AF", marginTop: 24 },
});
