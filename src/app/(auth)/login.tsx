import { useState, useRef, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView, Dimensions, Animated } from "react-native";
import { Link } from "expo-router";
import { TextInput, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../store/authStore";

// Design tokens
import { pastel, background, text, spacing, borderRadius, gradients } from "../../constants/theme";
// UI Components
import { Card, Button } from "../../components/ui";

const { width } = Dimensions.get("window");

// App Features for showcase
const APP_FEATURES = [
    {
        icon: "school-outline",
        title: "Smart Study Planning",
        description: "Organize subjects, topics, and tasks with intelligent prioritization",
        gradient: gradients.mint,
    },
    {
        icon: "time-outline",
        title: "Focus Timer",
        description: "Track study sessions with Pomodoro-style timer and breaks",
        gradient: gradients.warm,
    },
    {
        icon: "analytics-outline",
        title: "Learning Insights",
        description: "Discover your best study times and track progress",
        gradient: gradients.peach,
    },
    {
        icon: "bulb-outline",
        title: "Smart Revision",
        description: "AI-powered suggestions for what to review next",
        gradient: gradients.sage,
    },
];

// Feature Card Component
function FeatureCard({ feature, index }: { feature: typeof APP_FEATURES[0]; index: number }) {
    return (
        <LinearGradient
            colors={feature.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.featureCard, { marginLeft: index === 0 ? spacing.lg : 0 }]}
        >
            <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={28} color={text.primary} />
            </View>
            <Text variant="titleMedium" style={styles.featureTitle}>
                {feature.title}
            </Text>
            <Text variant="bodySmall" style={styles.featureDesc}>
                {feature.description}
            </Text>
        </LinearGradient>
    );
}

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuthStore();
    const theme = useTheme();

    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Auto-scroll features
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % APP_FEATURES.length;
            setActiveIndex(nextIndex);
            scrollRef.current?.scrollTo({ x: nextIndex * (width * 0.7 + 12), animated: true });
        }, 3500);
        return () => clearInterval(interval);
    }, [activeIndex]);

    const handleLogin = async () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email");
            return;
        }
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }

        try {
            await login(email.trim(), password);
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "Please check your credentials and try again");
        }
    };



    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={gradients.mint as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="school" size={40} color={text.primary} />
                            </LinearGradient>
                        </View>
                        <Text variant="headlineLarge" style={styles.appName}>The Planner</Text>
                        <Text variant="bodyMedium" style={styles.tagline}>
                            Your personal study intelligence system
                        </Text>
                    </View>

                    {/* Feature Carousel */}
                    <View style={styles.featureSection}>
                        <ScrollView
                            ref={scrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled={false}
                            decelerationRate="fast"
                            snapToInterval={width * 0.7 + 12}
                            contentContainerStyle={styles.featureScroll}
                        >
                            {APP_FEATURES.map((feature, index) => (
                                <FeatureCard key={feature.title} feature={feature} index={index} />
                            ))}
                        </ScrollView>

                        {/* Pagination Dots */}
                        <View style={styles.pagination}>
                            {APP_FEATURES.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        activeIndex === index && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Form Card */}
                    <Card style={styles.formCard}>
                        <Text variant="titleLarge" style={styles.formTitle}>Welcome Back</Text>

                        {/* Social Login */}


                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            style={styles.input}
                            outlineColor="rgba(93, 107, 107, 0.15)"
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                            left={<TextInput.Icon icon={() => <Ionicons name="mail-outline" size={20} color={text.muted} />} />}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            style={styles.input}
                            outlineColor="rgba(93, 107, 107, 0.15)"
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                            left={<TextInput.Icon icon={() => <Ionicons name="lock-closed-outline" size={20} color={text.muted} />} />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                        />

                        <Button
                            variant="primary"
                            onPress={handleLogin}
                            loading={isLoading}
                            fullWidth
                            style={styles.button}
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </Card>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium" style={styles.footerText}>
                            Don't have an account?{" "}
                        </Text>
                        <Link href="/(auth)/signup" asChild>
                            <Text variant="bodyMedium" style={styles.link}>Sign Up</Text>
                        </Link>
                    </View>

                    {/* Social Proof */}
                    <View style={styles.socialProof}>
                        <Ionicons name="star" size={14} color={pastel.peach} />
                        <Ionicons name="star" size={14} color={pastel.peach} />
                        <Ionicons name="star" size={14} color={pastel.peach} />
                        <Ionicons name="star" size={14} color={pastel.peach} />
                        <Ionicons name="star" size={14} color={pastel.peach} />
                        <Text variant="labelSmall" style={styles.proofText}>
                            Loved by 10,000+ students
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: background.primary },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, paddingVertical: 40 },

    // Header
    header: { alignItems: "center", marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
    logoContainer: { marginBottom: spacing.md },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: pastel.mint,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: { color: text.primary, fontWeight: "700", letterSpacing: -0.5 },
    tagline: { color: text.secondary, textAlign: "center", marginTop: spacing.xs },

    // Features
    featureSection: { marginBottom: spacing.xl },
    featureScroll: { paddingRight: spacing.lg },
    featureCard: {
        width: width * 0.7,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginRight: spacing.sm,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    featureTitle: { color: text.primary, fontWeight: "600", marginBottom: 4 },
    featureDesc: { color: "rgba(93, 107, 107, 0.75)", lineHeight: 18 },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: spacing.md,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(93, 107, 107, 0.2)",
    },
    dotActive: {
        width: 20,
        backgroundColor: pastel.mint,
    },

    // Form
    formCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.lg },
    formTitle: { color: text.primary, fontWeight: "600", marginBottom: spacing.md, textAlign: "center" },
    input: { backgroundColor: background.primary, marginBottom: spacing.sm },
    button: { marginTop: spacing.sm },

    // Footer
    footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
    footerText: { color: text.secondary },
    link: { color: pastel.mint, fontWeight: "600" },

    // Social Proof
    socialProof: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: spacing.xl,
        gap: 2,
    },
    proofText: { color: text.secondary, marginLeft: spacing.xs },

    // Divider
    dividerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: pastel.beige },
    dividerText: { marginHorizontal: 16, color: text.muted, fontSize: 12, fontWeight: "600" },
});
