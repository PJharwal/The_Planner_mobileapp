// Data Trust Screen - Simple explanation of data storage and sync
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Button } from "../../components/ui";
import { pastel, spacing, borderRadius, background, text } from "../../constants/theme";

interface DataInfoItemProps {
    icon: string;
    title: string;
    description: string;
}

function DataInfoItem({ icon, title, description }: DataInfoItemProps) {
    return (
        <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={24} color={pastel.mint} />
                </View>
                <View style={styles.infoText}>
                    <Text variant="titleSmall" style={styles.infoTitle}>{title}</Text>
                    <Text variant="bodySmall" style={styles.infoDescription}>{description}</Text>
                </View>
            </View>
        </Card>
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
                    headerStyle: { backgroundColor: background.primary },
                    headerTintColor: text.primary,
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
                    <View style={styles.headerIcon}>
                        <Ionicons name="shield-checkmark" size={48} color={pastel.mint} />
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
                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>
                        We never sell your data or use it for advertising.
                        Your study information is yours alone.
                    </Text>
                </View>

                <Button
                    variant="secondary"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    Got it
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: background.primary,
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
        backgroundColor: `${pastel.mint}20`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    headerTitle: {
        color: text.primary,
        fontWeight: "600",
        textAlign: "center",
    },
    headerSubtitle: {
        color: text.secondary,
        textAlign: "center",
        marginTop: spacing.xs,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: text.primary,
        fontWeight: "600",
        marginBottom: spacing.md,
    },
    infoCard: {
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${pastel.mint}15`,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        color: text.primary,
        fontWeight: "500",
    },
    infoDescription: {
        color: text.secondary,
        marginTop: 2,
        lineHeight: 18,
    },
    footer: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        backgroundColor: `${pastel.mint}15`,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    footerText: {
        color: text.secondary,
        textAlign: "center",
        lineHeight: 20,
    },
    backButton: {
        marginBottom: spacing.lg,
    },
});
