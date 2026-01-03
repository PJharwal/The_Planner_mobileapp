// FeatureDropdownCard - Collapsible feature section for home screen
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, LayoutAnimation } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
} from "react-native-reanimated";

import { GlassCard } from "../glass";
import { spacing } from "../../constants/theme";
import { glassText, glassAccent, glass } from "../../constants/glassTheme";

interface FeatureItem {
    icon: string;
    title: string;
    description: string;
    action?: () => void;
}

interface FeatureDropdownCardProps {
    title: string;
    subtitle?: string;
    icon: string;
    // gradient removed in favor of glass theme consistency
    features: FeatureItem[];
    defaultExpanded?: boolean;
}

export function FeatureDropdownCard({
    title,
    subtitle,
    icon,
    features,
    defaultExpanded = false,
}: FeatureDropdownCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rotation = useSharedValue(defaultExpanded ? 1 : 0);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        rotation.value = withTiming(expanded ? 0 : 1, { duration: 200 });
        setExpanded(!expanded);
    };

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    }));

    return (
        <GlassCard style={styles.container} padding={0} intensity="light">
            {/* Header */}
            <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.7}
                style={styles.header}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={24} color={glassText.primary} />
                </View>

                <View style={styles.headerText}>
                    <Text variant="titleMedium" style={styles.title}>{title}</Text>
                    {subtitle && (
                        <Text variant="bodySmall" style={styles.subtitle}>{subtitle}</Text>
                    )}
                </View>

                <Animated.View style={chevronStyle}>
                    <Ionicons name="chevron-down" size={20} color={glassText.muted} />
                </Animated.View>
            </TouchableOpacity>

            {/* Expanded Content */}
            {expanded && (
                <View style={styles.content}>
                    {features.map((feature, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.featureRow}
                            onPress={feature.action}
                            disabled={!feature.action}
                            activeOpacity={feature.action ? 0.7 : 1}
                        >
                            <View style={styles.featureIcon}>
                                <Ionicons name={feature.icon as any} size={18} color={glassAccent.mint} />
                            </View>
                            <View style={styles.featureText}>
                                <Text variant="bodyMedium" style={styles.featureTitle}>
                                    {feature.title}
                                </Text>
                                <Text variant="bodySmall" style={styles.featureDesc}>
                                    {feature.description}
                                </Text>
                            </View>
                            {feature.action && (
                                <Ionicons name="chevron-forward" size={16} color={glassText.muted} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: glassAccent.mint + "20",
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: glassText.primary,
        fontWeight: "600",
    },
    subtitle: {
        color: glassText.secondary,
        marginTop: 2,
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: glass.border.light,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: glassAccent.mint + "15",
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        color: glassText.primary,
        fontWeight: "500",
    },
    featureDesc: {
        color: glassText.secondary,
        marginTop: 1,
    },
});
