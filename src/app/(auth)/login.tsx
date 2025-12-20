import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";
import { TextInput, Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

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
            style={[styles.container, { backgroundColor: theme.colors.background }]}
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
                            <Ionicons name="school" size={48} color={theme.colors.primary} />
                        </View>
                        <Text variant="headlineLarge" style={styles.title}>Welcome Back</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Sign in to continue your learning journey
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                            left={<TextInput.Icon icon={() => <Ionicons name="mail-outline" size={20} color="#9CA3AF" />} />}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            left={<TextInput.Icon icon={() => <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />} />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                        />

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>

                        <View style={styles.footer}>
                            <Text variant="bodyMedium" style={styles.footerText}>
                                Don't have an account?{" "}
                            </Text>
                            <Link href="/(auth)/signup" asChild>
                                <Text variant="bodyMedium" style={styles.link}>Sign Up</Text>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
    header: { alignItems: "center", marginBottom: 40 },
    iconContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#38BDF820", alignItems: "center", justifyContent: "center", marginBottom: 20 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    subtitle: { color: "#9CA3AF", textAlign: "center", marginTop: 8 },
    form: { gap: 16 },
    input: { backgroundColor: "#1E293B" },
    inputOutline: { borderRadius: 12 },
    button: { marginTop: 8, borderRadius: 12 },
    buttonContent: { paddingVertical: 8 },
    buttonLabel: { fontSize: 16, fontWeight: "bold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    footerText: { color: "#9CA3AF" },
    link: { color: "#38BDF8", fontWeight: "600" },
});
