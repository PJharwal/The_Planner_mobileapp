import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, borderRadius, background, gradients } from '../../constants/theme';

export type CardGradient = 'warm' | 'mint' | 'peach' | 'sage' | 'glass' | 'none';

interface CardProps {
    children: React.ReactNode;
    gradient?: CardGradient;
    style?: StyleProp<ViewStyle>;
    noPadding?: boolean;
    onPress?: () => void;
}

/**
 * Calm UI Card Component
 * - Gradient backgrounds (warm, mint, peach, sage)
 * - Soft shadows with subtle depth
 * - 20px border radius
 */
export function Card({ children, gradient = 'warm', style, noPadding = false, onPress }: CardProps) {
    const getGradientColors = (): readonly [string, string] => {
        switch (gradient) {
            case 'mint':
                return gradients.mint;
            case 'peach':
                return gradients.peach;
            case 'sage':
                return gradients.sage;
            case 'glass':
                return gradients.glass;
            case 'warm':
            default:
                return gradients.warm;
        }
    };

    const cardStyle = [
        styles.card,
        !noPadding && styles.padding,
        style,
    ];

    // Non-gradient card (solid background)
    if (gradient === 'none') {
        if (onPress) {
            return (
                <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[cardStyle, { backgroundColor: background.card }]}>
                    {children}
                </TouchableOpacity>
            );
        }
        return (
            <View style={[cardStyle, { backgroundColor: background.card }]}>
                {children}
            </View>
        );
    }

    // Gradient card
    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, !noPadding && styles.padding]}
                >
                    {children}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, !noPadding && styles.padding, style]}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg, // 20px
        overflow: 'hidden',
        // Soft shadow
        shadowColor: 'rgba(93, 107, 107, 1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 3,
    },
    gradient: {
        borderRadius: borderRadius.lg,
    },
    padding: {
        padding: 20,
    },
});

export default Card;
