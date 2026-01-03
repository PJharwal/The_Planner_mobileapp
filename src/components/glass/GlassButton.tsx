import React, { memo } from 'react';
import {
    TouchableOpacity,
    View,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { glass, glassAccent, glassText } from '../../constants/glassTheme';
import { glassElevation } from '../../constants/glassElevation';

export interface GlassButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    /** Size preset */
    size?: 'sm' | 'md' | 'lg';
    /** Full width */
    fullWidth?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Custom style */
    style?: ViewStyle;
    /** Icon element */
    icon?: () => React.ReactNode;
    /** Show glow effect */
    glow?: boolean;
}

/**
 * GlassButton - Glassmorphism button with accent glow
 */
export const GlassButton = memo(function GlassButton({
    children,
    onPress,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    style,
    icon,
    glow = false,
}: GlassButtonProps) {
    const sizeStyles = {
        sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
        md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 15 },
        lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 17 },
    };

    const variantStyles = {
        primary: {
            background: glassAccent.blue,
            textColor: glassText.inverse,
            borderColor: 'transparent',
        },
        secondary: {
            background: glass.background.medium,
            textColor: glassText.primary,
            borderColor: glass.border.default,
        },
        ghost: {
            background: 'transparent',
            textColor: glassAccent.blue,
            borderColor: 'transparent',
        },
        danger: {
            background: glassAccent.warm,
            textColor: glassText.inverse,
            borderColor: 'transparent',
        },
    };

    const currentVariant = variantStyles[variant];
    const currentSize = sizeStyles[size];

    // Extract shadow properties without Android elevation to prevent black borders
    const { elevation, ...buttonShadow } = glassElevation.button;

    const containerStyle: ViewStyle = {
        borderRadius: glass.radius.md,
        overflow: 'hidden',
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        opacity: disabled ? 0.5 : 1,
        ...(variant === 'primary' || glow ? buttonShadow : {}),
        ...(glow ? { shadowColor: glassAccent.blue, shadowOpacity: 0.5 } : {}),
    };

    const innerStyle: ViewStyle = {
        paddingVertical: currentSize.paddingVertical,
        paddingHorizontal: currentSize.paddingHorizontal,
        backgroundColor: currentVariant.background,
        borderRadius: glass.radius.md,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: currentVariant.borderColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    };

    const textStyle: TextStyle = {
        color: currentVariant.textColor,
        fontSize: currentSize.fontSize,
        fontWeight: '600',
        textAlign: 'center',
    };

    const content = (
        <View style={innerStyle}>
            {loading ? (
                <ActivityIndicator size="small" color={currentVariant.textColor} />
            ) : (
                <>
                    {icon && icon()}
                    {typeof children === 'string' ? (
                        <Text style={textStyle}>{children}</Text>
                    ) : (
                        children
                    )}
                </>
            )}
        </View>
    );

    // Secondary variant gets blur
    if (variant === 'secondary' && Platform.OS !== 'web') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.7}
                style={[containerStyle, style]}
            >
                <BlurView intensity={glass.blur.light} tint="dark" style={{ flex: 1 }}>
                    {content}
                </BlurView>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[containerStyle, style]}
        >
            {content}
        </TouchableOpacity>
    );
});

export default GlassButton;
