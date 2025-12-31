// DifficultyTag - Optional difficulty tag chip
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DifficultyLevel } from '../../types';
import { borderRadius, spacing } from '../../constants/theme';

interface DifficultyTagProps {
    value?: DifficultyLevel;
    onChange?: (level: DifficultyLevel | undefined) => void;
    editable?: boolean;
    size?: 'sm' | 'md';
}

const DIFFICULTY_CONFIG = {
    easy: {
        label: 'Easy',
        color: '#8DD7D8',
        bgColor: 'rgba(141, 215, 216, 0.15)',
        icon: 'leaf-outline',
    },
    medium: {
        label: 'Medium',
        color: '#E8C9A0',
        bgColor: 'rgba(232, 201, 160, 0.15)',
        icon: 'flash-outline',
    },
    hard: {
        label: 'Hard',
        color: '#E8A0A0',
        bgColor: 'rgba(232, 160, 160, 0.15)',
        icon: 'flame-outline',
    },
};

export function DifficultyTag({ value, onChange, editable = false, size = 'md' }: DifficultyTagProps) {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];

    // If editable, show all options
    if (editable) {
        return (
            <View style={styles.editableContainer}>
                <Text variant="labelSmall" style={styles.label}>Difficulty (optional)</Text>
                <View style={styles.row}>
                    {levels.map((level) => {
                        const config = DIFFICULTY_CONFIG[level];
                        const isSelected = value === level;

                        return (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.chip,
                                    size === 'sm' && styles.chipSm,
                                    isSelected && { backgroundColor: config.bgColor, borderColor: config.color },
                                ]}
                                onPress={() => onChange?.(isSelected ? undefined : level)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={config.icon as any}
                                    size={size === 'sm' ? 12 : 14}
                                    color={isSelected ? config.color : 'rgba(93, 107, 107, 0.4)'}
                                />
                                <Text
                                    variant="labelSmall"
                                    style={[
                                        styles.chipText,
                                        isSelected && { color: config.color },
                                    ]}
                                >
                                    {config.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    }

    // Display mode - show single tag
    if (!value) return null;

    const config = DIFFICULTY_CONFIG[value];

    return (
        <View style={[styles.tag, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon as any} size={12} color={config.color} />
            <Text variant="labelSmall" style={{ color: config.color, marginLeft: 2 }}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    editableContainer: {
        marginVertical: spacing.xs,
    },
    label: {
        color: 'rgba(93, 107, 107, 0.65)',
        marginBottom: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: borderRadius.pill,
        borderWidth: 1,
        borderColor: 'rgba(93, 107, 107, 0.15)',
        gap: 4,
    },
    chipSm: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    chipText: {
        color: 'rgba(93, 107, 107, 0.5)',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: borderRadius.sm,
    },
});
