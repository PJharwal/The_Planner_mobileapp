import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { borderRadius } from '../../constants/theme';
import { glassAccent, glassText } from '../../constants/glassTheme';

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
    color?: string;
    backgroundColor?: string;
    style?: ViewStyle;
    animated?: boolean;
}

/**
 * Glass-UI ProgressBar Component
 * - Rounded progress bar
 * - Smooth animation
 * - Defaults to glass theme colors
 */
export function ProgressBar({
    progress,
    height = 6,
    color = glassAccent.mint,
    backgroundColor = glassText.muted + '20', // Translucent white/gray
    style,
    animated = true,
}: ProgressBarProps) {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const animatedProgress = useSharedValue(clampedProgress);

    React.useEffect(() => {
        if (animated) {
            animatedProgress.value = withTiming(clampedProgress, { duration: 300 });
        } else {
            animatedProgress.value = clampedProgress;
        }
    }, [clampedProgress, animated]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: `${animatedProgress.value * 100}%`,
    }));

    return (
        <View
            style={[
                styles.container,
                {
                    height,
                    backgroundColor,
                    borderRadius: height / 2,
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.bar,
                    {
                        backgroundColor: color,
                        borderRadius: height / 2,
                    },
                    animatedBarStyle,
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
    },
});

export default ProgressBar;
