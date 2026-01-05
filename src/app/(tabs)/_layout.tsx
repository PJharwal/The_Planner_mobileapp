import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Platform, useWindowDimensions, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, ChartBar, Plus, Timer, CalendarBlank } from "phosphor-react-native";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { darkBackground, glass, glassAccent, glassText } from "../../constants/glassTheme";
import { glassElevation } from "../../constants/glassElevation";
import { StartSessionModal, SessionConfig } from "../../components/session/StartSessionModal";
import { useProfileStore } from "../../store/profileStore";
import { ADAPTIVE_PLANS } from "../../utils/adaptivePlans";
import { useModalStore } from "../../store/modalStore";

const ICON_SIZE = 25;
const TAB_BAR_HEIGHT = 62;
const TAB_BAR_BOTTOM_MARGIN = 0;
const TAB_BAR_HORIZONTAL_PADDING = 10;
const TAB_BAR_RADIUS = 50;
const TAB_COUNT = 5;

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const router = useRouter();
    const { profile } = useProfileStore();

    // Start Session Modal - now using global store
    const { openStartSession } = useModalStore();

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
        <>
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
                    name="analytics"
                    options={{
                        tabBarIcon: ({ focused, color }) => (
                            <ChartBar size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        ),
                        tabBarAccessibilityLabel: "Analytics tab",
                    }}
                    listeners={{ focus: () => handleTabPress(1) }}
                />

                {/* Center Add Task Button - Matches other tab icons */}
                <Tabs.Screen
                    name="add-task"
                    options={{
                        tabBarIcon: ({ focused, color }) => (
                            <Plus size={ICON_SIZE} color={focused ? glassAccent.mint : color} weight={focused ? "fill" : "bold"} />
                        ),
                        tabBarAccessibilityLabel: "Add Task",
                    }}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault();
                            if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                            openStartSession();
                        },
                        focus: () => handleTabPress(2),
                    }}
                />

                <Tabs.Screen
                    name="subjects"
                    options={{
                        tabBarIcon: ({ focused, color }) => (
                            <Timer size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        ),
                        tabBarAccessibilityLabel: "Focus tab",
                    }}
                    listeners={{ focus: () => handleTabPress(3) }}
                />

                <Tabs.Screen
                    name="notes"
                    options={{
                        tabBarIcon: ({ focused, color }) => (
                            <CalendarBlank size={ICON_SIZE} color={color} weight={focused ? "fill" : "regular"} />
                        ),
                        tabBarAccessibilityLabel: "Calendar tab",
                    }}
                    listeners={{ focus: () => handleTabPress(4) }}
                />

                {/* Profile hidden from tab bar - accessed via header */}
                <Tabs.Screen
                    name="profile"
                    options={{
                        href: null, // Hide from tab bar
                    }}
                />
            </Tabs>
        </>
    );
}

const styles = StyleSheet.create({
    pill: {
        position: 'absolute',
        height: TAB_BAR_HEIGHT - 16,
        top: 8,
        borderRadius: (TAB_BAR_HEIGHT - 16) / 2,
        backgroundColor: glassAccent.blue + '25',
        borderWidth: 1,
        borderColor: glassAccent.blue + '40',
    },
});
