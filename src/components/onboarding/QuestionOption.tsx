import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { background, text, pastel, spacing, borderRadius } from '../../constants/theme';

interface QuestionOptionProps {
    label: string;
    description?: string;
    value: string;
    selected: boolean;
    onSelect: () => void;
}

export function QuestionOption({ label, description, selected, onSelect }: QuestionOptionProps) {
    return (
        <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.7}
            style={[styles.option, selected && styles.optionSelected]}
        >
            <View style={styles.optionContent}>
                <View style={styles.optionText}>
                    <Text variant="bodyLarge" style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {label}
                    </Text>
                    {description && (
                        <Text variant="bodySmall" style={styles.optionDescription}>
                            {description}
                        </Text>
                    )}
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioInner} />}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    option: {
        backgroundColor: background.card,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: pastel.mint,
        backgroundColor: `${pastel.mint}10`,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        color: text.primary,
        fontWeight: '500',
    },
    optionLabelSelected: {
        color: pastel.mint,
        fontWeight: '600',
    },
    optionDescription: {
        color: text.secondary,
        marginTop: 2,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: text.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    radioSelected: {
        borderColor: pastel.mint,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: pastel.mint,
    },
});
