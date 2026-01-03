import React, { memo, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing
} from 'react-native-reanimated';

export interface MeshGradientBackgroundProps {
    /** Additional style for the container */
    style?: StyleProp<ViewStyle>;
    /** Enable subtle animation (breathing effect) */
    animated?: boolean;
}

/**
 * MeshGradientBackground - World-Class Vibrant Glowing Blue
 * 
 * Premium gradient with three key enhancements:
 * 1. Breathing Animation - Subtle 8s cycle creates "alive" feel
 * 2. Violet Accent - Deep purple adds color complexity and depth
 * 3. Enhanced Layering - Multiple blues create organic glow
 * 
 * Design characteristics:
 * - Pure black base (#000000)
 * - Vibrant electric blue glow (#00A3FF)
 * - Deep violet accent for sophistication
 * - White-blue highlights for intensity
 * - Subtle breathing animation (8 second cycle)
 * 
 * Creates a premium, unique appearance that stands out
 * from generic gradients while maintaining excellent contrast.
 */
export const MeshGradientBackground = memo(function MeshGradientBackground({
    style,
    animated = true,
}: MeshGradientBackgroundProps) {
    // Breathing animation value
    const floatAnim = useSharedValue(0);

    useEffect(() => {
        if (animated) {
            floatAnim.value = withRepeat(
                withTiming(1, {
                    duration: 8000,
                    easing: Easing.inOut(Easing.ease)
                }),
                -1,
                true
            );
        }
    }, [animated]);

    // Animated style for main glow - creates "breathing" effect
    const animatedGlow = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(floatAnim.value, [0, 1], [-15, 15]) },
            { scale: interpolate(floatAnim.value, [0, 1], [1, 1.05]) }
        ],
        opacity: interpolate(floatAnim.value, [0, 1], [0.85, 1]),
    }));

    return (
        <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
            {/* Base layer - Pure Black Foundation */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            {/* Primary Electric Blue Glow - Animated Breathing Effect */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedGlow]}>
                <LinearGradient
                    colors={[
                        'rgba(0, 170, 255, 0.85)',  // Bright blue-white glow
                        'rgba(0, 145, 255, 0.65)',  // Intense electric blue
                        'rgba(0, 125, 255, 0.45)',  // Strong blue
                        'rgba(0, 105, 230, 0.28)',  // Medium blue fade
                        'rgba(0, 85, 200, 0.14)',   // Deep blue
                        'rgba(0, 70, 170, 0.06)',   // Very deep blue
                        'rgba(0, 0, 0, 0)',         // Transparent to black
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.75 }}
                    locations={[0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.88]}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            {/* UNIQUE: Deep Violet Accent - Bottom Left "Light Leak" */}
            <LinearGradient
                colors={[
                    'rgba(91, 33, 182, 0.28)',   // Deep violet glow
                    'rgba(75, 25, 160, 0.18)',   // Purple fade
                    'rgba(60, 20, 140, 0.08)',   // Deep purple
                    'rgba(0, 0, 0, 0)',
                ]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 1 }}
                end={{ x: 0.45, y: 0.5 }}
                locations={[0, 0.3, 0.6, 0.9]}
            />

            {/* Bright Blue Accent - Top Right Glow */}
            <LinearGradient
                colors={[
                    'rgba(0, 155, 255, 0.55)',
                    'rgba(0, 135, 255, 0.32)',
                    'rgba(0, 115, 230, 0.16)',
                    'rgba(0, 95, 200, 0.06)',
                    'rgba(0, 0, 0, 0)',
                ]}
                start={{ x: 0.92, y: 0.03 }}
                end={{ x: 0.28, y: 0.58 }}
                locations={[0, 0.28, 0.52, 0.76, 0.95]}
                style={StyleSheet.absoluteFill}
            />

            {/* White-Blue Highlight - Intense Brightness at Top */}
            <LinearGradient
                colors={[
                    'rgba(255, 255, 255, 0.18)',  // Pure white highlight
                    'rgba(210, 235, 255, 0.12)',  // Bright white-blue
                    'rgba(155, 210, 255, 0.06)',  // Light blue
                    'rgba(110, 180, 255, 0.03)',  // Medium blue
                    'rgba(0, 0, 0, 0)',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
                locations={[0, 0.15, 0.35, 0.6, 0.85]}
                style={StyleSheet.absoluteFill}
            />

            {/* Deep Blue Shadow - Adds Depth at Bottom */}
            <LinearGradient
                colors={[
                    'rgba(0, 0, 0, 0)',
                    'rgba(0, 48, 115, 0.18)',
                    'rgba(0, 32, 85, 0.26)',
                    'rgba(0, 20, 60, 0.32)',
                ]}
                start={{ x: 0.5, y: 0.62 }}
                end={{ x: 0.5, y: 1 }}
                locations={[0, 0.65, 0.85, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* Subtle Side Glow - Left Accent */}
            <LinearGradient
                colors={[
                    'rgba(0, 145, 230, 0.22)',
                    'rgba(0, 110, 190, 0.11)',
                    'rgba(0, 80, 150, 0.04)',
                    'rgba(0, 0, 0, 0)',
                ]}
                start={{ x: 0.03, y: 0.32 }}
                end={{ x: 0.52, y: 0.72 }}
                locations={[0, 0.35, 0.68, 0.92]}
                style={StyleSheet.absoluteFill}
            />

            {/* Noise Texture Overlay - CRITICAL FOR PREMIUM FEEL */}
            {/* Eliminates gradient banding and adds tactile quality */}
            <Image
                source={require('../../../assets/noise.png')}
                style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
                resizeMode="repeat"
            />
        </View>
    );
});

export default MeshGradientBackground;
