import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    colors
} from "../../constants/theme";

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({ focused, icon, iconFocused, label }: { focused: boolean; icon: IoniconsName; iconFocused: IoniconsName; label: string }) {
    return (
        <View style={styles.tabIconContainer}>
            <Ionicons
                name={focused ? iconFocused : icon}
                size={22}
                color={focused ? colors.primary[400] : "#64748B"}
            />
            <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                tabBarActiveTintColor: colors.primary[400],
                tabBarInactiveTintColor: "#64748B",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="home-outline" iconFocused="home" label="Home" />
                    ),
                }}
            />
            <Tabs.Screen
                name="subjects"
                options={{
                    title: "Subjects",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="book-outline" iconFocused="book" label="Subjects" />
                    ),
                }}
            />
            <Tabs.Screen
                name="notes"
                options={{
                    title: "Notes",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="document-text-outline" iconFocused="document-text" label="Notes" />
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: "Analytics",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="stats-chart-outline" iconFocused="stats-chart" label="Stats" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="person-outline" iconFocused="person" label="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "#0F172A",
        borderTopColor: "#1E293B",
        borderTopWidth: 1,
        height: 70,
        paddingBottom: 8,
        paddingTop: 8,
        elevation: 0,
        shadowOpacity: 0,
    },
    tabIconContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 4,
    },
    tabLabel: {
        fontSize: 10,
        color: "#64748B",
        marginTop: 4,
        fontWeight: "500",
    },
    tabLabelFocused: {
        color: colors.primary[400],
        fontWeight: "600",
    },
});
