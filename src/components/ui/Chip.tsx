import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { borderRadius, pastel, text, spacing, semantic, priority } from '../../constants/theme';

interface ChipProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'priority-high' | 'priority-medium' | 'priority-low';
    size?: 'sm' | 'md';
    onPress?: () => void;
    selected?: boolean;
    style?: ViewStyle;
}

/**
 * Soft-UI Chip Component
 * - Pastel-tinted pill chips
 * - For tags, filters, status badges
 * - Soft colors, no harsh contrast
 */
export function Chip({
    children,
    variant = 'default',
    size = 'md',
    onPress,
    selected = false,
    style,
}: ChipProps) {
    const getColors = () => {
        switch (variant) {
            case 'primary':
                return { bg: `${pastel.mint}30`, text: '#5AABAC' };
            case 'success':
                return { bg: `${semantic.success}25`, text: '#5AABAC' };
            case 'warning':
                return { bg: `${semantic.warning}25`, text: '#B89A70' };
            case 'error':
                return { bg: `${semantic.error}25`, text: '#C08080' };
            case 'priority-high':
                return { bg: priority.highBg, text: '#C08080' };
            case 'priority-medium':
                return { bg: priority.mediumBg, text: '#B89A70' };
            case 'priority-low':
                return { bg: priority.lowBg, text: '#5AABAC' };
            default:
                return { bg: pastel.beige + '50', text: text.secondary };
        }
    };

    const getSizeStyles = () => {
        if (size === 'sm') {
            return {
                paddingHorizontal: 8,
                paddingVertical: 4,
                fontSize: 11,
            };
        }
        return {
            paddingHorizontal: 12,
            paddingVertical: 6,
            fontSize: 13,
        };
    };

    const colors = getColors();
    const sizeStyles = getSizeStyles();

    const content = (
        <View
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? pastel.mint : colors.bg,
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                    paddingVertical: sizeStyles.paddingVertical,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: selected ? pastel.white : colors.text,
                        fontSize: sizeStyles.fontSize,
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    chip: {
        borderRadius: borderRadius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '500',
    },
});

export default Chip;
