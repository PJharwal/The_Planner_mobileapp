import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { pastel, gradients, text } from '../../constants/theme';

interface CheckboxProps {
    checked: boolean;
    onToggle: () => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    testID?: string;
}

/**
 * Calm UI Circular Checkbox Component
 * - Fully circular design (rounded-full)
 * - Gradient fill when checked (mint)
 * - Inner dot indicator
 */
export function Checkbox({ checked, onToggle, size = 'md', disabled = false, testID }: CheckboxProps) {
    const scale = useSharedValue(1);
    const progress = useSharedValue(checked ? 1 : 0);

    React.useEffect(() => {
        progress.value = withTiming(checked ? 1 : 0, { duration: 200 });
    }, [checked]);

    const handlePress = () => {
        if (disabled) return;
        scale.value = withSpring(0.9, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 12 });
        });
        onToggle();
    };

    const getSize = () => {
        switch (size) {
            case 'sm':
                return 20;
            case 'lg':
                return 28;
            default:
                return 24;
        }
    };

    const boxSize = getSize();

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedInnerStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: progress.value }],
    }));

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID={testID}
        >
            <Animated.View
                style={[
                    styles.checkbox,
                    {
                        width: boxSize,
                        height: boxSize,
                        opacity: disabled ? 0.5 : 1,
                        backgroundColor: checked ? undefined : 'transparent',
                        borderColor: checked ? gradients.mint[1] : 'rgba(93, 107, 107, 0.3)',
                    },
                    animatedContainerStyle,
                ]}
            >
                {checked && (
                    <LinearGradient
                        colors={gradients.mint}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.gradientFill, { width: boxSize - 4, height: boxSize - 4 }]}
                    >
                        <Animated.View style={animatedInnerStyle}>
                            <View style={[styles.innerDot, { width: boxSize * 0.5, height: boxSize * 0.5 }]} />
                        </Animated.View>
                    </LinearGradient>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    checkbox: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderRadius: 9999, // Fully circular
        overflow: 'hidden',
    },
    gradientFill: {
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerDot: {
        backgroundColor: '#5D6B6B',
        borderRadius: 9999,
    },
});

export default Checkbox;
