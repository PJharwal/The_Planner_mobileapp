// ConfidencePicker - Three-button selector for confidence levels
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { ConfidenceLevel } from '../../types';
import { CONFIDENCE_CONFIG } from '../../store/confidenceStore';
import { borderRadius, spacing } from '../../constants/theme';

interface ConfidencePickerProps {
    value: ConfidenceLevel;
    onChange: (level: ConfidenceLevel) => void;
    disabled?: boolean;
    compact?: boolean;
}

export function ConfidencePicker({ value, onChange, disabled = false, compact = false }: ConfidencePickerProps) {
    const levels: ConfidenceLevel[] = ['low', 'medium', 'high'];

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {!compact && (
                <Text variant="labelMedium" style={styles.label}>
                    How confident do you feel?
                </Text>
            )}
            <View style={styles.buttonsRow}>
                {levels.map((level) => {
                    const config = CONFIDENCE_CONFIG[level];
                    const isSelected = value === level;

                    return (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.button,
                                compact && styles.buttonCompact,
                                isSelected && { backgroundColor: config.bgColor, borderColor: config.color },
                            ]}
                            onPress={() => !disabled && onChange(level)}
                            activeOpacity={0.7}
                            disabled={disabled}
                        >
                            <Ionicons
                                name={config.icon as any}
                                size={compact ? 16 : 20}
                                color={isSelected ? config.color : 'rgba(93, 107, 107, 0.4)'}
                            />
                            <Text
                                variant={compact ? "labelSmall" : "labelMedium"}
                                style={[
                                    styles.buttonText,
                                    isSelected && { color: config.color, fontWeight: '600' },
                                ]}
                            >
                                {config.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {!compact && value && (
                <Text variant="bodySmall" style={styles.description}>
                    {CONFIDENCE_CONFIG[value].description}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.sm,
    },
    containerCompact: {
        paddingVertical: 0,
    },
    label: {
        color: 'rgba(93, 107, 107, 0.65)',
        marginBottom: spacing.sm,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderRadius: borderRadius.pill,
        borderWidth: 1.5,
        borderColor: 'rgba(93, 107, 107, 0.15)',
        gap: 4,
    },
    buttonCompact: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    buttonText: {
        color: 'rgba(93, 107, 107, 0.5)',
    },
    description: {
        color: 'rgba(93, 107, 107, 0.65)',
        marginTop: spacing.xs,
        textAlign: 'center',
    },
});
