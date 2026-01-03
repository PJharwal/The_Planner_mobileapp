import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore, NotificationType } from '../../store/notificationStore';
import { spacing, borderRadius, shadows } from '../../constants/theme';
import { darkBackground, glass, glassAccent, glassText } from '../../constants/glassTheme';

const ICON_MAP: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    warning: 'warning',
    info: 'information-circle'
};

const COLOR_MAP: Record<NotificationType, string> = {
    success: glassAccent.mint,
    error: glassAccent.warm,
    warning: glassAccent.warm, // Or pure orange/yellow if avail, but warm is consistent
    info: glassAccent.blue
};

function ToastItem({ id, type, message }: { id: string; type: NotificationType; message: string }) {
    const dismiss = useNotificationStore(state => state.dismiss);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        // Slide in and fade in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => {
            dismiss(id);
        });
    };

    return (
        <Animated.View
            style={[
                styles.toastWrapper,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={[styles.toast, { borderLeftColor: COLOR_MAP[type] }]}>
                <Ionicons
                    name={ICON_MAP[type]}
                    size={20}
                    color={COLOR_MAP[type]}
                />
                <Text style={styles.message} numberOfLines={3}>
                    {message}
                </Text>
                <TouchableOpacity
                    onPress={handleDismiss}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                    <Ionicons name="close" size={20} color={glassText.secondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

export function ToastContainer() {
    const notifications = useNotificationStore(state => state.notifications);

    if (notifications.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {notifications.map((notification) => (
                <ToastItem
                    key={notification.id}
                    id={notification.id}
                    type={notification.type}
                    message={notification.message}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 50,
        left: spacing.md,
        right: spacing.md,
        zIndex: 9999,
        pointerEvents: 'box-none'
    },
    toastWrapper: {
        marginBottom: spacing.sm,
        pointerEvents: 'auto'
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: darkBackground.elevated,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: glass.border.light,
        gap: spacing.sm,
        // Shadow (iOS only - no elevation to prevent black border on Android)
        shadowColor: '#4DA3FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        color: glassText.primary,
        fontWeight: '500',
        lineHeight: 20
    }
});
