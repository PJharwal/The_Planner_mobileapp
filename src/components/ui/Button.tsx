import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { borderRadius, pastel, text, shadows, spacing } from '../../constants/theme';

interface ButtonProps {
    children: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    testID?: string;
}

/**
 * Soft-UI Pill Button Component
 * - Pill-shaped (fully rounded)
 * - Soft pastel colors
 * - No harsh contrast
 */
export function Button({
    children,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    fullWidth = false,
    testID,
}: ButtonProps) {
    const getColors = () => {
        switch (variant) {
            case 'primary':
                return {
                    bg: pastel.mint,
                    text: text.primary,
                    pressedBg: '#7BCBCC',
                };
            case 'secondary':
                return {
                    bg: 'transparent',
                    text: pastel.slate,
                    pressedBg: pastel.mistBlue,
                    border: pastel.beige,
                };
            case 'ghost':
                return {
                    bg: 'transparent',
                    text: pastel.slate,
                    pressedBg: 'rgba(93, 107, 107, 0.08)',
                };
            case 'danger':
                return {
                    bg: '#E8A0A0',
                    text: text.primary,
                    pressedBg: '#D89090',
                };
            default:
                return {
                    bg: pastel.mint,
                    text: text.primary,
                    pressedBg: '#7BCBCC',
                };
        }
    };

    const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
        switch (size) {
            case 'sm':
                return {
                    button: { paddingVertical: 8, paddingHorizontal: 16 },
                    text: { fontSize: 13 },
                };
            case 'lg':
                return {
                    button: { paddingVertical: 16, paddingHorizontal: 32 },
                    text: { fontSize: 17 },
                };
            default:
                return {
                    button: { paddingVertical: 12, paddingHorizontal: 24 },
                    text: { fontSize: 15 },
                };
        }
    };

    const colors = getColors();
    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            testID={testID}
            style={[
                styles.button,
                {
                    backgroundColor: disabled ? pastel.beige : colors.bg,
                    borderColor: variant === 'secondary' ? colors.border : 'transparent',
                    borderWidth: variant === 'secondary' ? 1.5 : 0,
                },
                sizeStyles.button,
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={colors.text} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        { color: disabled ? text.disabled : colors.text },
                        sizeStyles.text,
                        textStyle,
                    ]}
                >
                    {children}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: borderRadius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 44, // Accessibility: minimum tap target
    },
    text: {
        fontWeight: '600',
    },
    fullWidth: {
        width: '100%',
    },
});

export default Button;
