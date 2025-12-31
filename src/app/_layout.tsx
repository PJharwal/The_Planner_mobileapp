import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Import pastel theme - SINGLE SOURCE OF TRUTH
import { paperTheme, background, pastel } from "../constants/theme";
import { offlineQueue } from "../utils/offlineQueue";
import { ToastContainer } from "../components/ui";

export default function RootLayout() {
    const { isLoading: authLoading, isAuthenticated, initialize } = useAuthStore();
    const { hasCompletedOnboarding, checkOnboardingStatus } = useProfileStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        initialize();
        // Try to process offline queue on startup
        setTimeout(() => {
            offlineQueue.process();
        }, 5000); // 5s delay to allow connection
    }, []);

    useEffect(() => {
        if (authLoading) return;

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
    }, [isAuthenticated, segments, authLoading, hasCompletedOnboarding]);

    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={pastel.mint} />
            </View>
        );
    }

    return (
        <PaperProvider theme={paperTheme}>
            <GestureHandlerRootView style={styles.container}>
                <StatusBar style="dark" />
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
        backgroundColor: background.primary,
    },
});
