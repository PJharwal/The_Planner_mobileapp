import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { borderRadius, pastel, text, spacing, semantic, priority } from '../../constants/theme';
import { glassAccent, glassText } from '../../constants/glassTheme';

interface ChipProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'priority-high' | 'priority-medium' | 'priority-low';
    size?: 'sm' | 'md';
    onPress?: () => void;
    selected?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

/**
 * Soft-UI Chip Component
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
    textStyle,
}: ChipProps) {
    const getColors = () => {
        switch (variant) {
            case 'primary':
                // Use glass theme logic
                return { bg: glassAccent.mint + '30', text: glassAccent.mint };
            case 'success':
                return { bg: glassAccent.mint + '25', text: glassAccent.mint };
            case 'warning':
                return { bg: glassAccent.warm + '25', text: glassAccent.warm };
            case 'error':
                return { bg: glassAccent.warm + '25', text: glassAccent.warm }; // Use warm for error too
            case 'priority-high':
                return { bg: priority.highBg, text: '#C08080' };
            case 'priority-medium':
                return { bg: priority.mediumBg, text: '#B89A70' };
            case 'priority-low':
                return { bg: priority.lowBg, text: '#5AABAC' };
            default:
                // Default chip
                return { bg: glassText.secondary + '20', text: glassText.secondary };
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
                    backgroundColor: selected ? glassAccent.mint : colors.bg,
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
                        color: selected ? '#FFF' : colors.text,
                        fontSize: sizeStyles.fontSize,
                    },
                    textStyle,
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
