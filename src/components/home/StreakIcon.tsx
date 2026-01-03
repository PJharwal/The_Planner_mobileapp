import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { useStreakStore, getGlowColor } from '../../store/streakStore';
// Remove pastel, no usage needed if using flameColor logic from store which returns hex
// But check if flameColor relies on pastel? 
// getGlowColor typically returns hex codes directly in the store utility.

interface StreakIconProps {
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StreakIcon({ onPress }: StreakIconProps) {
    const { streak, getGlowIntensity } = useStreakStore();
    const streakDays = streak?.current_streak_days || 0;
    const intensity = getGlowIntensity();

    // Shared values for animation
    const glowOpacity = useSharedValue(intensity);
    const scale = useSharedValue(1);

    // Color based on intensity
    const flameColor = getGlowColor(intensity);
    const isActive = streakDays > 0;

    useEffect(() => {
        // Reset animation when streak changes
        glowOpacity.value = intensity;
        scale.value = 1;

        // Only animate if streak >= 7 days (breathing animation)
        if (streakDays >= 7) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(intensity * 0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(intensity, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1, // Infinite
                true // Reverse
            );

            scale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        }
    }, [streakDays, intensity]);

    const animatedStyle = useAnimatedStyle(() => ({
        shadowOpacity: glowOpacity.value,
        shadowRadius: 8 + glowOpacity.value * 8,
        shadowColor: flameColor,
        shadowOffset: { width: 0, height: 0 },
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            onPress={onPress}
            style={[styles.container, animatedStyle]}
            accessibilityLabel={`Streak: ${streakDays} days`}
            accessibilityHint="Tap to view streak details"
            accessibilityRole="button"
        >
            <View style={[
                styles.iconContainer,
                isActive && { backgroundColor: `${flameColor}20` }
            ]}>
                <Ionicons
                    name={isActive ? 'flame' : 'flame-outline'}
                    size={22}
                    color={flameColor}
                />
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 4,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
});
