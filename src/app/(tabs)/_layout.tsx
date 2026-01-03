import { Tabs } from "expo-router";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, BookOpen, CalendarBlank, ChartBar, User } from "phosphor-react-native";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { useEffect } from "react";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
import { glassElevation } from "../../constants/glassElevation";

const ICON_SIZE = 25;
const TAB_BAR_HEIGHT = 62;
const TAB_BAR_BOTTOM_MARGIN = 0;
const TAB_BAR_HORIZONTAL_PADDING = 10;
const TAB_BAR_RADIUS = 50;
const TAB_COUNT = 5;

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();

    // Extract shadow properties without Android elevation to prevent black borders
    const { elevation, ...floatingShadow } = glassElevation.floating;

    // exact width of the tab bar container
    const tabBarWidth = windowWidth - (TAB_BAR_HORIZONTAL_PADDING * 0);
    // width of a single tab slot
    const tabSlotWidth = tabBarWidth / TAB_COUNT;
    // width of the sliding pill (slightly smaller than slot)
    const pillWidth = tabSlotWidth - 20;

    const translateX = useSharedValue(0);

    const animatedPillStyle = useAnimatedStyle(() => ({
        transform: [{
            translateX: withSpring(translateX.value, {
                damping: 100,
                stiffness: 300,
                mass: 0.5,
            })
        }],
        width: pillWidth,
    }));

    const handleTabPress = (index: number) => {
        translateX.value = index * tabSlotWidth;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: TAB_BAR_BOTTOM_MARGIN + insets.bottom + 12,
                    left: TAB_BAR_HORIZONTAL_PADDING,
                    right: TAB_BAR_HORIZONTAL_PADDING,
                    height: TAB_BAR_HEIGHT,
                    borderRadius: TAB_BAR_RADIUS,
                    backgroundColor: glass.background.strong, // Ensure opacity isn't too high to show pill
                    borderWidth: 1,
                    borderColor: glass.border.softBlue,
                    overflow: 'hidden',
                    paddingHorizontal: 0, // Ensure no native padding
                    paddingTop: 0,
                    paddingBottom: 0,
                    ...floatingShadow, // ✅ Using unified shadow (no Android elevation)
                },
                tabBarItemStyle: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 5,
                    margin: 5,
                },
                tabBarBackground: () => (
                    Platform.OS !== 'web' ? (
                        <BlurView
                            intensity={30} // Lower intensity so pill is visible "inside" glass
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        >
                            <Animated.View style={[
                                styles.pill,
                                animatedPillStyle,
                                { left: (tabSlotWidth - pillWidth) / 2 } // Center pill in first slot
                            ]} />
                        </BlurView>
                    ) : null
                ),
                tabBarActiveTintColor: glassAccent.blue,
                tabBarInactiveTintColor: glassText.muted,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <House size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                    ),
                    tabBarAccessibilityLabel: "Home tab",
                }}
                listeners={{ focus: () => handleTabPress(0) }}
            />

            <Tabs.Screen
                name="subjects"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <BookOpen size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                    ),
                    tabBarAccessibilityLabel: "Subjects tab",
                }}
                listeners={{ focus: () => handleTabPress(1) }}
            />

            <Tabs.Screen
                name="notes"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <CalendarBlank size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                    ),
                    tabBarAccessibilityLabel: "Calendar tab",
                }}
                listeners={{ focus: () => handleTabPress(2) }}
            />

            <Tabs.Screen
                name="analytics"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <ChartBar size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                    ),
                    tabBarAccessibilityLabel: "Analytics tab",
                }}
                listeners={{ focus: () => handleTabPress(3) }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <User size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                    ),
                    tabBarAccessibilityLabel: "Profile tab",
                }}
                listeners={{ focus: () => handleTabPress(4) }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    pill: {
        position: 'absolute',
        height: TAB_BAR_HEIGHT - 16,    // Fit nicely with 8px margin top/bottom
        top: 8,                         // 8px from top for centered look
        borderRadius: (TAB_BAR_HEIGHT - 16) / 2,  // Perfect pill shape
        backgroundColor: glassAccent.blue + '25',  // Soft blue with 15% opacity
        borderWidth: 1,
        borderColor: glassAccent.blue + '40',  // Subtle blue border
    },
});
