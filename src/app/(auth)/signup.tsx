import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";
import { TextInput, Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";

// Design tokens
import { pastel, background, text, spacing, borderRadius } from "../../constants/theme";
// UI Components
import { Card, Button } from "../../components/ui";

export default function SignupScreen() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading } = useAuthStore();

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
                            <Ionicons name="person-add" size={48} color={pastel.mint} />
                        </View>
                        <Text variant="headlineLarge" style={styles.title}>Create Account</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Start your learning journey today
                        </Text>
                    </View>

                    {/* Form Card */}
                    <Card style={styles.formCard}>
                        <TextInput
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            mode="outlined"
                            autoCapitalize="words"
                            autoComplete="name"
                            style={styles.input}
                            outlineColor={pastel.beige}
                            activeOutlineColor={pastel.mint}
                            textColor={text.primary}
                            left={<TextInput.Icon icon={() => <Ionicons name="person-outline" size={20} color={text.muted} />} />}
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

                        <Text variant="bodySmall" style={styles.hint}>
                            Password must be at least 6 characters
                        </Text>

                        <Button
                            variant="primary"
                            onPress={handleSignup}
                            loading={isLoading}
                            fullWidth
                            style={styles.button}
                        >
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </Card>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium" style={styles.footerText}>
                            Already have an account?{" "}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <Text variant="bodyMedium" style={styles.link}>Sign In</Text>
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
    hint: { color: text.muted, marginTop: -spacing.xs, marginBottom: spacing.sm },
    button: { marginTop: spacing.xs },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
    footerText: { color: text.secondary },
    link: { color: pastel.mint, fontWeight: "600" },
});
