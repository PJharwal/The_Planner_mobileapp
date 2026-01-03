import React, { memo } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { glass, glassText, glassAccent } from '../../constants/glassTheme';
import { CARD_RADIUS, CARD_PADDING } from '../../constants/cardSpec';

export interface GlassInputProps extends Omit<React.ComponentProps<typeof RNTextInput>, 'style'> {
    label?: string;
    style?: StyleProp<ViewStyle>;
    leftIcon?: string | React.ReactNode;
    rightIcon?: string | React.ReactNode;
    onRightIconPress?: () => void;
    bordered?: boolean;
    icon?: string; // Legacy support or alias for leftIcon
}

/**
 * GlassInput - Glassmorphism text input
 * 
 * Matches card styling for visual consistency:
 * - Same border radius as cards (20px)
 * - Same horizontal padding (16px)
 * - Placeholder aligns with card text baseline
 */
export const GlassInput = memo(function GlassInput({
    label,
    leftIcon,
    rightIcon,
    onRightIconPress,
    bordered = true,
    icon,
    style,
    ...props
}: GlassInputProps) {
    const { multiline } = props;

    // Support "icon" prop as alias for leftIcon if string
    const renderLeftIcon = () => {
        if (icon) return <Ionicons name={icon as any} size={20} color={glassText.muted} />;
        if (typeof leftIcon === 'string') return <Ionicons name={leftIcon as any} size={20} color={glassText.muted} />;
        return leftIcon;
    };

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}
            <View style={[
                styles.inputWrapper,
                !bordered && { borderWidth: 0, backgroundColor: glass.background.default },
                multiline && { alignItems: 'flex-start' }
            ]}>
                {(leftIcon || icon) && (
                    <View style={[styles.iconContainer, multiline && { marginTop: 12 }]}>
                        {renderLeftIcon()}
                    </View>
                )}
                <RNTextInput
                    placeholderTextColor={glassText.muted}
                    style={[
                        styles.input,
                        multiline && { height: (props.numberOfLines || 1) * 24 + 24, paddingTop: 12 },
                        (leftIcon || icon) ? { paddingLeft: 8 } : { paddingLeft: CARD_PADDING.horizontal }
                    ]}
                    selectionColor={glassAccent.blue}
                    {...props}
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconContainer}>
                        {typeof rightIcon === 'string' ? (
                            <Ionicons name={rightIcon as any} size={20} color={glassText.muted} />
                        ) : rightIcon}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    label: {
        color: glassText.secondary,
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: glass.background.light,
        borderRadius: CARD_RADIUS, // ✅ Match card radius
        borderWidth: 1,
        borderColor: glass.border.light,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 0, // padding handled by input/icon
    },
    iconContainer: {
        paddingLeft: CARD_PADDING.horizontal, // ✅ Canonical padding
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        color: glassText.primary,
        fontSize: 16,
        paddingHorizontal: CARD_PADDING.horizontal, // ✅ Match card padding
        paddingVertical: 14,
    },
    rightIconContainer: {
        paddingRight: CARD_PADDING.horizontal, // ✅ Canonical padding
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default GlassInput;
