import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, pastel, semantic, text } from '../../constants/theme';

interface CheckboxProps {
    checked: boolean;
    onToggle: () => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    testID?: string;
}

/**
 * Soft-UI Checkbox Component
 * - Rounded checkbox with gentle fill animation
 * - Soft success color
 * - No loud tick marks
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
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [pastel.white, semantic.success]
        ),
        borderColor: interpolateColor(
            progress.value,
            [0, 1],
            [pastel.beige, semantic.success]
        ),
    }));

    const animatedCheckStyle = useAnimatedStyle(() => ({
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
                        borderRadius: boxSize * 0.35,
                        opacity: disabled ? 0.5 : 1,
                    },
                    animatedContainerStyle,
                ]}
            >
                <Animated.View style={animatedCheckStyle}>
                    <Ionicons
                        name="checkmark"
                        size={boxSize * 0.6}
                        color={pastel.white}
                    />
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    checkbox: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
});

export default Checkbox;
