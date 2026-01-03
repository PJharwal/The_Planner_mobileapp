import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform, TouchableOpacity,} from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '../../constants/glassTheme';
import { glassElevation } from '../../constants/glassElevation';
import { CARD_RADIUS, CARD_PADDING } from '../../constants/cardSpec';

export interface GlassCardProps {
    children: React.ReactNode;
    /** Glass intensity level */
    intensity?: 'light' | 'default' | 'medium' | 'strong';
    /** Blur strength */
    blur?: 'light' | 'default' | 'strong';
    /** Border radius preset */
    radius?: 'sm' | 'md' | 'lg' | 'xl';
    /** Show border */
    bordered?: boolean;
    /** Custom styles */
    style?: StyleProp<ViewStyle>;
    /** Inner padding */
    padding?: number;
    /** Disable blur (fallback mode) */
    noBlur?: boolean;
    /** Make card pressable */
    onPress?: () => void;
}

/**
 * GlassCard - Primary glassmorphism surface component
 * 
 * Uses unified elevation system (glassElevation.surface)
 * and canonical card spec (cardSpec) for consistent shadows
 * and sizing across the app.
 * 
 * Optimized for dark theme.
 */
export const GlassCard = memo(function GlassCard({
    children,
    intensity = 'default',
    blur = 'default',
    radius = 'lg',
    bordered = true,
    style,
    padding = CARD_PADDING.vertical, // Use canonical padding
    noBlur = false,
    onPress,
}: GlassCardProps) {
    // Use canonical card radius by default
    const cardRadius = radius === 'lg' ? CARD_RADIUS : glass.radius[radius];

    // Extract shadow properties without Android elevation to prevent black borders
    const { elevation, ...shadowProps } = glassElevation.surface;

    const containerStyle: ViewStyle = {
        borderRadius: cardRadius,
        overflow: 'hidden',
        ...shadowProps, // ✅ Using unified shadow (iOS only, no Android elevation)
    };

    const innerStyle: ViewStyle = {
        padding,
        paddingHorizontal: CARD_PADDING.horizontal, // ✅ Canonical horizontal padding
        borderRadius: cardRadius,
        borderWidth: bordered ? 1 : 0,
        borderColor: glass.border.default,
    };

    if (noBlur || Platform.OS === 'web') {
        const content = (
            <View style={[innerStyle, { backgroundColor: glass.background[intensity] }]}>
                {children}
            </View>
        );

        if (onPress) {
            return (
                <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.7}
                    style={[containerStyle, style]}
                >
                    {content}
                </TouchableOpacity>
            );
        }

        return (
            <View style={[containerStyle, style]}>
                {content}
            </View>
        );
    }

    const content = (
        <View style={styles.blurWrapper}>
            <BlurView
            intensity={glass.blur[blur]}
            tint="dark"
            style={StyleSheet.absoluteFill}
            />

            <View
            style={[
                innerStyle,
                { backgroundColor: glass.background[intensity] },
            ]}
            >
            {children}
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[containerStyle, style]}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return (
        <View style={[containerStyle, style]}>
            {content}
        </View>
    );
});

const styles = StyleSheet.create({
    blur: {
        flex: 1,
        borderRadius: 0,
        overflow: "hidden"
    },
     blurWrapper: {
        flex: 1,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden', 
    },
});

export default GlassCard;
