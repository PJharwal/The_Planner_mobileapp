import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../constants/theme";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout },
        ]);
    };

    const menuItems = [
        { icon: "⏱️", title: "Exam Mode", subtitle: "Set up exam countdown", onPress: () => router.push("/exam/setup") },
        { icon: "🎯", title: "Study Goals", subtitle: "Set daily targets", onPress: () => { } },
        { icon: "🎨", title: "Theme", subtitle: "Calm Growth", onPress: () => { } },
        { icon: "🔔", title: "Notifications", subtitle: "Manage reminders", onPress: () => { } },
        { icon: "📤", title: "Export Data", subtitle: "Download your data", onPress: () => { } },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                </View>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.full_name?.charAt(0)?.toUpperCase() || "S"}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.full_name || "Student"}</Text>
                        <Text style={styles.userEmail}>{user?.email || "student@example.com"}</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity key={index} onPress={item.onPress} style={styles.menuItem}>
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.version}>Study App v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: spacing.xxl, paddingTop: 60, paddingBottom: spacing.xxl },
    title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.text.primary },
    userCard: {
        marginHorizontal: spacing.xxl,
        backgroundColor: colors.card,
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.sm,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary[400] + '20',
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.lg,
    },
    avatarText: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary[400] },
    userInfo: { flex: 1 },
    userName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary },
    userEmail: { fontSize: fontSize.sm, color: colors.text.muted, marginTop: spacing.xs },
    menuSection: { marginHorizontal: spacing.xxl, marginBottom: spacing.xxl },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    menuIcon: { fontSize: 24, marginRight: spacing.lg },
    menuContent: { flex: 1 },
    menuTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text.primary },
    menuSubtitle: { fontSize: fontSize.sm, color: colors.text.muted, marginTop: 2 },
    menuArrow: { fontSize: fontSize.xxl, color: colors.text.muted },
    logoutButton: {
        marginHorizontal: spacing.xxl,
        backgroundColor: colors.error + '15',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    logoutText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.error },
    version: { textAlign: "center", color: colors.text.muted, fontSize: fontSize.sm, marginTop: spacing.xxl },
});
