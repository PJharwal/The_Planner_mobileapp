// FeatureDropdownCard - Collapsible feature section for home screen
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, UIManager, Platform } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
} from "react-native-reanimated";

import { Card } from "./Card";
import { pastel, background, text, spacing, borderRadius, gradients } from "../../constants/theme";



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
    gradient?: readonly string[];
    features: FeatureItem[];
    defaultExpanded?: boolean;
}

export function FeatureDropdownCard({
    title,
    subtitle,
    icon,
    gradient = gradients.mint,
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
        <Card style={styles.container}>
            {/* Header */}
            <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.7}
                style={styles.header}
            >
                <LinearGradient
                    colors={gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                >
                    <Ionicons name={icon as any} size={24} color={text.primary} />
                </LinearGradient>

                <View style={styles.headerText}>
                    <Text variant="titleMedium" style={styles.title}>{title}</Text>
                    {subtitle && (
                        <Text variant="bodySmall" style={styles.subtitle}>{subtitle}</Text>
                    )}
                </View>

                <Animated.View style={chevronStyle}>
                    <Ionicons name="chevron-down" size={20} color={text.muted} />
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
                                <Ionicons name={feature.icon as any} size={18} color={pastel.mint} />
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
                                <Ionicons name="chevron-forward" size={16} color={text.muted} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </Card>
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
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: text.primary,
        fontWeight: "600",
    },
    subtitle: {
        color: text.secondary,
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
        borderTopColor: "rgba(93, 107, 107, 0.08)",
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: `${pastel.mint}15`,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        color: text.primary,
        fontWeight: "500",
    },
    featureDesc: {
        color: text.secondary,
        marginTop: 1,
    },
});
