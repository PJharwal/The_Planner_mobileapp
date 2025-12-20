import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight } from "../../constants/theme";

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
    return (
        <View style={styles.tabIconContainer}>
            <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
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
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.dark[500],
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="🏠" label="Home" />
                    ),
                }}
            />
            <Tabs.Screen
                name="subjects"
                options={{
                    title: "Subjects",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="📚" label="Subjects" />
                    ),
                }}
            />
            <Tabs.Screen
                name="notes"
                options={{
                    title: "Notes",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="📝" label="Notes" />
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: "Analytics",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="📊" label="Stats" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="👤" label="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.dark[900],
        borderTopColor: colors.dark[800],
        borderTopWidth: 1,
        height: 80,
        paddingBottom: 10,
        paddingTop: 10,
    },
    tabIconContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    tabIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    tabIconFocused: {
        transform: [{ scale: 1.1 }],
    },
    tabLabel: {
        fontSize: fontSize.xs,
        color: colors.dark[500],
    },
    tabLabelFocused: {
        color: colors.primary[400],
        fontWeight: fontWeight.medium,
    },
});
