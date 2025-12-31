import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Modal, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui';
import { background, text, pastel, spacing, borderRadius, semantic } from '../../constants/theme';

interface SessionQualityPromptProps {
    visible: boolean;
    sessionMinutes: number;
    onQualitySelect: (quality: 'focused' | 'okay' | 'distracted') => void;
    onDismiss: () => void;
}

/**
 * Post-session quality feedback prompt
 * Shown after sessions > 1 minute to gather focus quality data
 */
export function SessionQualityPrompt({
    visible,
    sessionMinutes,
    onQualitySelect,
    onDismiss,
}: SessionQualityPromptProps) {
    const handleSelect = (quality: 'focused' | 'okay' | 'distracted') => {
        onQualitySelect(quality);
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Ionicons name="checkmark-circle" size={48} color={semantic.success} />
                        <Text variant="headlineSmall" style={styles.title}>
                            Session Complete!
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            {sessionMinutes} minutes • How focused were you?
                        </Text>
                    </View>

                    <View style={styles.options}>
                        <TouchableOpacity
                            style={[styles.option, styles.focusedOption]}
                            onPress={() => handleSelect('focused')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="flash" size={32} color={semantic.success} />
                            <Text variant="titleMedium" style={styles.optionTitle}>
                                Focused
                            </Text>
                            <Text variant="bodySmall" style={styles.optionDesc}>
                                Great concentration
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.option, styles.okayOption]}
                            onPress={() => handleSelect('okay')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="checkmark-circle-outline" size={32} color={pastel.mint} />
                            <Text variant="titleMedium" style={styles.optionTitle}>
                                Okay
                            </Text>
                            <Text variant="bodySmall" style={styles.optionDesc}>
                                Some distractions
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.option, styles.distractedOption]}
                            onPress={() => handleSelect('distracted')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="help-circle-outline" size={32} color={semantic.warning} />
                            <Text variant="titleMedium" style={styles.optionTitle}>
                                Distracted
                            </Text>
                            <Text variant="bodySmall" style={styles.optionDesc}>
                                Hard to focus
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Button
                        variant="ghost"
                        onPress={onDismiss}
                        fullWidth
                        style={styles.skipButton}
                    >
                        Skip
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: background.card,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
    },
    content: {
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        color: text.primary,
        fontWeight: '600',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    subtitle: {
        color: text.secondary,
        textAlign: 'center',
    },
    options: {
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    option: {
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    focusedOption: {
        backgroundColor: `${semantic.success}10`,
        borderColor: `${semantic.success}30`,
    },
    okayOption: {
        backgroundColor: `${pastel.mint}10`,
        borderColor: `${pastel.mint}30`,
    },
    distractedOption: {
        backgroundColor: `${semantic.warning}10`,
        borderColor: `${semantic.warning}30`,
    },
    optionTitle: {
        color: text.primary,
        fontWeight: '600',
        marginTop: spacing.xs,
    },
    optionDesc: {
        color: text.secondary,
        marginTop: 2,
    },
    skipButton: {
        marginTop: spacing.sm,
    },
});
