import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp, TouchableOpacity } from 'react-native';
import { shadows, borderRadius, background, pastel } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'peach' | 'mint' | 'elevated';
    style?: StyleProp<ViewStyle>;
    noPadding?: boolean;
    onPress?: () => void;
}

/**
 * Soft-UI Card Component
 * - Floating neumorphic appearance
 * - Soft shadows (no harsh edges)
 * - Generous border radius
 */
export function Card({ children, variant = 'default', style, noPadding = false, onPress }: CardProps) {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'peach':
                return pastel.peach;
            case 'mint':
                return pastel.mistBlue;
            case 'elevated':
                return '#FEFEFE';
            default:
                return background.card;
        }
    };

    const cardStyle = [
        styles.card,
        { backgroundColor: getBackgroundColor() },
        variant === 'elevated' && shadows.elevated,
        !noPadding && styles.padding,
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        backgroundColor: background.card,
        // Shadow for iOS
        shadowColor: '#5D6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        // Shadow for Android
        elevation: 3,
    },
    padding: {
        padding: 16,
    },
});

export default Card;
