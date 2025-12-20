import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

export default function SignupScreen() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading } = useAuthStore();
    const theme = useTheme();

    const handleSignup = async () => {
        if (!fullName.trim()) {
            Alert.alert("Error", "Please enter your full name");
            return;
        }
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email");
            return;
        }
        if (!password) {
            Alert.alert("Error", "Please enter a password");
            return;
        }
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        try {
            await register(email.trim(), password, fullName.trim());
            Alert.alert("Success", "Account created! Please check your email to verify your account.");
        } catch (error: any) {
            Alert.alert("Sign Up Failed", error.message || "Please try again");
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
                            <Ionicons name="person-add" size={48} color={theme.colors.primary} />
                        </View>
                        <Text variant="headlineLarge" style={styles.title}>Create Account</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Start your learning journey today
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <TextInput
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            mode="outlined"
                            autoCapitalize="words"
                            autoComplete="name"
                            style={styles.input}
                            outlineStyle={styles.inputOutline}
                            left={<TextInput.Icon icon={() => <Ionicons name="person-outline" size={20} color="#9CA3AF" />} />}
                        />

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

                        <Text variant="bodySmall" style={styles.hint}>
                            Password must be at least 6 characters
                        </Text>

                        <Button
                            mode="contained"
                            onPress={handleSignup}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                        >
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>

                        <View style={styles.footer}>
                            <Text variant="bodyMedium" style={styles.footerText}>
                                Already have an account?{" "}
                            </Text>
                            <Link href="/(auth)/login" asChild>
                                <Text variant="bodyMedium" style={styles.link}>Sign In</Text>
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
    header: { alignItems: "center", marginBottom: 32 },
    iconContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#38BDF820", alignItems: "center", justifyContent: "center", marginBottom: 20 },
    title: { color: "#E5E7EB", fontWeight: "bold" },
    subtitle: { color: "#9CA3AF", textAlign: "center", marginTop: 8 },
    form: { gap: 16 },
    input: { backgroundColor: "#1E293B" },
    inputOutline: { borderRadius: 12 },
    hint: { color: "#64748B", marginTop: -8 },
    button: { marginTop: 8, borderRadius: 12 },
    buttonContent: { paddingVertical: 8 },
    buttonLabel: { fontSize: 16, fontWeight: "bold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
    footerText: { color: "#9CA3AF" },
    link: { color: "#38BDF8", fontWeight: "600" },
});
