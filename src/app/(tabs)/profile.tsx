import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Avatar, Divider, Snackbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import { useHealthStore } from "../../store/healthStore";
import { useModalStore } from "../../store/modalStore";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { Switch } from "react-native-paper";
import { ADAPTIVE_PLANS } from "../../utils/adaptivePlans";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { exportAndShare } from "../../utils/dataExport";

// Design tokens
import { text } from "../../constants/theme";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
// UI Components
import { GlassCard, GlassButton, MeshGradientBackground } from "../../components/glass";

interface UserStats {
    totalTasks: number;
    completedTasks: number;
    totalSubjects: number;
}

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, isLoading } = useAuthStore();
    const { profile, fetchProfile } = useProfileStore();
    const { hasPermissions, healthInfluenceMode, setInfluenceMode } = useHealthStore();
    const { openPaywall } = useModalStore();
    const { isPro } = useSubscriptionStore();
    const [stats, setStats] = useState<UserStats>({ totalTasks: 0, completedTasks: 0, totalSubjects: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    useEffect(() => {
        fetchStats();
        fetchProfile();
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

    const currentPlan = profile?.selected_plan_id
        ? ADAPTIVE_PLANS.find(p => p.id === profile.selected_plan_id)
        : null;

    const menuItems = [
        { icon: "person-outline" as const, title: "Edit Profile", subtitle: "Personalize your study settings", onPress: () => router.push("/profile-settings") },
        { icon: "analytics-outline" as const, title: "Insights", subtitle: "View study patterns & progress", onPress: () => router.push("/analytics") },
        { icon: "timer-outline" as const, title: "Exam Mode", subtitle: "Set up exam countdown", onPress: () => router.push("/exam/setup") },
        { icon: "heart-outline" as const, title: "Apple Health", subtitle: hasPermissions ? "Connected" : "Optimize based on recovery", onPress: () => router.push("/onboarding/health") },
        { icon: "download-outline" as const, title: "Export Data", subtitle: "Backup your study data", onPress: handleExportData, loading: isExporting },
        { icon: "shield-checkmark-outline" as const, title: "Data & Privacy", subtitle: "How we handle your data", onPress: () => router.push("/data-trust") },
    ];

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={glassAccent.mint} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MeshGradientBackground />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={[styles.title, { color: glassText.primary }]}>Profile</Text>
                </View>

                {/* User Card */}
                <GlassCard style={styles.userCard}>
                    <View style={styles.userContent}>
                        <Avatar.Text
                            size={64}
                            label={user?.full_name?.charAt(0)?.toUpperCase() || "S"}
                            style={{ backgroundColor: glassAccent.blue }}
                            labelStyle={{ color: glassText.inverse }}
                        />
                        <View style={styles.userInfo}>
                            <Text variant="titleLarge" style={[styles.userName, { color: glassText.primary }]}>{user?.full_name || "Student"}</Text>
                            <Text variant="bodyMedium" style={{ color: glassText.secondary }}>
                                {user?.email || "student@example.com"}
                            </Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <GlassCard style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text variant="headlineSmall" style={[styles.statValue, { color: glassText.primary }]}>
                                {loadingStats ? "-" : stats.totalSubjects}
                            </Text>
                            <Text variant="bodySmall" style={{ color: glassText.muted }}>Subjects</Text>
                        </View>
                    </GlassCard>
                    <GlassCard style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text variant="headlineSmall" style={[styles.statValue, { color: glassAccent.mint }]}>
                                {loadingStats ? "-" : stats.completedTasks}
                            </Text>
                            <Text variant="bodySmall" style={{ color: glassText.muted }}>Completed</Text>
                        </View>
                    </GlassCard>
                    <GlassCard style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text variant="headlineSmall" style={[styles.statValue, { color: glassAccent.warm }]}>
                                {loadingStats ? "-" : `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`}
                            </Text>
                            <Text variant="bodySmall" style={{ color: glassText.muted }}>Progress</Text>
                        </View>
                    </GlassCard>
                </View>

                {/* Current Plan Badge (if profile exists) */}
                {currentPlan && (
                    <GlassCard style={styles.planCard} intensity="light">
                        <View style={styles.planContent}>
                            <Text style={styles.planEmoji}>{currentPlan.emoji}</Text>
                            <View style={styles.planInfo}>
                                <Text variant="bodySmall" style={[styles.planLabel, { color: glassText.muted }]}>Your Study Plan</Text>
                                <Text variant="titleSmall" style={[styles.planName, { color: glassText.primary }]}>{currentPlan.name}</Text>
                                <Text variant="bodySmall" style={[styles.planDescription, { color: glassText.secondary }]}>{currentPlan.description}</Text>
                            </View>
                        </View>
                    </GlassCard>
                )}

                {/* Upgrade to Pro Card */}
                {!isPro && (
                    <TouchableOpacity onPress={() => openPaywall('Profile')} activeOpacity={0.8}>
                        <GlassCard style={styles.planCard} intensity="medium">
                            <View style={styles.planContent}>
                                <View style={[styles.proIconContainer, { backgroundColor: glassAccent.blue + '30' }]}>
                                    <Ionicons name="star" size={24} color={glassAccent.blue} />
                                </View>
                                <View style={styles.planInfo}>
                                    <Text variant="titleSmall" style={{ color: glassText.primary, fontWeight: '600' }}>
                                        Upgrade to Pro
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: glassText.secondary }}>
                                        Unlock all features & unlimited tasks
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={glassText.muted} />
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                )}

                {/* Health Sync Card */}
                {hasPermissions && (
                    <GlassCard style={styles.menuCard} padding={0}>
                        <View style={styles.menuItem}>
                            <Ionicons name="heart" size={24} color={glassAccent.warm} style={styles.menuIcon} />
                            <View style={styles.menuInfo}>
                                <Text variant="bodyLarge" style={[styles.menuTitle, { color: glassText.primary }]}>Apple Health Sync</Text>
                                <Text variant="bodySmall" style={[styles.menuDesc, { color: glassText.secondary }]}>
                                    {healthInfluenceMode === 'adaptive' ? 'Adjusting daily capacity' : 'Insights only'}
                                </Text>
                            </View>
                            <Switch
                                value={healthInfluenceMode === 'adaptive'}
                                onValueChange={(val) => setInfluenceMode(val ? 'adaptive' : 'insights_only')}
                                color={glassAccent.mint}
                            />
                        </View>
                    </GlassCard>
                )}

                {/* Menu Items */}
                <GlassCard style={styles.menuCard} padding={0}>
                    {menuItems.map((item, index) => (
                        <View key={item.title}>
                            <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                                <Ionicons name={item.icon} size={24} color={glassAccent.blue} style={styles.menuIcon} />
                                <View style={styles.menuInfo}>
                                    <Text variant="bodyLarge" style={[styles.menuTitle, { color: glassText.primary }]}>{item.title}</Text>
                                    <Text variant="bodySmall" style={[styles.menuDesc, { color: glassText.secondary }]}>{item.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={glassText.muted} />
                            </TouchableOpacity>
                            {index < menuItems.length - 1 && <Divider style={[styles.divider, { backgroundColor: glass.border.light }]} />}
                        </View>
                    ))}
                </GlassCard>

                {/* Logout Button */}
                <View style={{ paddingHorizontal: 24 }}>
                    <GlassButton
                        variant="danger"
                        onPress={handleLogout}
                        fullWidth
                    >
                        Sign Out
                    </GlassButton>
                </View>

                <Text variant="bodySmall" style={[styles.version, { color: glassText.muted }]}>The Planner v1.0.0</Text>
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: darkBackground.elevated }}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    centered: { justifyContent: "center", alignItems: "center" },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
    title: { color: text.primary, fontWeight: "bold" },
    userCard: { marginHorizontal: 24, marginBottom: 20 },
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
    divider: { backgroundColor: glass.border.light },
    version: { textAlign: "center", color: text.muted, marginTop: 24 },
    planCard: {
        marginHorizontal: 24,
        marginBottom: 20,
    },
    planContent: {
        flexDirection: "row",
        alignItems: "center"
    },
    planEmoji: {
        fontSize: 32,
        marginRight: 12
    },
    planInfo: {
        flex: 1
    },
    planLabel: {
        color: text.secondary,
        marginBottom: 2
    },
    planName: {
        color: text.primary,
        fontWeight: "600",
        marginBottom: 2
    },
    planDescription: {
        color: text.secondary
    },
    proIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginRight: 12,
    },
});
