import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, BookOpen, CalendarBlank, ChartBar, User } from "phosphor-react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
    Easing
} from "react-native-reanimated";
import { useEffect } from "react";
import { pastel, text } from "../../constants/theme";

// Design tokens per spec
const TAB_BAR_HEIGHT = 68; // 64-72px ✓
const TAB_BAR_RADIUS = 34;
const ICON_SIZE = 22; // 22-24px ✓
const BUBBLE_SIZE = 42; // 40-44px ✓

// Animated bubble icon wrapper with Reanimated
function TabIcon({
    focused,
    children,
}: {
    focused: boolean;
    children: React.ReactNode;
}) {
    const scale = useSharedValue(focused ? 1 : 0.8);
    const opacity = useSharedValue(focused ? 1 : 0);
    const iconScale = useSharedValue(focused ? 1.1 : 1);

    useEffect(() => {
        // Animate bubble scale/fade
        scale.value = withTiming(focused ? 1 : 0.5, {
            duration: 180,
            easing: Easing.out(Easing.cubic)
        });
        opacity.value = withTiming(focused ? 1 : 0, {
            duration: 180,
            easing: Easing.out(Easing.cubic)
        });
        // Slightly larger icon when focused
        iconScale.value = withTiming(focused ? 1.1 : 1, {
            duration: 180,
            easing: Easing.out(Easing.cubic)
        });
    }, [focused]);

    const bubbleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const iconContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <View style={styles.tabIconContainer}>
            {/* Animated bubble background */}
            <Animated.View style={[styles.bubble, bubbleStyle]} />
            {/* Animated icon with scale */}
            <Animated.View style={[styles.iconWrapper, iconContainerStyle]}>
                {children}
            </Animated.View>
        </View>
    );
}

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false, // Icon-only ✓
                tabBarStyle: {
                    position: "absolute",
                    bottom: insets.bottom + 12,
                    left: 16,
                    right: 16,
                    height: TAB_BAR_HEIGHT,
                    borderRadius: TAB_BAR_RADIUS,
                    // Semi-transparent pastel background ✓
                    backgroundColor: "rgba(247, 247, 247, 0.92)",
                    // Soft neumorphic shadow ✓
                    shadowColor: pastel.slate,
                    shadowOpacity: 0.08,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                    borderTopWidth: 0,
                },
                tabBarItemStyle: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                },
                tabBarActiveTintColor: pastel.slate,
                tabBarInactiveTintColor: `${text.muted}99`, // 60% opacity for inactive
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused}>
                            <House size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        </TabIcon>
                    ),
                    tabBarAccessibilityLabel: "Home tab",
                }}
            />

            <Tabs.Screen
                name="subjects"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused}>
                            <BookOpen size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        </TabIcon>
                    ),
                    tabBarAccessibilityLabel: "Subjects tab",
                }}
            />

            <Tabs.Screen
                name="notes"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused}>
                            <CalendarBlank size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        </TabIcon>
                    ),
                    tabBarAccessibilityLabel: "Calendar tab",
                }}
            />

            <Tabs.Screen
                name="analytics"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused}>
                            <ChartBar size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        </TabIcon>
                    ),
                    tabBarAccessibilityLabel: "Analytics tab",
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused}>
                            <User size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        </TabIcon>
                    ),
                    tabBarAccessibilityLabel: "Profile tab",
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabIconContainer: {
        width: 48, // Tap area ≥44px ✓
        height: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    bubble: {
        position: "absolute",
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        backgroundColor: pastel.mint,
    },
    iconWrapper: {
        zIndex: 1,
    },
});
