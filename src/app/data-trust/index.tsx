// Data Trust Screen - Simple explanation of data storage and sync
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard, GlassButton } from "../../components/glass";
import { spacing, borderRadius } from "../../constants/theme";
import { glassAccent, glassText, darkBackground } from "../../constants/glassTheme";

interface DataInfoItemProps {
    icon: string;
    title: string;
    description: string;
}

function DataInfoItem({ icon, title, description }: DataInfoItemProps) {
    return (
        <GlassCard style={styles.infoCard} intensity="light">
            <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: glassAccent.mint + '20' }]}>
                    <Ionicons name={icon as any} size={24} color={glassAccent.mint} />
                </View>
                <View style={styles.infoText}>
                    <Text variant="titleSmall" style={styles.infoTitle}>{title}</Text>
                    <Text variant="bodySmall" style={styles.infoDescription}>{description}</Text>
                </View>
            </View>
        </GlassCard>
    );
}

export default function DataTrustScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: "Data & Privacy",
                    headerStyle: { backgroundColor: darkBackground.primary },
                    headerTintColor: glassText.primary,
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.headerIcon, { backgroundColor: glassAccent.mint + '20' }]}>
                        <Ionicons name="shield-checkmark" size={48} color={glassAccent.mint} />
                    </View>
                    <Text variant="headlineSmall" style={styles.headerTitle}>
                        Your data is safe
                    </Text>
                    <Text variant="bodyMedium" style={styles.headerSubtitle}>
                        Here's how we handle your study information
                    </Text>
                </View>

                {/* Data Storage */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        What we store
                    </Text>

                    <DataInfoItem
                        icon="book-outline"
                        title="Your subjects & topics"
                        description="The subjects, topics, and tasks you create to organize your studies."
                    />

                    <DataInfoItem
                        icon="time-outline"
                        title="Focus sessions"
                        description="How long you study and which topics you focus on, to show your progress."
                    />

                    <DataInfoItem
                        icon="analytics-outline"
                        title="Study insights"
                        description="Patterns like your best study times and consistency, calculated from your sessions."
                    />

                    <DataInfoItem
                        icon="heart-outline"
                        title="Confidence levels"
                        description="How confident you feel about each topic, to help prioritize revision."
                    />
                </View>

                {/* How Sync Works */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        How sync works
                    </Text>

                    <DataInfoItem
                        icon="cloud-outline"
                        title="Cloud backup"
                        description="Your data is securely stored in the cloud and synced across your devices."
                    />

                    <DataInfoItem
                        icon="wifi-outline"
                        title="Offline mode"
                        description="You can use the app offline. Changes sync automatically when you're back online."
                    />

                    <DataInfoItem
                        icon="lock-closed-outline"
                        title="Encrypted"
                        description="All data is encrypted in transit and at rest using industry-standard encryption."
                    />
                </View>

                {/* Your Control */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        You're in control
                    </Text>

                    <DataInfoItem
                        icon="download-outline"
                        title="Export anytime"
                        description="Download all your data in JSON format from your profile settings."
                    />

                    <DataInfoItem
                        icon="trash-outline"
                        title="Delete your data"
                        description="Contact us to permanently delete your account and all associated data."
                    />
                </View>

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: glassAccent.mint + '10' }]}>
                    <Text variant="bodySmall" style={styles.footerText}>
                        We never sell your data or use it for advertising.
                        Your study information is yours alone.
                    </Text>
                </View>

                <GlassButton
                    variant="ghost"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    Got it
                </GlassButton>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBackground.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        paddingVertical: spacing.xl,
    },
    headerIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    headerTitle: {
        color: glassText.primary,
        fontWeight: "600",
        textAlign: "center",
    },
    headerSubtitle: {
        color: glassText.secondary,
        textAlign: "center",
        marginTop: spacing.xs,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: glassText.primary,
        fontWeight: "600",
        marginBottom: spacing.md,
    },
    infoCard: {
        marginBottom: spacing.sm,
        padding: 0,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        color: glassText.primary,
        fontWeight: "500",
    },
    infoDescription: {
        color: glassText.secondary,
        marginTop: 2,
        lineHeight: 18,
    },
    footer: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    footerText: {
        color: glassText.secondary,
        textAlign: "center",
        lineHeight: 20,
    },
    backButton: {
        marginBottom: spacing.lg,
    },
});
