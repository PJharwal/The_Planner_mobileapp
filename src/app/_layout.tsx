import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { View, StyleSheet, Text, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import glass theme tokens
import { paperTheme } from "../constants/theme";
import { darkBackground, glassAccent, glassText } from "../constants/glassTheme";
import { offlineQueue } from "../utils/offlineQueue";
import { ToastContainer } from "../components/ui";
import { useAppFonts } from "../constants/fonts";
import { MeshGradientBackground } from "../components/glass";
import { GlobalModals } from "../components/GlobalModals";

// RevenueCat is dynamically imported to avoid Expo Go crash

// Custom animated loading screen with book icon
function LoadingScreen({ fontError }: { fontError: Error | null }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulsing animation for book icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Progress line animation
        Animated.loop(
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            })
        ).start();
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.loadingContainer}>
            <MeshGradientBackground />
            <Animated.View style={[styles.bookContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="book" size={48} color={glassAccent.mint} />
            </Animated.View>
            <Text style={styles.loadingText}>The Planner</Text>
            <View style={styles.progressContainer}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
            {fontError && (
                <Text style={styles.errorText}>Font loading error</Text>
            )}
        </View>
    );
}

export default function RootLayout() {
    const { isLoading: authLoading, isAuthenticated, initialize } = useAuthStore();
    const { hasCompletedOnboarding, checkOnboardingStatus, isLoading: profileLoading } = useProfileStore();
    const segments = useSegments();
    const router = useRouter();

    // Load custom fonts (Figtree)
    const { fontsLoaded, fontError } = useAppFonts();

    // Track if we've checked onboarding status
    const [onboardingChecked, setOnboardingChecked] = useState(false);

    useEffect(() => {
        // Initialize RevenueCat (dynamic import for Expo Go safety)
        import('../lib/revenuecat').then(({ configureRevenueCat }) => {
            configureRevenueCat();
        }).catch(console.warn);

        initialize();
        // Try to process offline queue on startup
        setTimeout(() => {
            offlineQueue.process();
        }, 5000); // 5s delay to allow connection
    }, []);

    // Check onboarding status and identify user when authenticated
    useEffect(() => {
        if (isAuthenticated && !onboardingChecked) {
            checkOnboardingStatus().then(() => {
                setOnboardingChecked(true);
            });

            // Identify user with RevenueCat and refresh subscription
            const { user } = useAuthStore.getState();
            if (user?.id) {
                import('../lib/revenuecat').then(({ identifyUser }) => {
                    identifyUser(user.id).then(() => {
                        useSubscriptionStore.getState().refreshSubscription();
                    });
                }).catch(console.warn);
            }
        }
        if (!isAuthenticated) {
            setOnboardingChecked(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (authLoading || !fontsLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inOnboarding = segments[0] === "onboarding";

        // Not authenticated -> go to login
        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login");
            return;
        }

        // Authenticated and in auth group -> check onboarding and redirect
        if (isAuthenticated && inAuthGroup) {
            if (onboardingChecked) {
                if (!hasCompletedOnboarding) {
                    router.replace("/onboarding");
                } else {
                    router.replace("/(tabs)");
                }
            }
            return;
        }

        // Authenticated, not in auth or onboarding, but hasn't completed onboarding
        if (isAuthenticated && !inOnboarding && onboardingChecked && !hasCompletedOnboarding) {
            router.replace("/onboarding");
        }
    }, [isAuthenticated, segments, authLoading, hasCompletedOnboarding, fontsLoaded, onboardingChecked]);

    // Show loading while fonts or auth are loading
    if (authLoading || !fontsLoaded) {
        return (
            <LoadingScreen fontError={fontError} />
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
                <GlobalModals />
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
        backgroundColor: 'transparent',
    },
    bookContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${glassAccent.mint}15`,
        borderWidth: 1,
        borderColor: `${glassAccent.mint}30`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    loadingText: {
        fontSize: 24,
        fontWeight: '700',
        color: glassText.primary,
        marginBottom: 32,
        letterSpacing: -0.5,
    },
    progressContainer: {
        width: 200,
        height: 4,
        backgroundColor: `${glassAccent.mint}20`,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: glassAccent.mint,
        borderRadius: 2,
    },
    errorText: {
        marginTop: 20,
        color: glassText.secondary,
        fontSize: 14,
    },
});
