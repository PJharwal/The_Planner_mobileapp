import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { useThemeStore } from "../store/themeStore";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";

// Import pastel theme - SINGLE SOURCE OF TRUTH
import { paperTheme, background, pastel, darkMode } from "../constants/theme";
import { offlineQueue } from "../utils/offlineQueue";
import { ToastContainer } from "../components/ui";
import { useAppFonts } from "../constants/fonts";

export default function RootLayout() {
    const { isLoading: authLoading, isAuthenticated, initialize } = useAuthStore();
    const { hasCompletedOnboarding, checkOnboardingStatus } = useProfileStore();
    const { mode, initialize: initTheme } = useThemeStore();
    const segments = useSegments();
    const router = useRouter();

    // Load custom fonts (Figtree)
    const { fontsLoaded, fontError } = useAppFonts();

    const isDark = mode === 'dark';
    const themeBackground = isDark ? darkMode.background.primary : background.primary;

    useEffect(() => {
        initialize();
        initTheme(); // Initialize theme from storage
        // Try to process offline queue on startup
        setTimeout(() => {
            offlineQueue.process();
        }, 5000); // 5s delay to allow connection
    }, []);

    useEffect(() => {
        if (authLoading || !fontsLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inOnboarding = segments[0] === "onboarding";

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (isAuthenticated && inAuthGroup) {
            // Check onboarding status after login
            checkOnboardingStatus().then(completed => {
                if (!completed) {
                    router.replace("/onboarding");
                } else {
                    router.replace("/(tabs)");
                }
            });
        } else if (isAuthenticated && !inOnboarding && !hasCompletedOnboarding) {
            // Redirect to onboarding if not completed
            router.replace("/onboarding");
        }
    }, [isAuthenticated, segments, authLoading, hasCompletedOnboarding, fontsLoaded]);

    // Show loading while fonts or auth are loading
    if (authLoading || !fontsLoaded) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: themeBackground }]}>
                <ActivityIndicator size="large" color={isDark ? darkMode.pastel.mint : pastel.mint} />
                {fontError && (
                    <Text style={[styles.errorText, { color: isDark ? darkMode.text.secondary : pastel.slate }]}>
                        Font loading error
                    </Text>
                )}
            </View>
        );
    }

    return (
        <PaperProvider theme={paperTheme}>
            <GestureHandlerRootView style={[styles.container, { backgroundColor: themeBackground }]}>
                <StatusBar style={isDark ? "light" : "dark"} />
                <Slot />
                <ToastContainer />
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
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
    },
});
