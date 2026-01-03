import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { glassAccent, glassText, glass } from '../../constants/glassTheme';

interface CheckboxProps {
    checked: boolean;
    onToggle: () => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    testID?: string;
}

/**
 * Glass UI Circular Checkbox Component
 * - Fully circular design (rounded-full)
 * - Mint fill when checked
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
                        backgroundColor: checked ? glassAccent.mint : 'transparent',
                        borderColor: checked ? glassAccent.mint : glassText.muted,
                    },
                    animatedContainerStyle,
                ]}
            >
                {checked && (
                    <Animated.View style={[styles.centerContainer, animatedInnerStyle]}>
                        <View style={[styles.innerDot, { width: boxSize * 0.4, height: boxSize * 0.4 }]} />
                    </Animated.View>
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
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
    },
    innerDot: {
        backgroundColor: '#000', // Dark dot against mint background
        borderRadius: 9999,
        opacity: 0.6
    },
});

export default Checkbox;
