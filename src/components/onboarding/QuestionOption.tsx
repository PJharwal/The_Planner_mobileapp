import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass/GlassCard';
import { glassText, glassAccent, glass } from '../../constants/glassTheme';

interface QuestionOptionProps {
    label: string;
    description?: string;
    value: string;
    selected: boolean;
    onSelect: () => void;
}

export function QuestionOption({ label, description, selected, onSelect }: QuestionOptionProps) {
    return (
        <GlassCard
            intensity="light"
            style={[styles.container, selected && styles.containerSelected]}
            bordered={!selected} // Hide default border if selected (we use custom below) or keep it? 
        // Better: bordered={true} always, but override borderColor if selected
        >
            <TouchableOpacity
                onPress={onSelect}
                activeOpacity={0.7}
                style={styles.touchable}
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
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        padding: 0, // content handled by touchable
        overflow: 'hidden',
    },
    containerSelected: {
        borderColor: glassAccent.mint,
        backgroundColor: glassAccent.mintGlow,
    },
    touchable: {
        padding: 16,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        color: glassText.primary,
        fontWeight: '500',
    },
    optionLabelSelected: {
        color: glassAccent.mint,
        fontWeight: '600',
    },
    optionDescription: {
        color: glassText.secondary,
        marginTop: 2,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: glass.border.light,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    radioSelected: {
        borderColor: glassAccent.mint,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: glassAccent.mint,
    },
});
