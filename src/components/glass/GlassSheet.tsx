import React, { memo, useEffect } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
    TouchableOpacity,
    Pressable,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';
import { glass, glassText, darkBackground } from '../../constants/glassTheme';

export interface GlassSheetProps {
    /** Whether the sheet is visible */
    visible: boolean;
    /** Callback when sheet should close */
    onClose: () => void;
    /** Sheet content */
    children: React.ReactNode;
    /** Sheet title (optional) */
    title?: string;
    /** Presentation style */
    presentation?: 'fullscreen' | 'card' | 'bottom';
    /** Show close button */
    showCloseButton?: boolean;
    /** Custom style for the sheet container */
    style?: StyleProp<ViewStyle>;
    /** Disable backdrop dismissal */
    disableBackdropDismiss?: boolean;
}

/**
 * GlassSheet - Modal sheet component with glassmorphism styling
 * 
 * Provides a premium modal experience with glass effects and smooth animations.
 * Supports multiple presentation styles and backdrop blur.
 */
export const GlassSheet = memo(function GlassSheet({
    visible,
    onClose,
    children,
    title,
    presentation = 'card',
    showCloseButton = true,
    style,
    disableBackdropDismiss = false,
}: GlassSheetProps) {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(1000);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 200,
            });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            translateY.value = withTiming(1000, { duration: 200 });
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleBackdropPress = () => {
        if (!disableBackdropDismiss) {
            onClose();
        }
    };

    const sheetContainerStyle: ViewStyle = {
        borderTopLeftRadius: presentation === 'fullscreen' ? 0 : glass.radius.xl,
        borderTopRightRadius: presentation === 'fullscreen' ? 0 : glass.radius.xl,
        overflow: 'hidden',
        maxHeight: presentation === 'fullscreen' ? '100%' : '90%',
        paddingTop: presentation === 'fullscreen' ? insets.top : 24,
        paddingBottom: insets.bottom || 24,
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleBackdropPress}
            >
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
                        backdropStyle,
                    ]}
                />
            </Pressable>

            {/* Sheet Container */}
            <View style={styles.sheetWrapper} pointerEvents="box-none">
                <Animated.View
                    style={[
                        styles.sheetContainer,
                        sheetContainerStyle,
                        sheetStyle,
                        style,
                    ]}
                >
                    {Platform.OS !== 'web' ? (
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    {
                                        backgroundColor: glass.background.strong,
                                        borderTopWidth: 1,
                                        borderColor: glass.border.default,
                                    },
                                ]}
                            >
                                {/* Header */}
                                {(title || showCloseButton) && (
                                    <View style={styles.header}>
                                        {title && (
                                            <View style={{ flex: 1 }}>
                                                <Animated.Text
                                                    style={[
                                                        styles.title,
                                                        { color: glassText.primary },
                                                    ]}
                                                >
                                                    {title}
                                                </Animated.Text>
                                            </View>
                                        )}
                                        {showCloseButton && (
                                            <TouchableOpacity
                                                onPress={onClose}
                                                style={styles.closeButton}
                                                activeOpacity={0.7}
                                            >
                                                <X size={24} color={glassText.secondary} weight="bold" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Content */}
                                <View style={styles.content}>{children}</View>
                            </View>
                        </BlurView>
                    ) : (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: glass.background.strong,
                                    borderTopWidth: 1,
                                    borderColor: glass.border.default,
                                },
                            ]}
                        >
                            {/* Web fallback without blur */}
                            {(title || showCloseButton) && (
                                <View style={styles.header}>
                                    {title && (
                                        <Animated.Text
                                            style={[styles.title, { color: glassText.primary }]}
                                        >
                                            {title}
                                        </Animated.Text>
                                    )}
                                    {showCloseButton && (
                                        <TouchableOpacity
                                            onPress={onClose}
                                            style={styles.closeButton}
                                        >
                                            <X size={24} color={glassText.secondary} weight="bold" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            <View style={styles.content}>{children}</View>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    sheetWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: darkBackground.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: glass.border.light,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        flex: 1,
    },
    closeButton: {
        padding: 8,
        marginRight: -8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
});

export default GlassSheet;
