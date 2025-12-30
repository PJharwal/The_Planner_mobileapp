import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, BookOpen, CalendarBlank, ChartBar, User } from "phosphor-react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";
import { pastel, background } from "../../constants/theme";

const ICON_SIZE = 24;

// Simple tab icon with animated indicator dot
function TabIcon({
    focused,
    children,
}: {
    focused: boolean;
    children: React.ReactNode;
}) {
    const dotOpacity = useSharedValue(focused ? 1 : 0);
    const iconScale = useSharedValue(focused ? 1.05 : 1);

    useEffect(() => {
        dotOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
        iconScale.value = withTiming(focused ? 1.05 : 1, { duration: 200 });
    }, [focused]);

    const dotStyle = useAnimatedStyle(() => ({
        opacity: dotOpacity.value,
    }));

    const iconContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <View style={styles.tabIconContainer}>
            <Animated.View style={[styles.iconWrapper, iconContainerStyle]}>
                {children}
            </Animated.View>
            {/* Small dot indicator below icon */}
            <Animated.View style={[styles.indicator, dotStyle]} />
        </View>
    );
}

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    backgroundColor: background.primary,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(93, 107, 107, 0.1)",
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarItemStyle: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 8,
                },
                tabBarActiveTintColor: pastel.slate,
                tabBarInactiveTintColor: "rgba(93, 107, 107, 0.4)",
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
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 4,
    },
    iconWrapper: {
        marginBottom: 4,
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: pastel.peach,
    },
});
