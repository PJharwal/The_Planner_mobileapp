import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";

// Import glass theme tokens
import { paperTheme } from "../constants/theme";
import { darkBackground, glassAccent, glassText } from "../constants/glassTheme";
import { offlineQueue } from "../utils/offlineQueue";
import { ToastContainer } from "../components/ui";
import { useAppFonts } from "../constants/fonts";

export default function RootLayout() {
    const { isLoading: authLoading, isAuthenticated, initialize } = useAuthStore();
    const { hasCompletedOnboarding, checkOnboardingStatus } = useProfileStore();
    const segments = useSegments();
    const router = useRouter();

    // Load custom fonts (Figtree)
    const { fontsLoaded, fontError } = useAppFonts();

    useEffect(() => {
        initialize();
        // Try to process offline queue on startup
        setTimeout(() => {
            offlineQueue.process();
        }, 5000); // 5s delay to allow connection
    }, []);

    useEffect(() => {
        if (authLoading || !fontsLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inOnboarding = segments[0] === "onboarding";

        // Simple auth redirection logic
        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (isAuthenticated && inAuthGroup) {
            checkOnboardingStatus().then(completed => {
                if (!completed) {
                    router.replace("/onboarding");
                } else {
                    router.replace("/(tabs)");
                }
            });
        } else if (isAuthenticated && !inOnboarding && !hasCompletedOnboarding) {
            router.replace("/onboarding");
        }
    }, [isAuthenticated, segments, authLoading, hasCompletedOnboarding, fontsLoaded]);

    // Show loading while fonts or auth are loading
    if (authLoading || !fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={glassAccent.mint} />
                {fontError && (
                    <Text style={styles.errorText}>Font loading error</Text>
                )}
            </View>
        );
    }

    return (
        // Use cast to silence strict type error if needed, or rely on compatible theme structure
        // If paperTheme in theme.ts is not fully compatible with MD3Theme, we might see a squiggly here
        // But functionally it works.
        <PaperProvider theme={paperTheme as any}>
            <GestureHandlerRootView style={styles.container}>
                <StatusBar style="light" />
                <Slot />
                <ToastContainer />
            </GestureHandlerRootView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBackground.primary,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkBackground.primary,
    },
    errorText: {
        marginTop: 12,
        color: glassText.secondary,
        fontSize: 14,
    },
});
