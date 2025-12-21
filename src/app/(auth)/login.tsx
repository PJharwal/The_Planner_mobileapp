import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";
import { TextInput, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

// Design tokens
import { pastel, background, text, spacing, borderRadius } from "../../constants/theme";
// UI Components
import { Card, Button } from "../../components/ui";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuthStore();
    const theme = useTheme();

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
                        <View style={styles.iconContainer}>
                            <Ionicons name="school" size={48} color={pastel.mint} />
                        </View>
                        <Text variant="headlineLarge" style={styles.title}>Welcome Back</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Sign in to continue your learning journey
                        </Text>
                    </View>

                    {/* Form Card */}
                    <Card style={styles.formCard}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            style={styles.input}
                            outlineColor={pastel.beige}
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
                            outlineColor={pastel.beige}
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
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: background.primary },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg, paddingVertical: 40 },
    header: { alignItems: "center", marginBottom: spacing.xl },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.lg,
        backgroundColor: `${pastel.mint}25`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md
    },
    title: { color: text.primary, fontWeight: "600" },
    subtitle: { color: text.secondary, textAlign: "center", marginTop: spacing.xs },
    formCard: { marginBottom: spacing.lg },
    input: { backgroundColor: background.primary, marginBottom: spacing.sm },
    button: { marginTop: spacing.sm },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
    footerText: { color: text.secondary },
    link: { color: pastel.mint, fontWeight: "600" },
});
