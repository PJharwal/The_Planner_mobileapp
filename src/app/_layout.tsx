import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";

// Import pastel theme - SINGLE SOURCE OF TRUTH
import { paperTheme, background, pastel } from "../constants/theme";

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
                <ActivityIndicator size="large" color={pastel.mint} />
            </View>
        );
    }

    return (
        <PaperProvider theme={paperTheme}>
            <GestureHandlerRootView style={styles.container}>
                <StatusBar style="dark" />
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
        backgroundColor: background.primary,
    },
});
