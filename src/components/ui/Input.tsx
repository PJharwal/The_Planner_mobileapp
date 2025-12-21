import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps as RNTextInputProps, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { borderRadius, pastel, background, text as textColors, shadows, spacing } from '../../constants/theme';

interface InputProps extends Omit<RNTextInputProps, 'style'> {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

/**
 * Soft-UI Input Component
 * - Rounded rectangle with soft focus state
 * - Gentle elevation when focused
 * - No harsh borders
 */
export function Input({ label, error, containerStyle, ...props }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const focusProgress = useSharedValue(0);

    const handleFocus = () => {
        setIsFocused(true);
        focusProgress.value = withTiming(1, { duration: 200 });
    };

    const handleBlur = () => {
        setIsFocused(false);
        focusProgress.value = withTiming(0, { duration: 200 });
    };

    const animatedContainerStyle = useAnimatedStyle(() => ({
        borderColor: focusProgress.value === 1 ? pastel.mint : pastel.beige,
        shadowOpacity: 0.08 + focusProgress.value * 0.07,
    }));

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View
                style={[
                    styles.inputContainer,
                    animatedContainerStyle,
                    error && styles.inputError,
                ]}
            >
                <RNTextInput
                    {...props}
                    style={[styles.input, props.multiline && styles.multiline]}
                    placeholderTextColor={textColors.muted}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: textColors.primary,
        marginBottom: spacing.sm,
    },
    inputContainer: {
        backgroundColor: background.card,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: pastel.beige,
        ...shadows.soft,
    },
    input: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontSize: 16,
        color: textColors.primary,
        minHeight: 48,
    },
    multiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#E8A0A0',
    },
    errorText: {
        fontSize: 12,
        color: '#E8A0A0',
        marginTop: spacing.xs,
    },
});

export default Input;
