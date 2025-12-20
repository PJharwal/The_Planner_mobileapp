import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Custom dark theme for React Native Paper
const theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#38BDF8',           // Calm sky blue
        primaryContainer: '#0c4a6e',
        secondary: '#A855F7',         // Purple accent
        secondaryContainer: '#581c87',
        background: '#0F172A',        // Deep slate
        surface: '#1E293B',           // Card background
        surfaceVariant: '#334155',
        error: '#EF4444',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#E5E7EB',
        onSurface: '#E5E7EB',
        onSurfaceVariant: '#94A3B8',
        outline: '#475569',
        elevation: {
            level0: 'transparent',
            level1: '#1E293B',
            level2: '#253346',
            level3: '#2d3d51',
            level4: '#32425b',
            level5: '#384966',
        },
    },
    roundness: 12,
};

export default function RootLayout() {
    const { isLoading, isAuthenticated, initialize } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (isAuthenticated && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated, segments, isLoading]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#38BDF8" />
            </View>
        );
    }

    return (
        <PaperProvider theme={theme}>
            <GestureHandlerRootView style={styles.container}>
                <StatusBar style="light" />
                <Slot />
            </GestureHandlerRootView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
    },
});
