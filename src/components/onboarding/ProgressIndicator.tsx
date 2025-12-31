import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { pastel, text, spacing } from '../../constants/theme';

interface ProgressIndicatorProps {
    current: number;
    total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
    const percentage = (current / total) * 100;

    return (
        <View style={styles.container}>
            <View style={styles.bar}>
                <View style={[styles.progress, { width: `${percentage}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.text}>
                {current} of {total}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    bar: {
        height: 4,
        backgroundColor: `${pastel.mint}20`,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progress: {
        height: '100%',
        backgroundColor: pastel.mint,
    },
    text: {
        color: text.secondary,
        textAlign: 'center',
    },
});
