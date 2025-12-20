import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../constants/theme";

export default function AnalyticsScreen() {
    // Placeholder data
    const weekData = [65, 80, 45, 90, 70, 85, 100];
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const maxValue = Math.max(...weekData);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>Track your progress</Text>
                </View>

                {/* Stats Overview */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, styles.completedCard]}>
                        <Text style={styles.statValue}>47</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={[styles.statCard, styles.streakCard]}>
                        <Text style={styles.statValue}>7</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={[styles.statCard, styles.improvementCard]}>
                        <Text style={styles.statValue}>+23%</Text>
                        <Text style={styles.statLabel}>This Week</Text>
                    </View>
                </View>

                {/* Weekly Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weekly Progress</Text>
                    <View style={styles.chartContainer}>
                        {weekData.map((value, index) => (
                            <View key={index} style={styles.barContainer}>
                                <View style={styles.barBackground}>
                                    <View style={[styles.barFill, { height: `${(value / maxValue) * 100}%` }]} />
                                </View>
                                <Text style={styles.barLabel}>{weekDays[index]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Consistency Heatmap */}
                <View style={styles.heatmapCard}>
                    <Text style={styles.chartTitle}>Consistency</Text>
                    <View style={styles.heatmapGrid}>
                        {Array.from({ length: 28 }).map((_, index) => {
                            const intensity = Math.random();
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.heatmapCell,
                                        {
                                            backgroundColor:
                                                intensity > 0.7 ? colors.success :
                                                    intensity > 0.4 ? colors.primary[400] + '80' :
                                                        intensity > 0.2 ? colors.primary[400] + '40' :
                                                            colors.dark[700],
                                        },
                                    ]}
                                />
                            );
                        })}
                    </View>
                    <View style={styles.heatmapLegend}>
                        <Text style={styles.legendText}>Less</Text>
                        <View style={[styles.legendCell, { backgroundColor: colors.dark[700] }]} />
                        <View style={[styles.legendCell, { backgroundColor: colors.primary[400] + '40' }]} />
                        <View style={[styles.legendCell, { backgroundColor: colors.primary[400] + '80' }]} />
                        <View style={[styles.legendCell, { backgroundColor: colors.success }]} />
                        <Text style={styles.legendText}>More</Text>
                    </View>
                </View>

                {/* Monthly Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.chartTitle}>This Month</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>156</Text>
                            <Text style={styles.summaryLabel}>Tasks Completed</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>12</Text>
                            <Text style={styles.summaryLabel}>Topics Covered</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>28h</Text>
                            <Text style={styles.summaryLabel}>Study Time</Text>
                        </View>
                    </View>
                </View>
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
    subtitle: { fontSize: fontSize.md, color: colors.text.muted, marginTop: spacing.xs },
    statsRow: { flexDirection: "row", paddingHorizontal: spacing.xxl, gap: spacing.md, marginBottom: spacing.xxl },
    statCard: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.xxl, alignItems: "center", ...shadows.sm },
    completedCard: { backgroundColor: colors.success + '15', borderWidth: 1, borderColor: colors.success + '30' },
    streakCard: { backgroundColor: colors.warning + '15', borderWidth: 1, borderColor: colors.warning + '30' },
    improvementCard: { backgroundColor: colors.primary[400] + '15', borderWidth: 1, borderColor: colors.primary[400] + '30' },
    statValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text.primary },
    statLabel: { fontSize: fontSize.xs, color: colors.text.muted, marginTop: spacing.xs },
    chartCard: { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.cardBorder },
    chartTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.lg },
    chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 },
    barContainer: { flex: 1, alignItems: "center" },
    barBackground: { width: 24, height: 100, backgroundColor: colors.dark[700], borderRadius: borderRadius.lg, justifyContent: "flex-end", overflow: "hidden" },
    barFill: { width: "100%", backgroundColor: colors.primary[400], borderRadius: borderRadius.lg },
    barLabel: { fontSize: fontSize.xs, color: colors.text.muted, marginTop: spacing.sm },
    heatmapCard: { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.cardBorder },
    heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    heatmapCell: { width: 28, height: 28, borderRadius: borderRadius.sm },
    heatmapLegend: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: spacing.lg, gap: spacing.xs },
    legendCell: { width: 16, height: 16, borderRadius: 4 },
    legendText: { fontSize: fontSize.xs, color: colors.text.muted },
    summaryCard: { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: borderRadius.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.cardBorder },
    summaryRow: { flexDirection: "row", alignItems: "center" },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryDivider: { width: 1, height: 40, backgroundColor: colors.cardBorder },
    summaryValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text.primary },
    summaryLabel: { fontSize: fontSize.xs, color: colors.text.muted, marginTop: spacing.xs, textAlign: "center" },
});
