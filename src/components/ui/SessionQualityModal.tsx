// SessionQualityModal - Post-session quality reflection prompt
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SessionQuality } from '../../types';
import { borderRadius, spacing, pastel, background } from '../../constants/theme';

interface SessionQualityModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (quality: SessionQuality) => void;
    sessionMinutes: number;
}

const QUALITY_OPTIONS: { value: SessionQuality; label: string; icon: string; color: string }[] = [
    { value: 'focused', label: 'Focused', icon: 'sparkles', color: '#8DD7D8' },
    { value: 'okay', label: 'Okay', icon: 'remove', color: '#E8C9A0' },
    { value: 'distracted', label: 'Distracted', icon: 'cloudy', color: '#E8A0A0' },
];

export function SessionQualityModal({ visible, onDismiss, onSubmit, sessionMinutes }: SessionQualityModalProps) {
    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                <View style={styles.header}>
                    <Ionicons name="checkmark-circle" size={32} color={pastel.mint} />
                    <Text variant="titleLarge" style={styles.title}>
                        Nice work!
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {sessionMinutes} minutes of focus
                    </Text>
                </View>

                <Text variant="bodyMedium" style={styles.question}>
                    How focused were you?
                </Text>

                <View style={styles.options}>
                    {QUALITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={styles.option}
                            onPress={() => onSubmit(option.value)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                                <Ionicons name={option.icon as any} size={24} color={option.color} />
                            </View>
                            <Text variant="labelLarge" style={styles.optionLabel}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity onPress={onDismiss} style={styles.skipButton}>
                    <Text variant="bodySmall" style={styles.skipText}>
                        Skip
                    </Text>
                </TouchableOpacity>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: background.card,
        margin: 24,
        padding: 24,
        borderRadius: borderRadius.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        color: '#5D6B6B',
        fontWeight: '600',
        marginTop: spacing.sm,
    },
    subtitle: {
        color: 'rgba(93, 107, 107, 0.65)',
        marginTop: 4,
    },
    question: {
        color: '#5D6B6B',
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    options: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.lg,
    },
    option: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    optionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    optionLabel: {
        color: '#5D6B6B',
    },
    skipButton: {
        alignSelf: 'center',
        padding: spacing.sm,
    },
    skipText: {
        color: 'rgba(93, 107, 107, 0.5)',
    },
});
